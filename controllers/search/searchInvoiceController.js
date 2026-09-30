const pool = require('../../config/db');

const searchInvoice = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ success: false, message: 'ইনভয়েস নং বা ফোন নাম্বার দিন' });
        
        let result;
        try {
            const query = `
                SELECT s.*, c.name as customer_name, c.phone as customer_phone 
                FROM sales s 
                JOIN customers c ON s.customer_id = c.id 
                WHERE s.invoice_no ILIKE $1 OR c.phone ILIKE $1 
                ORDER BY s.id DESC;
            `;
            result = await pool.query(query, [`%${q}%`]);
        } catch (e) {
            const query = `
                SELECT s.*, s.grand_total as total_amount, c.name as customer_name, c.phone as customer_phone 
                FROM sales_invoices s 
                JOIN customers c ON s.customer_id = c.id 
                WHERE s.invoice_no ILIKE $1 OR c.phone ILIKE $1 
                ORDER BY s.id DESC;
            `;
            result = await pool.query(query, [`%${q}%`]);
        }
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('searchInvoice error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    searchInvoice,
};
