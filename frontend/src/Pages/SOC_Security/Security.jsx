import React from 'react';
import { useLocation } from 'react-router-dom';
import useSecurityManager from './hooks/useSecurityManager';
import SecurityHeader from './components/SecurityHeader';
import SecurityKpiCards from './components/SecurityKpiCards';
import SecurityTabNav from './components/SecurityTabNav';
import SecurityModals from './components/SecurityModals';
import SecurityRoutes from './components/SecurityRoutes';

export default function Security() {
  const location = useLocation();
  const pathname = location.pathname;

  const getActiveKey = () => {
    if (pathname.endsWith('/staff') || pathname.includes('/staff')) return 'staff';
    if (pathname.endsWith('/roles') || pathname.includes('/roles')) return 'roles';
    if (pathname.endsWith('/devices') || pathname.includes('/devices')) return 'devices';
    if (pathname.endsWith('/firewall') || pathname.includes('/firewall')) return 'firewall';
    return 'audit';
  };
  const currentTab = getActiveKey();

  const sec = useSecurityManager();
  const { overview, logs, users, roles, devices, ipRules, error, successMsg, loadAllData, setIsAddStaffOpen, setIsAddDeviceOpen, setIsAddIpOpen } = sec;

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
        logs={logs}
        users={users}
        roles={roles}
        devices={devices}
        ipRules={ipRules}
      />

      {/* Routes for 5 Tabs */}
      <SecurityRoutes {...sec} />

      {/* Security Dialogs and Modals */}
      <SecurityModals {...sec} />
    </div>
  );
}
