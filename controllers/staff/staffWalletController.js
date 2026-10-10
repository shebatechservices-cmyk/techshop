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

/**
 * Technician submits a withdrawal or deposit request with reference / TrxID
 */
exports.submitWalletRequest = async (req, res) => {
    try {
        const userId = req.params.id || req.body.technician_id;
        const { type = 'withdraw', amount, channel = 'bkash', reference_id = '', notes = '' } = req.body;

        const valAmount = parseFloat(amount);
        if (isNaN(valAmount) || valAmount <= 0) {
            return res.status(400).json({ success: false, message: 'সঠিক টাকার পরিমাণ দিন।' });
        }

        const userRes = await pool.query('SELECT id, name, wallet_balance FROM users WHERE id = $1 AND deleted_at IS NULL', [userId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'টেকনিশিয়ান পাওয়া যায়নি।' });
        }

        const user = userRes.rows[0];
        const currentBal = parseFloat(user.wallet_balance || 0);

        if (type === 'withdraw' && valAmount > currentBal) {
            return res.status(400).json({ 
                success: false, 
                message: `অপর্যাপ্ত ব্যালেন্স! আপনার বর্তমান ওয়ালেট ব্যালেন্স ৳${currentBal.toLocaleString()}, এর বেশি উইথড্র করা সম্ভব নয়।` 
            });
        }

        const insertRes = await pool.query(`
            INSERT INTO technician_wallet_requests (
                technician_id, technician_name, type, amount, channel, reference_id, notes, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
            RETURNING *
        `, [user.id, user.name, type, valAmount, channel, reference_id, notes]);

        return res.status(201).json({
            success: true,
            message: `আপনার ৳${valAmount.toLocaleString()} টাকার ${type === 'withdraw' ? 'উইথড্র' : 'ডিপোজিট'} রিকোয়েস্ট সাবমিট হয়েছে। শপ অ্যাডমিন যাচাই করে পোস্টিং বা পেমেন্ট সম্পন্ন করবেন।`,
            data: insertRes.rows[0]
        });
    } catch (err) {
        console.error('Error in submitWalletRequest:', err);
        return res.status(500).json({ success: false, message: 'রিকোয়েস্ট সাবমিট করতে সমস্যা হয়েছে', error: err.message });
    }
};

/**
 * Get wallet requests for a specific technician
 */
exports.getStaffWalletRequests = async (req, res) => {
    try {
        const userId = req.params.id;
        const result = await pool.query(`
            SELECT * FROM technician_wallet_requests
            WHERE technician_id = $1
            ORDER BY id DESC
            LIMIT 50
        `, [userId]);

        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error in getStaffWalletRequests:', err);
        return res.status(500).json({ success: false, message: 'রিকোয়েস্ট লোড করতে সমস্যা হয়েছে', error: err.message });
    }
};

/**
 * Admin: Get all pending technician wallet requests
 */
