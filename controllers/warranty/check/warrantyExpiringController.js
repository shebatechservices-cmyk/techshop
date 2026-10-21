const pool = require('../../../config/db');
const { WARRANTY_GRACE_DAYS, ensureWarrantyTables } = require('../warrantySchema');

// Instant Warranty Check for Expiring Warranties (Summary & Alerts)
exports.getExpiringWarranties = async (req, res) => {
    try {
        await ensureWarrantyTables();
        const windowDays = Math.max(0, parseInt(req.query.days, 10) || 30);
        const sql = `
            SELECT 
                sis.id,
                sis.serial_code,
                s.invoice_no,
                s.sale_date,
                COALESCE(c.name, 'Walk-in Customer') AS customer_name,
                COALESCE(c.phone, 'N/A') AS customer_phone,
                COALESCE(p.name, 'Product') AS product_name,
                COALESCE(p.warranty_months, 12) AS warranty_months
            FROM sales_item_serials sis
            JOIN sales_items si ON si.id = sis.sales_item_id
            JOIN sales s ON s.id = si.sale_id
            JOIN products p ON p.id = si.product_id
            LEFT JOIN customers c ON c.id = s.customer_id
            ORDER BY s.id DESC
            LIMIT 3000
        `;
        const { rows } = await pool.query(sql);
        const now = new Date();
        const expired = [];
        const expiringSoon = [];
        const valid = [];

        rows.forEach((r) => {
            const saleDate = new Date(r.sale_date || new Date());
            const months = parseInt(r.warranty_months, 10) || 12;
            const expiry = new Date(saleDate);
            expiry.setMonth(expiry.getMonth() + months);
            expiry.setDate(expiry.getDate() + WARRANTY_GRACE_DAYS);
            const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const entry = {
                serial_id: r.id,
                serial_code: r.serial_code,
                invoice_no: r.invoice_no,
                sale_date: r.sale_date,
                product_name: r.product_name,
                customer_name: r.customer_name,
                customer_phone: r.customer_phone,
                warranty_months: months,
                warranty_expiry: expiry.toISOString().split('T')[0],
                days_remaining: daysRemaining,
            };
            if (daysRemaining < 0) expired.push(entry);
            else if (daysRemaining <= windowDays) expiringSoon.push(entry);
            else valid.push(entry);
        });

        expired.sort((a, b) => a.days_remaining - b.days_remaining);
        expiringSoon.sort((a, b) => a.days_remaining - b.days_remaining);
        valid.sort((a, b) => a.days_remaining - b.days_remaining);

        return res.status(200).json({
            success: true,
            grace_days: WARRANTY_GRACE_DAYS,
            window_days: windowDays,
            summary: {
                total: rows.length,
                expired_count: expired.length,
                expiring_count: expiringSoon.length,
                valid_count: valid.length,
            },
            expired: expired.slice(0, 30),
            expiring: expiringSoon.slice(0, 30),
            valid: valid.slice(0, 10),
        });
    } catch (err) {
        console.error('Get expiring warranties error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
