const pool = require('../../config/db');

/**
 * Get all staff members with stats & filtering
 */
exports.getStaff = async (req, res) => {
    try {
        const { search = '', role_id, role, status = 'all', page = 1, limit = 50 } = req.query;
        const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

        let whereClauses = ['u.deleted_at IS NULL'];
        const values = [];
        let valIndex = 1;

        if (search && search.trim()) {
            const term = `%${search.trim()}%`;
            whereClauses.push(`(u.name ILIKE $${valIndex} OR u.phone ILIKE $${valIndex} OR u.email ILIKE $${valIndex} OR u.designation ILIKE $${valIndex})`);
            values.push(term);
            valIndex++;
        }

        if (role && role !== 'all') {
            whereClauses.push(`u.role = $${valIndex}`);
            values.push(role.toUpperCase());
            valIndex++;
        } else if (role_id && role_id !== 'all') {
            whereClauses.push(`u.role_id = $${valIndex}`);
            values.push(parseInt(role_id, 10));
            valIndex++;
        }

        if (status === 'active') {
            whereClauses.push(`u.is_active = true AND u.is_locked = false`);
        } else if (status === 'inactive') {
            whereClauses.push(`(u.is_active = false OR u.is_locked = true)`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Query staff list
        const listQuery = `
            SELECT 
                u.id,
                u.name,
                u.phone,
                u.email,
                u.role,
                u.role_id,
                COALESCE(r.name, u.role_name, 'Staff') AS role_name,
                u.is_active,
                u.is_locked,
                u.approval_status,
                u.designation,
                u.salary,
                u.wallet_balance,
                u.address,
                u.emergency_contact,
                u.joining_date,
                u.notes,
                u.last_login,
                u.created_at
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            ${whereSql}
            ORDER BY u.id ASC
            LIMIT $${valIndex} OFFSET $${valIndex + 1}
        `;
        values.push(parseInt(limit, 10), offset);

        const [staffResult, countResult, statsResult] = await Promise.all([
            pool.query(listQuery, values),
            pool.query(`SELECT COUNT(*) AS total FROM users u ${whereSql}`, values.slice(0, valIndex - 1)),
            pool.query(`
                SELECT 
                    COUNT(*) AS total_staff,
                    COUNT(*) FILTER (WHERE is_active = true AND is_locked = false) AS active_staff,
                    COUNT(*) FILTER (WHERE is_active = false OR is_locked = true) AS inactive_staff,
                    COUNT(*) FILTER (WHERE role = 'ADMIN' OR role_id IN (1, 2) OR LOWER(role_name) LIKE '%admin%') AS admin_count,
                    COUNT(*) FILTER (WHERE role = 'TECHNICIAN' OR role_id = 4 OR LOWER(role_name) LIKE '%tech%') AS tech_count,
                    COALESCE(SUM(salary), 0) AS total_monthly_payroll,
                    COALESCE(SUM(wallet_balance), 0) AS total_technician_wallets
                FROM users
                WHERE deleted_at IS NULL
            `)
        ]);

        const stats = statsResult.rows[0] || {
            total_staff: 0,
            active_staff: 0,
            inactive_staff: 0,
            admin_count: 0,
            tech_count: 0,
            total_monthly_payroll: 0,
            total_technician_wallets: 0
        };

        return res.status(200).json({
            success: true,
            data: staffResult.rows,
            total: parseInt(countResult.rows[0]?.total || 0, 10),
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            stats: {
                totalStaff: parseInt(stats.total_staff, 10),
                activeStaff: parseInt(stats.active_staff, 10),
                inactiveStaff: parseInt(stats.inactive_staff, 10),
                adminCount: parseInt(stats.admin_count, 10),
                techCount: parseInt(stats.tech_count, 10),
                totalMonthlyPayroll: parseFloat(stats.total_monthly_payroll || 0),
                totalTechnicianWallets: parseFloat(stats.total_technician_wallets || 0)
            }
        });
    } catch (err) {
        console.error('Error in getStaff:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch staff members', error: err.message });
    }
};

/**
 * Get available roles for assignment
 */
exports.getRoles = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, permissions, description FROM roles ORDER BY id ASC');
        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error in getRoles:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch roles', error: err.message });
    }
};

/**
 * Get single staff member by ID
 */
exports.getStaffById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT 
                u.id,
                u.name,
                u.phone,
                u.email,
                u.role,
                u.role_id,
                COALESCE(r.name, u.role_name, 'Staff') AS role_name,
                r.permissions AS role_permissions,
                u.is_active,
                u.is_locked,
                u.approval_status,
                u.designation,
                u.salary,
                u.wallet_balance,
                u.address,
                u.emergency_contact,
                u.joining_date,
                u.notes,
                u.last_login,
                u.created_at
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = $1 AND u.deleted_at IS NULL
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Staff member not found' });
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error in getStaffById:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch staff member', error: err.message });
    }
};
