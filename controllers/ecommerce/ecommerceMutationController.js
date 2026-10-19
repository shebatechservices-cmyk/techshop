const pool = require("../../config/db");
const { ensureEcommerceColumns } = require("./ecommerceSchema");

exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ success: false, message: "স্ট্যাটাস দিন।" });
    }
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const prev = await client.query("SELECT * FROM ecommerce_orders WHERE id = $1", [id]);
        if (prev.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ success: false, message: "অর্ডার পাওয়া যায়নি।" });
        }
        const oldStatus = (prev.rows[0].order_status || '').toLowerCase();
        const newStatus = status.toLowerCase();

        // If status changed to cancelled and was not cancelled before, restore stock
        if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
            const itemsRes = await client.query("SELECT * FROM ecommerce_order_items WHERE order_id = $1", [id]);
            for (let item of itemsRes.rows) {
                await client.query("UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2", [item.quantity, item.product_id]);
            }
        }
        // If status changed from cancelled back to active, re-decrement stock
        if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
            const itemsRes = await client.query("SELECT * FROM ecommerce_order_items WHERE order_id = $1", [id]);
            for (let item of itemsRes.rows) {
                await client.query("UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2", [item.quantity, item.product_id]);
            }
        }

        const updateRes = await client.query(
            "UPDATE ecommerce_orders SET order_status = $1 WHERE id = $2 RETURNING *",
            [newStatus, id]
        );
        await client.query("COMMIT");
        return res.status(200).json({ success: true, message: `অর্ডার স্ট্যাটাস '${newStatus}'-এ আপডেট হয়েছে।`, data: updateRes.rows[0] });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Update order status error:", error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

exports.updateOrderDetails = async (req, res) => {
    const { id } = req.params;
    const { courier_name, tracking_code, customer_notes, payment_status, payment_method, shipping_address } = req.body;
    try {
        await ensureEcommerceColumns();
        const result = await pool.query(
            `UPDATE ecommerce_orders 
             SET courier_name = COALESCE($1, courier_name),
                 tracking_code = COALESCE($2, tracking_code),
                 customer_notes = COALESCE($3, customer_notes),
                 payment_status = COALESCE($4, payment_status),
                 payment_method = COALESCE($5, payment_method),
                 shipping_address = COALESCE($6, shipping_address)
             WHERE id = $7 RETURNING *`,
            [courier_name, tracking_code, customer_notes, payment_status, payment_method, shipping_address, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "অর্ডার পাওয়া যায়নি।" });
        }
        return res.status(200).json({ success: true, message: "অর্ডারের তথ্য আপডেট হয়েছে।", data: result.rows[0] });
    } catch (error) {
        console.error("Update order details error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.customerSignup = async (req, res) => {
    try {
        const { name, phone, address, email } = req.body;
        if (!name || !phone) {
            return res.status(400).json({ success: false, message: "নাম এবং মোবাইল নম্বর দেওয়া আবশ্যক।" });
        }
        const existing = await pool.query("SELECT * FROM customers WHERE phone = $1", [phone.trim()]);
        if (existing.rows.length > 0) {
            return res.status(200).json({ 
                success: true, 
                message: "লগইন সফল হয়েছে!", 
                data: existing.rows[0] 
            });
        }
        const insertRes = await pool.query(
            "INSERT INTO customers (name, phone, email, address, customer_type) VALUES ($1, $2, $3, $4, 'retail') RETURNING *",
            [name.trim(), phone.trim(), email ? email.trim() : null, address ? address.trim() : null]
        );
        return res.status(201).json({ 
            success: true, 
            message: "কাস্টমার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!", 
            data: insertRes.rows[0] 
        });
    } catch (err) {
        console.error("Customer signup error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
