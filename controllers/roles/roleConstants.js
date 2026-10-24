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
        ]
    },
    {
        module: 'Inventory & Purchases',
        permissions: [
            { id: 201, code: 'view_inventory', name: 'View Stock Quantities & Inventory' },
            { id: 202, code: 'add_product', name: 'Add New Products & Models' },
            { id: 203, code: 'edit_product', name: 'Edit Product Details & Retail Prices' },
            { id: 204, code: 'adjust_stock', name: 'Manual Stock Adjustments & Damage Entry' },
            { id: 205, code: 'manage_purchases', name: 'Create Purchase Orders & Suppliers' },
        ]
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
        ]
    },
    {
        module: 'Accounts & Cash Flow',
        permissions: [
            { id: 401, code: 'view_accounts', name: 'View Bank & Account Balances' },
            { id: 402, code: 'collect_payment', name: 'Collect Customer Due Payments' },
            { id: 403, code: 'transfer_funds', name: 'Internal Bank & Cash Drawer Transfers' },
            { id: 404, code: 'record_expense', name: 'Record Daily Shop & Staff Expenses' },
            { id: 405, code: 'close_cash_drawer', name: 'Perform Day-Close Settlement' },
        ]
    },
    {
        module: 'SOC & Access Security',
        permissions: [
            { id: 501, code: 'view_audit_logs', name: 'View SIEM Security & Audit Logs' },
            { id: 502, code: 'manage_staff_users', name: 'Manage Staff & Technician Logins' },
            { id: 503, code: 'manage_device_ids', name: 'Authorize Hardware Device IDs' },
            { id: 504, code: 'manage_ip_firewall', name: 'Configure IP Whitelist & Blacklist' },
            { id: 505, code: 'edit_role_permissions', name: 'Modify Security Role Permission Matrix' },
        ]
    }
];

const DEFAULT_ROLES = [
    {
        id: 1,
        name: 'Super Admin',
        description: 'Complete unrestricted control across all modules, accounts, and security settings.',
        permission_codes: [
            'create_sale', 'edit_sale', 'delete_invoice', 'peek_cost_margin', 'approve_discount', 'print_sale_invoice',
            'view_inventory', 'add_product', 'edit_product', 'adjust_stock', 'manage_purchases',
            'view_projects', 'create_project', 'assign_technician', 'update_project_status', 'approve_tech_wallet', 'manage_offline_warranty',
            'view_accounts', 'collect_payment', 'transfer_funds', 'record_expense', 'close_cash_drawer',
            'view_audit_logs', 'manage_staff_users', 'manage_device_ids', 'manage_ip_firewall', 'edit_role_permissions'
        ]
    },
    {
        id: 2,
        name: 'Admin',
        description: 'Store operations, staff supervision, sales approvals, stock adjustments, and accounts oversight.',
        permission_codes: [
            'create_sale', 'edit_sale', 'peek_cost_margin', 'approve_discount', 'print_sale_invoice',
            'view_inventory', 'add_product', 'edit_product', 'adjust_stock', 'manage_purchases',
            'view_projects', 'create_project', 'assign_technician', 'update_project_status', 'approve_tech_wallet', 'manage_offline_warranty',
            'view_accounts', 'collect_payment', 'transfer_funds', 'record_expense', 'close_cash_drawer', 'view_audit_logs'
        ]
    },
    {
        id: 3,
        name: 'Salesman',
        description: 'Counter POS billing, quotations, customer handling, and printing receipts. No cost peek.',
        permission_codes: ['create_sale', 'print_sale_invoice', 'view_inventory', 'view_projects', 'collect_payment']
    },
    {
        id: 4,
        name: 'Technician',
        description: 'Mobile technician app access, project task completion, warranty inspections, and Tech Wallet.',
        permission_codes: ['view_projects', 'update_project_status', 'manage_offline_warranty']
    },
    {
        id: 5,
        name: 'Staff',
        description: 'General store floor operations, stock lookup, and customer service assistance.',
        permission_codes: ['view_inventory', 'create_sale', 'print_sale_invoice', 'view_projects']
    },
    {
        id: 6,
        name: 'Cashier',
        description: 'Cash drawer balancing, billing, customer due collection, expense tracking, and day-close.',
        permission_codes: ['create_sale', 'print_sale_invoice', 'view_accounts', 'collect_payment', 'transfer_funds', 'record_expense', 'close_cash_drawer']
    }
];

module.exports = { DEFAULT_MODULES, DEFAULT_ROLES };
