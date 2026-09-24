import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';

const SEVERITY_CONFIG = {
  ALL: { label: 'All Events', color: '#64748b', bg: '#f1f5f9' },
  CRITICAL: { label: 'Critical', color: '#b91c1c', bg: '#fee2e2' },
  WARNING: { label: 'Warning', color: '#b45309', bg: '#fef3c7' },
  BLOCKED: { label: 'Blocked / Threat', color: '#7c3aed', bg: '#f3e8ff' },
  INFO: { label: 'Normal Activity', color: '#0369a1', bg: '#e0f2fe' },
};

const ROLE_COLORS = {
  'Super Admin': { color: '#dc2626', bg: '#fef2f2' },
  'Branch Manager': { color: '#4f46e5', bg: '#eef2ff' },
  'Sales Executive': { color: '#059669', bg: '#ecfdf5' },
  'Field Technician': { color: '#0284c7', bg: '#f0f9ff' },
  'Inventory Officer': { color: '#d97706', bg: '#fffbeb' },
  'Accountant': { color: '#7c3aed', bg: '#f5f3ff' },
};

const DEFAULT_MODULES = [
  {
    module: 'Sales & POS',
    permissions: [
      { id: 101, code: 'create_sale', name: 'Create Sale / POS Invoicing' },
      { id: 102, code: 'edit_sale', name: 'Edit Sale & Modify Quantities' },
      { id: 103, code: 'delete_invoice', name: 'Delete / Cancel Sale Invoices' },
      { id: 104, code: 'peek_cost_margin', name: 'Peek Purchase Cost & Margin Info (👁)' },
      { id: 105, code: 'approve_discount', name: 'Approve Special Custom Discounts' },
      { id: 106, code: 'print_sale_invoice', name: 'Print Customer Invoices & Thermal Slips' },
    ],
  },
  {
    module: 'Inventory & Purchases',
    permissions: [
      { id: 201, code: 'view_inventory', name: 'View Stock Quantities & Inventory' },
      { id: 202, code: 'add_product', name: 'Add New Products & Models' },
      { id: 203, code: 'edit_product', name: 'Edit Product Details & Retail Prices' },
      { id: 204, code: 'adjust_stock', name: 'Manual Stock Adjustments & Damage Entry' },
      { id: 205, code: 'manage_purchases', name: 'Create Purchase Orders & Suppliers' },
    ],
  },
  {
    module: 'Projects & Field Technicians',
    permissions: [
      { id: 301, code: 'view_projects', name: 'View Assigned Service & Setup Projects' },
      { id: 302, code: 'create_project', name: 'Create New Customer Setup Projects' },
      { id: 303, code: 'assign_technician', name: 'Assign Technicians to Projects' },
      { id: 304, code: 'update_project_status', name: 'Update Project Progress & Checklist' },
      { id: 305, code: 'approve_tech_wallet', name: 'Approve Technician Wallet Fund Transfers' },
      { id: 306, code: 'manage_offline_warranty', name: 'Process Warranty & Serial Claims' },
    ],
  },
  {
    module: 'Accounts & Cash Flow',
    permissions: [
      { id: 401, code: 'view_accounts', name: 'View Bank & Digital Wallet Balances' },
      { id: 402, code: 'collect_payment', name: 'Collect Customer Due Payments' },
      { id: 403, code: 'transfer_funds', name: 'Internal Bank & Cash Drawer Transfers' },
      { id: 404, code: 'record_expense', name: 'Record Daily Shop & Staff Expenses' },
      { id: 405, code: 'close_cash_drawer', name: 'Perform Day-Close Settlement' },
    ],
  },
  {
    module: 'SOC & Access Security',
    permissions: [
      { id: 501, code: 'view_audit_logs', name: 'View SIEM Security & Audit Logs' },
      { id: 502, code: 'manage_staff_users', name: 'Manage Staff & Technician Logins' },
      { id: 503, code: 'manage_device_ids', name: 'Authorize Hardware Device IDs' },
      { id: 504, code: 'manage_ip_firewall', name: 'Configure IP Whitelist & Blacklist' },
      { id: 505, code: 'edit_role_permissions', name: 'Modify Security Role Permission Matrix' },
    ],
  },
];

const DEFAULT_ROLES = [
  {
    id: 1,
    name: 'Super Admin',
    description: 'Complete unrestricted control across all modules, accounts, and security settings.',
    permissions: ['create_sale', 'edit_sale', 'delete_invoice', 'peek_cost_margin', 'approve_discount', 'print_sale_invoice', 'view_inventory', 'add_product', 'edit_product', 'adjust_stock', 'manage_purchases', 'view_projects', 'create_project', 'assign_technician', 'update_project_status', 'approve_tech_wallet', 'manage_offline_warranty', 'view_accounts', 'collect_payment', 'transfer_funds', 'record_expense', 'close_cash_drawer', 'view_audit_logs', 'manage_staff_users', 'manage_device_ids', 'manage_ip_firewall', 'edit_role_permissions'],
  },
  {
    id: 2,
    name: 'Branch Manager',
    description: 'Store operations, staff supervision, sales approvals, stock adjustments, and accounts oversight.',
    permissions: ['create_sale', 'edit_sale', 'peek_cost_margin', 'approve_discount', 'print_sale_invoice', 'view_inventory', 'add_product', 'edit_product', 'adjust_stock', 'manage_purchases', 'view_projects', 'create_project', 'assign_technician', 'update_project_status', 'approve_tech_wallet', 'manage_offline_warranty', 'view_accounts', 'collect_payment', 'transfer_funds', 'record_expense', 'close_cash_drawer', 'view_audit_logs'],
  },
  {
    id: 3,
    name: 'Sales Executive',
    description: 'Counter POS billing, quotations, customer handling, and printing receipts. No cost peek.',
    permissions: ['create_sale', 'print_sale_invoice', 'view_inventory', 'view_projects', 'collect_payment'],
  },
  {
    id: 4,
    name: 'Field Technician',
    description: 'Mobile technician app access, project task completion, warranty inspections, and Tech Wallet.',
    permissions: ['view_projects', 'update_project_status', 'manage_offline_warranty'],
  },
  {
    id: 5,
    name: 'Inventory Officer',
    description: 'Warehouse goods receipt, serial/barcode generation, purchases, supplier catalog management.',
    permissions: ['view_inventory', 'add_product', 'edit_product', 'adjust_stock', 'manage_purchases'],
  },
  {
    id: 6,
    name: 'Accountant',
    description: 'Cash drawer balancing, bank reconciliations, vendor payments, expense tracking, and day-close.',
    permissions: ['view_accounts', 'collect_payment', 'transfer_funds', 'record_expense', 'close_cash_drawer', 'print_sale_invoice'],
  },
];

