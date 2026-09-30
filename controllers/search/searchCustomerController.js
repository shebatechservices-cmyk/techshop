const pool = require('../../config/db');

const searchCustomer = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ success: false, message: 'নাম বা ফোন নাম্বার দিন' });
        
        const query = `
            SELECT c.*, COALESCE(pa.balance, 0) as wallet_balance 
            FROM customers c 
            LEFT JOIN payment_accounts pa ON pa.name = 'Tech: ' || c.name OR pa.name = c.name 
            WHERE c.name ILIKE $1 OR c.phone ILIKE $1 
            ORDER BY c.id DESC;
        `;
        
        const result = await pool.query(query, [`%${q}%`]);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('searchCustomer error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    searchCustomer,
};
