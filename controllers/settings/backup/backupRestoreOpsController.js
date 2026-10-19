const pool = require('../../../config/db');
const path = require('path');
const fs = require('fs');
const { ensureSettingsTables } = require('../generalSettingsController');
const { getDbCliConfig, pgDumpToFile, pgRestoreFromFile, pgResetSchema } = require('./backupCliHelpers');

// List Available Backup Files in database/backups
exports.getBackupFiles = async (req, res) => {
    try {
        const backupDir = path.join(__dirname, '../../../database/backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const files = fs.readdirSync(backupDir)
            .filter(f => f.endsWith('.sql'))
            .map(filename => {
                const filePath = path.join(backupDir, filename);
                const stat = fs.statSync(filePath);
                const sizeKb = (stat.size / 1024).toFixed(1);
                const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);
                const sizeStr = stat.size > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`;

                let type = 'Manual Backup';
                if (filename.startsWith('auto_backup_before_clean')) type = 'Pre-Clean Auto Snapshot';
                else if (filename.startsWith('backup_before_dummy')) type = 'Demo Dataset (Full Sample)';
                else if (filename.startsWith('auto_backup_before_restore')) type = 'Pre-Restore Safety Snapshot';
                else if (filename.startsWith('sheba_erp_backup')) type = 'Full System SQL Dump';

                return {
                    fileName: filename,
                    size: stat.size,
                    sizeStr: sizeStr,
                    createdAt: stat.mtime,
                    type: type,
                    isDemoGolden: filename.includes('backup_before_dummy_data_clear')
                };
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return res.status(200).json({
            success: true,
            files: files
        });
    } catch (err) {
        console.error('getBackupFiles error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Restore Backup SQL File into PostgreSQL Database
exports.restoreBackup = async (req, res) => {
    try {
        const { fileName, createSafetyBackupFirst = true } = req.body;

        if (Number(req.user?.role_id) !== 1) {
            return res.status(403).json({
                success: false,
                message: 'শুধুমাত্র সুপার অ্যাডমিনের ডাটাবেজ রিস্টোর করার অনুমতি রয়েছে!'
            });
        }

        if (!fileName) {
            return res.status(400).json({ success: false, message: 'ব্যাকআপ ফাইলের নাম দেওয়া হয়নি।' });
        }

        const safeFileName = path.basename(fileName);
        const backupDir = path.join(__dirname, '../../../database/backups');
        const targetPath = path.join(backupDir, safeFileName);

        if (!fs.existsSync(targetPath)) {
            return res.status(404).json({ success: false, message: 'অনুরোধকৃত ব্যাকআপ ফাইলটি খুঁজে পাওয়া যায়নি।' });
        }

        const dbCfg = getDbCliConfig();
        const dbName = dbCfg.name;

        let preRestoreSnapshot = null;
        if (createSafetyBackupFirst) {
            try {
                const ts = new Date().toISOString().replace(/[:.]/g, '-');
                preRestoreSnapshot = `auto_backup_before_restore_${ts}.sql`;
                const preRestorePath = path.join(backupDir, preRestoreSnapshot);
                pgDumpToFile(dbCfg, preRestorePath);

                const stat = fs.existsSync(preRestorePath) ? fs.statSync(preRestorePath) : null;
                const sizeStr = stat ? (stat.size / 1024).toFixed(1) + ' KB' : 'N/A';
                await pool.query(
                    'INSERT INTO system_backup_logs (backup_name, backup_type, file_size, status, created_by) VALUES ($1, $2, $3, $4, $5)',
                    [preRestoreSnapshot, 'Auto Pre-Restore Snapshot', sizeStr, 'SUCCESS', 'Super Admin']
                ).catch(() => {});
            } catch (snapErr) {
                console.warn('Pre-restore snapshot notice:', snapErr.message);
            }
        }

        try {
            await pool.query(`
                SELECT pg_terminate_backend(pid) 
                FROM pg_stat_activity 
                WHERE datname = $1 AND pid <> pg_backend_pid();
            `, [dbName]);
        } catch (termErr) {}

        pgResetSchema(dbCfg);
        pgRestoreFromFile(dbCfg, targetPath);

        await ensureSettingsTables();
        await pool.query(
            'INSERT INTO system_backup_logs (backup_name, backup_type, file_size, status, created_by) VALUES ($1, $2, $3, $4, $5)',
            [safeFileName, 'Database Full Restore', 'Restored', 'SUCCESS', 'Super Admin']
        ).catch(() => {});

        return res.status(200).json({
            success: true,
            message: `ব্যাকআপ '${safeFileName}' সফলভাবে ডাটাবেজে রিস্টোর করা হয়েছে!`,
            restoredFile: safeFileName,
            safetySnapshot: preRestoreSnapshot,
            restoredAt: new Date().toISOString()
        });
    } catch (err) {
        console.error('restoreBackup error:', err);
        return res.status(500).json({
            success: false,
            message: `রিস্টোর করতে সমস্যা হয়েছে: ${err.message}`
        });
    }
};

// Download a specific backup file
exports.downloadBackupFile = async (req, res) => {
    try {
        const { fileName } = req.query;
        if (!fileName) return res.status(400).send('Filename required');
        const safeName = path.basename(fileName);
        const filePath = path.join(__dirname, '../../../database/backups', safeName);
        if (!fs.existsSync(filePath)) return res.status(404).send('File not found');
        return res.download(filePath, safeName);
    } catch (err) {
        return res.status(500).send(err.message);
    }
};

// Upload and restore SQL dump
exports.uploadAndRestoreBackup = async (req, res) => {
    try {
        if (Number(req.user?.role_id) !== 1) {
            return res.status(403).json({ success: false, message: 'অনুমতি নেই!' });
        }

        const { sqlContent } = req.body;
        if (!sqlContent) {
            return res.status(400).json({ success: false, message: 'কোনো SQL কন্টেন্ট পাওয়া যায়নি।' });
        }

        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const safeName = `uploaded_restore_${ts}.sql`;
        const backupDir = path.join(__dirname, '../../../database/backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        const filePath = path.join(backupDir, safeName);

        fs.writeFileSync(filePath, sqlContent, 'utf8');

        req.body.fileName = safeName;
        req.body.createSafetyBackupFirst = true;
        return exports.restoreBackup(req, res);
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
