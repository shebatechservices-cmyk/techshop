const pool = require('../../config/db');

/**
 * Ensures table for two-factor verification codes and pending device approvals.
 */
async function ensureTwoFactorTables() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS device_verification_codes (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                device_id VARCHAR(100) NOT NULL,
                device_name VARCHAR(150),
                verification_token VARCHAR(120) UNIQUE NOT NULL,
                code_hash VARCHAR(100) NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                attempts INT DEFAULT 0,
                is_used BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_dev_verif_token ON device_verification_codes(verification_token);
            CREATE INDEX IF NOT EXISTS idx_dev_verif_user_dev ON device_verification_codes(user_id, device_id);

            ALTER TABLE trusted_devices ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) DEFAULT 'APPROVED';
        `);
    } catch (err) {
        console.error('ensureTwoFactorTables error:', err.message);
    }
}

module.exports = {
    ensureTwoFactorTables,
};
