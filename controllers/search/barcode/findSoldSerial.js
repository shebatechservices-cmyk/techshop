async function findSoldSerial(pool, code) {
    const soldSerialSql = `
        SELECT 
            sis.serial_code,
            p.id AS product_id,
            p.name AS product_name,
            p.sku,
            p.barcode,
            COALESCE(p.stock, 0) AS stock,
            COALESCE(p.purchase_price, 0) AS cost_price,
            COALESCE(p.selling_price, 0) AS sale_price,
            COALESCE(p.warranty_months, 12) AS warranty_months,
            b.name AS brand_name,
            c.name AS category_name,
            s.id AS sale_id,
            s.invoice_no,
            s.sale_date,
            s.created_at AS sale_created_at,
            s.payment_status,
            COALESCE(cust.name, 'Walk-in Customer') AS customer_name,
            COALESCE(cust.phone, 'N/A') AS customer_phone,
            si.unit_price AS sold_unit_price,
            si.quantity AS sold_quantity,
            po.id AS po_id,
            po.po_number,
            po.created_at AS purchase_date,
            poi.cost_price AS purchase_cost_price,
            poi.supplier_warranty_expire_date,
            COALESCE(sup.name, 'Authorized Supplier') AS supplier_name,
            COALESCE(sup.phone, 'N/A') AS supplier_phone
        FROM sales_item_serials sis
        JOIN sales_items si ON si.id = sis.sales_item_id
        JOIN sales s ON s.id = si.sale_id
        JOIN products p ON p.id = si.product_id
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN customers cust ON cust.id = s.customer_id
        LEFT JOIN purchase_order_serials pos ON LOWER(pos.serial_code) = LOWER(sis.serial_code)
        LEFT JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
        LEFT JOIN purchase_orders po ON po.id = poi.purchase_order_id
        LEFT JOIN suppliers sup ON sup.id = po.supplier_id
        WHERE LOWER(sis.serial_code) = LOWER($1)
        ORDER BY s.id DESC
        LIMIT 1;
    `;
    const soldRes = await pool.query(soldSerialSql, [code]);
    if (soldRes.rows.length === 0) return null;

    const row = soldRes.rows[0];
    const saleDate = new Date(row.sale_date || row.sale_created_at || new Date());
    const months = parseInt(row.warranty_months, 10) || 12;
    const customerExpiry = new Date(saleDate);
    customerExpiry.setMonth(customerExpiry.getMonth() + months);
    customerExpiry.setDate(customerExpiry.getDate() + 60);

    const now = new Date();
    const isCustomerValid = now <= customerExpiry;
    const daysRemaining = Math.max(0, Math.ceil((customerExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Supplier warranty
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

    // Past claims
    let claims = [];
    try {
        const claimsRes = await pool.query(
            `SELECT claim_no, status, issue_description, received_date, replacement_serial_code 
             FROM warranty_claims 
             WHERE LOWER(serial_code) = LOWER($1) 
             ORDER BY id DESC LIMIT 5`,
            [code]
        );
        claims = claimsRes.rows;
    } catch (err) {
        console.warn('Claims query fallback:', err.message);
    }

    // Returns
    let returns = [];
    try {
        const returnsRes = await pool.query(
            `SELECT return_no, return_qty, refund_amount, return_reason, created_at 
             FROM product_returns 
             WHERE LOWER(serial_code) = LOWER($1) 
             ORDER BY id DESC LIMIT 5`,
            [code]
        );
        returns = returnsRes.rows;
    } catch (err) {
        console.warn('Returns query fallback:', err.message);
    }

    return {
        success: true,
        match_type: 'SERIAL_SOLD',
        scanned_code: code,
        data: {
            serial_code: row.serial_code,
            status: 'Sold',
            product: {
                id: row.product_id,
                name: row.product_name,
                brand_name: row.brand_name,
                category_name: row.category_name,
                sku: row.sku,
                barcode: row.barcode,
                stock: row.stock,
                cost_price: row.cost_price,
                sale_price: row.sale_price,
            },
            purchase: {
                po_id: row.po_id,
                po_number: row.po_number || 'Initial Inflow / Purchase',
                purchase_date: row.purchase_date,
                cost_price: row.purchase_cost_price || row.cost_price,
                supplier_name: row.supplier_name,
                supplier_phone: row.supplier_phone,
                supplier_warranty_expire_date: supplierExpiryStr,
            },
            inventory: {
                stock: row.stock,
                unit_status: 'Sold to Customer',
                cost_price: row.cost_price,
                sale_price: row.sale_price,
            },
            sale: {
                sale_id: row.sale_id,
                invoice_no: row.invoice_no,
                sale_date: row.sale_date,
                customer_name: row.customer_name,
                customer_phone: row.customer_phone,
                unit_price: row.sold_unit_price || row.sale_price,
                payment_status: row.payment_status || 'paid',
            },
            warranty: {
                warranty_months: months,
                customer_warranty_expiry: customerExpiry.toISOString().split('T')[0],
                is_customer_warranty_valid: isCustomerValid,
                customer_days_remaining: daysRemaining,
                grace_days: 60,
                is_supplier_warranty_valid: isSupplierValid,
                supplier_days_remaining: supplierDaysRemaining,
                supplier_warranty_expiry: supplierExpiryStr,
                supplier_name: row.supplier_name,
                claims,
                returns,
            },
        },
    };
}

module.exports = { findSoldSerial };
