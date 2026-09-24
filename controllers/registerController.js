const pool = require('../config/db');
const { sendSms } = require('../services/smsService');

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

/**
 * GET /api/register/current-shift
 */
exports.getCurrentShift = async (req, res) => {
    try {
        await ensureRegisterTables();
        const activeRes = await pool.query(`
            SELECT * FROM register_shifts
            WHERE status = 'open' AND is_locked = false
            ORDER BY id DESC LIMIT 1
        `);

        if (activeRes.rows.length === 0) {
            // Get the last closed shift to suggest opening balance
            const lastShiftRes = await pool.query(`
                SELECT * FROM register_shifts
                ORDER BY id DESC LIMIT 1
            `);
            return res.json({
                success: true,
                has_active_shift: false,
                shift: null,
                last_closed_shift: lastShiftRes.rows[0] || null
            });
        }

        const shift = activeRes.rows[0];
        // Calculate live metrics for server-side verification / admin view
        const liveMovement = await calculateShiftCashMovement(shift.opened_at, new Date());
        const openingBalance = Number(shift.opening_balance || 0);
        const expectedCash = openingBalance + liveMovement.totalCashSales + liveMovement.totalDueCollections - liveMovement.totalCashExpenses;

        return res.json({
            success: true,
            has_active_shift: true,
            shift: {
                ...shift,
                live_metrics: {
                    ...liveMovement,
                    opening_balance: openingBalance,
                    expected_cash_balance: Math.round(expectedCash * 100) / 100
                }
            }
        });
    } catch (err) {
        console.error('Error fetching current shift:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch current shift', error: err.message });
    }
};

/**
 * POST /api/register/open
 */
exports.openShift = async (req, res) => {
    try {
        await ensureRegisterTables();
        const { opening_balance = 0, notes = '', branch_id = 1 } = req.body;

        const activeCheck = await pool.query(`
            SELECT id FROM register_shifts
            WHERE status = 'open' AND is_locked = false
            LIMIT 1
        `);

        if (activeCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'একটি শিফট ইতিমধ্যে চালু আছে (A register shift is already active). Please close the current shift first.'
            });
        }

        const userId = req.user?.id || req.body.opened_by || 1;
        const userName = req.user?.name || req.body.opened_by_name || 'Cashier / Admin';

        const result = await pool.query(`
            INSERT INTO register_shifts (
                branch_id, opened_at, opened_by, opened_by_name, opening_balance, notes, status, is_locked
            ) VALUES ($1, NOW(), $2, $3, $4, $5, 'open', false)
            RETURNING *
        `, [branch_id, userId, userName, Number(opening_balance) || 0, notes]);

        return res.status(201).json({
            success: true,
            message: 'ক্যাশ রেজিস্টার শিফট সফলভাবে খোলা হয়েছে (Shift opened successfully)',
            shift: result.rows[0]
        });
    } catch (err) {
        console.error('Error opening register shift:', err);
        return res.status(500).json({ success: false, message: 'Failed to open register shift', error: err.message });
    }
};

/**
 * POST /api/register/close
 * Blind Close Execution & SMS Alert Dispatch
 */
