const pool = require("../config/db");

let tableMigrated = false;
async function ensureEcommerceColumns() {
    if (tableMigrated) return;
    try {
        await pool.query(`
            ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS order_no VARCHAR(50);
            ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC(10,2) DEFAULT 0;
            ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid';
            ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS courier_name VARCHAR(100);
            ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(100);
            ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS customer_notes TEXT;
            ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cod';
        `);
        tableMigrated = true;
    } catch (e) {
        console.warn("Ecommerce columns check/migration:", e.message);
    }
}

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

exports.getOrders = async (req, res) => {
    try {
        await ensureEcommerceColumns();
        const query = `
            SELECT 
                o.*, 
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', i.id,
                            'product_id', i.product_id,
                            'quantity', i.quantity,
                            'unit_price', i.unit_price,
                            'product_name', p.name,
                            'sku', p.sku,
                            'barcode', p.barcode,
                            'image', COALESCE(p.image_url, p.feature_image, '')
                        )
                    ) FILTER (WHERE i.id IS NOT NULL), 
                    '[]'
                ) AS items 
            FROM ecommerce_orders o 
            LEFT JOIN ecommerce_order_items i ON o.id = i.order_id 
            LEFT JOIN products p ON i.product_id = p.id
            WHERE o.deleted_at IS NULL
            GROUP BY o.id 
            ORDER BY o.id DESC;
        `;
        const result = await pool.query(query);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Get ecommerce orders error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

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

exports.trackOrder = async (req, res) => {
    const { query } = req.params;
    if (!query) {
        return res.status(400).json({ success: false, message: "অর্ডার নম্বর অথবা মোবাইল নম্বর দিন।" });
    }
    try {
        await ensureEcommerceColumns();
        const cleanQuery = query.trim();
        const result = await pool.query(`
            SELECT 
                o.id,
                o.order_no,
                o.customer_name,
                o.customer_phone,
                o.shipping_address,
                o.delivery_charge,
                o.total_amount,
                o.payment_status,
                o.payment_method,
                o.order_status,
                o.courier_name,
                o.tracking_code,
                o.customer_notes,
                o.created_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'product_id', i.product_id,
                            'quantity', i.quantity,
                            'unit_price', i.unit_price,
                            'product_name', p.name,
                            'sku', p.sku,
                            'image', COALESCE(p.image_url, p.feature_image, '')
                        )
                    ) FILTER (WHERE i.id IS NOT NULL), 
                    '[]'
                ) AS items 
            FROM ecommerce_orders o 
            LEFT JOIN ecommerce_order_items i ON o.id = i.order_id 
            LEFT JOIN products p ON i.product_id = p.id
            WHERE LOWER(COALESCE(o.order_no, '')) = LOWER($1) 
               OR REPLACE(o.customer_phone, ' ', '') = REPLACE($1, ' ', '')
            GROUP BY o.id 
            ORDER BY o.id DESC;
        `, [cleanQuery]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "কোনো অনলাইন অর্ডার পাওয়া যায়নি। অনুগ্রহ করে সঠিক অর্ডার নম্বর (e.g. ECOM-XXXXXX) বা মোবাইল নম্বর দিন।" 
            });
        }

        return res.status(200).json({ 
            success: true, 
            data: result.rows 
        });
    } catch (error) {
        console.error("Track order error:", error);
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