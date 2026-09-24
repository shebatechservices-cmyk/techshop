const pool = require('../config/db');

// ১. সাম্প্রতিক সেলস ইনভয়েস খোঁজা (নতুন ক্যামেরা সেটাপ রেফারেন্সের জন্য)
exports.getInvoicesLookup = async (req, res) => {
    try {
        const query = `
            SELECT 
                s.id,
                s.invoice_no,
                s.created_at,
                s.total_amount,
                s.paid_amount,
                s.due_amount,
                COALESCE(s.setup_charge, 0) AS setup_charge,
                s.customer_id,
                COALESCE(c.name, 'Walking Customer') AS customer_name,
                c.phone AS customer_phone,
                c.address AS customer_address,
                COALESCE(
                    (
                        SELECT json_agg(json_build_object(
                            'product_id', si.product_id,
                            'product_name', COALESCE(p.name, 'Item'),
                            'quantity', si.quantity,
                            'unit_price', si.unit_price,
                            'line_total', si.line_total
                        ))
                        FROM sales_items si
                        LEFT JOIN products p ON p.id = si.product_id
                        WHERE si.sale_id = s.id
                    ), '[]'::json
                ) AS items
            FROM sales s
            LEFT JOIN customers c ON c.id = s.customer_id
            ORDER BY s.id DESC
            LIMIT 50;
        `;
        const result = await pool.query(query);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('getInvoicesLookup error:', error);
        return res.status(500).json({ success: false, message: 'ইনভয়েস লোড করতে সমস্যা হয়েছে।' });
    }
};

// ২. উপলব্ধ টেকনিশিয়ানদের তালিকা
exports.getTechniciansLookup = async (req, res) => {
    try {
        const query = `
            SELECT 
                'user' AS tech_source,
                u.id,
                u.name,
                u.email AS contact,
                r.name AS role_title
            FROM users u
            JOIN roles r ON r.id = u.role_id
            WHERE r.id = 4 OR r.name ILIKE '%technician%'
            UNION ALL
            SELECT 
                'customer' AS tech_source,
                c.id,
                c.name,
                c.phone AS contact,
                'External Technician' AS role_title
            FROM customers c
            WHERE c.customer_type = 'technician' OR c.user_role = 'technician'
            ORDER BY name ASC;
        `;
        const result = await pool.query(query);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('getTechniciansLookup error:', error);
        return res.status(500).json({ success: false, message: 'টেকনিশিয়ানদের তালিকা লোড করতে সমস্যা হয়েছে।' });
    }
};

