const pool = require('../../config/db');
const { hashPassword } = require('../../config/auth');

/**
 * Helper to normalize role enum
 */
function normalizeRole(role, roleName, roleId) {
    if (role && ['ADMIN', 'STAFF', 'TECHNICIAN'].includes(String(role).toUpperCase())) {
        return String(role).toUpperCase();
    }
    const name = String(roleName || '').toLowerCase();
    if (name.includes('admin') || roleId === 1) return 'ADMIN';
    if (name.includes('technician') || name.includes('tech') || roleId === 4) return 'TECHNICIAN';
    return 'STAFF';
}

/**
 * Create new staff member
 */
exports.createStaff = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            password,
            role = 'STAFF',
            role_id = 3,
            designation = 'Staff Member',
            salary = 0,
            wallet_balance = 0,
            address = '',
            emergency_contact = '',
            joining_date = new Date().toISOString(),
            is_active = true,
            notes = ''
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Staff name is required' });
        }
        if (!phone && !email) {
            return res.status(400).json({ success: false, message: 'At least a phone number or email (User ID) is required' });
        }
        if (!password || password.trim().length < 4) {
            return res.status(400).json({ success: false, message: 'Password must be at least 4 characters long' });
        }

        // Check duplicates
        if (phone) {
            const existingPhone = await pool.query('SELECT id FROM users WHERE phone = $1 AND deleted_at IS NULL', [phone.trim()]);
            if (existingPhone.rows.length > 0) {
                return res.status(400).json({ success: false, message: 'A staff member with this phone number already exists' });
            }
        }

        if (email) {
            const existingEmail = await pool.query('SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL', [email.trim()]);
            if (existingEmail.rows.length > 0) {
                return res.status(400).json({ success: false, message: 'A staff member with this email already exists' });
            }
        }

        // Normalize role and role_name
        const parsedRoleId = parseInt(role_id, 10) || (String(role).toUpperCase() === 'TECHNICIAN' ? 4 : String(role).toUpperCase() === 'ADMIN' ? 1 : 3);
        let roleName = 'Staff';
        const roleRes = await pool.query('SELECT name FROM roles WHERE id = $1', [parsedRoleId]);
        if (roleRes.rows.length > 0) {
            roleName = roleRes.rows[0].name;
        } else {
            if (role === 'ADMIN' || parsedRoleId === 1) roleName = 'Shop Admin';
            else if (role === 'TECHNICIAN' || parsedRoleId === 4) roleName = 'Field Technician';
            else roleName = 'Staff';
        }

        const resolvedRole = normalizeRole(role, roleName, parsedRoleId);
        const passwordHash = await hashPassword(password.trim());
        const parsedIsActive = is_active === undefined ? true : (is_active === true || is_active === 'true' || is_active === 1 || is_active === '1');

        const insertResult = await pool.query(`
            INSERT INTO users (
                name, phone, email, password_hash, role, role_id, role_name,
                designation, salary, wallet_balance, address, emergency_contact, joining_date,
                is_active, approval_status, notes, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'approved', $15, NOW(), NOW())
            RETURNING id, name, phone, email, role, role_id, role_name, designation, salary, wallet_balance, is_active, created_at
        `, [
            name.trim(),
            phone ? phone.trim() : null,
            email ? email.trim() : null,
            passwordHash,
            resolvedRole,
            parsedRoleId,
            roleName,
            designation ? designation.trim() : (resolvedRole === 'TECHNICIAN' ? 'Field Technician' : 'Staff Member'),
            parseFloat(salary) || 0,
            parseFloat(wallet_balance) || 0,
            address ? address.trim() : null,
            emergency_contact ? emergency_contact.trim() : null,
            joining_date ? new Date(joining_date) : new Date(),
            parsedIsActive,
            notes ? notes.trim() : null
        ]);

        return res.status(201).json({
            success: true,
            message: `Staff account for "${insertResult.rows[0].name}" created successfully`,
            data: insertResult.rows[0]
        });
    } catch (err) {
        console.error('Error in createStaff:', err);
        return res.status(500).json({ success: false, message: 'Failed to create staff account', error: err.message });
    }
};

/**
 * Update staff member details
 */
