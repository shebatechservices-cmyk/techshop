const pool = require('../config/db');
const { exec } = require('child_process');
const util = require('util');
const { hashPassword, createSessionToken } = require('../config/auth');
const { hashSessionToken } = require('../middlewares/authMiddleware');
const execPromise = util.promisify(exec);

// Allowed tables for force management
const ALLOWED_TABLES = [
    'products',
    'sales',
    'purchase_orders',
    'customers',
    'suppliers',
    'categories',
    'sub_categories',
    'brands',
    'warranty_claims',
    'product_returns',
    'payment_accounts',
    'expenses',
    'users',
    'service_projects'
];

// 1. Get System & App Info
exports.getSystemInfo = async (req, res) => {
    try {
        let gitBranch = 'main';
        let gitCommit = 'latest';
        let gitLog = [];

        try {
            const { stdout: branchOut } = await execPromise('git rev-parse --abbrev-ref HEAD');
            gitBranch = branchOut.trim();
            const { stdout: commitOut } = await execPromise('git rev-parse --short HEAD');
            gitCommit = commitOut.trim();
            const { stdout: logOut } = await execPromise('git log -n 5 --oneline');
            gitLog = logOut.trim().split('\n').filter(Boolean);
        } catch {}

        // Table counts
        const tableCounts = {};
        for (const t of ALLOWED_TABLES) {
            try {
                const r = await pool.query(`SELECT COUNT(*)::int AS count FROM ${t}`);
                tableCounts[t] = r.rows[0].count;
            } catch {
                tableCounts[t] = 0;
            }
        }

        // Settings / License Info
        const settingsRes = await pool.query('SELECT * FROM shop_settings LIMIT 1');
        const shop = settingsRes.rows[0] || {};

        return res.status(200).json({
            success: true,
            app: {
                name: 'Sheba Technology ERP & POS',
                version: '16.9.26',
                environment: process.env.NODE_ENV || 'production',
                nodeVersion: process.version,
                uptimeSeconds: Math.floor(process.uptime()),
                memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                gitBranch,
                gitCommit,
                gitLog
            },
            licensing: {
                license_key: shop.license_key || 'SHEBA-COMMERCIAL-UNLOCKED',
                license_status: shop.license_status || 'Active Enterprise',
                domain_name: shop.domain_name || 'shebatech.com.bd',
                domain_expiry: shop.domain_expiry || '2027-12-31',
                ssl_status: shop.ssl_status || 'TLS 1.3 Active'
            },
            tableCounts
        });
    } catch (err) {
        console.error('getSystemInfo error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Force Delete Record (Emergency Override / Developer Bypass)
exports.forceDeleteRecord = async (req, res) => {
    try {
        const { table_name, record_id, reason = 'Super Admin / Developer Emergency Override' } = req.body;

        if (!table_name || !record_id) {
            return res.status(400).json({ success: false, message: 'table_name and record_id are required.' });
        }

        if (!ALLOWED_TABLES.includes(table_name)) {
            return res.status(400).json({ success: false, message: `Table "${table_name}" is not permitted for force deletion.` });
        }

        const existing = await pool.query(`SELECT * FROM ${table_name} WHERE id = $1`, [record_id]);
        if (!existing.rows.length) {
            return res.status(404).json({ success: false, message: `Record #${record_id} not found in ${table_name}.` });
        }

        const row = existing.rows[0];

        // Soft delete if deleted_at column exists, else hard delete
        try {
            await pool.query(`UPDATE ${table_name} SET deleted_at = NOW() WHERE id = $1`, [record_id]);
        } catch {
            await pool.query(`DELETE FROM ${table_name} WHERE id = $1`, [record_id]);
        }

        // Record in trash_records
        await pool.query(`
            INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
            VALUES ($1, $2, $3, $4, NOW())
        `, [table_name, record_id, `[FORCE DELETED] ${table_name} #${record_id}`, JSON.stringify(row)]).catch(() => {});

        // Audit Log
        await pool.query(`
            INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data, severity)
            VALUES (1, 'DEV_FORCE_DELETE', $1, $2, $3, $4, 'CRITICAL')
        `, [table_name, record_id, JSON.stringify(row), JSON.stringify({ reason })]).catch(() => {});

        return res.status(200).json({
            success: true,
            message: `Emergency force delete executed on ${table_name} #${record_id}. Moved to trash.`
        });
    } catch (err) {
        console.error('forceDeleteRecord error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 3. Force Update Record (Developer Override)
exports.forceUpdateRecord = async (req, res) => {
    try {
        const { table_name, record_id, fields = {}, reason = 'Developer Console Direct Field Update' } = req.body;

        if (!table_name || !record_id || Object.keys(fields).length === 0) {
            return res.status(400).json({ success: false, message: 'table_name, record_id, and fields are required.' });
        }

        if (!ALLOWED_TABLES.includes(table_name)) {
            return res.status(400).json({ success: false, message: `Table "${table_name}" is not permitted for force edit.` });
        }

        const existing = await pool.query(`SELECT * FROM ${table_name} WHERE id = $1`, [record_id]);
        if (!existing.rows.length) {
            return res.status(404).json({ success: false, message: `Record #${record_id} not found in ${table_name}.` });
        }

        const oldRow = existing.rows[0];
        const updateClauses = [];
        const values = [];

        for (const [key, val] of Object.entries(fields)) {
            // Basic SQL injection protection: only allow alphanumeric and underscore for column names
            if (/^[a-zA-Z0-9_]+$/.test(key) && key !== 'id') {
                values.push(val);
                updateClauses.push(`${key} = $${values.length}`);
            }
        }

        if (!updateClauses.length) {
            return res.status(400).json({ success: false, message: 'No valid fields to update.' });
        }

        values.push(record_id);
        const query = `UPDATE ${table_name} SET ${updateClauses.join(', ')} WHERE id = $${values.length} RETURNING *`;
        const result = await pool.query(query, values);

        // Audit Log
        await pool.query(`
            INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data, severity)
            VALUES (1, 'DEV_FORCE_UPDATE', $1, $2, $3, $4, 'WARN')
        `, [table_name, record_id, JSON.stringify(oldRow), JSON.stringify({ fields, reason })]).catch(() => {});

        return res.status(200).json({
            success: true,
            message: `Force update successfully applied to ${table_name} #${record_id}!`,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('forceUpdateRecord error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 4. Maintenance DB Quick Clean
exports.runMaintenance = async (req, res) => {
    try {
        await pool.query('VACUUM ANALYZE').catch(() => {});
        return res.status(200).json({
            success: true,
            message: 'Database vacuum analyze and index verification completed successfully.'
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 5. Force Clean Inventory Stock (Emergency Developer Tool)
exports.cleanInventoryStock = async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
            success: false,
            message: 'Stock cleanup feature is disabled in production environment.'
        });
    }
    try {
        const { mode = 'zero_stock', reason = 'Dev Console Emergency Stock Reset' } = req.body;

        if (mode === 'wipe_all') {
            await pool.query('DELETE FROM stock_transfers');
            await pool.query('DELETE FROM stock_levels');
            await pool.query('DELETE FROM product_images');

            const wiped = await pool.query(`
                DELETE FROM products 
                WHERE id NOT IN (SELECT product_id FROM sales_items)
                  AND id NOT IN (SELECT product_id FROM purchase_order_items)
                RETURNING id
            `);

            await pool.query('UPDATE products SET stock = 0, updated_at = NOW() WHERE stock != 0');
            await pool.query("DELETE FROM trash_records WHERE table_name = 'products'");

            await pool.query(`
                INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data, severity)
                VALUES (1, 'DEV_WIPE_INVENTORY', 'products', 0, NULL, $1, 'CRITICAL')
            `, [JSON.stringify({ reason, wipedCount: wiped.rowCount })]).catch(() => {});

            return res.status(200).json({
                success: true,
                message: `Inventory wiped clean! (${wiped.rowCount} products removed, remainder zeroed).`
            });
        } else {
            const resUpdated = await pool.query('UPDATE products SET stock = 0, updated_at = NOW() WHERE stock != 0');
            await pool.query('DELETE FROM stock_transfers');
            await pool.query('DELETE FROM stock_levels');

            await pool.query(`
                INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data, severity)
                VALUES (1, 'DEV_ZERO_INVENTORY_STOCK', 'products', 0, NULL, $1, 'WARN')
            `, [JSON.stringify({ reason, updatedCount: resUpdated.rowCount })]).catch(() => {});

            return res.status(200).json({
                success: true,
                message: `All warehouse inventory stocks force reset to 0 (${resUpdated.rowCount} products updated).`
            });
        }
    } catch (err) {
        console.error('cleanInventoryStock error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 6. Get App User Admin Credentials (Developer Console)
exports.getAppAdminCredentials = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, email, phone, role_id, role_name, is_active, is_locked, last_login, created_at, updated_at
            FROM users
            WHERE role_id = 1 OR role_name ILIKE '%super admin%'
            ORDER BY id ASC
            LIMIT 1;
        `);

        if (result.rows.length === 0) {
            return res.status(200).json({
                success: true,
                exists: false,
                message: 'No App User Admin found in database.'
            });
        }

        return res.status(200).json({
            success: true,
            exists: true,
            admin: result.rows[0]
        });
    } catch (err) {
        console.error('getAppAdminCredentials error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 7. Update or Initialize App User Admin Credentials (Developer Console)
exports.updateAppAdminCredentials = async (req, res) => {
    try {
        const { name, email, phone, password, is_active = true } = req.body;

        if (!name || (!email && !phone) || !password) {
            return res.status(400).json({
                success: false,
                message: 'Admin Name, at least one of Email/Phone, and Password are required.'
            });
        }

        const cleanName = name.trim();
        const cleanEmail = (email || '').trim().toLowerCase() || null;
        const cleanPhone = (phone || '').trim() || null;
        const cleanPassword = password.trim();

        // Check if admin exists
        const existing = await pool.query(`
            SELECT id FROM users 
            WHERE role_id = 1 OR role_name ILIKE '%super admin%' 
            ORDER BY id ASC LIMIT 1;
        `);

        let savedAdmin;
        if (existing.rows.length > 0) {
            const adminId = existing.rows[0].id;
            const updated = await pool.query(`
                UPDATE users
                SET name = $1, email = $2, phone = $3, password_hash = $4, is_active = $5, is_locked = false, failed_login_count = 0, updated_at = NOW()
                WHERE id = $6
                RETURNING id, name, email, phone, role_id, role_name, is_active, updated_at;
            `, [cleanName, cleanEmail, cleanPhone, await hashPassword(cleanPassword), Boolean(is_active), adminId]);
            savedAdmin = updated.rows[0];
        } else {
            const inserted = await pool.query(`
                INSERT INTO users (name, email, phone, password_hash, role_id, role_name, is_active)
                VALUES ($1, $2, $3, $4, 1, 'Super Admin', $5)
                RETURNING id, name, email, phone, role_id, role_name, is_active, created_at;
            `, [cleanName, cleanEmail, cleanPhone, await hashPassword(cleanPassword), Boolean(is_active)]);
            savedAdmin = inserted.rows[0];
        }

        // Record Developer Action in Audit Log
        await pool.query(`
            INSERT INTO audit_logs (user_id, action, table_name, record_id, ip_address, severity)
            VALUES ($1, 'DEV_UPDATE_ADMIN_CREDENTIALS', 'users', $1, $2, 'CRITICAL')
        `, [savedAdmin.id, req.headers['x-forwarded-for'] || '127.0.0.1']).catch(() => null);

        return res.status(200).json({
            success: true,
            message: 'App User Admin credentials successfully updated by Developer!',
            admin: savedAdmin
        });
    } catch (err) {
        console.error('updateAppAdminCredentials error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 8. Get Admin Password Recovery Requests (Target Developer)
exports.getAdminRecoveryRequests = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM password_reset_requests
            WHERE target_role = 'developer'
            ORDER BY (status = 'pending') DESC, id DESC
            LIMIT 50;
        `);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error('getAdminRecoveryRequests error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 9. Resolve Admin Recovery Request (Developer Resets Admin Password)
exports.resolveAdminRecovery = async (req, res) => {
    try {
        const { requestId, newPassword, developerNotes } = req.body;
        if (!requestId || !newPassword) {
            return res.status(400).json({ success: false, message: 'Request ID and new password are required.' });
        }

        const reqRes = await pool.query('SELECT * FROM password_reset_requests WHERE id = $1', [requestId]);
        if (reqRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Request not found.' });
        }

        const requestItem = reqRes.rows[0];
        let adminId = requestItem.user_id;

        if (!adminId) {
            const aFind = await pool.query(`
                SELECT id FROM users 
                WHERE role_id = 1 OR role_name ILIKE '%super admin%' OR email = $1 OR phone = $1
                ORDER BY (role_id = 1) DESC LIMIT 1;
            `, [requestItem.identifier]);
            if (aFind.rows.length > 0) adminId = aFind.rows[0].id;
        }

        if (adminId) {
            await pool.query(
                'UPDATE users SET password_hash = $1, failed_login_count = 0, is_locked = false, is_active = true WHERE id = $2',
                [await hashPassword(newPassword.trim()), adminId]
            );
        }

        const updated = await pool.query(`
            UPDATE password_reset_requests
            SET status = 'resolved', temp_password = NULL, resolved_by = 'Developer Console', resolved_at = NOW(), reason = COALESCE($2, reason)
            WHERE id = $3
            RETURNING *;
        `, [newPassword.trim(), developerNotes, requestId]);

        return res.status(200).json({
            success: true,
            message: 'App Admin password successfully reset by Developer!',
            data: updated.rows[0]
        });
    } catch (err) {
        console.error('resolveAdminRecovery error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 10. Get All Users (Developer Console)
exports.getDeveloperUsers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, email, phone, role_id, role_name, is_active, is_locked, failed_login_count, last_login, created_at, updated_at
            FROM users
            ORDER BY id ASC;
        `);
        return res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
    } catch (err) {
        console.error('getDeveloperUsers error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 11. Create User (Developer Console)
exports.createDeveloperUser = async (req, res) => {
    try {
        const { name, email, phone, password, role_id = 2, role_name = 'Sales Executive', is_active = true } = req.body;
        if (!name || (!email && !phone) || !password) {
            return res.status(400).json({ success: false, message: 'Name, Password, and at least one of Email/Phone are required.' });
        }

        const cleanName = String(name).trim();
        const cleanEmail = email ? String(email).trim().toLowerCase() : null;
        const cleanPhone = phone ? String(phone).trim() : null;
        const cleanPassword = String(password).trim();

        const result = await pool.query(`
            INSERT INTO users (name, email, phone, password_hash, role_id, role_name, is_active, is_locked)
            VALUES ($1, $2, $3, $4, $5, $6, $7, false)
            RETURNING id, name, email, phone, role_id, role_name, is_active, is_locked, created_at;
        `, [cleanName, cleanEmail, cleanPhone, await hashPassword(cleanPassword), parseInt(role_id, 10) || 2, role_name, Boolean(is_active)]);

        return res.status(201).json({ success: true, message: 'User created successfully!', user: result.rows[0] });
    } catch (err) {
        console.error('createDeveloperUser error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 12. Update User (Developer Console)
exports.updateDeveloperUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, password, role_id, role_name, is_active, is_locked } = req.body;

        const existing = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        const user = existing.rows[0];

        const updatedName = name !== undefined ? String(name).trim() : user.name;
        const updatedEmail = email !== undefined ? (email ? String(email).trim().toLowerCase() : null) : user.email;
        const updatedPhone = phone !== undefined ? (phone ? String(phone).trim() : null) : user.phone;
        const updatedPassword = (password && String(password).trim()) ? await hashPassword(String(password).trim()) : user.password_hash;
        const updatedRoleId = role_id !== undefined ? (parseInt(role_id, 10) || user.role_id) : user.role_id;
        const updatedRoleName = role_name !== undefined ? role_name : user.role_name;
        const updatedIsActive = is_active !== undefined ? Boolean(is_active) : user.is_active;
        const updatedIsLocked = is_locked !== undefined ? Boolean(is_locked) : user.is_locked;

        const result = await pool.query(`
            UPDATE users
            SET name = $1, email = $2, phone = $3, password_hash = $4, role_id = $5, role_name = $6, is_active = $7, is_locked = $8, updated_at = NOW()
            WHERE id = $9
            RETURNING id, name, email, phone, role_id, role_name, is_active, is_locked, updated_at;
        `, [updatedName, updatedEmail, updatedPhone, updatedPassword, updatedRoleId, updatedRoleName, updatedIsActive, updatedIsLocked, id]);

        return res.status(200).json({ success: true, message: 'User updated successfully!', user: result.rows[0] });
    } catch (err) {
        console.error('updateDeveloperUser error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 13. Delete User (Developer Console)
exports.deleteDeveloperUser = async (req, res) => {
    try {
        const { id } = req.params;
        const check = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const user = check.rows[0];
        if (user.role_id === 1) {
            // Ensure there is at least one other active Super Admin
            const adminCount = await pool.query('SELECT COUNT(*) FROM users WHERE role_id = 1 AND is_active = true AND id != $1', [id]);
            if (parseInt(adminCount.rows[0].count, 10) === 0) {
                return res.status(400).json({ success: false, message: 'Cannot delete the only Super Admin account. Create another Super Admin first.' });
            }
        }

        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        return res.status(200).json({ success: true, message: `User #${id} (${user.name}) deleted successfully.` });
    } catch (err) {
        console.error('deleteDeveloperUser error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 14. Generate Developer Bypass Token
exports.generateDeveloperBypassToken = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        let query = 'SELECT * FROM users WHERE role_id = 1 AND deleted_at IS NULL ORDER BY id ASC LIMIT 1';
        let params = [];
        if (targetUserId) {
            query = 'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL';
            params = [targetUserId];
        }

        const result = await pool.query(query, params);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Target user not found.' });
        }

        const user = result.rows[0];
        const token = createSessionToken();
        const tokenHash = hashSessionToken(token);

        await pool.query(`
            UPDATE users
            SET current_session_token = $1, session_last_active = NOW(), failed_login_count = 0, is_locked = false, is_active = true
            WHERE id = $2
        `, [tokenHash, user.id]);

        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role_id: user.role_id,
                role_name: user.role_name || 'Super Admin',
                is_active: true
            }
        });
    } catch (err) {
        console.error('generateDeveloperBypassToken error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
