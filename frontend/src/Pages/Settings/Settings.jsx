import React from 'react';
import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ClearDataConfirmModal from '../../components/modals/ClearDataConfirmModal';
import RestoreConfirmModal from '../../components/modals/RestoreConfirmModal';
import useSettingsManager from '../../hooks/useSettingsManager';
import { TABS } from '../../utils/settingsConstants';
import StoreProfileTab from './tabs/StoreProfileTab';
import PosConfigTab from './tabs/PosConfigTab';
import PrintTemplateTab from './tabs/PrintTemplateTab';
import BackupRestoreTab from './tabs/BackupRestoreTab';
import SmsModuleTab from './tabs/SmsModuleTab';
import LicenseBillingTab from './tabs/LicenseBillingTab';
import LanguageLocaleTab from './tabs/LanguageLocaleTab';
import UpdatesAboutTab from './tabs/UpdatesAboutTab';
import SecuritySessionTab from './tabs/SecuritySessionTab';
import ScreenLockOverlay from './components/ScreenLockOverlay';
import SampleSmsPreviewModal from './modals/SampleSmsPreviewModal';
import TestSmsModal from './modals/TestSmsModal';
import BulkSmsModal from './modals/BulkSmsModal';
import SmsProviderModal from './modals/SmsProviderModal';