const DEFAULT_USERS = [
  { id: 1, name: 'Engr. Shamim (Managing Director)', email: 'admin@shebatech.com.bd', phone: '01711-000001', role_name: 'Super Admin', role_id: 1, is_locked: false, failed_login_count: 0, device_id: 'DEV-ADMIN-MAC-01', allowed_ip: '103.145.118.42' },
  { id: 2, name: 'Rafiqul Islam (Branch Manager)', email: 'rafiq@shebatech.com.bd', phone: '01711-000002', role_name: 'Branch Manager', role_id: 2, is_locked: false, failed_login_count: 0, device_id: 'POS-HQ-DESKTOP-01', allowed_ip: '192.168.1.100' },
  { id: 3, name: 'Rakib Hasan (POS Sales Exec)', email: 'rakib@shebatech.com.bd', phone: '01811-000003', role_name: 'Sales Executive', role_id: 3, is_locked: false, failed_login_count: 0, device_id: 'POS-COUNTER-01', allowed_ip: '192.168.1.100' },
  { id: 4, name: 'Tanvir Ahmed (Field Technician Lead)', email: 'tanvir.tech@shebatech.com.bd', phone: '01911-000004', role_name: 'Field Technician', role_id: 4, is_locked: false, failed_login_count: 0, device_id: 'DEV-TAB-OPPO-88', allowed_ip: 'Any IP' },
  { id: 5, name: 'Kamal Hossain (CCTV Setup Tech)', email: 'kamal.tech@shebatech.com.bd', phone: '01611-000005', role_name: 'Field Technician', role_id: 4, is_locked: false, failed_login_count: 0, device_id: 'DEV-MOBILE-KML', allowed_ip: 'Any IP' },
  { id: 6, name: 'Sadia Sultana (Accounts Incharge)', email: 'accounts@shebatech.com.bd', phone: '01511-000006', role_name: 'Accountant', role_id: 6, is_locked: false, failed_login_count: 0, device_id: 'ACC-LAPTOP-DELL', allowed_ip: '103.145.118.42' },
];

const DEFAULT_DEVICES = [
  { id: 1, device_id: 'POS-HQ-DESKTOP-01', device_name: 'Main Cashier Counter Desktop PC (HP ProDesk)', device_type: 'desktop', user_name: 'Rafiqul Islam', browser_info: 'Chrome 124 on Windows 11', is_authorized: true, last_active: 'Just now', ip_address: '192.168.1.100' },
  { id: 2, device_id: 'DEV-TAB-OPPO-88', device_name: 'Technician Tanvir Mobile Tablet (Oppo Pad)', device_type: 'tablet', user_name: 'Tanvir Ahmed', browser_info: 'Android Sheba Tech Field App v2.4', is_authorized: true, last_active: '12 mins ago', ip_address: '103.145.118.42' },
  { id: 3, device_id: 'POS-COUNTER-01', device_name: 'POS Counter 2 Thermal Receipt PC', device_type: 'desktop', user_name: 'Rakib Hasan', browser_info: 'Chrome 124 on Ubuntu Linux', is_authorized: true, last_active: '35 mins ago', ip_address: '192.168.1.100' },
  { id: 4, device_id: 'ACC-LAPTOP-DELL', device_name: 'Accounts Dell Latitude 5420 Laptop', device_type: 'laptop', user_name: 'Sadia Sultana', browser_info: 'Edge 123 on Windows 10 Pro', is_authorized: true, last_active: '1 hour ago', ip_address: '103.145.118.42' },
];

const DEFAULT_IP_RULES = [
  { id: 1, ip_address: '103.145.118.42', rule_type: 'whitelist', reason: 'Sheba Tech Main Office Optical Broadband (Static Public IP)', blocked_attempts: 0 },
  { id: 2, ip_address: '192.168.1.100', rule_type: 'whitelist', reason: 'Shop Internal Subnet Gateway & POS Terminal LAN', blocked_attempts: 0 },
  { id: 3, ip_address: '185.220.101.5', rule_type: 'block', reason: 'Known Tor Exit Node / Automated credential stuffing botnet', blocked_attempts: 128 },
  { id: 4, ip_address: '45.154.255.89', rule_type: 'block', reason: 'Port scanner & API brute-force probe source', blocked_attempts: 33 },
];

