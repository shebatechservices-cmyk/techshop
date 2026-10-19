import { useRef } from 'react';
import API from '../services/api';
import { licenseAuthService } from '../services/licenseAuthService';
import { useStoreProfileManager } from './settings/useStoreProfileManager';
import { usePrintTemplateManager } from './settings/usePrintTemplateManager';
import { useSmsManager } from './settings/useSmsManager';
import { useBackupManager } from './settings/useBackupManager';
import { useLicenseManager } from './settings/useLicenseManager';
import { useSettingsTabRouting } from './settings/useSettingsTabRouting';
import { useSettingsSecurity } from './settings/useSettingsSecurity';

export default function useSettingsManager() {
  const tabRouting = useSettingsTabRouting();
  const domainSettersRef = useRef({});

  // 1. Store Profile Manager (Core settings, stats, loading, saving, toast, logo uploads)
  const storeProfileManager = useStoreProfileManager({
    API,
    domainSetters: domainSettersRef,
  });

  const {
    showToast,
    settings,
    setSettings,
    setSaving,
    uploadImageFile,
    loadSettingsData,
  } = storeProfileManager;

  // 2. Backup Manager (Files, SQL/JSON export, restore, snapshot trigger)
  const backupManager = useBackupManager({
    API,
    showToast,
    loadSettingsData,
  });

  // 3. SMS Manager (Providers, triggers, logs, templates, balance, blast campaigns)
  const smsManager = useSmsManager({
    API,
    settings,
    showToast,
    loadSettingsData,
  });

  // 4. License Manager (Redemption, stacking, heartbeat sync)
  const licenseManager = useLicenseManager({
    API,
    settings,
    setSettings,
    showToast,
    loadSettingsData,
    licenseAuthService,
  });

  // 5. Print Template Manager (Invoice format, watermark, logos, print design save)
  const printTemplateManager = usePrintTemplateManager({
    API,
    settings,
    setSettings,
    setSaving,
    showToast,
    uploadImageFile,
  });

  // Synchronously wire up domain setters so loadSettingsData can populate sub-hook states
  domainSettersRef.current = {
    setBackupLogs: backupManager.setBackupLogs,
    setSmsTriggers: smsManager.setSmsTriggers,
    setSmsLogs: smsManager.setSmsLogs,
    setSmsProviders: smsManager.setSmsProviders,
    setBackupFiles: backupManager.setBackupFiles,
    setLicenseInfo: licenseManager.setLicenseInfo,
  };

  // 6. Terminal Security, Updates & Clipboard
  const security = useSettingsSecurity({ API, settings, showToast });

  return {
    ...tabRouting,
    ...storeProfileManager,
    ...backupManager,
    ...smsManager,
    ...licenseManager,
    ...printTemplateManager,
    ...security,
  };
}
