const pool = require('../../config/db');
const { ensureSecurityTables } = require('./securitySchema');

// Get Pending Staff Registrations (For Admin Confirmation)
exports.getPendingStaff = async (req, res) => {
    try {
        await ensureSecurityTables();
        const result = await pool.query(`
            SELECT id, name, phone, email, role_name, approval_status, created_at
            FROM users
            WHERE approval_status = 'pending_approval' AND deleted_at IS NULL
            ORDER BY id DESC;
        `);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Approve / Reject Staff Registration
exports.approveStaff = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { userId, action = 'approve' } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        if (action === 'approve') {
            await pool.query(`
                UPDATE users
                SET approval_status = 'approved', is_active = true
                WHERE id = $1
            `, [userId]);
            return res.status(200).json({ success: true, message: 'Staff account approved successfully.' });
        } else {
            await pool.query(`
                UPDATE users
                SET approval_status = 'rejected', is_active = false, deleted_at = NOW()
                WHERE id = $1
            `, [userId]);
            return res.status(200).json({ success: true, message: 'Staff account rejected.' });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
