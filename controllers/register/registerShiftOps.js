const pool = require('../../config/db');
const { sendSms } = require('../../services/smsService');
const { ensureRegisterTables, calculateShiftCashMovement } = require('./registerSchema');

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
