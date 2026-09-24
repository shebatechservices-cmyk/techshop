const pool = require('../config/db');
const { ensureWalletSchema, writeWalletLedger, logAccountTxn } = require('./walletController');

const money = (value) => Number.parseFloat(value || 0) || 0;

const formatProductFullName = (p) => {
    if (!p) return 'Product';
    const brand = (p.brand_name || p.brand || '').trim();
    const name = (p.product_name || p.name || '').trim();
    const model = (p.model_name || p.model || '').trim();
    const series = (p.series_name || p.series || '').trim();
    const parts = [];
    if (brand) parts.push(brand);
    if (name) {
        if (brand && name.toLowerCase().startsWith(brand.toLowerCase())) {
            const rest = name.slice(brand.length).trim();
            if (rest) parts.push(rest);
        } else {
            parts.push(name);
        }
    }
    if (model && !parts.join(' ').toLowerCase().includes(model.toLowerCase())) {
        parts.push(model);
    }
    if (series && !parts.join(' ').toLowerCase().includes(series.toLowerCase())) {
        parts.push(series);
    }
    return parts.filter(Boolean).join(' ') || name || 'Product';
};

const makePoNumber = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = '';
    for (let index = 0; index < 8; index += 1) {
        token += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return `PO-${token}`;
};

let purchaseMigrated = false;
const ensurePurchaseColumns = async () => {
    if (purchaseMigrated) return;
    try {
        await pool.query(`
            ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(14,2) DEFAULT 0;
            ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS extra_cost_category VARCHAR(100);
            ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS extra_cost_notes TEXT;
            ALTER TABLE purchase_order_payments ADD COLUMN IF NOT EXISTS receiver_name VARCHAR(150);
            ALTER TABLE purchase_order_payments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);
            ALTER TABLE purchase_order_payments ADD COLUMN IF NOT EXISTS sub_option VARCHAR(150);
            ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
            ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS supplier_warranty_months INTEGER;
            ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS customer_warranty_months INTEGER;
            ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS supplier_warranty_expire_date DATE;
            CREATE TABLE IF NOT EXISTS purchase_order_serials (
                id SERIAL PRIMARY KEY,
                purchase_order_item_id INTEGER REFERENCES purchase_order_items(id) ON DELETE CASCADE,
                serial_code VARCHAR(120) NOT NULL
            );
            CREATE UNIQUE INDEX IF NOT EXISTS idx_purchase_order_serials_code_unique ON purchase_order_serials (TRIM(LOWER(serial_code)));
        `);
        purchaseMigrated = true;
    } catch (e) {
        console.warn('Purchase table column migration notice:', e.message);
    }
};

const checkSerial = async (req, res) => {
    try {
        await ensurePurchaseColumns();
        const serial = String(req.query.serial || '').trim();
        const excludePoId = req.query.exclude_po_id ? parseInt(req.query.exclude_po_id, 10) : null;
        if (!serial) {
            return res.status(400).json({ exists: false, error: 'Serial parameter is required' });
        }

        let query = `
            SELECT 
                pos.serial_code,
                poi.purchase_order_id,
                po.po_number,
                po.created_at,
                p.name AS product_name,
                s.name AS supplier_name
            FROM purchase_order_serials pos
            JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
            JOIN purchase_orders po ON po.id = poi.purchase_order_id
            JOIN products p ON p.id = poi.product_id
            LEFT JOIN suppliers s ON s.id = po.supplier_id
            WHERE LOWER(TRIM(pos.serial_code)) = LOWER(TRIM($1))
              AND po.deleted_at IS NULL
        `;
        const params = [serial];
        if (excludePoId && !isNaN(excludePoId)) {
            query += ` AND po.id != $2`;
            params.push(excludePoId);
        }
        query += ` LIMIT 1`;

        const result = await pool.query(query, params);
        if (result.rows.length > 0) {
            const row = result.rows[0];
            return res.status(200).json({
                exists: true,
                message: `Serial/Barcode "${serial}" already exists in Inventory (PO: ${row.po_number || 'N/A'}, Product: ${row.product_name || 'N/A'})`,
                details: row,
            });
        }

        return res.status(200).json({
            exists: false,
            message: 'Serial/Barcode is available',
        });
    } catch (error) {
        console.error('checkSerial error:', error);
        return res.status(500).json({ exists: false, error: error.message });
    }
};

// =========================================================
// Payment & cash-drawer sync helpers (shared by create/edit/delete)
// =========================================================

// Resolve target payment account (checks ID, name/sub_option, or defaults to active Cash Drawer)
const resolvePaymentAccount = async (client, payment) => {
    let targetAccount = null;
    const accountId = payment.account_id ? parseInt(payment.account_id, 10) : null;
    const subOption = String(payment.sub_option || payment.account_name || '').trim();

    if (accountId && !isNaN(accountId)) {
        const accRes = await client.query('SELECT * FROM payment_accounts WHERE id = $1', [accountId]);
        if (accRes.rows.length) targetAccount = accRes.rows[0];
    }
    if (!targetAccount && subOption) {
        const accRes = await client.query(
            'SELECT * FROM payment_accounts WHERE LOWER(name) = LOWER($1) OR LOWER(account_number) = LOWER($1) LIMIT 1',
            [subOption]
        );
        if (accRes.rows.length) targetAccount = accRes.rows[0];
    }
    if (!targetAccount) {
        // Fallback: primary Cash Drawer
        const drawerRes = await client.query(
            "SELECT * FROM payment_accounts WHERE account_type = 'drawer' OR LOWER(name) LIKE '%drawer%' OR id = 1 ORDER BY (account_type = 'drawer') DESC, id ASC LIMIT 1"
        );
        if (drawerRes.rows.length) targetAccount = drawerRes.rows[0];
    }
    return targetAccount;
};

