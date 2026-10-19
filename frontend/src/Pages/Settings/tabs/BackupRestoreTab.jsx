import React from 'react';
import { useSettings } from '../context/SettingsContext';
import BackupQuickActionCards from './backup/BackupQuickActionCards';
import BackupScheduleConfigCard from './backup/BackupScheduleConfigCard';
import BackupRestoreHubSection from './backup/BackupRestoreHubSection';
import BackupRecentLogsSection from './backup/BackupRecentLogsSection';
import BackupDangerZone from './backup/BackupDangerZone';

export default function BackupRestoreTab(props) {
  const context = useSettings();
  const settings = props.settings ?? context.settings ?? {};
  const setSettings = props.setSettings ?? context.setSettings ?? (() => {});
  const saving = props.saving ?? context.saving ?? false;
  const handleSaveSettings = props.handleSaveSettings ?? context.handleSaveSettings ?? (() => {});
  const handleDownloadSqlBackup = props.handleDownloadSqlBackup ?? context.handleDownloadSqlBackup;
  const downloadingBackup = props.downloadingBackup ?? context.downloadingBackup;
  const handleExportJsonBackup = props.handleExportJsonBackup ?? context.handleExportJsonBackup;
  const downloadingJson = props.downloadingJson ?? context.downloadingJson;
  const handleTriggerBackup = props.handleTriggerBackup ?? context.handleTriggerBackup;
  const backupLogs = props.backupLogs ?? context.backupLogs ?? [];
  const loadSettingsData = props.loadSettingsData ?? context.loadSettingsData ?? (() => {});
  const backupFiles = props.backupFiles ?? context.backupFiles ?? [];
  const loadingFiles = props.loadingFiles ?? context.loadingFiles;
  const loadBackupFiles = props.loadBackupFiles ?? context.loadBackupFiles ?? (() => {});
  const setRestoreModal = props.setRestoreModal ?? context.setRestoreModal ?? (() => {});
  const uploadingBackup = props.uploadingBackup ?? context.uploadingBackup;
  const handleUploadSqlFile = props.handleUploadSqlFile ?? context.handleUploadSqlFile;
  const setShowClearModal = props.setShowClearModal ?? context.setShowClearModal ?? (() => {});

  return (
    <div className="space-y-6">
      {/* Sub-page Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>Settings</span>
            <span>/</span>
            <span className="text-blue-600 font-bold">Backup &amp; Restore</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>💾</span> Database Safe Backup &amp; Disaster Recovery
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure automated daily backup schedules, download full SQL dumps, export JSON snapshots, and restore databases.
          </p>
        </div>
      </div>

      <BackupQuickActionCards
        handleDownloadSqlBackup={handleDownloadSqlBackup}
        downloadingBackup={downloadingBackup}
        handleExportJsonBackup={handleExportJsonBackup}
        downloadingJson={downloadingJson}
        handleTriggerBackup={handleTriggerBackup}
      />

      <BackupScheduleConfigCard
        settings={settings}
        setSettings={setSettings}
        handleSaveSettings={handleSaveSettings}
        saving={saving}
      />

      <BackupRestoreHubSection
        setRestoreModal={setRestoreModal}
        uploadingBackup={uploadingBackup}
        handleUploadSqlFile={handleUploadSqlFile}
        backupFiles={backupFiles}
        loadingFiles={loadingFiles}
        loadBackupFiles={loadBackupFiles}
      />

      <BackupRecentLogsSection
        backupLogs={backupLogs}
        loadSettingsData={loadSettingsData}
        handleDownloadSqlBackup={handleDownloadSqlBackup}
      />

      <BackupDangerZone setShowClearModal={setShowClearModal} />
    </div>
  );
}
