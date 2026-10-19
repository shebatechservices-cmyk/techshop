async function findInventorySerial(pool, code) {
    const unsoldSerialSql = `
        SELECT 
            pos.serial_code,
            p.id AS product_id,
            p.name AS product_name,
            p.sku,
            p.barcode,
            COALESCE(p.stock, 0) AS stock,
            COALESCE(poi.final_cost, poi.cost_price, p.purchase_price, 0) AS cost_price,
            COALESCE(poi.final_sale_price, poi.sale_price, p.selling_price, 0) AS sale_price,
            COALESCE(p.warranty_months, 12) AS warranty_months,
            b.name AS brand_name,
            c.name AS category_name,
            po.id AS po_id,
            po.po_number,
            po.created_at AS purchase_date,
            COALESCE(poi.final_cost, poi.cost_price, p.purchase_price, 0) AS purchase_cost_price,
            COALESCE(poi.final_sale_price, poi.sale_price, p.selling_price, 0) AS batch_sale_price,
            poi.supplier_warranty_expire_date,
            COALESCE(sup.name, 'Supplier') AS supplier_name,
            COALESCE(sup.phone, 'N/A') AS supplier_phone
        FROM purchase_order_serials pos
        JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
        JOIN purchase_orders po ON po.id = poi.purchase_order_id
        JOIN products p ON p.id = poi.product_id
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN suppliers sup ON sup.id = po.supplier_id
        WHERE LOWER(pos.serial_code) = LOWER($1)
        LIMIT 1;
    `;
    const unsoldRes = await pool.query(unsoldSerialSql, [code]);
    if (unsoldRes.rows.length === 0) return null;

    const row = unsoldRes.rows[0];
    const now = new Date();
    const months = parseInt(row.warranty_months, 10) || 12;

    let isSupplierValid = true;
    let supplierExpiryStr = null;
    let supplierDaysRemaining = 0;
    if (row.supplier_warranty_expire_date) {
        const sExp = new Date(row.supplier_warranty_expire_date);
        supplierExpiryStr = sExp.toISOString().split('T')[0];
        isSupplierValid = now <= sExp;
        supplierDaysRemaining = Math.max(0, Math.ceil((sExp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    } else if (row.purchase_date) {
        const pDate = new Date(row.purchase_date);
        const sExp = new Date(pDate);
        sExp.setMonth(sExp.getMonth() + Math.max(months, 12) + 2);
        supplierExpiryStr = sExp.toISOString().split('T')[0];
        isSupplierValid = now <= sExp;
        supplierDaysRemaining = Math.max(0, Math.ceil((sExp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    return {
        success: true,
        match_type: 'SERIAL_INVENTORY',
        scanned_code: code,
        data: {
            serial_code: row.serial_code,
            status: 'In Stock',
            product: {
                id: row.product_id,
                name: row.product_name,
                brand_name: row.brand_name,
                category_name: row.category_name,
                sku: row.sku,
                barcode: row.barcode,
                stock: row.stock,
                cost_price: row.purchase_cost_price || row.cost_price,
                sale_price: row.sale_price,
            },
            purchase: {
                po_id: row.po_id,
                po_number: row.po_number,
                purchase_date: row.purchase_date,
                cost_price: row.purchase_cost_price || row.cost_price,
                supplier_name: row.supplier_name,
                supplier_phone: row.supplier_phone,
                supplier_warranty_expire_date: supplierExpiryStr,
            },
            inventory: {
                stock: row.stock,
                unit_status: 'Available in Current Inventory',
                cost_price: row.purchase_cost_price || row.cost_price,
                sale_price: row.sale_price,
            },
            sale: null,
            warranty: {
                warranty_months: months,
                customer_warranty_info: 'Unit in shop stock. Customer warranty begins upon sale invoice.',
                is_customer_warranty_valid: false,
                is_supplier_warranty_valid: isSupplierValid,
                supplier_days_remaining: supplierDaysRemaining,
                supplier_warranty_expiry: supplierExpiryStr,
                supplier_name: row.supplier_name,
                claims: [],
                returns: [],
            },
        },
    };
}

module.exports = { findInventorySerial };
