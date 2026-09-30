const pool = require("../../config/db");

// ১০. সকল টেকনিশিয়ানের লাইভ ওয়ালেট ব্যালেন্স ও সামারি
exports.getTechWallets = async (req, res) => {
    try {
        const query = `
            SELECT 
                t.tech_id,
                t.tech_name,
                t.tech_source,
                t.contact,
                COALESCE(pa.id, 0) AS wallet_id,
                COALESCE(pa.balance, 0) AS balance,
                COALESCE((
                    SELECT COUNT(*)
                    FROM service_projects sp
                    WHERE sp.status = 'completed' AND sp.technician_id = t.tech_id
                ), 0) AS completed_projects_count,
                COALESCE((
                    SELECT SUM(amount)
                    FROM account_transactions at
                    WHERE at.account_id = pa.id AND at.type = 'deposit'
                ), 0) AS total_earned,
                COALESCE((
                    SELECT SUM(amount)
                    FROM account_transactions at
                    WHERE at.account_id = pa.id AND at.type = 'withdraw'
                ), 0) AS total_withdrawn
            FROM (
                SELECT 
                    u.id AS tech_id, 
                    u.name AS tech_name, 
                    'user' AS tech_source, 
                    COALESCE(u.phone, u.email, '') AS contact
                FROM users u
                LEFT JOIN roles r ON r.id = u.role_id
                WHERE u.deleted_at IS NULL
                  AND (u.is_active IS NOT FALSE AND u.is_locked IS NOT TRUE)
                  AND (
                      UPPER(COALESCE(u.role, '')) = 'TECHNICIAN'
                      OR u.role_id = 4
                      OR COALESCE(u.role_name, '') ILIKE '%technician%'
                      OR COALESCE(r.name, '') ILIKE '%technician%'
                      OR COALESCE(u.designation, '') ILIKE '%technician%'
                      OR COALESCE(u.designation, '') ILIKE '%tech%'
                  )
            ) t
            LEFT JOIN payment_accounts pa ON pa.name = ('Tech Wallet: ' || t.tech_name) AND pa.account_type = 'wallet'
            ORDER BY balance DESC, tech_name ASC;
        `;
        const result = await pool.query(query);

        const sourceAccountsRes = await pool.query(`
            SELECT id, name, account_type, balance 
            FROM payment_accounts 
            WHERE account_type != 'wallet'
            ORDER BY id ASC;
        `);

        return res.status(200).json({
            success: true,
            wallets: result.rows,
            source_accounts: sourceAccountsRes.rows
        });
    } catch (error) {
        console.error('getTechWallets error:', error);
        return res.status(500).json({ success: false, message: 'টেকনিশিয়ান ওয়ালেট লোড করতে সমস্যা হয়েছে।' });
    }
};

// ১১. টেকনিশিয়ানকে পারিশ্রমিক পরিশোধ (Cash Drawer বা Bank/MFS থেকে পে-আউট)
exports.payoutTechWallet = async (req, res) => {
    const client = await pool.connect();
    try {
        const { tech_name, source_account_id, amount, note = '' } = req.body;
        const payoutAmount = parseFloat(amount || 0);

        if (!tech_name || !source_account_id || payoutAmount <= 0) {
            return res.status(400).json({ success: false, message: 'টেকনিশিয়ানের নাম, পেমেন্ট সোর্স এবং সঠিক টাকার পরিমাণ দিন।' });
        }

        await client.query('BEGIN');

        // ১. সোর্স একাউন্ট (যেমন ক্যাশ ড্রয়ার) চেক করা
        const srcRes = await client.query('SELECT * FROM payment_accounts WHERE id = $1', [source_account_id]);
        if (srcRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'নির্বাচিত পেমেন্ট একাউন্ট পাওয়া যায়নি।' });
        }
        const sourceAccount = srcRes.rows[0];

        // ২. টেকনিশিয়ান ওয়ালেট অ্যাকাউন্ট খোঁজা বা তৈরি করা
        const walletAccountName = `Tech Wallet: ${tech_name}`;
        let walletRes = await client.query('SELECT * FROM payment_accounts WHERE name = $1 AND account_type = \'wallet\'', [walletAccountName]);
        let walletId;
        let currentWalletBalance = 0;

        if (walletRes.rows.length === 0) {
            const newWallet = await client.query(`
                INSERT INTO payment_accounts (name, account_type, balance)
                VALUES ($1, 'wallet', 0)
                RETURNING *;
            `, [walletAccountName]);
            walletId = newWallet.rows[0].id;
        } else {
            walletId = walletRes.rows[0].id;
            currentWalletBalance = parseFloat(walletRes.rows[0].balance || 0);
        }

        // ৩. সোর্স অ্যাকাউন্ট থেকে টাকা মাইনাস করা
        await client.query(`
            UPDATE payment_accounts 
            SET balance = balance - $1 
            WHERE id = $2;
        `, [payoutAmount, source_account_id]);

        // সোর্স অ্যাকাউন্টে এক্সপেন্স ট্রানজেকশন রেকর্ড করা
        await client.query(`
            INSERT INTO account_transactions (account_id, type, amount, reference, note, created_at)
            VALUES ($1, 'expense', $2, $3, $4, NOW());
        `, [
            source_account_id,
            payoutAmount,
            `Tech Payout: ${tech_name}`,
            `Paid technician remuneration via ${sourceAccount.name}. ${note}`.trim()
        ]);

        // ৪. টেকনিশিয়ানের ওয়ালেট ব্যালেন্স থেকে টাকা মাইনাস করা
        await client.query(`
            UPDATE payment_accounts 
            SET balance = balance - $1 
            WHERE id = $2;
        `, [payoutAmount, walletId]);

        // টেকনিশিয়ান ওয়ালেটে উইথড্রল রেকর্ড করা
        await client.query(`
            INSERT INTO account_transactions (account_id, type, amount, reference, note, created_at)
            VALUES ($1, 'withdraw', $2, $3, $4, NOW());
        `, [
            walletId,
            payoutAmount,
            `Cashout via ${sourceAccount.name}`,
            `Remuneration withdrawn/cashed out. ${note}`.trim()
        ]);

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: `টেকনিশিয়ান ${tech_name}-কে ৳${payoutAmount.toLocaleString('en-IN')} সফলভাবে পরিশোধ করা হয়েছে।`,
            payout: {
                tech_name,
                amount: payoutAmount,
                source_account: sourceAccount.name,
                new_wallet_balance: currentWalletBalance - payoutAmount,
                created_at: new Date().toISOString()
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('payoutTechWallet error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর: ' + error.message });
    } finally {
        client.release();
    }
};

// ১২. টেকনিশিয়ানের ওয়ালেট লেনদেন হিস্ট্রি / স্টেটমেন্ট
exports.getTechWalletHistory = async (req, res) => {
    try {
        const { wallet_id } = req.params;
        const result = await pool.query(`
            SELECT 
                at.id,
                at.account_id,
                at.type,
                at.amount,
                at.reference,
                at.note,
                at.created_at
            FROM account_transactions at
            WHERE at.account_id = $1
            ORDER BY at.id DESC
            LIMIT 100;
        `, [wallet_id]);

        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('getTechWalletHistory error:', error);
        return res.status(500).json({ success: false, message: 'লেনদেন হিস্ট্রি লোড করতে সমস্যা হয়েছে।' });
    }
};
