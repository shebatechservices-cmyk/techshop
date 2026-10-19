const pool = require("../../config/db");
const { ensureEcommerceColumns } = require("./ecommerceSchema");

exports.createOrder = async (req, res) => {
    const client = await pool.connect();
    try {
        await ensureEcommerceColumns();
        const { 
            customer_name, 
            customer_phone, 
            shipping_address, 
            delivery_charge = 0,
            payment_status = 'unpaid',
            payment_method = 'cod',
            courier_name = '',
            tracking_code = '',
            customer_notes = '',
            items = [] 
        } = req.body;

        if (!customer_name || !customer_phone || !shipping_address || items.length === 0) {
            return res.status(400).json({ success: false, message: "গ্রাহকের সম্পূর্ণ তথ্য এবং প্রডাক্ট দিন।" });
        }

        await client.query("BEGIN");
        let items_total = 0;
        items.forEach(item => {
            items_total += Number(item.quantity) * Number(item.unit_price);
        });
        const finalTotal = items_total + Number(delivery_charge || 0);
        const orderNo = "ECOM-" + Math.floor(100000 + Math.random() * 900000);

        const orderRes = await client.query(
            `INSERT INTO ecommerce_orders (
                order_no, 
                customer_name, 
                customer_phone, 
                shipping_address, 
                delivery_charge,
                total_amount, 
                payment_status,
                payment_method,
                courier_name,
                tracking_code,
                customer_notes,
                order_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending') RETURNING id;`,
            [
                orderNo, 
                customer_name, 
                customer_phone, 
                shipping_address, 
                Number(delivery_charge || 0),
                finalTotal, 
                payment_status,
                payment_method,
                courier_name || null,
                tracking_code || null,
                customer_notes || null
            ]
        );
        const orderId = orderRes.rows[0].id;

        for (let item of items) {
            await client.query(
                "INSERT INTO ecommerce_order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
                [orderId, item.product_id, item.quantity, item.unit_price]
            );
            await client.query(
                "UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2",
                [item.quantity, item.product_id]
            );
        }

        await client.query("COMMIT");
        return res.status(201).json({ 
            success: true, 
            message: "অনলাইন অর্ডার সফলভাবে প্লেস হয়েছে এবং স্টক আপডেট হয়েছে।", 
            data: { order_id: orderId, order_no: orderNo, total_amount: finalTotal } 
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Ecommerce order error:", error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

exports.deleteOrder = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const prev = await client.query("SELECT * FROM ecommerce_orders WHERE id = $1", [id]);
        if (prev.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ success: false, message: "অর্ডার পাওয়া যায়নি।" });
        }
        // Restock if not cancelled
        if ((prev.rows[0].order_status || '').toLowerCase() !== 'cancelled') {
            const itemsRes = await client.query("SELECT * FROM ecommerce_order_items WHERE order_id = $1", [id]);
            for (let item of itemsRes.rows) {
                await client.query("UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2", [item.quantity, item.product_id]);
            }
        }
        await client.query("UPDATE ecommerce_orders SET deleted_at = NOW() WHERE id = $1", [id]);
        await client.query(`
            INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
            VALUES ('ecommerce_orders', $1, $2, $3, NOW())
        `, [id, `Order #${prev.rows[0].order_number || id}`, JSON.stringify(prev.rows[0])]).catch(() => null);

        await client.query("COMMIT");
        return res.status(200).json({ success: true, message: `অনলাইন অর্ডার #${prev.rows[0].order_number || id} ট্র্যাশে পাঠানো হয়েছে।` });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Delete order error:", error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};
