const pool = require("../../config/db");
const { ensureEcommerceColumns } = require("./ecommerceSchema");

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
