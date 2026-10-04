require('dotenv').config();
const packageJson = require('../package.json');
const {
    getHardwareFingerprint,
    isVersionNewer,
    getDaysRemaining,
} = require('./license/licenseCrypto');
const {
    ensureLicenseSchema,
    getLatestCacheRecord,
} = require('./license/licenseDb');
const {
    getVendorUrl,
    getClientAppId,
    performHandshake,
} = require('./license/licenseVendorClient');
const {
    redeemLicenseCode,
} = require('./license/licenseRedeemService');

const APP_VERSION = packageJson.version || '16.9.26';

/**
 * Get Real-time License Status & Expiration Warnings
 */
const getLicenseStatus = async (req, res) => {
    try {
        await ensureLicenseSchema(APP_VERSION);
        const clientAppId = getClientAppId();
        const vendorUrl = getVendorUrl();
        let data = await getLatestCacheRecord();

        // If no cache exists or cache is older than 6 hours, trigger handshake
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
        if (!data || !data.last_sync_at || new Date(data.last_sync_at) < sixHoursAgo) {
            data = await performHandshake(null, APP_VERSION);
        }

        const licenseDays = getDaysRemaining(data.license_expiry);
        const hostingDays = getDaysRemaining(data.hosting_expiry);
        const domainDays = getDaysRemaining(data.domain_expiry);
        const hasUpdate = isVersionNewer(data.latest_version, APP_VERSION);

        // Warnings
        const warnings = [];
        if (licenseDays !== null && licenseDays <= 15) {
            warnings.push({
                type: 'license',
                days_left: licenseDays,
                message: licenseDays <= 0 ? 'Software License Expired' : `Software License expires in ${licenseDays} day${licenseDays === 1 ? '' : 's'}!`,
                expiry_date: data.license_expiry,
                severity: licenseDays <= 3 ? 'critical' : 'warning',
            });
        }
        if (hostingDays !== null && hostingDays <= 15) {
            warnings.push({
                type: 'hosting',
                days_left: hostingDays,
                message: hostingDays <= 0 ? 'Hosting Server Subscription Expired' : `Hosting Server expires in ${hostingDays} day${hostingDays === 1 ? '' : 's'}!`,
                expiry_date: data.hosting_expiry,
                severity: hostingDays <= 3 ? 'critical' : 'warning',
            });
        }
        if (domainDays !== null && domainDays <= 15) {
            warnings.push({
                type: 'domain',
                days_left: domainDays,
                message: domainDays <= 0 ? 'Domain Registration Expired' : `Domain registration expires in ${domainDays} day${domainDays === 1 ? '' : 's'}!`,
                expiry_date: data.domain_expiry,
                severity: domainDays <= 3 ? 'critical' : 'warning',
            });
        }

        const isSuspended = String(data.status || '').toLowerCase() === 'suspended';
        const isExpired = licenseDays !== null && licenseDays <= 0;
        const isBlocked = isSuspended || isExpired;

        return res.status(200).json({
            success: true,
            status: isBlocked ? (isSuspended ? 'suspended' : 'expired') : 'active',
            is_blocked: isBlocked,
            client_app_id: clientAppId,
            vendor_api_url: vendorUrl,
            license_key: data.license_key ? `${data.license_key.substring(0, 8)}...${data.license_key.slice(-4)}` : 'SHEBA-ENT-2026-X99-PRO',
            full_license_key: data.license_key || 'SHEBA-ENT-2026-X99-PRO',
            hardware_id: data.hardware_id || getHardwareFingerprint(),
            domain_name: data.domain_name || 'localhost',
            license_expiry: data.license_expiry,
            hosting_expiry: data.hosting_expiry,
            domain_expiry: data.domain_expiry,
            license_days_left: licenseDays,
            hosting_days_left: hostingDays,
            domain_days_left: domainDays,
            current_version: APP_VERSION,
            latest_version: data.latest_version || APP_VERSION,
            update_available: hasUpdate,
            warnings,
            vendor_message: data.vendor_message,
            last_sync_at: data.last_sync_at,
        });
    } catch (err) {
        console.error('getLicenseStatus error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Heartbeat ping endpoint
 */
const sendHeartbeat = async (req, res) => {
    try {
        const result = await performHandshake(null, APP_VERSION);
        return res.status(200).json({
            success: true,
            message: 'Heartbeat ping synchronized successfully!',
            data: result,
        });
    } catch (err) {
        console.error('sendHeartbeat error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Triggered Handshake Sync
 */
const triggerHandshake = async (req, res) => {
    try {
        const result = await performHandshake(null, APP_VERSION);
        return res.status(200).json({
            success: true,
            message: 'Handshake completed successfully!',
            data: result,
        });
    } catch (err) {
        console.error('triggerHandshake error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Activate New License Key (delegates to redeemLicenseCode)
 */
const activateLicense = async (req, res) => {
    try {
        const { license_key, code } = req.body;
        const key = license_key || code;
        if (!key || typeof key !== 'string' || key.trim().length < 4) {
            return res.status(400).json({ success: false, message: 'Valid License Key or Code is required.' });
        }
        req.body.redemption_code = key;
        return redeemLicenseCode(req, res);
    } catch (err) {
        console.error('activateLicense error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Activate / Register 15-Day Free Trial
 */
const activateTrial = async (req, res) => {
    try {
        const { deviceId, clientAppId, startDate, endDate, domain } = req.body;
        const vendorUrl = getVendorUrl();
        const clientApp = clientAppId || getClientAppId();

        if (vendorUrl) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);
                await fetch(`${vendorUrl}/api/license/activate-trial`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        deviceId: deviceId || getHardwareFingerprint(),
                        clientAppId: clientApp,
                        startDate: startDate || new Date().toISOString(),
                        endDate: endDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                        trialDays: 15,
                        domain: domain || 'localhost',
                        appVersion: APP_VERSION,
                    }),
                    signal: controller.signal,
                }).catch(() => {});
                clearTimeout(timeoutId);
            } catch (_) {}
        }

        return res.status(200).json({
            success: true,
            message: '15-day free trial registered successfully.',
            trialDays: 15,
            startDate: startDate || new Date().toISOString(),
            endDate: endDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        });
    } catch (err) {
        console.error('activateTrial error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    ensureLicenseSchema,
    performHandshake,
    getHardwareFingerprint,
    isVersionNewer,
    getLicenseStatus,
    redeemLicenseCode,
    sendHeartbeat,
    triggerHandshake,
    activateLicense,
    activateTrial,
};
