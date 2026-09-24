const pool = require('../config/db');

// Helper to calculate date range based on period
function getDateRange(period, customFrom, customTo) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (customFrom && customTo) {
        return { from: customFrom, to: customTo };
    }

    switch (period) {
        case 'today':
            return { from: todayStr, to: todayStr };
        case 'yesterday': {
            const y = new Date(now);
            y.setDate(y.getDate() - 1);
            const yStr = y.toISOString().split('T')[0];
            return { from: yStr, to: yStr };
        }
        case '7days': {
            const d7 = new Date(now);
            d7.setDate(d7.getDate() - 6);
            return { from: d7.toISOString().split('T')[0], to: todayStr };
        }
        case '30days': {
            const d30 = new Date(now);
            d30.setDate(d30.getDate() - 29);
            return { from: d30.toISOString().split('T')[0], to: todayStr };
        }
        case 'this_month': {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            return { from: firstDay, to: todayStr };
        }
        case 'last_month': {
            const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
            const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
            return { from: firstDay, to: lastDay };
        }
        case 'this_year': {
            const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
            return { from: firstDay, to: todayStr };
        }
        case 'all':
        default:
            return { from: '2020-01-01', to: todayStr };
    }
}

// 1. Full Enterprise Financial Analytics & P&L
exports.getFinancialAnalytics = async (req, res) => {
    try {
        const { period = 'this_month', from_date, to_date } = req.query;
        const { from, to } = getDateRange(period, from_date, to_date);

        // A. Sales & Revenue in date range
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
        const salesSummary = salesSummaryRes.rows[0];

        // B. Cost of Goods Sold (COGS) in date range
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
        const cogsData = cogsRes.rows[0];
        const grossRevenue = parseFloat(salesSummary.gross_revenue || 0);
        const cogs = parseFloat(cogsData.cogs || 0);
        const grossProfit = Math.max(0, grossRevenue - cogs);
        const grossMarginPct = grossRevenue > 0 ? ((grossProfit / grossRevenue) * 100).toFixed(1) : 0;

        // C. Operating Expenses & Staff Remuneration in date range
        const expensesRes = await pool.query(`
            SELECT 
                COALESCE(SUM(amount), 0) AS total_operating_expenses,
                COUNT(*) AS total_expense_count
            FROM account_transactions
            WHERE type IN ('expense', 'withdraw')
              AND DATE(created_at) >= $1 AND DATE(created_at) <= $2;
        `, [from, to]);
        const totalExpenses = parseFloat(expensesRes.rows[0].total_operating_expenses || 0);
        const netProfit = grossProfit - totalExpenses;
        const netMarginPct = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : 0;

        // D. Purchases in date range
        const purchasesRes = await pool.query(`
            SELECT 
                COUNT(*) AS total_pos,
                COALESCE(SUM(total_cost), 0) AS total_purchased,
                COALESCE(SUM(total_paid), 0) AS total_purchase_paid,
                COALESCE(SUM(total_due), 0) AS total_purchase_due
            FROM purchase_orders
            WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2;
        `, [from, to]);

        // E. Top 10 Best Selling Products in date range
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

        const topProducts = topProductsRes.rows.map(tp => {
            const rev = parseFloat(tp.revenue_generated || 0);
            const cost = parseFloat(tp.total_cost || 0);
            const profit = rev - cost;
            const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : 0;
            return {
                ...tp,
                units_sold: parseInt(tp.units_sold || 0),
                revenue_generated: rev,
                profit: profit,
                margin_pct: margin
            };
        });

        // F. Sales Inflow by Payment Method in date range
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

        // G. Current Inventory Valuation (All Active Products)
        const inventoryValuationRes = await pool.query(`
            SELECT 
                COUNT(*) AS total_skus,
                COALESCE(SUM(stock), 0) AS total_stock_units,
                COALESCE(SUM(stock * COALESCE(purchase_price, 0)), 0) AS total_cost_value,
                COALESCE(SUM(stock * COALESCE(selling_price, 0)), 0) AS total_retail_value,
                COUNT(CASE WHEN stock <= COALESCE(min_stock, 5) AND stock > 0 THEN 1 END) AS low_stock_skus,
                COUNT(CASE WHEN stock <= 0 THEN 1 END) AS out_of_stock_skus
            FROM products
            WHERE deleted_at IS NULL;
        `);
        const inv = inventoryValuationRes.rows[0];
        const costVal = parseFloat(inv.total_cost_value || 0);
        const retailVal = parseFloat(inv.total_retail_value || 0);
        const potentialProfit = Math.max(0, retailVal - costVal);

        // H. Current Party Ledgers (Receivables & Payables)
        const customerDueRes = await pool.query(`SELECT COALESCE(SUM(receivable_balance), 0) AS total_receivable FROM customers;`);
        const supplierDueRes = await pool.query(`SELECT COALESCE(SUM(payable_balance), 0) AS total_payable FROM suppliers;`);
        const walletsRes = await pool.query(`SELECT id, name, balance FROM payment_accounts ORDER BY id ASC;`);

        const totalCashInDrawers = walletsRes.rows
            .filter(w => (w.name || '').toLowerCase().includes('cash') || (w.name || '').toLowerCase().includes('drawer'))
            .reduce((sum, w) => sum + parseFloat(w.balance || 0), 0);
        const totalBankMfs = walletsRes.rows
            .filter(w => !(w.name || '').toLowerCase().includes('cash') && !(w.name || '').toLowerCase().includes('drawer'))
            .reduce((sum, w) => sum + parseFloat(w.balance || 0), 0);

        return res.status(200).json({
            success: true,
            filter: {
                period,
                from_date: from,
                to_date: to
            },
            pnl: {
                gross_revenue: grossRevenue,
                total_invoices: parseInt(salesSummary.total_invoices || 0),
                total_collected: parseFloat(salesSummary.total_collected || 0),
                total_due_given: parseFloat(salesSummary.total_due_given || 0),
                total_discounts: parseFloat(salesSummary.total_discounts || 0),
                total_tax: parseFloat(salesSummary.total_tax || 0),
                cogs: cogs,
                total_units_sold: parseInt(cogsData.total_units_sold || 0),
                gross_profit: grossProfit,
                gross_margin_pct: Number(grossMarginPct),
                operating_expenses: totalExpenses,
                net_profit: netProfit,
                net_margin_pct: Number(netMarginPct)
            },
            purchases: {
                total_pos: parseInt(purchasesRes.rows[0].total_pos || 0),
                total_purchased: parseFloat(purchasesRes.rows[0].total_purchased || 0),
                total_paid: parseFloat(purchasesRes.rows[0].total_paid || 0),
                total_due: parseFloat(purchasesRes.rows[0].total_due || 0)
            },
            channels: channelBreakdownRes.rows,
            top_products: topProducts,
            inventory: {
                total_skus: parseInt(inv.total_skus || 0),
                total_stock_units: parseInt(inv.total_stock_units || 0),
                total_cost_value: costVal,
                total_retail_value: retailVal,
                potential_profit: potentialProfit,
                low_stock_skus: parseInt(inv.low_stock_skus || 0),
                out_of_stock_skus: parseInt(inv.out_of_stock_skus || 0)
            },
            ledgers: {
                total_customer_receivables: parseFloat(customerDueRes.rows[0].total_receivable || 0),
                total_supplier_payables: parseFloat(supplierDueRes.rows[0].total_payable || 0),
                total_cash_in_drawers: totalCashInDrawers,
                total_bank_mfs: totalBankMfs,
                total_liquid_funds: totalCashInDrawers + totalBankMfs,
                wallets: walletsRes.rows
            }
        });

    } catch (error) {
        console.error('getFinancialAnalytics error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Detailed Line-by-Line Sales Audit Report
exports.getSalesAuditReport = async (req, res) => {
    try {
        const { period = 'this_month', from_date, to_date, limit = 200 } = req.query;
        const { from, to } = getDateRange(period, from_date, to_date);

        const result = await pool.query(`
            SELECT 
                s.id,
                s.invoice_no,
                s.created_at,
                s.customer_id,
                COALESCE(c.name, 'Walking Customer') AS customer_name,
                c.phone AS customer_phone,
                s.sales_person,
                s.total_amount,
                s.paid_amount,
                s.due_amount,
                s.discount,
                s.vat,
                s.payment_status,
                COALESCE(pm.method_name, 'Cash') AS payment_method,
                COALESCE((
                    SELECT SUM(
                        si.quantity * CASE 
                            WHEN COALESCE(si.cost_price, 0) > 0 THEN si.cost_price 
                            ELSE COALESCE(p.purchase_price, 0) 
                        END
                    )
                    FROM sales_items si
                    LEFT JOIN products p ON p.id = si.product_id
                    WHERE si.sale_id = s.id
                ), 0) AS estimated_cogs
            FROM sales s
            LEFT JOIN customers c ON c.id = s.customer_id
            LEFT JOIN payment_methods pm ON pm.id = s.payment_method_id
            WHERE DATE(s.created_at) >= $1 AND DATE(s.created_at) <= $2
            ORDER BY s.id DESC
            LIMIT $3;
        `, [from, to, parseInt(limit)]);

        return res.status(200).json({
            success: true,
            filter: { from, to, period },
            data: result.rows
        });
    } catch (error) {
        console.error('getSalesAuditReport error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
