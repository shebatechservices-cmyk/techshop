const pool = require('../../config/db');

let tablesMigrated = false;

async function ensureRegisterTables() {
    if (tablesMigrated) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS register_shifts (
                id SERIAL PRIMARY KEY,
                branch_id INT DEFAULT 1,
                opened_at TIMESTAMP DEFAULT NOW(),
                closed_at TIMESTAMP,
                opened_by INT,
                opened_by_name VARCHAR(150),
                closed_by INT,
                closed_by_name VARCHAR(150),
                opening_balance NUMERIC(14,2) DEFAULT 0.00,
                total_cash_sales NUMERIC(14,2) DEFAULT 0.00,
                total_due_collections NUMERIC(14,2) DEFAULT 0.00,
                total_cash_expenses NUMERIC(14,2) DEFAULT 0.00,
                expected_cash_balance NUMERIC(14,2) DEFAULT 0.00,
                actual_cash_counted NUMERIC(14,2) DEFAULT 0.00,
                variance_amount NUMERIC(14,2) DEFAULT 0.00,
                denominations JSONB DEFAULT '{}',
                status VARCHAR(50) DEFAULT 'open',
                notes TEXT,
                is_locked BOOLEAN DEFAULT false,
                sms_alert_sent BOOLEAN DEFAULT false,
                sms_details JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        tablesMigrated = true;
    } catch (err) {
        console.error('Failed to ensure register tables:', err.message);
    }
}

/**
 * Helper to compute live ledger movements between two timestamps
 */
async function calculateShiftCashMovement(openedAt, closedAt = new Date()) {
    // 1. Calculate Cash Sales
    const salesRes = await pool.query(`
        SELECT id, invoice_no, paid_amount, payment_details, payment_status, created_at
        FROM sales
        WHERE deleted_at IS NULL
          AND created_at >= $1 AND created_at <= $2
    `, [openedAt, closedAt]);

    let totalCashSales = 0;
    for (const sale of salesRes.rows) {
        if (Array.isArray(sale.payment_details) && sale.payment_details.length > 0) {
            for (const p of sale.payment_details) {
                const m = String(p.method || p.payment_mode || p.name || '').toLowerCase();
                if (m.includes('cash') || m.includes('drawer') || m.includes('নগদ') || m.includes('hand') || !m) {
                    totalCashSales += Number(p.amount || 0);
                }
            }
        } else if (Number(sale.paid_amount) > 0) {
            totalCashSales += Number(sale.paid_amount);
        }
    }

    // Also cross check account_transactions for pos_sale
    const ledgerSalesRes = await pool.query(`
        SELECT COALESCE(SUM(at.amount), 0) AS total
        FROM account_transactions at
        JOIN payment_accounts pa ON at.account_id = pa.id
        WHERE at.transaction_type = 'credit'
          AND at.source_type IN ('pos_sale', 'sale_payment')
          AND at.created_at >= $1 AND at.created_at <= $2
          AND (pa.account_type = 'drawer' OR pa.name ILIKE '%cash%' OR pa.name ILIKE '%drawer%' OR pa.name ILIKE '%নগদ%')
    `, [openedAt, closedAt]);
    const ledgerSales = Number(ledgerSalesRes.rows[0]?.total || 0);
    // Use maximum of direct sales cash or account_transactions to ensure no omission
    if (ledgerSales > totalCashSales) {
        totalCashSales = ledgerSales;
    }

    // 2. Calculate Cash Due Collections (customer payments towards past dues)
    const paymentsRes = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM payments
        WHERE created_at >= $1 AND created_at <= $2
          AND (sale_id IS NULL OR sale_id = 0)
          AND (payment_mode ILIKE '%cash%' OR payment_mode ILIKE '%নগদ%' OR payment_mode ILIKE '%drawer%' OR account_name ILIKE '%cash%' OR account_name ILIKE '%drawer%' OR payment_mode IS NULL)
    `, [openedAt, closedAt]);
    let totalDueCollections = Number(paymentsRes.rows[0]?.total || 0);

    const ledgerCollRes = await pool.query(`
        SELECT COALESCE(SUM(at.amount), 0) AS total
        FROM account_transactions at
        JOIN payment_accounts pa ON at.account_id = pa.id
        WHERE at.transaction_type = 'credit'
          AND at.source_type IN ('due_collection', 'party_payment', 'customer_payment')
          AND at.created_at >= $1 AND at.created_at <= $2
          AND (pa.account_type = 'drawer' OR pa.name ILIKE '%cash%' OR pa.name ILIKE '%drawer%' OR pa.name ILIKE '%নগদ%')
    `, [openedAt, closedAt]);
    const ledgerColl = Number(ledgerCollRes.rows[0]?.total || 0);
    if (ledgerColl > totalDueCollections) {
        totalDueCollections = ledgerColl;
    }

    // 3. Calculate Cash Expenses & Refunds
    const expensesRes = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM expenses
        WHERE deleted_at IS NULL
          AND created_at >= $1 AND created_at <= $2
          AND (account_name ILIKE '%cash%' OR account_name ILIKE '%drawer%' OR account_name ILIKE '%নগদ%' OR account_id IN (SELECT id FROM payment_accounts WHERE account_type = 'drawer'))
    `, [openedAt, closedAt]);
    let totalCashExpenses = Number(expensesRes.rows[0]?.total || 0);

    const refundsRes = await pool.query(`
        SELECT COALESCE(SUM(at.amount), 0) AS total
        FROM account_transactions at
        JOIN payment_accounts pa ON at.account_id = pa.id
        WHERE at.transaction_type = 'debit'
          AND at.source_type IN ('sale_refund', 'refund')
          AND (pa.account_type = 'drawer' OR pa.name ILIKE '%cash%' OR pa.name ILIKE '%drawer%' OR pa.name ILIKE '%নগদ%')
          AND at.created_at >= $1 AND at.created_at <= $2
    `, [openedAt, closedAt]);
    totalCashExpenses += Number(refundsRes.rows[0]?.total || 0);

    return {
        totalCashSales: Math.round(totalCashSales * 100) / 100,
        totalDueCollections: Math.round(totalDueCollections * 100) / 100,
        totalCashExpenses: Math.round(totalCashExpenses * 100) / 100
    };
}

module.exports = {
    ensureRegisterTables,
    calculateShiftCashMovement
};
