const pool = require('../../../../config/db');

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
                   COALESCE((SELECT SUM(quantity * cost_price) FROM sales_items WHERE sale_id = s.id), 0)::NUMERIC AS total_cogs,
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

module.exports = {
    getSales,
};
