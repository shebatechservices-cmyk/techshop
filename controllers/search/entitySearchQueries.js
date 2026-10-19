const pool = require('../../config/db');

async function searchEntities(searchTerm, isTechnician) {
    const [salesRes, sqRes, custRes, poRes, pqRes, supRes] = await Promise.all([
        // 1. Sales Invoices
        isTechnician
            ? Promise.resolve({ rows: [] })
            : pool.query(
                `SELECT s.id, s.invoice_no, s.total_amount, s.paid_amount, s.due_amount, 
                        s.payment_status, s.sale_date, s.created_at,
                        COALESCE(c.name, 'Customer') AS customer_name, c.phone AS customer_phone
                 FROM sales s
                 LEFT JOIN customers c ON s.customer_id = c.id
                 WHERE s.invoice_no ILIKE $1 
                    OR c.name ILIKE $1 
                    OR c.phone ILIKE $1 
                    OR s.sales_person ILIKE $1
                 ORDER BY s.id DESC LIMIT 5`,
                [searchTerm]
            ).catch((err) => { console.error('Global search sales error:', err.message); return { rows: [] }; }),

        // 2. Sale Quotations
        isTechnician
            ? Promise.resolve({ rows: [] })
            : pool.query(
                `SELECT sq.id, sq.quotation_no, sq.customer_name, sq.customer_phone, 
                        sq.total_amount, sq.status, sq.created_at
                 FROM sales_quotations sq
                 WHERE sq.quotation_no ILIKE $1 
                    OR sq.customer_name ILIKE $1 
                    OR sq.customer_phone ILIKE $1
                 ORDER BY sq.id DESC LIMIT 5`,
                [searchTerm]
            ).catch((err) => { console.error('Global search sale_quotations error:', err.message); return { rows: [] }; }),

        // 3. Customers
        isTechnician
            ? Promise.resolve({ rows: [] })
            : pool.query(
                `SELECT c.id, c.name, c.phone, c.email, c.address, c.customer_type, 
                        c.receivable_balance, c.loyalty_points
                 FROM customers c
                 WHERE c.name ILIKE $1 
                    OR c.phone ILIKE $1 
                    OR c.email ILIKE $1 
                    OR c.address ILIKE $1
                 ORDER BY c.id DESC LIMIT 5`,
                [searchTerm]
            ).catch((err) => { console.error('Global search customers error:', err.message); return { rows: [] }; }),

        // 4. Purchase Orders
        isTechnician
            ? Promise.resolve({ rows: [] })
            : pool.query(
                `SELECT po.id, po.po_number, po.total_cost, po.total_paid, po.total_due, 
                        po.transaction_reference, po.status, po.created_at,
                        COALESCE(s.name, 'Supplier') AS supplier_name, s.phone AS supplier_phone
                 FROM purchase_orders po
                 LEFT JOIN suppliers s ON po.supplier_id = s.id
                 WHERE po.po_number ILIKE $1 
                    OR po.transaction_reference ILIKE $1 
                    OR s.name ILIKE $1 
                    OR s.phone ILIKE $1
                 ORDER BY po.id DESC LIMIT 5`,
                [searchTerm]
            ).catch((err) => { console.error('Global search purchase_orders error:', err.message); return { rows: [] }; }),

        // 5. Purchase Quotations
        isTechnician
            ? Promise.resolve({ rows: [] })
            : pool.query(
                `SELECT pq.id, pq.quotation_no, pq.reference, pq.total_amount, pq.status, pq.created_at,
                        COALESCE(s.name, 'Supplier') AS supplier_name
                 FROM purchase_quotations pq
                 LEFT JOIN suppliers s ON pq.supplier_id = s.id
                 WHERE pq.quotation_no ILIKE $1 
                    OR pq.reference ILIKE $1 
                    OR s.name ILIKE $1
                 ORDER BY pq.id DESC LIMIT 5`,
                [searchTerm]
            ).catch((err) => { console.error('Global search purchase_quotations error:', err.message); return { rows: [] }; }),

        // 6. Suppliers
        isTechnician
            ? Promise.resolve({ rows: [] })
            : pool.query(
                `SELECT sup.id, sup.name, sup.contact_person, sup.phone, sup.mobile, 
                        sup.email, sup.payable_balance
                 FROM suppliers sup
                 WHERE sup.name ILIKE $1 
                    OR sup.contact_person ILIKE $1 
                    OR sup.phone ILIKE $1 
                    OR sup.mobile ILIKE $1
                 ORDER BY sup.id DESC LIMIT 5`,
                [searchTerm]
            ).catch((err) => { console.error('Global search suppliers error:', err.message); return { rows: [] }; }),
    ]);

    return {
        sales: salesRes.rows,
        sale_quotations: sqRes.rows,
        customers: custRes.rows,
        purchases: poRes.rows,
        purchase_quotations: pqRes.rows,
        suppliers: supRes.rows,
    };
}

module.exports = { searchEntities };
