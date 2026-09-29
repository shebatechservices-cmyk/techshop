import React from 'react';
import SampleSmsPreviewModal from '../modals/SampleSmsPreviewModal';
import TestSmsModal from '../modals/TestSmsModal';
import BulkSmsModal from '../modals/BulkSmsModal';
import SmsProviderModal from '../modals/SmsProviderModal';
import ClearDataConfirmModal from '../../../components/modals/ClearDataConfirmModal';
import RestoreConfirmModal from '../../../components/modals/RestoreConfirmModal';
import { useSettings } from '../context/SettingsContext';

export default function SettingsModals(props) {
  const context = useSettings();
  const samplePreviewModal = props.samplePreviewModal ?? context.samplePreviewModal;
  const setSamplePreviewModal = props.setSamplePreviewModal ?? context.setSamplePreviewModal;
  const copyText = props.copyText ?? context.copyText;
  const testSmsModal = props.testSmsModal ?? context.testSmsModal;
  const setTestSmsModal = props.setTestSmsModal ?? context.setTestSmsModal;
  const handleSendTestSms = props.handleSendTestSms ?? context.handleSendTestSms;
  const smsProviders = props.smsProviders ?? context.smsProviders;
  const settings = props.settings ?? context.settings;
  const bulkSmsModal = props.bulkSmsModal ?? context.bulkSmsModal;
  const setBulkSmsModal = props.setBulkSmsModal ?? context.setBulkSmsModal;
  const handleSendBulkSms = props.handleSendBulkSms ?? context.handleSendBulkSms;
  const providerModal = props.providerModal ?? context.providerModal;
  const setProviderModal = props.setProviderModal ?? context.setProviderModal;
  const handleSaveProvider = props.handleSaveProvider ?? context.handleSaveProvider;
  const handleApplyProviderPreset = props.handleApplyProviderPreset ?? context.handleApplyProviderPreset;
  const showClearModal = props.showClearModal ?? context.showClearModal;
  const setShowClearModal = props.setShowClearModal ?? context.setShowClearModal;
  const restoreModal = props.restoreModal ?? context.restoreModal;
  const setRestoreModal = props.setRestoreModal ?? context.setRestoreModal;
  const showToast = props.showToast ?? context.showToast;
  const loadBackupFiles = props.loadBackupFiles ?? context.loadBackupFiles;
  const loadSettingsData = props.loadSettingsData ?? context.loadSettingsData;
  return (
    <>
      {/* SAMPLE SMS PREVIEW MODAL */}
      <SampleSmsPreviewModal
        samplePreviewModal={samplePreviewModal}
        setSamplePreviewModal={setSamplePreviewModal}
        copyText={copyText}
      />

      {/* TEST SMS MODAL */}
      <TestSmsModal
        testSmsModal={testSmsModal}
        setTestSmsModal={setTestSmsModal}
        handleSendTestSms={handleSendTestSms}
        smsProviders={smsProviders}
        settings={settings}
      />

      {/* BULK SMS BROADCAST MODAL */}
      <BulkSmsModal
        bulkSmsModal={bulkSmsModal}
        setBulkSmsModal={setBulkSmsModal}
        handleSendBulkSms={handleSendBulkSms}
        settings={settings}
      />

      {/* SMS GATEWAY PROVIDER ADD/EDIT MODAL */}
      <SmsProviderModal
        providerModal={providerModal}
        setProviderModal={setProviderModal}
        handleSaveProvider={handleSaveProvider}
        handleApplyProviderPreset={handleApplyProviderPreset}
      />

      {/* Clear Dummy / Test Data Confirmation Modal (Strictly Development Environment Only) */}
      {(import.meta.env?.DEV || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development')) && (
        <ClearDataConfirmModal
          isOpen={showClearModal}
          onClose={() => setShowClearModal(false)}
          onSuccess={() => {
            showToast?.('All demo and test data cleared successfully!');
            loadSettingsData?.();
          }}
        />
      )}

      {/* Restore Database Backup Modal */}
      <RestoreConfirmModal
        isOpen={restoreModal?.open}
        targetFile={restoreModal?.targetFile}
        isDemoRestore={restoreModal?.isDemoRestore}
        onClose={() => setRestoreModal?.({ open: false, targetFile: null, isDemoRestore: false })}
        onSuccess={() => {
          showToast?.('Database restored successfully!');
          loadBackupFiles?.();
          loadSettingsData?.();
        }}
      />
    </>
  );
}
