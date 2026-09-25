/**
 * Settings Controller Facade
 * Clean orchestrator aggregating modular sub-controllers:
 * - generalSettingsController: Shop settings, business profiles, and print templates
 * - smsSettingsController: SMS providers, triggers, logs, and messaging
 * - paymentMethodController: Payment methods management
 * - systemHealthController: System health checks, version updates, live notifications
 * - backupRestoreController: PostgreSQL database dumps, JSON snapshots, and safety restores
 */

const generalSettingsController = require('./settings/generalSettingsController');
const smsSettingsController = require('./settings/smsSettingsController');
const paymentMethodController = require('./settings/paymentMethodController');
const systemHealthController = require('./settings/systemHealthController');
const backupRestoreController = require('./settings/backupRestoreController');

module.exports = {
    // Database and Schema Helpers
    ensureSettingsTables: generalSettingsController.ensureSettingsTables,
    formatUptime: systemHealthController.formatUptime,

    // General Shop & Print Settings
    getSettings: generalSettingsController.getSettings,
    updateSettings: generalSettingsController.updateSettings,
    updatePrintTemplate: generalSettingsController.updatePrintTemplate,

    // SMS Gateway & Notifications
    getSmsProviders: smsSettingsController.getSmsProviders,
    createSmsProvider: smsSettingsController.createSmsProvider,
    updateSmsProvider: smsSettingsController.updateSmsProvider,
    deleteSmsProvider: smsSettingsController.deleteSmsProvider,
    setActiveSmsProvider: smsSettingsController.setActiveSmsProvider,
    getSmsBalance: smsSettingsController.getSmsBalance,
    getSmsTriggers: smsSettingsController.getSmsTriggers,
    updateSmsTriggers: smsSettingsController.updateSmsTriggers,
    getSmsLogs: smsSettingsController.getSmsLogs,
    sendBulkSms: smsSettingsController.sendBulkSms,
    sendAutomatedSms: smsSettingsController.sendAutomatedSms,
    sendTestSms: smsSettingsController.sendTestSms,

    // Payment Methods
    getPaymentMethods: paymentMethodController.getPaymentMethods,
    addPaymentMethod: paymentMethodController.addPaymentMethod,
    updatePaymentMethod: paymentMethodController.updatePaymentMethod,
    togglePaymentMethod: paymentMethodController.togglePaymentMethod,
    deletePaymentMethod: paymentMethodController.deletePaymentMethod,

    // System Health & Diagnostics
    checkAppUpdates: systemHealthController.checkAppUpdates,
    getSystemHealth: systemHealthController.getSystemHealth,
    getLiveNotifications: systemHealthController.getLiveNotifications,

    // Backup, Restore & Data Maintenance
    backupDatabase: backupRestoreController.backupDatabase,
    exportJsonBackup: backupRestoreController.exportJsonBackup,
    getBackupLogs: backupRestoreController.getBackupLogs,
    triggerBackup: backupRestoreController.triggerBackup,
    cleanDummyData: backupRestoreController.cleanDummyData,
    getBackupFiles: backupRestoreController.getBackupFiles,
    restoreBackup: backupRestoreController.restoreBackup,
    seedDummyData: backupRestoreController.seedDummyData,
    resetDummyShop: backupRestoreController.resetDummyShop,
    downloadBackupFile: backupRestoreController.downloadBackupFile,
    uploadAndRestoreBackup: backupRestoreController.uploadAndRestoreBackup,
};