// Apply a payment inside the caller's transaction: record the payment row,
// deduct the paid amount from the cash drawer (wallet payment) or the
// selected account, and write the double-entry audit trail.
const applyPurchasePayment = async (client, opts) => {
    const { orderId, payment, poNumber, supplierId, supplierName } = opts;
    const amount = money(payment.amount);
    if (amount <= 0) return 0;

    const paymentMethod = payment.payment_method || payment.method || payment.payment_mode || 'Cash';
    const targetAccount = await resolvePaymentAccount(client, payment);
    const resolvedAccountId = targetAccount ? targetAccount.id : (payment.account_id || null);
    const subOption = payment.sub_option || (targetAccount ? targetAccount.name : null);

    let paymentMethodId = payment.payment_method_id ? parseInt(payment.payment_method_id, 10) : null;
    if (!paymentMethodId && paymentMethod) {
        try {
            const pmRes = await client.query(
                "SELECT id FROM payment_methods WHERE LOWER(name) = LOWER($1) OR LOWER(method_name) = LOWER($1) LIMIT 1",
                [paymentMethod]
            );
            if (pmRes.rows.length > 0) {
                paymentMethodId = pmRes.rows[0].id;
            }
        } catch (_) {}
    }

    await client.query(
        `INSERT INTO purchase_order_payments (
            purchase_order_id, payment_method, payment_method_id, account_id, amount, receiver_name, transaction_id, sub_option
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
            orderId,
            paymentMethod,
            paymentMethodId,
            resolvedAccountId,
            amount,
            payment.receiver_name || null,
            payment.transaction_id || payment.reference_no || null,
            subOption,
        ]
    );

    if (paymentMethodId) {
        await client.query(
            'UPDATE purchase_orders SET payment_method_id = $1 WHERE id = $2 AND (payment_method_id IS NULL OR payment_method_id = 0)',
            [paymentMethodId, orderId]
        ).catch(() => null);
    }

    // Mirror to payments table for unified reporting
    try {
        await client.query(
            `INSERT INTO payments (purchase_id, payment_mode, account_name, reference_no, amount, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
                orderId,
                paymentMethod,
                targetAccount ? targetAccount.name : (subOption || 'Cash Drawer'),
                payment.transaction_id || payment.reference_no || null,
                amount,
            ]
        );
    } catch (_) {}

    if (paymentMethod.toLowerCase() === 'wallet') {
        await ensureWalletSchema();
        const wbRes = await client.query('SELECT wallet_balance FROM suppliers WHERE id = $1', [supplierId]);
        const walletBal = money(wbRes.rows[0]?.wallet_balance || 0);
        if (walletBal < amount) {
            throw new Error(`Supplier wallet has insufficient balance (৳ ${walletBal}) for a ৳ ${amount} wallet payment. Use a cash tender for the remaining amount.`);
        }
        // Drawer-reservation model: wallet money IS the cash drawer money, so paying the
        // supplier removes real cash from the drawer too.
        const drawerAcc = targetAccount || (await client.query(
            "SELECT id, name FROM payment_accounts WHERE account_type = 'drawer' OR id = 1 ORDER BY (account_type = 'drawer') DESC LIMIT 1"
        )).rows[0];

        if (!drawerAcc) throw new Error('No cash drawer account found to settle the supplier wallet payment.');

        await client.query(
            'UPDATE payment_accounts SET balance = COALESCE(balance, 0) - $1 WHERE id = $2',
            [amount, drawerAcc.id]
        );
        await client.query(
            'UPDATE accounts SET current_balance = COALESCE(current_balance, 0) - $1 WHERE LOWER(account_name) = LOWER($2)',
            [amount, drawerAcc.name]
        ).catch(() => null);

        await logAccountTxn(client, drawerAcc.id, 'purchase_payment', amount, poNumber,
            `Goods purchase paid from supplier wallet (PO #${poNumber}) — cash drawer ${drawerAcc.name}`, {
                sourceType: 'purchase', sourceId: poNumber, transactionType: 'debit', transactionId: payment.transaction_id || payment.reference_no || null
            });
        await client.query(
            'UPDATE suppliers SET wallet_balance = GREATEST(0, COALESCE(wallet_balance, 0) - $1) WHERE id = $2',
            [amount, supplierId]
        );
        await writeWalletLedger(client, {
            party_type: 'supplier', party_id: Number(supplierId),
            party_name: supplierName || null, type: 'purchase_payment', amount, credit: false,
            account_id: drawerAcc.id, account_name: drawerAcc.name,
            account_effect: 'out', cash_drawer_effect: 'out',
            reference: poNumber,
            note: `Supplier settled from wallet (PO #${poNumber}) — cash drawer paid out`,
            balance_before: walletBal, balance_after: walletBal - amount,
        });
    } else if (targetAccount) {
        await client.query(
            'UPDATE payment_accounts SET balance = COALESCE(balance, 0) - $1 WHERE id = $2',
            [amount, targetAccount.id]
        );
        await client.query(
            'UPDATE accounts SET current_balance = COALESCE(current_balance, 0) - $1 WHERE LOWER(account_name) = LOWER($2)',
            [amount, targetAccount.name]
        ).catch(() => null);

        await logAccountTxn(client, targetAccount.id, 'purchase_payment', amount, poNumber,
            `Goods purchase paid to ${supplierName || 'Supplier'} (PO #${poNumber}) via ${targetAccount.name}`, {
                sourceType: 'purchase', sourceId: poNumber, transactionType: 'debit', transactionId: payment.transaction_id || payment.reference_no || null
            });
    }
    return amount;
};

// Reverse a previously-applied payment inside the caller's transaction (audit
// rollback on edit/delete): credit the full deducted amount back to the cash
// drawer (wallet payment) or the original account, restore supplier wallet for
// wallet payments, and write the reverse double-entry trail.
const reversePurchasePayment = async (client, opts) => {
    const { payment, poNumber, supplierId, ledgerType = 'purchase_payment_reversal', reasonNote } = opts;
    const amt = money(payment.amount);
    if (amt <= 0) return;

    const paymentMethod = (payment.payment_method || payment.method || '').toLowerCase();
    if (paymentMethod === 'wallet') {
        await ensureWalletSchema();
        if (supplierId) {
            const supWalletRes = await client.query('SELECT wallet_balance FROM suppliers WHERE id = $1', [supplierId]);
            const supWallet = money(supWalletRes.rows[0]?.wallet_balance || 0);
            await client.query(
                'UPDATE suppliers SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2',
                [amt, supplierId]
            );
            // Reverse the real cash back into the drawer that left when the wallet payment was made.
            const drawerRes = await client.query(
                "SELECT id, name FROM payment_accounts WHERE account_type = 'drawer' OR id = 1 ORDER BY (account_type = 'drawer') DESC LIMIT 1"
            );
            const drawerAcc = drawerRes.rows[0];
            if (drawerAcc) {
                await client.query(
                    'UPDATE payment_accounts SET balance = COALESCE(balance, 0) + $1 WHERE id = $2',
                    [amt, drawerAcc.id]
                );
                await client.query(
                    'UPDATE accounts SET current_balance = COALESCE(current_balance, 0) + $1 WHERE LOWER(account_name) = LOWER($2)',
                    [amt, drawerAcc.name]
                ).catch(() => null);

                await logAccountTxn(client, drawerAcc.id, 'deposit', amt, poNumber,
                    `${reasonNote} — wallet payment refunded to cash drawer ${drawerAcc.name}`, {
                        sourceType: 'purchase_refund', sourceId: poNumber, transactionType: 'credit'
                    });
            }
            await writeWalletLedger(client, {
                party_type: 'supplier', party_id: Number(supplierId), party_name: null,
                type: ledgerType, amount: amt, credit: true,
                account_id: drawerAcc?.id || null, account_name: drawerAcc?.name || null,
                account_effect: 'in', cash_drawer_effect: 'in',
                reference: poNumber,
                note: `Supplier wallet refunded (${reasonNote}) — drawer credited back`,
                balance_before: supWallet, balance_after: supWallet + amt,
            });
        }
    } else {
        const targetAccount = await resolvePaymentAccount(client, payment);
        if (targetAccount) {
            const acctName = targetAccount.name || 'Account';
            await client.query(
                'UPDATE payment_accounts SET balance = COALESCE(balance, 0) + $1 WHERE id = $2',
                [amt, targetAccount.id]
            );
            await client.query(
                'UPDATE accounts SET current_balance = COALESCE(current_balance, 0) + $1 WHERE LOWER(account_name) = LOWER($2)',
                [amt, targetAccount.name]
            ).catch(() => null);

            await logAccountTxn(client, targetAccount.id, 'deposit', amt, poNumber,
                `${reasonNote} — payment refunded to ${acctName}`, {
                    sourceType: 'purchase_refund', sourceId: poNumber, transactionType: 'credit'
                });
        }
    }
};

const getSuppliers = async (_req, res) => {
    try {
        await ensurePurchaseColumns();
        const result = await pool.query(`
            SELECT s.*,
                   COALESCE(s.wallet_balance, 0) AS wallet_balance,
                   COALESCE(s.payable_balance, 0) AS payable_balance
            FROM suppliers s
            WHERE s.deleted_at IS NULL
            ORDER BY s.name ASC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('getSuppliers error:', error);
        res.status(500).json({ error: 'Failed to load suppliers' });
    }
};

const createSupplier = async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        const contact_code = String(req.body.contact_code || '').trim() || null;
        const phone = String(req.body.phone || '').trim() || null;
        const email = String(req.body.email || '').trim() || null;
        const address = String(req.body.address || '').trim() || null;
        const contact_person = String(req.body.contact_person || '').trim() || null;
        const payable_balance = money(req.body.payable_balance || 0);
        const opening_wallet_balance = money(req.body.opening_wallet_balance || 0);

        if (!name) return res.status(400).json({ error: 'Supplier name is required' });
        if (opening_wallet_balance < 0) return res.status(400).json({ error: 'Opening wallet balance cannot be negative' });

        await ensureWalletSchema();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await client.query(
                `INSERT INTO suppliers (name, contact_code, phone, email, address, contact_person, payable_balance, wallet_balance)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [name, contact_code, phone, email, address, contact_person, payable_balance, opening_wallet_balance]
            );
            const supplier = result.rows[0];
            if (opening_wallet_balance > 0) {
                await writeWalletLedger(client, {
                    party_type: 'supplier',
                    party_id: supplier.id,
                    party_name: supplier.name,
                    type: 'opening_balance',
                    amount: opening_wallet_balance,
                    credit: true,
                    account_effect: 'none',
                    cash_drawer_effect: 'none',
                    reference: 'opening_balance',
                    note: 'Opening wallet balance at supplier registration',
                    balance_before: 0,
                    balance_after: opening_wallet_balance,
                });
            }
            await client.query('COMMIT');
            res.status(201).json({ message: 'Supplier created successfully', data: supplier });
        } catch (e2) {
            await client.query('ROLLBACK');
            throw e2;
        } finally {
            client.release();
        }
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'A supplier with this name or phone number already exists' });
        }
        console.error('createSupplier error:', error);
        res.status(500).json({ error: 'Failed to save supplier' });
    }
};

