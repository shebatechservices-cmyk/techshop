import { useState, useEffect } from 'react';
import API from '../../services/api';

export function useDeveloperConsoleManager({ isOpen, onClose, onDeveloperLogin }) {
  const [activeTab, setActiveTab] = useState('about');
  const [loading, setLoading] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);
  const [devicesData, setDevicesData] = useState({ desktops: [], mobiles: [], counts: { desktop: 0, mobile: 0 } });
  const [statusMsg, setStatusMsg] = useState({ text: '', type: 'success' });

  // Force Edit/Delete State
  const [forceTable, setForceTable] = useState('products');
  const [forceId, setForceId] = useState('');
  const [forceReason, setForceReason] = useState('Developer Emergency Fix');
  const [forceJsonFields, setForceJsonFields] = useState('{\n  "stock": 10\n}');
  const [forceActionLoading, setForceActionLoading] = useState(false);

  // App Admin Management & Recovery State
  const [adminCreds, setAdminCreds] = useState({
    name: 'Sheba Technology Super Admin',
    email: 'shebatechservices@gmail.com',
    phone: '01700000000',
    password: '123456',
    is_active: true,
  });
  const [adminRecoveryRequests, setAdminRecoveryRequests] = useState([]);
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [resettingReqId, setResettingReqId] = useState(null);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [devNotes, setDevNotes] = useState('Approved and verified by Developer Console');

  // Full User & Staff Management State
  const [usersList, setUsersList] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role_id: 2,
    role_name: 'Sales Executive',
    is_active: true,
  });

  const showMsg = (text, type = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: 'success' }), 4000);
  };

  const fetchUsersList = async () => {
    try {
      const res = await fetch(`${API}/dev/users`).catch(() => null);
      if (res && res.ok) {
        const d = await res.json();
        if (d.success) setUsersList(d.data || []);
      }
    } catch (e) {
      console.error('fetchUsersList error:', e);
    }
  };

  const handleCreateUser = async (e) => {
    if (e) e.preventDefault();
    if (!newUserForm.name || (!newUserForm.email && !newUserForm.phone) || !newUserForm.password) {
      showMsg('Name, Password, and at least one of Email/Phone are required!', 'error');
      return;
    }
    try {
      setUserActionLoading(true);
      const res = await fetch(`${API}/dev/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        showMsg(`✓ User "${d.user.name}" created successfully!`);
        setShowAddUserModal(false);
        setNewUserForm({ name: '', email: '', phone: '', password: '', role_id: 2, role_name: 'Sales Executive', is_active: true });
        fetchUsersList();
      } else {
        showMsg(d.message || 'Failed to create user', 'error');
      }
    } catch (err) {
      showMsg('Error creating user', 'error');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleSaveEditUser = async (e) => {
    if (e) e.preventDefault();
    if (!editingUser) return;
    try {
      setUserActionLoading(true);
      const res = await fetch(`${API}/dev/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        showMsg(`✓ User #${editingUser.id} (${editingUser.name}) updated successfully!`);
        setEditingUser(null);
        fetchUsersList();
      } else {
        showMsg(d.message || 'Failed to update user', 'error');
      }
    } catch (err) {
      showMsg('Error updating user', 'error');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleDeleteUser = async (uId, uName) => {
    if (!window.confirm(`⚠️ Permanently delete user #${uId} ("${uName}") from database? This action cannot be undone.`)) return;
    try {
      setUserActionLoading(true);
      const res = await fetch(`${API}/dev/users/${uId}`, { method: 'DELETE' });
      const d = await res.json();
      if (res.ok && d.success) {
        showMsg(`✓ User #${uId} ("${uName}") deleted successfully!`);
        fetchUsersList();
      } else {
        showMsg(d.message || 'Failed to delete user', 'error');
      }
    } catch (err) {
      showMsg('Error deleting user', 'error');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleBypassLogin = async (targetUser = null) => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/dev/bypass-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: targetUser?.id || 1 }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        localStorage.setItem('sheba_auth_user', JSON.stringify(d.user));
        localStorage.setItem('sheba_auth_token', d.token);
        showMsg(`⚡ Instant Bypass Login granted for ${d.user.name}! Entering system...`);
        setTimeout(() => {
          if (onDeveloperLogin) onDeveloperLogin(d.user);
          if (onClose) onClose();
        }, 300);
      } else {
        showMsg(d.message || 'Failed to generate bypass login', 'error');
      }
    } catch (err) {
      showMsg('Error initiating bypass login', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generate3TypePassword = () => {
    const prefixes = ['Sheba@', 'Admin#', 'Secure$', 'Tech!', 'Net*'];
    const randPre = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const suffix = '!';
    return `${randPre}${randNum}${suffix}`;
  };

  const fetchAdminData = async () => {
    try {
      const [adminRes, reqRes] = await Promise.all([
        fetch(`${API}/dev/admin-credentials`).catch(() => null),
        fetch(`${API}/dev/admin-recovery-requests`).catch(() => null),
      ]);
      if (adminRes && adminRes.ok) {
        const d = await adminRes.json();
        if (d.success && d.admin) {
          setAdminCreds({
            name: d.admin.name || '',
            email: d.admin.email || '',
            phone: d.admin.phone || '',
            password: d.admin.password_hash || '',
            is_active: d.admin.is_active !== false,
          });
        }
      }
      if (reqRes && reqRes.ok) {
        const d = await reqRes.json();
        if (d.success) setAdminRecoveryRequests(d.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAdminCreds = async (e) => {
    if (e) e.preventDefault();
    if (!adminCreds.name || (!adminCreds.email && !adminCreds.phone) || !adminCreds.password) {
      showMsg('Admin Name, Email/Phone, and Password are required!', 'error');
      return;
    }
    try {
      setAdminActionLoading(true);
      const res = await fetch(`${API}/dev/admin-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminCreds),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        showMsg('✓ App User Admin credentials saved & active in database!');
        fetchAdminData();
      } else {
        showMsg(d.message || 'Failed to save admin credentials', 'error');
      }
    } catch (err) {
      showMsg('Network error saving admin credentials', 'error');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleResolveAdminRecovery = async (requestId) => {
    if (!newAdminPassword) {
      showMsg('Please provide or generate a new password', 'error');
      return;
    }
    try {
      setAdminActionLoading(true);
      const res = await fetch(`${API}/dev/admin-recovery-resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          newPassword: newAdminPassword,
          developerNotes: devNotes,
        }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        showMsg('✓ Admin password reset successful!');
        setResettingReqId(null);
        setNewAdminPassword('');
        fetchAdminData();
      } else {
        showMsg(d.message || 'Failed to reset admin password', 'error');
      }
    } catch (err) {
      showMsg('Network error resolving admin recovery', 'error');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const fetchDevInfo = async () => {
    try {
      setLoading(true);
      const [infoRes, devRes] = await Promise.all([
        fetch(`${API}/dev/info`).catch(() => null),
        fetch(`${API}/devices`).catch(() => null),
      ]);

      if (infoRes && infoRes.ok) {
        const d = await infoRes.json();
        if (d.success) setSystemInfo(d);
      }
      if (devRes && devRes.ok) {
        const d = await devRes.json();
        if (d.success) setDevicesData(d);
      }
      await Promise.all([fetchAdminData(), fetchUsersList()]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDevInfo();
    }
  }, [isOpen]);

  const handleKickDevice = async (deviceId, name) => {
    if (!window.confirm(`Kick device "${name}" and free up its slot?`)) return;
    try {
      const res = await fetch(`${API}/devices/${deviceId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg(`Device "${name}" logged out! Slot is now free.`);
        fetchDevInfo();
      } else {
        showMsg(data.message || 'Failed to logout device', 'error');
      }
    } catch (err) {
      showMsg('Error logging out device', 'error');
    }
  };

  const handleForceDelete = async () => {
    if (!forceId) {
      alert('Please enter a Record ID');
      return;
    }
    if (!window.confirm(`⚠️ WARNING: Force delete record #${forceId} from "${forceTable}"? This bypasses standard lock chains and time-window restrictions.`)) return;

    try {
      setForceActionLoading(true);
      const res = await fetch(`${API}/dev/force-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_name: forceTable,
          record_id: Number(forceId),
          reason: forceReason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg(data.message, 'success');
        setForceId('');
        fetchDevInfo();
      } else {
        showMsg(data.message || 'Force delete failed', 'error');
      }
    } catch (err) {
      showMsg('Failed to execute force delete', 'error');
    } finally {
      setForceActionLoading(false);
    }
  };

  const handleForceUpdate = async () => {
    if (!forceId) {
      alert('Please enter a Record ID');
      return;
    }
    let parsedFields;
    try {
      parsedFields = JSON.parse(forceJsonFields);
    } catch (err) {
      alert('Invalid JSON format in updates field!');
      return;
    }

    if (!window.confirm(`⚠️ Confirm force direct patch on "${forceTable}" #${forceId}?`)) return;

    try {
      setForceActionLoading(true);
      const res = await fetch(`${API}/dev/force-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_name: forceTable,
          record_id: Number(forceId),
          fields: parsedFields,
          reason: forceReason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg(data.message, 'success');
        fetchDevInfo();
      } else {
        showMsg(data.message || 'Force update failed', 'error');
      }
    } catch (err) {
      showMsg('Failed to execute force update', 'error');
    } finally {
      setForceActionLoading(false);
    }
  };

  const handleMaintenance = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/dev/maintenance`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg(data.message, 'success');
      }
    } catch (err) {
      showMsg('Maintenance run failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanInventoryStock = async (mode) => {
    const confirmMsg = mode === 'wipe_all'
      ? '⚠️ WARNING: Are you sure you want to completely WIPE all test products and inventory stocks for a fresh launch?'
      : 'Are you sure you want to FORCE RESET all product inventory stock quantities to 0 across all warehouses?';
    if (!window.confirm(confirmMsg)) return;

    try {
      setLoading(true);
      const res = await fetch(`${API}/dev/clean-inventory-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, reason: 'Developer Console Force Clean' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg(data.message || 'Inventory stock force cleaned successfully!', 'success');
        fetchDevInfo();
        window.dispatchEvent(new CustomEvent('inventory_stock_changed'));
      } else {
        showMsg(data.message || 'Failed to clean inventory stock', 'error');
      }
    } catch (err) {
      console.error(err);
      showMsg('Network error connecting to dev server', 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    loading,
    systemInfo,
    devicesData,
    statusMsg,
    showMsg,
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
    fetchAdminData,
    handleSaveAdminCreds,
    handleResolveAdminRecovery,
    fetchDevInfo,
    handleKickDevice,
    handleForceDelete,
    handleForceUpdate,
    handleMaintenance,
    handleCleanInventoryStock,
  };
}
