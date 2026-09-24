import React, { useState, useEffect } from 'react';
import API from '../services/api';

export default function DeveloperConsoleModal({ isOpen, onClose, onSwitchToUserMode, onDeveloperLogin }) {
  const [activeTab, setActiveTab] = useState('about'); // 'about' | 'updates' | 'licensing' | 'force_data' | 'maintenance'
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
  const [adminCreds, setAdminCreds] = useState({ name: 'Sheba Technology Super Admin', email: 'shebatechservices@gmail.com', phone: '01700000000', password: '123456', is_active: true });
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
    is_active: true
  });

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
        body: JSON.stringify(newUserForm)
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
        body: JSON.stringify(editingUser)
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
        body: JSON.stringify({ targetUserId: targetUser?.id || 1 })
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
        fetch(`${API}/dev/admin-recovery-requests`).catch(() => null)
      ]);
      if (adminRes && adminRes.ok) {
        const d = await adminRes.json();
        if (d.success && d.admin) {
          setAdminCreds({
            name: d.admin.name || '',
            email: d.admin.email || '',
            phone: d.admin.phone || '',
            password: d.admin.password_hash || '',
            is_active: d.admin.is_active !== false
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
        body: JSON.stringify(adminCreds)
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
          developerNotes: devNotes
        })
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
        fetch(`${API}/devices`).catch(() => null)
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

  const showMsg = (text, type = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: 'success' }), 4000);
  };

  // Remote Kick Device
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

  // Force Delete
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
          reason: forceReason
        })
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

  // Force Update
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
          reason: forceReason
        })
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

  // Run DB Vacuum Maintenance
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

  // Force Clean Inventory Stock
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
        body: JSON.stringify({ mode, reason: 'Developer Console Force Clean' })
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

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'monospace, sans-serif'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(56, 189, 248, 0.2)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, #0f172a 0%, #1e1b4b 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>🛠️</span>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em' }}>
                SUPER ADMIN & DEVELOPER CONSOLE
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Shortcut: <code style={{ color: '#38bdf8' }}>Ctrl + Shift + D</code> • System Administration & Force Overrides
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onSwitchToUserMode && (
              <button
                type="button"
                onClick={onSwitchToUserMode}
                title="Switch back to standard User Mode (Shortcut: Ctrl + Shift + D)"
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>👤</span>
                <span>Switch to User Mode</span>
              </button>
            )}
            {onDeveloperLogin && (
              <button
                type="button"
                onClick={() => onDeveloperLogin(adminCreds)}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                }}
              >
                <span>⚡</span>
                <span>Enter Dashboard as Super Admin</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#94a3b8',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '10px 24px',
            background: '#090d16',
            borderBottom: '1px solid #1e293b',
            overflowX: 'auto'
          }}
        >
          {[
            { id: 'about', label: 'ℹ️ About & Specs' },
            { id: 'users_manager', label: `👥 User & Staff Manager (${usersList.length})` },
            { 
              id: 'admin_auth', 
              label: `🔐 Admin Auth & Recovery ${adminRecoveryRequests.filter(r => r.status === 'pending').length > 0 ? `(${adminRecoveryRequests.filter(r => r.status === 'pending').length})` : ''}` 
            },
            { id: 'licensing', label: '🛡️ Domain, License & Devices' },
            { id: 'force_data', label: '⚡ Force Edit & Delete' },
            { id: 'updates', label: '🚀 Git & Updates' },
            { id: 'maintenance', label: '🧹 Maintenance' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab.id ? '#0284c7' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#94a3b8',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Toast */}
        {statusMsg.text && (
          <div
            style={{
              margin: '12px 24px 0',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: statusMsg.type === 'error' ? '#450a0a' : '#064e3b',
              color: statusMsg.type === 'error' ? '#fca5a5' : '#6ee7b7',
              border: `1px solid ${statusMsg.type === 'error' ? '#991b1b' : '#059669'}`
            }}
          >
            {statusMsg.text}
          </div>
        )}

        {/* Body Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, fontSize: '0.85rem' }}>
          {/* TAB 1: ABOUT & SPECS */}
          {activeTab === 'about' && (
            <div>
              <h4 style={{ margin: '0 0 14px 0', color: '#38bdf8', fontSize: '0.95rem' }}>
                System Architecture & Specifications
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>APPLICATION</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                    {systemInfo?.app?.name || 'Sheba ERP'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#38bdf8' }}>Version {systemInfo?.app?.version || '2.8.4-beta'}</div>
                </div>

                <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>NODE RUNTIME</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                    {systemInfo?.app?.nodeVersion || 'Node.js LTS'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#4ade80' }}>Heap: {systemInfo?.app?.memoryUsageMB || 14} MB</div>
                </div>

                <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>GIT BRANCH & COMMIT</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                    {systemInfo?.app?.gitBranch || 'main'} @ {systemInfo?.app?.gitCommit || 'HEAD'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#f59e0b' }}>Production Ready</div>
                </div>

                <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>DATABASE ENGINE</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>PostgreSQL 16</div>
                  <div style={{ fontSize: '0.74rem', color: '#a78bfa' }}>product_catalog @ localhost:5432</div>
                </div>
              </div>

              <h4 style={{ margin: '0 0 10px 0', color: '#38bdf8', fontSize: '0.9rem' }}>
                Database Live Record Counts
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '20px' }}>
                {systemInfo?.tableCounts &&
                  Object.entries(systemInfo.tableCounts).map(([tbl, count]) => (
                    <div
                      key={tbl}
                      style={{
                        background: '#090d16',
                        border: '1px solid #1e293b',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{tbl}</span>
                      <strong style={{ color: count > 0 ? '#38bdf8' : '#64748b' }}>{count}</strong>
                    </div>
                  ))}
              </div>

              {systemInfo?.app?.gitLog?.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#38bdf8', fontSize: '0.9rem' }}>
                    Recent Repository Commits
                  </h4>
                  <div style={{ background: '#090d16', borderRadius: '8px', padding: '12px', border: '1px solid #1e293b' }}>
                    {systemInfo.app.gitLog.map((log, idx) => (
                      <div key={idx} style={{ fontSize: '0.76rem', color: '#cbd5e1', marginBottom: '6px' }}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: USER & STAFF MANAGER */}
          {activeTab === 'users_manager' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Header Box */}
              <div style={{
                background: '#1e293b',
                padding: '18px 20px',
                borderRadius: '12px',
                border: '1px solid #334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>👥</span> User & Staff Data Manager
                  </h3>
                  <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.78rem' }}>
                    Developers can manually create, edit credentials, reset passwords, or delete users directly from the database.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={fetchUsersList}
                    disabled={loading || userActionLoading}
                    style={{
                      background: '#0f172a',
                      border: '1px solid #334155',
                      color: '#cbd5e1',
                      borderRadius: '8px',
                      padding: '7px 12px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '8px',
                      padding: '7px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 6px rgba(2, 132, 199, 0.4)'
                    }}
                  >
                    <span>➕</span>
                    <span>Add New User / Staff</span>
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div style={{
                background: '#1e293b',
                borderRadius: '12px',
                border: '1px solid #334155',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 16px' }}>ID</th>
                      <th style={{ padding: '12px 16px' }}>Name & Contact</th>
                      <th style={{ padding: '12px 16px' }}>Role</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px' }}>Last Active</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Developer Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                          No users found in database.
                        </td>
                      </tr>
                    ) : (
                      usersList.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #334155', color: '#e2e8f0' }}>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#38bdf8' }}>
                            #{u.id}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700, color: '#f8fafc' }}>{u.name}</div>
                            <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                              {u.email || 'No email'} {u.phone ? `• ${u.phone}` : ''}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              background: u.role_id === 1 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                              color: u.role_id === 1 ? '#facc15' : '#38bdf8',
                              border: `1px solid ${u.role_id === 1 ? 'rgba(234, 179, 8, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`
                            }}>
                              {u.role_name || (u.role_id === 1 ? 'Super Admin' : 'Staff')}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              <span style={{
                                padding: '2px 7px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: u.is_active ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: u.is_active ? '#4ade80' : '#f87171'
                              }}>
                                {u.is_active ? '● Active' : '○ Suspended'}
                              </span>
                              {u.is_locked && (
                                <span style={{
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  background: 'rgba(239, 68, 68, 0.25)',
                                  color: '#fca5a5'
                                }}>
                                  🔒 Locked
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '0.76rem', color: '#94a3b8' }}>
                            {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleBypassLogin(u)}
                                style={{
                                  background: '#065f46',
                                  border: '1px solid #10b981',
                                  color: '#ecfdf5',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                                title="Instant Login to system as this user"
                              >
                                ⚡ Login As
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingUser({ ...u, password: '' })}
                                style={{
                                  background: '#0369a1',
                                  border: '1px solid #38bdf8',
                                  color: '#f0f9ff',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                                title="Edit user details or reset password"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                disabled={u.role_id === 1 && usersList.filter(x => x.role_id === 1).length <= 1}
                                style={{
                                  background: (u.role_id === 1 && usersList.filter(x => x.role_id === 1).length <= 1) ? '#334155' : '#7f1d1d',
                                  border: `1px solid ${(u.role_id === 1 && usersList.filter(x => x.role_id === 1).length <= 1) ? '#475569' : '#ef4444'}`,
                                  color: '#fecaca',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  cursor: (u.role_id === 1 && usersList.filter(x => x.role_id === 1).length <= 1) ? 'not-allowed' : 'pointer'
                                }}
                                title="Permanently delete user"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add User Modal */}
              {showAddUserModal && (
                <div style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000002,
                  padding: '20px'
                }}>
                  <div style={{
                    background: '#1e293b',
                    border: '1px solid #38bdf8',
                    borderRadius: '14px',
                    padding: '24px',
                    width: '100%',
                    maxWidth: '460px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '1rem', fontWeight: 800 }}>
                        ➕ Add New User / Staff
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowAddUserModal(false)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={newUserForm.name}
                          onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                          placeholder="e.g. Shakil Ahmed"
                          required
                          style={{ width: '100%', padding: '8px 12px', background: '#090d16', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={newUserForm.email}
                          onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                          placeholder="e.g. shakil@shebatech.com"
                          style={{ width: '100%', padding: '8px 12px', background: '#090d16', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                          Mobile Number
                        </label>
                        <input
                          type="text"
                          value={newUserForm.phone}
                          onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                          placeholder="e.g. 017xxxxxxxx"
                          style={{ width: '100%', padding: '8px 12px', background: '#090d16', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <label style={{ fontSize: '0.76rem', color: '#cbd5e1', fontWeight: 600 }}>
                            Password *
                          </label>
                          <button
                            type="button"
                            onClick={() => setNewUserForm({ ...newUserForm, password: generate3TypePassword() })}
                            style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                          >
                            🎲 Generate
                          </button>
                        </div>
                        <input
                          type="text"
                          value={newUserForm.password}
                          onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                          placeholder="Password"
                          required
                          style={{ width: '100%', padding: '8px 12px', background: '#090d16', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                          Assigned Role
                        </label>
                        <select
                          value={newUserForm.role_id}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            const roleMap = { 1: 'Super Admin', 2: 'Sales Executive', 3: 'Accountant', 4: 'Technician', 5: 'Store Manager' };
                            setNewUserForm({ ...newUserForm, role_id: val, role_name: roleMap[val] || 'Staff' });
                          }}
                          style={{ width: '100%', padding: '8px 12px', background: '#090d16', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        >
                          <option value={1}>Super Admin (Full Access)</option>
                          <option value={2}>Sales Executive (POS & Billing)</option>
                          <option value={3}>Accountant (Accounts & Expenses)</option>
                          <option value={4}>Technician (Projects & Warranty)</option>
                          <option value={5}>Store Manager (Inventory & Purchases)</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <input
                          type="checkbox"
                          id="new-user-active"
                          checked={newUserForm.is_active}
                          onChange={(e) => setNewUserForm({ ...newUserForm, is_active: e.target.checked })}
                          style={{ accentColor: '#10b981' }}
                        />
                        <label htmlFor="new-user-active" style={{ fontSize: '0.78rem', color: '#cbd5e1', cursor: 'pointer' }}>
                          Account Active (User can log in immediately)
                        </label>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                        <button
                          type="button"
                          onClick={() => setShowAddUserModal(false)}
                          style={{ background: '#334155', border: 'none', color: '#e2e8f0', padding: '8px 16px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={userActionLoading}
                          style={{ background: '#10b981', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          {userActionLoading ? 'Saving...' : 'Save User'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Edit User Modal */}
              {editingUser && (
                <div style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000002,
                  padding: '20px'
                }}>
                  <div style={{
                    background: '#1e293b',
                    border: '1px solid #38bdf8',
                    borderRadius: '14px',
                    padding: '24px',
                    width: '100%',
                    maxWidth: '460px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '1rem', fontWeight: 800 }}>
                        ✏️ Edit User #{editingUser.id} ({editingUser.name})
                      </h4>
                      <button
                        type="button"
                        onClick={() => setEditingUser(null)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleSaveEditUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={editingUser.name || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                          required
                          style={{ width: '100%', padding: '8px 12px', background: '#090d16', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={editingUser.email || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', background: '#090d16', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                          Mobile Phone
                        </label>
                        <input
                          type="text"
                          value={editingUser.phone || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', background: '#090d16', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <label style={{ fontSize: '0.76rem', color: '#cbd5e1', fontWeight: 600 }}>
                            Reset Password (Optional)
                          </label>
                          <button
                            type="button"
                            onClick={() => setEditingUser({ ...editingUser, password: generate3TypePassword() })}
                            style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                          >
                            🎲 Generate
                          </button>
                        </div>
                        <input
                          type="text"
                          value={editingUser.password || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                          placeholder="Leave blank to keep current password"
                          style={{ width: '100%', padding: '8px 12px', background: '#090d16', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                          Assigned Role
                        </label>
                        <select
                          value={editingUser.role_id || 2}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            const roleMap = { 1: 'Super Admin', 2: 'Sales Executive', 3: 'Accountant', 4: 'Technician', 5: 'Store Manager' };
                            setEditingUser({ ...editingUser, role_id: val, role_name: roleMap[val] || 'Staff' });
                          }}
                          style={{ width: '100%', padding: '8px 12px', background: '#090d16', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        >
                          <option value={1}>Super Admin (Full Access)</option>
                          <option value={2}>Sales Executive (POS & Billing)</option>
                          <option value={3}>Accountant (Accounts & Expenses)</option>
                          <option value={4}>Technician (Projects & Warranty)</option>
                          <option value={5}>Store Manager (Inventory & Purchases)</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#cbd5e1', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={editingUser.is_active}
                            onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                            style={{ accentColor: '#10b981' }}
                          />
                          <span>Active Account</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#cbd5e1', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={!editingUser.is_locked}
                            onChange={(e) => setEditingUser({ ...editingUser, is_locked: !e.target.checked })}
                            style={{ accentColor: '#38bdf8' }}
                          />
                          <span>Unlocked (Can Log In)</span>
                        </label>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                        <button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          style={{ background: '#334155', border: 'none', color: '#e2e8f0', padding: '8px 16px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={userActionLoading}
                          style={{ background: '#0284c7', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          {userActionLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: APP ADMIN AUTH & RECOVERY */}
          {activeTab === 'admin_auth' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Box 1: App Admin Credentials */}
              <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🔐</span> App User Admin Credentials (Master Account)
                    </h3>
                    <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.78rem' }}>
                      Developer manages the first-time App Admin account. Saved dynamically to Cloud Database. Admin can log in using either Mobile or Email.
                    </p>
                  </div>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '0.74rem', 
                    fontWeight: 700,
                    background: adminCreds.is_active ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: adminCreds.is_active ? '#4ade80' : '#f87171',
                    border: `1px solid ${adminCreds.is_active ? '#22c55e' : '#ef4444'}`
                  }}>
                    {adminCreds.is_active ? '● Account Active' : '○ Account Suspended'}
                  </span>
                </div>

                <form onSubmit={handleSaveAdminCreds} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                      Admin Full Name
                    </label>
                    <input
                      type="text"
                      value={adminCreds.name}
                      onChange={(e) => setAdminCreds({ ...adminCreds, name: e.target.value })}
                      placeholder="e.g. Sheba Technology Admin"
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: '#090d16',
                        border: '1px solid #334155',
                        borderRadius: '7px',
                        color: '#f8fafc',
                        fontSize: '0.84rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                      Mobile Number (Login Identifier)
                    </label>
                    <input
                      type="text"
                      value={adminCreds.phone}
                      onChange={(e) => setAdminCreds({ ...adminCreds, phone: e.target.value })}
                      placeholder="e.g. 01700000000"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: '#090d16',
                        border: '1px solid #334155',
                        borderRadius: '7px',
                        color: '#f8fafc',
                        fontSize: '0.84rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                      Email Address (Login Identifier)
                    </label>
                    <input
                      type="email"
                      value={adminCreds.email}
                      onChange={(e) => setAdminCreds({ ...adminCreds, email: e.target.value })}
                      placeholder="e.g. shebatechservices@gmail.com"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: '#090d16',
                        border: '1px solid #334155',
                        borderRadius: '7px',
                        color: '#f8fafc',
                        fontSize: '0.84rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>
                        Admin Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setAdminCreds({ ...adminCreds, password: generate3TypePassword() })}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#38bdf8',
                          cursor: 'pointer',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          padding: 0,
                          textDecoration: 'underline'
                        }}
                      >
                        ⚡ Generate 3-Type
                      </button>
                    </div>
                    <input
                      type="text"
                      value={adminCreds.password}
                      onChange={(e) => setAdminCreds({ ...adminCreds, password: e.target.value })}
                      placeholder="Min 6 chars (Letters, Numbers, Symbols)"
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: '#090d16',
                        border: '1px solid #334155',
                        borderRadius: '7px',
                        color: '#fcd34d',
                        fontFamily: 'monospace',
                        fontSize: '0.86rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#cbd5e1' }}>
                      <input
                        type="checkbox"
                        checked={adminCreds.is_active}
                        onChange={(e) => setAdminCreds({ ...adminCreds, is_active: e.target.checked })}
                        style={{ accentColor: '#0284c7', width: '16px', height: '16px' }}
                      />
                      Permit App User Admin Login (Active Status)
                    </label>

                    <button
                      type="submit"
                      disabled={adminActionLoading}
                      style={{
                        padding: '9px 20px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: adminActionLoading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                      }}
                    >
                      {adminActionLoading ? 'Saving to Database...' : '💾 Save Admin Credentials to DB'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Box 2: Admin Password Recovery Requests */}
              <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📬</span> App Admin Recovery Notifications
                    </h3>
                    <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.78rem' }}>
                      Incoming reset requests sent by App User Admin when they forget login credentials.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchAdminData}
                    style={{
                      background: '#090d16',
                      border: '1px solid #334155',
                      color: '#94a3b8',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Refresh Requests
                  </button>
                </div>

                {adminRecoveryRequests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', background: '#090d16', borderRadius: '8px', border: '1px dashed #334155' }}>
                    <span style={{ fontSize: '1.8rem' }}>🛡️</span>
                    <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                      No password recovery requests received from App Admin. Everything is operating securely.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {adminRecoveryRequests.map((req) => (
                      <div
                        key={req.id}
                        style={{
                          background: '#090d16',
                          border: `1px solid ${req.status === 'pending' ? '#d97706' : '#334155'}`,
                          borderRadius: '8px',
                          padding: '14px 16px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ color: '#f8fafc', fontSize: '0.88rem' }}>{req.user_name || 'App Admin'}</strong>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: req.status === 'pending' ? '#78350f' : '#064e3b',
                                color: req.status === 'pending' ? '#fde68a' : '#6ee7b7'
                              }}>
                                {req.status === 'pending' ? 'Pending Action' : 'Resolved'}
                              </span>
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '3px' }}>
                              <span>Identifier: <code style={{ color: '#38bdf8' }}>{req.identifier}</code></span>
                              {req.contact_phone && <span> • Contact: <strong style={{ color: '#e2e8f0' }}>{req.contact_phone}</strong></span>}
                              {req.shop_name && <span> • Shop: <strong style={{ color: '#e2e8f0' }}>{req.shop_name}</strong></span>}
                            </div>
                          </div>
                          <div style={{ color: '#64748b', fontSize: '0.72rem' }}>
                            {new Date(req.created_at).toLocaleString()}
                          </div>
                        </div>

                        {req.reason && (
                          <div style={{ background: '#1e293b', padding: '8px 12px', borderRadius: '6px', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '10px' }}>
                            <span style={{ color: '#f59e0b', fontWeight: 600 }}>Message: </span>
                            {req.reason}
                          </div>
                        )}

                        {req.status === 'pending' ? (
                          resettingReqId === req.id ? (
                            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #0284c7', marginTop: '10px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <label style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>New Admin Password</label>
                                    <button
                                      type="button"
                                      onClick={() => setNewAdminPassword(generate3TypePassword())}
                                      style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.72rem', textDecoration: 'underline', padding: 0 }}
                                    >
                                      ⚡ Generate
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={newAdminPassword}
                                    onChange={(e) => setNewAdminPassword(e.target.value)}
                                    placeholder="Enter or generate new password"
                                    style={{
                                      width: '100%',
                                      padding: '7px 10px',
                                      background: '#090d16',
                                      border: '1px solid #334155',
                                      borderRadius: '6px',
                                      color: '#fcd34d',
                                      fontFamily: 'monospace',
                                      fontSize: '0.82rem',
                                      boxSizing: 'border-box'
                                    }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '4px' }}>Dev Resolution Notes</label>
                                  <input
                                    type="text"
                                    value={devNotes}
                                    onChange={(e) => setDevNotes(e.target.value)}
                                    placeholder="e.g. Identity verified via phone"
                                    style={{
                                      width: '100%',
                                      padding: '7px 10px',
                                      background: '#090d16',
                                      border: '1px solid #334155',
                                      borderRadius: '6px',
                                      color: '#f8fafc',
                                      fontSize: '0.82rem',
                                      boxSizing: 'border-box'
                                    }}
                                  />
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => { setResettingReqId(null); setNewAdminPassword(''); }}
                                  style={{
                                    padding: '6px 12px',
                                    background: '#334155',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: '#cbd5e1',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={adminActionLoading}
                                  onClick={() => handleResolveAdminRecovery(req.id)}
                                  style={{
                                    padding: '6px 14px',
                                    background: '#16a34a',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: '#ffffff',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    cursor: adminActionLoading ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  {adminActionLoading ? 'Resetting...' : '✓ Confirm & Reset Password'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setResettingReqId(req.id);
                                  setNewAdminPassword(generate3TypePassword());
                                }}
                                style={{
                                  padding: '6px 14px',
                                  background: '#d97706',
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: '#ffffff',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                🔑 Reset App Admin Password
                              </button>
                            </div>
                          )
                        ) : (
                          <div style={{ fontSize: '0.72rem', color: '#6ee7b7' }}>
                            ✓ Resolved by {req.resolved_by || 'Developer'} at {new Date(req.resolved_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DOMAIN, LICENSING & DEVICE SLOTS */}
          {activeTab === 'licensing' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div style={{ background: '#1e293b', padding: '16px', borderRadius: '10px', border: '1px solid #334155' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#38bdf8', fontSize: '0.9rem' }}>
                    Domain & SSL Licensing
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.8 }}>
                    <div>Domain: <strong style={{ color: '#ffffff' }}>{systemInfo?.licensing?.domain_name || 'shebatech.com.bd'}</strong></div>
                    <div>SSL Certificate: <strong style={{ color: '#4ade80' }}>{systemInfo?.licensing?.ssl_status || 'TLS 1.3 Active'}</strong></div>
                    <div>License Status: <strong style={{ color: '#f59e0b' }}>{systemInfo?.licensing?.license_status || 'Enterprise Activated'}</strong></div>
                    <div>Key: <code style={{ color: '#38bdf8' }}>{systemInfo?.licensing?.license_key || 'SHEBA-COMMERCIAL-UNLOCKED'}</code></div>
                  </div>
                </div>

                <div style={{ background: '#1e293b', padding: '16px', borderRadius: '10px', border: '1px solid #334155' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#38bdf8', fontSize: '0.9rem' }}>
                    Device Slots Allocation
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.8 }}>
                    <div>
                      💻 Desktops / Laptops:{' '}
                      <strong style={{ color: devicesData.counts?.desktop >= 3 ? '#ef4444' : '#4ade80' }}>
                        {devicesData.counts?.desktop || 0} / 3 Slots Used
                      </strong>
                    </div>
                    <div>
                      📱 Mobile Phones:{' '}
                      <strong style={{ color: devicesData.counts?.mobile >= 3 ? '#ef4444' : '#4ade80' }}>
                        {devicesData.counts?.mobile || 0} / 3 Slots Used
                      </strong>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '6px' }}>
                      Logged-in devices can be remotely terminated below to release slots for new devices.
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Desktops List */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '0.9rem' }}>
                    💻 Active Desktops / Laptops ({devicesData.desktops?.length || 0} / 3)
                  </h4>
                  <button
                    type="button"
                    onClick={fetchDevInfo}
                    style={{ background: 'transparent', border: '1px solid #334155', color: '#38bdf8', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', cursor: 'pointer' }}
                  >
                    Refresh
                  </button>
                </div>

                {devicesData.desktops?.length === 0 ? (
                  <div style={{ background: '#090d16', padding: '14px', borderRadius: '8px', color: '#64748b', textAlign: 'center' }}>
                    No active desktop sessions registered yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {devicesData.desktops?.map((d) => (
                      <div
                        key={d.device_id}
                        style={{
                          background: '#090d16',
                          border: '1px solid #1e293b',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: '#f8fafc' }}>💻 {d.device_name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            ID: {d.device_id.substring(0, 16)}... • IP: {d.ip_address} • Active: {new Date(d.last_active).toLocaleString()}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleKickDevice(d.device_id, d.device_name)}
                          style={{
                            background: '#7f1d1d',
                            border: '1px solid #dc2626',
                            color: '#ffffff',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Kick / Free Slot
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Mobiles List */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#38bdf8', fontSize: '0.9rem' }}>
                  📱 Active Mobile Phones ({devicesData.mobiles?.length || 0} / 3)
                </h4>

                {devicesData.mobiles?.length === 0 ? (
                  <div style={{ background: '#090d16', padding: '14px', borderRadius: '8px', color: '#64748b', textAlign: 'center' }}>
                    No active mobile sessions registered yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {devicesData.mobiles?.map((d) => (
                      <div
                        key={d.device_id}
                        style={{
                          background: '#090d16',
                          border: '1px solid #1e293b',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: '#f8fafc' }}>📱 {d.device_name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            ID: {d.device_id.substring(0, 16)}... • IP: {d.ip_address} • Active: {new Date(d.last_active).toLocaleString()}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleKickDevice(d.device_id, d.device_name)}
                          style={{
                            background: '#7f1d1d',
                            border: '1px solid #dc2626',
                            color: '#ffffff',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Kick / Free Slot
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FORCE USER DATA EDIT & DELETE (EMERGENCY OVERRIDE) */}
          {activeTab === 'force_data' && (
            <div>
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #dc2626',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: '#fca5a5',
                  fontSize: '0.8rem',
                  marginBottom: '20px',
                  lineHeight: 1.5
                }}
              >
                ⚠️ <strong>DEVELOPER EMERGENCY OVERRIDE CONSOLE</strong>: This tool bypasses the 24-hour delete window, 72-hour edit restriction, and relational lock-chains. Use with caution for system maintenance, corrupted data cleanup, or manual database intervention.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Target Database Table *
                  </label>
                  <select
                    value={forceTable}
                    onChange={(e) => setForceTable(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#1e293b',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '0.84rem'
                    }}
                  >
                    <option value="products">products (Product Catalog & Inventory)</option>
                    <option value="sales">sales (Sales Invoices)</option>
                    <option value="purchase_orders">purchase_orders (Purchase Orders)</option>
                    <option value="customers">customers (Customer Directory)</option>
                    <option value="suppliers">suppliers (Supplier Directory)</option>
                    <option value="categories">categories (Primary Categories)</option>
                    <option value="sub_categories">sub_categories (Sub-Categories)</option>
                    <option value="brands">brands (Brands)</option>
                    <option value="warranty_claims">warranty_claims (Warranty Claims)</option>
                    <option value="product_returns">product_returns (Product Returns)</option>
                    <option value="payment_accounts">payment_accounts (Wallets / Bank Accounts)</option>
                    <option value="expenses">expenses (Expense Entries)</option>
                    <option value="users">users (Staff & Technicians)</option>
                    <option value="service_projects">service_projects (Service Projects)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Record ID *
                  </label>
                  <input
                    type="number"
                    placeholder="Enter ID (e.g. 15)"
                    value={forceId}
                    onChange={(e) => setForceId(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#1e293b',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '0.84rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Reason for Emergency Action (Saved in Audit Log)
                </label>
                <input
                  type="text"
                  value={forceReason}
                  onChange={(e) => setForceReason(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                {/* Force Delete Action */}
                <div style={{ background: '#1e293b', borderRadius: '10px', padding: '16px', border: '1px solid #7f1d1d' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#f87171', fontSize: '0.9rem' }}>
                    🗑️ Option 1: Force Delete Record
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 14px 0' }}>
                    Immediately soft-deletes the record to Global Trash and archives it, bypassing lock-chains and time limits.
                  </p>
                  <button
                    type="button"
                    disabled={forceActionLoading}
                    onClick={handleForceDelete}
                    style={{
                      width: '100%',
                      padding: '9px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#dc2626',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: forceActionLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {forceActionLoading ? 'Executing...' : `Force Delete ${forceTable} #${forceId || '?'}`}
                  </button>
                </div>

                {/* Force Update Action */}
                <div style={{ background: '#1e293b', borderRadius: '10px', padding: '16px', border: '1px solid #0369a1' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#38bdf8', fontSize: '0.9rem' }}>
                    ✏️ Option 2: Force Direct Field Patch
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 8px 0' }}>
                    Provide JSON key-value pairs to directly patch columns:
                  </p>
                  <textarea
                    rows={4}
                    value={forceJsonFields}
                    onChange={(e) => setForceJsonFields(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#090d16',
                      border: '1px solid #334155',
                      color: '#38bdf8',
                      fontFamily: 'monospace',
                      fontSize: '0.78rem',
                      borderRadius: '6px',
                      padding: '8px',
                      boxSizing: 'border-box',
                      marginBottom: '10px'
                    }}
                  />
                  <button
                    type="button"
                    disabled={forceActionLoading}
                    onClick={handleForceUpdate}
                    style={{
                      width: '100%',
                      padding: '9px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#0284c7',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: forceActionLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {forceActionLoading ? 'Executing...' : `Apply Patch to ${forceTable} #${forceId || '?'}`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GIT & UPDATES */}
          {activeTab === 'updates' && (
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: '#38bdf8', fontSize: '0.95rem' }}>
                Application Repository & Version Updates
              </h4>
              <div style={{ background: '#1e293b', padding: '16px', borderRadius: '10px', border: '1px solid #334155', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                      Current Build: {systemInfo?.app?.version || '2.8.4-beta'} ({systemInfo?.app?.gitCommit || 'HEAD'})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#4ade80' }}>
                      Status: Production Ready • Up-to-date
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={fetchDevInfo}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: '1px solid #0284c7',
                      background: '#0369a1',
                      color: '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Check for Updates
                  </button>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>
                  Branch: <code style={{ color: '#38bdf8' }}>{systemInfo?.app?.gitBranch || 'main'}</code><br />
                  Repository Path: <code style={{ color: '#94a3b8' }}>/home/sheba/sheba-technology</code>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MAINTENANCE */}
          {activeTab === 'maintenance' && (
            <div>
              <h4 style={{ margin: '0 0 14px 0', color: '#38bdf8', fontSize: '0.95rem' }}>
                Database Health & Storage Maintenance
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ background: '#1e293b', padding: '16px', borderRadius: '10px', border: '1px solid #334155' }}>
                  <h5 style={{ margin: '0 0 6px 0', color: '#f8fafc', fontSize: '0.88rem' }}>
                    PostgreSQL VACUUM ANALYZE
                  </h5>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 14px 0' }}>
                    Cleans dead tuples, updates table statistics, and optimizes query execution plans.
                  </p>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleMaintenance}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#15803d',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Run VACUUM ANALYZE
                  </button>
                </div>

                <div style={{ background: '#1e293b', padding: '16px', borderRadius: '10px', border: '1px solid #334155' }}>
                  <h5 style={{ margin: '0 0 6px 0', color: '#f8fafc', fontSize: '0.88rem' }}>
                    Local Device ID Cache Reset
                  </h5>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 14px 0' }}>
                    Clears the stored local device ID token in this browser to simulate a fresh device.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('app_device_id');
                      alert('Local device token cleared! Page will reload.');
                      window.location.reload();
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: '1px solid #64748b',
                      background: '#334155',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Reset Local Device Token
                  </button>
                </div>

                {/* Force Clean Inventory Stock */}
                <div style={{ background: '#1e293b', padding: '16px', borderRadius: '10px', border: '1px solid #dc2626', gridColumn: 'span 2' }}>
                  <h5 style={{ margin: '0 0 6px 0', color: '#f87171', fontSize: '0.88rem' }}>
                    ⚡ Force Clean Inventory Stock (Emergency Stock Reset)
                  </h5>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 14px 0' }}>
                    Force resets warehouse inventory stock to 0 across all warehouses or wipes test product stocks and stock transfer records for a clean shop start.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleCleanInventoryStock('zero_stock')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#d97706',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      Reset All Stocks to 0
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleCleanInventoryStock('wipe_all')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#dc2626',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      Wipe Products & Stock (Clean Slate)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#090d16',
            fontSize: '0.74rem',
            color: '#64748b'
          }}
        >
          <div>
            Connected: <span style={{ color: '#4ade80' }}>● Live (Port 3000)</span> • Role: Super Admin / Developer
          </div>
          <div>
            Press <code style={{ color: '#38bdf8' }}>Ctrl + Shift + D</code> anytime to switch between Dev Mode & User Mode
          </div>
        </div>
      </div>
    </div>
  );
}