const deleteSupplier = async (req, res) => {
    try {
        const supplierId = Number(req.params.id);
        const sRes = await pool.query('SELECT * FROM suppliers WHERE id = $1', [supplierId]);
        if (!sRes.rows.length) return res.status(404).json({ error: 'Supplier not found' });
        const sup = sRes.rows[0];

        // 1. Lock Chain: Purchase Orders
        const poCheck = await pool.query('SELECT COUNT(*) FROM purchase_orders WHERE supplier_id = $1 AND deleted_at IS NULL', [supplierId]);
        const poCount = parseInt(poCheck.rows[0].count, 10) || 0;
        if (poCount > 0 && req.query.force !== 'true') {
            return res.status(400).json({
                error: `Cannot delete supplier: ${poCount} purchase orders exist under this supplier. Records must be preserved.`
            });
        }

        // 2. Lock Chain: Purchase Quotations
        const quoteCheck = await pool.query('SELECT COUNT(*) FROM purchase_quotations WHERE supplier_id = $1 AND deleted_at IS NULL', [supplierId]);
        const quoteCount = parseInt(quoteCheck.rows[0].count, 10) || 0;
        if (quoteCount > 0 && req.query.force !== 'true') {
            return res.status(400).json({
                error: `Cannot delete supplier: ${quoteCount} purchase quotations exist.`
            });
        }

        await pool.query('UPDATE suppliers SET deleted_at = NOW() WHERE id = $1', [supplierId]);
        await pool.query(`
            INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
            VALUES ('suppliers', $1, $2, $3, NOW())
        `, [supplierId, sup.name || `Supplier #${supplierId}`, JSON.stringify(sup)]).catch(() => null);

        res.status(200).json({ success: true, message: `Supplier "${sup.name}" moved to Trash successfully!` });
    } catch (error) {
        console.error('deleteSupplier error:', error);
        res.status(500).json({ error: 'Failed to delete supplier' });
    }
};

