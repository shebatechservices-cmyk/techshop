const pool = require('../../config/db');
const prisma = require('../../config/prisma');
const { resetLicenseCache } = require('../../middlewares/licenseMiddleware');

let schemaInitialized = false;

// Ensure database table for vendor license cache
const ensureLicenseSchema = async (appVersion = '16.9.26') => {
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
                latest_version VARCHAR(50) DEFAULT '${appVersion}',
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

const getLatestCacheRecord = async () => {
    const cacheRes = await pool.query('SELECT * FROM vendor_license_cache ORDER BY id DESC LIMIT 1')
        .catch(() => ({ rows: [] }));
    return cacheRes.rows[0] || null;
};

const saveLicenseCache = async (cachePayload, signature) => {
    const gracePeriod = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    try {
        await prisma.vendor_license_cache.deleteMany();
        await prisma.vendor_license_cache.create({
            data: {
                license_key: cachePayload.license_key,
                hardware_id: cachePayload.hardware_id,
                domain_name: cachePayload.domain_name,
                status: cachePayload.status,
                license_expiry: cachePayload.license_expiry,
                hosting_expiry: cachePayload.hosting_expiry,
                domain_expiry: cachePayload.domain_expiry,
                client_app_id: cachePayload.client_app_id,
                latest_version: cachePayload.latest_version,
                vendor_message: cachePayload.vendor_message,
                offline_grace_until: gracePeriod,
                cache_signature: signature,
            },
        });
    } catch (_) {
        // Fallback to raw SQL
        await pool.query('DELETE FROM vendor_license_cache');
        await pool.query(`
            INSERT INTO vendor_license_cache (
                license_key, hardware_id, domain_name, status,
                license_expiry, hosting_expiry, domain_expiry,
                client_app_id, latest_version, vendor_message, last_sync_at,
                offline_grace_until, cache_signature
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, $12)
        `, [
            cachePayload.license_key,
            cachePayload.hardware_id,
            cachePayload.domain_name,
            cachePayload.status,
            cachePayload.license_expiry,
            cachePayload.hosting_expiry,
            cachePayload.domain_expiry,
            cachePayload.client_app_id,
            cachePayload.latest_version,
            cachePayload.vendor_message,
            gracePeriod,
            signature,
        ]);
    }

    resetLicenseCache();
};

const updateShopLicenseSettings = async (licenseKey, status, clientAppId, domainExpiry = null) => {
    await pool.query(`
        UPDATE shop_settings 
        SET license_key = $1, 
            license_status = $2, 
            client_app_id = $3,
            domain_expiry = COALESCE($4, domain_expiry)
        WHERE id = (SELECT id FROM shop_settings LIMIT 1)
    `, [
        licenseKey,
        status,
        clientAppId,
        domainExpiry ? domainExpiry.toISOString().slice(0, 10) : null,
    ]).catch(() => null);
};

module.exports = {
    ensureLicenseSchema,
    getLatestCacheRecord,
    saveLicenseCache,
    updateShopLicenseSettings,
};
