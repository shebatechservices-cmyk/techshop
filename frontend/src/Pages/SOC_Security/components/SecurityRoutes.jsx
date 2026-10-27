import React from 'react';
import AuditTrailTab from '../tabs/AuditTrailTab';
import StaffLoginsTab from '../tabs/StaffLoginsTab';
import RoleMatrixTab from '../tabs/RoleMatrixTab';
import DevicesTab from '../tabs/DevicesTab';
import FirewallTab from '../tabs/FirewallTab';

export default function SecurityRoutes(props) {
  const currentTab = props.currentTab || 'audit';

  return (
    <div className="transition-opacity duration-150">
      {currentTab === 'audit' && (
        <AuditTrailTab
          logs={props.logs}
          filteredLogs={props.filteredLogs}
          severityFilter={props.severityFilter}
          setSeverityFilter={props.setSeverityFilter}
          auditSearch={props.auditSearch}
          setAuditSearch={props.setAuditSearch}
          setInspectEvent={props.setInspectEvent}
        />
      )}

      {currentTab === 'staff' && (
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
      )}

      {currentTab === 'roles' && (
        <RoleMatrixTab
          roles={props.roles}
          rolesPermMap={props.rolesPermMap}
          toggleRolePermission={props.toggleRolePermission}
          handleResetToDefaults={props.handleResetToDefaults}
          handleSaveAllRolePermissions={props.handleSaveAllRolePermissions}
          savingPerms={props.savingPerms}
          permissionsGrouped={props.permissionsGrouped}
        />
      )}

      {currentTab === 'devices' && (
        <DevicesTab
          strictDeviceMode={props.strictDeviceMode}
          setStrictDeviceMode={props.setStrictDeviceMode}
          showToast={props.showToast}
          devices={props.devices}
          handleToggleDeviceAuth={props.handleToggleDeviceAuth}
          handleDeleteDevice={props.handleDeleteDevice}
        />
      )}

      {currentTab === 'firewall' && (
        <FirewallTab
          ipRules={props.ipRules}
          handleDeleteIpRule={props.handleDeleteIpRule}
        />
      )}
    </div>
  );
}
