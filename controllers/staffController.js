const pool = require('../config/db');
const { hashPassword } = require('../config/auth');

/**
 * Get all staff members with stats & filtering
 */
exports.getStaff = async (req, res) => {
    try {
        const { search = '', role_id, status = 'all', page = 1, limit = 50 } = req.query;
        const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

        let whereClauses = ['u.deleted_at IS NULL'];
        const values = [];
        let valIndex = 1;

        if (search && search.trim()) {
            const term = `%${search.trim()}%`;
            whereClauses.push(`(u.name ILIKE $${valIndex} OR u.phone ILIKE $${valIndex} OR u.email ILIKE $${valIndex} OR u.designation ILIKE $${valIndex})`);
            values.push(term);
            valIndex++;
        }

        if (role_id && role_id !== 'all') {
            whereClauses.push(`u.role_id = $${valIndex}`);
            values.push(parseInt(role_id, 10));
            valIndex++;
        }

        if (status === 'active') {
            whereClauses.push(`u.is_active = true AND u.is_locked = false`);
        } else if (status === 'inactive') {
            whereClauses.push(`(u.is_active = false OR u.is_locked = true)`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Query staff list
        const listQuery = `
            SELECT 
                u.id,
                u.name,
                u.phone,
                u.email,
                u.role_id,
                COALESCE(r.name, u.role_name, 'Staff') AS role_name,
                u.is_active,
                u.is_locked,
                u.approval_status,
                u.designation,
                u.salary,
                u.address,
                u.emergency_contact,
                u.joining_date,
                u.notes,
                u.last_login,
                u.created_at,
                u.wallet_balance
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            ${whereSql}
            ORDER BY u.id ASC
            LIMIT $${valIndex} OFFSET $${valIndex + 1}
        `;
        values.push(parseInt(limit, 10), offset);

        const [staffResult, countResult, statsResult] = await Promise.all([
            pool.query(listQuery, values),
            pool.query(`SELECT COUNT(*) AS total FROM users u ${whereSql}`, values.slice(0, valIndex - 1)),
            pool.query(`
                SELECT 
                    COUNT(*) AS total_staff,
                    COUNT(*) FILTER (WHERE is_active = true AND is_locked = false) AS active_staff,
                    COUNT(*) FILTER (WHERE is_active = false OR is_locked = true) AS inactive_staff,
                    COUNT(*) FILTER (WHERE role_id IN (1, 2) OR LOWER(role_name) LIKE '%admin%') AS admin_count,
                    COUNT(*) FILTER (WHERE role_id = 4 OR LOWER(role_name) LIKE '%tech%') AS tech_count,
                    COALESCE(SUM(salary), 0) AS total_monthly_payroll
                FROM users
                WHERE deleted_at IS NULL
            `)
        ]);

        const stats = statsResult.rows[0] || {
            total_staff: 0,
            active_staff: 0,
            inactive_staff: 0,
            admin_count: 0,
            tech_count: 0,
            total_monthly_payroll: 0
        };

        return res.status(200).json({
            success: true,
            data: staffResult.rows,
            total: parseInt(countResult.rows[0]?.total || 0, 10),
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            stats: {
                totalStaff: parseInt(stats.total_staff, 10),
                activeStaff: parseInt(stats.active_staff, 10),
                inactiveStaff: parseInt(stats.inactive_staff, 10),
                adminCount: parseInt(stats.admin_count, 10),
                techCount: parseInt(stats.tech_count, 10),
                totalMonthlyPayroll: parseFloat(stats.total_monthly_payroll || 0)
            }
        });
    } catch (err) {
        console.error('Error in getStaff:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch staff members', error: err.message });
    }
};

/**
 * Get available roles for assignment
 */
exports.getRoles = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, permissions, description FROM roles ORDER BY id ASC');
        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error in getRoles:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch roles', error: err.message });
    }
};

/**
 * Get single staff member by ID
 */
