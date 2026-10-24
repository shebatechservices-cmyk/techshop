const pool = require('../../config/db');
const { createSessionToken, hashSessionToken } = require('../../middlewares/authMiddleware');

function maskEmail(email) {
    if (!email || !email.includes('@')) return 'your registered email';
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name[0]}${'*'.repeat(Math.min(name.length - 2, 5))}${name.slice(-1)}@${domain}`;
}

async function completeVerifiedSession(user, devId) {
    const token = createSessionToken();
    const tokenHash = hashSessionToken(token);

    await pool.query(`
        UPDATE users
        SET last_login = NOW(), failed_login_count = 0, is_locked = false,
            current_session_token = $1, session_last_active = NOW()
        WHERE id = $2
    `, [tokenHash, user.id]);

    await pool.query(`
        UPDATE trusted_devices
        SET is_authorized = true, approval_status = 'APPROVED', last_active = NOW()
        WHERE device_id = $1 AND user_id = $2
    `, [devId, user.id]);

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role || 'STAFF',
            role_id: user.role_id || 1,
            role_name: user.role_name || user.role_title || 'Staff',
            designation: user.designation || '',
            wallet_balance: parseFloat(user.wallet_balance || 0),
        }
    };
}

module.exports = {
    maskEmail,
    completeVerifiedSession,
};
