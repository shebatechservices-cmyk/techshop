const fs = require('fs');

const controller = `const pool = require('../config/db');

// সেলস ক্রিয়েট ও লয়্যালটি পয়েন্ট ম্যানেজমেন্ট
exports.createSale = async (req, res) => {
    const client = await pool.connect();
    try {
        const { customer_id, items, payment_method_id, loyalty_points_to_use } = req.body;
        // items = [{ product_id, quantity, unit_price }]
        
        await client.query('BEGIN');

        let total_amount = 0;
        items.forEach(item => {
            total_amount += item.quantity * item.unit_price;
        });

        // লয়্যালটি পয়েন্ট ডিসকাউন্ট হিসাব (যদি ব্যবহার করে)
        let discount_from_loyalty = 0;
        if (loyalty_points_to_use && loyalty_points_to_use > 0) {
            const customerRes = await client.query('SELECT loyalty_points FROM customers WHERE id = $1', [customer_id]);
            const currentPoints = customerRes.rows[0]?.loyalty_points || 0;

            if (currentPoints < loyalty_points_to_use) {
                throw new Error('পর্যাপ্ত লয়্যালটি পয়েন্ট নেই!');
            }
            // ধরি, ১ পয়েন্ট = ১ টাকা ডিসকাউন্ট
            discount_from_loyalty = loyalty_points_to_use;
            total_amount -= discount_from_loyalty;

            // কাস্টমার থেকে পয়েন্ট কেটে নেওয়া
            await client.query('UPDATE customers SET loyalty_points = loyalty_points - $1 WHERE id = $2', [loyalty_points_to_use, customer_id]);
        }

        // নতুন পয়েন্ট অর্জন (ধরি, প্রতি ১০০ টাকায় ১ পয়েন্ট)
        const points_earned = Math.floor(total_amount / 100);

        const invoice_no = 'INV-' + Date.now();

        // সেলস এন্ট্রি
        const saleQuery = \`
            INSERT INTO sales (invoice_no, customer_id, total_amount, payment_method_id, loyalty_points_earned, loyalty_points_used) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
        \`;
        const saleRes = await client.query(saleQuery, [invoice_no, customer_id, total_amount, payment_method_id, points_earned, loyalty_points_to_use || 0]);
        const sale_id = saleRes.rows[0].id;

        // সেলস আইটেম এবং স্টক আপডেট
        for (let item of items) {
            await client.query(
                'INSERT INTO sales_items (sale_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
                [sale_id, item.product_id, item.quantity, item.unit_price]
            );
            // স্টক কমানো
            await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.product_id]);
        }

        // কাস্টমারের নতুন অর্জিত পয়েন্ট যোগ করা
        if (points_earned > 0) {
            await client.query('UPDATE customers SET loyalty_points = loyalty_points + $1 WHERE id = $2', [points_earned, customer_id]);
        }

        await client.query('COMMIT');
        return res.status(201).json({ 
            success: true, 
            message: 'বিক্রি সফলভাবে সম্পন্ন হয়েছে!', 
            invoice_no, 
            points_earned, 
            total_amount 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};`;

fs.writeFileSync('controllers/salesController.js', controller);
console.log('Sales Controller Updated with Loyalty Logic!');
