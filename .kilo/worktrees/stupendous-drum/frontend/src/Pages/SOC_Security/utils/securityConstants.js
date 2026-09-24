export const SEVERITY_CONFIG = {
  ALL: { label: 'All Events', color: '#64748b', bg: '#f1f5f9' },
  CRITICAL: { label: 'Critical', color: '#b91c1c', bg: '#fee2e2' },
  WARNING: { label: 'Warning', color: '#b45309', bg: '#fef3c7' },
  BLOCKED: { label: 'Blocked / Threat', color: '#7c3aed', bg: '#f3e8ff' },
  INFO: { label: 'Normal Activity', color: '#0369a1', bg: '#e0f2fe' },
};

export const ROLE_COLORS = {
  'Super Admin': { color: '#dc2626', bg: '#fef2f2' },
  'Branch Manager': { color: '#4f46e5', bg: '#eef2ff' },
  'Sales Executive': { color: '#059669', bg: '#ecfdf5' },
  'Field Technician': { color: '#0284c7', bg: '#f0f9ff' },
  'Inventory Officer': { color: '#d97706', bg: '#fffbeb' },
  'Accountant': { color: '#7c3aed', bg: '#f5f3ff' },
};

export const DEFAULT_MODULES = [
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
      { id: 401, code: 'view_accounts', name: 'View Bank & Account Balances' },
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

export const DEFAULT_ROLES = [
  {
    id: 1,
    name: 'Super Admin',
    description: 'Complete unrestricted control across all modules, accounts, and security settings.',
    permissions: [
      'create_sale', 'edit_sale', 'delete_invoice', 'peek_cost_margin', 'approve_discount', 'print_sale_invoice',
      'view_inventory', 'add_product', 'edit_product', 'adjust_stock', 'manage_purchases',
      'view_projects', 'create_project', 'assign_technician', 'update_project_status', 'approve_tech_wallet', 'manage_offline_warranty',
      'view_accounts', 'collect_payment', 'transfer_funds', 'record_expense', 'close_cash_drawer',
      'view_audit_logs', 'manage_staff_users', 'manage_device_ids', 'manage_ip_firewall', 'edit_role_permissions',
    ],
  },
  {
    id: 2,
    name: 'Branch Manager',
    description: 'Store operations, staff supervision, sales approvals, stock adjustments, and accounts oversight.',
    permissions: [
      'create_sale', 'edit_sale', 'peek_cost_margin', 'approve_discount', 'print_sale_invoice',
      'view_inventory', 'add_product', 'edit_product', 'adjust_stock', 'manage_purchases',
      'view_projects', 'create_project', 'assign_technician', 'update_project_status', 'approve_tech_wallet', 'manage_offline_warranty',
      'view_accounts', 'collect_payment', 'transfer_funds', 'record_expense', 'close_cash_drawer', 'view_audit_logs',
    ],
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

export const DEFAULT_USERS = [
  { id: 1, name: 'Engr. Shamim (Managing Director)', email: 'admin@shebatech.com.bd', phone: '01711-000001', role_name: 'Super Admin', role_id: 1, is_locked: false, failed_login_count: 0, device_id: 'DEV-ADMIN-MAC-01', allowed_ip: '103.145.118.42' },
  { id: 2, name: 'Rafiqul Islam (Branch Manager)', email: 'rafiq@shebatech.com.bd', phone: '01711-000002', role_name: 'Branch Manager', role_id: 2, is_locked: false, failed_login_count: 0, device_id: 'POS-HQ-DESKTOP-01', allowed_ip: '192.168.1.100' },
  { id: 3, name: 'Rakib Hasan (POS Sales Exec)', email: 'rakib@shebatech.com.bd', phone: '01811-000003', role_name: 'Sales Executive', role_id: 3, is_locked: false, failed_login_count: 0, device_id: 'POS-COUNTER-01', allowed_ip: '192.168.1.100' },
  { id: 4, name: 'Tanvir Ahmed (Field Technician Lead)', email: 'tanvir.tech@shebatech.com.bd', phone: '01911-000004', role_name: 'Field Technician', role_id: 4, is_locked: false, failed_login_count: 0, device_id: 'DEV-TAB-OPPO-88', allowed_ip: 'Any IP' },
  { id: 5, name: 'Kamal Hossain (CCTV Setup Tech)', email: 'kamal.tech@shebatech.com.bd', phone: '01611-000005', role_name: 'Field Technician', role_id: 4, is_locked: false, failed_login_count: 0, device_id: 'DEV-MOBILE-KML', allowed_ip: 'Any IP' },
  { id: 6, name: 'Sadia Sultana (Accounts Incharge)', email: 'accounts@shebatech.com.bd', phone: '01511-000006', role_name: 'Accountant', role_id: 6, is_locked: false, failed_login_count: 0, device_id: 'ACC-LAPTOP-DELL', allowed_ip: '103.145.118.42' },
];

export const DEFAULT_DEVICES = [
  { id: 1, device_id: 'POS-HQ-DESKTOP-01', device_name: 'Main Cashier Counter Desktop PC (HP ProDesk)', device_type: 'desktop', user_name: 'Rafiqul Islam', browser_info: 'Chrome 124 on Windows 11', is_authorized: true, last_active: 'Just now', ip_address: '192.168.1.100' },
  { id: 2, device_id: 'DEV-TAB-OPPO-88', device_name: 'Technician Tanvir Mobile Tablet (Oppo Pad)', device_type: 'tablet', user_name: 'Tanvir Ahmed', browser_info: 'Android Sheba Tech Field App v2.4', is_authorized: true, last_active: '12 mins ago', ip_address: '103.145.118.42' },
  { id: 3, device_id: 'POS-COUNTER-01', device_name: 'POS Counter 2 Thermal Receipt PC', device_type: 'desktop', user_name: 'Rakib Hasan', browser_info: 'Chrome 124 on Ubuntu Linux', is_authorized: true, last_active: '35 mins ago', ip_address: '192.168.1.100' },
  { id: 4, device_id: 'ACC-LAPTOP-DELL', device_name: 'Accounts Dell Latitude 5420 Laptop', device_type: 'laptop', user_name: 'Sadia Sultana', browser_info: 'Edge 123 on Windows 10 Pro', is_authorized: true, last_active: '1 hour ago', ip_address: '103.145.118.42' },
];

export const DEFAULT_IP_RULES = [
  { id: 1, ip_address: '103.145.118.42', rule_type: 'whitelist', reason: 'Sheba Tech Main Office Optical Broadband (Static Public IP)', blocked_attempts: 0 },
  { id: 2, ip_address: '192.168.1.100', rule_type: 'whitelist', reason: 'Shop Internal Subnet Gateway & POS Terminal LAN', blocked_attempts: 0 },
  { id: 3, ip_address: '185.220.101.5', rule_type: 'block', reason: 'Known Tor Exit Node / Automated credential stuffing botnet', blocked_attempts: 128 },
  { id: 4, ip_address: '45.154.255.89', rule_type: 'block', reason: 'Port scanner & API brute-force probe source', blocked_attempts: 33 },
];

export const DEFAULT_LOGS = [
  { id: 1, severity: 'CRITICAL', action: 'AUTH_BRUTE_FORCE_BLOCK', user_name: 'Unauthenticated (Attacker)', ip_address: '185.220.101.5', device_id: 'TOR-EXIT-NODE-772', target_table: 'users', details: '14 consecutive failed password attempts detected on user admin. IP automatically throttled & quarantined by SOC rate-limiter.', created_at: '2026-09-08 01:52:10' },
  { id: 2, severity: 'WARNING', action: 'DEVICE_UNAUTHORIZED_WARNING', user_name: 'Tanvir Ahmed (Technician)', ip_address: '103.145.118.42', device_id: 'DEV-TAB-OPPO-88', target_table: 'trusted_devices', details: 'Technician logged in from non-primary MAC address. Device auto-flagged for hardware fleet verification.', created_at: '2026-09-08 01:40:22' },
  { id: 3, severity: 'INFO', action: 'ROLE_PERMISSIONS_UPDATED', user_name: 'Engr. Shamim (Admin)', ip_address: '103.145.118.42', device_id: 'DEV-ADMIN-MAC-01', target_table: 'roles', details: 'Super Admin updated Role Matrix for "Field Technician" - synchronized core operational permissions.', created_at: '2026-09-08 01:25:00' },
  { id: 4, severity: 'BLOCKED', action: 'FIREWALL_DROP', user_name: 'System Firewall', ip_address: '45.154.255.89', device_id: 'N/A', target_table: 'ip_rules', details: 'Packet dropped from blacklisted scanner subnet probing /api/v1/debug endpoints.', created_at: '2026-09-08 01:10:45' },
  { id: 5, severity: 'INFO', action: 'POS_BILLING', user_name: 'Rakib Hasan', ip_address: '192.168.1.100', device_id: 'POS-COUNTER-01', target_table: 'sales', details: 'Sale invoice #INV-2026-089 generated with CCTV setup charges (৳ 18,500).', created_at: '2026-09-08 00:55:12' },
  { id: 6, severity: 'WARNING', action: 'SPAM_LOCKOUT_TRIGGERED', user_name: 'Kamal Hossain', ip_address: '103.21.244.0', device_id: 'DEV-MOBILE-KML', target_table: 'users', details: '5 rapid PIN entries failed on mobile app. Account temporarily placed in cooldown.', created_at: '2026-09-08 00:30:18' },
];
