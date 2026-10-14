const pool = require('../../../config/db');
const { ensureSettingsTables } = require('./settingsSchemaMigration');

// Update Invoice Design & Print Template Specifically
exports.updatePrintTemplate = async (req, res) => {
    try {
        await ensureSettingsTables();
        const body = req.body;

        const fields = [
            'default_invoice_format', 'invoice_color_scheme', 'invoice_template',
            'show_logo_on_invoice', 'show_qr_on_invoice', 'show_signature_on_invoice',
            'logo_url', 'secondary_logo_url', 'sister_concern_name', 'show_sister_concern',
            'watermark_logo_url', 'watermark_opacity', 'enable_watermark',
            'invoice_footer_note', 'footer_greeting',
            'invoice_terms', 'thermal_tc_clause',
            'warranty_policy', 'warranty_disclaimer_text',
            'return_refund_policy', 'return_policy_text',
            'invoice_brand_logos', 'footer_partner_logos',
            'paper_size', 'page_margin', 'show_footer_details'
        ];

        let updates = [];
        let values = [];
        let index = 1;

        for (const field of fields) {
            if (body[field] !== undefined) {
                if (field === 'invoice_brand_logos' || field === 'footer_partner_logos') {
                    let logos = body[field];
                    if (typeof logos === 'string') {
                        try { logos = JSON.parse(logos); } catch (_) { logos = []; }
                    }
                    if (Array.isArray(logos)) {
                        logos = logos.slice(0, 12);
                    }
                    updates.push(`${field} = $${index}::jsonb`);
                    values.push(JSON.stringify(logos || []));
                } else {
                    updates.push(`${field} = $${index}`);
                    values.push(body[field]);
                }
                index++;
            }
        }

        if (updates.length > 0) {
            updates.push('updated_at = NOW()');
            const query = `UPDATE shop_settings SET ${updates.join(', ')} WHERE id = 1 RETURNING *`;
            const result = await pool.query(query, values);
            return res.status(200).json({
                success: true,
                message: 'প্রিন্ট ও ইনভয়েস ডিজাইন সফলভাবে সংরক্ষিত হয়েছে!',
                data: result.rows[0]
            });
        }

        const current = await pool.query('SELECT * FROM shop_settings WHERE id = 1');
        return res.status(200).json({ success: true, data: current.rows[0] });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
