import { useState } from 'react';
import { DEFAULT_BACKUP_LOGS } from '../../utils/settingsConstants';

export function useBackupSettingsState() {
  const [backupLogs, setBackupLogs] = useState(DEFAULT_BACKUP_LOGS);
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [backupFiles, setBackupFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [restoreModal, setRestoreModal] = useState({ open: false, targetFile: null, isDemoRestore: false });
  const [uploadingBackup, setUploadingBackup] = useState(false);

  return {
    backupLogs,
    setBackupLogs,
    downloadingBackup,
    setDownloadingBackup,
    downloadingJson,
    setDownloadingJson,
    showClearModal,
    setShowClearModal,
    backupFiles,
    setBackupFiles,
    loadingFiles,
    setLoadingFiles,
    restoreModal,
    setRestoreModal,
    uploadingBackup,
    setUploadingBackup,
  };
}
