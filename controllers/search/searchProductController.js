const pool = require('../../config/db');

const formatProductResponse = (row) => {
    if (!row) return row;
    const isSerial = Boolean(
        row.is_serial_required ||
        row.is_serial_tracked ||
        row.tracks_serial ||
        row.isSerialRequired
    );
    const isWarranty = Boolean(
        row.is_warranty_required ||
        row.isWarrantyRequired ||
        (Number(row.warranty_months || 0) > 0)
    );
    const costPrice = Number(row.cost_price || row.costPrice || row.last_purchase_price || row.purchase_price || 0);
    const salePrice = Number(row.sale_price || row.salePrice || row.batch_sale_price || row.selling_price || row.mrp || costPrice);
    return {
        ...row,
        cost_price: costPrice,
        costPrice: costPrice,
        sale_price: salePrice,
        salePrice: salePrice,
        selling_price: salePrice,
        purchase_price: costPrice,
        isSerialRequired: isSerial,
        is_serial_required: isSerial,
        is_serial_tracked: isSerial,
        tracks_serial: isSerial,
        isWarrantyRequired: isWarranty,
        is_warranty_required: isWarranty,
    };
};

const searchProduct = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ success: false, message: 'সার্চ করার জন্য কিছু লিখুন' });
        
        let result;
        try {
            // চেষ্টা ১: purchase_orders এবং sales টেবিল থেকে সম্পূর্ণ হিস্ট্রি সহ
            const query = `
                SELECT p.*, 
                COALESCE((
                    SELECT json_agg(json_build_object('supplier', s.name, 'date', po.created_at, 'qty', poi.quantity, 'price', poi.cost_price)) 
                    FROM purchase_order_items poi 
                    JOIN purchase_orders po ON poi.purchase_order_id = po.id 
                    JOIN suppliers s ON po.supplier_id = s.id 
                    WHERE poi.product_id = p.id
                ), '[]') as purchase_history, 
                COALESCE((
                    SELECT json_agg(json_build_object('customer', c.name, 'date', sa.created_at, 'qty', si.quantity, 'price', si.unit_price)) 
                    FROM sales_items si 
                    JOIN sales sa ON (si.sale_id = sa.id) 
                    JOIN customers c ON sa.customer_id = c.id 
                    WHERE si.product_id = p.id
                ), '[]') as sales_history 
                FROM products p 
                WHERE (p.barcode = $1 OR p.sku = $1 OR p.name ILIKE $2) AND p.deleted_at IS NULL
                ORDER BY p.id DESC;
            `;
            result = await pool.query(query, [q, `%${q}%`]);
        } catch (subErr) {
            console.warn('Subquery search fallback:', subErr.message);
            // ফলব্যাক: যদি হিস্ট্রি টেবিল না থাকে, সাধারণ প্রোডাক্ট সার্চ
            result = await pool.query(
                `SELECT p.*, '[]'::json as purchase_history, '[]'::json as sales_history 
                 FROM products p 
                 WHERE (p.barcode = $1 OR p.sku = $1 OR p.name ILIKE $2) AND p.deleted_at IS NULL
                 ORDER BY p.id DESC;`,
                [q, `%${q}%`]
            );
        }
        
        return res.status(200).json({ success: true, data: result.rows.map(formatProductResponse) });
    } catch (error) {
        console.error('searchProduct error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    formatProductResponse,
    searchProduct,
};
