const pool = require('../../config/db');
const {
    formatProductFullName,
    ensurePurchaseColumns,
    checkSerial
} = require('./purchaseHelpers');

const getAccounts = async (_req, res) => {
    try {
        const result = await pool.query('SELECT * FROM payment_accounts ORDER BY id ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to load payment accounts' });
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

module.exports = {
    getAccounts,
    getOrders,
    getOrderById,
    checkSerial
};