const DEFAULT_LOGS = [
  { id: 1, severity: 'CRITICAL', action: 'AUTH_BRUTE_FORCE_BLOCK', user_name: 'Unauthenticated (Attacker)', ip_address: '185.220.101.5', device_id: 'TOR-EXIT-NODE-772', target_table: 'users', details: '14 consecutive failed password attempts detected on user admin. IP automatically throttled & quarantined by SOC rate-limiter.', created_at: '2026-09-08 01:52:10' },
  { id: 2, severity: 'WARNING', action: 'DEVICE_UNAUTHORIZED_WARNING', user_name: 'Tanvir Ahmed (Technician)', ip_address: '103.145.118.42', device_id: 'DEV-TAB-OPPO-88', target_table: 'trusted_devices', details: 'Technician logged in from non-primary MAC address. Device auto-flagged for hardware fleet verification.', created_at: '2026-09-08 01:40:22' },
  { id: 3, severity: 'INFO', action: 'ROLE_PERMISSIONS_UPDATED', user_name: 'Engr. Shamim (Admin)', ip_address: '103.145.118.42', device_id: 'DEV-ADMIN-MAC-01', target_table: 'roles', details: 'Super Admin updated Role Matrix for "Field Technician" - synchronized core operational permissions.', created_at: '2026-09-08 01:25:00' },
  { id: 4, severity: 'BLOCKED', action: 'FIREWALL_DROP', user_name: 'System Firewall', ip_address: '45.154.255.89', device_id: 'N/A', target_table: 'ip_rules', details: 'Packet dropped from blacklisted scanner subnet probing /api/v1/debug endpoints.', created_at: '2026-09-08 01:10:45' },
  { id: 5, severity: 'INFO', action: 'POS_BILLING', user_name: 'Rakib Hasan', ip_address: '192.168.1.100', device_id: 'POS-COUNTER-01', target_table: 'sales', details: 'Sale invoice #INV-2026-089 generated with CCTV setup charges (৳ 18,500).', created_at: '2026-09-08 00:55:12' },
  { id: 6, severity: 'WARNING', action: 'SPAM_LOCKOUT_TRIGGERED', user_name: 'Kamal Hossain', ip_address: '103.21.244.0', device_id: 'DEV-MOBILE-KML', target_table: 'users', details: '5 rapid PIN entries failed on mobile app. Account temporarily placed in cooldown.', created_at: '2026-09-08 00:30:18' },
];

