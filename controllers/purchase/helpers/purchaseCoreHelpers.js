const pool = require('../../../config/db');

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
            ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS discount NUMERIC(14,2) DEFAULT 0;
            ALTER TABLE purchase_order_payments ADD COLUMN IF NOT EXISTS receiver_name VARCHAR(150);
            ALTER TABLE purchase_order_payments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);
            ALTER TABLE purchase_order_payments ADD COLUMN IF NOT EXISTS sub_option VARCHAR(150);
            ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
            ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS supplier_warranty_months INTEGER;
            ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS customer_warranty_months INTEGER;
            ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS supplier_warranty_expire_date DATE;
            ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS final_cost NUMERIC(15, 2);
            CREATE TABLE IF NOT EXISTS purchase_order_serials (
                id SERIAL PRIMARY KEY,
                purchase_order_item_id INTEGER REFERENCES purchase_order_items(id) ON DELETE CASCADE,
                serial_code VARCHAR(120) NOT NULL
            );
            CREATE UNIQUE INDEX IF NOT EXISTS idx_purchase_order_serials_code_unique ON purchase_order_serials (TRIM(LOWER(serial_code)));
            CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_voucher_no ON expenses (voucher_no);
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

module.exports = {
    money,
    formatProductFullName,
    makePoNumber,
    ensurePurchaseColumns,
    checkSerial,
};
