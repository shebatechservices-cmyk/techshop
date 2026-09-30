const pool = require('../../config/db');

// 1. Get Serial & Warranty details for a specific product
const getProductWarranty = async (req, res) => {
    try {
        const { id } = req.params;
        const productRes = await pool.query(`
            SELECT p.id, p.name, p.sku, p.barcode, p.warranty_months, p.supplier_warranty_expire_date,
                   b.name AS brand_name, m.name AS model_name, s.name AS series_name
            FROM products p
            LEFT JOIN brands b ON b.id = p.brand_id
            LEFT JOIN models m ON m.id = p.model_id
            LEFT JOIN series s ON s.id = p.series_id
            WHERE p.id = $1
        `, [id]);

        if (productRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const product = productRes.rows[0];
        const compositeParts = [product.brand_name, product.name, product.model_name, product.series_name]
            .filter(Boolean)
            .filter((val, idx, arr) => arr.indexOf(val) === idx);
        product.composite_name = compositeParts.join(' ');

        // Query all serials ever purchased for this product
        const serialsRes = await pool.query(`
            SELECT 
                pos.id AS serial_id,
                pos.serial_code,
                COALESCE(poi.warranty_months, p.warranty_months, 0) AS warranty_months,
                poi.expected_date,
                poi.supplier_warranty_expire_date,
                poi.cost_price,
                poi.final_sale_price,
                po.po_number,
                po.created_at AS purchase_date,
                sup.name AS supplier_name,
                sup.phone AS supplier_phone,
                sis.id AS sold_serial_id,
                si.invoice_no AS sale_invoice_no,
                si.created_at AS sale_date,
                CASE 
                    WHEN sis.id IS NOT NULL THEN 'Sold'
                    ELSE 'In Stock'
                END AS status
            FROM purchase_order_serials pos
            JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
            JOIN purchase_orders po ON po.id = poi.purchase_order_id
            JOIN products p ON p.id = poi.product_id
            LEFT JOIN suppliers sup ON sup.id = po.supplier_id
            LEFT JOIN sales_item_serials sis ON LOWER(TRIM(sis.serial_code)) = LOWER(TRIM(pos.serial_code))
            LEFT JOIN sales_items si_item ON si_item.id = sis.sales_item_id
            LEFT JOIN sales si ON si.id = si_item.sale_id AND si.deleted_at IS NULL
            LEFT JOIN sales_invoices sinv ON sinv.id = si_item.sales_invoice_id
            WHERE poi.product_id = $1
              AND po.deleted_at IS NULL
            ORDER BY pos.id DESC
        `, [id]);

        const today = new Date();
        const enrichedSerials = serialsRes.rows.map((row) => {
            const purchaseDateRaw = row.purchase_date || row.expected_date;
            let agingDays = 0;
            if (purchaseDateRaw) {
                const pDate = new Date(purchaseDateRaw);
                if (!isNaN(pDate.getTime())) {
                    const diffMs = today.getTime() - pDate.getTime();
                    agingDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
                }
            }

            let expDate = row.supplier_warranty_expire_date;
            const wMonths = Number(row.warranty_months || 0);
            if (!expDate && purchaseDateRaw && wMonths > 0) {
                const pDate = new Date(purchaseDateRaw);
                if (!isNaN(pDate.getTime())) {
                    const d = new Date(pDate);
                    d.setMonth(d.getMonth() + wMonths);
                    expDate = d.toISOString().split('T')[0];
                }
            }

            return {
                ...row,
                aging_days: agingDays,
                is_aged_60_plus: agingDays >= 60,
                supplier_warranty_expire_date: expDate,
            };
        });

        return res.status(200).json({
            success: true,
            product,
            serials: enrichedSerials,
        });
    } catch (error) {
        console.error('getProductWarranty error:', error);
        return res.status(500).json({ success: false, error: 'Failed to retrieve warranty details' });
    }
};

// 2. Check if serial/barcode exists in inventory
const checkSerial = async (req, res) => {
    try {
        const serial = String(req.query.serial || '').trim();
        const excludePoId = req.query.exclude_po_id ? parseInt(req.query.exclude_po_id, 10) : null;
        if (!serial) {
            return res.status(400).json({ exists: false, error: 'Serial parameter is required' });
        }

        let query = `
            SELECT 
                pos.serial_code,
                poi.purchase_order_id,
                po.po_number,
                po.created_at,
                p.name AS product_name,
                s.name AS supplier_name
            FROM purchase_order_serials pos
            JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
            JOIN purchase_orders po ON po.id = poi.purchase_order_id
            JOIN products p ON p.id = poi.product_id
            LEFT JOIN suppliers s ON s.id = po.supplier_id
            WHERE LOWER(TRIM(pos.serial_code)) = LOWER(TRIM($1))
              AND po.deleted_at IS NULL
        `;
        const params = [serial];
        if (excludePoId && !isNaN(excludePoId)) {
            query += ` AND po.id != $2`;
            params.push(excludePoId);
        }
        query += ` LIMIT 1`;

        const result = await pool.query(query, params);
        if (result.rows.length > 0) {
            const row = result.rows[0];
            return res.status(200).json({
                exists: true,
                message: `Serial/Barcode "${serial}" already exists in Inventory (PO: ${row.po_number || 'N/A'}, Product: ${row.product_name || 'N/A'})`,
                details: row,
            });
        }

        return res.status(200).json({
            exists: false,
            message: 'Serial/Barcode is available',
        });
    } catch (error) {
        console.error('checkSerial inventory error:', error);
        return res.status(500).json({ exists: false, error: error.message });
    }
};

module.exports = {
    getProductWarranty,
    checkSerial,
};
