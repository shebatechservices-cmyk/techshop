const pool = require('../../config/db');

// Daily Cash Closing Summary (Z-Report)
exports.getDayCloseSummary = async (req, res) => {
    try {
        const targetDate = req.query.date || new Date().toISOString().split('T')[0];

        // 1. Current Account Balances (Cash Drawer, Bank, MFS)
        const accountsRes = await pool.query(`
            SELECT id, name, account_type, balance 
            FROM payment_accounts 
            ORDER BY id ASC;
        `);

        // 2. Today's Sales breakdown
        const salesRes = await pool.query(`
            SELECT 
                COUNT(*) AS total_invoices,
                COALESCE(SUM(total_amount), 0) AS gross_sales,
                COALESCE(SUM(paid_amount), 0) AS total_collected,
                COALESCE(SUM(due_amount), 0) AS total_due_given
            FROM sales
            WHERE DATE(created_at) = $1;
        `, [targetDate]);

        // 3. Today's Account Transactions breakdown
        const trxsRes = await pool.query(`
            SELECT 
                t.type,
                p.name AS account_name,
                p.id AS account_id,
                COALESCE(SUM(t.amount), 0) AS total_amount,
                COUNT(*) AS count
            FROM account_transactions t
            JOIN payment_accounts p ON p.id = t.account_id
            WHERE DATE(t.created_at) = $1
            GROUP BY t.type, p.name, p.id
            ORDER BY t.type;
        `, [targetDate]);

        // 4. Today's Purchases breakdown
        const purchaseRes = await pool.query(`
            SELECT 
                COUNT(*) AS total_pos,
                COALESCE(SUM(total_cost), 0) AS total_purchased,
                COALESCE(SUM(total_paid), 0) AS total_purchase_paid,
                COALESCE(SUM(total_due), 0) AS total_purchase_due
            FROM purchase_orders
            WHERE DATE(created_at) = $1;
        `, [targetDate]);

        // Calculate aggregate numbers
        let cashInflow = 0;
        let cashOutflow = 0;
        let bankMfsInflow = 0;
        let bankMfsOutflow = 0;
        let totalExpenses = 0;
        let totalDuesCollected = 0;
        let totalSupplierPaid = 0;

        trxsRes.rows.forEach(tr => {
            const amt = parseFloat(tr.total_amount || 0);
            const isCash = (tr.account_name || '').toLowerCase().includes('cash') || (tr.account_name || '').toLowerCase().includes('drawer');

            if (tr.type === 'deposit' || tr.type === 'due_receive' || tr.type === 'advance_receive' || tr.type === 'transfer_in') {
                if (isCash) cashInflow += amt;
                else bankMfsInflow += amt;
                if (tr.type === 'due_receive') totalDuesCollected += amt;
            } else if (tr.type === 'withdraw' || tr.type === 'due_payment' || tr.type === 'advance_payment' || tr.type === 'refund' || tr.type === 'expense' || tr.type === 'transfer_out' || tr.type === 'purchase_payment') {
                if (isCash) cashOutflow += amt;
                else bankMfsOutflow += amt;
                if (tr.type === 'due_payment' || tr.type === 'advance_payment') totalSupplierPaid += amt;
                if (tr.type === 'expense') totalExpenses += amt;
            }
        });

        const cashAccounts = accountsRes.rows.filter(a => 
            (a.name || '').toLowerCase().includes('cash') || (a.name || '').toLowerCase().includes('drawer')
        );
        const currentCashInDrawer = cashAccounts.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0);

        return res.status(200).json({
            success: true,
            date: targetDate,
            sales: salesRes.rows[0],
            purchases: purchaseRes.rows[0],
            accounts: accountsRes.rows,
            summary: {
                current_cash_in_drawer: currentCashInDrawer,
                cash_inflow: cashInflow,
                cash_outflow: cashOutflow,
                net_cash_flow: cashInflow - cashOutflow,
                bank_mfs_inflow: bankMfsInflow,
                bank_mfs_outflow: bankMfsOutflow,
                total_dues_collected: totalDuesCollected,
                total_supplier_paid: totalSupplierPaid,
                total_expenses: totalExpenses
            },
            transactions: trxsRes.rows
        });
    } catch (error) {
        console.error('getDayCloseSummary error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