export default function Settings({ onLogout, currentUser }) {
  const location = useLocation();
  const pathname = location.pathname;

  const {
    loading,
    setLoading,
    saving,
    setSaving,
    savingTriggers,
    setSavingTriggers,
    toast,
    setToast,
    showToast,
    copyText,
    settings,
    setSettings,
    handleSaveSettings,
    handleResetDummyShop,
    uploadImageFile,
    handleGenericImageUpload,
    handleBrandLogoFileUpload,
    handleMoveBrandLogo,
    handleLogoUpload,
    handleAddBrandLogo,
    handleUpdateBrandLogo,
    handleRemoveBrandLogo,
    handleSavePrintDesign,
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
    loadBackupFiles,
    handleUploadSqlFile,
    handleDownloadSqlBackup,
    handleExportJsonBackup,
    handleTriggerBackup,
    smsProviders,
    setSmsProviders,
    smsBalance,
    setSmsBalance,
    providerModal,
    setProviderModal,
    smsTriggers,
    setSmsTriggers,
    smsLogs,
    setSmsLogs,
    smsCategoryFilter,
    setSmsCategoryFilter,
    showApiKey,
    setShowApiKey,
    samplePreviewModal,
    setSamplePreviewModal,
    testSmsModal,
    setTestSmsModal,
    bulkSmsModal,
    setBulkSmsModal,
    filteredTriggers,
    activeTriggersCount,
    handleToggleSmsTrigger,
    handleTemplateChange,
    handleInsertToken,
    handleSaveSmsTriggers,
    handleOpenSamplePreview,
    handleSendTestSms,
    handleSendBulkSms,
    handleCheckLiveBalance,
    handleSetActiveProvider,
    handleSaveProvider,
    handleDeleteProvider,
    handleApplyProviderPreset,
    stats,
    setStats,
    isLocked,
    setIsLocked,
    unlockPin,
    setUnlockPin,
    pinError,
    setPinError,
    updateChecking,
    setUpdateChecking,
    updateStatus,
    setUpdateStatus,
    previewMode,
    setPreviewMode,
    handleCheckUpdates,
    handleUnlock,
    licenseInfo,
    setLicenseInfo,
    redemptionCode,
    setRedemptionCode,
    redeeming,
    setRedeeming,
    syncingHeartbeat,
    setSyncingHeartbeat,
    redemptionResult,
    setRedemptionResult,
    handleRedeemCode,
    handleTriggerHeartbeat,
    loadSettingsData,
  } = useSettingsManager();

  const user =
    currentUser ||
    (() => {
      try {
        const saved =
          localStorage.getItem('sheba_auth_user') ||
          sessionStorage.getItem('sheba_auth_user');
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    })();

  const isAdmin = Boolean(
    user &&
      (Number(user.role_id) === 1 ||
        Number(user.role_id) === 2 ||
        ['admin', 'super admin'].includes(String(user.role_name || '').toLowerCase()))
  );

  const visibleTabs = TABS.filter((tab) => tab.id !== 'session' || isAdmin);

  const getActiveTabId = () => {
    for (const t of visibleTabs) {
      if (pathname.endsWith(`/${t.id}`) || pathname.includes(`/${t.id}`)) return t.id;
    }
    return 'shop';
  };
  const activeTabId = getActiveTabId();

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      {/* Toast Notification Alert */}
      {toast.show && (
        <div
          className={`fixed top-4 right-5 z-[9999999] px-4 py-2.5 rounded-xl shadow-2xl text-white font-bold text-xs flex items-center gap-2.5 animate-fadeIn ${
            toast.type === 'error'
              ? 'bg-red-500'
              : toast.type === 'info'
              ? 'bg-sky-600'
              : 'bg-emerald-600'
          }`}
        >
          <span>{toast.type === 'error' ? '❌' : toast.type === 'info' ? 'ℹ️' : '✅'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Screen Lock Overlay */}
      <ScreenLockOverlay
        isLocked={isLocked}
        unlockPin={unlockPin}
        setUnlockPin={setUnlockPin}
        pinError={pinError}
        setPinError={setPinError}
        handleUnlock={handleUnlock}
      />

      {/* 1. TOP HERO / ACTION BAR */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 mb-4 flex flex-wrap justify-between items-center gap-3">
        {/* Left: Compact Title & Badge */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚙️</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                Settings & Preferences
              </h2>
              <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                v2.8.4 Enterprise
              </span>
            </div>
            <span className="text-slate-500 text-xs mt-0.5 block">
              Manage shop profiles, POS terminal settings, print designs, and integrations
            </span>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex gap-2 items-center flex-wrap">
          <button
            type="button"
            onClick={handleDownloadSqlBackup}
            disabled={downloadingBackup}
            className={`bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition ${
              downloadingBackup ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            }`}
            title="Download full database SQL dump"
          >
            <span>{downloadingBackup ? '⌛' : '📥'}</span>
            <span>{downloadingBackup ? 'Backing up...' : 'SQL Backup'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLocked(true)}
            className="bg-white hover:bg-slate-50 border border-slate-300 px-3.5 py-1.5 rounded-lg text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            title="Lock screen session"
          >
            <span>🔒</span>
            <span>Lock</span>
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-red-600/25 transition cursor-pointer"
              title="Log out from Sheba ERP"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. INTEGRATED TAB NAVIGATION PILLS */}
      <div className="flex gap-1 bg-slate-200/70 p-1 rounded-xl mb-4 overflow-x-auto items-center">
        {visibleTabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          return (
            <Link
              key={tab.id}
              to={`/${tab.id}`}
              className={`no-underline px-3.5 py-1.5 rounded-lg font-semibold text-xs sm:text-sm cursor-pointer flex items-center gap-1.5 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-sky-600 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>{tab.label}</span>
              {tab.id === 'sms' && activeTriggersCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isActive ? 'bg-sky-100 text-sky-600' : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {activeTriggersCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* 3. MAIN CONTENT CARD CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-6">
        <Routes>
          {/* TAB 1: SHOP & BUSINESS PROFILE */}
          <Route
            path="shop"
            element={
              <StoreProfileTab
                settings={settings}
                setSettings={setSettings}
                saving={saving}
                handleResetDummyShop={handleResetDummyShop}
                handleSaveSettings={handleSaveSettings}
                handleLogoUpload={handleLogoUpload}
              />
            }
          />

          {/* TAB 2: POS TERMINAL & INVOICING CONFIG */}
          <Route
            path="pos"
            element={
              <PosConfigTab
                settings={settings}
                setSettings={setSettings}
                saving={saving}
                handleSaveSettings={handleSaveSettings}
              />
            }
          />

          {/* TAB 3: PRINT ENGINE & INVOICE DESIGNER */}
          <Route
            path="print"
            element={
              <PrintTemplateTab
                settings={settings}
                setSettings={setSettings}
                saving={saving}
                handleSavePrintDesign={handleSavePrintDesign}
                handleGenericImageUpload={handleGenericImageUpload}
                handleBrandLogoFileUpload={handleBrandLogoFileUpload}
                handleMoveBrandLogo={handleMoveBrandLogo}
                handleAddBrandLogo={handleAddBrandLogo}
                handleUpdateBrandLogo={handleUpdateBrandLogo}
                handleRemoveBrandLogo={handleRemoveBrandLogo}
                previewMode={previewMode}
                setPreviewMode={setPreviewMode}
              />
            }
          />

          {/* TAB 4: BACKUP, RESTORE & DATA RECOVERY */}
          <Route
            path="backup"
            element={
              <BackupRestoreTab
                handleDownloadSqlBackup={handleDownloadSqlBackup}
                downloadingBackup={downloadingBackup}
                handleExportJsonBackup={handleExportJsonBackup}
                downloadingJson={downloadingJson}
                handleTriggerBackup={handleTriggerBackup}
                backupLogs={backupLogs}
                loadSettingsData={loadSettingsData}
                backupFiles={backupFiles}
                loadingFiles={loadingFiles}
                loadBackupFiles={loadBackupFiles}
                setRestoreModal={setRestoreModal}
                uploadingBackup={uploadingBackup}
                handleUploadSqlFile={handleUploadSqlFile}
                setShowClearModal={setShowClearModal}
              />
            }
          />

          {/* TAB 5: SMS MODULE & AUTOMATED ALERTS */}
          <Route
            path="sms"
            element={
              <SmsModuleTab
                settings={settings}
                setSettings={setSettings}
                savingTriggers={savingTriggers}
                handleSaveSmsTriggers={handleSaveSmsTriggers}
                smsProviders={smsProviders}
                smsBalance={smsBalance}
                handleCheckLiveBalance={handleCheckLiveBalance}
                handleSetActiveProvider={handleSetActiveProvider}
                handleDeleteProvider={handleDeleteProvider}
                setProviderModal={setProviderModal}
                setTestSmsModal={setTestSmsModal}
                setBulkSmsModal={setBulkSmsModal}
                smsCategoryFilter={smsCategoryFilter}
                setSmsCategoryFilter={setSmsCategoryFilter}
                filteredTriggers={filteredTriggers}
                activeTriggersCount={activeTriggersCount}
                smsTriggers={smsTriggers}
                handleToggleSmsTrigger={handleToggleSmsTrigger}
                handleTemplateChange={handleTemplateChange}
                handleInsertToken={handleInsertToken}
                handleOpenSamplePreview={handleOpenSamplePreview}
                smsLogs={smsLogs}
              />
            }
          />

          {/* TAB 6: LICENSE & BILLING */}
          <Route
            path="domain"
            element={
              <LicenseBillingTab
                settings={settings}
                licenseInfo={licenseInfo}
                stats={stats}
                copyText={copyText}
                syncingHeartbeat={syncingHeartbeat}
                handleTriggerHeartbeat={handleTriggerHeartbeat}
                redemptionCode={redemptionCode}
                setRedemptionCode={setRedemptionCode}
                redeeming={redeeming}
                handleRedeemCode={handleRedeemCode}
                redemptionResult={redemptionResult}
                saving={saving}
                handleSaveSettings={handleSaveSettings}
              />
            }
          />

          {/* TAB 7: LANGUAGE & LOCALE */}
          <Route
            path="lang"
            element={
              <LanguageLocaleTab
                settings={settings}
                setSettings={setSettings}
                saving={saving}
                handleSaveSettings={handleSaveSettings}
              />
            }
          />

          {/* TAB 8: SOFTWARE UPDATES & SYSTEM ABOUT */}
          <Route
            path="updates"
            element={
              <UpdatesAboutTab
                handleCheckUpdates={handleCheckUpdates}
                updateChecking={updateChecking}
                updateStatus={updateStatus}
                showToast={showToast}
              />
            }
          />

          {/* TAB 9: SESSION SECURITY & ACCESS CONTROL */}
          <Route
            path="session"
            element={
              isAdmin ? (
                <SecuritySessionTab
                  currentUser={currentUser || user}
                  settings={settings}
                  setSettings={setSettings}
                  setIsLocked={setIsLocked}
                  saving={saving}
                  handleSaveSettings={handleSaveSettings}
                  onLogout={onLogout}
                  showToast={showToast}
                />
              ) : (
                <div className="text-center py-16 px-4 bg-white rounded-xl border border-slate-200 shadow-sm my-6 max-w-md mx-auto">
                  <div className="text-4xl mb-3">🔒</div>
                  <h3 className="text-base font-bold text-slate-800">Access Restricted</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-5">
                    The Session & Security section is strictly reserved for Admin and Super Admin accounts.
                  </p>
                  <Link
                    to="shop"
                    className="no-underline px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm inline-block"
                  >
                    Return to Store Profile
                  </Link>
                </div>
              )
            }
          />

          <Route path="*" element={<Navigate to="/shop" replace />} />
        </Routes>
      </div>

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

      {/* Clear Dummy / Test Data Confirmation Modal */}
      <ClearDataConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onSuccess={() => {
          showToast('All demo and test data cleared successfully!');
          loadSettingsData();
        }}
      />

      {/* Restore Database Backup Modal */}
      <RestoreConfirmModal
        isOpen={restoreModal.open}
        targetFile={restoreModal.targetFile}
        isDemoRestore={restoreModal.isDemoRestore}
        onClose={() => setRestoreModal({ open: false, targetFile: null, isDemoRestore: false })}
        onSuccess={() => {
          showToast('Database restored successfully!');
          loadBackupFiles();
          loadSettingsData();
        }}
      />
    </div>
  );
}
