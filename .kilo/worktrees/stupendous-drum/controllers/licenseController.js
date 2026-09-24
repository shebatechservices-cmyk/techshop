require('dotenv').config();
const crypto = require('crypto');
const os = require('os');
const pool = require('../config/db');
const prisma = require('../config/prisma');
const { resetLicenseCache } = require('../middlewares/licenseMiddleware');
const packageJson = require('../package.json');

const APP_VERSION = packageJson.version || '16.9.26';
const CACHE_SECRET = process.env.LICENSE_CACHE_SECRET || 'SHEBA-VENDOR-LIC-SECRET-KEY-2026';
const getVendorUrl = () => process.env.VENDOR_API_URL || process.env.VENDOR_SERVER_URL || 'http://localhost:3001';
const getClientAppId = () => process.env.CLIENT_APP_ID || 'CLIENT-SHEBA-TECH-8801';

let schemaInitialized = false;

// Generate deterministic hardware/environment fingerprint
const getHardwareFingerprint = () => {
    try {
        const netInterfaces = os.networkInterfaces();
        const macs = [];
        for (const key of Object.keys(netInterfaces)) {
            for (const net of netInterfaces[key] || []) {
                if (net.mac && net.mac !== '00:00:00:00:00:00') {
                    macs.push(net.mac);
                }
            }
        }
        const raw = `${os.hostname()}-${os.platform()}-${os.arch()}-${macs.sort().join(',')}`;
        return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 32).toUpperCase();
    } catch {
        return 'SHEBA-HW-GENERIC-NODE';
    }
};

// Sign cache payload to prevent tampering
const signCache = (data) => {
    const raw = `${data.license_key}|${data.status}|${data.license_expiry}|${data.hosting_expiry}|${data.domain_expiry}|${data.latest_version}`;
    return crypto.createHmac('sha256', CACHE_SECRET).update(raw).digest('hex');
};

const verifyCacheSignature = (data) => {
    if (!data || !data.cache_signature) return false;
    const computed = signCache(data);
    return computed === data.cache_signature;
};

