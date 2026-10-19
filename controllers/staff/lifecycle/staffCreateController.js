const pool = require('../../../config/db');
const { hashPassword } = require('../../../config/auth');
const { normalizeRole } = require('./staffRoleHelper');

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
            notes = '',
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
            notes ? notes.trim() : null,
        ]);

        return res.status(201).json({
            success: true,
            message: `Staff account for "${insertResult.rows[0].name}" created successfully`,
            data: insertResult.rows[0],
        });
    } catch (err) {
        console.error('Error in createStaff:', err);
        return res.status(500).json({ success: false, message: 'Failed to create staff account', error: err.message });
    }
};
