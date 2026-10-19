const pool = require('../../../config/db');
const { ensureSettingsTables } = require('../generalSettingsController');

exports.deleteSmsProvider = async (req, res) => {
    try {
        await ensureSettingsTables();
        const { id } = req.params;
        const result = await pool.query('DELETE FROM sms_providers WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'প্রোভাইডার পাওয়া যায়নি' });
        }
        return res.status(200).json({ success: true, message: 'প্রোভাইডার সফলভাবে মুছে ফেলা হয়েছে!' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.setActiveSmsProvider = async (req, res) => {
    try {
        await ensureSettingsTables();
        const { id } = req.params;
        await pool.query('UPDATE sms_providers SET is_active = (id = $1), updated_at = NOW()', [id]);
        const result = await pool.query('SELECT * FROM sms_providers ORDER BY id ASC');
        return res.status(200).json({
            success: true,
            message: 'সক্রিয় এসএমএস গেটওয়ে সফলভাবে সেট করা হয়েছে!',
            data: result.rows
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
