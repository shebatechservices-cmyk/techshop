const pool = require('../../../config/db');
const path = require('path');
const fs = require('fs');
const { ensureSettingsTables } = require('../generalSettingsController');
const { getDbCliConfig, pgDumpToFile, restoreBackup } = require('./backupCoreController');

// Secure Admin Clear Dummy / User Data
exports.cleanDummyData = async (req, res) => {
    // Strictly forbid database cleanup in production environment to prevent data loss
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
            success: false,
            message: 'ডাটাবেজ ক্লিনআপ / টেস্ট ডাটা মুছে ফেলার ফিচারটি প্রোডাকশন পরিবেশে সম্পূর্ণ নিষিদ্ধ ও নিষ্ক্রিয়!'
        });
    }

    const client = await pool.connect();
    try {
        const { confirmationText, backupFirst = true, scope = 'transactions', resetShopToDummy = false } = req.body;

        if (Number(req.user?.role_id) !== 1) {
            return res.status(403).json({
                success: false,
                message: 'শুধুমাত্র সুপার অ্যাডমিনের এই অ্যাকশনটি চালানোর অনুমতি রয়েছে!'
            });
        }

        const validPhrases = ['CLEAR-DUMMY-DATA', 'RESET', 'CONFIRM'];
        if (!confirmationText || !validPhrases.includes(confirmationText.trim().toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: 'কনফার্মেশন শব্দ ভুল হয়েছে! নিশ্চিত করতে সঠিকভাবে "CLEAR-DUMMY-DATA" লিখুন।'
            });
        }

        let backupName = null;
        if (backupFirst) {
            try {
                const backupDir = path.join(__dirname, '../../../database/backups');
                if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                backupName = `auto_backup_before_clean_${timestamp}.sql`;
                const backupFilePath = path.join(backupDir, backupName);

                pgDumpToFile(getDbCliConfig(), backupFilePath);

                const stats = fs.existsSync(backupFilePath) ? fs.statSync(backupFilePath) : null;
                const sizeStr = stats ? (stats.size / 1024).toFixed(1) + ' KB' : 'N/A';

                await pool.query(
                    'INSERT INTO system_backup_logs (backup_name, backup_type, file_size, status, created_by) VALUES ($1, $2, $3, $4, $5)',
                    [backupName, 'Auto Safe-Snapshot (Pre-Clean)', sizeStr, 'SUCCESS', 'Super Admin']
                ).catch(() => {});
            } catch (backupErr) {
                console.warn('Pre-clean backup notice:', backupErr.message);
            }
        }

        await client.query('BEGIN');

        await client.query(`
            TRUNCATE TABLE 
                sales_item_serials,
                sales_items,
                sales,
                sales_quotation_items,
                sales_quotations,
                purchase_order_serials,
                purchase_order_payments,
                purchase_order_items,
                purchase_orders,
                purchase_quotation_items,
                purchase_quotations,
                service_projects,
                ecommerce_order_items,
                ecommerce_orders,
                warranty_claims,
                product_returns,
                damaged_products,
                expenses,
                account_transactions,
                wallet_transactions,
                daily_summaries,
                trash_records,
                audit_logs
            RESTART IDENTITY CASCADE;
        `);

        if (scope === 'all') {
            await client.query("DELETE FROM customers WHERE id = 1 OR name ILIKE '%test%'");
        }

        await client.query("UPDATE customers SET receivable_balance = 0.00, loyalty_points = 0, wallet_balance = 0.00");
        await client.query("UPDATE suppliers SET payable_balance = 0.00, wallet_balance = 0.00");
        await client.query("UPDATE users SET wallet_balance = 0.00");
        await client.query("UPDATE payment_accounts SET balance = 0.00");

        await client.query("UPDATE products SET deleted_at = NULL, deleted_by = NULL");
        await client.query("UPDATE categories SET deleted_at = NULL, deleted_by = NULL");
        await client.query("UPDATE sub_categories SET deleted_at = NULL, deleted_by = NULL");
        await client.query("UPDATE brands SET deleted_at = NULL, deleted_by = NULL");
        await client.query("UPDATE models SET deleted_at = NULL, deleted_by = NULL");
        await client.query("UPDATE series SET deleted_at = NULL, deleted_by = NULL");

        if (resetShopToDummy) {
            await client.query(`
                UPDATE shop_settings SET
                    shop_name = 'আপনার প্রতিষ্ঠানের নাম (My Shop Name)',
                    shop_title = 'কম্পিউটার, সিসিটিভি ও আইটি সলিউশন',
                    branch_name = 'প্রধান শাখা (Main Branch)',
                    phone = '01700000000',
                    alt_phone = '01800000000',
                    email = 'info@myshop.com',
                    address = 'দোকান #১২, মার্কেট রোড, ঢাকা',
                    trade_license = 'TRAD/DUMMY/2026/01',
                    bin_tin = 'BIN-000000000-0000',
                    website = 'https://myshop.com',
                    updated_at = NOW()
                WHERE id = 1;
            `);
            await client.query(`
                INSERT INTO business_profiles (id, business_name, tagline, phone, email, address, updated_at)
                VALUES (1, 'আপনার প্রতিষ্ঠানের নাম (My Shop Name)', 'কম্পিউটার, সিসিটিভি ও আইটি সলিউশন', '01700000000', 'info@myshop.com', 'দোকান #১২, মার্কেট রোড, ঢাকা', NOW())
                ON CONFLICT (id) DO UPDATE SET
                    business_name = EXCLUDED.business_name,
                    tagline = EXCLUDED.tagline,
                    phone = EXCLUDED.phone,
                    email = EXCLUDED.email,
                    address = EXCLUDED.address,
                    updated_at = NOW();
            `).catch(() => {});
        }

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: 'সকল ইউজার/ডামি টেস্ট ডাটা সফলভাবে মুছে ফেলা হয়েছে এবং ড্রয়ার/ওয়ালেট ব্যালেন্স রিসেট করা হয়েছে!',
            backupName: backupName,
            shopReset: !!resetShopToDummy,
            cleanedAt: new Date().toISOString()
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('cleanDummyData error:', error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

// Seed / Restore Golden Demo Data
exports.seedDummyData = async (req, res) => {
    try {
        const goldenFile = path.join(__dirname, '../../../database/backups/backup_before_dummy_data_clear_20260908_060254.sql');

        if (fs.existsSync(goldenFile)) {
            req.body.fileName = 'backup_before_dummy_data_clear_20260908_060254.sql';
            req.body.createSafetyBackupFirst = true;
            return restoreBackup(req, res);
        } else {
            return res.status(404).json({
                success: false,
                message: 'ডেমো ব্যাকআপ ফাইলটি খুঁজে পাওয়া যায়নি।'
            });
        }
    } catch (err) {
        console.error('seedDummyData error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Reset Shop Profile to Clean Editable Dummy Template
exports.resetDummyShop = async (req, res) => {
    try {
        await ensureSettingsTables();
        const dummyShop = {
            shop_name: 'আপনার প্রতিষ্ঠানের নাম (My Shop Name)',
            shop_title: 'কম্পিউটার, সিসিটিভি ও আইটি সলিউশন',
            branch_name: 'প্রধান শাখা (Main Branch)',
            phone: '01700000000',
            alt_phone: '01800000000',
            email: 'info@myshop.com',
            address: 'দোকান #১২, মার্কেট রোড, ঢাকা',
            trade_license: 'TRAD/DUMMY/2026/01',
            bin_tin: 'BIN-000000000-0000',
            website: 'https://myshop.com'
        };

        const result = await pool.query(`
            UPDATE shop_settings SET
                shop_name = $1,
                shop_title = $2,
                branch_name = $3,
                phone = $4,
                alt_phone = $5,
                email = $6,
                address = $7,
                trade_license = $8,
                bin_tin = $9,
                website = $10,
                updated_at = NOW()
            WHERE id = 1
            RETURNING *;
        `, [
            dummyShop.shop_name,
            dummyShop.shop_title,
            dummyShop.branch_name,
            dummyShop.phone,
            dummyShop.alt_phone,
            dummyShop.email,
            dummyShop.address,
            dummyShop.trade_license,
            dummyShop.bin_tin,
            dummyShop.website
        ]);

        await pool.query(`
            INSERT INTO business_profiles (id, business_name, tagline, phone, email, address, updated_at)
            VALUES (1, $1, $2, $3, $4, $5, NOW())
            ON CONFLICT (id) DO UPDATE SET
                business_name = EXCLUDED.business_name,
                tagline = EXCLUDED.tagline,
                phone = EXCLUDED.phone,
                email = EXCLUDED.email,
                address = EXCLUDED.address,
                updated_at = NOW();
        `, [
            dummyShop.shop_name,
            dummyShop.shop_title,
            dummyShop.phone,
            dummyShop.email,
            dummyShop.address
        ]).catch(() => {});

        return res.status(200).json({
            success: true,
            message: 'শপ ইনফো ডামি তথ্যে রিসেট হয়েছে। এখন আপনি নিজের প্রতিষ্ঠানের নাম ও ঠিকানা লিখে সেভ করতে পারেন।',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('resetDummyShop error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
