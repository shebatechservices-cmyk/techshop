const pool = require("../../config/db");

// ৪. টেকনিশিয়ান কর্তৃক কাজ গ্রহণ (Accept) বা প্রত্যাখ্যান (Decline)
exports.technicianRespond = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, response_note = '' } = req.body; // action: 'accept' | 'decline'

        const projCheck = await pool.query('SELECT * FROM service_projects WHERE id = $1', [id]);
        if (projCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'প্রজেক্ট পাওয়া যায়নি।' });
        }

        const project = projCheck.rows[0];

        if (action === 'accept') {
            const noteText = `${project.progress_note || ''}\n[${new Date().toLocaleTimeString()}] টেকনিশিয়ান কাজ গ্রহণ করেছেন। ${response_note}`.trim();
            const result = await pool.query(`
                UPDATE service_projects
                SET technician_status = 'accepted',
                    status = 'awaiting_incharge_confirmation',
                    progress_note = $1,
                    updated_at = NOW()
                WHERE id = $2
                RETURNING *;
            `, [noteText, id]);

            return res.status(200).json({
                success: true,
                message: 'কাজের অনুরোধ সফলভাবে গ্রহণ করা হয়েছে। এডমিন/ইনচার্জ কনফার্মেশনের পর কাজ শুরু হবে।',
                data: result.rows[0]
            });
        } else {
            const noteText = `${project.progress_note || ''}\n[${new Date().toLocaleTimeString()}] টেকনিশিয়ান অপারগতা প্রকাশ করেছেন: ${response_note}`.trim();
            const result = await pool.query(`
                UPDATE service_projects
                SET technician_status = 'declined',
                    status = 'tech_declined',
                    progress_note = $1,
                    updated_at = NOW()
                WHERE id = $2
                RETURNING *;
            `, [noteText, id]);

            return res.status(200).json({
                success: true,
                message: 'কাজের অনুরোধ প্রত্যাখ্যান করা হয়েছে।',
                data: result.rows[0]
            });
        }

    } catch (error) {
        console.error('technicianRespond error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর: ' + error.message });
    }
};

// ৫. এডমিন বা সেটাপ ইনচার্জ কর্তৃক চূড়ান্ত হ্যান্ডওভার কনফার্মেশন (In-charge Confirmation)
exports.confirmByIncharge = async (req, res) => {
    try {
        const { id } = req.params;
        const { confirmed_by = null, incharge_note = '' } = req.body;

        const projCheck = await pool.query('SELECT * FROM service_projects WHERE id = $1', [id]);
        if (projCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'প্রজেক্ট পাওয়া যায়নি।' });
        }

        const project = projCheck.rows[0];

        const noteText = `${project.progress_note || ''}\n[${new Date().toLocaleTimeString()}] সেটাপ ইনচার্জ কর্তৃক কাজ চূড়ান্ত অনুমোদন দেওয়া হয়েছে। ${incharge_note}`.trim();

        const result = await pool.query(`
            UPDATE service_projects
            SET admin_confirmed = true,
                confirmed_by = $1,
                technician_status = 'in_progress',
                status = 'in_progress',
                progress_note = $2,
                updated_at = NOW()
            WHERE id = $3
            RETURNING *;
        `, [confirmed_by, noteText, id]);

        return res.status(200).json({
            success: true,
            message: 'সেটাপ ইনচার্জ হ্যান্ডওভার অনুমোদন করেছেন। কাজ এখন চলমান (In Progress)।',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('confirmByIncharge error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর: ' + error.message });
    }
};

// ৬. টেকনিশিয়ান কর্তৃক কাজের অগ্রগতি (Progress Note) আপডেট করা
exports.updateProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { progress_note, status } = req.body;

        const result = await pool.query(`
            UPDATE service_projects 
            SET progress_note = CASE 
                    WHEN progress_note IS NULL OR progress_note = '' THEN $1
                    ELSE progress_note || E'\n' || $1
                END, 
                status = COALESCE($2, status), 
                updated_at = NOW()
            WHERE id = $3
            RETURNING *;
        `, [progress_note, status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'প্রজেক্ট পাওয়া যায়নি।' });
        }

        return res.status(200).json({
            success: true,
            message: 'কাজের অগ্রগতি সফলভাবে সংরক্ষিত হয়েছে।',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Progress update error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর হয়েছে।' });
    }
};

// ৭. কাজ সম্পন্ন (Complete) এবং টেকনিশিয়ানের ওয়ালেটে (সেটাপ চার্জ + যাতায়াত + মিল) স্বয়ংক্রিয় ট্রান্সফার
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
            // ১. টেকনিশিয়ানের নাম সংগ্রহ (users টেবিল থেকে - কঠোর এনটিটি বিভাজন)
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
