const pool = require("../config/db");
const { DEFAULT_MODULES, DEFAULT_ROLES } = require("./roles/roleConstants");

let rolesMigrated = false;

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
            ALTER TABLE roles ADD COLUMN IF NOT EXISTS description TEXT;

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

        for (let mod of DEFAULT_MODULES) {
            for (let p of mod.permissions) {
                await pool.query(
                    "INSERT INTO permissions (id, module_name, name, code) VALUES ($1, $2, $3, $4) ON CONFLICT (code) DO UPDATE SET module_name = EXCLUDED.module_name, name = EXCLUDED.name;",
                    [p.id, mod.module, p.name, p.code]
                );
            }
        }

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

// 3. Assign Permissions to Role (Supports Single Role or Bulk Roles Matrix)
exports.assignPermissionsToRole = async (req, res) => {
    const client = await pool.connect();
    try {
        await ensureRolesAndPermissions();
        const { roles, role_id, permission_codes = [] } = req.body;

        await client.query("BEGIN");

        const targetRoles = Array.isArray(roles) && roles.length > 0
            ? roles
            : (role_id ? [{ role_id, permission_codes }] : []);

        if (targetRoles.length === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: "রোল বা পারমিশন ডাটা প্রদান করুন।" });
        }

        for (const item of targetRoles) {
            const rId = item.role_id || item.id;
            const pCodes = item.permission_codes || item.permissions || [];
            await client.query("UPDATE roles SET permissions = $1 WHERE id = $2", [JSON.stringify(pCodes), rId]);

            const perms = await client.query("SELECT id, code FROM permissions WHERE code = ANY($1)", [pCodes]);
            await client.query("DELETE FROM role_permissions WHERE role_id = $1", [rId]);
            for (const p of perms.rows) {
                await client.query("INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [rId, p.id]);
            }
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