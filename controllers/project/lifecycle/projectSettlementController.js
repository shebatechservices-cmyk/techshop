const pool = require("../../../config/db");

// ১. কাজ সম্পন্ন (Complete) এবং টেকনিশিয়ানের ওয়ালেটে (সেটাপ চার্জ + যাতায়াত + মিল) স্বয়ংক্রিয় ট্রান্সফার
exports.completeProject = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        // প্রজেক্টের তথ্য চেক করা
        const projRes = await client.query('SELECT * FROM service_projects WHERE id = $1', [id]);
        if (projRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'প্রজেক্ট পাওয়া যায়নি।' });
        }

        const project = projRes.rows[0];
        if (project.status === 'completed') {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'এই প্রজেক্ট আগেই সম্পন্ন হয়েছে।' });
        }

        // প্রজেক্ট স্ট্যাটাস কমপ্লিট করা
        await client.query(`
            UPDATE service_projects 
            SET status = 'completed',
                technician_status = 'completed',
                completed_at = NOW(),
                updated_at = NOW() 
            WHERE id = $1
        `, [id]);

        // টেকনিশিয়ানের মোট প্রদেয় হিসাব (সেটাপ চার্জ + যাতায়াত + মিল)
        const setupCharge = parseFloat(project.setup_fee || project.setup_charge || 0);
        const conveyance = parseFloat(project.conveyance || project.conveyance_cost || 0);
        const meal = parseFloat(project.meal_allowance || 0);
        const totalPayout = setupCharge + conveyance + meal > 0 ? (setupCharge + conveyance + meal) : parseFloat(project.charges || 0);

        if (project.technician_id && totalPayout > 0) {
            // ১. টেকনিশিয়ানের নাম সংগ্রহ (users টেবিল থেকে)
            let techName = 'Technician';
            const techUser = await client.query('SELECT name FROM users WHERE id = $1', [project.technician_id]);
            if (techUser.rows.length > 0) {
                techName = techUser.rows[0].name;
            }

            // ২. ক্যাশ ড্রয়ার (বা প্রধান ক্যাশ অ্যাকাউন্ট) থেকে টাকা কর্তন (Debit / Expense)
            const drawerRes = await client.query(`
                SELECT id, name, balance FROM payment_accounts 
                WHERE account_type = 'drawer' OR id = 1 
                ORDER BY CASE WHEN account_type = 'drawer' THEN 1 ELSE 2 END, id ASC 
                LIMIT 1
            `);
            let drawerAccountId = null;
            if (drawerRes.rows.length > 0) {
                drawerAccountId = drawerRes.rows[0].id;
                await client.query(`
                    UPDATE payment_accounts 
                    SET balance = balance - $1 
                    WHERE id = $2
                `, [totalPayout, drawerAccountId]);

                const drawerNote = `প্রজেক্ট #${project.project_code} সম্পন্নের বিপরীতে টেকনিশিয়ান ওয়ালেটে প্রদান (সেটাপ: ৳${setupCharge} | যাতায়াত: ৳${conveyance} | মিল: ৳${meal})`;
                await client.query(`
                    INSERT INTO account_transactions (account_id, type, amount, reference, note, created_at)
                    VALUES ($1, 'expense', $2, $3, $4, NOW())
                `, [drawerAccountId, totalPayout, `Project #${project.project_code}`, drawerNote]);
            }

            // ৩. টেকনিশিয়ানের নামে কোনো ওয়ালেট আছে কি না চেক করা বা তৈরি করা
            const walletAccountName = `Tech Wallet: ${techName}`;
            let accRes = await client.query('SELECT id FROM payment_accounts WHERE name = $1', [walletAccountName]);
            let accountId;

            if (accRes.rows.length === 0) {
                const newAcc = await client.query(`
                    INSERT INTO payment_accounts (name, account_type, balance) 
                    VALUES ($1, 'wallet', 0) RETURNING id;
                `, [walletAccountName]);
                accountId = newAcc.rows[0].id;
            } else {
                accountId = accRes.rows[0].id;
            }

            // ৪. ওয়ালেটে মোট টাকা যোগ করা (Credit / Deposit)
            await client.query(`
                UPDATE payment_accounts SET balance = balance + $1 WHERE id = $2
            `, [totalPayout, accountId]);

            // বিস্তারিত ব্রেকডাউন সহ টেকনিশিয়ানের লেজারে এন্ট্রি করা
            const breakdownNote = `[${project.project_code}] ক্যাশ ড্রয়ার থেকে প্রাপ্তি (সেটাপ ফি: ৳${setupCharge} | যাতায়াত: ৳${conveyance} | মিল: ৳${meal})`;
            await client.query(`
                INSERT INTO account_transactions (account_id, type, amount, reference, note, created_at)
                VALUES ($1, 'deposit', $2, $3, $4, NOW())
            `, [accountId, totalPayout, `Project #${project.project_code}`, breakdownNote]);
        }

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: `প্রজেক্ট সফলভাবে সম্পন্ন হয়েছে এবং টেকনিশিয়ানের ওয়ালেটে মোট ৳${totalPayout.toLocaleString('en-IN')} জমা করা হয়েছে।`
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Project complete error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর: ' + error.message });
    } finally {
        client.release();
    }
};

