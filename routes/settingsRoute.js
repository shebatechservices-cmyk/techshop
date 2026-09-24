const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { requireRole } = require('../middlewares/authMiddleware');

// Settings & Overview
router.get('/', settingsController.getSettings);
router.put('/update', settingsController.updateSettings);
router.put('/print-template', settingsController.updatePrintTemplate);

// System Health & Updates
router.get('/system-health', settingsController.getSystemHealth);
router.get('/updates', settingsController.checkAppUpdates);

// Payment Methods
router.get('/payment-methods', settingsController.getPaymentMethods);
router.post('/payment-methods', settingsController.addPaymentMethod);
router.put('/payment-methods/:id', settingsController.updatePaymentMethod);
router.put('/payment-methods/:id/toggle', settingsController.togglePaymentMethod);
router.delete('/payment-methods/:id', settingsController.deletePaymentMethod);

// Database Safe Backup, Files & Restore
router.get('/backup', requireRole(1, 2), settingsController.backupDatabase);
router.get('/backup-json', requireRole(1, 2), settingsController.exportJsonBackup);
router.get('/backup-logs', requireRole(1, 2), settingsController.getBackupLogs);
router.get('/backup-files', requireRole(1, 2), settingsController.getBackupFiles);
router.get('/backup-download', requireRole(1, 2), settingsController.downloadBackupFile);
router.post('/backup-trigger', requireRole(1, 2), settingsController.triggerBackup);
router.post('/clean-dummy-data', requireRole(1), settingsController.cleanDummyData);
router.post('/restore-backup', requireRole(1), settingsController.restoreBackup);
router.post('/upload-restore', requireRole(1), settingsController.uploadAndRestoreBackup);
router.post('/seed-dummy-data', requireRole(1), settingsController.seedDummyData);
router.post('/reset-dummy-shop', requireRole(1, 2), settingsController.resetDummyShop);

// Live Notification Feed (Realtime notification center)
router.get('/notifications', settingsController.getLiveNotifications);

// SMS Notification Gateway, Providers, Triggers, & Logs
router.get('/sms/providers', requireRole(1, 2), settingsController.getSmsProviders);
router.post('/sms/providers', requireRole(1, 2), settingsController.createSmsProvider);
router.put('/sms/providers/:id', requireRole(1, 2), settingsController.updateSmsProvider);
router.delete('/sms/providers/:id', requireRole(1, 2), settingsController.deleteSmsProvider);
router.put('/sms/providers/:id/activate', requireRole(1, 2), settingsController.setActiveSmsProvider);
router.get('/sms/balance', requireRole(1, 2), settingsController.getSmsBalance);
router.get('/sms/triggers', settingsController.getSmsTriggers);
router.put('/sms/triggers', settingsController.updateSmsTriggers);
router.get('/sms/logs', requireRole(1, 2), settingsController.getSmsLogs);
router.post('/sms/send-bulk', requireRole(1, 2), settingsController.sendBulkSms);
router.post('/sms/test', requireRole(1, 2), settingsController.sendTestSms);

module.exports = router;
