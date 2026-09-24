const pool = require("../config/db");

let rolesMigrated = false;

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
            { id: 401, code: 'view_accounts', name: 'View Bank & Digital Wallet Balances' },
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
        permission_codes: ['create_sale', 'edit_sale', 'delete_invoice', 'peek_cost_margin', 'approve_discount', 'print_sale_invoice', 'view_inventory', 'add_product', 'edit_product', 'adjust_stock', 'manage_purchases', 'view_projects', 'create_project', 'assign_technician', 'update_project_status', 'approve_tech_wallet', 'manage_offline_warranty', 'view_accounts', 'collect_payment', 'transfer_funds', 'record_expense', 'close_cash_drawer', 'view_audit_logs', 'manage_staff_users', 'manage_device_ids', 'manage_ip_firewall', 'edit_role_permissions']
    },
    {
        id: 2,
        name: 'Branch Manager',
        description: 'Store operations, staff supervision, sales approvals, stock adjustments, and accounts oversight.',
        permission_codes: ['create_sale', 'edit_sale', 'peek_cost_margin', 'approve_discount', 'print_sale_invoice', 'view_inventory', 'add_product', 'edit_product', 'adjust_stock', 'manage_purchases', 'view_projects', 'create_project', 'assign_technician', 'update_project_status', 'approve_tech_wallet', 'manage_offline_warranty', 'view_accounts', 'collect_payment', 'transfer_funds', 'record_expense', 'close_cash_drawer', 'view_audit_logs']
    },
    {
        id: 3,
        name: 'Sales Executive',
        description: 'Counter POS billing, quotations, customer handling, and printing receipts. No cost peek.',
        permission_codes: ['create_sale', 'print_sale_invoice', 'view_inventory', 'view_projects', 'collect_payment']
    },
    {
        id: 4,
        name: 'Field Technician',
        description: 'Mobile technician app access, project task completion, warranty inspections, and Tech Wallet.',
        permission_codes: ['view_projects', 'update_project_status', 'manage_offline_warranty']
    },
    {
        id: 5,
        name: 'Inventory Officer',
        description: 'Warehouse goods receipt, serial/barcode generation, purchases, supplier catalog management.',
        permission_codes: ['view_inventory', 'add_product', 'edit_product', 'adjust_stock', 'manage_purchases']
    },
    {
        id: 6,
        name: 'Accountant',
        description: 'Cash drawer balancing, bank reconciliations, vendor payments, expense tracking, and day-close.',
        permission_codes: ['view_accounts', 'collect_payment', 'transfer_funds', 'record_expense', 'close_cash_drawer', 'print_sale_invoice']
    }
];

async function ensureRolesAndPermissions() {
    if (rolesMigrated) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                permissions JSONB DEFAULT '[]'::jsonb
            );

            CREATE TABLE IF NOT EXISTS permissions (
                id SERIAL PRIMARY KEY,
                module_name VARCHAR(100) NOT NULL,
                name VARCHAR(100) NOT NULL,
                code VARCHAR(100) NOT NULL UNIQUE
            );

            CREATE TABLE IF NOT EXISTS role_permissions (
                id SERIAL PRIMARY KEY,
                role_id INT REFERENCES roles(id) ON DELETE CASCADE,
                permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
                UNIQUE (role_id, permission_id)
            );
        `);

        // Seed permissions table
        for (let mod of DEFAULT_MODULES) {
            for (let p of mod.permissions) {
                await pool.query(
                    "INSERT INTO permissions (id, module_name, name, code) VALUES ($1, $2, $3, $4) ON CONFLICT (code) DO UPDATE SET module_name = EXCLUDED.module_name, name = EXCLUDED.name;",
                    [p.id, mod.module, p.name, p.code]
                );
            }
        }

        // Seed roles table
        for (let r of DEFAULT_ROLES) {
            await pool.query(
                "INSERT INTO roles (id, name, description, permissions) VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, permissions = EXCLUDED.permissions;",
                [r.id, r.name, r.description, JSON.stringify(r.permission_codes)]
            );
        }

        rolesMigrated = true;
    } catch (e) {
        console.warn("Roles and permissions migration notice:", e.message);
    }
}

// 1. Get All Permissions Grouped by Module
exports.getAllPermissions = async (req, res) => {
    try {
        await ensureRolesAndPermissions();
        const query = "SELECT module_name, json_agg(json_build_object('id', id, 'name', name, 'code', code) ORDER BY id ASC) as permissions FROM permissions GROUP BY module_name ORDER BY MIN(id) ASC;";
        const result = await pool.query(query);
        return res.status(200).json({ success: true, data: result.rows.length > 0 ? result.rows : DEFAULT_MODULES });
    } catch (error) {
        return res.status(200).json({ success: true, data: DEFAULT_MODULES });
    }
};

// 2. Get All Roles with Assigned Permissions
exports.getAllRoles = async (req, res) => {
    try {
        await ensureRolesAndPermissions();
        const result = await pool.query("SELECT * FROM roles ORDER BY id ASC;");
        return res.status(200).json({ success: true, data: result.rows.length > 0 ? result.rows : DEFAULT_ROLES });
    } catch (error) {
        return res.status(200).json({ success: true, data: DEFAULT_ROLES });
    }
};

// 3. Assign Permissions to Role
exports.assignPermissionsToRole = async (req, res) => {
    const client = await pool.connect();
    try {
        await ensureRolesAndPermissions();
        const { role_id, permission_codes = [] } = req.body;
        if (!role_id) return res.status(400).json({ success: false, message: "রোল আইডি প্রদান করুন।" });

        await client.query("BEGIN");
        // Update permissions JSONB in roles table
        await client.query("UPDATE roles SET permissions = $1 WHERE id = $2", [JSON.stringify(permission_codes), role_id]);

        // Sync with role_permissions table if IDs are resolved
        const perms = await client.query("SELECT id, code FROM permissions WHERE code = ANY($1)", [permission_codes]);
        await client.query("DELETE FROM role_permissions WHERE role_id = $1", [role_id]);
        for (let p of perms.rows) {
            await client.query("INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [role_id, p.id]);
        }

        await client.query("COMMIT");
        return res.status(200).json({ success: true, message: "রোল পারমিশন সফলভাবে আপডেট ও সুরক্ষিত করা হয়েছে!" });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Assign permissions error:", error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

// 4. Create Custom Role
exports.createRole = async (req, res) => {
    try {
        await ensureRolesAndPermissions();
        const { name, description, permissions = [] } = req.body;
        if (!name) return res.status(400).json({ success: false, message: "রোলের নাম প্রদান করুন।" });

        const result = await pool.query(
            "INSERT INTO roles (name, description, permissions) VALUES ($1, $2, $3) RETURNING *",
            [name.trim(), description ? description.trim() : null, JSON.stringify(permissions)]
        );
        return res.status(201).json({ success: true, message: "নতুন রোল তৈরি হয়েছে!", data: result.rows[0] });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};