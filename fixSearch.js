const fs = require('fs');

const controller = `const pool = require('../config/db');

exports.searchProduct = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ success: false, message: 'সার্চ করার জন্য কিছু লিখুন' });
        
        const query = "SELECT p.*, COALESCE((SELECT json_agg(json_build_object('supplier', s.name, 'date', pu.purchase_date, 'qty', pi.quantity, 'price', pi.unit_price)) FROM purchase_items pi JOIN purchases pu ON pi.purchase_id = pu.id JOIN suppliers s ON pu.supplier_id = s.id WHERE pi.product_id = p.id), '[]') as purchase_history, COALESCE((SELECT json_agg(json_build_object('customer', c.name, 'date', sa.sale_date, 'qty', si.quantity, 'price', si.unit_price)) FROM sales_items si JOIN sales sa ON si.sale_id = sa.id JOIN customers c ON sa.customer_id = c.id WHERE si.product_id = p.id), '[]') as sales_history FROM products p WHERE p.barcode = $1 OR p.name ILIKE $2 ORDER BY p.id DESC;";
        
        const result = await pool.query(query, [q, \`%\${q}%\`]);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.searchCustomer = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ success: false, message: 'নাম বা ফোন নাম্বার দিন' });
        
        const query = "SELECT c.*, COALESCE(pa.balance, 0) as wallet_balance FROM customers c LEFT JOIN payment_accounts pa ON pa.name = 'Tech: ' || c.name OR pa.name = c.name WHERE c.name ILIKE $1 OR c.phone ILIKE $1 ORDER BY c.id DESC;";
        
        const result = await pool.query(query, [\`%\${q}%\`]);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.searchInvoice = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ success: false, message: 'ইনভয়েস নং বা ফোন নাম্বার দিন' });
        
        const query = "SELECT s.*, c.name as customer_name, c.phone as customer_phone FROM sales s JOIN customers c ON s.customer_id = c.id WHERE s.invoice_no ILIKE $1 OR c.phone ILIKE $1 ORDER BY s.id DESC;";
        
        const result = await pool.query(query, [\`%\${q}%\`]);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};`;

fs.writeFileSync('controllers/searchController.js', controller);
console.log('Search APIs Fixed and Ready!');
