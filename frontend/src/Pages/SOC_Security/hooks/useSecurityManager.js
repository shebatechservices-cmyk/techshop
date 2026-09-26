import { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../../../services/api';
import { isValidBDPhone } from '../../../utils/phoneUtils';
import {
  DEFAULT_MODULES,
  DEFAULT_ROLES,
  DEFAULT_USERS,
  DEFAULT_DEVICES,
  DEFAULT_IP_RULES,
  DEFAULT_LOGS,
} from '../utils/securityConstants';

export function useSecurityManager() {
  const [overview, setOverview] = useState({
    healthScore: 96,
    totalUsers: 6,
    activeUsers: 6,
    lockedUsers: 0,
    technicians: 2,
    totalDevices: 4,
    authorizedDevices: 4,
    totalBlockedAttempts: 161,
    recentCriticals: 2,
    ipRulesCount: 4,
    perimeterStatus: 'ACTIVE_SHIELD',
  });

  const [logs, setLogs] = useState(DEFAULT_LOGS);
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [permissionsGrouped, setPermissionsGrouped] = useState(DEFAULT_MODULES);
  const [devices, setDevices] = useState(DEFAULT_DEVICES);
  const [ipRules, setIpRules] = useState(DEFAULT_IP_RULES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Tab 1: Audit logs filters
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');
  const [inspectEvent, setInspectEvent] = useState(null);

  // Tab 2: Staff search & filter
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('all');
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffSubTab, setStaffSubTab] = useState('accounts'); // 'accounts' | 'recovery' | 'approvals'
  const [staffRecoveryRequests, setStaffRecoveryRequests] = useState([]);
  const [resolvingStaffReqId, setResolvingStaffReqId] = useState(null);
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [staffResolutionNotes, setStaffResolutionNotes] = useState('Reset by App Admin');
  const [staffRecoveryLoading, setStaffRecoveryLoading] = useState(false);

  // Staff Self-Registration Approval State
  const [pendingStaffList, setPendingStaffList] = useState([]);
  const [loadingPendingStaff, setLoadingPendingStaff] = useState(false);
  const [processingStaffId, setProcessingStaffId] = useState(null);

  const [newStaff, setNewStaff] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role_name: 'Field Technician',
    role_id: 4,
    device_id: '',
    allowed_ip: 'Any IP',
    opening_wallet_balance: '',
  });

  // Tab 3: Role & Permission Matrix
  const [selectedRoleId, setSelectedRoleId] = useState(1);
  const [activeRolePerms, setActiveRolePerms] = useState(DEFAULT_ROLES[0].permissions);
  const [savingPerms, setSavingPerms] = useState(false);

  // Tab 4: Devices & Hardware fleet
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [strictDeviceMode, setStrictDeviceMode] = useState(true);
  const [newDevice, setNewDevice] = useState({
    device_id: '',
    device_name: '',
    device_type: 'desktop',
    user_id: '',
  });

  // Tab 5: IP Firewall
  const [isAddIpOpen, setIsAddIpOpen] = useState(false);
  const [newIpRule, setNewIpRule] = useState({
    ip_address: '',
    rule_type: 'block',
    reason: '',
  });

  // Edit & Delete Staff / Technician states
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);

  const showToast = useCallback((msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  }, []);

  const fetchPendingStaff = useCallback(async () => {
    try {
      setLoadingPendingStaff(true);
      const res = await fetch(`${API}/security/pending-staff`);
      if (res && res.ok) {
        const d = await res.json();
        if (d && d.success) setPendingStaffList(d.data || []);
      }
    } catch (err) {
      console.error('Error loading pending staff:', err);
    } finally {
      setLoadingPendingStaff(false);
    }
  }, []);

  const loadStaffRecovery = useCallback(async () => {
    try {
      const res = await fetch(`${API}/security/recovery-requests`);
      if (res && res.ok) {
        const d = await res.json();
        if (d.success) setStaffRecoveryRequests(d.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [
        overviewRes,
        logsRes,
        usersRes,
        rolesRes,
        permsRes,
        devicesRes,
        ipRes,
        recoveryRes,
        pendingStaffRes,
      ] = await Promise.all([
        fetch(`${API}/security/overview`).catch(() => null),
        fetch(`${API}/security/logs`).catch(() => null),
        fetch(`${API}/security/users`).catch(() => null),
        fetch(`${API}/roles`).catch(() => null),
        fetch(`${API}/roles/permissions`).catch(() => null),
        fetch(`${API}/security/devices`).catch(() => null),
        fetch(`${API}/security/ip-rules`).catch(() => null),
        fetch(`${API}/security/recovery-requests`).catch(() => null),
        fetch(`${API}/security/pending-staff`).catch(() => null),
      ]);

      if (overviewRes && overviewRes.ok) {
        const d = await overviewRes.json();
        if (d.data) setOverview(d.data);
      }
      if (logsRes && logsRes.ok) {
        const d = await logsRes.json();
        if (d.data && d.data.length > 0) setLogs(d.data);
      }
      if (usersRes && usersRes.ok) {
        const d = await usersRes.json();
        if (d.data && d.data.length > 0) setUsers(d.data);
      }
      if (rolesRes && rolesRes.ok) {
        const d = await rolesRes.json();
        const rList = d.data || [];
        if (rList.length > 0) {
          setRoles(rList);
          setSelectedRoleId((prev) => {
            if (!prev) {
              setActiveRolePerms(rList[0].permissions || rList[0].permission_codes || []);
              return rList[0].id;
            }
            return prev;
          });
        }
      }
      if (permsRes && permsRes.ok) {
        const d = await permsRes.json();
        if (d.data && d.data.length > 0) setPermissionsGrouped(d.data);
      }
      if (devicesRes && devicesRes.ok) {
        const d = await devicesRes.json();
        if (d.data && d.data.length > 0) setDevices(d.data);
      }
      if (ipRes && ipRes.ok) {
        const d = await ipRes.json();
        if (d.data && d.data.length > 0) setIpRules(d.data);
      }
      if (recoveryRes && recoveryRes.ok) {
        const d = await recoveryRes.json();
        if (d.success) setStaffRecoveryRequests(d.data || []);
      }
      if (pendingStaffRes && pendingStaffRes.ok) {
        const d = await pendingStaffRes.json();
        if (d.success) setPendingStaffList(d.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Update selected role perms when role changes
  useEffect(() => {
    const curRole = roles.find((r) => r.id === Number(selectedRoleId));
    if (curRole) {
      const perms = curRole.permissions || curRole.permission_codes || [];
      setActiveRolePerms(Array.isArray(perms) ? perms : []);
    }
  }, [selectedRoleId, roles]);

  const handleApproveOrRejectStaff = async (userId, action) => {
    try {
      setProcessingStaffId(userId);
      const res = await fetch(`${API}/security/approve-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      const d = await res.json();
      if (res && res.ok && d.success) {
        showToast(d.message);
        fetchPendingStaff();
        loadAllData();
      } else {
        showToast((d && d.message) || 'Action failed');
      }
    } catch (err) {
      showToast('Network error processing staff approval');
    } finally {
      setProcessingStaffId(null);
    }
  };

  const generate3TypeStaffPassword = () => {
    const prefixes = ['Staff@', 'User#', 'Secure$', 'Tech!', 'Key*'];
    const randPre = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const suffix = '!';
    return `${randPre}${randNum}${suffix}`;
  };

  const handleResolveStaffRecovery = async (requestId) => {
    if (!newStaffPassword) {
      showToast('Please enter or generate a new password!');
      return;
    }
    try {
      setStaffRecoveryLoading(true);
      const res = await fetch(`${API}/security/recovery-resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          newPassword: newStaffPassword,
          adminNotes: staffResolutionNotes,
        }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        showToast(`✓ Staff password reset to: ${newStaffPassword}`);
        setResolvingStaffReqId(null);
        setNewStaffPassword('');
        loadStaffRecovery();
        loadAllData();
      } else {
        showToast(d.message || 'Failed to reset staff password');
      }
    } catch (err) {
      showToast('Network error resetting staff password');
    } finally {
      setStaffRecoveryLoading(false);
    }
  };

  // Handle Permission Checkbox Toggle
  const togglePermission = (permCode) => {
    setActiveRolePerms((prev) =>
      prev.includes(permCode) ? prev.filter((c) => c !== permCode) : [...prev, permCode]
    );
  };

  // Save Role Permissions
  const handleSaveRolePermissions = async () => {
    try {
      setSavingPerms(true);
      setError('');
      // Optimistic update
      setRoles((prev) =>
        prev.map((r) =>
          r.id === Number(selectedRoleId)
            ? { ...r, permissions: activeRolePerms, permission_codes: activeRolePerms }
            : r
        )
      );
      showToast('Role permissions updated and fortified successfully!');
      const res = await fetch(`${API}/roles/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_id: selectedRoleId,
          permission_codes: activeRolePerms,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.message || 'Failed to sync permissions with database.');
      }
    } catch (err) {
      setError(err.message || 'Error saving permissions.');
    } finally {
      setSavingPerms(false);
    }
  };

  // Staff Account Lock/Unlock Toggle
  const handleToggleUserLock = async (user) => {
    try {
      const newLocked = !user.is_locked;
      // Optimistic update
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, is_locked: newLocked, failed_login_count: newLocked ? u.failed_login_count : 0 }
            : u
        )
      );
      showToast(`User ${user.name} is now ${newLocked ? '🔒 LOCKED' : '🔓 UNLOCKED'}`);
      await fetch(`${API}/security/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_locked: newLocked }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Create Staff / Technician
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (newStaff.phone && !isValidBDPhone(newStaff.phone)) {
      showToast('Please enter a valid 10-digit phone number after +880 (e.g. 17-XXXXXXXX)');
      return;
    }
    try {
      const optimisticId = Date.now();
      const createdUser = {
        id: optimisticId,
        ...newStaff,
        is_locked: false,
        failed_login_count: 0,
      };
      setUsers((prev) => [createdUser, ...prev]);
      showToast(`Staff / Technician ${newStaff.name} registered successfully!`);
      setIsAddStaffOpen(false);
      const payload = { ...newStaff };
      setNewStaff({
        name: '',
        phone: '',
        email: '',
        password: '',
        role_name: 'Field Technician',
        role_id: 4,
        device_id: '',
        allowed_ip: 'Any IP',
        opening_wallet_balance: '',
      });

      await fetch(`${API}/security/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Staff / Technician
  const handleOpenEditStaff = (u) => {
    setEditingStaff({
      id: u.id,
      name: u.name || '',
      phone: u.phone || '',
      email: u.email || '',
      password: '',
      role_name: u.role_name || 'Field Technician',
      role_id: u.role_id || 4,
      device_id: u.device_id || '',
      allowed_ip: u.allowed_ip || 'Any IP',
    });
  };

  const handleUpdateStaffSubmit = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    if (editingStaff.phone && !isValidBDPhone(editingStaff.phone)) {
      showToast('Please enter a valid 10-digit phone number after +880 (e.g. 17-XXXXXXXX)');
      return;
    }
    try {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingStaff.id ? { ...u, ...editingStaff } : u))
      );
      showToast(`Staff member ${editingStaff.name} updated successfully!`);
      const payload = { ...editingStaff };
      const staffId = editingStaff.id;
      setEditingStaff(null);

      await fetch(`${API}/security/users/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Staff / Technician
  const handleConfirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    try {
      const u = staffToDelete;
      setUsers((prev) => prev.filter((item) => item.id !== u.id));
      showToast(`Staff member "${u.name}" moved to Trash.`);
      setStaffToDelete(null);

      await fetch(`${API}/security/users/${u.id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  // Device Authorize / Revoke
  const handleToggleDeviceAuth = async (device) => {
    try {
      const newAuth = !device.is_authorized;
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, is_authorized: newAuth } : d))
      );
      showToast(`Device ${device.device_name} is now ${newAuth ? '✓ AUTHORIZED' : '🚫 REVOKED'}`);
      await fetch(`${API}/security/devices/${device.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_authorized: newAuth }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete / Deregister Device
  const handleDeleteDevice = async (id) => {
    if (!window.confirm('Deregister and remove this device from hardware fleet?')) return;
    setDevices((prev) => prev.filter((d) => d.id !== id));
    showToast('Device deregistered from fleet.');
    try {
      await fetch(`${API}/security/devices/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  // Create Device
  const handleCreateDevice = async (e) => {
    e.preventDefault();
    try {
      const createdDev = {
        id: Date.now(),
        ...newDevice,
        browser_info: 'Manual Entry Terminal',
        is_authorized: true,
        last_active: 'Just now',
      };
      setDevices((prev) => [createdDev, ...prev]);
      showToast(`Device ${newDevice.device_name} registered and authorized!`);
      setIsAddDeviceOpen(false);
      const payload = { ...newDevice };
      setNewDevice({ device_id: '', device_name: '', device_type: 'desktop', user_id: '' });

      await fetch(`${API}/security/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Create IP Rule
  const handleCreateIpRule = async (e) => {
    e.preventDefault();
    try {
      const createdRule = {
        id: Date.now(),
        ...newIpRule,
        blocked_attempts: 0,
      };
      setIpRules((prev) => [createdRule, ...prev]);
      showToast(`IP rule for ${newIpRule.ip_address} added to ${newIpRule.rule_type.toUpperCase()}!`);
      setIsAddIpOpen(false);
      const payload = { ...newIpRule };
      setNewIpRule({ ip_address: '', rule_type: 'block', reason: '' });

      await fetch(`${API}/security/ip-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete IP Rule
  const handleDeleteIpRule = async (id) => {
    if (!window.confirm('Delete this firewall rule?')) return;
    setIpRules((prev) => prev.filter((r) => r.id !== id));
    showToast('Firewall rule deleted.');
    try {
      await fetch(`${API}/security/ip-rules/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const sev = (log.severity || 'INFO').toUpperCase();
      if (severityFilter !== 'ALL' && sev !== severityFilter) return false;

      if (auditSearch.trim()) {
        const q = auditSearch.toLowerCase();
        const matchAct = String(log.action || '').toLowerCase().includes(q);
        const matchIp = String(log.ip_address || '').toLowerCase().includes(q);
        const matchTbl = String(log.target_table || '').toLowerCase().includes(q);
        const matchDev = String(log.device_id || '').toLowerCase().includes(q);
        const matchUser = String(log.user_name || '').toLowerCase().includes(q);
        if (!matchAct && !matchIp && !matchTbl && !matchDev && !matchUser) return false;
      }
      return true;
    });
  }, [logs, severityFilter, auditSearch]);

  // Filtered Staff
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (staffRoleFilter !== 'all') {
        if ((u.role_name || '').toLowerCase() !== staffRoleFilter.toLowerCase()) return false;
      }
      if (staffSearch.trim()) {
        const q = staffSearch.toLowerCase();
        const matchName = String(u.name || '').toLowerCase().includes(q);
        const matchPhone = String(u.phone || '').toLowerCase().includes(q);
        const matchDev = String(u.device_id || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchDev) return false;
      }
      return true;
    });
  }, [users, staffRoleFilter, staffSearch]);

  return {
    overview,
    setOverview,
    logs,
    setLogs,
    users,
    setUsers,
    roles,
    setRoles,
    permissionsGrouped,
    setPermissionsGrouped,
    devices,
    setDevices,
    ipRules,
    setIpRules,
    loading,
    setLoading,
    error,
    setError,
    successMsg,
    setSuccessMsg,
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
    setStaffRecoveryRequests,
    resolvingStaffReqId,
    setResolvingStaffReqId,
    newStaffPassword,
    setNewStaffPassword,
    staffResolutionNotes,
    setStaffResolutionNotes,
    staffRecoveryLoading,
    setStaffRecoveryLoading,
    pendingStaffList,
    setPendingStaffList,
    loadingPendingStaff,
    setLoadingPendingStaff,
    processingStaffId,
    setProcessingStaffId,
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
    setActiveRolePerms,
    savingPerms,
    setSavingPerms,
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
  };
}

export default useSecurityManager;
