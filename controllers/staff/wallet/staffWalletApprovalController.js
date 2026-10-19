const pool = require('../../../config/db');

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
