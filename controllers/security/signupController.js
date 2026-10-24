const pool = require('../../config/db');
const { hashPassword, createSessionToken } = require('../../config/auth');
const { hashSessionToken } = require('../../middlewares/authMiddleware');
const { ensureSecurityTables } = require('./securitySchema');

// Sign Up (Online User Auto-approved vs Staff/Technician Admin-confirmed)
exports.signup = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { name, identifier, password, user_type = 'online', staff_role = 'Field Technician' } = req.body;
        const cleanName = (name || '').trim();
        const rawId = (identifier || '').trim();
        const pass = (password || '').trim();

        if (!cleanName || !rawId || !pass) {
            return res.status(400).json({
                success: false,
                message: 'Full name, phone/email, and password are required.'
            });
        }

        const cleanEmail = rawId.toLowerCase();
        const digitsOnly = rawId.replace(/[^0-9]/g, '');
        let cleanPhone = rawId;
        let isPhone = false;
        if (digitsOnly.length === 11 && digitsOnly.startsWith('01')) {
            cleanPhone = digitsOnly;
            isPhone = true;
        } else if (digitsOnly.length === 13 && digitsOnly.startsWith('8801')) {
            cleanPhone = '0' + digitsOnly.slice(3);
            isPhone = true;
        }

        // Check duplicate account
        const dupCheck = await pool.query(`
            SELECT id FROM users
            WHERE (LOWER(email) = $1 OR phone = $2 OR phone = $3) AND deleted_at IS NULL
        `, [cleanEmail, cleanPhone, rawId]);

        if (dupCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'An account already exists with this phone number or email!'
            });
        }

        const isOnline = (user_type === 'online');
        const roleName = isOnline ? 'Customer / Online User' : (staff_role || 'Field Technician');
        const roleId = isOnline ? 5 : 4;
        const approvalStatus = isOnline ? 'approved' : 'pending_approval';
        const isActive = isOnline;

        const insRes = await pool.query(`
            INSERT INTO users (name, phone, email, password_hash, role_id, role_name, is_active, approval_status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING id, name, phone, email, role_id, role_name, is_active, approval_status, created_at;
        `, [
            cleanName,
            isPhone ? cleanPhone : (rawId.includes('@') ? '' : rawId),
            rawId.includes('@') ? cleanEmail : null,
            await hashPassword(pass),
            roleId,
            roleName,
            isActive,
            approvalStatus
        ]);

        const newUser = insRes.rows[0];

        if (isOnline) {
            const token = createSessionToken();
            await pool.query('UPDATE users SET current_session_token = $1, session_last_active = NOW() WHERE id = $2', [hashSessionToken(token), newUser.id]);
            return res.status(201).json({
                success: true,
                auto_login: true,
                message: 'Registration as online user was successful!',
                token,
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    phone: newUser.phone,
                    role_id: newUser.role_id,
                    role_name: newUser.role_name
                }
            });
        } else {
            return res.status(201).json({
                success: true,
                auto_login: false,
                message: 'Staff/technician registration submitted! You will be able to log in once approved by the shop administrator.',
                user: newUser
            });
        }
    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({ success: false, message: 'Registration error: ' + err.message });
    }
};