const getSupplierSummary = async (req, res) => {
    try {
        await ensurePurchaseColumns();
        const supplierId = Number(req.params.id);
        const supplier = await pool.query(`
            SELECT s.*,
                   COALESCE(s.wallet_balance, 0) AS wallet_balance,
                   COALESCE(s.payable_balance, 0) AS payable_balance
            FROM suppliers s
            WHERE s.id = $1
        `, [supplierId]);
        if (!supplier.rows.length) return res.status(404).json({ error: 'Supplier not found' });

        const recentPurchases = await pool.query(
            `SELECT id, po_number, total_cost, total_paid, total_due, extra_cost, extra_cost_category, created_at, item_count, unit_count
             FROM purchase_orders
             WHERE supplier_id = $1 AND deleted_at IS NULL
             ORDER BY created_at DESC
             LIMIT 10`,
            [supplierId]
        );
        const recentPayments = await pool.query(
            `SELECT p.id, p.amount, p.payment_method, p.receiver_name, p.transaction_id, p.sub_option, p.created_at, po.po_number
             FROM purchase_order_payments p
             JOIN purchase_orders po ON po.id = p.purchase_order_id
             WHERE po.supplier_id = $1
             ORDER BY p.created_at DESC
             LIMIT 10`,
            [supplierId]
        );

        let latestWalletTrxId = '';
        try {
            const trxCheck = await pool.query(
                `SELECT reference, id, created_at
                 FROM account_transactions
                 WHERE reference ILIKE $1 OR note ILIKE $2
                 ORDER BY id DESC LIMIT 1`,
                [`%${supplier.rows[0].name}%`, `%#${supplierId}%`]
            );
            if (trxCheck.rows.length && trxCheck.rows[0].id) {
                latestWalletTrxId = `DEP-${trxCheck.rows[0].id}-${supplierId}`;
            }
            if (!latestWalletTrxId) {
                const pmtCheck = await pool.query(
                    `SELECT pop.transaction_id
                     FROM purchase_order_payments pop
                     JOIN purchase_orders po ON po.id = pop.purchase_order_id
                     WHERE po.supplier_id = $1 AND pop.payment_method = 'Wallet' AND pop.transaction_id IS NOT NULL AND pop.transaction_id != ''
                     ORDER BY pop.id DESC LIMIT 1`,
                    [supplierId]
                );
                if (pmtCheck.rows.length && pmtCheck.rows[0].transaction_id) {
                    latestWalletTrxId = pmtCheck.rows[0].transaction_id;
                }
            }
        } catch (_) {}

        if (!latestWalletTrxId) {
            const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            latestWalletTrxId = `DEP-WAL-${supplier.rows[0].contact_code || supplierId}-${dateCode}`;
        }

        res.status(200).json({
            supplier: supplier.rows[0],
            recent_purchases: recentPurchases.rows,
            recent_payments: recentPayments.rows,
            latest_wallet_trx_id: latestWalletTrxId,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to load supplier summary' });
    }
};

const getAccounts = async (_req, res) => {
    try {
        const result = await pool.query('SELECT * FROM payment_accounts ORDER BY id ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to load payment accounts' });
    }
};

const createOrder = async (req, res) => {
    await ensurePurchaseColumns();
    const {
        supplier_id,
        transaction_reference,
        extra_cost,
        extra_cost_category,
        extra_cost_notes,
        items = [],
        payments = [],
    } = req.body;

    if (!supplier_id) return res.status(400).json({ error: 'Please select a supplier' });
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Please add at least one product' });
    }

    // 1. Prevent duplicate items in a single purchase order
    const seenProductIds = new Set();
    for (const item of items) {
        const pid = parseInt(item.product_id, 10);
        if (!pid) {
            return res.status(400).json({ error: 'Please select a valid product for each line item' });
        }
        if (seenProductIds.has(pid)) {
            return res.status(400).json({ error: 'The same item cannot be added twice in a single purchase order.' });
        }
        seenProductIds.add(pid);
    }

    // 2. Prevent duplicate payment methods in a single purchase order
    const seenPaymentMethods = new Set();
    for (const pay of payments) {
        const method = (pay.payment_method || 'Cash').trim();
        if (money(pay.amount) > 0) {
            if (seenPaymentMethods.has(method)) {
                return res.status(400).json({ error: `The same payment method "${method}" cannot be used twice in a single purchase.` });
            }
            seenPaymentMethods.add(method);
        }
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const supplier = await client.query('SELECT id, name FROM suppliers WHERE id = $1', [supplier_id]);
        if (!supplier.rows.length) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Supplier not found' });
        }

        const extraCost = money(extra_cost);
        let totalCost = extraCost;
        let totalSale = 0;
        let unitCount = 0;

        const normalizedItems = items.map((item, index) => {
            const quantity = Number(item.quantity || 0);
            const costPrice = money(item.cost_price);
            const salePrice = money(item.sale_price);
            const finalSale = money(item.final_sale_price);
            if (!item.product_id) {
                throw Object.assign(new Error('Please select a product'), { status: 400 });
            }
            if (costPrice <= 0) {
                throw Object.assign(new Error('Please enter a valid cost price greater than 0 for each item'), { status: 400 });
            }
            if (!item.expected_date) {
                throw Object.assign(new Error('Please provide expected date for each item'), { status: 400 });
            }
            totalCost += costPrice * quantity;
            totalSale += finalSale * quantity;
            unitCount += quantity;

            const rawWarranty = item.warranty_months;
            let cleanWarranty = 0;
            if (typeof rawWarranty === 'number' && !isNaN(rawWarranty)) {
                cleanWarranty = Math.round(rawWarranty);
            } else if (rawWarranty) {
                const parsed = parseInt(String(rawWarranty).replace(/[^0-9]/g, ''), 10);
                cleanWarranty = isNaN(parsed) ? 0 : parsed;
            }

            return {
                product_id: parseInt(item.product_id, 10) || 0,
                quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
                cost_price: costPrice,
                sale_price: salePrice,
                margin_type: item.margin_type || 'percentage',
                margin_value: money(item.margin_value),
                final_sale_price: finalSale,
                line_total: costPrice * quantity,
                expected_date: item.expected_date,
                warranty_months: cleanWarranty,
                sort_order: index + 1,
                serials: Array.isArray(item.serials) ? item.serials.filter(Boolean) : [],
            };
        });

        // 1. Check for duplicates in the current submitted payload
        const allPayloadSerials = [];
        for (const item of normalizedItems) {
            if (Array.isArray(item.serials)) {
                for (const s of item.serials) {
                    const trimmed = String(s || '').trim();
                    if (trimmed) {
                        const lower = trimmed.toLowerCase();
                        if (allPayloadSerials.includes(lower)) {
                            throw Object.assign(
                                new Error(`Duplicate serial/barcode "${trimmed}" found within this purchase order submission`),
                                { status: 400 }
                            );
                        }
                        allPayloadSerials.push(lower);
                    }
                }
            }
        }

        // 2. Check for global duplicates in database
        if (allPayloadSerials.length > 0) {
            const existingSerialsRes = await client.query(
                `SELECT pos.serial_code, po.po_number, p.name AS product_name
                 FROM purchase_order_serials pos
                 JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
                 JOIN purchase_orders po ON po.id = poi.purchase_order_id
                 JOIN products p ON p.id = poi.product_id
                 WHERE LOWER(TRIM(pos.serial_code)) = ANY($1)
                   AND po.deleted_at IS NULL
                 LIMIT 5`,
                [allPayloadSerials]
            );
            if (existingSerialsRes.rows.length > 0) {
                const duplicates = existingSerialsRes.rows.map(r => `"${r.serial_code}" (in PO ${r.po_number || 'N/A'}, Product: ${r.product_name || 'N/A'})`).join(', ');
                throw Object.assign(
                    new Error(`The following serial(s)/barcode(s) already exist in Inventory: ${duplicates}`),
                    { status: 400 }
                );
            }
        }

        // Calculate total paid from payment tenders (split payments)
        const tenders = Array.isArray(payments) ? payments : [];
        let totalPaid = 0;
        for (const tender of tenders) {
            totalPaid += money(tender.amount || 0);
        }

        // If no payment tenders, entire amount is due
        const totalDue = tenders.length === 0 ? totalCost : Math.max(0, totalCost - totalPaid);
        const paymentStatus = totalDue === 0 ? 'PAID' : 'approved';

        const poNumber = makePoNumber();

        const order = await client.query(
            `INSERT INTO purchase_orders (
                po_number, supplier_id, transaction_reference,
                total_cost, total_sale, extra_cost, extra_cost_category, extra_cost_notes, total_paid, total_due,
                item_count, unit_count, status
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
              RETURNING *`,
            [
                poNumber,
                supplier_id,
                transaction_reference || null,
                totalCost,
                totalSale,
                extraCost,
                extra_cost_category || null,
                extra_cost_notes || null,
                totalPaid,
                totalDue,
                normalizedItems.length,
                unitCount,
                paymentStatus,
            ]
        );
        const orderId = order.rows[0].id;

        // Auto-record extra costs as expenses in the expenses table
        if (extraCost > 0) {
            try {
                const catName = extra_cost_category || 'Transportation & Logistics';
                const payeeName = supplier.rows[0].name || 'Supplier';
                const expNote = extra_cost_notes
                    ? `PO ${poNumber} - ${extra_cost_notes}`
                    : `Purchase Order ${poNumber} Extra Cost (${catName})`;
                await client.query(
                    `INSERT INTO expenses (voucher_no, category_name, amount, expense_date, payee_name, reference_no, note)
                     VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6)
                     ON CONFLICT (voucher_no) DO UPDATE 
                     SET category_name = EXCLUDED.category_name, amount = EXCLUDED.amount, note = EXCLUDED.note`,
                    [`EXP-${poNumber}`, catName, extraCost, payeeName, poNumber, expNote]
                );
            } catch (expErr) {
                console.warn('Expense recording for PO extra cost notice:', expErr.message);
            }
        }

        for (const item of normalizedItems) {
            const product = await client.query('SELECT id FROM products WHERE id = $1', [item.product_id]);
            if (!product.rows.length) {
                throw Object.assign(new Error('A product was not found'), { status: 400 });
            }

            // Calculate supplier warranty expiration date: purchase_date + supplier_warranty_months
            let supplierWarrantyExpireDate = null;
            const supplierWarrantyMonths = Math.max(0, parseInt(item.supplier_warranty_months !== undefined && item.supplier_warranty_months !== null ? item.supplier_warranty_months : item.warranty_months, 10) || 0);
            const customerWarrantyMonths = Math.max(0, parseInt(item.customer_warranty_months !== undefined && item.customer_warranty_months !== null ? item.customer_warranty_months : item.warranty_months, 10) || 0);
            const baseDateStr = item.expected_date || purchase_date || new Date().toISOString().split('T')[0];
            if (supplierWarrantyMonths > 0 && baseDateStr) {
                const baseDate = new Date(baseDateStr);
                if (!isNaN(baseDate.getTime())) {
                    const expDate = new Date(baseDate);
                    expDate.setMonth(expDate.getMonth() + supplierWarrantyMonths);
                    supplierWarrantyExpireDate = expDate.toISOString().split('T')[0];
                }
            }

            const savedItem = await client.query(
                `INSERT INTO purchase_order_items (
                    purchase_order_id, product_id, quantity, cost_price, sale_price,
                    margin_type, margin_value, final_sale_price, line_total,
                    expected_date, warranty_months, sort_order, supplier_warranty_expire_date,
                    supplier_warranty_months, customer_warranty_months
                 ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
                  RETURNING id`,
                [
                    orderId,
                    item.product_id,
                    item.quantity,
                    item.cost_price,
                    item.sale_price,
                    item.margin_type,
                    item.margin_value,
                    item.final_sale_price,
                    item.line_total,
                    item.expected_date,
                    customerWarrantyMonths, // Customer Warranty strictly saved to warranty_months for sales invoice
                    item.sort_order,
                    supplierWarrantyExpireDate,
                    supplierWarrantyMonths,
                    customerWarrantyMonths,
                ]
            );

            for (const serial of item.serials) {
                await client.query(
                    'INSERT INTO purchase_order_serials (purchase_order_item_id, serial_code) VALUES ($1, $2)',
                    [savedItem.rows[0].id, String(serial).trim()]
                );
            }

            const itemCostPrice = money(item.cost_price);
            const itemSalePrice = money(item.final_sale_price || item.sale_price);

            await client.query(
                `UPDATE products
                 SET stock = COALESCE(stock, 0) + $1::int,
                     purchase_count = COALESCE(purchase_count, 0) + 1,
                     purchased_at = NOW(),
                     purchase_price = $6::numeric,
                     selling_price = CASE WHEN $7::numeric > 0 THEN $7::numeric ELSE selling_price END,
                     mrp = CASE WHEN $7::numeric > 0 THEN $7::numeric ELSE mrp END,
                     supplier_warranty_expire_date = COALESCE($2::date, supplier_warranty_expire_date),
                     warranty_months = CASE WHEN $3::int > 0 THEN $3::int ELSE warranty_months END,
                     barcode = CASE WHEN COALESCE(NULLIF(barcode, ''), '') = '' THEN $5::text ELSE barcode END,
                     updated_at = NOW()
                 WHERE id = $4::int`,
                [
                    Number(item.quantity) || 1,
                    supplierWarrantyExpireDate || null,
                    customerWarrantyMonths,
                    Number(item.product_id) || 0,
                    item.serials.length > 0 ? String(item.serials[0]).trim() : null,
                    itemCostPrice,
                    itemSalePrice,
                ]
            );

            await client.query(
                `INSERT INTO stock_levels (product_id, warehouse_id, quantity)
                 VALUES ($1, 1, $2)
                 ON CONFLICT (product_id, warehouse_id)
                 DO UPDATE SET quantity = stock_levels.quantity + EXCLUDED.quantity`,
                [Number(item.product_id) || 0, Number(item.quantity) || 1]
            ).catch(() => null);
        }

        // Apply cash-drawer / account payments (records payment rows and deducts balances)
        for (const payment of tenders) {
            await applyPurchasePayment(client, {
                orderId,
                payment,
                poNumber: order.rows[0].po_number,
                supplierId: supplier_id,
                supplierName: supplier.rows[0].name,
            });
        }

        await client.query(
            `UPDATE suppliers
             SET payable_balance = payable_balance + $1, updated_at = NOW()
             WHERE id = $2`,
            [totalDue, supplier_id]
        );

        await client.query('COMMIT');
        res.status(201).json({
            message: 'Purchase order saved successfully',
            data: {
                ...order.rows[0],
                items: normalizedItems,
                payments: tenders,
                supplier: supplier.rows[0],
                payment_status: paymentStatus,
                total_paid: totalPaid,
                due_amount: totalDue,
            },
        });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Serial number is already in use' });
        }
        console.error(error);
        res.status(error.status || 500).json({ error: error.message || 'Failed to save purchase order' });
    } finally {
        client.release();
    }
};

