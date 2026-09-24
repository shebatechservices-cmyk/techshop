import React from 'react';
import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AddStaffModal from './modals/AddStaffModal';
import EditStaffModal from './modals/EditStaffModal';
import DeleteStaffModal from './modals/DeleteStaffModal';
import AddDeviceModal from './modals/AddDeviceModal';
import AddIpRuleModal from './modals/AddIpRuleModal';
import InspectEventModal from './modals/InspectEventModal';
import AuditTrailTab from './tabs/AuditTrailTab';
import StaffLoginsTab from './tabs/StaffLoginsTab';
import RoleMatrixTab from './tabs/RoleMatrixTab';
import DevicesTab from './tabs/DevicesTab';
import FirewallTab from './tabs/FirewallTab';
import useSecurityManager from './hooks/useSecurityManager';

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

  const {
    overview,
    logs,
    users,
    roles,
    permissionsGrouped,
    devices,
    ipRules,
    error,
    successMsg,
    showToast,
    // Tab 1: Audit
    severityFilter,
    setSeverityFilter,
    auditSearch,
    setAuditSearch,
    inspectEvent,
    setInspectEvent,
    filteredLogs,
    // Tab 2: Staff
    staffSearch,
    setStaffSearch,
    staffRoleFilter,
    setStaffRoleFilter,
    isAddStaffOpen,
    setIsAddStaffOpen,
    staffSubTab,
    setStaffSubTab,
    staffRecoveryRequests,
    resolvingStaffReqId,
    setResolvingStaffReqId,
    newStaffPassword,
    setNewStaffPassword,
    staffResolutionNotes,
    setStaffResolutionNotes,
    staffRecoveryLoading,
    pendingStaffList,
    processingStaffId,
    newStaff,
    setNewStaff,
    editingStaff,
    setEditingStaff,
    staffToDelete,
    setStaffToDelete,
    filteredUsers,
    fetchPendingStaff,
    handleApproveOrRejectStaff,
    generate3TypeStaffPassword,
    loadStaffRecovery,
    handleResolveStaffRecovery,
    handleToggleUserLock,
    handleCreateStaff,
    handleOpenEditStaff,
    handleUpdateStaffSubmit,
    handleConfirmDeleteStaff,
    // Tab 3: Roles
    selectedRoleId,
    setSelectedRoleId,
    activeRolePerms,
    savingPerms,
    togglePermission,
    handleSaveRolePermissions,
    // Tab 4: Devices
    isAddDeviceOpen,
    setIsAddDeviceOpen,
    strictDeviceMode,
    setStrictDeviceMode,
    newDevice,
    setNewDevice,
    handleToggleDeviceAuth,
    handleDeleteDevice,
    handleCreateDevice,
    // Tab 5: IP Firewall
    isAddIpOpen,
    setIsAddIpOpen,
    newIpRule,
    setNewIpRule,
    handleCreateIpRule,
    handleDeleteIpRule,
    // Overall
    loadAllData,
  } = useSecurityManager();

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      {/* Top SOC Defense Header */}
      <div className="flex justify-between items-center mb-5 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-[1.75rem] font-black text-slate-900 m-0 tracking-tight">
              🛡️ SOC Security &amp; Access Control
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active Shield · Zero Trust Access
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1 mb-0">
            Enterprise Threat Operations, Staff &amp; Technician Access Control, Device Authorization, IP Firewall &amp; Granular Roles
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={loadAllData}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold text-xs sm:text-sm cursor-pointer flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
          >
            🔄 Refresh SOC
          </button>

          <button
            type="button"
            onClick={() => setIsAddStaffOpen(true)}
            className="px-3.5 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs sm:text-sm cursor-pointer hover:bg-slate-800 transition-colors border-0"
          >
            + Register Staff / Tech
          </button>

          <button
            type="button"
            onClick={() => setIsAddDeviceOpen(true)}
            className="px-3.5 py-2 bg-indigo-700 text-white rounded-lg font-bold text-xs sm:text-sm cursor-pointer hover:bg-indigo-800 transition-colors border-0"
          >
            + Authorize Device
          </button>

          <button
            type="button"
            onClick={() => setIsAddIpOpen(true)}
            className="px-3.5 py-2 bg-rose-600 text-white rounded-lg font-bold text-xs sm:text-sm cursor-pointer hover:bg-rose-700 transition-colors border-0"
          >
            + Firewall IP Rule
          </button>
        </div>
      </div>

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

      {/* 5 Security KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-5.5">
        {/* KPI 1: Health Score */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Security Posture
            </span>
            <span className="px-1.5 py-0.5 bg-emerald-100 rounded text-emerald-700 text-xs font-extrabold">
              EXCELLENT
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {overview.healthScore}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Zero breach · Strict Zero-Trust
          </div>
        </div>

        {/* KPI 2: Staff & Techs */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Staff &amp; Tech Fleet
            </span>
            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 text-xs font-extrabold">
              ACCOUNTS
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {overview.totalUsers}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {overview.technicians} Field Techs · {overview.lockedUsers} Locked
          </div>
        </div>

        {/* KPI 3: Blocked Threats */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-extrabold text-rose-700 uppercase tracking-wider">
              Threats &amp; Spam
            </span>
            <span className="px-1.5 py-0.5 bg-rose-100 rounded text-rose-700 text-xs font-extrabold">
              SHIELDED
            </span>
          </div>
          <div className="text-2xl font-black text-rose-700">
            {overview.totalBlockedAttempts}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Brute-force &amp; Spam attempts stopped
          </div>
        </div>

        {/* KPI 4: Trusted Devices */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">
              Hardware Devices
            </span>
            <span className="px-1.5 py-0.5 bg-indigo-100 rounded text-indigo-700 text-xs font-extrabold">
              AUTH
            </span>
          </div>
          <div className="text-2xl font-black text-indigo-700">
            {overview.authorizedDevices} / {overview.totalDevices}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            POS terminals &amp; mobile fingerprints
          </div>
        </div>

        {/* KPI 5: Firewall Rules */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-extrabold text-sky-700 uppercase tracking-wider">
              Firewall Perimeter
            </span>
            <span className="px-1.5 py-0.5 bg-sky-100 rounded text-sky-700 text-xs font-extrabold">
              IP RULES
            </span>
          </div>
          <div className="text-2xl font-black text-sky-700">
            {overview.ipRulesCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Static broadband whitelist active
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 mb-5 flex-wrap">
        {[
          { key: 'audit', label: '🛡️ SIEM Audit Trail', count: logs.length },
          { key: 'staff', label: '👥 Staff & Technician Logins', count: users.length },
          { key: 'roles', label: '🔑 Role & Permission Matrix', count: roles.length },
          { key: 'devices', label: '📱 Hardware Device IDs', count: devices.length },
          { key: 'firewall', label: '🌐 IP Firewall & Anti-Spam', count: ipRules.length },
        ].map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <Link
              key={tab.key}
              to={`/${tab.key}`}
              className={`no-underline px-4.5 py-2.5 font-bold text-sm cursor-pointer flex items-center gap-2 -mb-px transition-colors border-0 bg-transparent border-b-2 ${
                isActive ? 'text-rose-600 border-rose-600' : 'text-slate-500 hover:text-slate-800 border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-extrabold ${
                  isActive ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Routes for 5 Tabs */}
      <Routes>
        <Route
          index
          element={
            <AuditTrailTab
              logs={logs}
              filteredLogs={filteredLogs}
              severityFilter={severityFilter}
              setSeverityFilter={setSeverityFilter}
              auditSearch={auditSearch}
              setAuditSearch={setAuditSearch}
              setInspectEvent={setInspectEvent}
            />
          }
        />
        <Route
          path="audit"
          element={
            <AuditTrailTab
              logs={logs}
              filteredLogs={filteredLogs}
              severityFilter={severityFilter}
              setSeverityFilter={setSeverityFilter}
              auditSearch={auditSearch}
              setAuditSearch={setAuditSearch}
              setInspectEvent={setInspectEvent}
            />
          }
        />
        <Route
          path="staff"
          element={
            <StaffLoginsTab
              staffSubTab={staffSubTab}
              setStaffSubTab={setStaffSubTab}
              filteredUsers={filteredUsers}
              staffRecoveryRequests={staffRecoveryRequests}
              fetchPendingStaff={fetchPendingStaff}
              pendingStaffList={pendingStaffList}
              staffSearch={staffSearch}
              setStaffSearch={setStaffSearch}
              staffRoleFilter={staffRoleFilter}
              setStaffRoleFilter={setStaffRoleFilter}
              setIsAddStaffOpen={setIsAddStaffOpen}
              handleOpenEditStaff={handleOpenEditStaff}
              handleToggleUserLock={handleToggleUserLock}
              showToast={showToast}
              setStaffToDelete={setStaffToDelete}
              loadStaffRecovery={loadStaffRecovery}
              resolvingStaffReqId={resolvingStaffReqId}
              setResolvingStaffReqId={setResolvingStaffReqId}
              newStaffPassword={newStaffPassword}
              setNewStaffPassword={setNewStaffPassword}
              generate3TypeStaffPassword={generate3TypeStaffPassword}
              staffResolutionNotes={staffResolutionNotes}
              setStaffResolutionNotes={setStaffResolutionNotes}
              staffRecoveryLoading={staffRecoveryLoading}
              handleResolveStaffRecovery={handleResolveStaffRecovery}
              processingStaffId={processingStaffId}
              handleApproveOrRejectStaff={handleApproveOrRejectStaff}
            />
          }
        />
        <Route
          path="roles"
          element={
            <RoleMatrixTab
              roles={roles}
              selectedRoleId={selectedRoleId}
              setSelectedRoleId={setSelectedRoleId}
              handleSaveRolePermissions={handleSaveRolePermissions}
              savingPerms={savingPerms}
              permissionsGrouped={permissionsGrouped}
              activeRolePerms={activeRolePerms}
              togglePermission={togglePermission}
            />
          }
        />
        <Route
          path="devices"
          element={
            <DevicesTab
              strictDeviceMode={strictDeviceMode}
              setStrictDeviceMode={setStrictDeviceMode}
              showToast={showToast}
              devices={devices}
              handleToggleDeviceAuth={handleToggleDeviceAuth}
              handleDeleteDevice={handleDeleteDevice}
            />
          }
        />
        <Route
          path="firewall"
          element={
            <FirewallTab
              ipRules={ipRules}
              handleDeleteIpRule={handleDeleteIpRule}
            />
          }
        />
        <Route path="*" element={<Navigate to="/audit" replace />} />
      </Routes>

      {/* ========================================================= */}
      {/* MODAL: REGISTER STAFF / TECHNICIAN */}
      {/* ========================================================= */}
      <AddStaffModal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        newStaff={newStaff}
        setNewStaff={setNewStaff}
        roles={roles}
        handleCreateStaff={handleCreateStaff}
        generate3TypeStaffPassword={generate3TypeStaffPassword}
      />

      {/* ========================================================= */}
      {/* MODAL: EDIT STAFF / TECHNICIAN */}
      {/* ========================================================= */}
      <EditStaffModal
        editingStaff={editingStaff}
        onClose={() => setEditingStaff(null)}
        setEditingStaff={setEditingStaff}
        roles={roles}
        handleUpdateStaffSubmit={handleUpdateStaffSubmit}
        generate3TypeStaffPassword={generate3TypeStaffPassword}
      />

      {/* ========================================================= */}
      {/* MODAL: DELETE STAFF CONFIRMATION */}
      {/* ========================================================= */}
      <DeleteStaffModal
        staffToDelete={staffToDelete}
        onClose={() => setStaffToDelete(null)}
        handleConfirmDeleteStaff={handleConfirmDeleteStaff}
      />

      {/* ========================================================= */}
      {/* MODAL: AUTHORIZE DEVICE */}
      {/* ========================================================= */}
      <AddDeviceModal
        isOpen={isAddDeviceOpen}
        onClose={() => setIsAddDeviceOpen(false)}
        newDevice={newDevice}
        setNewDevice={setNewDevice}
        handleCreateDevice={handleCreateDevice}
      />

      {/* ========================================================= */}
      {/* MODAL: ADD FIREWALL IP RULE */}
      {/* ========================================================= */}
      <AddIpRuleModal
        isOpen={isAddIpOpen}
        onClose={() => setIsAddIpOpen(false)}
        newIpRule={newIpRule}
        setNewIpRule={setNewIpRule}
        handleCreateIpRule={handleCreateIpRule}
      />

      {/* ========================================================= */}
      {/* MODAL: INSPECT AUDIT EVENT */}
      {/* ========================================================= */}
      <InspectEventModal
        inspectEvent={inspectEvent}
        onClose={() => setInspectEvent(null)}
      />
    </div>
  );
}