exports.updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            phone,
            email,
            password,
            role,
            role_id,
            designation,
            salary,
            wallet_balance,
            address,
            emergency_contact,
            joining_date,
            is_active,
            is_locked,
            notes
        } = req.body;

        const checkRes = await pool.query('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (checkRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Staff member not found' });
        }

        const existing = checkRes.rows[0];

        // Safeguard root Super Admin
        if (Number(id) === 1) {
            if (is_active === false || is_active === 'false' || is_locked === true) {
                return res.status(403).json({ success: false, message: 'Primary Super Admin account cannot be deactivated or locked' });
            }
        }

        // Check duplicates if phone/email changed
        if (phone && phone.trim() !== (existing.phone || '')) {
            const dupPhone = await pool.query('SELECT id FROM users WHERE phone = $1 AND id != $2 AND deleted_at IS NULL', [phone.trim(), id]);
            if (dupPhone.rows.length > 0) {
                return res.status(400).json({ success: false, message: 'Phone number is already used by another staff member' });
            }
        }

        if (email && email.trim() !== (existing.email || '')) {
            const dupEmail = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2 AND deleted_at IS NULL', [email.trim(), id]);
            if (dupEmail.rows.length > 0) {
                return res.status(400).json({ success: false, message: 'Email is already used by another staff member' });
            }
        }

        // Determine Role name
        let roleName = existing.role_name;
        if (role_id && role_id !== existing.role_id) {
            const roleRes = await pool.query('SELECT name FROM roles WHERE id = $1', [role_id]);
            if (roleRes.rows.length > 0) {
                roleName = roleRes.rows[0].name;
            }
        }

        const resolvedRole = role ? normalizeRole(role, roleName, parseInt(role_id || existing.role_id, 10)) : existing.role;

        // Handle password update if supplied
        let passwordHash = existing.password_hash;
        if (password && password.trim().length >= 4) {
            passwordHash = await hashPassword(password.trim());
        }

        const updateResult = await pool.query(`
            UPDATE users SET
                name = COALESCE($1, name),
                phone = COALESCE($2, phone),
                email = COALESCE($3, email),
                password_hash = $4,
                role = COALESCE($5, role),
                role_id = COALESCE($6, role_id),
                role_name = COALESCE($7, role_name),
                designation = COALESCE($8, designation),
                salary = COALESCE($9, salary),
                wallet_balance = COALESCE($10, wallet_balance),
                address = COALESCE($11, address),
                emergency_contact = COALESCE($12, emergency_contact),
                joining_date = COALESCE($13, joining_date),
                is_active = COALESCE($14, is_active),
                is_locked = COALESCE($15, is_locked),
                notes = COALESCE($16, notes),
                updated_at = NOW()
            WHERE id = $17 AND deleted_at IS NULL
            RETURNING id, name, phone, email, role, role_id, role_name, designation, salary, wallet_balance, is_active, is_locked, updated_at
        `, [
            name ? name.trim() : existing.name,
            phone !== undefined ? (phone ? phone.trim() : null) : existing.phone,
            email !== undefined ? (email ? email.trim() : null) : existing.email,
            passwordHash,
            resolvedRole,
            role_id !== undefined ? parseInt(role_id, 10) : existing.role_id,
            roleName,
            designation !== undefined ? designation.trim() : existing.designation,
            salary !== undefined ? parseFloat(salary) : existing.salary,
            wallet_balance !== undefined ? parseFloat(wallet_balance) : existing.wallet_balance,
            address !== undefined ? address : existing.address,
            emergency_contact !== undefined ? emergency_contact : existing.emergency_contact,
            joining_date ? new Date(joining_date) : existing.joining_date,
            is_active !== undefined ? Boolean(is_active) : existing.is_active,
            is_locked !== undefined ? Boolean(is_locked) : existing.is_locked,
            notes !== undefined ? notes : existing.notes,
            id
        ]);

        return res.status(200).json({
            success: true,
            message: `Staff member "${updateResult.rows[0].name}" updated successfully`,
            data: updateResult.rows[0]
        });
    } catch (err) {
        console.error('Error in updateStaff:', err);
        return res.status(500).json({ success: false, message: 'Failed to update staff member', error: err.message });
    }
};

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
            data: result.rows[0]
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
            message: `Staff member "${result.rows[0].name}" removed successfully`
        });
    } catch (err) {
        console.error('Error in deleteStaff:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete staff member', error: err.message });
    }
};
