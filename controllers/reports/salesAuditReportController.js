const pool = require('../../config/db');
const { getDateRange } = require('./reportDateHelper');

exports.getSalesAuditReport = async (req, res) => {
    try {
        const { period = 'this_month', from_date, to_date, limit = 200 } = req.query;
        const { from, to } = getDateRange(period, from_date, to_date);

        const result = await pool.query(`
            SELECT 
                s.id,
                s.invoice_no,
                s.created_at,
                s.customer_id,
                COALESCE(c.name, 'Walking Customer') AS customer_name,
                c.phone AS customer_phone,
                s.sales_person,
                s.total_amount,
                s.paid_amount,
                s.due_amount,
                s.discount,
                s.vat,
                s.payment_status,
                COALESCE(pm.method_name, 'Cash') AS payment_method,
                COALESCE((
                    SELECT SUM(
                        si.quantity * CASE 
                            WHEN COALESCE(si.cost_price, 0) > 0 THEN si.cost_price 
                            ELSE COALESCE(p.purchase_price, 0) 
                        END
                    )
                    FROM sales_items si
                    LEFT JOIN products p ON p.id = si.product_id
                    WHERE si.sale_id = s.id
                ), 0) AS estimated_cogs
            FROM sales s
            LEFT JOIN customers c ON c.id = s.customer_id
            LEFT JOIN payment_methods pm ON pm.id = s.payment_method_id
            WHERE DATE(s.created_at) >= $1 AND DATE(s.created_at) <= $2
            ORDER BY s.id DESC
            LIMIT $3;
        `, [from, to, parseInt(limit, 10)]);

        return res.status(200).json({
            success: true,
            filter: { from, to, period },
            data: result.rows,
        });
    } catch (error) {
        console.error('getSalesAuditReport error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
