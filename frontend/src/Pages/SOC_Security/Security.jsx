import React, { useState } from 'react';
import useSecurityManager from './hooks/useSecurityManager';
import SecurityHeader from './components/SecurityHeader';
import SecurityKpiCards from './components/SecurityKpiCards';
import SecurityTabNav from './components/SecurityTabNav';
import SecurityModals from './components/SecurityModals';
import SecurityRoutes from './components/SecurityRoutes';

export default function Security() {
  const [currentTab, setCurrentTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      if (['audit', 'staff', 'roles', 'devices', 'firewall'].includes(tabParam)) {
        return tabParam;
      }
      const hash = window.location.hash.replace(/^#/, '');
      if (['audit', 'staff', 'roles', 'devices', 'firewall'].includes(hash)) {
        return hash;
      }
    }
    return 'audit';
  });

  const sec = useSecurityManager();
  const {
    overview,
    logs,
    users,
    roles,
    devices,
    ipRules,
    error,
    successMsg,
    loadAllData,
    setIsAddStaffOpen,
    setIsAddDeviceOpen,
    setIsAddIpOpen,
  } = sec;

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      <SecurityHeader
        onRefresh={loadAllData}
        onOpenAddStaff={() => setIsAddStaffOpen(true)}
        onOpenAddDevice={() => setIsAddDeviceOpen(true)}
        onOpenAddIp={() => setIsAddIpOpen(true)}
      />

      {error && (
        <div className="p-3 sm:px-4 sm:py-3 bg-rose-100 text-rose-700 rounded-lg mb-4 border border-rose-200 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}
      {successMsg && (
        <div className="p-3 sm:px-4 sm:py-3 bg-emerald-100 text-emerald-700 rounded-lg mb-4 border border-emerald-200 text-sm font-medium">
          ✓ {successMsg}
        </div>
      )}

      <SecurityKpiCards overview={overview} />

      <SecurityTabNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        logs={logs}
        users={users}
        roles={roles}
        devices={devices}
        ipRules={ipRules}
      />

      {/* Render Active Tab */}
      <SecurityRoutes currentTab={currentTab} {...sec} />

      {/* Security Dialogs and Modals */}
      <SecurityModals {...sec} />
    </div>
  );
}
