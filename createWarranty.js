const fs = require('fs');

const controller = `const pool = require('../config/db');

// ১. ওয়ারেন্টি ক্লেইম তৈরি করা (Offline & Ecommerce)
exports.createWarrantyClaim = async (req, res) => {
    try {
        const { order_source, invoice_no, ecommerce_order_no, customer_id, product_id, barcode, issue_description } = req.body;
        
        // ইউনিক ক্লেইম নাম্বার জেনারেট
        const claim_no = 'CLM-' + Date.now();

        const query = \`
            INSERT INTO warranty_claims 
            (claim_no, order_source, invoice_no, ecommerce_order_no, customer_id, product_id, barcode, issue_description) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
        \`;
        const values = [claim_no, order_source, invoice_no, ecommerce_order_no, customer_id, product_id, barcode, issue_description];
        
        const result = await pool.query(query, values);
        return res.status(201).json({ success: true, message: 'ওয়ারেন্টি ক্লেইম সফলভাবে গ্রহণ করা হয়েছে', data: result.rows[0] });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ২. রিটার্ন ও রিফান্ড প্রসেস করা
exports.processReturn = async (req, res) => {
    const client = await pool.connect();
    try {
        const { order_source, invoice_no, ecommerce_order_no, customer_id, product_id, return_qty, refund_amount, return_reason, condition } = req.body;
        
        await client.query('BEGIN');
        
        const return_no = 'RET-' + Date.now();

        // রিটার্ন টেবিলে এন্ট্রি
        const returnQuery = \`
            INSERT INTO product_returns 
            (return_no, order_source, invoice_no, ecommerce_order_no, customer_id, product_id, return_qty, refund_amount, return_reason, condition) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;
        \`;
        const returnValues = [return_no, order_source, invoice_no, ecommerce_order_no, customer_id, product_id, return_qty, refund_amount, return_reason, condition];
        await client.query(returnQuery, returnValues);

        // যদি প্রোডাক্ট ড্যামেজ হয়, ড্যামেজ টেবিলে পাঠাব
        if (condition === 'Damaged') {
            await client.query(
                'INSERT INTO damaged_products (product_id, quantity, note) VALUES ($1, $2, $3)', 
                [product_id, return_qty, return_reason]
            );
        }

        // রিফান্ড মানি কাস্টমার ওয়ালেটে যোগ করা
        if (refund_amount > 0) {
            const walletQuery = \`UPDATE payment_accounts SET balance = balance + $1 WHERE name = (SELECT name FROM customers WHERE id = $2) OR name = 'Tech: ' || (SELECT name FROM customers WHERE id = $2)\`;
            await client.query(walletQuery, [refund_amount, customer_id]);
        }

        await client.query('COMMIT');
        return res.status(200).json({ success: true, message: 'রিটার্ন ও রিফান্ড সফলভাবে সম্পন্ন হয়েছে।' });
    } catch (error) {
        await client.query('ROLLBACK');
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};`;

const route = `const express = require('express');
const router = express.Router();
const warrantyController = require('../controllers/warrantyController');
const { checkPermission } = require('../middlewares/authMiddleware');

// অফলাইন এন্ডপয়েন্ট (একাউন্টস পারমিশন লাগবে)
router.post('/offline/claim', checkPermission('manage_offline_warranty'), warrantyController.createWarrantyClaim);
router.post('/offline/return', checkPermission('manage_offline_return'), warrantyController.processReturn);

// ই-কমার্স এন্ডপয়েন্ট (ই-কমার্স পারমিশন লাগবে)
router.post('/ecommerce/claim', checkPermission('manage_ecommerce_warranty'), warrantyController.createWarrantyClaim);
router.post('/ecommerce/return', checkPermission('manage_ecommerce_return'), warrantyController.processReturn);

module.exports = router;`;

fs.writeFileSync('controllers/warrantyController.js', controller);
fs.writeFileSync('routes/warrantyRoute.js', route);

let serverContent = fs.readFileSync('server.js', 'utf8');
if (!serverContent.includes('/api/warranty')) {
    serverContent = serverContent.replace('app.listen(', 'app.use("/api/warranty", require("./routes/warrantyRoute"));\napp.listen(');
    fs.writeFileSync('server.js', serverContent);
}

console.log('Warranty & Return APIs Created!');