const getOrders = async (_req, res) => {
    try {
        const result = await pool.query(
            `SELECT po.*, s.name AS supplier_name
             FROM purchase_orders po
             JOIN suppliers s ON s.id = po.supplier_id
             WHERE po.deleted_at IS NULL
             ORDER BY po.id DESC`
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to load purchase orders' });
    }
};

const getOrderById = async (req, res) => {
    try {
        await ensurePurchaseColumns();
        const orderId = Number(req.params.id);
        const orderResult = await pool.query(
            `SELECT po.*, s.name AS supplier_name, s.phone AS supplier_phone, s.contact_code AS supplier_contact,
                    s.address AS supplier_address, s.email AS supplier_email,
                    COALESCE(s.payable_balance, 0) AS supplier_payable_balance,
                    COALESCE(s.wallet_balance, 0) AS supplier_wallet_balance
             FROM purchase_orders po
             JOIN suppliers s ON s.id = po.supplier_id
             WHERE po.id = $1`,
            [orderId]
        );
        if (!orderResult.rows.length) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        const order = orderResult.rows[0];

        const itemsResult = await pool.query(
            `SELECT poi.*, p.name AS product_name, b.name AS brand_name, p.sku, p.barcode,
                    c.name AS category_name, m.name AS model_name, s.name AS series_name
             FROM purchase_order_items poi
             JOIN products p ON p.id = poi.product_id
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN brands b ON b.id = p.brand_id
             LEFT JOIN models m ON m.id = p.model_id
             LEFT JOIN series s ON s.id = p.series_id
             WHERE poi.purchase_order_id = $1
             ORDER BY poi.sort_order ASC, poi.id ASC`,
            [orderId]
        );

        const itemIds = itemsResult.rows.map((it) => it.id);
        let serialsByItem = {};
        if (itemIds.length > 0) {
            const serialsResult = await pool.query(
                `SELECT purchase_order_item_id, serial_code
                 FROM purchase_order_serials
                 WHERE purchase_order_item_id = ANY($1::int[])`,
                [itemIds]
            );
            serialsResult.rows.forEach((s) => {
                if (!serialsByItem[s.purchase_order_item_id]) {
                    serialsByItem[s.purchase_order_item_id] = [];
                }
                serialsByItem[s.purchase_order_item_id].push(s.serial_code);
            });
        }

        const items = itemsResult.rows.map((it) => {
            const fullTitle = formatProductFullName(it);
            return {
                ...it,
                name: fullTitle,
                full_name: fullTitle,
                serials: serialsByItem[it.id] || [],
            };
        });

        const paymentsResult = await pool.query(
            `SELECT pop.*, pa.name AS account_name
             FROM purchase_order_payments pop
             LEFT JOIN payment_accounts pa ON pa.id = pop.account_id
             WHERE pop.purchase_order_id = $1
             ORDER BY pop.id ASC`,
            [orderId]
        );

        res.status(200).json({
            ...order,
            items,
            payments: paymentsResult.rows,
        });
    } catch (error) {
        console.error('getOrderById error:', error);
        res.status(500).json({ error: 'Failed to load purchase order' });
    }
};

const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const poRes = await pool.query('SELECT * FROM purchase_orders WHERE id = $1', [id]);
        if (!poRes.rows.length) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        const po = poRes.rows[0];

        // 1. Time Window Rule: Purchase orders can only be deleted within 7 days (168 hours) of creation
        const createdAt = new Date(po.created_at || Date.now());
        const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursOld > 168) {
            return res.status(400).json({
                error: "Delete window (7 days) has expired. Please use the Return/Exchange module instead."
            });
        }

        // 2. Last Action Rule: PO must be the last active transaction for this supplier
        if (po.supplier_id) {
            const laterPO = await pool.query(
                'SELECT po_number FROM purchase_orders WHERE supplier_id = $1 AND id != $2 AND created_at > (SELECT created_at FROM purchase_orders WHERE id = $2) AND deleted_at IS NULL LIMIT 1',
                [po.supplier_id, id]
            ).catch(() => ({ rows: [] }));
            if (laterPO.rows.length > 0) {
                return res.status(400).json({
                    error: `Cannot delete purchase order: Later purchase order (#${laterPO.rows[0].po_number}) has already been recorded for this supplier. Only the most recent transaction can be deleted.`
                });
            }
        }

        // 3. Graceful Delete Validation: Check if any items from this specific purchase batch are linked to existing Sales
        const serialSoldCheck = await pool.query(`
            SELECT DISTINCT s.invoice_no 
            FROM sales_item_serials sis
            JOIN sales_items si ON si.id = sis.sales_item_id
            JOIN sales s ON s.id = si.sale_id
            JOIN purchase_order_serials pos ON LOWER(TRIM(pos.serial_code)) = LOWER(TRIM(sis.serial_code))
            JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
            WHERE poi.purchase_order_id = $1
              AND s.deleted_at IS NULL
        `, [id]).catch(() => ({ rows: [] }));

        const salesCheck = await pool.query(`
            SELECT DISTINCT s.invoice_no 
            FROM sales_items si
            JOIN sales s ON s.id = si.sale_id
            JOIN purchase_order_items poi ON poi.product_id = si.product_id
            WHERE poi.purchase_order_id = $1 
              AND s.created_at > (SELECT created_at FROM purchase_orders WHERE id = $1)
              AND s.deleted_at IS NULL
        `, [id]).catch(() => ({ rows: [] }));

        const allLinkedInvoices = [...new Set([
            ...serialSoldCheck.rows.map(r => r.invoice_no).filter(Boolean),
            ...salesCheck.rows.map(r => r.invoice_no).filter(Boolean)
        ])];

        if (allLinkedInvoices.length > 0) {
            const invoiceList = allLinkedInvoices.map(inv => `[Invoice #${inv}]`).join(', ');
            return res.status(400).json({
                error: `Cannot delete Purchase! Items from this batch are already sold. Please delete or rollback Sale Invoices ${invoiceList} first.`,
                linked_invoices: allLinkedInvoices
            });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Deduct products stock, purchase_count, and stock_levels in main warehouse
            const poItems = await client.query(
                'SELECT product_id, quantity FROM purchase_order_items WHERE purchase_order_id = $1',
                [id]
            );
            for (const item of poItems.rows) {
                const qty = Number(item.quantity || 0);
                const pid = item.product_id;

                await client.query(
                    `UPDATE products
                     SET stock = GREATEST(0, COALESCE(stock, 0) - $1),
                         purchase_count = GREATEST(0, COALESCE(purchase_count, 0) - 1),
                         updated_at = NOW()
                     WHERE id = $2`,
                    [qty, pid]
                );

                await client.query(
                    `UPDATE stock_levels
                     SET quantity = GREATEST(0, COALESCE(quantity, 0) - $1)
                     WHERE product_id = $2 AND warehouse_id = 1`,
                    [qty, pid]
                ).catch(() => null);

                // Update product purchase/selling prices to previous active purchase batch
                await client.query(
                    `UPDATE products p
                     SET purchase_price = COALESCE((
                         SELECT poi.cost_price 
                         FROM purchase_order_items poi 
                         JOIN purchase_orders po ON po.id = poi.purchase_order_id 
                         WHERE poi.product_id = p.id AND po.id != $1 AND po.deleted_at IS NULL 
                         ORDER BY po.created_at DESC 
                         LIMIT 1
                     ), 0),
                     selling_price = COALESCE((
                         SELECT COALESCE(NULLIF(poi.final_sale_price, 0), poi.sale_price)
                         FROM purchase_order_items poi 
                         JOIN purchase_orders po ON po.id = poi.purchase_order_id 
                         WHERE poi.product_id = p.id AND po.id != $1 AND po.deleted_at IS NULL 
                         ORDER BY po.created_at DESC 
                         LIMIT 1
                     ), p.selling_price)
                     WHERE p.id = $2`,
                    [id, pid]
                ).catch(() => null);
            }

            // 2. Delete all serial records tied to this purchase
            await client.query(
                `DELETE FROM purchase_order_serials 
                 WHERE purchase_order_item_id IN (
                     SELECT id FROM purchase_order_items WHERE purchase_order_id = $1
                 )`,
                [id]
            );

            // 3. Delete all purchase order items
            await client.query('DELETE FROM purchase_order_items WHERE purchase_order_id = $1', [id]);

            // 4. Adjust supplier payable balance if total_due > 0 (Supplier Ledger Rollback)
            if (po.supplier_id && Number(po.total_due) > 0) {
                await client.query(
                    `UPDATE suppliers 
                     SET payable_balance = GREATEST(0, COALESCE(payable_balance, 0) - $1), 
                         updated_at = NOW() 
                     WHERE id = $2`,
                    [Number(po.total_due), po.supplier_id]
                );
            }

            // 5. Reverse payments back to their source accounts (full atomic rollback)
            const poPayments = await client.query(
                'SELECT * FROM purchase_order_payments WHERE purchase_order_id = $1',
                [id]
            );
            for (const pay of poPayments.rows) {
                await reversePurchasePayment(client, {
                    payment: pay,
                    poNumber: po.po_number || id,
                    supplierId: po.supplier_id,
                    ledgerType: 'purchase_delete_refund',
                    reasonNote: `PO ${po.po_number || id} deleted`,
                });
            }
            await client.query('DELETE FROM purchase_order_payments WHERE purchase_order_id = $1', [id]);
            await client.query('DELETE FROM payments WHERE purchase_id = $1', [id]).catch(() => null);

            // 6. Soft delete purchase order into Global Trash
            await client.query("UPDATE purchase_orders SET deleted_at = NOW(), status = 'cancelled', updated_at = NOW() WHERE id = $1", [id]);
            await client.query(`
                INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
                VALUES ('purchase_orders', $1, $2, $3, NOW())
            `, [id, `PO #${po.po_number || id}`, JSON.stringify(po)]).catch(() => null);

            await client.query('COMMIT');
        } catch (txErr) {
            await client.query('ROLLBACK').catch(() => null);
            throw txErr;
        } finally {
            client.release();
        }

        res.status(200).json({ success: true, message: `Purchase order #${po.po_number || id} moved to Trash successfully! Stock and inventory reversed.` });
    } catch (error) {
        console.error('Delete purchase order error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete purchase order' });
    }
};

