import React from 'react';
import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import API from '../../services/api';
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
    loadSettingsData
  } = useSettingsManager();

  const user = currentUser || (() => {
    try {
      const saved = localStorage.getItem('sheba_auth_user') || sessionStorage.getItem('sheba_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const isAdmin = Boolean(user && (
    Number(user.role_id) === 1 ||
    Number(user.role_id) === 2 ||
    ['admin', 'super admin'].includes(String(user.role_name || '').toLowerCase())
  ));

  const visibleTabs = TABS.filter(tab => tab.id !== 'session' || isAdmin);

  const getActiveTabId = () => {
    for (const t of visibleTabs) {
      if (pathname.endsWith(`/${t.id}`) || pathname.includes(`/${t.id}`)) return t.id;
    }
    return 'shop';
  };
  const activeTabId = getActiveTabId();

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'inherit' }}>
      
      {/* Toast Notification Alert */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '16px',
          right: '20px',
          zIndex: 9999999,
          background: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#0284c7' : '#10b981',
          color: '#fff',
          padding: '10px 18px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: '700'
        }}>
          <span>{toast.type === 'error' ? '❌' : toast.type === 'info' ? 'ℹ️' : '✅'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Screen Lock Overlay */}
      {isLocked && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '360px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: '2.8rem', marginBottom: '8px' }}>🔒</div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.3rem', fontWeight: 'bold' }}>POS Terminal Locked</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 16px 0' }}>
              Enter terminal PIN passcode to unlock (Default: 1234)
            </p>
            <input
              type="password"
              maxLength="6"
              placeholder="PIN"
              value={unlockPin}
              onChange={(e) => { setUnlockPin(e.target.value); setPinError(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock(); }}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: '#0f172a',
                border: pinError ? '2px solid #ef4444' : '1px solid #475569',
                color: '#fff',
                textAlign: 'center',
                fontSize: '1.4rem',
                letterSpacing: '8px',
                boxSizing: 'border-box',
                marginBottom: '10px'
              }}
              autoFocus
            />
            {pinError && (
              <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '0 0 10px 0' }}>
                Incorrect PIN code! Please try again (Default: 1234)
              </p>
            )}
            
            {/* Quick keypad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '14px' }}>
              {[1,2,3,4,5,6,7,8,9,'C',0,'OK'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    if (item === 'C') setUnlockPin('');
                    else if (item === 'OK') handleUnlock();
                    else setUnlockPin(prev => prev.length < 6 ? prev + item : prev);
                  }}
                  style={{
                    background: item === 'OK' ? '#0284c7' : '#334155',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 0',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {item}
                </button>
              ))}
            </div>

            <button
              onClick={handleUnlock}
              style={{
                width: '100%',
                padding: '10px',
                background: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Unlock Terminal
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. UNIFIED COMPACT HEADER & QUICK ACTIONS (SINGLE ROW)    */}
      {/* ======================================================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1.5px solid #e2e8f0',
        }}
      >
        {/* Left: Compact Title & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.3rem' }}>⚙️</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                Settings & Preferences
              </h2>
              <span
                style={{
                  background: '#ecfdf5',
                  color: '#065f46',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  border: '1px solid #a7f3d0',
                }}
              >
                v2.8.4 Enterprise
              </span>
            </div>
            <span style={{ color: '#64748b', fontSize: '0.74rem' }}>
              Manage shop profiles, POS terminal settings, print designs, and integrations
            </span>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleDownloadSqlBackup}
            disabled={downloadingBackup}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '7px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: downloadingBackup ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 4px rgba(15, 23, 42, 0.2)',
            }}
            title="Download full database SQL dump"
          >
            <span>{downloadingBackup ? '⌛' : '📥'}</span>
            <span>{downloadingBackup ? 'Backing up...' : 'SQL Backup'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLocked(true)}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              padding: '6px 12px',
              borderRadius: '7px',
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Lock screen session"
          >
            <span>🔒</span>
            <span>Lock</span>
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '7px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.25)',
              }}
              title="Log out from Sheba ERP"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. INTEGRATED TAB NAVIGATION PILLS (MATCHING APP STYLE)   */}
      {/* ======================================================== */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-3.5 overflow-x-auto items-center">
        {visibleTabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          return (
            <Link
              key={tab.id}
              to={`/${tab.id}`}
              className={`no-underline px-3.5 py-1.5 rounded-md font-semibold text-xs sm:text-sm cursor-pointer flex items-center gap-1.5 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-sky-600 font-bold shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              {tab.id === 'sms' && activeTriggersCount > 0 && (
                <span
                  className={`px-1.5 py-0.25 rounded-full text-[0.72rem] font-bold ${
                    isActive ? 'bg-sky-100 text-sky-600' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {activeTriggersCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 3. MAIN CONTENT CARD CONTAINER                           */}
      {/* ======================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
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

          {/* TAB 2: APP & POS SYSTEM CONFIGURATION */}
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

          {/* TAB 3: PRINT TEMPLATES & INVOICE DESIGN */}
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

          {/* TAB 4: BACKUP, RESTORE & DATA PURGE */}
          <Route
            path="backup"
            element={
              <BackupRestoreTab
                settings={settings}
                setSettings={setSettings}
                saving={saving}
                handleSaveSettings={handleSaveSettings}
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
      {/* ======================================================== */}
      {/* SAMPLE SMS PREVIEW MODAL                                 */}
      {/* ======================================================== */}
      {samplePreviewModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
            boxSizing: 'border-box'
          }}
          onClick={() => setSamplePreviewModal({ open: false, title: '', text: '' })}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              padding: '16px 20px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.02rem', color: '#ffffff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>👁️</span> Sample SMS Preview
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                  {samplePreviewModal.title || 'Live message template render'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSamplePreviewModal({ open: false, title: '', text: '' })}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#cbd5e1',
                  fontSize: '1rem',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '0.85rem',
                lineHeight: '1.5',
                color: '#0f172a',
                marginBottom: '12px'
              }}>
                {samplePreviewModal.text}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>
                <span>Total Chars: <strong style={{ color: '#0f172a' }}>{samplePreviewModal.text.length}</strong></span>
                <span>Billing: <strong style={{ color: '#0284c7' }}>{Math.ceil(samplePreviewModal.text.length / 160) || 1} SMS Parts</strong></span>
              </div>
            </div>

            <div style={{
              padding: '12px 20px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px'
            }}>
              <button
                type="button"
                onClick={() => copyText(samplePreviewModal.text, 'Message text copied to clipboard!')}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#334155'
                }}
              >
                📋 Copy Message
              </button>
              <button
                type="button"
                onClick={() => setSamplePreviewModal({ open: false, title: '', text: '' })}
                style={{
                  background: '#0f172a',
                  color: '#fff',
                  border: 'none',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TEST SMS MODAL                                           */}
      {/* ======================================================== */}
      {testSmsModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
            boxSizing: 'border-box'
          }}
          onClick={() => setTestSmsModal({ open: false, phone: '', message: '', sending: false, result: null, provider_id: '' })}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              padding: '16px 20px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.02rem', color: '#ffffff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>💬</span> Send Live Test SMS
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                  Verify real-time gateway delivery and API responsiveness
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTestSmsModal({ open: false, phone: '', message: '', sending: false, result: null, provider_id: '' })}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#cbd5e1',
                  fontSize: '1rem',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Gateway Provider
                </label>
                <select
                  value={testSmsModal.provider_id || (smsProviders.find(p => p.is_active)?.id || '')}
                  onChange={(e) => setTestSmsModal({ ...testSmsModal, provider_id: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#fff', outline: 'none' }}
                >
                  <option value="">-- Active System Provider (Default) --</option>
                  {smsProviders.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.provider_name} {p.is_active ? '✓ (Active)' : ''} ({p.http_method})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Recipient Mobile Number *
                </label>
                <input
                  type="text"
                  value={testSmsModal.phone}
                  onChange={(e) => setTestSmsModal({ ...testSmsModal, phone: e.target.value })}
                  placeholder="017xxxxxxxx"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase' }}>Message Content</label>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    {(testSmsModal.message || '').length} chars
                  </span>
                </div>
                <textarea
                  rows="3"
                  value={testSmsModal.message}
                  onChange={(e) => setTestSmsModal({ ...testSmsModal, message: e.target.value })}
                  placeholder={`[${settings.shop_name || 'Sheba Tech'}] Test SMS notification. Gateway verification completed.`}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              {testSmsModal.result && (
                <div style={{
                  background: testSmsModal.result.status === 'DELIVERED' ? '#dcfce7' : '#fee2e2',
                  border: testSmsModal.result.status === 'DELIVERED' ? '1px solid #bbf7d0' : '1px solid #fecaca',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  color: testSmsModal.result.status === 'DELIVERED' ? '#15803d' : '#b91c1c',
                  marginBottom: '10px'
                }}>
                  <div><strong>Delivery Status:</strong> {testSmsModal.result.status}</div>
                  {testSmsModal.result.provider && <div><strong>Provider:</strong> {testSmsModal.result.provider}</div>}
                  {testSmsModal.result.messageId && <div><strong>Message ID / Reference:</strong> {testSmsModal.result.messageId}</div>}
                  {testSmsModal.result.error && <div><strong>Error:</strong> {testSmsModal.result.error}</div>}
                </div>
              )}
            </div>

            <div style={{
              padding: '12px 20px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px'
            }}>
              <button
                type="button"
                onClick={() => setTestSmsModal({ open: false, phone: '', message: '', sending: false, result: null, provider_id: '' })}
                style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSendTestSms}
                disabled={testSmsModal.sending}
                style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '7px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)' }}
              >
                {testSmsModal.sending ? 'Sending...' : 'Send Live SMS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BULK SMS BROADCAST MODAL                                 */}
      {/* ======================================================== */}
      {bulkSmsModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
            boxSizing: 'border-box'
          }}
          onClick={() => setBulkSmsModal({ open: false, targetGroup: 'due_customers', customNumbers: '', message: '', sending: false, result: null })}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              padding: '16px 20px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.02rem', color: '#ffffff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📢</span> Bulk SMS Broadcast
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                  Send promotional or emergency alerts to customers or field staff
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBulkSmsModal({ open: false, targetGroup: 'due_customers', customNumbers: '', message: '', sending: false, result: null })}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#cbd5e1',
                  fontSize: '1rem',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Target Audience
                </label>
                <select
                  value={bulkSmsModal.targetGroup}
                  onChange={(e) => setBulkSmsModal({ ...bulkSmsModal, targetGroup: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#fff', outline: 'none' }}
                >
                  <option value="due_customers">⚠️ All Due Customers (Outstanding Balance)</option>
                  <option value="technicians">🛠️ All Field Technicians</option>
                  <option value="all_customers">👥 All Registered Clients</option>
                  <option value="custom">✍️ Custom Phone Numbers List</option>
                </select>
              </div>

              {bulkSmsModal.targetGroup === 'custom' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Mobile Numbers (Comma or Newline separated)
                  </label>
                  <textarea
                    rows="2"
                    value={bulkSmsModal.customNumbers}
                    onChange={(e) => setBulkSmsModal({ ...bulkSmsModal, customNumbers: e.target.value })}
                    placeholder="01711223344, 01822334455..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase' }}>Broadcast Message Text</label>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    {bulkSmsModal.message.length} chars ({Math.ceil(bulkSmsModal.message.length / 160) || 1} SMS)
                  </span>
                </div>
                <textarea
                  rows="3"
                  value={bulkSmsModal.message}
                  onChange={(e) => setBulkSmsModal({ ...bulkSmsModal, message: e.target.value })}
                  placeholder={`[${settings.shop_name || 'Sheba Tech'}] Dear customer, thank you for being with us...`}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              {bulkSmsModal.result && (
                <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '8px', fontSize: '0.76rem', color: '#15803d', marginBottom: '10px' }}>
                  <strong>✓ {bulkSmsModal.result.message}</strong>
                </div>
              )}
            </div>

            <div style={{
              padding: '12px 20px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px'
            }}>
              <button
                type="button"
                onClick={() => setBulkSmsModal({ open: false, targetGroup: 'due_customers', customNumbers: '', message: '', sending: false, result: null })}
                style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSendBulkSms}
                disabled={bulkSmsModal.sending || !bulkSmsModal.message.trim()}
                style={{
                  background: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  padding: '7px 18px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  opacity: (!bulkSmsModal.message.trim() || bulkSmsModal.sending) ? 0.6 : 1,
                  boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)'
                }}
              >
                {bulkSmsModal.sending ? 'Broadcasting...' : '📢 Send Broadcast'}
              </button>
            </div>
          </div>
        </div>
      )}

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


      {/* ======================================================== */}
      {/* SMS GATEWAY PROVIDER ADD/EDIT MODAL                      */}
      {/* ======================================================== */}
      {providerModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
            boxSizing: 'border-box'
          }}
          onClick={() => setProviderModal({ open: false, mode: 'create', data: {} })}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '540px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              padding: '16px 20px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.02rem', color: '#ffffff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚙️</span> {providerModal.mode === 'edit' ? 'Edit SMS Gateway Provider' : 'Add New SMS Gateway Provider'}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                  Configure gateway endpoints, authentication credentials, and request mapping
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProviderModal({ open: false, mode: 'create', data: {} })}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#cbd5e1',
                  fontSize: '1rem',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProvider} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                {/* Preset selector */}
                <div style={{ marginBottom: '14px', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '10px 12px', borderRadius: '8px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', marginBottom: '4px' }}>
                    ⚡ Quick Provider Preset
                  </label>
                  <select
                    onChange={(e) => handleApplyProviderPreset(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#fff', outline: 'none' }}
                    defaultValue=""
                  >
                    <option value="" disabled>-- Select Preset Template --</option>
                    <option value="greenweb">🟢 Greenweb Bangladesh (GET / Token)</option>
                    <option value="bulksmsbd">🔵 BulkSMS BD Official (GET / ApiKey)</option>
                    <option value="msensit">🟣 mSensit SMS Gateway (POST JSON)</option>
                    <option value="elitbuzz">🟠 ElitBuzz SMS (POST JSON)</option>
                    <option value="twilio">🌐 Twilio SMS International (POST Basic)</option>
                    <option value="custom">⚙️ Custom HTTP Webhook / API</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>Provider Name *</label>
                    <input
                      type="text"
                      required
                      value={providerModal.data.provider_name || ''}
                      onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, provider_name: e.target.value } })}
                      placeholder="e.g. Greenweb Bangladesh"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>Provider Code</label>
                    <input
                      type="text"
                      value={providerModal.data.provider_code || ''}
                      onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, provider_code: e.target.value } })}
                      placeholder="e.g. greenweb"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>API Endpoint URL *</label>
                  <input
                    type="text"
                    required
                    value={providerModal.data.api_url || ''}
                    onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, api_url: e.target.value } })}
                    placeholder="http://api.greenweb.com.bd/api.php"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>HTTP Method</label>
                    <select
                      value={providerModal.data.http_method || 'GET'}
                      onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, http_method: e.target.value } })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#fff', outline: 'none' }}
                    >
                      <option value="GET">GET (Query Params)</option>
                      <option value="POST">POST (JSON Body)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>Auth Mechanism</label>
                    <select
                      value={providerModal.data.auth_type || 'param'}
                      onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, auth_type: e.target.value } })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#fff', outline: 'none' }}
                    >
                      <option value="param">Query/Body Parameter</option>
                      <option value="bearer">Bearer Token (Header)</option>
                      <option value="basic">Basic Auth (Twilio)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>API Key / Secret Token</label>
                    <input
                      type="password"
                      value={providerModal.data.api_key || ''}
                      onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, api_key: e.target.value } })}
                      placeholder="Enter Gateway API Key"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>Masking Sender ID</label>
                    <input
                      type="text"
                      value={providerModal.data.sender_id || ''}
                      onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, sender_id: e.target.value } })}
                      placeholder="e.g. SHEBATECH"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', marginBottom: '12px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>Phone Key</label>
                    <input
                      type="text"
                      value={providerModal.data.param_phone_key || 'to'}
                      onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, param_phone_key: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.74rem', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>Message Key</label>
                    <input
                      type="text"
                      value={providerModal.data.param_message_key || 'message'}
                      onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, param_message_key: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.74rem', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>API Key Param</label>
                    <input
                      type="text"
                      value={providerModal.data.param_api_key || 'token'}
                      onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, param_api_key: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.74rem', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>Sender Key</label>
                    <input
                      type="text"
                      value={providerModal.data.param_sender_key || 'sender_id'}
                      onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, param_sender_key: e.target.value } })}
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.74rem', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>Live Balance Query URL (Optional)</label>
                  <input
                    type="text"
                    value={providerModal.data.balance_endpoint || ''}
                    onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, balance_endpoint: e.target.value } })}
                    placeholder="http://api.greenweb.com.bd/gurecomm/credit.php"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 700, color: '#0f172a' }}>
                    <input
                      type="checkbox"
                      checked={!!providerModal.data.is_active}
                      onChange={(e) => setProviderModal({ ...providerModal, data: { ...providerModal.data, is_active: e.target.checked } })}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    Set as Active System SMS Gateway
                  </label>
                </div>
              </div>

              <div style={{
                padding: '12px 20px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px'
              }}>
                <button
                  type="button"
                  onClick={() => setProviderModal({ open: false, mode: 'create', data: {} })}
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '7px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)' }}
                >
                  Save Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
