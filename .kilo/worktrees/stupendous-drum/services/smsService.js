const pool = require('../config/db');

/**
 * Replace placeholders in template text: e.g. {customer_name}, {amount}
 */
function parseSmsTemplate(template, tokenMap = {}) {
    if (!template) return '';
    let parsed = template;
    for (const [key, val] of Object.entries(tokenMap)) {
        parsed = parsed.split(`{${key}}`).join(val !== undefined && val !== null ? String(val) : '');
    }
    return parsed;
}

/**
 * Dispatch SMS via configured provider (active provider by default)
 */
async function sendSms({ phone, message, trigger_key = 'manual', recipient_name = 'Customer', provider_id = null }) {
    if (!phone || !String(phone).trim()) {
        throw new Error('ফোন নম্বর দেওয়া হয়নি (Phone number is required)');
    }
    if (!message || !String(message).trim()) {
        throw new Error('এসএমএস বার্তা খালি রাখা যাবে না (Message content cannot be empty)');
    }

    const cleanPhone = String(phone).trim().replace(/[^\d+]/g, '');
    const cleanMessage = String(message).trim();

    // 1. Get provider config
    let provider = null;
    if (provider_id) {
        const pRes = await pool.query('SELECT * FROM sms_providers WHERE id = $1', [provider_id]);
        if (pRes.rows.length > 0) provider = pRes.rows[0];
    }
    if (!provider) {
        const pRes = await pool.query('SELECT * FROM sms_providers WHERE is_active = true ORDER BY id ASC LIMIT 1');
        if (pRes.rows.length > 0) provider = pRes.rows[0];
    }

    // Fallback: check legacy shop_settings
    let shopSettings = null;
    try {
        const sRes = await pool.query('SELECT * FROM shop_settings WHERE id = 1');
        shopSettings = sRes.rows[0];
    } catch (_) {}

    const providerName = provider?.provider_name || shopSettings?.sms_provider || 'Simulated Gateway';
    const apiKey = provider?.api_key || shopSettings?.sms_api_key || '';
    const senderId = provider?.sender_id || shopSettings?.sms_sender_id || '';
    const apiUrl = provider?.api_url || '';
    const httpMethod = (provider?.http_method || 'GET').toUpperCase();
    const smsCount = Math.ceil(cleanMessage.length / 160) || 1;

    let gatewayMsgId = null;
    let deliveryStatus = 'PENDING';
    let rawResponse = null;
    let errorMessage = null;

    if (!apiUrl || !apiKey) {
        // Gateway credentials not configured
        deliveryStatus = 'FAILED';
        errorMessage = 'এসএমএস গেটওয়ে এপিআই কনফিগার করা হয়নি (Gateway credentials not configured)';
        await pool.query(
            'INSERT INTO sms_logs (trigger_key, recipient_phone, recipient_name, message_content, sms_count, provider, gateway_msg_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [trigger_key, cleanPhone, recipient_name, cleanMessage, smsCount, providerName, 'ERR-NO-GATEWAY', 'FAILED']
        ).catch(() => {});

        return {
            success: false,
            status: 'FAILED',
            message: errorMessage,
            provider: providerName,
            recipient: cleanPhone
        };
    }

    // 2. Perform Real HTTP Call to Provider Gateway
    try {
        const phoneKey = provider?.param_phone_key || 'to';
        const msgKey = provider?.param_message_key || 'message';
        const senderKey = provider?.param_sender_key || 'sender_id';
        const apiKeyParam = provider?.param_api_key || 'token';
        const extraParams = typeof provider?.extra_params === 'object' && provider.extra_params !== null ? provider.extra_params : {};

        let response;
        if (httpMethod === 'GET') {
            const url = new URL(apiUrl);
            if (apiKey) url.searchParams.set(apiKeyParam, apiKey);
            if (cleanPhone) url.searchParams.set(phoneKey, cleanPhone);
            if (cleanMessage) url.searchParams.set(msgKey, cleanMessage);
            if (senderId) url.searchParams.set(senderKey, senderId);
            for (const [k, v] of Object.entries(extraParams)) {
                if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            response = await fetch(url.toString(), {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
        } else {
            // POST request
            const headers = { 'Content-Type': 'application/json' };
            if (provider?.auth_type === 'basic' && provider?.api_secret) {
                headers['Authorization'] = `Basic ${Buffer.from(`${apiKey}:${provider.api_secret}`).toString('base64')}`;
            } else if (provider?.auth_type === 'bearer') {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }

            const bodyPayload = {
                ...extraParams
            };
            if (provider?.auth_type !== 'basic' && provider?.auth_type !== 'bearer' && apiKey) {
                bodyPayload[apiKeyParam] = apiKey;
            }
            if (cleanPhone) bodyPayload[phoneKey] = cleanPhone;
            if (cleanMessage) bodyPayload[msgKey] = cleanMessage;
            if (senderId) bodyPayload[senderKey] = senderId;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            response = await fetch(apiUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(bodyPayload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
        }

        const responseText = await response.text();
        rawResponse = responseText;

        // Try to parse JSON or text response
        let parsedJson = null;
        try { parsedJson = JSON.parse(responseText); } catch (_) {}

        if (response.ok) {
            deliveryStatus = 'DELIVERED';
            gatewayMsgId = parsedJson?.message_id || parsedJson?.msg_id || parsedJson?.id || parsedJson?.sid || ('GW-' + Date.now());
        } else {
            deliveryStatus = 'FAILED';
            errorMessage = parsedJson?.message || parsedJson?.error || responseText.slice(0, 200);
            gatewayMsgId = 'ERR-' + response.status;
        }
    } catch (err) {
        deliveryStatus = 'FAILED';
        errorMessage = err.name === 'AbortError' ? 'Gateway Request Timeout' : err.message;
        gatewayMsgId = 'ERR-NET';
    }

    // 3. Record Audit Trail in sms_logs
    try {
        await pool.query(
            'INSERT INTO sms_logs (trigger_key, recipient_phone, recipient_name, message_content, sms_count, provider, gateway_msg_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [trigger_key, cleanPhone, recipient_name, cleanMessage, smsCount, providerName, gatewayMsgId, deliveryStatus]
        );
    } catch (logErr) {
        console.warn('SMS log insert notice:', logErr.message);
    }

    return {
        success: deliveryStatus === 'DELIVERED',
        status: deliveryStatus,
        messageId: gatewayMsgId,
        provider: providerName,
        recipient: cleanPhone,
        content: cleanMessage,
        smsCount,
        error: errorMessage,
        rawResponse
    };
}

/**
 * Live Balance Query from Active SMS Provider
 */
async function fetchProviderBalance(provider_id = null) {
    let provider = null;
    if (provider_id) {
        const pRes = await pool.query('SELECT * FROM sms_providers WHERE id = $1', [provider_id]);
        if (pRes.rows.length > 0) provider = pRes.rows[0];
    }
    if (!provider) {
        const pRes = await pool.query('SELECT * FROM sms_providers WHERE is_active = true ORDER BY id ASC LIMIT 1');
        if (pRes.rows.length > 0) provider = pRes.rows[0];
    }

    if (!provider) {
        return { success: false, message: 'কোনো সক্রিয় এসএমএস গেটওয়ে পাওয়া যায়নি' };
    }

    if (!provider.balance_endpoint || !provider.api_key) {
        return {
            success: false,
            provider: provider.provider_name,
            message: 'ব্যালেন্স এন্ডপয়েন্ট বা এপিআই কি কনফিগার করা হয়নি'
        };
    }

    try {
        let balanceUrl = provider.balance_endpoint.replace('{API_KEY}', encodeURIComponent(provider.api_key));
        if (!balanceUrl.includes(encodeURIComponent(provider.api_key)) && provider.param_api_key) {
            const urlObj = new URL(balanceUrl);
            urlObj.searchParams.set(provider.param_api_key, provider.api_key);
            balanceUrl = urlObj.toString();
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(balanceUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        const text = await res.text();
        let balance = null;
        try {
            const json = JSON.parse(text);
            balance = json.balance || json.credits || json.remaining_sms || json.amount || json.credit;
        } catch (_) {
            const numMatch = text.match(/\d+(\.\d+)?/);
            if (numMatch) balance = numMatch[0];
            else balance = text.trim();
        }

        return {
            success: true,
            provider: provider.provider_name,
            balance: balance !== null ? balance : text.trim(),
            raw: text
        };
    } catch (err) {
        return {
            success: false,
            provider: provider.provider_name,
            message: `ব্যালেন্স চেক করতে সমস্যা: ${err.message}`
        };
    }
}

module.exports = {
    parseSmsTemplate,
    sendSms,
    fetchProviderBalance
};
