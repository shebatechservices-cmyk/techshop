const pool = require('../../../config/db');

async function lookupSerialWarranty(query) {
    const serialSql = `
        SELECT 
            sis.serial_code,
            s.id AS sale_id,
            s.invoice_no AS invoice_no,
            s.sale_date,
            s.created_at AS sale_timestamp,
            COALESCE(c.name, 'Walk-in Customer') AS customer_name,
            COALESCE(c.phone, 'N/A') AS customer_phone,
            p.id AS product_id,
            p.name AS product_name,
            COALESCE(b.name, 'General') AS brand_name,
            COALESCE(p.warranty_months, 12) AS warranty_months,
            si.unit_price,
            pos.id AS purchase_serial_id,
            po.created_at AS purchase_date,
            sup.name AS supplier_name
        FROM sales_item_serials sis
        JOIN sales_items si ON si.id = sis.sales_item_id
        JOIN sales s ON s.id = si.sale_id
        JOIN products p ON p.id = si.product_id
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN customers c ON c.id = s.customer_id
        LEFT JOIN purchase_order_serials pos ON pos.serial_code = sis.serial_code
        LEFT JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
        LEFT JOIN purchase_orders po ON po.id = poi.purchase_order_id
        LEFT JOIN suppliers sup ON sup.id = po.supplier_id
        WHERE LOWER(sis.serial_code) = LOWER($1)
        ORDER BY s.id DESC
        LIMIT 1;
    `;

    const serialRes = await pool.query(serialSql, [query]);
    if (serialRes.rows.length === 0) return null;

    const row = serialRes.rows[0];
    const saleDate = new Date(row.sale_date || row.sale_timestamp || new Date());
    const months = parseInt(row.warranty_months, 10) || 12;
    const customerExpiry = new Date(saleDate);
    customerExpiry.setMonth(customerExpiry.getMonth() + months);
    customerExpiry.setDate(customerExpiry.getDate() + 60);

    const now = new Date();
    const isCustomerValid = now <= customerExpiry;
    const msDiff = customerExpiry.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));

    let vendorWarrantyText = '1 Year Standard Supplier Warranty';
    let isVendorValid = true;
    if (row.purchase_date) {
        const purchDate = new Date(row.purchase_date);
        const vendorExpiry = new Date(purchDate);
        vendorExpiry.setMonth(vendorExpiry.getMonth() + (months > 12 ? months : 24));
        vendorExpiry.setDate(vendorExpiry.getDate() + 60);
        isVendorValid = now <= vendorExpiry;
        const vDiffDays = Math.max(0, Math.ceil((vendorExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        vendorWarrantyText = isVendorValid
            ? `${vDiffDays} days remaining (Vendor: ${row.supplier_name || 'Brand Center'})`
            : 'Expired from Supplier';
    }

    const pastClaimsRes = await pool.query(
        `SELECT claim_no, status, issue_description, received_date, replacement_serial_code 
         FROM warranty_claims 
         WHERE LOWER(serial_code) = LOWER($1) 
         ORDER BY id DESC LIMIT 5`,
        [query]
    );

    return {
        match_type: 'SERIAL',
        data: {
            serial_code: row.serial_code,
            product_id: row.product_id,
            product_name: row.product_name,
            brand_name: row.brand_name,
            invoice_no: row.invoice_no,
            sale_date: row.sale_date,
            customer_name: row.customer_name,
            customer_phone: row.customer_phone,
            unit_price: row.unit_price,
            warranty_months: months,
            customer_warranty_expiry: customerExpiry.toISOString().split('T')[0],
            is_customer_warranty_valid: isCustomerValid,
            customer_days_remaining: daysRemaining,
            is_vendor_warranty_valid: isVendorValid,
            vendor_warranty_info: vendorWarrantyText,
            supplier_name: row.supplier_name || 'Authorized Importer',
            past_claims: pastClaimsRes.rows,
        },
    };
}

module.exports = {
    lookupSerialWarranty,
};