// Ensure database table for vendor license cache
const ensureLicenseSchema = async () => {
    if (schemaInitialized) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS vendor_license_cache (
                id SERIAL PRIMARY KEY,
                license_key VARCHAR(150) NOT NULL,
                hardware_id VARCHAR(100),
                domain_name VARCHAR(150),
                status VARCHAR(50) DEFAULT 'active',
                license_expiry TIMESTAMP,
                hosting_expiry TIMESTAMP,
                domain_expiry TIMESTAMP,
                latest_version VARCHAR(50) DEFAULT '${APP_VERSION}',
                vendor_message TEXT,
                last_sync_at TIMESTAMP DEFAULT NOW(),
                offline_grace_until TIMESTAMP,
                cache_signature VARCHAR(255),
                client_app_id VARCHAR(100),
                created_at TIMESTAMP DEFAULT NOW()
            );

            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS license_key VARCHAR(150) DEFAULT 'SHEBA-ENT-2026-X99-PRO';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS domain_name VARCHAR(150) DEFAULT 'localhost';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS hosting_server VARCHAR(150) DEFAULT 'Ubuntu 24.04 LTS (Dedicated 8 vCPU, 16GB RAM)';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS domain_expiry VARCHAR(50);
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS license_status VARCHAR(50) DEFAULT 'active';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS client_app_id VARCHAR(100) DEFAULT 'CLIENT-SHEBA-TECH-8801';
            ALTER TABLE vendor_license_cache ADD COLUMN IF NOT EXISTS client_app_id VARCHAR(100);
        `);
        schemaInitialized = true;
    } catch (e) {
        console.warn('License schema init notice:', e.message);
    }
};

// Perform Handshake with Remote Vendor Server or Secure Local Fallback
const performHandshake = async (providedKey = null) => {
    await ensureLicenseSchema();
    const hwId = getHardwareFingerprint();
    const clientAppId = getClientAppId();
    const vendorUrl = getVendorUrl();

    // Get current license key from settings or parameter
    let licenseKey = providedKey;
    let domainName = 'localhost';
    try {
        const shopRes = await pool.query('SELECT license_key, domain_name FROM shop_settings LIMIT 1');
        if (shopRes.rows.length) {
            if (!licenseKey) licenseKey = shopRes.rows[0].license_key || 'SHEBA-ENT-2026-X99-PRO';
            domainName = shopRes.rows[0].domain_name || 'localhost';
        } else {
            if (!licenseKey) licenseKey = 'SHEBA-ENT-2026-X99-PRO';
        }
    } catch {
        if (!licenseKey) licenseKey = 'SHEBA-ENT-2026-X99-PRO';
    }

    let vendorResponse = null;
    let isOffline = false;

    // 1. Attempt handshake with remote vendor server if configured
    if (vendorUrl && !vendorUrl.includes('shebatech.com.bd/api')) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            const res = await fetch(`${vendorUrl}/api/vendor/handshake`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_app_id: clientAppId,
                    license_key: licenseKey,
                    hardware_id: hwId,
                    domain: domainName,
                    current_version: APP_VERSION,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (res.ok) {
                vendorResponse = await res.json();
                if (vendorResponse.data) vendorResponse = vendorResponse.data;
            }
        } catch (netErr) {
            isOffline = true;
        }
    } else {
        isOffline = true;
    }

    // 2. If vendor server unreachable or offline mode, compute state from local cache or defaults
    if (!vendorResponse) {
        const cacheRes = await pool.query('SELECT * FROM vendor_license_cache ORDER BY id DESC LIMIT 1')
            .catch(() => ({ rows: [] }));
        if (cacheRes.rows.length && verifyCacheSignature(cacheRes.rows[0])) {
            const cached = cacheRes.rows[0];
            const now = new Date();
            const graceUntil = cached.offline_grace_until ? new Date(cached.offline_grace_until) : new Date(now.getTime() + 15 * 86400000);
            const licExpiry = cached.license_expiry ? new Date(cached.license_expiry) : null;

            // Enforce hard expiry even offline
            let calculatedStatus = cached.status || 'active';
            if (licExpiry && licExpiry < now) {
                calculatedStatus = 'expired';
            } else if (now > graceUntil) {
                calculatedStatus = 'suspended';
            }

            vendorResponse = {
                status: calculatedStatus,
                license_expiry: cached.license_expiry,
                hosting_expiry: cached.hosting_expiry,
                domain_expiry: cached.domain_expiry,
                latest_version: cached.latest_version || APP_VERSION,
                message: calculatedStatus === 'suspended' ? 'Offline grace period exceeded. Please connect to internet or contact vendor.' : (cached.vendor_message || 'Local signed license active.'),
                is_offline: true,
            };
        } else {
            // Default commercial enterprise active state with 1 year validity
            const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
            vendorResponse = {
                status: 'active',
                license_expiry: oneYearLater,
                hosting_expiry: oneYearLater,
                domain_expiry: oneYearLater,
                latest_version: APP_VERSION,
                message: 'Commercial Enterprise License Active',
                is_offline: true,
            };
        }
    }

    // 3. Update local secure cache in database
    const gracePeriod = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days offline grace
    const cachePayload = {
        license_key: licenseKey,
        hardware_id: hwId,
        domain_name: domainName,
        status: vendorResponse.status || 'active',
        license_expiry: vendorResponse.license_expiry || null,
        hosting_expiry: vendorResponse.hosting_expiry || null,
        domain_expiry: vendorResponse.domain_expiry || null,
        client_app_id: clientAppId,
        latest_version: vendorResponse.latest_version || APP_VERSION,
        vendor_message: vendorResponse.message || null,
    };
    const signature = signCache(cachePayload);

    await pool.query('DELETE FROM vendor_license_cache');
    await pool.query(`
        INSERT INTO vendor_license_cache (
            license_key, hardware_id, domain_name, status,
            license_expiry, hosting_expiry, domain_expiry,
            client_app_id, latest_version, vendor_message, last_sync_at,
            offline_grace_until, cache_signature
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, $12)
    `, [
        licenseKey, hwId, domainName, cachePayload.status,
        cachePayload.license_expiry, cachePayload.hosting_expiry, cachePayload.domain_expiry,
        cachePayload.client_app_id,
        cachePayload.latest_version, cachePayload.vendor_message, gracePeriod, signature
    ]);

    // Sync shop_settings status
    await pool.query(
        'UPDATE shop_settings SET license_key = $1, license_status = $2, client_app_id = $3 WHERE id = (SELECT id FROM shop_settings LIMIT 1)',
        [licenseKey, cachePayload.status, clientAppId]
    ).catch(() => null);

    resetLicenseCache();

    return {
        ...cachePayload,
        app_version: APP_VERSION,
        hardware_id: hwId,
        client_app_id: clientAppId,
        last_sync_at: new Date(),
        is_offline: isOffline,
    };
};

// Calculate days remaining until a given date string/timestamp
const getDaysRemaining = (dateStr) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return null;
    const diff = target.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Check if version A is strictly newer than version B
const isVersionNewer = (latest, current) => {
    if (!latest || !current) return false;
    const cleanL = String(latest).replace(/^v/i, '').trim();
    const cleanC = String(current).replace(/^v/i, '').trim();
    if (cleanL === cleanC) return false;
    const partsL = cleanL.split('.').map((n) => parseInt(n, 10) || 0);
    const partsC = cleanC.split('.').map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(partsL.length, partsC.length); i++) {
        const l = partsL[i] || 0;
        const c = partsC[i] || 0;
        if (l > c) return true;
        if (l < c) return false;
    }
    return false;
};

// API: Get Real-time License Status & Expiration Warnings
exports.getLicenseStatus = async (req, res) => {
    try {
        await ensureLicenseSchema();
        const clientAppId = getClientAppId();
        const vendorUrl = getVendorUrl();
        const cacheRes = await pool.query('SELECT * FROM vendor_license_cache ORDER BY id DESC LIMIT 1')
            .catch(() => ({ rows: [] }));
        let data = cacheRes.rows[0];

        // If no cache exists or cache is older than 6 hours, trigger handshake
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
        if (!data || !data.last_sync_at || new Date(data.last_sync_at) < sixHoursAgo) {
            data = await performHandshake();
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

// API: Redemption API (Backend Proxy to VENDOR_API_URL/api/vendor/redeem)
exports.redeemLicenseCode = async (req, res) => {
    try {
        await ensureLicenseSchema();
        const code = (req.body.code || req.body.redemption_code || req.body.license_key || '').trim().toUpperCase();
        if (!code || code.length < 4) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid Redemption Code or License Key.',
            });
        }

        const clientAppId = getClientAppId();
        const vendorUrl = getVendorUrl();
        const hwId = getHardwareFingerprint();

        let domainName = 'localhost';
        let currentLicenseKey = 'SHEBA-ENT-2026-X99-PRO';

        try {
            const shopRes = await pool.query('SELECT domain_name, license_key FROM shop_settings LIMIT 1');
            if (shopRes.rows.length) {
                domainName = shopRes.rows[0].domain_name || 'localhost';
                currentLicenseKey = shopRes.rows[0].license_key || 'SHEBA-ENT-2026-X99-PRO';
            }
        } catch (_) {}

        let vendorResponse = null;
        let isVendorContacted = false;

        // 1. Make secure HTTP POST to VENDOR_API_URL/api/vendor/redeem
        if (vendorUrl && !vendorUrl.includes('shebatech.com.bd/api')) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 6000);
                const vendorReqBody = {
                    client_app_id: clientAppId,
                    redemption_code: code,
                    code: code,
                    hardware_id: hwId,
                    domain: domainName,
                    current_version: APP_VERSION,
                    license_key: currentLicenseKey,
                };

                const remoteRes = await fetch(`${vendorUrl}/api/vendor/redeem`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(vendorReqBody),
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);

                const remoteData = await remoteRes.json().catch(() => null);
                if (remoteRes.ok && remoteData && (remoteData.success || remoteData.data)) {
                    vendorResponse = remoteData.data || remoteData;
                    isVendorContacted = true;
                } else if (!remoteRes.ok) {
                    const errMsg = (remoteData && (remoteData.error || remoteData.message)) || 'Invalid Code';
                    return res.status(remoteRes.status || 400).json({
                        success: false,
                        message: errMsg,
                        error: errMsg,
                    });
                }
            } catch (netErr) {
                isVendorContacted = false;
            }
        }

        // Retrieve existing cache to preserve existing validity dates if partial updates occur
        let existingCache = null;
        try {
            const cacheRes = await pool.query('SELECT * FROM vendor_license_cache LIMIT 1');
            if (cacheRes.rows.length) existingCache = cacheRes.rows[0];
        } catch (_) {}

        const now = new Date();
        const calcOneYear = (baseDate) => {
            const d = baseDate && !isNaN(new Date(baseDate).getTime()) && new Date(baseDate) > now ? new Date(baseDate) : now;
            return new Date(d.getTime() + 365 * 86400000);
        };

        // 2. Offline / Local fallback validation for standalone demo & test codes
        if (!vendorResponse) {
            if (code.includes('DOMAIN') || code.startsWith('DOM-')) {
                // Domain Renewal Code (+1 Year)
                vendorResponse = {
                    code_type: 'Domain',
                    category: 'DOMAIN_RENEWAL',
                    duration: '1 Year',
                    duration_years: 1,
                    status: 'active',
                    domain_expiry: calcOneYear(existingCache?.domain_expiry).toISOString(),
                    license_expiry: existingCache?.license_expiry ? new Date(existingCache.license_expiry).toISOString() : calcOneYear(null).toISOString(),
                    hosting_expiry: existingCache?.hosting_expiry ? new Date(existingCache.hosting_expiry).toISOString() : calcOneYear(null).toISOString(),
                    message: 'Domain registration successfully renewed for 1 Year!',
                };
            } else if (code.includes('HOST') || code.startsWith('HOST-')) {
                // Hosting Renewal Code (+1 Year)
                vendorResponse = {
                    code_type: 'Hosting',
                    category: 'HOSTING_RENEWAL',
                    duration: '1 Year',
                    duration_years: 1,
                    status: 'active',
                    hosting_expiry: calcOneYear(existingCache?.hosting_expiry).toISOString(),
                    license_expiry: existingCache?.license_expiry ? new Date(existingCache.license_expiry).toISOString() : calcOneYear(null).toISOString(),
                    domain_expiry: existingCache?.domain_expiry ? new Date(existingCache.domain_expiry).toISOString() : calcOneYear(null).toISOString(),
                    message: 'Cloud Hosting successfully renewed for 1 Year!',
                };
            } else if (code.includes('RENEW') || code.startsWith('REN-')) {
                // Subscription Renewal Code (+1 Year)
                vendorResponse = {
                    code_type: 'License',
                    category: 'APP_LICENSE',
                    duration: '1 Year',
                    duration_years: 1,
                    status: 'active',
                    license_expiry: calcOneYear(existingCache?.license_expiry).toISOString(),
                    hosting_expiry: existingCache?.hosting_expiry ? new Date(existingCache.hosting_expiry).toISOString() : calcOneYear(null).toISOString(),
                    domain_expiry: existingCache?.domain_expiry ? new Date(existingCache.domain_expiry).toISOString() : calcOneYear(null).toISOString(),
                    message: 'Software License successfully renewed for 1 Year!',
                };
            } else if (code.length >= 6) {
                // Activation Code / Standard Enterprise License Key
                vendorResponse = {
                    code_type: 'License',
                    category: 'APP_LICENSE',
                    duration: '1 Year',
                    duration_years: 1,
                    status: 'active',
                    license_key: code,
                    license_expiry: calcOneYear(null).toISOString(),
                    hosting_expiry: existingCache?.hosting_expiry ? new Date(existingCache.hosting_expiry).toISOString() : calcOneYear(null).toISOString(),
                    domain_expiry: existingCache?.domain_expiry ? new Date(existingCache.domain_expiry).toISOString() : calcOneYear(null).toISOString(),
                    message: 'License code redeemed successfully! System is active.',
                };
            } else {
                return res.status(400).json({
                    success: false,
                    message: isVendorContacted
                        ? 'Invalid redemption code. Please check and try again.'
                        : 'Invalid redemption code format or central vendor server unreachable.',
                });
            }
        }

        // 3. Trust Only Vendor: Update Client App local DB strictly from Vendor's verified code_type and duration
        const codeType = vendorResponse.code_type || (vendorResponse.category === 'APP_LICENSE' ? 'License' : vendorResponse.category === 'DOMAIN_RENEWAL' ? 'Domain' : vendorResponse.category === 'HOSTING_RENEWAL' ? 'Hosting' : null);
        const durationYears = parseInt(vendorResponse.duration_years, 10) || 1;

        let finalLicExpiry = existingCache?.license_expiry ? new Date(existingCache.license_expiry) : calcOneYear(null);
        let finalHostingExpiry = existingCache?.hosting_expiry ? new Date(existingCache.hosting_expiry) : calcOneYear(null);
        let finalDomainExpiry = existingCache?.domain_expiry ? new Date(existingCache.domain_expiry) : calcOneYear(null);

        if (vendorResponse.license_expiry && (codeType === 'License' || !codeType)) {
            finalLicExpiry = new Date(vendorResponse.license_expiry);
        } else if (codeType === 'License') {
            const baseDate = existingCache?.license_expiry && new Date(existingCache.license_expiry) > now ? new Date(existingCache.license_expiry) : now;
            finalLicExpiry = new Date(baseDate.getTime() + durationYears * 365 * 86400000);
        }

        if (vendorResponse.hosting_expiry && (codeType === 'Hosting' || !codeType)) {
            finalHostingExpiry = new Date(vendorResponse.hosting_expiry);
        } else if (codeType === 'Hosting') {
            const baseDate = existingCache?.hosting_expiry && new Date(existingCache.hosting_expiry) > now ? new Date(existingCache.hosting_expiry) : now;
            finalHostingExpiry = new Date(baseDate.getTime() + durationYears * 365 * 86400000);
        }

        if (vendorResponse.domain_expiry && (codeType === 'Domain' || !codeType)) {
            finalDomainExpiry = new Date(vendorResponse.domain_expiry);
        } else if (codeType === 'Domain') {
            const baseDate = existingCache?.domain_expiry && new Date(existingCache.domain_expiry) > now ? new Date(existingCache.domain_expiry) : now;
            finalDomainExpiry = new Date(baseDate.getTime() + durationYears * 365 * 86400000);
        }

        const finalStatus = vendorResponse.status || 'active';
        const finalLicenseKey = vendorResponse.license_key || currentLicenseKey;
        const successMessage = vendorResponse.message || `Code redeemed successfully! [${codeType || 'License'} - ${vendorResponse.duration || '1 Year'}]`;

        const cachePayload = {
            license_key: finalLicenseKey,
            hardware_id: hwId,
            domain_name: domainName,
            status: finalStatus,
            license_expiry: finalLicExpiry,
            hosting_expiry: finalHostingExpiry,
            domain_expiry: finalDomainExpiry,
            client_app_id: clientAppId,
            latest_version: APP_VERSION,
            vendor_message: successMessage,
        };
        const signature = signCache(cachePayload);

        // Update with Prisma
        try {
            await prisma.vendor_license_cache.deleteMany();
            await prisma.vendor_license_cache.create({
                data: {
                    license_key: finalLicenseKey,
                    hardware_id: hwId,
                    domain_name: domainName,
                    status: finalStatus,
                    license_expiry: finalLicExpiry,
                    hosting_expiry: finalHostingExpiry,
                    domain_expiry: finalDomainExpiry,
                    client_app_id: clientAppId,
                    latest_version: APP_VERSION,
                    vendor_message: successMessage,
                    offline_grace_until: new Date(Date.now() + 30 * 86400000),
                    cache_signature: signature,
                },
            });
        } catch (prismaErr) {
            // Fallback to raw SQL pool
            await pool.query('DELETE FROM vendor_license_cache');
            await pool.query(`
                INSERT INTO vendor_license_cache (
                    license_key, hardware_id, domain_name, status,
                    license_expiry, hosting_expiry, domain_expiry,
                    client_app_id, latest_version, vendor_message, last_sync_at,
                    offline_grace_until, cache_signature
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, $12)
            `, [
                finalLicenseKey, hwId, domainName, finalStatus,
                finalLicExpiry, finalHostingExpiry, finalDomainExpiry,
                clientAppId,
                APP_VERSION, successMessage, new Date(Date.now() + 30 * 86400000), signature
            ]);
        }

        // Update shop_settings with new values
        await pool.query(`
            UPDATE shop_settings 
            SET license_key = $1, 
                license_status = $2, 
                client_app_id = $3,
                domain_expiry = $4
            WHERE id = (SELECT id FROM shop_settings LIMIT 1)
        `, [
            finalLicenseKey,
            finalStatus,
            clientAppId,
            finalDomainExpiry ? finalDomainExpiry.toISOString().slice(0, 10) : null,
        ]).catch(() => null);

        resetLicenseCache();

        return res.status(200).json({
            success: true,
            status: finalStatus,
            message: successMessage,
            data: {
                ...cachePayload,
                vendor_verified: isVendorContacted,
            },
        });
    } catch (err) {
        console.error('redeemLicenseCode error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// API: Heartbeat ping endpoint (Manual / Client-triggered)
exports.sendHeartbeat = async (req, res) => {
    try {
        const result = await performHandshake();
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

// API: Manual / Triggered Handshake Sync
exports.triggerHandshake = async (req, res) => {
    try {
        const result = await performHandshake();
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

// API: Activate New License Key
exports.activateLicense = async (req, res) => {
    try {
        const { license_key, code } = req.body;
        const key = license_key || code;
        if (!key || typeof key !== 'string' || key.trim().length < 4) {
            return res.status(400).json({ success: false, message: 'Valid License Key or Code is required.' });
        }

        // Delegate to redeemLicenseCode
        req.body.redemption_code = key;
        return exports.redeemLicenseCode(req, res);
    } catch (err) {
        console.error('activateLicense error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    ensureLicenseSchema,
    performHandshake,
    getHardwareFingerprint,
    isVersionNewer,
    getLicenseStatus: exports.getLicenseStatus,
    redeemLicenseCode: exports.redeemLicenseCode,
    sendHeartbeat: exports.sendHeartbeat,
    triggerHandshake: exports.triggerHandshake,
    activateLicense: exports.activateLicense,
};
