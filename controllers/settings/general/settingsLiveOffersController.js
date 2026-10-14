const pool = require('../../../config/db');
const { ensureSettingsTables } = require('./settingsSchemaMigration');

exports.updateLiveOffers = async (req, res) => {
    try {
        await ensureSettingsTables();
        const {
            customer_offer_headline,
            customer_offer_enabled,
            technician_offer_headline,
            technician_offer_enabled,
        } = req.body;

        const updateRes = await pool.query(`
            UPDATE shop_settings
            SET customer_offer_headline = COALESCE($1, customer_offer_headline),
                customer_offer_enabled = COALESCE($2, customer_offer_enabled),
                technician_offer_headline = COALESCE($3, technician_offer_headline),
                technician_offer_enabled = COALESCE($4, technician_offer_enabled),
                updated_at = NOW()
            WHERE id = 1
            RETURNING customer_offer_headline, customer_offer_enabled, technician_offer_headline, technician_offer_enabled;
        `, [
            customer_offer_headline !== undefined ? customer_offer_headline : null,
            customer_offer_enabled !== undefined ? customer_offer_enabled : null,
            technician_offer_headline !== undefined ? technician_offer_headline : null,
            technician_offer_enabled !== undefined ? technician_offer_enabled : null
        ]);

        return res.status(200).json({
            success: true,
            message: 'কোর অফারসমূহ সফলভাবে আপডেট করা হয়েছে।',
            data: updateRes.rows[0]
        });
    } catch (err) {
        console.error('updateLiveOffers error:', err);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর: ' + err.message });
    }
};