exports.closeShift = async (req, res) => {
    try {
        await ensureRegisterTables();
        const {
            actual_cash_counted = 0,
            denominations = {},
            notes = ''
        } = req.body;

        const activeRes = await pool.query(`
            SELECT * FROM register_shifts
            WHERE status = 'open' AND is_locked = false
            ORDER BY id DESC LIMIT 1
        `);

        if (activeRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'কোনো সক্রিয় শিফট খুঁজে পাওয়া যায়নি (No active open shift found to close).'
            });
        }

        const currentShift = activeRes.rows[0];
        const closedAt = new Date();
        const closedById = req.user?.id || req.body.closed_by || currentShift.opened_by || 1;
        const closedByName = req.user?.name || req.body.closed_by_name || currentShift.opened_by_name || 'Cashier';

        // 1. Calculate true Central Ledger movements
        const movement = await calculateShiftCashMovement(currentShift.opened_at, closedAt);
        const openingBalance = Number(currentShift.opening_balance || 0);
        const totalCashSales = movement.totalCashSales;
        const totalDueCollections = movement.totalDueCollections;
        const totalCashExpenses = movement.totalCashExpenses;

        const expectedCashBalance = Math.round((openingBalance + totalCashSales + totalDueCollections - totalCashExpenses) * 100) / 100;
        const actualCash = Math.round((Number(actual_cash_counted) || 0) * 100) / 100;
        const varianceAmount = Math.round((actualCash - expectedCashBalance) * 100) / 100;

        const status = Math.abs(varianceAmount) < 0.01 ? 'closed' : 'discrepancy';

        // 2. Fetch Shop Settings for SMS Alert & Owner Phone
        let shopSettings = null;
        try {
            const sRes = await pool.query('SELECT * FROM shop_settings WHERE id = 1');
            shopSettings = sRes.rows[0];
        } catch (_) {}

        const shopName = shopSettings?.shop_name || 'SHEBA TECHNOLOGY BD';
        const ownerPhone = shopSettings?.phone || shopSettings?.alt_phone || '';

        // 3. Update & Lock the Shift Record
        const updateRes = await pool.query(`
            UPDATE register_shifts SET
                closed_at = $1,
                closed_by = $2,
                closed_by_name = $3,
                total_cash_sales = $4,
                total_due_collections = $5,
                total_cash_expenses = $6,
                expected_cash_balance = $7,
                actual_cash_counted = $8,
                variance_amount = $9,
                denominations = $10,
                status = $11,
                notes = $12,
                is_locked = true,
                updated_at = NOW()
            WHERE id = $13
            RETURNING *
        `, [
            closedAt,
            closedById,
            closedByName,
            totalCashSales,
            totalDueCollections,
            totalCashExpenses,
            expectedCashBalance,
            actualCash,
            varianceAmount,
            JSON.stringify(denominations || {}),
            status,
            notes,
            currentShift.id
        ]);

        const finalizedShift = updateRes.rows[0];

        // 4. Dispatch SMS Notification to Owner / Admin
        let smsResult = null;
        let smsSent = false;
        if (ownerPhone) {
            const varianceLabel = varianceAmount === 0 
                ? 'Balanced (0 ৳)' 
                : varianceAmount > 0 
                    ? `Overage (+${varianceAmount} ৳)` 
                    : `Shortage (${varianceAmount} ৳)`;

            const smsMessage = `[EOD Shift Close - ${shopName}]\nCashier: ${closedByName}\nOpen Cash: ${openingBalance} ৳\nCash Sales: ${totalCashSales} ৳\nCollections: ${totalDueCollections} ৳\nExpenses: ${totalCashExpenses} ৳\nExpected: ${expectedCashBalance} ৳\nActual: ${actualCash} ৳\nVariance: ${varianceLabel}\nTime: ${closedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

            try {
                smsResult = await sendSms({
                    phone: ownerPhone,
                    message: smsMessage,
                    trigger_key: 'register_shift_close',
                    recipient_name: 'Shop Owner / Admin'
                });
                smsSent = smsResult?.success || false;

                await pool.query(`
                    UPDATE register_shifts SET
                        sms_alert_sent = $1,
                        sms_details = $2
                    WHERE id = $3
                `, [smsSent, JSON.stringify(smsResult || {}), finalizedShift.id]);
                finalizedShift.sms_alert_sent = smsSent;
            } catch (smsErr) {
                console.warn('SMS dispatch failed during shift close:', smsErr.message);
                await pool.query(`
                    UPDATE register_shifts SET
                        sms_alert_sent = false,
                        sms_details = $1
                    WHERE id = $2
                `, [JSON.stringify({ error: smsErr.message }), finalizedShift.id]);
            }
        }

        return res.json({
            success: true,
            message: 'ক্যাশ রেজিস্টার শিফট সফলভাবে সমাপ্ত এবং লক করা হয়েছে (Shift closed and locked successfully).',
            shift: finalizedShift,
            sms_sent: smsSent,
            sms_recipient: ownerPhone || null
        });
    } catch (err) {
        console.error('Error closing register shift:', err);
        return res.status(500).json({ success: false, message: 'Failed to close register shift', error: err.message });
    }
};

/**
 * GET /api/register/shifts
 * List history of all shifts with audit data
 */
exports.getShiftHistory = async (req, res) => {
    try {
        await ensureRegisterTables();
        const { limit = 30, offset = 0 } = req.query;

        const result = await pool.query(`
            SELECT * FROM register_shifts
            ORDER BY opened_at DESC
            LIMIT $1 OFFSET $2
        `, [Number(limit) || 30, Number(offset) || 0]);

        const countRes = await pool.query('SELECT COUNT(*) AS count FROM register_shifts');
        const total = parseInt(countRes.rows[0]?.count || '0', 10);

        return res.json({
            success: true,
            shifts: result.rows,
            total
        });
    } catch (err) {
        console.error('Error fetching shift history:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch shift history', error: err.message });
    }
};

/**
 * GET /api/register/shifts/:id
 */
exports.getShiftDetails = async (req, res) => {
    try {
        await ensureRegisterTables();
        const { id } = req.params;

        const shiftRes = await pool.query('SELECT * FROM register_shifts WHERE id = $1', [id]);
        if (shiftRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Shift not found' });
        }

        const shift = shiftRes.rows[0];
        const endTime = shift.closed_at || new Date();

        // Get list of sales in this shift
        const salesRes = await pool.query(`
            SELECT id, invoice_no, total_amount, paid_amount, payment_status, created_at
            FROM sales
            WHERE deleted_at IS NULL
              AND created_at >= $1 AND created_at <= $2
            ORDER BY created_at ASC
        `, [shift.opened_at, endTime]);

        // Get list of expenses in this shift
        const expensesRes = await pool.query(`
            SELECT id, voucher_no, category_name, account_name, amount, created_at
            FROM expenses
            WHERE deleted_at IS NULL
              AND created_at >= $1 AND created_at <= $2
            ORDER BY created_at ASC
        `, [shift.opened_at, endTime]);

        return res.json({
            success: true,
            shift,
            sales: salesRes.rows,
            expenses: expensesRes.rows
        });
    } catch (err) {
        console.error('Error fetching shift details:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch shift details', error: err.message });
    }
};
