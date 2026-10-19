async function findProductBarcode(pool, code) {
    const prodSql = `
        SELECT 
            p.id AS product_id,
            p.name AS product_name,
            p.sku,
            p.barcode,
            COALESCE(p.stock, 0) AS stock,
            COALESCE(p.min_stock, 5) AS min_stock,
            COALESCE(p.purchase_price, 0) AS cost_price,
            COALESCE(p.selling_price, 0) AS sale_price,
            COALESCE(p.warranty_months, 12) AS warranty_months,
            p.supplier_warranty_expire_date,
            b.name AS brand_name,
            c.name AS category_name
        FROM products p
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.deleted_at IS NULL AND (LOWER(p.barcode) = LOWER($1) OR LOWER(p.sku) = LOWER($1))
        LIMIT 1;
    `;
    const prodRes = await pool.query(prodSql, [code]);
    if (prodRes.rows.length === 0) return null;

    const p = prodRes.rows[0];

    // Latest Purchase
    const latestPoRes = await pool.query(
        `SELECT po.id AS po_id, po.po_number, po.created_at AS purchase_date, 
                poi.cost_price, poi.quantity, poi.supplier_warranty_expire_date,
                COALESCE(sup.name, 'Supplier') AS supplier_name,
                COALESCE(sup.phone, 'N/A') AS supplier_phone
         FROM purchase_order_items poi
         JOIN purchase_orders po ON po.id = poi.purchase_order_id
         LEFT JOIN suppliers sup ON sup.id = po.supplier_id
         WHERE poi.product_id = $1 AND po.deleted_at IS NULL
         ORDER BY po.id DESC LIMIT 1`,
        [p.product_id]
    );

    // Latest Sale
    const latestSaleRes = await pool.query(
        `SELECT s.id AS sale_id, s.invoice_no, s.sale_date, s.payment_status,
                si.unit_price, si.quantity,
                COALESCE(cust.name, 'Customer') AS customer_name,
                COALESCE(cust.phone, 'N/A') AS customer_phone
         FROM sales_items si
         JOIN sales s ON s.id = si.sale_id
         LEFT JOIN customers cust ON cust.id = s.customer_id
         WHERE si.product_id = $1 AND s.deleted_at IS NULL
         ORDER BY s.id DESC LIMIT 1`,
        [p.product_id]
    );

    // Claims and Returns
    let claims = [];
    try {
        const claimsRes = await pool.query(
            `SELECT claim_no, status, issue_description, received_date 
             FROM warranty_claims 
             WHERE product_id = $1 AND deleted_at IS NULL 
             ORDER BY id DESC LIMIT 5`,
            [p.product_id]
        );
        claims = claimsRes.rows;
    } catch (err) {}

    let returns = [];
    try {
        const returnsRes = await pool.query(
            `SELECT return_no, return_qty, refund_amount, return_reason, created_at 
             FROM product_returns 
             WHERE product_id = $1 AND deleted_at IS NULL 
             ORDER BY id DESC LIMIT 5`,
            [p.product_id]
        );
        returns = returnsRes.rows;
    } catch (err) {}

    const latestPo = latestPoRes.rows[0] || null;
    const latestSale = latestSaleRes.rows[0] || null;

    return {
        success: true,
        match_type: 'PRODUCT_BARCODE',
        scanned_code: code,
        data: {
            serial_code: null,
            status: Number(p.stock) > 0 ? 'In Stock' : 'Out of Stock',
            product: {
                id: p.product_id,
                name: p.product_name,
                brand_name: p.brand_name,
                category_name: p.category_name,
                sku: p.sku,
                barcode: p.barcode,
                stock: p.stock,
                cost_price: p.cost_price,
                sale_price: p.sale_price,
            },
            purchase: latestPo ? {
                po_id: latestPo.po_id,
                po_number: latestPo.po_number,
                purchase_date: latestPo.purchase_date,
                cost_price: latestPo.cost_price,
                supplier_name: latestPo.supplier_name,
                supplier_phone: latestPo.supplier_phone,
                supplier_warranty_expire_date: latestPo.supplier_warranty_expire_date,
            } : null,
            inventory: {
                stock: p.stock,
                unit_status: Number(p.stock) > 0 ? 'In Stock' : 'Out of Stock',
                cost_price: p.cost_price,
                sale_price: p.sale_price,
            },
            sale: latestSale ? {
                sale_id: latestSale.sale_id,
                invoice_no: latestSale.invoice_no,
                sale_date: latestSale.sale_date,
                customer_name: latestSale.customer_name,
                customer_phone: latestSale.customer_phone,
                unit_price: latestSale.unit_price,
                payment_status: latestSale.payment_status,
            } : null,
            warranty: {
                warranty_months: p.warranty_months,
                customer_warranty_info: `${p.warranty_months} Months Customer Warranty (begins on invoice date)`,
                claims,
                returns,
            },
        },
    };
}

module.exports = { findProductBarcode };