// ২. ভুলবশত সম্পন্ন হওয়া প্রজেক্ট রিভার্স / রিয়োপেন (Reopen & Financial Rollback)
exports.reopenProject = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { reason = 'Mistakenly confirmed, reopened by admin' } = req.body || {};

        await client.query('BEGIN');

        const projRes = await client.query('SELECT * FROM service_projects WHERE id = $1 AND deleted_at IS NULL FOR UPDATE', [id]);
        if (projRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'প্রজেক্ট পাওয়া যায়নি।' });
        }

        const project = projRes.rows[0];
        if (project.status !== 'completed' && project.technician_status !== 'completed') {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'এই প্রজেক্টটি সম্পন্ন (Completed) অবস্থায় নেই।' });
        }

        // রিভার্স করার জন্য মোট প্রদেয় হিসাব
        const setupCharge = parseFloat(project.setup_fee || project.setup_charge || 0);
        const conveyance = parseFloat(project.conveyance || project.conveyance_cost || 0);
        const meal = parseFloat(project.meal_allowance || 0);
        const totalPayout = setupCharge + conveyance + meal > 0 ? (setupCharge + conveyance + meal) : parseFloat(project.charges || 0);

        if (project.technician_id && totalPayout > 0) {
            let techName = 'Technician';
            const techUser = await client.query('SELECT name FROM users WHERE id = $1', [project.technician_id]);
            if (techUser.rows.length > 0) {
                techName = techUser.rows[0].name;
            }

            // ১. টেকনিশিয়ান ওয়ালেট অ্যাকাউন্ট থেকে টাকা কর্তন (রিভার্সাল)
            const walletAccountName = `Tech Wallet: ${techName}`;
            const walletRes = await client.query('SELECT id, balance FROM payment_accounts WHERE name = $1 AND account_type = $2', [walletAccountName, 'wallet']);
            
            if (walletRes.rows.length > 0) {
                const wallet = walletRes.rows[0];
                await client.query(
                    'UPDATE payment_accounts SET balance = balance - $1 WHERE id = $2',
                    [totalPayout, wallet.id]
                );

                const rollbackNote = `ভুলবশত সম্পন্ন প্রজেক্ট #${project.project_code} রিভার্সাল (${reason})। সেটাপ: ৳${setupCharge} | যাতায়াত: ৳${conveyance} | মিল: ৳${meal}`;
                await client.query(`
                    INSERT INTO account_transactions (account_id, type, amount, reference, note, created_at)
                    VALUES ($1, 'withdraw', $2, $3, $4, NOW())
                `, [wallet.id, totalPayout, `Rollback #${project.project_code}`, rollbackNote]);
            }

            // ২. ক্যাশ ড্রয়ারে টাকা ফেরত আনা (Reversal income)
            const drawerRes = await client.query(`
                SELECT id, name FROM payment_accounts 
                WHERE account_type = 'drawer' OR id = 1 
                ORDER BY CASE WHEN account_type = 'drawer' THEN 1 ELSE 2 END, id ASC 
                LIMIT 1
            `);
            if (drawerRes.rows.length > 0) {
                const drawerId = drawerRes.rows[0].id;
                await client.query(
                    'UPDATE payment_accounts SET balance = balance + $1 WHERE id = $2',
                    [totalPayout, drawerId]
                );

                const drawerRefundNote = `প্রজেক্ট #${project.project_code} রিয়োপেন করায় ক্যাশ ড্রয়ারে টাকা সমন্বয়/ফেরত।`;
                await client.query(`
                    INSERT INTO account_transactions (account_id, type, amount, reference, note, created_at)
                    VALUES ($1, 'income', $2, $3, $4, NOW())
                `, [drawerId, totalPayout, `Project #${project.project_code}`, drawerRefundNote]);
            }
        }

        // ৩. প্রজেক্ট স্ট্যাটাস পুনরায় 'in_progress'-এ ফিরিয়ে আনা
        await client.query(`
            UPDATE service_projects 
            SET status = 'in_progress',
                technician_status = 'in_progress',
                completed_at = NULL,
                updated_at = NOW() 
            WHERE id = $1
        `, [id]);

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: `প্রজেক্ট #${project.project_code} সফলভাবে পুনরায় চালু (Reopened) করা হয়েছে। টেকনিশিয়ানের ওয়ালেট ও ক্যাশ ড্রয়ার ব্যালেন্স স্বয়ংক্রিয়ভাবে রিভার্স হয়েছে।`
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Project reopen error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর: ' + error.message });
    } finally {
        client.release();
    }
};
