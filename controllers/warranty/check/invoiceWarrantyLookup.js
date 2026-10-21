const pool = require('../../../config/db');

async function lookupInvoiceWarranty(query) {
    const invoiceSql = `
        SELECT 
            s.id AS sale_id,
            s.invoice_no AS invoice_no,
            s.sale_date,
            s.created_at AS sale_timestamp,
            COALESCE(c.name, 'Walk-in Customer') AS customer_name,
            COALESCE(c.phone, 'N/A') AS customer_phone,
            s.total_amount
        FROM sales s
        LEFT JOIN customers c ON c.id = s.customer_id
        WHERE LOWER(s.invoice_no) = LOWER($1)
        LIMIT 1;
    `;
    const invoiceRes = await pool.query(invoiceSql, [query]);
    if (invoiceRes.rows.length === 0) return null;

    const sale = invoiceRes.rows[0];
    const itemsRes = await pool.query(`
        SELECT si.id, si.product_id, COALESCE(p.name, 'Product') AS product_name, 
               si.quantity, si.unit_price, COALESCE(p.warranty_months, 12) AS warranty_months
        FROM sales_items si
        LEFT JOIN products p ON p.id = si.product_id
        WHERE si.sale_id = $1
    `, [sale.sale_id]);

    const itemIds = itemsRes.rows.map((it) => it.id);
    const serialsMap = {};
    if (itemIds.length > 0) {
        const sRes = await pool.query(
            `SELECT sales_item_id, serial_code FROM sales_item_serials WHERE sales_item_id = ANY($1::int[])`,
            [itemIds]
        );
        sRes.rows.forEach((s) => {
            if (!serialsMap[s.sales_item_id]) serialsMap[s.sales_item_id] = [];
            serialsMap[s.sales_item_id].push(s.serial_code);
        });
    }

    const saleDate = new Date(sale.sale_date || sale.sale_timestamp || new Date());
    const itemsWithWarranty = itemsRes.rows.map((item) => {
        const months = parseInt(item.warranty_months, 10) || 12;
        const expiry = new Date(saleDate);
        expiry.setMonth(expiry.getMonth() + months);
        expiry.setDate(expiry.getDate() + 60);
        const isCustValid = new Date() <= expiry;
        const daysRemaining = Math.max(0, Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
        return {
            ...item,
            serials: serialsMap[item.id] || [],
            customer_warranty_expiry: expiry.toISOString().split('T')[0],
            is_customer_warranty_valid: isCustValid,
            customer_days_remaining: daysRemaining,
        };
    });

    return {
        match_type: 'INVOICE',
        data: {
            invoice_no: sale.invoice_no,
            sale_date: sale.sale_date,
            customer_name: sale.customer_name,
            customer_phone: sale.customer_phone,
            total_amount: sale.total_amount,
            items: itemsWithWarranty,
        },
    };
}

async function lookupInventoryStockWarranty(query) {
    const unassignedSql = `
        SELECT pos.serial_code, p.name AS product_name, po.created_at AS order_date, sup.name AS supplier_name, p.id AS product_id
        FROM purchase_order_serials pos
        JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
        JOIN purchase_orders po ON po.id = poi.purchase_order_id
        JOIN products p ON p.id = poi.product_id
        LEFT JOIN suppliers sup ON sup.id = po.supplier_id
        WHERE LOWER(pos.serial_code) = LOWER($1)
        LIMIT 1;
    `;
    const unassignedRes = await pool.query(unassignedSql, [query]);
    if (unassignedRes.rows.length === 0) return null;

    const un = unassignedRes.rows[0];
    return {
        match_type: 'INVENTORY_STOCK',
        data: {
            serial_code: un.serial_code,
            product_id: un.product_id,
            product_name: un.product_name,
            invoice_no: 'Unsold (In Current Shop Inventory)',
            sale_date: null,
            customer_name: 'In Stock / Not yet sold',
            customer_phone: 'N/A',
            is_customer_warranty_valid: false,
            is_vendor_warranty_valid: true,
            vendor_warranty_info: `Purchased on ${new Date(un.order_date).toISOString().split('T')[0]} from ${un.supplier_name || 'Vendor'}`,
            supplier_name: un.supplier_name,
        },
    };
}

module.exports = {
    lookupInvoiceWarranty,
    lookupInventoryStockWarranty,
};
