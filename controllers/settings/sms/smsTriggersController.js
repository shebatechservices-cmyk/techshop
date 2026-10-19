const pool = require('../../../config/db');
const { ensureSettingsTables } = require('../generalSettingsController');

// SMS Triggers
exports.getSmsTriggers = async (req, res) => {
    try {
        await ensureSettingsTables();
        const result = await pool.query('SELECT * FROM sms_trigger_settings ORDER BY id ASC');
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateSmsTriggers = async (req, res) => {
    try {
        await ensureSettingsTables();
        const { triggers } = req.body;

        if (Array.isArray(triggers)) {
            for (const t of triggers) {
                await pool.query(
                    'UPDATE sms_trigger_settings SET is_enabled = $1, template_bn = $2, updated_at = NOW() WHERE trigger_key = $3',
                    [!!t.is_enabled, t.template_bn, t.trigger_key]
                );
            }
        } else if (req.body.trigger_key) {
            const { trigger_key, is_enabled, template_bn } = req.body;
            await pool.query(
                'UPDATE sms_trigger_settings SET is_enabled = COALESCE($1, is_enabled), template_bn = COALESCE($2, template_bn), updated_at = NOW() WHERE trigger_key = $3',
                [is_enabled, template_bn, trigger_key]
            );
        }

        const updated = await pool.query('SELECT * FROM sms_trigger_settings ORDER BY id ASC');
        return res.status(200).json({
            success: true,
            message: 'এসএমএস ট্রিগার সেটিংস সফলভাবে আপডেট হয়েছে!',
            data: updated.rows
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// SMS Transmission Logs
exports.getSmsLogs = async (req, res) => {
    try {
        await ensureSettingsTables();
        const result = await pool.query('SELECT * FROM sms_logs ORDER BY created_at DESC LIMIT 100');
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
