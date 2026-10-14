const pool = require('../../config/db');
const { ensureRegisterTables } = require('./registerSchema');

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