// ৩. নতুন প্রজেক্ট বা সার্ভিস এন্ট্রি (নতুন সেটাপ অথবা পুরাতন রিপেয়ার)
exports.createProject = async (req, res) => {
    try {
        const {
            title,
            project_category = 'new_setup', // 'new_setup' | 'old_repair'
            project_type = 'CCTV Installation',
            invoice_id = null,
            invoice_no = null,
            customer_id = null,
            customer_name = '',
            site_phone = '',
            site_address = '',
            technician_id = null,
            setup_charge = 0,
            conveyance_cost = 0,
            meal_allowance = 0,
            customer_billing_amount = 0,
            equipment_details = [],
            description = '',
            start_date = null,
            deadline = null
        } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, message: 'প্রজেক্টের নাম বা শিরোনাম আবশ্যক।' });
        }

        let finalCustomerId = customer_id;

        // পুরাতন রিপেয়ারের ক্ষেত্রে যদি নতুন কাস্টমার নাম থাকে এবং কোনো customer_id না থাকে
        if (!finalCustomerId && customer_name) {
            const existingCust = await pool.query('SELECT id FROM customers WHERE phone = $1', [site_phone]);
            if (existingCust.rows.length > 0) {
                finalCustomerId = existingCust.rows[0].id;
            } else {
                const newCust = await pool.query(`
                    INSERT INTO customers (name, phone, address, customer_type, user_role, receivable_balance)
                    VALUES ($1, $2, $3, 'retail', 'regular', 0)
                    RETURNING id;
                `, [customer_name, site_phone, site_address]);
                finalCustomerId = newCust.rows[0].id;
            }
        }

        const project_code = `PRJ-${Date.now().toString().slice(-6)}`;
        const totalTechPayout = parseFloat(setup_charge || 0) + parseFloat(conveyance_cost || 0) + parseFloat(meal_allowance || 0);

        const initialStatus = technician_id ? 'assigned' : 'unassigned';
        const techStatus = technician_id ? 'assigned' : null;

        const insertQuery = `
            INSERT INTO service_projects (
                project_code, title, project_type, customer_id, technician_id,
                charges, description, status, invoice_id, invoice_no,
                setup_charge, conveyance_cost, meal_allowance, customer_billing_amount,
                technician_status, admin_confirmed, site_address, site_phone,
                equipment_details, start_date, deadline, created_at, updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10,
                $11, $12, $13, $14,
                $15, false, $16, $17,
                $18, $19, $20, NOW(), NOW()
            )
            RETURNING *;
        `;

        const values = [
            project_code,
            title,
            project_type,
            finalCustomerId,
            technician_id,
            totalTechPayout,
            description,
            initialStatus,
            invoice_id,
            invoice_no,
            parseFloat(setup_charge || 0),
            parseFloat(conveyance_cost || 0),
            parseFloat(meal_allowance || 0),
            parseFloat(customer_billing_amount || 0),
            techStatus,
            site_address,
            site_phone,
            JSON.stringify(equipment_details || []),
            start_date || new Date().toISOString().split('T')[0],
            deadline || null
        ];

        const result = await pool.query(insertQuery, values);

        return res.status(201).json({
            success: true,
            message: 'প্রজেক্ট বা সার্ভিস এন্ট্রি সফলভাবে সম্পন্ন হয়েছে। টেকনিশিয়ানকে নোটিফাই করা হয়েছে।',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Project creation error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর: ' + error.message });
    }
};

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
        const setupCharge = parseFloat(project.setup_charge || 0);
        const conveyance = parseFloat(project.conveyance_cost || 0);
        const meal = parseFloat(project.meal_allowance || 0);
        const totalPayout = setupCharge + conveyance + meal > 0 ? (setupCharge + conveyance + meal) : parseFloat(project.charges || 0);

        if (project.technician_id && totalPayout > 0) {
            // ১. টেকনিশিয়ানের নাম সংগ্রহ (customers বা users টেবিল থেকে)
            let techName = 'Technician';
            const techCust = await client.query('SELECT name FROM customers WHERE id = $1', [project.technician_id]);
            if (techCust.rows.length > 0) {
                techName = techCust.rows[0].name;
            } else {
                const techUser = await client.query('SELECT name FROM users WHERE id = $1', [project.technician_id]);
                if (techUser.rows.length > 0) {
                    techName = techUser.rows[0].name;
                }
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

// ৮. সকল প্রজেক্ট বা সার্ভিসের তালিকা দেখা (উন্নত ফিল্টারিং ও জয়েন সহ)
exports.getProjects = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.*,
                COALESCE(c.name, 'Walking / Direct Client') AS customer_name,
                c.phone AS customer_phone,
                c.address AS customer_base_address,
                COALESCE(u.name, tech_cust.name, 'Unassigned') AS technician_name,
                COALESCE(u.email, tech_cust.phone, '') AS technician_contact,
                conf_user.name AS confirmed_by_name
            FROM service_projects p
            LEFT JOIN customers c ON p.customer_id = c.id
            LEFT JOIN users u ON p.technician_id = u.id AND (u.role_id = 4 OR u.role_id = 3)
            LEFT JOIN customers tech_cust ON p.technician_id = tech_cust.id AND (tech_cust.customer_type = 'technician' OR tech_cust.user_role = 'technician')
            LEFT JOIN users conf_user ON p.confirmed_by = conf_user.id
            WHERE p.deleted_at IS NULL
            ORDER BY p.id DESC;
        `;
        const result = await pool.query(query);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get projects error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর: ' + error.message });
    }
};

// 9. Safe Project Deletion (Blocked if work completed/confirmed)
exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const pRes = await pool.query('SELECT * FROM service_projects WHERE id = $1', [id]);
        if (!pRes.rows.length) {
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }
        const proj = pRes.rows[0];

        // Completed work / admin confirmed lock check
        if (proj.status === 'completed' || proj.technician_status === 'completed' || proj.admin_confirmed === true) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete completed work or admin-confirmed service project. You can edit the project details instead.'
            });
        }

        await pool.query('UPDATE service_projects SET deleted_at = NOW() WHERE id = $1', [id]);
        await pool.query(`
            INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
            VALUES ('service_projects', $1, $2, $3, NOW())
        `, [id, `Project #${proj.project_code || id}`, JSON.stringify(proj)]).catch(() => null);

        return res.status(200).json({ success: true, message: `Project #${proj.project_code || id} moved to Trash successfully!` });
    } catch (error) {
        console.error('Delete project error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete project: ' + error.message });
    }
};

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
                SELECT id AS tech_id, name AS tech_name, 'user' AS tech_source, email AS contact
                FROM users WHERE role_id = 4 OR name ILIKE '%technician%'
                UNION ALL
                SELECT id AS tech_id, name AS tech_name, 'customer' AS tech_source, phone AS contact
                FROM customers WHERE customer_type = 'technician' OR user_role = 'technician'
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
