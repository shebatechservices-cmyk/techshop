const pool = require('../../config/db');

async function fetchFinancialCoreData(from, to) {
    const salesSummaryRes = await pool.query(`
        SELECT 
            COUNT(*) AS total_invoices,
            COALESCE(SUM(total_amount), 0) AS gross_revenue,
            COALESCE(SUM(paid_amount), 0) AS total_collected,
            COALESCE(SUM(due_amount), 0) AS total_due_given,
            COALESCE(SUM(discount), 0) AS total_discounts,
            COALESCE(SUM(vat), 0) AS total_tax
        FROM sales
        WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2;
    `, [from, to]);

    const cogsRes = await pool.query(`
        SELECT 
            COALESCE(SUM(
                si.quantity * CASE 
                    WHEN COALESCE(si.cost_price, 0) > 0 THEN si.cost_price 
                    ELSE COALESCE(p.purchase_price, 0) 
                END
            ), 0) AS cogs,
            COALESCE(SUM(si.quantity), 0) AS total_units_sold
        FROM sales_items si
        JOIN sales s ON s.id = si.sale_id
        LEFT JOIN products p ON p.id = si.product_id
        WHERE DATE(s.created_at) >= $1 AND DATE(s.created_at) <= $2;
    `, [from, to]);

    const expensesRes = await pool.query(`
        SELECT 
            COALESCE(SUM(amount), 0) AS total_operating_expenses,
            COUNT(*) AS total_expense_count
        FROM account_transactions
        WHERE type IN ('expense', 'withdraw')
          AND DATE(created_at) >= $1 AND DATE(created_at) <= $2;
    `, [from, to]);

    const purchasesRes = await pool.query(`
        SELECT 
            COUNT(*) AS total_pos,
            COALESCE(SUM(total_cost), 0) AS total_purchased,
            COALESCE(SUM(total_paid), 0) AS total_purchase_paid,
            COALESCE(SUM(total_due), 0) AS total_purchase_due
        FROM purchase_orders
        WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2;
    `, [from, to]);

    return {
        salesSummary: salesSummaryRes.rows[0],
        cogsData: cogsRes.rows[0],
        expenses: expensesRes.rows[0],
        purchases: purchasesRes.rows[0],
    };
}

async function fetchFinancialBreakdowns(from, to) {
    const topProductsRes = await pool.query(`
        SELECT 
            si.product_id,
            COALESCE(p.name, 'Unknown Item') AS product_name,
            COALESCE(p.sku, 'N/A') AS sku,
            COALESCE(p.barcode, 'N/A') AS barcode,
            COALESCE(b.name, 'N/A') AS brand_name,
            COALESCE(c.name, 'General') AS category_name,
            SUM(si.quantity) AS units_sold,
            SUM(si.line_total) AS revenue_generated,
            SUM(si.quantity * CASE WHEN COALESCE(si.cost_price, 0) > 0 THEN si.cost_price ELSE COALESCE(p.purchase_price, 0) END) AS total_cost
        FROM sales_items si
        JOIN sales s ON s.id = si.sale_id
        LEFT JOIN products p ON p.id = si.product_id
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE DATE(s.created_at) >= $1 AND DATE(s.created_at) <= $2
        GROUP BY si.product_id, p.name, p.sku, p.barcode, b.name, c.name
        ORDER BY units_sold DESC, revenue_generated DESC
        LIMIT 10;
    `, [from, to]);

    const channelBreakdownRes = await pool.query(`
        SELECT 
            COALESCE(pm.method_name, 'Cash') AS method,
            COUNT(*) AS count,
            COALESCE(SUM(s.paid_amount), 0) AS total_amount
        FROM sales s
        LEFT JOIN payment_methods pm ON pm.id = s.payment_method_id
        WHERE DATE(s.created_at) >= $1 AND DATE(s.created_at) <= $2
        GROUP BY pm.method_name
        ORDER BY total_amount DESC;
    `, [from, to]);

    const inventoryValuationRes = await pool.query(`
        SELECT 
            COUNT(*) AS total_skus,
            COALESCE(SUM(stock), 0) AS total_stock_units,
            COALESCE(SUM(
                (stock / CASE WHEN COALESCE(conversion_rate, 1) > 1 THEN conversion_rate ELSE 1 END) 
                * COALESCE(purchase_price, 0)
            ), 0) AS total_cost_value,
            COALESCE(SUM(
                (stock / CASE WHEN COALESCE(conversion_rate, 1) > 1 THEN conversion_rate ELSE 1 END) 
                * COALESCE(selling_price, 0)
            ), 0) AS total_retail_value,
            COUNT(CASE WHEN stock <= COALESCE(min_stock, 5) AND stock > 0 THEN 1 END) AS low_stock_skus,
            COUNT(CASE WHEN stock <= 0 THEN 1 END) AS out_of_stock_skus
        FROM products
        WHERE deleted_at IS NULL;
    `);

    const customerDueRes = await pool.query(`SELECT COALESCE(SUM(receivable_balance), 0) AS total_receivable FROM customers WHERE deleted_at IS NULL;`);
    const supplierDueRes = await pool.query(`SELECT COALESCE(SUM(payable_balance), 0) AS total_payable FROM suppliers WHERE deleted_at IS NULL;`);
    const walletsRes = await pool.query(`SELECT id, name, balance FROM payment_accounts ORDER BY id ASC;`);

    return {
        topProductsRows: topProductsRes.rows,
        channelRows: channelBreakdownRes.rows,
        invRow: inventoryValuationRes.rows[0],
        customerDueRow: customerDueRes.rows[0],
        supplierDueRow: supplierDueRes.rows[0],
        walletsRows: walletsRes.rows,
    };
}

module.exports = {
    fetchFinancialCoreData,
    fetchFinancialBreakdowns,
};
