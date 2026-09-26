const pool = require('../../config/db');
const { ensureWalletSchema, writeWalletLedger, logAccountTxn } = require('../walletController');

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
        const cleanedSubOption = subOption.replace(/\s*\([^)]*\)$/, '').trim();
        const accRes = await client.query(
            'SELECT * FROM payment_accounts WHERE LOWER(name) = LOWER($1) OR LOWER(name) = LOWER($2) OR LOWER(account_number) = LOWER($1) LIMIT 1',
            [subOption, cleanedSubOption]
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

// Apply a payment inside the caller's transaction
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

// Reverse a previously-applied payment inside the caller's transaction
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

module.exports = {
    money,
    formatProductFullName,
    makePoNumber,
    ensurePurchaseColumns,
    checkSerial,
    resolvePaymentAccount,
    applyPurchasePayment,
    reversePurchasePayment,
};