exports.getPendingWalletRequests = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT twr.*, u.phone as technician_phone, u.wallet_balance as current_balance
            FROM technician_wallet_requests twr
            LEFT JOIN users u ON u.id = twr.technician_id
            WHERE twr.status = 'pending'
            ORDER BY twr.id DESC
        `);

        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error in getPendingWalletRequests:', err);
        return res.status(500).json({ success: false, message: 'পেন্ডিং রিকোয়েস্ট লোড করতে সমস্যা হয়েছে', error: err.message });
    }
};

/**
 * Admin: Approve or Reject a technician wallet request (Post payment / adjust account)
 */
exports.respondWalletRequest = async (req, res) => {
    const client = await pool.connect();
    try {
        const { requestId } = req.params;
        const { action = 'approve', source_account_id, admin_notes = '', admin_id = null, admin_name = 'Shop Admin' } = req.body;

        const reqRes = await client.query('SELECT * FROM technician_wallet_requests WHERE id = $1', [requestId]);
        if (reqRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'রিকোয়েস্ট পাওয়া যায়নি।' });
        }

        const walletReq = reqRes.rows[0];
        if (walletReq.status !== 'pending') {
            return res.status(400).json({ success: false, message: `এই রিকোয়েস্টটি ইতিমধ্যে ${walletReq.status} করা হয়েছে।` });
        }

        await client.query('BEGIN');

        if (action === 'reject') {
            await client.query(`
                UPDATE technician_wallet_requests 
                SET status = 'rejected', admin_id = $1, admin_name = $2, admin_notes = $3, processed_at = NOW()
                WHERE id = $4
            `, [admin_id, admin_name, admin_notes, requestId]);

            await client.query('COMMIT');
            return res.status(200).json({ success: true, message: 'রিকোয়েস্টটি বাতিল করা হয়েছে।' });
        }

        // Action: Approve
        const userRes = await client.query('SELECT id, name, wallet_balance FROM users WHERE id = $1', [walletReq.technician_id]);
        if (userRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'টেকনিশিয়ান অ্যাকাউন্ট পাওয়া যায়নি।' });
        }

        const user = userRes.rows[0];
        const currentBal = parseFloat(user.wallet_balance || 0);
        const reqAmount = parseFloat(walletReq.amount);

        let newBal = currentBal;
        if (walletReq.type === 'withdraw') {
            newBal = Math.max(0, currentBal - reqAmount);
        } else if (walletReq.type === 'deposit') {
            newBal = currentBal + reqAmount;
        }

        // Update user's wallet
        await client.query('UPDATE users SET wallet_balance = $1, updated_at = NOW() WHERE id = $2', [newBal, user.id]);

        // If source account provided (e.g. Cash Drawer or Bank)
        let sourceAccountName = walletReq.channel || 'Cash Drawer';
        if (source_account_id) {
            const accRes = await client.query('SELECT id, name, balance FROM payment_accounts WHERE id = $1', [source_account_id]);
            if (accRes.rows.length > 0) {
                const acc = accRes.rows[0];
                sourceAccountName = acc.name;
                const newAccBal = walletReq.type === 'withdraw' 
                    ? parseFloat(acc.balance || 0) - reqAmount 
                    : parseFloat(acc.balance || 0) + reqAmount;
                await client.query('UPDATE payment_accounts SET balance = $1 WHERE id = $2', [newAccBal, acc.id]);

                // Record into account_transactions
                await client.query(`
                    INSERT INTO account_transactions (account_id, type, amount, reference, note, created_at)
                    VALUES ($1, $2, $3, $4, $5, NOW())
                `, [
                    acc.id,
                    walletReq.type === 'withdraw' ? 'withdraw' : 'deposit',
                    reqAmount,
                    `Tech Request #${walletReq.id} (Ref: ${walletReq.reference_id || 'N/A'})`,
                    `Technician ${user.name} ${walletReq.type === 'withdraw' ? 'Payout' : 'Deposit'} via ${walletReq.channel}`
                ]).catch(() => null);
            }
        }

        // Insert into wallet_transactions
        await client.query(`
            INSERT INTO wallet_transactions (
                party_type, party_id, party_name, type, amount, credit,
                account_name, reference, note, balance_before, balance_after, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        `, [
            'technician',
            user.id,
            user.name,
            walletReq.type === 'withdraw' ? 'TECH_WITHDRAW_PAYOUT' : 'TECH_DEPOSIT_CREDIT',
            reqAmount,
            walletReq.type === 'deposit',
            sourceAccountName,
            walletReq.reference_id || `Req #${walletReq.id}`,
            walletReq.notes || `Approved by ${admin_name}. ${admin_notes}`,
            currentBal,
            newBal
        ]).catch(() => null);

        // Update request status
        await client.query(`
            UPDATE technician_wallet_requests 
            SET status = 'approved', admin_id = $1, admin_name = $2, admin_notes = $3, processed_at = NOW()
            WHERE id = $4
        `, [admin_id, admin_name, admin_notes, requestId]);

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: `✓ রিকোয়েস্ট অনুমোদিত ও পোস্টিং সম্পন্ন হয়েছে! টেকনিশিয়ান "${user.name}" এর নতুন ওয়ালেট ব্যালেন্স: ৳${newBal.toLocaleString()}`
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in respondWalletRequest:', err);
        return res.status(500).json({ success: false, message: 'রিকোয়েস্ট প্রসেস করতে ব্যর্থ হয়েছে', error: err.message });
    } finally {
        client.release();
    }
};

