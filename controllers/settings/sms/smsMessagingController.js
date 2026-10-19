const pool = require('../../../config/db');
const smsService = require('../../../services/smsService');
const { ensureSettingsTables } = require('../generalSettingsController');

// SMS Balance Check
exports.getSmsBalance = async (req, res) => {
    try {
        await ensureSettingsTables();
        const providerId = req.query.provider_id || null;
        const balanceResult = await smsService.fetchProviderBalance(providerId);
        return res.status(200).json(balanceResult);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Bulk SMS Broadcast
exports.sendBulkSms = async (req, res) => {
    try {
        await ensureSettingsTables();
        const { targetGroup, customNumbers, message, provider_id } = req.body;

        if (!message || !String(message).trim()) {
            return res.status(400).json({ success: false, message: 'এসএমএস বার্তা লিখুন' });
        }

        let recipients = [];
        if (customNumbers && customNumbers.trim()) {
            const raw = customNumbers.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length >= 10);
            recipients = raw.map(phone => ({ phone, name: 'Recipient' }));
        } else if (targetGroup === 'due_customers') {
            const dueCustRes = await pool.query('SELECT phone, name FROM customers WHERE current_balance > 0 AND phone IS NOT NULL AND deleted_at IS NULL LIMIT 100').catch(() => ({ rows: [] }));
            recipients = dueCustRes.rows;
        } else if (targetGroup === 'all_customers') {
            const allCustRes = await pool.query('SELECT phone, name FROM customers WHERE phone IS NOT NULL AND deleted_at IS NULL LIMIT 100').catch(() => ({ rows: [] }));
            recipients = allCustRes.rows;
        } else if (targetGroup === 'technicians') {
            const techRes = await pool.query("SELECT phone, name FROM users WHERE role_id = 3 AND phone IS NOT NULL AND is_active = true LIMIT 50").catch(() => ({ rows: [] }));
            recipients = techRes.rows;
        }

        if (recipients.length === 0) {
            return res.status(400).json({ success: false, message: 'কোনো প্রাপক বা মোবাইল নম্বর পাওয়া যায়নি' });
        }

        let sentCount = 0;
        let failCount = 0;

        for (const item of recipients.slice(0, 100)) {
            const resDispatch = await smsService.sendSms({
                phone: item.phone,
                message: message.trim(),
                trigger_key: 'bulk_broadcast',
                recipient_name: item.name || 'Broadcast Recipient',
                provider_id: provider_id || null
            });
            if (resDispatch.success) sentCount++;
            else failCount++;
        }

        return res.status(200).json({
            success: true,
            message: `মোট ${sentCount} টি নম্বরে এসএমএস প্রেরিত হয়েছে${failCount > 0 ? ` (${failCount} টি ব্যর্থ)` : ''}!`,
            sentCount,
            failCount
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Automated Helper for other controllers
exports.sendAutomatedSms = async (trigger_key, phone, recipient_name, tokenMap = {}, provider_id = null) => {
    try {
        await ensureSettingsTables();
        const res = await pool.query('SELECT * FROM sms_trigger_settings WHERE trigger_key = $1 AND is_enabled = true', [trigger_key]);
        if (res.rows.length === 0) return null;

        const trigger = res.rows[0];
        const message = smsService.parseSmsTemplate(trigger.template_bn, tokenMap);

        return await smsService.sendSms({
            phone,
            message,
            trigger_key,
            recipient_name: recipient_name || 'Customer',
            provider_id
        });
    } catch (err) {
        console.warn('sendAutomatedSms error:', err.message);
        return null;
    }
};

// SMS Gateway Test Message Dispatch
exports.sendTestSms = async (req, res) => {
    try {
        await ensureSettingsTables();
        const { phone, message, provider_id } = req.body;
        if (!phone || !String(phone).trim()) {
            return res.status(400).json({ success: false, message: 'অনুগ্রহ করে গ্রাহক বা এডমিনের মোবাইল নম্বর দিন' });
        }

        const shopRes = await pool.query('SELECT shop_name FROM shop_settings WHERE id = 1').catch(() => ({ rows: [{}] }));
        const shopName = shopRes.rows[0]?.shop_name || 'Sheba Technology';
        const textContent = message || `[${shopName}] টেস্ট নোটিফিকেশন এসএমএস। গেটওয়ে সফলভাবে সংযুক্ত হয়েছে।`;

        const dispatchResult = await smsService.sendSms({
            phone: phone,
            message: textContent,
            trigger_key: 'manual_test',
            recipient_name: 'Test Recipient',
            provider_id: provider_id || null
        });

        if (dispatchResult.success) {
            return res.status(200).json({
                success: true,
                message: `টেস্ট এসএমএস সফলভাবে প্রেরিত হয়েছে! (${dispatchResult.provider})`,
                delivery: dispatchResult
            });
        } else {
            return res.status(200).json({
                success: false,
                message: dispatchResult.error || 'এসএমএস প্রেরণ ব্যর্থ হয়েছে। গেটওয়ে কনফিগারেশন চেক করুন।',
                delivery: dispatchResult
            });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