export default function Security() {
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'staff' | 'roles' | 'devices' | 'firewall'
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

  const fetchPendingStaff = async () => {
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
  };

  const handleApproveOrRejectStaff = async (userId, action) => {
    try {
      setProcessingStaffId(userId);
      const res = await fetch(`${API}/security/approve-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
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

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const loadStaffRecovery = async () => {
    try {
      const res = await fetch(`${API}/security/recovery-requests`);
      if (res && res.ok) {
        const d = await res.json();
        if (d.success) setStaffRecoveryRequests(d.data || []);
      }
    } catch (err) {
      console.error(err);
    }
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
          adminNotes: staffResolutionNotes
        })
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

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError('');
      const [overviewRes, logsRes, usersRes, rolesRes, permsRes, devicesRes, ipRes, recoveryRes, pendingStaffRes] = await Promise.all([
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
          if (!selectedRoleId) {
            setSelectedRoleId(rList[0].id);
            setActiveRolePerms(rList[0].permissions || rList[0].permission_codes || []);
          }
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
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Update selected role perms when role changes
  useEffect(() => {
    const curRole = roles.find((r) => r.id === Number(selectedRoleId));
    if (curRole) {
      const perms = curRole.permissions || curRole.permission_codes || [];
      setActiveRolePerms(Array.isArray(perms) ? perms : []);
    }
  }, [selectedRoleId, roles]);

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
          u.id === user.id ? { ...u, is_locked: newLocked, failed_login_count: newLocked ? u.failed_login_count : 0 } : u
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

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Top SOC Defense Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              🛡️ SOC Security &amp; Access Control
            </h2>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#047857',
                fontSize: '0.74rem',
                fontWeight: 800,
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
              Active Shield · Zero Trust Access
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Enterprise Threat Operations, Staff &amp; Technician Access Control, Device Authorization, IP Firewall &amp; Granular Roles
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={loadAllData}
            style={{
              padding: '8px 14px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🔄 Refresh SOC
          </button>

          <button
            type="button"
            onClick={() => setIsAddStaffOpen(true)}
            style={{
              padding: '8px 14px',
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
            }}
          >
            + Register Staff / Tech
          </button>

          <button
            type="button"
            onClick={() => setIsAddDeviceOpen(true)}
            style={{
              padding: '8px 14px',
              background: '#4338ca',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
            }}
          >
            + Authorize Device
          </button>

          <button
            type="button"
            onClick={() => setIsAddIpOpen(true)}
            style={{
              padding: '8px 14px',
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
            }}
          >
            + Firewall IP Rule
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '16px', border: '1px solid #fecaca' }}>
          ⚠️ {error}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', marginBottom: '16px', border: '1px solid #bbf7d0' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* 5 Security KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '22px' }}>
        {/* KPI 1: Health Score */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              Security Posture
            </span>
            <span style={{ padding: '2px 7px', background: '#dcfce7', borderRadius: '4px', color: '#15803d', fontSize: '0.72rem', fontWeight: 800 }}>
              EXCELLENT
            </span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#15803d' }}>
            {overview.healthScore}%
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>
            Zero breach · Strict Zero-Trust
          </div>
        </div>

        {/* KPI 2: Staff & Techs */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              Staff &amp; Tech Fleet
            </span>
            <span style={{ padding: '2px 7px', background: '#f1f5f9', borderRadius: '4px', color: '#475569', fontSize: '0.72rem', fontWeight: 800 }}>
              ACCOUNTS
            </span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>
            {overview.totalUsers}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>
            {overview.technicians} Field Techs · {overview.lockedUsers} Locked
          </div>
        </div>

        {/* KPI 3: Blocked Threats */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase' }}>
              Threats &amp; Spam
            </span>
            <span style={{ padding: '2px 7px', background: '#fee2e2', borderRadius: '4px', color: '#b91c1c', fontSize: '0.72rem', fontWeight: 800 }}>
              SHIELDED
            </span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#b91c1c' }}>
            {overview.totalBlockedAttempts}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>
            Brute-force &amp; Spam attempts stopped
          </div>
        </div>

        {/* KPI 4: Trusted Devices */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#4338ca', textTransform: 'uppercase' }}>
              Hardware Devices
            </span>
            <span style={{ padding: '2px 7px', background: '#e0e7ff', borderRadius: '4px', color: '#4338ca', fontSize: '0.72rem', fontWeight: 800 }}>
              AUTH
            </span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#4338ca' }}>
            {overview.authorizedDevices} / {overview.totalDevices}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>
            POS terminals &amp; mobile fingerprints
          </div>
        </div>

        {/* KPI 5: Firewall Rules */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>
              Firewall Perimeter
            </span>
            <span style={{ padding: '2px 7px', background: '#e0f2fe', borderRadius: '4px', color: '#0369a1', fontSize: '0.72rem', fontWeight: 800 }}>
              IP RULES
            </span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0369a1' }}>
            {overview.ipRulesCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>
            Static broadband whitelist active
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'audit', label: '🛡️ SIEM Audit Trail', count: logs.length },
          { key: 'staff', label: '👥 Staff & Technician Logins', count: users.length },
          { key: 'roles', label: '🔑 Role & Permission Matrix', count: roles.length },
          { key: 'devices', label: '📱 Hardware Device IDs', count: devices.length },
          { key: 'firewall', label: '🌐 IP Firewall & Anti-Spam', count: ipRules.length },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              color: activeTab === tab.key ? '#dc2626' : '#64748b',
              borderBottom: activeTab === tab.key ? '3px solid #dc2626' : '3px solid transparent',
              marginBottom: '-1px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{tab.label}</span>
            <span
              style={{
                padding: '1px 6px',
                borderRadius: '999px',
                background: activeTab === tab.key ? '#fee2e2' : '#f1f5f9',
                color: activeTab === tab.key ? '#b91c1c' : '#64748b',
                fontSize: '0.72rem',
                fontWeight: 800,
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SIEM AUDIT TRAIL */}
      {/* ========================================================= */}
      {activeTab === 'audit' && (
        <div>
          {/* Severity Pills & Search Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {Object.keys(SEVERITY_CONFIG).map((sev) => {
                const cfg = SEVERITY_CONFIG[sev];
                const count =
                  sev === 'ALL'
                    ? logs.length
                    : logs.filter((l) => (l.severity || 'INFO').toUpperCase() === sev).length;
                const isSelected = severityFilter === sev;

                return (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverityFilter(sev)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: isSelected ? `1.5px solid ${cfg.color}` : '1px solid #cbd5e1',
                      background: isSelected ? cfg.bg : '#ffffff',
                      color: isSelected ? cfg.color : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{cfg.label}</span>
                    <span style={{ padding: '1px 5px', borderRadius: '999px', background: '#ffffff', fontSize: '0.7rem' }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ minWidth: '280px', flex: 1, maxWidth: '420px' }}>
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="🔍 Search events by user, action, IP address..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Audit Logs Table */}
          <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#ffffff', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                  <th style={{ padding: '10px 14px', width: '100px' }}>SEVERITY</th>
                  <th style={{ padding: '10px 14px' }}>EVENT / ACTION</th>
                  <th style={{ padding: '10px 14px' }}>USER / ACTOR</th>
                  <th style={{ padding: '10px 14px' }}>ORIGIN IP</th>
                  <th style={{ padding: '10px 14px' }}>DEVICE ID</th>
                  <th style={{ padding: '10px 14px' }}>TARGET</th>
                  <th style={{ padding: '10px 14px' }}>TIMESTAMP</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', width: '70px' }}>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                      No audit events matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((l, idx) => {
                    const sev = (l.severity || 'INFO').toUpperCase();
                    const sevCfg = SEVERITY_CONFIG[sev] || SEVERITY_CONFIG.INFO;

                    return (
                      <tr key={l.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              background: sevCfg.bg,
                              color: sevCfg.color,
                            }}
                          >
                            {sev}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>
                          {l.action}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>
                            {l.user_name || (l.user_id ? `User #${l.user_id}` : 'System Shield')}
                          </div>
                          {l.role_name && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{l.role_name}</div>}
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#475569', fontSize: '0.8rem' }}>
                          {l.ip_address || '127.0.0.1'}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#64748b' }}>
                          {l.device_id || '-'}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#475569' }}>
                          {l.target_table || l.table_name || '-'}{l.record_id ? ` #${l.record_id}` : ''}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '0.76rem', color: '#64748b' }}>
                          {l.created_at ? new Date(l.created_at).toLocaleString('en-GB') : '-'}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setInspectEvent(l)}
                            style={{
                              padding: '3px 8px',
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: STAFF & TECHNICIAN LOGINS */}
      {/* ========================================================= */}
      {activeTab === 'staff' && (
        <div>
          {/* Subtabs for Staff */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
            <button
              type="button"
              onClick={() => setStaffSubTab('accounts')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: staffSubTab === 'accounts' ? '#0f172a' : '#f1f5f9',
                color: staffSubTab === 'accounts' ? '#ffffff' : '#475569',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              👥 Staff Accounts ({filteredUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setStaffSubTab('recovery')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: staffSubTab === 'recovery' ? '#d97706' : '#f1f5f9',
                color: staffSubTab === 'recovery' ? '#ffffff' : '#475569',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📬 Password Recovery Requests</span>
              {staffRecoveryRequests.filter(r => r.status === 'pending').length > 0 && (
                <span style={{
                  background: '#ffffff',
                  color: '#b45309',
                  borderRadius: '12px',
                  padding: '1px 6px',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {staffRecoveryRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setStaffSubTab('approvals'); fetchPendingStaff(); }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: staffSubTab === 'approvals' ? '#0284c7' : '#f1f5f9',
                color: staffSubTab === 'approvals' ? '#ffffff' : '#475569',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📋 Pending Staff Approvals (নতুন রেজিস্ট্রেশন অনুমোদন)</span>
              {pendingStaffList.length > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '1px 7px',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {pendingStaffList.length}
                </span>
              )}
            </button>
          </div>

          {staffSubTab === 'accounts' && (
            <div>
              {staffRecoveryRequests.some(r => r.status === 'pending') && (
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontSize: '0.84rem', fontWeight: 600 }}>
                    <span>🔔</span>
                    <span>{staffRecoveryRequests.filter(r => r.status === 'pending').length} staff member(s) requested password recovery.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStaffSubTab('recovery')}
                    style={{
                      padding: '5px 12px',
                      background: '#d97706',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    Review Requests →
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: '240px', maxWidth: '380px' }}>
              <input
                type="text"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                placeholder="🔍 Search staff by name, phone, device ID..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select
                value={staffRoleFilter}
                onChange={(e) => setStaffRoleFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              >
                <option value="all">All Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Branch Manager">Branch Manager</option>
                <option value="Field Technician">Field Technician</option>
                <option value="Sales Executive">Sales Executive</option>
                <option value="Inventory Officer">Inventory Officer</option>
                <option value="Accountant">Accountant</option>
              </select>

              <button
                type="button"
                onClick={() => setIsAddStaffOpen(true)}
                style={{
                  padding: '8px 16px',
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                + Add Staff / Technician
              </button>
            </div>
          </div>

          {/* Staff Table */}
          <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#ffffff', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                  <th style={{ padding: '10px 14px' }}>STAFF / TECHNICIAN</th>
                  <th style={{ padding: '10px 14px' }}>ROLE</th>
                  <th style={{ padding: '10px 14px' }}>PHONE &amp; LOGIN</th>
                  <th style={{ padding: '10px 14px' }}>BOUND DEVICE ID</th>
                  <th style={{ padding: '10px 14px' }}>ALLOWED NETWORK</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>STATUS</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', width: '180px' }}>ACCESS CONTROLS</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, idx) => {
                  const roleCfg = ROLE_COLORS[u.role_name] || { color: '#475569', bg: '#f1f5f9' };

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{u.name}</div>
                        {u.email && <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{u.email}</div>}
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: roleCfg.bg,
                            color: roleCfg.color,
                          }}
                        >
                          {u.role_name}
                        </span>
                      </td>

                      <td style={{ padding: '12px 14px', color: '#334155' }}>
                        <div>📞 {u.phone}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Last Login: {u.last_login ? new Date(u.last_login).toLocaleString('en-GB') : 'Active Today'}
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        {u.device_id ? (
                          <span style={{ fontSize: '0.76rem', color: '#0369a1', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            📱 {u.device_id}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Unrestricted Device</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#475569' }}>
                        {u.allowed_ip === 'Any IP' ? (
                          <span>🌐 Any IP</span>
                        ) : (
                          <span style={{ fontFamily: 'monospace', color: '#15803d', fontWeight: 600 }}>
                            🔒 {u.allowed_ip}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {u.is_locked ? (
                          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, background: '#fee2e2', color: '#b91c1c' }}>
                            🔒 LOCKED
                          </span>
                        ) : (
                          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, background: '#dcfce7', color: '#15803d' }}>
                            ✓ ACTIVE
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditStaff(u)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '5px',
                              border: '1px solid #bae6fd',
                              background: '#f0f9ff',
                              color: '#0284c7',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                            title="Edit Staff / Technician Details"
                          >
                            ✏️ Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleUserLock(u)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '5px',
                              border: u.is_locked ? '1px solid #86efac' : '1px solid #fecaca',
                              background: u.is_locked ? '#f0fdf4' : '#fef2f2',
                              color: u.is_locked ? '#15803d' : '#b91c1c',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {u.is_locked ? '🔓 Unlock' : '🔒 Lock'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const newPin = prompt(`Set new 6-digit PIN/password for ${u.name}:`, '123456');
                              if (newPin) {
                                handleOpenEditStaff({ ...u, password: newPin });
                                showToast(`Enter updated PIN for ${u.name} in Edit modal`);
                              }
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '5px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#334155',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            🔑 PIN
                          </button>

                          {u.id !== 1 && (
                            <button
                              type="button"
                              onClick={() => setStaffToDelete(u)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '5px',
                                border: '1px solid #fecaca',
                                background: '#fef2f2',
                                color: '#dc2626',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                              title="Delete Staff / Technician"
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Password Recovery Requests Subtab */}
      {staffSubTab === 'recovery' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1.05rem', fontWeight: 800 }}>
                📬 Staff Password Recovery Requests
              </h4>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                When staff forget their password or mobile/email login, they send a recovery request to App Admin. Admin can verify and reset their credentials here.
              </p>
            </div>
            <button
              type="button"
              onClick={loadStaffRecovery}
              style={{
                padding: '7px 14px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: '#334155',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🔄 Refresh
            </button>
          </div>

          {staffRecoveryRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: '#ffffff', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🛡️</div>
              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>No Recovery Requests</div>
              <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '4px' }}>All staff credentials are secure and active.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {staffRecoveryRequests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    background: '#ffffff',
                    border: `1px solid ${req.status === 'pending' ? '#f59e0b' : '#e2e8f0'}`,
                    borderRadius: '10px',
                    padding: '16px 20px',
                    boxShadow: req.status === 'pending' ? '0 4px 12px rgba(245, 158, 11, 0.1)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: '#0f172a', fontSize: '0.94rem' }}>{req.user_name || 'Staff Member'}</strong>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: req.status === 'pending' ? '#fef3c7' : '#dcfce7',
                          color: req.status === 'pending' ? '#b45309' : '#15803d'
                        }}>
                          {req.status === 'pending' ? 'Pending Reset' : '✓ Resolved'}
                        </span>
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        <span>Identifier: <strong style={{ color: '#0284c7' }}>{req.identifier}</strong></span>
                        {req.contact_phone && <span>Contact: <strong>{req.contact_phone}</strong></span>}
                        {req.shop_name && <span>Shop: <strong>{req.shop_name}</strong></span>}
                      </div>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                      {new Date(req.created_at).toLocaleString()}
                    </div>
                  </div>

                  {req.reason && (
                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', fontSize: '0.82rem', color: '#334155', marginBottom: '12px', border: '1px solid #f1f5f9' }}>
                      <span style={{ fontWeight: 700, color: '#f59e0b' }}>Staff Message: </span>
                      {req.reason}
                    </div>
                  )}

                  {req.status === 'pending' ? (
                    resolvingStaffReqId === req.id ? (
                      <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #0284c7', marginTop: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>New 3-Type Password</label>
                              <button
                                type="button"
                                onClick={() => setNewStaffPassword(generate3TypeStaffPassword())}
                                style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 600, textDecoration: 'underline', padding: 0 }}
                              >
                                ⚡ Generate 3-Type
                              </button>
                            </div>
                            <input
                              type="text"
                              value={newStaffPassword}
                              onChange={(e) => setNewStaffPassword(e.target.value)}
                              placeholder="Enter or generate new password"
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                color: '#0f172a',
                                fontFamily: 'monospace',
                                fontSize: '0.86rem',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Admin Notes</label>
                            <input
                              type="text"
                              value={staffResolutionNotes}
                              onChange={(e) => setStaffResolutionNotes(e.target.value)}
                              placeholder="e.g. Identity verified"
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                color: '#0f172a',
                                fontSize: '0.84rem',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => { setResolvingStaffReqId(null); setNewStaffPassword(''); }}
                            style={{
                              padding: '7px 14px',
                              background: '#e2e8f0',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#334155',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={staffRecoveryLoading}
                            onClick={() => handleResolveStaffRecovery(req.id)}
                            style={{
                              padding: '7px 18px',
                              background: '#16a34a',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: staffRecoveryLoading ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {staffRecoveryLoading ? 'Updating Password...' : '✓ Set New Password for Staff'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setResolvingStaffReqId(req.id);
                            setNewStaffPassword(generate3TypeStaffPassword());
                          }}
                          style={{
                            padding: '7px 16px',
                            background: '#d97706',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                        >
                          🔑 Reset Staff Password
                        </button>
                      </div>
                    )
                  ) : (
                    <div style={{ fontSize: '0.76rem', color: '#15803d', fontWeight: 600 }}>
                      ✓ Resolved by {req.resolved_by || 'App Admin'} at {new Date(req.resolved_at).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Staff Self-Registration Approval Subtab */}
      {staffSubTab === 'approvals' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1.05rem', fontWeight: 800 }}>
                📋 নতুন স্টাফ ও টেকনিশিয়ান অনুমোদন (Staff Registrations Approval)
              </h4>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                অনলাইন সাইন-আপের মাধ্যমে রেজিস্ট্রেশন করা স্টাফ ও টেকনিশিয়ানদের তালিকা। শপ এডমিন অনুমোদন (Approve) করলে তারা সিস্টেমে লগইন করতে পারবে।
              </p>
            </div>
            <button
              type="button"
              onClick={fetchPendingStaff}
              style={{
                padding: '7px 14px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: '#334155',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🔄 Refresh List
            </button>
          </div>

          {pendingStaffList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: '#ffffff', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>✅</div>
              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.94rem' }}>কোনো অপেক্ষমান স্টাফ নেই (No Pending Registrations)</div>
              <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '4px' }}>নতুন কোনো স্টাফ রেজিস্ট্রেশন করলে এখানে তাৎক্ষণিকভাবে তালিকা প্রদর্শিত হবে।</div>
            </div>
          ) : (
            <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>নাম (Name)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>মোবাইল নম্বর</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>ইমেইল</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>আবেদিত পদবী (Role)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>রেজিস্ট্রেশন তারিখ</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'center' }}>একশন (Action)</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingStaffList.map((st) => (
                    <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.1rem' }}>👤</span>
                          <span>{st.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#334155' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{st.phone || 'N/A'}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>
                        {st.email || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: '#fef3c7',
                          color: '#b45309',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700
                        }}>
                          {st.role_name || 'Field Technician'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem' }}>
                        {st.created_at ? new Date(st.created_at).toLocaleString() : 'Recent'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            disabled={processingStaffId === st.id}
                            onClick={() => handleApproveOrRejectStaff(st.id, 'approve')}
                            style={{
                              background: '#16a34a',
                              color: '#ffffff',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>✓</span>
                            <span>অনুমোদন (Approve)</span>
                          </button>
                          <button
                            type="button"
                            disabled={processingStaffId === st.id}
                            onClick={() => {
                              if (window.confirm(`${st.name} এর রেজিস্ট্রেশন বাতিল করতে চান?`)) {
                                handleApproveOrRejectStaff(st.id, 'reject');
                              }
                            }}
                            style={{
                              background: '#ef4444',
                              color: '#ffffff',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>✕</span>
                            <span>বাতিল (Reject)</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )}

      {/* ========================================================= */}
      {/* TAB 3: ROLE & PERMISSION MATRIX */}
      {/* ========================================================= */}
      {activeTab === 'roles' && (
        <div>
          {/* Role Pills Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase' }}>
              Select Role:
            </span>
            {roles.map((r) => {
              const isSelected = Number(selectedRoleId) === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRoleId(r.id)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: isSelected ? '2px solid #0f172a' : '1px solid #cbd5e1',
                    background: isSelected ? '#0f172a' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#334155',
                  }}
                >
                  {r.name}
                </button>
              );
            })}
          </div>

          {/* Role Header Description */}
          {(() => {
            const curRole = roles.find((r) => r.id === Number(selectedRoleId)) || {};
            return (
              <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 18px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{curRole.name || 'Role'} Privileges</strong>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#475569' }}>
                    {curRole.description || 'Configured system permissions for this role.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveRolePermissions}
                  disabled={savingPerms}
                  style={{
                    padding: '8px 18px',
                    background: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                  }}
                >
                  {savingPerms ? 'Saving...' : '💾 Save Permissions'}
                </button>
              </div>
            );
          })()}

          {/* Module Permission Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {permissionsGrouped.map((grp, idx) => (
              <div
                key={grp.module_name || grp.module || idx}
                style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  padding: '16px 18px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{grp.module_name || grp.module}</span>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    {(grp.permissions || []).filter((p) => activeRolePerms.includes(p.code)).length} / {(grp.permissions || []).length} Enabled
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(grp.permissions || []).map((p) => {
                    const isChecked = activeRolePerms.includes(p.code);
                    return (
                      <label
                        key={p.code}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          fontSize: '0.84rem',
                          color: isChecked ? '#0f172a' : '#64748b',
                          fontWeight: isChecked ? 600 : 400,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(p.code)}
                          style={{ width: '16px', height: '16px', accentColor: '#0d9488', cursor: 'pointer' }}
                        />
                        <span>{p.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: HARDWARE DEVICE IDS */}
      {/* ========================================================= */}
      {activeTab === 'devices' && (
        <div>
          {/* Strict Device Mode Switch */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                Strict Hardware Device Authorization Mode
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                When enabled, employees and field technicians can only access the software from pre-authorized Device IDs or registered terminals.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStrictDeviceMode(!strictDeviceMode);
                showToast(`Strict Device Mode ${!strictDeviceMode ? 'ENABLED (Zero Trust)' : 'DISABLED (Flexible)'}`);
              }}
              style={{
                padding: '7px 16px',
                borderRadius: '999px',
                border: 'none',
                background: strictDeviceMode ? '#dcfce7' : '#fee2e2',
                color: strictDeviceMode ? '#15803d' : '#b91c1c',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {strictDeviceMode ? '✓ STRICT MODE ACTIVE' : '⚠️ PERMISSIVE MODE'}
            </button>
          </div>

          {/* Devices Table */}
          <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#ffffff', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                  <th style={{ padding: '10px 14px' }}>DEVICE ID</th>
                  <th style={{ padding: '10px 14px' }}>DEVICE NAME</th>
                  <th style={{ padding: '10px 14px' }}>TYPE</th>
                  <th style={{ padding: '10px 14px' }}>ENVIRONMENT / BROWSER</th>
                  <th style={{ padding: '10px 14px' }}>ASSIGNED USER</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>STATUS</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', width: '120px' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d, idx) => (
                  <tr key={d.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                      {d.device_id}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                      {d.device_name}
                    </td>
                    <td style={{ padding: '12px 14px', textTransform: 'uppercase', fontSize: '0.74rem', color: '#64748b' }}>
                      {d.device_type}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#475569' }}>
                      {d.browser_info || 'Unknown Environment'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#1e293b' }}>
                      {d.user_name || 'Counter Terminal'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {d.is_authorized ? (
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, background: '#dcfce7', color: '#15803d' }}>
                          ✓ AUTHORIZED
                        </span>
                      ) : (
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, background: '#fee2e2', color: '#b91c1c' }}>
                          🚫 REVOKED
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleDeviceAuth(d)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '5px',
                          border: d.is_authorized ? '1px solid #fecaca' : '1px solid #86efac',
                          background: d.is_authorized ? '#fef2f2' : '#f0fdf4',
                          color: d.is_authorized ? '#b91c1c' : '#15803d',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {d.is_authorized ? 'Revoke' : 'Authorize'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDevice(d.id)}
                        style={{
                          marginLeft: '6px',
                          padding: '4px 8px',
                          borderRadius: '5px',
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc',
                          color: '#ef4444',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        title="Deregister Device"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: IP FIREWALL & ANTI-SPAM */}
      {/* ========================================================= */}
      {activeTab === 'firewall' && (
        <div>
          {/* Firewall Shield Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {/* Whitelist Panel */}
            <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>
                  ✓ Whitelisted Static IP Range
                </span>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Office / Static Only</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 14px 0' }}>
                Logins from these IPs bypass secondary challenge checks for rapid branch access.
              </p>

              {ipRules.filter((r) => r.rule_type === 'whitelist').map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    fontSize: '0.84rem',
                  }}
                >
                  <div>
                    <strong style={{ fontFamily: 'monospace', color: '#15803d' }}>{r.ip_address}</strong>
                    <div style={{ fontSize: '0.74rem', color: '#4b5563' }}>{r.reason}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteIpRule(r.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Blacklist Panel */}
            <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase' }}>
                  🚫 Blacklisted &amp; Spam IPs
                </span>
                <span style={{ fontSize: '0.74rem', color: '#b91c1c', fontWeight: 700 }}>Auto-Blocked</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 14px 0' }}>
                All inbound login attempts from these addresses are terminated instantly at the network layer.
              </p>

              {ipRules.filter((r) => r.rule_type === 'block').map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    fontSize: '0.84rem',
                  }}
                >
                  <div>
                    <strong style={{ fontFamily: 'monospace', color: '#b91c1c' }}>{r.ip_address}</strong>
                    <div style={{ fontSize: '0.74rem', color: '#6b7280' }}>
                      {r.reason} · <strong>{r.blocked_attempts || 0} attempts blocked</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteIpRule(r.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REGISTER STAFF / TECHNICIAN */}
      {/* ========================================================= */}
      {isAddStaffOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddStaffOpen(false);
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '560px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              + Register Staff / Field Technician
            </h3>
            <form onSubmit={handleCreateStaff}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Al-Amin Technician"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Mobile Number (Primary Login) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="017XXXXXXXX"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Email Address (Optional Login)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. staff@shebatech.com.bd"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Assigned Role *
                  </label>
                  <select
                    value={newStaff.role_name}
                    onChange={(e) => {
                      const rName = e.target.value;
                      const rObj = roles.find((r) => r.name === rName);
                      setNewStaff({
                        ...newStaff,
                        role_name: rName,
                        role_id: rObj ? rObj.id : 4,
                      });
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  >
                    <option value="Field Technician">Field Technician</option>
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Branch Manager">Branch Manager</option>
                    <option value="Inventory Officer">Inventory Officer</option>
                    <option value="Accountant">Accountant</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                    Login Password (3-Type Combination) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewStaff({ ...newStaff, password: generate3TypeStaffPassword() })}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284c7',
                      cursor: 'pointer',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      textDecoration: 'underline',
                      padding: 0
                    }}
                  >
                    ⚡ Generate 3-Type Password
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Staff@4821! (Letters, Numbers & Special Characters)"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.86rem',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                  Staff will use this password along with their Mobile Number or Email to sign in.
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Hardware Device Binding ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. DEV-TECH-MOB-01 (leave blank for unrestricted)"
                  value={newStaff.device_id}
                  onChange={(e) => setNewStaff({ ...newStaff, device_id: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Allowed Network IP (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 103.145.118.42 or 'Any IP'"
                  value={newStaff.allowed_ip}
                  onChange={(e) => setNewStaff({ ...newStaff, allowed_ip: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Opening Wallet Balance (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00 (optional wallet balance)"
                  value={newStaff.opening_wallet_balance}
                  onChange={(e) => setNewStaff({ ...newStaff, opening_wallet_balance: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#0f172a', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Register Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT STAFF / TECHNICIAN */}
      {/* ========================================================= */}
      {editingStaff && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingStaff(null);
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                ✏️ Edit Staff / Technician Account
              </h3>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStaffSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingStaff.name}
                  onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStaff.phone}
                    onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editingStaff.email}
                    onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Assigned Role
                  </label>
                  <select
                    value={editingStaff.role_name}
                    onChange={(e) => {
                      const selRole = roles.find((r) => r.name === e.target.value);
                      setEditingStaff({
                        ...editingStaff,
                        role_name: e.target.value,
                        role_id: selRole ? selRole.id : 4,
                      });
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Branch Manager">Branch Manager</option>
                    <option value="Field Technician">Field Technician</option>
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Inventory Officer">Inventory Officer</option>
                    <option value="Accountant">Accountant</option>
                  </select>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                      New Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditingStaff({ ...editingStaff, password: generate3TypeStaffPassword() })}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0284c7',
                        cursor: 'pointer',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        textDecoration: 'underline',
                        padding: 0
                      }}
                    >
                      ⚡ Generate 3-Type
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Leave blank to keep current"
                    value={editingStaff.password}
                    onChange={(e) => setEditingStaff({ ...editingStaff, password: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', fontFamily: 'monospace', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Hardware Device Binding ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. DEV-TECH-01 (leave blank for unrestricted)"
                  value={editingStaff.device_id}
                  onChange={(e) => setEditingStaff({ ...editingStaff, device_id: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Allowed Network IP
                </label>
                <input
                  type="text"
                  placeholder="e.g. 103.145.118.42 or 'Any IP'"
                  value={editingStaff.allowed_ip}
                  onChange={(e) => setEditingStaff({ ...editingStaff, allowed_ip: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DELETE STAFF CONFIRMATION */}
      {/* ========================================================= */}
      {staffToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '420px', padding: '24px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#0f172a' }}>
              Delete Staff / Technician?
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '0 0 20px 0' }}>
              Are you sure you want to remove <strong>{staffToDelete.name}</strong> ({staffToDelete.role_name || 'Staff'})? The account will be deactivated and moved to Trash.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStaff}
                style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
              >
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: AUTHORIZE DEVICE */}
      {/* ========================================================= */}
      {isAddDeviceOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddDeviceOpen(false);
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              + Authorize Hardware Device ID
            </h3>
            <form onSubmit={handleCreateDevice}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Unique Device ID / Fingerprint *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DEV-POS-03 or MOB-SAMSUNG-A54"
                  value={newDevice.device_id}
                  onChange={(e) => setNewDevice({ ...newDevice, device_id: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Device Name / Friendly Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Technician Al-Amin Field Tablet"
                  value={newDevice.device_name}
                  onChange={(e) => setNewDevice({ ...newDevice, device_name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Device Type
                </label>
                <select
                  value={newDevice.device_type}
                  onChange={(e) => setNewDevice({ ...newDevice, device_type: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                >
                  <option value="desktop">Desktop / Laptop Workstation</option>
                  <option value="mobile">Field Technician Mobile Phone</option>
                  <option value="pos_terminal">Counter POS Dedicated Machine</option>
                  <option value="tablet">Warehouse Inventory Tablet</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddDeviceOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#4338ca', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Authorize Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD FIREWALL IP RULE */}
      {/* ========================================================= */}
      {isAddIpOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddIpOpen(false);
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '460px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              + Add IP Firewall Rule
            </h3>
            <form onSubmit={handleCreateIpRule}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  IPv4 / IPv6 Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 103.145.118.42 or 45.154.255.89"
                  value={newIpRule.ip_address}
                  onChange={(e) => setNewIpRule({ ...newIpRule, ip_address: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Rule Policy
                </label>
                <select
                  value={newIpRule.rule_type}
                  onChange={(e) => setNewIpRule({ ...newIpRule, rule_type: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
                >
                  <option value="block">🚫 BLOCK (Blacklist &amp; Drop Traffic)</option>
                  <option value="whitelist">✓ WHITELIST (Trusted Office Broadband)</option>
                </select>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Reason / Threat Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Brute-force credential attempts from botnet"
                  value={newIpRule.reason}
                  onChange={(e) => setNewIpRule({ ...newIpRule, reason: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddIpOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save IP Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: INSPECT AUDIT EVENT */}
      {/* ========================================================= */}
      {inspectEvent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectEvent(null);
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '580px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                SIEM Event Detail Inspector
              </div>
              <button
                type="button"
                onClick={() => setInspectEvent(null)}
                style={{ background: 'none', border: 'none', fontSize: '1rem', color: '#64748b', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.84rem', marginBottom: '16px' }}>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Action:</span> <strong>{inspectEvent.action}</strong>
              </div>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Severity:</span> <strong>{inspectEvent.severity || 'INFO'}</strong>
              </div>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>User / Actor:</span> <strong>{inspectEvent.user_name || inspectEvent.user_id || 'Automated Shield'}</strong>
              </div>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>IP Address:</span> <strong style={{ fontFamily: 'monospace' }}>{inspectEvent.ip_address || '127.0.0.1'}</strong>
              </div>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Device ID:</span> <strong>{inspectEvent.device_id || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Timestamp:</span> <strong>{new Date(inspectEvent.created_at).toLocaleString()}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setInspectEvent(null)}
                style={{ padding: '8px 18px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
