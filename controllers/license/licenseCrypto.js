const crypto = require('crypto');
const os = require('os');

const CACHE_SECRET = process.env.LICENSE_CACHE_SECRET || 'SHEBA-VENDOR-LIC-SECRET-KEY-2026';

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

module.exports = {
    CACHE_SECRET,
    getHardwareFingerprint,
    signCache,
    verifyCacheSignature,
    getDaysRemaining,
    isVersionNewer,
};