exports.getStaffById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT 
                u.id,
                u.name,
                u.phone,
                u.email,
                u.role_id,
                COALESCE(r.name, u.role_name, 'Staff') AS role_name,
                r.permissions AS role_permissions,
                u.is_active,
                u.is_locked,
                u.approval_status,
                u.designation,
                u.salary,
                u.address,
                u.emergency_contact,
                u.joining_date,
                u.notes,
                u.last_login,
                u.created_at,
                u.wallet_balance
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = $1 AND u.deleted_at IS NULL
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Staff member not found' });
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error in getStaffById:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch staff member', error: err.message });
    }
};

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
            role_id = 3,
            designation = 'Staff Member',
            salary = 0,
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
            return res.status(400).json({ success: false, message: 'At least a phone number or email is required' });
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

        // Get Role name
        let roleName = 'Staff';
        const roleRes = await pool.query('SELECT name FROM roles WHERE id = $1', [role_id]);
        if (roleRes.rows.length > 0) {
            roleName = roleRes.rows[0].name;
        }

        const passwordHash = await hashPassword(password.trim());

        const insertResult = await pool.query(`
            INSERT INTO users (
                name, phone, email, password_hash, role_id, role_name,
                designation, salary, address, emergency_contact, joining_date,
                is_active, approval_status, notes, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'approved', $13, NOW(), NOW())
            RETURNING id, name, phone, email, role_id, role_name, designation, salary, is_active, created_at
        `, [
            name.trim(),
            phone ? phone.trim() : null,
            email ? email.trim() : null,
            passwordHash,
            role_id,
            roleName,
            designation.trim(),
            parseFloat(salary) || 0,
            address ? address.trim() : null,
            emergency_contact ? emergency_contact.trim() : null,
            joining_date ? new Date(joining_date) : new Date(),
            is_active === true || is_active === 'true',
            notes ? notes.trim() : null
        ]);

        return res.status(201).json({
            success: true,
            message: `Staff member "${name}" created successfully`,
            data: insertResult.rows[0]
        });
    } catch (err) {
        console.error('Error in createStaff:', err);
        return res.status(500).json({ success: false, message: 'Failed to create staff member', error: err.message });
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
            role_id,
            designation,
            salary,
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

        // Get Role name
        let roleName = existing.role_name;
        if (role_id && role_id !== existing.role_id) {
            const roleRes = await pool.query('SELECT name FROM roles WHERE id = $1', [role_id]);
            if (roleRes.rows.length > 0) {
                roleName = roleRes.rows[0].name;
            }
        }

        // Handle password update if supplied
        let passwordHash = existing.password_hash;
        if (password && password.trim().length >= 4) {
            passwordHash = await hashPassword(password.trim());
        }

        const updateResult = await pool.query(`
            UPDATE users SET
                name = COALESCE($1, name),
                phone = $2,
                email = $3,
                password_hash = $4,
                role_id = COALESCE($5, role_id),
                role_name = COALESCE($6, role_name),
                designation = COALESCE($7, designation),
                salary = COALESCE($8, salary),
                address = $9,
                emergency_contact = $10,
                joining_date = COALESCE($11, joining_date),
                is_active = COALESCE($12, is_active),
                is_locked = COALESCE($13, is_locked),
                notes = $14,
                updated_at = NOW()
            WHERE id = $15
            RETURNING id, name, phone, email, role_id, role_name, designation, salary, is_active, is_locked, updated_at
        `, [
            name ? name.trim() : null,
            phone !== undefined ? (phone ? phone.trim() : null) : existing.phone,
            email !== undefined ? (email ? email.trim() : null) : existing.email,
            passwordHash,
            role_id || null,
            roleName || null,
            designation !== undefined ? designation : null,
            salary !== undefined ? parseFloat(salary) : null,
            address !== undefined ? address : existing.address,
            emergency_contact !== undefined ? emergency_contact : existing.emergency_contact,
            joining_date ? new Date(joining_date) : null,
            is_active !== undefined ? is_active : null,
            is_locked !== undefined ? is_locked : null,
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
