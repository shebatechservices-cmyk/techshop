const pool = require('../config/db');
const { ensureWalletSchema, writeWalletLedger, logAccountTxn } = require('./walletController');

const money = (value) => Number.parseFloat(value || 0) || 0;

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
        `);
        purchaseMigrated = true;
    } catch (e) {
        console.warn('Purchase table column migration notice:', e.message);
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

        const totalPaid = payments.reduce((sum, item) => sum + money(item.amount), 0);
        const totalDue = Math.max(0, totalCost - totalPaid);
        const poNumber = makePoNumber();

        const order = await client.query(
            `INSERT INTO purchase_orders (
                po_number, supplier_id, transaction_reference,
                total_cost, total_sale, extra_cost, extra_cost_category, extra_cost_notes, total_paid, total_due,
                item_count, unit_count, status
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'approved')
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

            // Calculate supplier warranty expiration date: expected_date + 60 days
            let supplierWarrantyExpireDate = null;
            if (item.expected_date) {
                const expDate = new Date(item.expected_date);
                if (!isNaN(expDate.getTime())) {
                    expDate.setDate(expDate.getDate() + 60);
                    supplierWarrantyExpireDate = expDate.toISOString().split('T')[0];
                }
            }

            const savedItem = await client.query(
                `INSERT INTO purchase_order_items (
                    purchase_order_id, product_id, quantity, cost_price, sale_price,
                    margin_type, margin_value, final_sale_price, line_total,
                    expected_date, warranty_months, sort_order, supplier_warranty_expire_date
                 ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
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
                    item.warranty_months,
                    item.sort_order,
                    supplierWarrantyExpireDate,
                ]
            );

            for (const serial of item.serials) {
                await client.query(
                    'INSERT INTO purchase_order_serials (purchase_order_item_id, serial_code) VALUES ($1, $2)',
                    [savedItem.rows[0].id, String(serial).trim()]
                );
            }

            await client.query(
                `UPDATE products
                 SET stock = COALESCE(stock, 0) + $1,
                     purchase_count = COALESCE(purchase_count, 0) + 1,
                     purchased_at = NOW(),
                     supplier_warranty_expire_date = COALESCE($4, supplier_warranty_expire_date),
                     warranty_months = CASE WHEN $5 > 0 THEN $5 ELSE warranty_months END,
                     barcode = CASE WHEN COALESCE(NULLIF(barcode, ''), '') = '' THEN $7 ELSE barcode END,
                     updated_at = NOW()
                 WHERE id = $6`,
                [
                    item.quantity,
                    item.cost_price,
                    item.final_sale_price,
                    supplierWarrantyExpireDate,
                    item.warranty_months,
                    item.product_id,
                    item.serials.length > 0 ? String(item.serials[0]).trim() : null,
                ]
            );
        }

        for (const payment of payments) {
            const amount = money(payment.amount);
            if (amount <= 0) continue;
            await client.query(
                `INSERT INTO purchase_order_payments (
                    purchase_order_id, payment_method, account_id, amount, receiver_name, transaction_id, sub_option
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    orderId,
                    payment.payment_method || 'Cash',
                    payment.account_id || null,
                    amount,
                    payment.receiver_name || null,
                    payment.transaction_id || null,
                    payment.sub_option || null,
                ]
            );
            if (payment.payment_method === 'Wallet') {
                await ensureWalletSchema();
                const wbRes = await client.query('SELECT wallet_balance FROM suppliers WHERE id = $1', [supplier_id]);
                const walletBal = money(wbRes.rows[0]?.wallet_balance || 0);
                if (walletBal < amount) {
                    throw new Error(`Supplier wallet has insufficient balance (৳ ${walletBal}) for a ${amount} wallet payment. Use a cash tender for the remaining amount.`);
                }
                // Drawer-reservation model: wallet money IS the cash drawer money, so paying the
                // supplier removes real cash from the drawer too.
                const drawerRes = await client.query(
                    "SELECT id, name FROM payment_accounts WHERE account_type = 'drawer' OR id = 1 ORDER BY account_type = 'drawer' DESC LIMIT 1"
                );
                const drawerAcc = drawerRes.rows[0];
                if (!drawerAcc) throw new Error('No cash drawer account found to settle the supplier wallet payment.');
                await client.query(
                    'UPDATE payment_accounts SET balance = COALESCE(balance, 0) - $1 WHERE id = $2',
                    [amount, drawerAcc.id]
                );
                await logAccountTxn(client, drawerAcc.id, 'purchase_payment', amount, order.rows[0].po_number,
                    `Goods purchase paid from supplier wallet (PO ${order.rows[0].po_number}) — cash drawer ${drawerAcc.name}`);
                await client.query(
                    'UPDATE suppliers SET wallet_balance = GREATEST(0, COALESCE(wallet_balance, 0) - $1) WHERE id = $2',
                    [amount, supplier_id]
                );
                await writeWalletLedger(client, {
                    party_type: 'supplier', party_id: Number(supplier_id),
                    party_name: null, type: 'purchase_payment', amount, credit: false,
                    account_id: drawerAcc.id, account_name: drawerAcc.name,
                    account_effect: 'out', cash_drawer_effect: 'out',
                    reference: order.rows[0].po_number,
                    note: `Supplier settled from wallet (PO ${order.rows[0].po_number}) — cash drawer paid out`,
                    balance_before: walletBal, balance_after: walletBal - amount,
                });
            } else if (payment.account_id) {
                await client.query(
                    'UPDATE payment_accounts SET balance = balance - $1 WHERE id = $2',
                    [amount, payment.account_id]
                );
                await logAccountTxn(client, payment.account_id, 'purchase_payment', amount, order.rows[0].po_number,
                    `Goods purchase paid to ${supplier.rows[0]?.name || 'Supplier'} (PO ${order.rows[0].po_number})`);
            }
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
                payments,
                supplier: supplier.rows[0],
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

        const items = itemsResult.rows.map((it) => ({
            ...it,
            full_name: [it.brand_name, it.product_name, it.model_name, it.series_name]
                .filter(Boolean)
                .filter((val, idx, arr) => arr.indexOf(val) === idx)
                .join(' ') || it.product_name,
            serials: serialsByItem[it.id] || [],
        }));

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

        // 1. Time Window Rule: Purchase orders can only be deleted within 24 hours of creation
        const createdAt = new Date(po.created_at || Date.now());
        const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursOld > 24) {
            return res.status(400).json({
                error: `Cannot delete purchase order: PO #${po.po_number || id} was created ${Math.floor(hoursOld)} hours ago. Purchase orders can only be deleted within 24 hours of creation.`
            });
        }

        // 2. Lock Chain Rule: Check if serialized products from this PO have been sold
        const serialSoldCheck = await pool.query(`
            SELECT 1 
            FROM sales_item_serials sis
            JOIN sales_items si ON si.id = sis.sales_item_id
            JOIN sales s ON s.id = si.sale_id
            JOIN purchase_order_serials pos ON pos.serial_code = sis.serial_code
            JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
            WHERE poi.purchase_order_id = $1
              AND s.deleted_at IS NULL
            LIMIT 1
        `, [id]).catch(() => ({ rows: [] }));

        if (serialSoldCheck.rows.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete this purchase order because serialized products from it have already been sold in sales invoices.'
            });
        }

        // 3. Lock Chain Rule: Check if products in this PO have subsequent active sales
        const salesCheck = await pool.query(`
            SELECT 1 
            FROM sales_items si
            JOIN sales s ON s.id = si.sale_id
            JOIN purchase_order_items poi ON poi.product_id = si.product_id
            WHERE poi.purchase_order_id = $1 
              AND s.created_at >= (SELECT created_at FROM purchase_orders WHERE id = $1)
              AND s.deleted_at IS NULL
            LIMIT 1
        `, [id]).catch(() => ({ rows: [] }));

        if (salesCheck.rows.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete this purchase order because sales have already been processed for products under this purchase.'
            });
        }

        // Deduct products stock in main warehouse
        const poItems = await pool.query(
            'SELECT product_id, quantity FROM purchase_order_items WHERE purchase_order_id = $1',
            [id]
        );
        for (const item of poItems.rows) {
            await pool.query(
                `UPDATE products
                 SET stock = GREATEST(0, COALESCE(stock, 0) - $1),
                     updated_at = NOW()
                 WHERE id = $2`,
                [Number(item.quantity || 0), item.product_id]
            );
        }

        // Adjust supplier payable balance if total_due > 0
        if (po.supplier_id && Number(po.total_due) > 0) {
            await pool.query(
                `UPDATE suppliers 
                 SET payable_balance = GREATEST(0, COALESCE(payable_balance, 0) - $1), 
                     updated_at = NOW() 
                 WHERE id = $2`,
                [Number(po.total_due), po.supplier_id]
            );
        }

        // Refund payments back to their source accounts (full rollback)
        const poPayments = await pool.query(
            'SELECT * FROM purchase_order_payments WHERE purchase_order_id = $1',
            [id]
        );
        for (const pay of poPayments.rows) {
            const amt = money(pay.amount);
            if (amt <= 0) continue;
            if ((pay.payment_method || '').toLowerCase() === 'wallet') {
                await ensureWalletSchema();
                if (po.supplier_id) {
                    const supWalletRes = await pool.query('SELECT wallet_balance FROM suppliers WHERE id = $1', [po.supplier_id]);
                    const supWallet = money(supWalletRes.rows[0]?.wallet_balance || 0);
                    await pool.query(
                        'UPDATE suppliers SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2',
                        [amt, po.supplier_id]
                    );
                    // Reverse the real cash that left the drawer when the wallet payment was made.
                    const drawerRes = await pool.query(
                        "SELECT id, name FROM payment_accounts WHERE account_type = 'drawer' OR id = 1 ORDER BY account_type = 'drawer' DESC LIMIT 1"
                    );
                    const drawerAcc = drawerRes.rows[0];
                    if (drawerAcc) {
                        await pool.query(
                            'UPDATE payment_accounts SET balance = COALESCE(balance, 0) + $1 WHERE id = $2',
                            [amt, drawerAcc.id]
                        );
                        await pool.query(
                            `INSERT INTO account_transactions (account_id, type, amount, reference, note)
                             VALUES ($1, 'deposit', $2, $3, $4)`,
                            [drawerAcc.id, amt, po.po_number,
                             `${po.po_number} deleted — wallet payment refunded to cash drawer ${drawerAcc.name}`]
                        );
                    }
                    await writeWalletLedger(pool, {
                        party_type: 'supplier', party_id: Number(po.supplier_id), party_name: null,
                        type: 'purchase_delete_refund', amount: amt, credit: true,
                        account_id: drawerAcc?.id || null, account_name: drawerAcc?.name || null,
                        account_effect: 'in', cash_drawer_effect: 'in',
                        reference: po.po_number, note: `Supplier wallet refunded from deleted PO ${po.po_number} (drawer credited back)`,
                        balance_before: supWallet, balance_after: supWallet + amt,
                    });
                }
            } else if (pay.account_id) {
                const acctRes = await pool.query('SELECT id, name, account_type FROM payment_accounts WHERE id = $1', [pay.account_id]);
                if (acctRes.rows.length) {
                    const acctName = acctRes.rows[0].name || '';
                    const isMfsBank = (acctRes.rows[0].account_type || '') !== 'drawer';
                    await pool.query(
                        'UPDATE payment_accounts SET balance = COALESCE(balance, 0) + $1 WHERE id = $2',
                        [amt, pay.account_id]
                    );
                    await pool.query(
                        `INSERT INTO account_transactions (account_id, type, amount, reference, note)
                         VALUES ($1, 'deposit', $2, $3, $4)`,
                        [pay.account_id, amt, po.po_number,
                         `${po.po_number} deleted — payment refunded to ${acctName}${isMfsBank ? ' (manual transaction ID entry required)' : ''}`]
                    );
                }
            }
        }

        await pool.query('UPDATE purchase_orders SET deleted_at = NOW() WHERE id = $1', [id]);
        await pool.query(`
            INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
            VALUES ('purchase_orders', $1, $2, $3, NOW())
        `, [id, `PO #${po.po_number || id}`, JSON.stringify(po)]).catch(() => null);

        res.status(200).json({ success: true, message: `Purchase order #${po.po_number || id} moved to Trash successfully! Stock deducted from inventory.` });
    } catch (error) {
        console.error('Delete purchase order error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete purchase order' });
    }
};