// Edit Purchase Order (Permitted strictly within 7 days of creation)
const updateOrder = async (req, res) => {
    await ensurePurchaseColumns();
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const poRes = await client.query('SELECT * FROM purchase_orders WHERE id = $1', [id]);
        if (!poRes.rows.length) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        const po = poRes.rows[0];

        // 1. Time Window Rule: Editing permitted strictly within 15 days (360 hours)
        const createdAt = new Date(po.created_at || Date.now());
        const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursOld > 360) {
            return res.status(400).json({
                error: `Cannot edit purchase order: PO #${po.po_number || id} was created ${Math.floor(hoursOld / 24)} days ago. Edits are only permitted within 15 days (360 hours) of creation.`
            });
        }

        // 2. Check if products from this PO have subsequent active sales
        const salesCheck = await client.query(`
            SELECT poi.product_id, p.name as product_name, COUNT(si.id) as sold_count
            FROM purchase_order_items poi
            JOIN products p ON p.id = poi.product_id
            JOIN sales_items si ON si.product_id = poi.product_id
            JOIN sales s ON s.id = si.sale_id
            WHERE poi.purchase_order_id = $1 
              AND s.created_at > (SELECT created_at FROM purchase_orders WHERE id = $1)
              AND s.deleted_at IS NULL
            GROUP BY poi.product_id, p.name
        `, [id]).catch(() => ({ rows: [] }));

        const soldProductMap = new Map();
        salesCheck.rows.forEach(r => soldProductMap.set(Number(r.product_id), Number(r.sold_count || 1)));
        const hasSales = soldProductMap.size > 0;

        await client.query('BEGIN');

        const {
            transaction_reference,
            extra_cost,
            extra_cost_category,
            extra_cost_notes,
            items = []
        } = req.body;

        let totalCost = money(extra_cost !== undefined ? extra_cost : po.extra_cost);
        let totalSale = 0;
        let unitCount = 0;

        if (Array.isArray(items) && items.length > 0) {
            // Prevent duplicate products
            const seenPids = new Set();
            const allPayloadSerials = [];

            for (const item of items) {
                const pid = parseInt(item.product_id, 10);
                if (seenPids.has(pid)) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ error: 'The same item cannot be added twice in a purchase order.' });
                }
                seenPids.add(pid);

                if (Array.isArray(item.serials)) {
                    for (const s of item.serials) {
                        const trimmed = String(s || '').trim();
                        if (trimmed) {
                            const lower = trimmed.toLowerCase();
                            if (allPayloadSerials.includes(lower)) {
                                await client.query('ROLLBACK');
                                return res.status(400).json({
                                    error: `Duplicate serial/barcode "${trimmed}" found within this purchase order submission`
                                });
                            }
                            allPayloadSerials.push(lower);
                        }
                    }
                }
            }

            // Check for global database duplicates excluding current PO
            if (allPayloadSerials.length > 0) {
                const existingSerialsRes = await client.query(
                    `SELECT pos.serial_code, po.po_number, p.name AS product_name
                     FROM purchase_order_serials pos
                     JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
                     JOIN purchase_orders po ON po.id = poi.purchase_order_id
                     JOIN products p ON p.id = poi.product_id
                     WHERE LOWER(TRIM(pos.serial_code)) = ANY($1)
                       AND po.id != $2
                       AND po.deleted_at IS NULL
                     LIMIT 5`,
                    [allPayloadSerials, id]
                );
                if (existingSerialsRes.rows.length > 0) {
                    const duplicates = existingSerialsRes.rows.map(r => `"${r.serial_code}" (in PO ${r.po_number || 'N/A'}, Product: ${r.product_name || 'N/A'})`).join(', ');
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        error: `The following serial(s)/barcode(s) already exist in Inventory: ${duplicates}`
                    });
                }
            }

            // Fetch existing items to detect deleted items
            const existingPoiRes = await client.query('SELECT * FROM purchase_order_items WHERE purchase_order_id = $1', [id]);
            const existingPoiMap = new Map(existingPoiRes.rows.map(r => [Number(r.id), r]));
            const newItemIds = new Set(items.map(it => it.id ? Number(it.id) : null).filter(Boolean));

            // 1. Process deleted items from PO
            for (const [oldPoiId, oldPoi] of existingPoiMap.entries()) {
                if (!newItemIds.has(oldPoiId)) {
                    const oldPid = Number(oldPoi.product_id);
                    if (soldProductMap.has(oldPid)) {
                        await client.query('ROLLBACK');
                        return res.status(400).json({
                            error: `Cannot remove product ID ${oldPid} from purchase order because units from this PO have already been sold.`
                        });
                    }
                    // Deduct stock previously added by this item
                    await client.query(
                        `UPDATE products 
                         SET stock = GREATEST(0, COALESCE(stock, 0) - $1), 
                             purchase_count = GREATEST(0, COALESCE(purchase_count, 0) - 1),
                             updated_at = NOW() 
                         WHERE id = $2`,
                        [Number(oldPoi.quantity || 0), oldPid]
                    );
                    await client.query(
                        `UPDATE stock_levels 
                         SET quantity = GREATEST(0, COALESCE(quantity, 0) - $1) 
                         WHERE product_id = $2 AND warehouse_id = 1`,
                        [Number(oldPoi.quantity || 0), oldPid]
                    ).catch(() => null);

                    await client.query('DELETE FROM purchase_order_serials WHERE purchase_order_item_id = $1', [oldPoiId]);
                    await client.query('DELETE FROM purchase_order_items WHERE id = $1', [oldPoiId]);
                }
            }

            // 2. Process added and updated items
            for (const item of items) {
                const pid = parseInt(item.product_id, 10);
                const costPrice = money(item.cost_price);
                const salePrice = money(item.sale_price);
                const finalSale = money(item.final_sale_price || item.sale_price);
                const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

                // If this item was already sold, ensure quantity is not reduced below sold
                if (soldProductMap.has(pid)) {
                    const minAllowed = soldProductMap.get(pid);
                    if (quantity < minAllowed) {
                        await client.query('ROLLBACK');
                        return res.status(400).json({
                            error: `Cannot reduce quantity of product ID ${pid} below ${minAllowed} because it has already been sold. Only price and barcode can be edited.`
                        });
                    }
                }

                totalCost += costPrice * quantity;
                totalSale += finalSale * quantity;
                unitCount += quantity;

                let poiId = item.id ? Number(item.id) : null;

                if (poiId && existingPoiMap.has(poiId)) {
                    // Update existing item & stock diff
                    const oldQty = Number(existingPoiMap.get(poiId).quantity || 0);
                    const diff = quantity - oldQty;
                    if (diff !== 0) {
                        await client.query(
                            `UPDATE products SET stock = GREATEST(0, COALESCE(stock, 0) + $1), updated_at = NOW() WHERE id = $2`,
                            [diff, pid]
                        );
                        await client.query(
                            `UPDATE stock_levels SET quantity = GREATEST(0, COALESCE(quantity, 0) + $1) WHERE product_id = $2 AND warehouse_id = 1`,
                            [diff, pid]
                        ).catch(() => null);
                    }

                    const itemWarranty = parseInt(item.warranty_months || 0, 10) || 0;
                    let supplierWarrantyExpireDate = null;
                    const baseDateStr = item.expected_date || po.created_at || new Date().toISOString().split('T')[0];
                    if (itemWarranty > 0 && baseDateStr) {
                        const baseDate = new Date(baseDateStr);
                        if (!isNaN(baseDate.getTime())) {
                            const expDate = new Date(baseDate);
                            expDate.setMonth(expDate.getMonth() + itemWarranty);
                            supplierWarrantyExpireDate = expDate.toISOString().split('T')[0];
                        }
                    }

                    await client.query(`
                        UPDATE purchase_order_items 
                        SET cost_price = $1, sale_price = $2, margin_type = $3, margin_value = $4,
                            final_sale_price = $5, line_total = $1::numeric * $6::numeric, quantity = $6,
                            warranty_months = $7, supplier_warranty_expire_date = $8, updated_at = NOW()
                        WHERE id = $9
                    `, [costPrice, salePrice, item.margin_type || 'percent', money(item.margin_value), finalSale, quantity, itemWarranty, supplierWarrantyExpireDate, poiId]);

                    // Update serials
                    if (Array.isArray(item.serials)) {
                        await client.query('DELETE FROM purchase_order_serials WHERE purchase_order_item_id = $1', [poiId]);
                        for (const serial of item.serials) {
                            const trimmed = String(serial).trim();
                            if (trimmed) {
                                await client.query(
                                    'INSERT INTO purchase_order_serials (purchase_order_item_id, serial_code) VALUES ($1, $2)',
                                    [poiId, trimmed]
                                );
                            }
                        }
                    }
                } else {
                    // Insert brand new item added on edit
                    const itemWarranty = parseInt(item.warranty_months || 0, 10) || 0;
                    let supplierWarrantyExpireDate = null;
                    const baseDateStr = item.expected_date || po.created_at || new Date().toISOString().split('T')[0];
                    if (itemWarranty > 0 && baseDateStr) {
                        const baseDate = new Date(baseDateStr);
                        if (!isNaN(baseDate.getTime())) {
                            const expDate = new Date(baseDate);
                            expDate.setMonth(expDate.getMonth() + itemWarranty);
                            supplierWarrantyExpireDate = expDate.toISOString().split('T')[0];
                        }
                    }

                    const newPoiRes = await client.query(`
                        INSERT INTO purchase_order_items (
                            purchase_order_id, product_id, cost_price, sale_price, margin_type, margin_value,
                            final_sale_price, line_total, quantity, expected_date, warranty_months, supplier_warranty_expire_date, updated_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
                        RETURNING id
                    `, [
                        id, pid, costPrice, salePrice, item.margin_type || 'percent', money(item.margin_value),
                        finalSale, costPrice * quantity, quantity, item.expected_date || new Date(), itemWarranty, supplierWarrantyExpireDate
                    ]);
                    poiId = newPoiRes.rows[0].id;

                    // Increase stock and purchase_count for the newly added item
                    await client.query(
                        `UPDATE products 
                         SET stock = COALESCE(stock, 0) + $1, 
                             purchase_count = COALESCE(purchase_count, 0) + 1,
                             updated_at = NOW() 
                         WHERE id = $2`,
                        [quantity, pid]
                    );
                    await client.query(
                        `INSERT INTO stock_levels (product_id, warehouse_id, quantity)
                         VALUES ($1, 1, $2)
                         ON CONFLICT (product_id, warehouse_id)
                         DO UPDATE SET quantity = stock_levels.quantity + EXCLUDED.quantity`,
                        [pid, quantity]
                    ).catch(() => null);

                    // Insert serials
                    if (Array.isArray(item.serials)) {
                        for (const serial of item.serials) {
                            const trimmed = String(serial).trim();
                            if (trimmed) {
                                await client.query(
                                    'INSERT INTO purchase_order_serials (purchase_order_item_id, serial_code) VALUES ($1, $2)',
                                    [poiId, trimmed]
                                );
                            }
                        }
                    }
                }

                // Live price update in product catalog
                const itemWarranty = parseInt(item.warranty_months || 0, 10) || 0;
                let supplierWarrantyExpireDate = null;
                const baseDateStr = item.expected_date || po.created_at || new Date().toISOString().split('T')[0];
                if (itemWarranty > 0 && baseDateStr) {
                    const baseDate = new Date(baseDateStr);
                    if (!isNaN(baseDate.getTime())) {
                        const expDate = new Date(baseDate);
                        expDate.setMonth(expDate.getMonth() + itemWarranty);
                        supplierWarrantyExpireDate = expDate.toISOString().split('T')[0];
                    }
                }

                await client.query(`
                    UPDATE products 
                    SET purchase_price = $1,
                        selling_price = CASE WHEN $2 > 0 THEN $2 ELSE selling_price END,
                        mrp = CASE WHEN $2 > 0 THEN $2 ELSE mrp END,
                        warranty_months = CASE WHEN $5::int > 0 THEN $5::int ELSE warranty_months END,
                        supplier_warranty_expire_date = COALESCE($6::date, supplier_warranty_expire_date),
                        barcode = CASE WHEN COALESCE(NULLIF(barcode, ''), '') = '' THEN $4 ELSE barcode END,
                        updated_at = NOW()
                    WHERE id = $3
                `, [costPrice, finalSale || salePrice, pid, Array.isArray(item.serials) && item.serials.length > 0 ? String(item.serials[0]).trim() : null, itemWarranty, supplierWarrantyExpireDate]);
            }
        } else {
            totalCost = Number(po.total_cost || 0);
            totalSale = Number(po.total_sale || 0);
            unitCount = Number(po.unit_count || 0);
        }

        // ---- Payment & cash-drawer sync on edit (audit → reverse → re-apply) ----
        // 1. Check if invoice is marked as 'Full Paid' or payments are explicitly updated
        const isFullPaidRequested = req.body.is_full_paid === true ||
            String(req.body.status || '').toUpperCase() === 'PAID' ||
            String(req.body.payment_status || '').toLowerCase().includes('paid');

        let paymentsToApply = Array.isArray(req.body.payments) ? [...req.body.payments] : null;

        if (isFullPaidRequested) {
            if (!paymentsToApply || paymentsToApply.length === 0) {
                // Generate a full payment tender from Cash Drawer
                paymentsToApply = [{
                    payment_method: 'Cash',
                    amount: totalCost,
                    sub_option: 'Drawer',
                    transaction_id: req.body.transaction_reference || po.transaction_reference || 'FULL-PAID'
                }];
            } else {
                const currentSum = paymentsToApply.reduce((sum, p) => sum + money(p.amount), 0);
                if (currentSum < totalCost) {
                    const diff = totalCost - currentSum;
                    paymentsToApply.push({
                        payment_method: 'Cash',
                        amount: diff,
                        sub_option: 'Drawer',
                        transaction_id: req.body.transaction_reference || po.transaction_reference || 'AUTO-FULL-PAID'
                    });
                }
            }
        }

        let totalPaid;
        if (paymentsToApply !== null) {
            // 1. Reverse all previously-applied payment deductions
            const oldPayments = await client.query(
                'SELECT * FROM purchase_order_payments WHERE purchase_order_id = $1 ORDER BY id ASC',
                [id]
            );
            for (const oldPay of oldPayments.rows) {
                await reversePurchasePayment(client, {
                    payment: oldPay,
                    poNumber: po.po_number || id,
                    supplierId: po.supplier_id,
                    ledgerType: 'purchase_payment_reversal',
                    reasonNote: `PO ${po.po_number || id} payment recalculated on edit`,
                });
            }
            await client.query('DELETE FROM purchase_order_payments WHERE purchase_order_id = $1', [id]);
            await client.query('DELETE FROM payments WHERE purchase_id = $1', [id]).catch(() => null);

            // 2. Re-apply the new payment tenders (deduct cash drawer / account balances)
            let appliedTotal = 0;
            for (const payment of paymentsToApply) {
                appliedTotal += money(await applyPurchasePayment(client, {
                    orderId: id,
                    payment,
                    poNumber: po.po_number || id,
                    supplierId: po.supplier_id,
                    supplierName: po.supplier_name || 'Supplier',
                }));
            }
            totalPaid = money(appliedTotal);
        } else {
            totalPaid = money(po.total_paid);
        }

        const totalDue = isFullPaidRequested ? 0 : Math.max(0, totalCost - totalPaid);
        const poStatus = (totalDue <= 0 || isFullPaidRequested) ? 'PAID' : 'approved';

        await client.query(`
            UPDATE purchase_orders 
            SET transaction_reference = COALESCE($1, transaction_reference),
                extra_cost = COALESCE($2, extra_cost),
                extra_cost_category = COALESCE($3, extra_cost_category),
                extra_cost_notes = COALESCE($4, extra_cost_notes),
                total_cost = $5,
                total_sale = $6,
                total_paid = $7,
                total_due = $8,
                status = $9,
                unit_count = $10,
                updated_at = NOW()
            WHERE id = $11
        `, [
            transaction_reference || null,
            extra_cost !== undefined ? money(extra_cost) : null,
            extra_cost_category || null,
            extra_cost_notes || null,
            totalCost,
            totalSale,
            totalPaid,
            totalDue,
            poStatus,
            unitCount,
            id
        ]);

        // Keep supplier payable in sync with the recomputed due (double-entry)
        const oldDue = money(po.total_due);
        const dueDelta = totalDue - oldDue;
        if (po.supplier_id && dueDelta !== 0) {
            await client.query(
                `UPDATE suppliers
                 SET payable_balance = GREATEST(0, COALESCE(payable_balance, 0) + $1), updated_at = NOW()
                 WHERE id = $2`,
                [dueDelta, po.supplier_id]
            );
        }

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: `Purchase order #${po.po_number || id} updated successfully!`,
            hasSales
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('updateOrder error:', error);
        res.status(500).json({ error: error.message || 'Failed to update purchase order' });
    } finally {
        client.release();
    }
};

