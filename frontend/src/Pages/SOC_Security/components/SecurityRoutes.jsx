import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuditTrailTab from '../tabs/AuditTrailTab';
import StaffLoginsTab from '../tabs/StaffLoginsTab';
import RoleMatrixTab from '../tabs/RoleMatrixTab';
import DevicesTab from '../tabs/DevicesTab';
import FirewallTab from '../tabs/FirewallTab';

export default function SecurityRoutes(props) {
  return (
    <Routes>
      <Route
        index
        element={
          <AuditTrailTab
            logs={props.logs}
            filteredLogs={props.filteredLogs}
            severityFilter={props.severityFilter}
            setSeverityFilter={props.setSeverityFilter}
            auditSearch={props.auditSearch}
            setAuditSearch={props.setAuditSearch}
            setInspectEvent={props.setInspectEvent}
          />
        }
      />
      <Route
        path="audit"
        element={
          <AuditTrailTab
            logs={props.logs}
            filteredLogs={props.filteredLogs}
            severityFilter={props.severityFilter}
            setSeverityFilter={props.setSeverityFilter}
            auditSearch={props.auditSearch}
            setAuditSearch={props.setAuditSearch}
            setInspectEvent={props.setInspectEvent}
          />
        }
      />
      <Route
        path="staff"
        element={
          <StaffLoginsTab
            staffSubTab={props.staffSubTab}
            setStaffSubTab={props.setStaffSubTab}
            filteredUsers={props.filteredUsers}
            staffRecoveryRequests={props.staffRecoveryRequests}
            fetchPendingStaff={props.fetchPendingStaff}
            pendingStaffList={props.pendingStaffList}
            staffSearch={props.staffSearch}
            setStaffSearch={props.setStaffSearch}
            staffRoleFilter={props.staffRoleFilter}
            setStaffRoleFilter={props.setStaffRoleFilter}
            setIsAddStaffOpen={props.setIsAddStaffOpen}
            handleOpenEditStaff={props.handleOpenEditStaff}
            handleToggleUserLock={props.handleToggleUserLock}
            showToast={props.showToast}
            setStaffToDelete={props.setStaffToDelete}
            loadStaffRecovery={props.loadStaffRecovery}
            resolvingStaffReqId={props.resolvingStaffReqId}
            setResolvingStaffReqId={props.setResolvingStaffReqId}
            newStaffPassword={props.newStaffPassword}
            setNewStaffPassword={props.setNewStaffPassword}
            generate3TypeStaffPassword={props.generate3TypeStaffPassword}
            staffResolutionNotes={props.staffResolutionNotes}
            setStaffResolutionNotes={props.setStaffResolutionNotes}
            staffRecoveryLoading={props.staffRecoveryLoading}
            handleResolveStaffRecovery={props.handleResolveStaffRecovery}
            processingStaffId={props.processingStaffId}
            handleApproveOrRejectStaff={props.handleApproveOrRejectStaff}
          />
        }
      />
      <Route
        path="roles"
        element={
          <RoleMatrixTab
            roles={props.roles}
            rolesPermMap={props.rolesPermMap}
            toggleRolePermission={props.toggleRolePermission}
            handleResetToDefaults={props.handleResetToDefaults}
            handleSaveAllRolePermissions={props.handleSaveAllRolePermissions}
            savingPerms={props.savingPerms}
            permissionsGrouped={props.permissionsGrouped}
          />
        }
      />
      <Route
        path="devices"
        element={
          <DevicesTab
            strictDeviceMode={props.strictDeviceMode}
            setStrictDeviceMode={props.setStrictDeviceMode}
            showToast={props.showToast}
            devices={props.devices}
            handleToggleDeviceAuth={props.handleToggleDeviceAuth}
            handleDeleteDevice={props.handleDeleteDevice}
          />
        }
      />
      <Route
        path="firewall"
        element={
          <FirewallTab
            ipRules={props.ipRules}
            handleDeleteIpRule={props.handleDeleteIpRule}
          />
        }
      />
      <Route path="*" element={<Navigate to="/audit" replace />} />
    </Routes>
  );
}
