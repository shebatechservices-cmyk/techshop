import React, { useEffect } from 'react';
import { useDeveloperConsoleManager } from '../hooks/useDeveloperConsoleManager';
import DevAboutTab from '../shared/dev/DevAboutTab';
import DevUsersTab from '../shared/dev/DevUsersTab';
import DevAdminAuthTab from '../shared/dev/DevAdminAuthTab';
import DevLicensingTab from '../shared/dev/DevLicensingTab';
import DevForceDataTab from '../shared/dev/DevForceDataTab';
import DevUpdatesTab from '../shared/dev/DevUpdatesTab';
import DevMaintenanceTab from '../shared/dev/DevMaintenanceTab';

export default function DeveloperConsoleModal({ isOpen, onClose, onSwitchToUserMode, onDeveloperLogin }) {
  const manager = useDeveloperConsoleManager({ isOpen, onClose, onDeveloperLogin });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const {
    activeTab,
    setActiveTab,
    loading,
    systemInfo,
    devicesData,
    statusMsg,
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
    fetchDevInfo,
    handleKickDevice,
    handleForceDelete,
    handleForceUpdate,
    handleMaintenance,
    handleCleanInventoryStock,
  } = manager;

  return (
    <div
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[999999] flex items-center justify-center p-4 font-mono"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="bg-slate-900 text-slate-100 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-5 px-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">🛠️</span>
            <div>
              <div className="text-base font-extrabold text-sky-400 tracking-wider">
                SUPER ADMIN & DEVELOPER CONSOLE
              </div>
              <div className="text-xs text-slate-400">
                Shortcut: <code className="text-sky-300">Ctrl + Shift + D</code> • System Administration & Force Overrides
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onSwitchToUserMode && (
              <button
                type="button"
                onClick={onSwitchToUserMode}
                className="bg-rose-500/10 border border-rose-500/40 text-rose-300 hover:bg-rose-500/20 rounded-xl py-1.5 px-3 text-xs font-bold transition-colors flex items-center gap-1.5"
                title="Switch back to standard User Mode"
              >
                <span>👤</span>
                <span>User Mode</span>
              </button>
            )}
            {onDeveloperLogin && (
              <button
                type="button"
                onClick={() => onDeveloperLogin(adminCreds)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-1.5 px-3.5 text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
              >
                <span>⚡</span>
                <span>Enter Super Admin</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl py-1.5 px-3 text-xs border border-slate-700 transition-colors"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Status Toast Banner */}
        {statusMsg.text && (
          <div
            className={`p-3 text-xs font-bold text-center border-b ${
              statusMsg.type === 'error'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex bg-slate-950 border-b border-slate-800 px-4 overflow-x-auto">
          {[
            { id: 'about', label: '🖥️ System & Terminals' },
            { id: 'users_manager', label: `👥 Users & Staff (${usersList.length})` },
            { id: 'admin_auth', label: '🔐 Admin Credentials & Recovery' },
            { id: 'licensing', label: '📜 Licenses & Device Slots' },
            { id: 'force_data', label: '⚠️ Force DB Overrides' },
            { id: 'updates', label: '🔄 Updates & Version' },
            { id: 'maintenance', label: '🧹 Maintenance & Tools' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3.5 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-sky-500 text-sky-400 bg-sky-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Console Body */}
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
              devicesData={devicesData}
              fetchDevInfo={fetchDevInfo}
              handleKickDevice={handleKickDevice}
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
              fetchDevInfo={fetchDevInfo}
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

        {/* Footer */}
        <div className="p-3 px-6 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
          <div>Logged in host: 127.0.0.1 (Local Environment)</div>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 transition-colors"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
}
