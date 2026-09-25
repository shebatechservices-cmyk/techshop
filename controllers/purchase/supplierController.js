const pool = require('../../config/db');
const { ensureWalletSchema, writeWalletLedger } = require('../walletController');
const { money, ensurePurchaseColumns } = require('./purchaseHelpers');

// =========================================================
// SUPPLIER MANAGEMENT
// =========================================================

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

module.exports = {
    getSuppliers,
    createSupplier,
    deleteSupplier,
    getSupplierSummary,
};
