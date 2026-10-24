import React from 'react';
import DevAboutTab from '../../shared/dev/DevAboutTab';
import DevUsersTab from '../../shared/dev/DevUsersTab';
import DevSecurityTab from '../../shared/dev/DevSecurityTab';
import DevAdminAuthTab from '../../shared/dev/DevAdminAuthTab';
import DevLicensingTab from '../../shared/dev/DevLicensingTab';
import DevForceDataTab from '../../shared/dev/DevForceDataTab';
import DevUpdatesTab from '../../shared/dev/DevUpdatesTab';
import DevMaintenanceTab from '../../shared/dev/DevMaintenanceTab';

export default function DevModalTabBody({ manager, onClose }) {
  const {
    activeTab,
    loading,
    systemInfo,
    devicesData,
    forceTable,
    setForceTable,
    forceId,
    setForceId,
    forceReason,
    setForceReason,
    forceJsonFields,
    setForceJsonFields,
    forceActionLoading,
    adminCreds,
    setAdminCreds,
    adminRecoveryRequests,
    adminActionLoading,
    resettingReqId,
    setResettingReqId,
    newAdminPassword,
    setNewAdminPassword,
    devNotes,
    setDevNotes,
    usersList,
    showAddUserModal,
    setShowAddUserModal,
    editingUser,
    setEditingUser,
    userActionLoading,
    newUserForm,
    setNewUserForm,
    fetchUsersList,
    handleCreateUser,
    handleSaveEditUser,
    handleDeleteUser,
    handleBypassLogin,
    generate3TypePassword,
    handleSaveAdminCreds,
    handleResolveAdminRecovery,
    handleKickDevice,
    handleForceDelete,
    handleForceUpdate,
    handleMaintenance,
    handleCleanInventoryStock,
  } = manager;

  return (
    <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-slate-950/60">
      {activeTab === 'about' && (
        <DevAboutTab
          systemInfo={systemInfo}
          devicesData={devicesData}
          handleBypassLogin={handleBypassLogin}
          loading={loading}
          handleKickDevice={handleKickDevice}
        />
      )}

      {activeTab === 'users_manager' && (
        <DevUsersTab
          usersList={usersList}
          fetchUsersList={fetchUsersList}
          showAddUserModal={showAddUserModal}
          setShowAddUserModal={setShowAddUserModal}
          editingUser={editingUser}
          setEditingUser={setEditingUser}
          userActionLoading={userActionLoading}
          newUserForm={newUserForm}
          setNewUserForm={setNewUserForm}
          handleCreateUser={handleCreateUser}
          handleSaveEditUser={handleSaveEditUser}
          handleDeleteUser={handleDeleteUser}
          handleBypassLogin={handleBypassLogin}
        />
      )}

      {activeTab === 'security' && (
        <DevSecurityTab onClose={onClose} />
      )}

      {activeTab === 'admin_auth' && (
        <DevAdminAuthTab
          adminCreds={adminCreds}
          setAdminCreds={setAdminCreds}
          adminRecoveryRequests={adminRecoveryRequests}
          adminActionLoading={adminActionLoading}
          resettingReqId={resettingReqId}
          setResettingReqId={setResettingReqId}
          newAdminPassword={newAdminPassword}
          setNewAdminPassword={setNewAdminPassword}
          devNotes={devNotes}
          setDevNotes={setDevNotes}
          handleSaveAdminCreds={handleSaveAdminCreds}
          handleResolveAdminRecovery={handleResolveAdminRecovery}
          generate3TypePassword={generate3TypePassword}
        />
      )}

      {activeTab === 'licensing' && (
        <DevLicensingTab
          systemInfo={systemInfo}
          loading={loading}
          handleMaintenance={handleMaintenance}
        />
      )}

      {activeTab === 'force_data' && (
        <DevForceDataTab
          forceTable={forceTable}
          setForceTable={setForceTable}
          forceId={forceId}
          setForceId={setForceId}
          forceReason={forceReason}
          setForceReason={setForceReason}
          forceJsonFields={forceJsonFields}
          setForceJsonFields={setForceJsonFields}
          forceActionLoading={forceActionLoading}
          handleForceDelete={handleForceDelete}
          handleForceUpdate={handleForceUpdate}
        />
      )}

      {activeTab === 'updates' && (
        <DevUpdatesTab
          systemInfo={systemInfo}
          loading={loading}
          handleMaintenance={handleMaintenance}
        />
      )}

      {activeTab === 'maintenance' && (
        <DevMaintenanceTab
          loading={loading}
          handleMaintenance={handleMaintenance}
          handleCleanInventoryStock={handleCleanInventoryStock}
        />
      )}
    </div>
  );
}
