const nodemailer = require('nodemailer');
const pool = require('../config/db');

let cachedTransporter = null;

async function getTransporter() {
    if (cachedTransporter) return cachedTransporter;

    // Check environment variables first
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const user = process.env.SMTP_USER || process.env.GMAIL_USER || '';
    const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASS || '';

    if (!user || !pass) {
        // Fallback: check shop_settings if available
        try {
            const sRes = await pool.query('SELECT smtp_user, smtp_pass, smtp_host, smtp_port FROM shop_settings WHERE id = 1');
            const row = sRes.rows[0];
            if (row && row.smtp_user && row.smtp_pass) {
                cachedTransporter = nodemailer.createTransport({
                    host: row.smtp_host || host,
                    port: parseInt(row.smtp_port || '465', 10),
                    secure: true,
                    auth: { user: row.smtp_user, pass: row.smtp_pass }
                });
                return cachedTransporter;
            }
        } catch (_) {}
        return null;
    }

    cachedTransporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
    });
    return cachedTransporter;
}

/**
 * Sends a 2FA Verification Code Email.
 */
async function sendTwoFactorCodeEmail({ to, userName, code, deviceName, ipAddress }) {
    if (!to || !String(to).includes('@')) {
        return { success: false, reason: 'Invalid or missing email address.' };
    }

    const transporter = await getTransporter();
    const cleanEmail = String(to).trim().toLowerCase();

    if (!transporter) {
        console.log(`\n============================================================`);
        console.log(`📧 [2FA EMAIL OTP DISPATCH (SMTP SIMULATION)]`);
        console.log(`Recipient: ${userName} <${cleanEmail}>`);
        console.log(`Device: ${deviceName} | IP: ${ipAddress}`);
        console.log(`🔑 Verification Code: ${code}`);
        console.log(`Notice: Configure SMTP_USER and SMTP_PASS in .env for live dispatch.`);
        console.log(`============================================================\n`);

        return {
            success: false,
            simulated: true,
            message: 'SMTP credentials not configured. Code logged to server console.'
        };
    }

    try {
        const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@shebatechnologybd.com';
        const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background: linear-gradient(135deg, #0f172a 0%, #064e3b 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
                    <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Sheba Technology ERP</h2>
                    <p style="margin: 6px 0 0; color: #34d399; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Security & Device Verification</p>
                </div>
                <div style="padding: 32px 24px; color: #1e293b;">
                    <p style="font-size: 16px; margin-top: 0;">Hello <strong>${userName}</strong>,</p>
                    <p style="font-size: 14px; line-height: 1.6; color: #475569;">A login attempt was made on your account from an unrecognized hardware device. To authorize this device and complete login, use the verification code below:</p>
                    <div style="margin: 28px 0; text-align: center;">
                        <span style="display: inline-block; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #047857; background: #ecfdf5; border: 2px dashed #10b981; border-radius: 12px; padding: 12px 28px; font-family: monospace;">${code}</span>
                    </div>
                    <div style="background: #f8fafc; border-radius: 8px; padding: 14px 16px; font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 20px;">
                        <strong>Device Details:</strong><br/>
                        • Device Name: ${deviceName || 'Unknown Browser'}<br/>
                        • IP Address: ${ipAddress || '127.0.0.1'}<br/>
                        • Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })} (BST)
                    </div>
                    <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">If you did not request this verification, please contact your shop administrator immediately to block this device.</p>
                </div>
                <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
                    Protected by Sheba Technology SOC Security Perimeter Guard
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: `"Sheba Technology Security" <${fromAddress}>`,
            to: cleanEmail,
            subject: `🔒 ${code} is your Device Verification Code - Sheba Technology`,
            html,
        });

        return { success: true, simulated: false };
    } catch (err) {
        console.error('Email dispatch error:', err.message);
        return { success: false, error: err.message };
    }
}

module.exports = {
    sendTwoFactorCodeEmail,
};
