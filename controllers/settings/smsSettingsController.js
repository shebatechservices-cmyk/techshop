const pool = require('../../config/db');
const smsService = require('../../services/smsService');
const { ensureSettingsTables } = require('./generalSettingsController');

// SMS Gateway Providers CRUD & Actions
exports.getSmsProviders = async (req, res) => {
    try {
        await ensureSettingsTables();
        const result = await pool.query('SELECT * FROM sms_providers ORDER BY id ASC');
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.createSmsProvider = async (req, res) => {
    try {
        await ensureSettingsTables();
        const {
            provider_name,
            provider_code,
            api_url,
            http_method = 'GET',
            auth_type = 'param',
            api_key = '',
            api_secret = '',
            sender_id = '',
            param_phone_key = 'to',
            param_message_key = 'message',
            param_sender_key = 'sender_id',
            param_api_key = 'token',
            extra_params = {},
            balance_endpoint = '',
            balance_response_path = '',
            is_active = false
        } = req.body;

        if (!provider_name || !String(provider_name).trim()) {
            return res.status(400).json({ success: false, message: 'প্রোভাইডারের নাম আবশ্যক' });
        }

        if (is_active) {
            await pool.query('UPDATE sms_providers SET is_active = false');
        }

        const result = await pool.query(`
            INSERT INTO sms_providers (
                provider_name, provider_code, api_url, http_method, auth_type,
                api_key, api_secret, sender_id, param_phone_key, param_message_key,
                param_sender_key, param_api_key, extra_params, balance_endpoint,
                balance_response_path, is_active, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10,
                $11, $12, $13::jsonb, $14,
                $15, $16, NOW(), NOW()
            ) RETURNING *;
        `, [
            provider_name,
            provider_code || provider_name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            api_url || '',
            http_method.toUpperCase(),
            auth_type,
            api_key,
            api_secret,
            sender_id,
            param_phone_key,
            param_message_key,
            param_sender_key,
            param_api_key,
            typeof extra_params === 'string' ? extra_params : JSON.stringify(extra_params),
            balance_endpoint,
            balance_response_path,
            !!is_active
        ]);

        return res.status(201).json({
            success: true,
            message: 'এসএমএস গেটওয়ে প্রোভাইডার যোগ করা হয়েছে!',
            data: result.rows[0]
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateSmsProvider = async (req, res) => {
    try {
        await ensureSettingsTables();
        const { id } = req.params;
        const {
            provider_name,
            provider_code,
            api_url,
            http_method,
            auth_type,
            api_key,
            api_secret,
            sender_id,
            param_phone_key,
            param_message_key,
            param_sender_key,
            param_api_key,
            extra_params,
            balance_endpoint,
            balance_response_path,
            is_active
        } = req.body;

        if (is_active) {
            await pool.query('UPDATE sms_providers SET is_active = false WHERE id != $1', [id]);
        }

        const result = await pool.query(`
            UPDATE sms_providers SET
                provider_name = COALESCE($1, provider_name),
                provider_code = COALESCE($2, provider_code),
                api_url = COALESCE($3, api_url),
                http_method = COALESCE($4, http_method),
                auth_type = COALESCE($5, auth_type),
                api_key = COALESCE($6, api_key),
                api_secret = COALESCE($7, api_secret),
                sender_id = COALESCE($8, sender_id),
                param_phone_key = COALESCE($9, param_phone_key),
                param_message_key = COALESCE($10, param_message_key),
                param_sender_key = COALESCE($11, param_sender_key),
                param_api_key = COALESCE($12, param_api_key),
                extra_params = CASE WHEN $13::text IS NOT NULL THEN $13::jsonb ELSE extra_params END,
                balance_endpoint = COALESCE($14, balance_endpoint),
                balance_response_path = COALESCE($15, balance_response_path),
                is_active = COALESCE($16, is_active),
                updated_at = NOW()
            WHERE id = $17
            RETURNING *;
        `, [
            provider_name,
            provider_code,
            api_url,
            http_method ? http_method.toUpperCase() : undefined,
            auth_type,
            api_key,
            api_secret,
            sender_id,
            param_phone_key,
            param_message_key,
            param_sender_key,
            param_api_key,
            extra_params !== undefined ? (typeof extra_params === 'string' ? extra_params : JSON.stringify(extra_params)) : null,
            balance_endpoint,
            balance_response_path,
            is_active !== undefined ? !!is_active : undefined,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'প্রোভাইডার পাওয়া যায়নি' });
        }

        return res.status(200).json({
            success: true,
            message: 'প্রোভাইডার তথ্য সফলভাবে আপডেট হয়েছে!',
            data: result.rows[0]
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

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
