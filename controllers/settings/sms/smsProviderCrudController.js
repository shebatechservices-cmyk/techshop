const pool = require('../../../config/db');
const { ensureSettingsTables } = require('../generalSettingsController');

// SMS Gateway Providers Query & Mutation
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
