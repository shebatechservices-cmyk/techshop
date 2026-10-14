import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuditTrailTab from './tabs/AuditTrailTab';
import StaffLoginsTab from './tabs/StaffLoginsTab';
import RoleMatrixTab from './tabs/RoleMatrixTab';
import DevicesTab from './tabs/DevicesTab';
import FirewallTab from './tabs/FirewallTab';
import useSecurityManager from './hooks/useSecurityManager';
import SecurityHeader from './components/SecurityHeader';
import SecurityKpiCards from './components/SecurityKpiCards';
import SecurityTabNav from './components/SecurityTabNav';
import SecurityModals from './components/SecurityModals';

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

      <SecurityModals
        isAddStaffOpen={isAddStaffOpen}
        setIsAddStaffOpen={setIsAddStaffOpen}
        newStaff={newStaff}
        setNewStaff={setNewStaff}
        roles={roles}
        handleCreateStaff={handleCreateStaff}
        generate3TypeStaffPassword={generate3TypeStaffPassword}
        editingStaff={editingStaff}
        setEditingStaff={setEditingStaff}
        handleUpdateStaffSubmit={handleUpdateStaffSubmit}
        staffToDelete={staffToDelete}
        setStaffToDelete={setStaffToDelete}
        handleConfirmDeleteStaff={handleConfirmDeleteStaff}
        isAddDeviceOpen={isAddDeviceOpen}
        setIsAddDeviceOpen={setIsAddDeviceOpen}
        newDevice={newDevice}
        setNewDevice={setNewDevice}
        handleCreateDevice={handleCreateDevice}
        isAddIpOpen={isAddIpOpen}
        setIsAddIpOpen={setIsAddIpOpen}
        newIpRule={newIpRule}
        setNewIpRule={setNewIpRule}
        handleCreateIpRule={handleCreateIpRule}
        inspectEvent={inspectEvent}
        setInspectEvent={setInspectEvent}
      />
    </div>
  );
}