const getQuotations = async (_req, res) => {
    try {
        const result = await pool.query(`
            SELECT pq.*, s.name AS supplier_name, s.phone AS supplier_phone 
            FROM purchase_quotations pq 
            LEFT JOIN suppliers s ON s.id = pq.supplier_id 
            WHERE pq.deleted_at IS NULL
            ORDER BY pq.id DESC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('getQuotations error:', error);
        res.status(500).json({ error: 'Failed to load purchase quotations' });
    }
};

const createQuotation = async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            supplier_id,
            reference,
            valid_until,
            notes,
            items = []
        } = req.body;

        if (!supplier_id) {
            return res.status(400).json({ error: 'Supplier is required' });
        }
        if (!items.length) {
            return res.status(400).json({ error: 'Please add at least one item to the quotation' });
        }

        await client.query('BEGIN');

        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let token = '';
        for (let i = 0; i < 6; i++) {
            token += alphabet[Math.floor(Math.random() * alphabet.length)];
        }
        const quotation_no = `PQ-${token}`;

        let total_amount = 0;
        let item_count = 0;

        items.forEach(it => {
            const qty = Number(it.quantity || 1);
            const price = Number(it.unit_price || 0);
            total_amount += qty * price;
            item_count += qty;
        });

        const qRes = await client.query(`
            INSERT INTO purchase_quotations 
            (quotation_no, supplier_id, reference, quotation_date, valid_until, total_amount, item_count, status, notes)
            VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, 'draft', $7)
            RETURNING *
        `, [quotation_no, Number(supplier_id), reference || null, valid_until || null, total_amount, item_count, notes || null]);

        const quotationId = qRes.rows[0].id;

        for (const it of items) {
            const qty = Number(it.quantity || 1);
            const price = Number(it.unit_price || 0);
            const line_total = qty * price;
            await client.query(`
                INSERT INTO purchase_quotation_items 
                (quotation_id, product_id, quantity, unit_price, line_total, notes)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [quotationId, it.product_id || null, qty, price, line_total, it.notes || null]);
        }

        await client.query('COMMIT');
        res.status(201).json({
            message: 'Purchase quotation created successfully',
            data: qRes.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('createQuotation error:', error);
        res.status(500).json({ error: error.message || 'Failed to create quotation' });
    } finally {
        client.release();
    }
};

