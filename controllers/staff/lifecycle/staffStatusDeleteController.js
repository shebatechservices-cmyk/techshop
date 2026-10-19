const pool = require('../../../config/db');

/**
 * Quick toggle active/inactive status
 */
exports.toggleStaffStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        if (Number(id) === 1 && (is_active === false || is_active === 'false')) {
            return res.status(403).json({ success: false, message: 'Primary Super Admin account cannot be deactivated' });
        }

        const result = await pool.query(`
            UPDATE users 
            SET is_active = $1, updated_at = NOW()
            WHERE id = $2 AND deleted_at IS NULL
            RETURNING id, name, is_active
        `, [Boolean(is_active), id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Staff member not found' });
        }

        return res.status(200).json({
            success: true,
            message: `Staff member ${result.rows[0].name} is now ${result.rows[0].is_active ? 'Active' : 'Inactive'}`,
            data: result.rows[0],
        });
    } catch (err) {
        console.error('Error in toggleStaffStatus:', err);
        return res.status(500).json({ success: false, message: 'Failed to update status', error: err.message });
    }
};

/**
 * Soft delete a staff member
 */
exports.deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;

        if (Number(id) === 1) {
            return res.status(403).json({ success: false, message: 'Primary Super Admin account cannot be deleted' });
        }

        const result = await pool.query(`
            UPDATE users 
            SET deleted_at = NOW(), is_active = false, updated_at = NOW()
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING id, name
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Staff member not found or already deleted' });
        }

        return res.status(200).json({
            success: true,
            message: `Staff member "${result.rows[0].name}" removed successfully`,
        });
    } catch (err) {
        console.error('Error in deleteStaff:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete staff member', error: err.message });
    }
};
