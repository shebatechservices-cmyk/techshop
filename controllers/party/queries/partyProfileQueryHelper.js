const pool = require('../../../config/db');
const { getCustomerSmartMetrics, getSupplierSmartMetrics, getStaffSmartMetrics } = require('./partySmartAnalyticsHelper');

async function getCustomerProfile(partyId) {
    const custRes = await pool.query('SELECT * FROM customers WHERE id = $1', [partyId]);
    if (!custRes.rows.length) return null;
    const customer = custRes.rows[0];

    const salesRes = await pool.query(`
        SELECT id, invoice_no, total_amount, paid_amount, due_amount, payment_status, created_at
        FROM sales 
        WHERE customer_id = $1 
        ORDER BY id DESC LIMIT 15
    `, [partyId]);

    const quotesRes = await pool.query(`
        SELECT id, quotation_no, total_amount, status, created_at
        FROM sales_quotations
        WHERE customer_id = $1
        ORDER BY id DESC LIMIT 10
    `, [partyId]);

    const txRes = await pool.query(`
        SELECT t.*, a.name AS account_name
        FROM account_transactions t
        LEFT JOIN payment_accounts a ON t.account_id = a.id
        WHERE (
            (t.source_type IN ('customer_bulk_due_collection', 'due_collection', 'wallet_deposit', 'wallet_withdrawal') AND t.source_id = $1::text)
            OR t.reference LIKE 'Customer: %(#' || $1::text || ')%'
            OR t.reference LIKE '%Customer ID: ' || $1::text || '%'
            OR (t.source_type = 'sale_due_collection' AND t.source_id IN (SELECT s.id::text FROM sales s WHERE s.customer_id = $1::int))
            OR (t.source_type IN ('pos_sale', 'sale_refund') AND EXISTS (SELECT 1 FROM sales s WHERE s.customer_id = $1::int AND (t.reference = s.invoice_no OR t.source_id = s.invoice_no)))
        )
        ORDER BY t.id DESC LIMIT 25
    `, [partyId]);

    const statsRes = await pool.query(`
        SELECT 
            COUNT(*) AS total_invoices,
            COALESCE(SUM(total_amount), 0) AS lifetime_purchases,
            COALESCE(SUM(paid_amount), 0) AS lifetime_paid,
            COALESCE(SUM(due_amount), 0) AS total_due
        FROM sales
        WHERE customer_id = $1
    `, [partyId]);

    const activityCount = parseInt(statsRes.rows[0].total_invoices) + quotesRes.rows.length + txRes.rows.length;
    const smart = await getCustomerSmartMetrics(partyId, statsRes.rows[0]);

    return {
        party_type: 'customer',
        profile: {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
            customer_type: customer.customer_type || 'Retail',
            balance: parseFloat(customer.receivable_balance || 0),
            loyalty_points: parseInt(customer.loyalty_points || 0),
            created_at: customer.created_at,
            activity_count: activityCount
        },
        stats: statsRes.rows[0],
        smart,
        sales: salesRes.rows,
        quotations: quotesRes.rows,
        transactions: txRes.rows
    };
}

async function getSupplierProfile(partyId) {
    const suppRes = await pool.query('SELECT * FROM suppliers WHERE id = $1', [partyId]);
    if (!suppRes.rows.length) return null;
    const supplier = suppRes.rows[0];

    const poRes = await pool.query(`
        SELECT id, po_number, total_cost, total_paid, total_due, status, created_at
        FROM purchase_orders 
        WHERE supplier_id = $1 
        ORDER BY id DESC LIMIT 15
    `, [partyId]);

    const quotesRes = await pool.query(`
        SELECT id, quotation_no, total_amount AS total_cost, status, created_at
        FROM purchase_quotations
        WHERE supplier_id = $1
        ORDER BY id DESC LIMIT 10
    `, [partyId]);

    const txRes = await pool.query(`
        SELECT t.*, a.name AS account_name
        FROM account_transactions t
        LEFT JOIN payment_accounts a ON t.account_id = a.id
        WHERE (
            (t.source_type IN ('supplier_payment', 'wallet_deposit', 'wallet_withdrawal') AND t.source_id = $1::text)
            OR t.reference LIKE 'Supplier: %(#' || $1::text || ')%'
            OR t.reference LIKE '%Supplier ID: ' || $1::text || '%'
            OR (t.source_type IN ('purchase_payment', 'purchase') AND EXISTS (SELECT 1 FROM purchase_orders po WHERE po.supplier_id = $1::int AND (t.reference = po.po_number OR t.source_id = po.po_number OR t.source_id = po.id::text)))
        )
        ORDER BY t.id DESC LIMIT 25
    `, [partyId]);

    const statsRes = await pool.query(`
        SELECT 
            COUNT(*) AS total_pos,
            COALESCE(SUM(total_cost), 0) AS lifetime_orders,
            COALESCE(SUM(total_paid), 0) AS lifetime_paid,
            COALESCE(SUM(total_due), 0) AS total_due
        FROM purchase_orders
        WHERE supplier_id = $1
    `, [partyId]);

    const activityCount = parseInt(statsRes.rows[0].total_pos) + quotesRes.rows.length + txRes.rows.length;
    const smart = await getSupplierSmartMetrics(partyId, statsRes.rows[0]);

    return {
        party_type: 'supplier',
        profile: {
            id: supplier.id,
            name: supplier.name,
            phone: supplier.phone || supplier.mobile,
            email: supplier.email,
            address: supplier.address,
            contact_person: supplier.contact_person || 'Vendor',
            balance: parseFloat(supplier.payable_balance || 0),
            created_at: supplier.created_at,
            activity_count: activityCount
        },
        stats: statsRes.rows[0],
        smart,
        purchase_orders: poRes.rows,
        quotations: quotesRes.rows,
        transactions: txRes.rows
    };
}

async function getStaffProfile(partyId) {
    const userRes = await pool.query(`
        SELECT u.id, u.name, u.phone, u.email, u.role_id, u.is_active, u.created_at, r.name AS role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1
    `, [partyId]);
    if (!userRes.rows.length) return null;
    const staff = userRes.rows[0];

    const salesRes = await pool.query(`
        SELECT id, invoice_no, total_amount, paid_amount, payment_status, created_at
        FROM sales
        WHERE sales_person = $1
        ORDER BY id DESC LIMIT 15
    `, [staff.name]);

    const statsRes = await pool.query(`
        SELECT 
            COUNT(*) AS total_sales,
            COALESCE(SUM(total_amount), 0) AS total_sales_volume
        FROM sales
        WHERE sales_person = $1
    `, [staff.name]);

    const smart = await getStaffSmartMetrics(partyId, staff.name);

    return {
        party_type: 'staff',
        profile: {
            id: staff.id,
            name: staff.name,
            phone: staff.phone,
            email: staff.email,
            role_id: staff.role_id,
            role_name: staff.role_name || 'Staff',
            is_active: staff.is_active,
            created_at: staff.created_at,
            balance: 0,
            activity_count: parseInt(statsRes.rows[0].total_sales)
        },
        stats: statsRes.rows[0],
        smart,
        sales: salesRes.rows
    };
}

module.exports = {
    getCustomerProfile,
    getSupplierProfile,
    getStaffProfile,
};