const updateQuotation = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const {
            supplier_id,
            reference,
            valid_until,
            notes,
            items = []
        } = req.body;

        if (!supplier_id) {
            return res.status(400).json({ error: 'Supplier is required' });
        }
        if (!items.length) {
            return res.status(400).json({ error: 'Please add at least one item to the quotation' });
        }

        const existing = await pool.query('SELECT id FROM purchase_quotations WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (!existing.rows.length) return res.status(404).json({ error: 'Quotation not found' });

        await client.query('BEGIN');

        let total_amount = 0;
        let item_count = 0;
        items.forEach(it => {
            const qty = Number(it.quantity || 1);
            const price = Number(it.unit_price || 0);
            total_amount += qty * price;
            item_count += qty;
        });

        const qRes = await client.query(`
            UPDATE purchase_quotations
            SET supplier_id = $1, reference = $2, valid_until = $3,
                total_amount = $4, item_count = $5, notes = $6, updated_at = NOW()
            WHERE id = $7
            RETURNING *
        `, [Number(supplier_id), reference || null, valid_until || null, total_amount, item_count, notes || null, id]);

        await client.query('DELETE FROM purchase_quotation_items WHERE quotation_id = $1', [id]);
        for (const it of items) {
            const qty = Number(it.quantity || 1);
            const price = Number(it.unit_price || 0);
            const line_total = qty * price;
            await client.query(`
                INSERT INTO purchase_quotation_items
                (quotation_id, product_id, quantity, unit_price, line_total, notes)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [id, it.product_id || null, qty, price, line_total, it.notes || null]);
        }

        await client.query('COMMIT');
        res.status(200).json({
            message: 'Purchase quotation updated successfully',
            data: qRes.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('updateQuotation error:', error);
        res.status(500).json({ error: error.message || 'Failed to update quotation' });
    } finally {
        client.release();
    }
};

const getQuotationById = async (req, res) => {
    try {
        const { id } = req.params;
        const qRes = await pool.query('SELECT * FROM purchase_quotations WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (!qRes.rows.length) return res.status(404).json({ error: 'Quotation not found' });

        const itemRes = await pool.query(
            `SELECT qi.*, p.name AS product_name
             FROM purchase_quotation_items qi
             LEFT JOIN products p ON p.id = qi.product_id
             WHERE qi.quotation_id = $1`,
            [id]
        );
        res.status(200).json({ data: { ...qRes.rows[0], items: itemRes.rows } });
    } catch (error) {
        console.error('getQuotationById error:', error);
        res.status(500).json({ error: 'Failed to load quotation' });
    }
};

const updateQuotationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ['draft', 'pending', 'approved', 'rejected', 'ordered'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const result = await pool.query(
            'UPDATE purchase_quotations SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Quotation not found' });
        res.status(200).json({ message: 'Status updated successfully', data: result.rows[0] });
    } catch (error) {
        console.error('updateQuotationStatus error:', error);
        res.status(500).json({ error: 'Failed to update quotation status' });
    }
};

const deleteQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const qRes = await pool.query('SELECT * FROM purchase_quotations WHERE id = $1', [id]);
        if (!qRes.rows.length) return res.status(404).json({ error: 'Quotation not found' });
        const quote = qRes.rows[0];

        await pool.query('UPDATE purchase_quotations SET deleted_at = NOW() WHERE id = $1', [id]);
        await pool.query(`
            INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
            VALUES ('purchase_quotations', $1, $2, $3, NOW())
        `, [id, `Purchase Quote #${quote.quotation_no || id}`, JSON.stringify(quote)]).catch(() => null);

        res.status(200).json({ success: true, message: `Quotation #${quote.quotation_no || id} moved to Trash successfully!` });
    } catch (error) {
        console.error('deleteQuotation error:', error);
        res.status(500).json({ error: 'Failed to delete quotation' });
    }
};

module.exports = {
    getSuppliers,
    createSupplier,
    deleteSupplier,
    getSupplierSummary,
    getAccounts,
    createOrder,
    getOrders,
    getOrderById,
    updateOrder,
    deleteOrder,
    getQuotations,
    getQuotationById,
    createQuotation,
    updateQuotation,
    updateQuotationStatus,
    deleteQuotation,
    checkSerial,
};
