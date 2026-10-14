import { useState, useEffect } from 'react';
import API, { getAuthHeaders } from '../../services/api';
import useDevUserOps from './devConsole/useDevUserOps';
import useDevAdminRecoveryOps from './devConsole/useDevAdminRecoveryOps';
import useDevTableOps from './devConsole/useDevTableOps';

export function useDeveloperConsoleManager({ isOpen, onClose, onDeveloperLogin }) {
  const [activeTab, setActiveTab] = useState('about');
  const [loading, setLoading] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);
  const [devicesData, setDevicesData] = useState({
    desktops: [],
    mobiles: [],
    counts: { desktop: 0, mobile: 0 },
  });
  const [statusMsg, setStatusMsg] = useState({ text: '', type: 'success' });

  const showMsg = (text, type = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: 'success' }), 4000);
  };

  // Sub-hooks
  const userOps = useDevUserOps({
    showMsg,
    onDeveloperLogin,
    onClose,
    setLoading,
  });

  const adminOps = useDevAdminRecoveryOps({
    showMsg,
  });

  const fetchDevInfo = async () => {
    try {
      setLoading(true);
      const authHeaders = getAuthHeaders();
      const [infoRes, devRes] = await Promise.all([
        fetch(`${API}/dev/info`, { headers: authHeaders }).catch(() => null),
        fetch(`${API}/devices`, { headers: authHeaders }).catch(() => null),
      ]);

      if (infoRes && infoRes.ok) {
        const d = await infoRes.json();
        if (d.success) setSystemInfo(d);
      }
      if (devRes && devRes.ok) {
        const d = await devRes.json();
        if (d.success) setDevicesData(d);
      }
      await Promise.all([adminOps.fetchAdminData(), userOps.fetchUsersList()]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const tableOps = useDevTableOps({
    showMsg,
    fetchDevInfo,
    setLoading,
  });

  useEffect(() => {
    if (isOpen) {
      fetchDevInfo();
    }
  }, [isOpen]);

  return {
    activeTab,
    setActiveTab,
    loading,
    systemInfo,
    devicesData,
    statusMsg,
    showMsg,
    fetchDevInfo,

    // Table ops
    forceTable: tableOps.forceTable,
    setForceTable: tableOps.setForceTable,
    forceId: tableOps.forceId,
    setForceId: tableOps.setForceId,
    forceReason: tableOps.forceReason,
    setForceReason: tableOps.setForceReason,
    forceJsonFields: tableOps.forceJsonFields,
    setForceJsonFields: tableOps.setForceJsonFields,
    forceActionLoading: tableOps.forceActionLoading,
    handleKickDevice: tableOps.handleKickDevice,
    handleForceDelete: tableOps.handleForceDelete,
    handleForceUpdate: tableOps.handleForceUpdate,
    handleMaintenance: tableOps.handleMaintenance,
    handleCleanInventoryStock: tableOps.handleCleanInventoryStock,

    // Admin & recovery ops
    adminCreds: adminOps.adminCreds,
    setAdminCreds: adminOps.setAdminCreds,
    adminRecoveryRequests: adminOps.adminRecoveryRequests,
    adminActionLoading: adminOps.adminActionLoading,
    resettingReqId: adminOps.resettingReqId,
    setResettingReqId: adminOps.setResettingReqId,
    newAdminPassword: adminOps.newAdminPassword,
    setNewAdminPassword: adminOps.setNewAdminPassword,
    devNotes: adminOps.devNotes,
    setDevNotes: adminOps.setDevNotes,
    fetchAdminData: adminOps.fetchAdminData,
    handleSaveAdminCreds: adminOps.handleSaveAdminCreds,
    handleResolveAdminRecovery: adminOps.handleResolveAdminRecovery,

    // User ops
    usersList: userOps.usersList,
    showAddUserModal: userOps.showAddUserModal,
    setShowAddUserModal: userOps.setShowAddUserModal,
    editingUser: userOps.editingUser,
    setEditingUser: userOps.setEditingUser,
    userActionLoading: userOps.userActionLoading,
    newUserForm: userOps.newUserForm,
    setNewUserForm: userOps.setNewUserForm,
    fetchUsersList: userOps.fetchUsersList,
    handleCreateUser: userOps.handleCreateUser,
    handleSaveEditUser: userOps.handleSaveEditUser,
    handleDeleteUser: userOps.handleDeleteUser,
    handleBypassLogin: userOps.handleBypassLogin,
    generate3TypePassword: userOps.generate3TypePassword,
  };
}
