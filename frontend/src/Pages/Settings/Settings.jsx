import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SettingsProvider, useSettings } from './context/SettingsContext';
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
import SettingsHeader from './components/SettingsHeader';
import SettingsNavTabs from './components/SettingsNavTabs';
import SettingsModals from './components/SettingsModals';
import AccessRestricted from './components/AccessRestricted';

function SettingsContent() {
  const {
    toast,
    isLocked,
    unlockPin,
    setUnlockPin,
    pinError,
    setPinError,
    handleUnlock,
    isAdmin
  } = useSettings();

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      {/* Toast Notification Alert */}
      {toast?.show && (
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
      <SettingsHeader />

      {/* 2. INTEGRATED TAB NAVIGATION PILLS */}
      <SettingsNavTabs />

      {/* 3. MAIN CONTENT CARD CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-6">
        <Routes>
          <Route path="shop" element={<StoreProfileTab />} />
          <Route path="pos" element={<PosConfigTab />} />
          <Route path="print" element={<PrintTemplateTab />} />
          <Route path="backup" element={<BackupRestoreTab />} />
          <Route path="sms" element={<SmsModuleTab />} />
          <Route path="domain" element={<LicenseBillingTab />} />
          <Route path="lang" element={<LanguageLocaleTab />} />
          <Route path="updates" element={<UpdatesAboutTab />} />
          <Route
            path="session"
            element={isAdmin ? <SecuritySessionTab /> : <AccessRestricted />}
          />
          <Route path="*" element={<Navigate to="/shop" replace />} />
        </Routes>
      </div>

      {/* 4. MODALS CONTAINER */}
      <SettingsModals />
    </div>
  );
}

export default function Settings({ onLogout, currentUser }) {
  return (
    <SettingsProvider onLogout={onLogout} currentUser={currentUser}>
      <SettingsContent />
    </SettingsProvider>
  );
}
