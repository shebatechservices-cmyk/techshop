const pool = require('../../../config/db');
const {
    ensureSalesColumns,
    formatProductFullName,
} = require('../salesHelpers');

/**
 * Retrieves paginated sales list with customer and item metrics.
 */
const getSales = async (_req, res) => {
    try {
        const query = `
            SELECT s.*,
                   c.name AS customer_name,
                   c.phone AS customer_phone,
                   c.email AS customer_email,
                   COALESCE((SELECT COUNT(*) FROM sales_items WHERE sale_id = s.id), 0) AS item_count,
                   COALESCE((SELECT SUM(quantity) FROM sales_items WHERE sale_id = s.id), 0) AS unit_count,
                   COALESCE((
                       SELECT true FROM register_shifts rs 
                       WHERE rs.status = 'closed' 
                         AND s.created_at <= rs.closed_at 
                         AND (rs.opened_at IS NULL OR s.created_at >= rs.opened_at)
                       LIMIT 1
                   ), false) AS is_shift_closed
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.deleted_at IS NULL
            ORDER BY s.id DESC
            LIMIT 200;
        `;
        const result = await pool.query(query);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get sales error:', error);
        return res.status(500).json({ success: false, message: error.message, data: [] });
    }
};

/**
 * Retrieves full sale invoice details including customer, items, and attached serials.
 */
const getSaleById = async (req, res) => {
    try {
        await ensureSalesColumns();
        const saleId = Number(req.params.id);
        const saleRes = await pool.query(
            `SELECT s.*,
                    c.name AS customer_name,
                    c.phone AS customer_phone,
                    c.email AS customer_email,
                    c.address AS customer_address,
                    c.receivable_balance AS customer_receivable_balance,
                    COALESCE((
                        SELECT true FROM register_shifts rs 
                        WHERE rs.status = 'closed' 
                          AND s.created_at <= rs.closed_at 
                          AND (rs.opened_at IS NULL OR s.created_at >= rs.opened_at)
                        LIMIT 1
                    ), false) AS is_shift_closed
             FROM sales s
             LEFT JOIN customers c ON s.customer_id = c.id
             WHERE s.id = $1`,
            [saleId]
        );
        if (!saleRes.rows.length) {
            return res.status(404).json({ success: false, message: 'Sale invoice not found' });
        }
        const sale = saleRes.rows[0];

        const itemsRes = await pool.query(
            `SELECT si.*,
                    COALESCE(si.discount, 0) AS discount,
                    COALESCE(si.warranty_months, p.warranty_months, 0) AS warranty_months,
                    COALESCE(p.name, 'Product') AS product_name,
                    b.name AS brand_name,
                    m.name AS model_name,
                    s.name AS series_name,
                    p.sku,
                    p.barcode
             FROM sales_items si
             LEFT JOIN products p ON p.id = si.product_id
             LEFT JOIN brands b ON b.id = p.brand_id
             LEFT JOIN models m ON m.id = p.model_id
             LEFT JOIN series s ON s.id = p.series_id
             WHERE si.sale_id = $1
             ORDER BY si.id ASC`,
            [saleId]
        );

        const itemIds = itemsRes.rows.map((it) => it.id);
        let serialsByItem = {};
        if (itemIds.length > 0) {
            const serialsRes = await pool.query(
                `SELECT sales_item_id, serial_code
                 FROM sales_item_serials
                 WHERE sales_item_id = ANY($1::int[])`,
                [itemIds]
            );
            serialsRes.rows.forEach((s) => {
                if (!serialsByItem[s.sales_item_id]) {
                    serialsByItem[s.sales_item_id] = [];
                }
                serialsByItem[s.sales_item_id].push(s.serial_code);
            });
        }

        const items = itemsRes.rows.map((it) => {
            const fullTitle = formatProductFullName(it);
            return {
                ...it,
                discount: Number(it.discount || 0),
                unit_price: Number(it.unit_price || 0),
                line_total: Number(it.line_total || 0),
                raw_product_name: it.product_name,
                name: fullTitle,
                full_name: fullTitle,
                product_name: fullTitle,
                warranty_months: Number(it.warranty_months || 0),
                serials: serialsByItem[it.id] || [],
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                ...sale,
                items,
            },
        });
    } catch (error) {
        console.error('Get sale by id error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getSales,
    getSaleById,
};
