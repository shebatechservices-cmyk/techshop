const { getDateRange } = require('./reportDateHelper');
const { fetchFinancialCoreData, fetchFinancialBreakdowns } = require('./financialAnalyticsQueries');

exports.getFinancialAnalytics = async (req, res) => {
    try {
        const { period = 'this_month', from_date, to_date } = req.query;
        const { from, to } = getDateRange(period, from_date, to_date);

        const { salesSummary, cogsData, expenses, purchases } = await fetchFinancialCoreData(from, to);
        const { topProductsRows, channelRows, invRow, customerDueRow, supplierDueRow, walletsRows } =
            await fetchFinancialBreakdowns(from, to);

        const grossRevenue = parseFloat(salesSummary.gross_revenue || 0);
        const cogs = parseFloat(cogsData.cogs || 0);
        const grossProfit = Math.max(0, grossRevenue - cogs);
        const grossMarginPct = grossRevenue > 0 ? ((grossProfit / grossRevenue) * 100).toFixed(1) : 0;

        const totalExpenses = parseFloat(expenses.total_operating_expenses || 0);
        const netProfit = grossProfit - totalExpenses;
        const netMarginPct = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : 0;

        const topProducts = topProductsRows.map((tp) => {
            const rev = parseFloat(tp.revenue_generated || 0);
            const cost = parseFloat(tp.total_cost || 0);
            const profit = rev - cost;
            const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : 0;
            return {
                ...tp,
                units_sold: parseInt(tp.units_sold || 0, 10),
                revenue_generated: rev,
                profit,
                margin_pct: margin,
            };
        });

        const costVal = parseFloat(invRow.total_cost_value || 0);
        const retailVal = parseFloat(invRow.total_retail_value || 0);
        const potentialProfit = Math.max(0, retailVal - costVal);

        const totalCashInDrawers = walletsRows
            .filter((w) => (w.name || '').toLowerCase().includes('cash') || (w.name || '').toLowerCase().includes('drawer'))
            .reduce((sum, w) => sum + parseFloat(w.balance || 0), 0);
        const totalBankMfs = walletsRows
            .filter((w) => !(w.name || '').toLowerCase().includes('cash') && !(w.name || '').toLowerCase().includes('drawer'))
            .reduce((sum, w) => sum + parseFloat(w.balance || 0), 0);

        return res.status(200).json({
            success: true,
            filter: { period, from_date: from, to_date: to },
            pnl: {
                gross_revenue: grossRevenue,
                total_invoices: parseInt(salesSummary.total_invoices || 0, 10),
                total_collected: parseFloat(salesSummary.total_collected || 0),
                total_due_given: parseFloat(salesSummary.total_due_given || 0),
                total_discounts: parseFloat(salesSummary.total_discounts || 0),
                total_tax: parseFloat(salesSummary.total_tax || 0),
                cogs,
                total_units_sold: parseInt(cogsData.total_units_sold || 0, 10),
                gross_profit: grossProfit,
                gross_margin_pct: Number(grossMarginPct),
                operating_expenses: totalExpenses,
                net_profit: netProfit,
                net_margin_pct: Number(netMarginPct),
            },
            purchases: {
                total_pos: parseInt(purchases.total_pos || 0, 10),
                total_purchased: parseFloat(purchases.total_purchased || 0),
                total_paid: parseFloat(purchases.total_paid || 0),
                total_due: parseFloat(purchases.total_due || 0),
            },
            channels: channelRows,
            top_products: topProducts,
            inventory: {
                total_skus: parseInt(invRow.total_skus || 0, 10),
                total_stock_units: parseInt(invRow.total_stock_units || 0, 10),
                total_cost_value: costVal,
                total_retail_value: retailVal,
                potential_profit: potentialProfit,
                low_stock_skus: parseInt(invRow.low_stock_skus || 0, 10),
                out_of_stock_skus: parseInt(invRow.out_of_stock_skus || 0, 10),
            },
            ledgers: {
                total_customer_receivables: parseFloat(customerDueRow.total_receivable || 0),
                total_supplier_payables: parseFloat(supplierDueRow.total_payable || 0),
                total_cash_in_drawers: totalCashInDrawers,
                total_bank_mfs: totalBankMfs,
                total_liquid_funds: totalCashInDrawers + totalBankMfs,
                wallets: walletsRows,
            },
        });
    } catch (error) {
        console.error('getFinancialAnalytics error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