// Edit Purchase Order (Permitted strictly within 72 hours of creation)
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

        // 1. Time Window Rule: Editing permitted strictly within 72 hours
        const createdAt = new Date(po.created_at || Date.now());
        const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursOld > 72) {
            return res.status(400).json({
                error: `Cannot edit purchase order: PO #${po.po_number || id} was created ${Math.floor(hoursOld)} hours ago. Edits are only permitted within 72 hours of creation. Developer assistance will be required for any further modifications.`
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
              AND s.created_at >= (SELECT created_at FROM purchase_orders WHERE id = $1)
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
            for (const item of items) {
                const pid = parseInt(item.product_id, 10);
                if (seenPids.has(pid)) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ error: 'The same item cannot be added twice in a purchase order.' });
                }
                seenPids.add(pid);
            }

            for (const item of items) {
                const pid = parseInt(item.product_id, 10);
                const costPrice = money(item.cost_price);
                const salePrice = money(item.sale_price);
                const finalSale = money(item.final_sale_price || item.sale_price);
                const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

                // If this item was already sold, ensure it wasn't deleted or reduced below sold
                if (soldProductMap.has(pid)) {
                    // Price and barcode can be edited freely, but quantity cannot be reduced below sold
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

                // Update purchase_order_items if exists or insert
                if (item.id) {
                    const oldItemRes = await client.query('SELECT product_id, quantity FROM purchase_order_items WHERE id = $1', [item.id]);
                    if (oldItemRes.rows.length) {
                        const oldQty = Number(oldItemRes.rows[0].quantity || 0);
                        const diff = quantity - oldQty;
                        if (diff !== 0) {
                            await client.query(
                                `UPDATE products SET stock = GREATEST(0, COALESCE(stock, 0) + $1), updated_at = NOW() WHERE id = $2`,
                                [diff, pid]
                            );
                        }
                    }

                    await client.query(`
                        UPDATE purchase_order_items 
                        SET cost_price = $1, sale_price = $2, margin_type = $3, margin_value = $4,
                            final_sale_price = $5, line_total = $1::numeric * $6::numeric, quantity = $6, updated_at = NOW()
                        WHERE id = $7
                    `, [costPrice, salePrice, item.margin_type || 'percent', money(item.margin_value), finalSale, quantity, item.id]);

                    // Update serials/barcodes if provided
                    if (Array.isArray(item.serials)) {
                        await client.query('DELETE FROM purchase_order_serials WHERE purchase_order_item_id = $1', [item.id]);
                        for (const serial of item.serials) {
                            const trimmed = String(serial).trim();
                            if (trimmed) {
                                await client.query(
                                    'INSERT INTO purchase_order_serials (purchase_order_item_id, serial_code) VALUES ($1, $2)',
                                    [item.id, trimmed]
                                );
                            }
                        }
                    }
                }

                // Live price update in product catalog
                await client.query(`
                    UPDATE products 
                    SET purchase_price = $1,
                        selling_price = CASE WHEN $2 > 0 THEN $2 ELSE selling_price END,
                        barcode = CASE WHEN COALESCE(NULLIF(barcode, ''), '') = '' THEN $4 ELSE barcode END,
                        updated_at = NOW()
                    WHERE id = $3
                `, [costPrice, finalSale || salePrice, pid, Array.isArray(item.serials) && item.serials.length > 0 ? String(item.serials[0]).trim() : null]);
            }
        } else {
            totalCost = Number(po.total_cost || 0);
            totalSale = Number(po.total_sale || 0);
            unitCount = Number(po.unit_count || 0);
        }

        const totalPaid = Number(po.total_paid || 0);
        const totalDue = Math.max(0, totalCost - totalPaid);

        await client.query(`
            UPDATE purchase_orders 
            SET transaction_reference = COALESCE($1, transaction_reference),
                extra_cost = COALESCE($2, extra_cost),
                extra_cost_category = COALESCE($3, extra_cost_category),
                extra_cost_notes = COALESCE($4, extra_cost_notes),
                total_cost = $5,
                total_sale = $6,
                total_due = $7,
                unit_count = $8,
                updated_at = NOW()
            WHERE id = $9
        `, [
            transaction_reference || null,
            extra_cost !== undefined ? money(extra_cost) : null,
            extra_cost_category || null,
            extra_cost_notes || null,
            totalCost,
            totalSale,
            totalDue,
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
};
