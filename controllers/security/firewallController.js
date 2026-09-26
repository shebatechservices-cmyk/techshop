const pool = require('../../config/db');
const { ensureSecurityTables } = require('./securitySchema');

// Get IP Rules (Firewall Whitelist & Blacklist)
exports.getIpRules = async (req, res) => {
    try {
        await ensureSecurityTables();
        const result = await pool.query("SELECT * FROM ip_rules ORDER BY id DESC;");
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get IP rules error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Create IP Rule (Whitelist / Blacklist)
exports.createIpRule = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { ip_address, rule_type = 'block', reason } = req.body;
        if (!ip_address) {
            return res.status(400).json({ success: false, message: "IP address is required." });
        }

        const query = `
            INSERT INTO ip_rules (ip_address, rule_type, reason, blocked_attempts)
            VALUES ($1, $2, $3, 0)
            ON CONFLICT (ip_address) DO UPDATE SET
                rule_type = EXCLUDED.rule_type,
                reason = EXCLUDED.reason
            RETURNING *;
        `;
        const result = await pool.query(query, [ip_address.trim(), rule_type, reason || null]);
        return res.status(201).json({ success: true, message: `IP Rule (${rule_type.toUpperCase()}) saved successfully!`, data: result.rows[0] });
    } catch (error) {
        console.error('Create IP rule error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Delete IP Rule
exports.deleteIpRule = async (req, res) => {
    try {
        await ensureSecurityTables();
        const { id } = req.params;
        await pool.query("DELETE FROM ip_rules WHERE id = $1", [id]);
        return res.status(200).json({ success: true, message: "IP rule deleted successfully." });
    } catch (error) {
        console.error('Delete IP rule error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
