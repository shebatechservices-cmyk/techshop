/**
 * Backup Core Controller Facade
 * Architectural Sub-Modules:
 * - backupCliHelpers: PostgreSQL CLI utilities (pg_dump, psql, schema reset, config)
 * - backupExportController: SQL dumps, JSON exports, backup logs, manual trigger
 * - backupRestoreOpsController: File list, SQL file download, database restore, uploaded SQL restore
 */

const backupCli = require('./backupCliHelpers');
const backupExport = require('./backupExportController');
const backupRestoreOps = require('./backupRestoreOpsController');

module.exports = {
    // CLI Utilities
    getDbCliConfig: backupCli.getDbCliConfig,
    pgEnv: backupCli.pgEnv,
    pgDumpToFile: backupCli.pgDumpToFile,
    pgRestoreFromFile: backupCli.pgRestoreFromFile,
    pgResetSchema: backupCli.pgResetSchema,

    // Export & Logs
    backupDatabase: backupExport.backupDatabase,
    exportJsonBackup: backupExport.exportJsonBackup,
    getBackupLogs: backupExport.getBackupLogs,
    triggerBackup: backupExport.triggerBackup,

    // File Management & Restore
    getBackupFiles: backupRestoreOps.getBackupFiles,
    restoreBackup: backupRestoreOps.restoreBackup,
    downloadBackupFile: backupRestoreOps.downloadBackupFile,
    uploadAndRestoreBackup: backupRestoreOps.uploadAndRestoreBackup,
};
