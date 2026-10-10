const pool = require('../../config/db');

/**
 * Get technician personal wallet details, earnings, project tasks, and payout history
 */
exports.getStaffWallet = async (req, res) => {
    try {
        const userId = req.params.id || req.query.userId;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        const userRes = await pool.query(`
            SELECT id, name, phone, email, role, role_id, role_name, designation, wallet_balance, created_at
            FROM users
            WHERE id = $1 AND deleted_at IS NULL
        `, [userId]);

        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = userRes.rows[0];

        // Fetch assigned projects & commissions
        const projectsRes = await pool.query(`
            SELECT 
                sp.id,
                sp.project_code,
                sp.title,
                sp.status,
                sp.technician_status,
                sp.admin_confirmed,
                sp.charges,
                sp.setup_charge,
                sp.conveyance_cost,
                sp.meal_allowance,
                sp.start_date,
                sp.deadline,
                sp.completed_at,
                sp.created_at,
                c.name as customer_name,
                c.phone as customer_phone,
                sp.site_address
            FROM service_projects sp
            LEFT JOIN customers c ON sp.customer_id = c.id
            WHERE (sp.assigned_technician = $1 OR sp.technician_id = $1)
              AND sp.deleted_at IS NULL
            ORDER BY sp.id DESC
            LIMIT 50
        `, [userId]);

        // Aggregate project stats
        const projects = projectsRes.rows;
        let totalProjects = projects.length;
        let completedProjects = 0;
        let ongoingProjects = 0;
        let totalEarnedCommission = 0;

        projects.forEach(p => {
            const isCompleted = p.status === 'completed' || p.technician_status === 'completed' || p.admin_confirmed;
            if (isCompleted) {
                completedProjects++;
                const projectCommission = (parseFloat(p.charges) || 0) + (parseFloat(p.conveyance_cost) || 0) + (parseFloat(p.meal_allowance) || 0);
                totalEarnedCommission += projectCommission;
            } else {
                ongoingProjects++;
            }
        });

        // Fetch wallet transaction / payout history
        const walletHistoryRes = await pool.query(`
            SELECT 
                wt.id,
                wt.type,
                wt.amount,
                wt.credit,
                wt.reference,
                wt.note,
                wt.balance_before,
                wt.balance_after,
                wt.account_name,
                wt.party_name
            FROM wallet_transactions wt
            WHERE (wt.party_id = $1 AND wt.party_type IN ('technician', 'staff'))
               OR wt.reference ILIKE $2
            ORDER BY wt.id DESC
            LIMIT 30
        `, [userId, `%user-${userId}%`]);

        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    phone: user.phone,
                    email: user.email,
                    role: user.role,
                    roleName: user.role_name,
                    designation: user.designation,
                    walletBalance: parseFloat(user.wallet_balance || 0),
                    joinedAt: user.created_at
                },
                summary: {
                    walletBalance: parseFloat(user.wallet_balance || 0),
                    totalEarnedCommission,
                    totalProjects,
                    completedProjects,
                    ongoingProjects
                },
                projects,
                transactions: walletHistoryRes.rows
            }
        });
    } catch (err) {
        console.error('Error in getStaffWallet:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch technician wallet', error: err.message });
    }
};

/**
 * Adjust technician wallet balance manually by Admin
 */
exports.adjustStaffWallet = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, type = 'credit', note = '', reference = '' } = req.body;

        const valAmount = parseFloat(amount);
        if (isNaN(valAmount) || valAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid adjustment amount is required' });
        }

        const userRes = await pool.query('SELECT id, name, wallet_balance FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Staff member not found' });
        }

        const user = userRes.rows[0];
        const currentBal = parseFloat(user.wallet_balance || 0);
        const isCredit = type === 'credit';
        const newBal = isCredit ? currentBal + valAmount : Math.max(0, currentBal - valAmount);

        await pool.query('UPDATE users SET wallet_balance = $1, updated_at = NOW() WHERE id = $2', [newBal, id]);

        // Log transaction
        await pool.query(`
            INSERT INTO wallet_transactions (
                party_type, party_id, party_name, type, amount, credit,
                reference, note, balance_before, balance_after
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
            'technician',
            user.id,
            user.name,
            isCredit ? 'ADMIN_WALLET_CREDIT' : 'ADMIN_WALLET_DEBIT',
            valAmount,
            isCredit,
            reference || `Admin Adjustment: User #${user.id}`,
            note || (isCredit ? 'Wallet credit added by Admin' : 'Wallet debit/payout by Admin'),
            currentBal,
            newBal
        ]).catch(() => null);

        return res.status(200).json({
            success: true,
            message: `Wallet of "${user.name}" updated. New balance: ৳${newBal.toLocaleString()}`,
            data: {
                walletBalance: newBal
            }
        });
    } catch (err) {
        console.error('Error in adjustStaffWallet:', err);
        return res.status(500).json({ success: false, message: 'Failed to adjust wallet balance', error: err.message });
    }
};
