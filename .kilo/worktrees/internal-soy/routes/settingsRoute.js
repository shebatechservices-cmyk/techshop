const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// Settings & Overview
router.get('/', settingsController.getSettings);
router.put('/update', settingsController.updateSettings);

// System Health & Updates
router.get('/system-health', settingsController.getSystemHealth);
router.get('/updates', settingsController.checkAppUpdates);

// Payment Methods
router.get('/payment-methods', settingsController.getPaymentMethods);
router.post('/payment-methods', settingsController.addPaymentMethod);
router.put('/payment-methods/:id/toggle', settingsController.togglePaymentMethod);
router.delete('/payment-methods/:id', settingsController.deletePaymentMethod);

// Database Safe Backup, Files & Restore
router.get('/backup', settingsController.backupDatabase);
router.get('/backup-json', settingsController.exportJsonBackup);
router.get('/backup-logs', settingsController.getBackupLogs);
router.get('/backup-files', settingsController.getBackupFiles);
router.get('/backup-download', settingsController.downloadBackupFile);
router.post('/backup-trigger', settingsController.triggerBackup);
router.post('/clean-dummy-data', settingsController.cleanDummyData);
router.post('/restore-backup', settingsController.restoreBackup);
router.post('/upload-restore', settingsController.uploadAndRestoreBackup);
router.post('/seed-dummy-data', settingsController.seedDummyData);
router.post('/reset-dummy-shop', settingsController.resetDummyShop);

// SMS Notification Gateway, Triggers, & Logs
router.get('/notifications', settingsController.getLiveNotifications);
router.get('/sms/triggers', settingsController.getSmsTriggers);
router.put('/sms/triggers', settingsController.updateSmsTriggers);
router.get('/sms/logs', settingsController.getSmsLogs);
router.post('/sms/send-bulk', settingsController.sendBulkSms);
router.post('/sms/test', settingsController.sendTestSms);

module.exports = router;
