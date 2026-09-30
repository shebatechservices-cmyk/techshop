const pool = require("../../config/db");

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
            services = [],
            device_qty = 1,
            per_unit_rate = 0,
            setup_fee = null,
            setup_charge = 0,
            conveyance = null,
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

        // Dynamic services calculation
        let calculatedSetupFee = 0;
        let totalDeviceQty = 0;
        let validServices = [];

        if (Array.isArray(services) && services.length > 0) {
            validServices = services.map(s => {
                const sName = (s.service_name || s.name || 'Setup Service').trim();
                const qty = parseInt(s.quantity || s.qty || 1, 10) || 1;
                const rate = parseFloat(s.unit_rate || s.rate || 0) || 0;
                const lTotal = parseFloat(s.line_total !== undefined ? s.line_total : (qty * rate)) || (qty * rate);
                calculatedSetupFee += lTotal;
                totalDeviceQty += qty;
                return {
                    service_name: sName,
                    quantity: qty,
                    unit_rate: rate,
                    line_total: lTotal,
                    notes: s.notes || ''
                };
            });
        } else {
            const rawSetup = setup_fee !== null && setup_fee !== undefined ? setup_fee : setup_charge;
            calculatedSetupFee = parseFloat(rawSetup || 0);
            totalDeviceQty = parseInt(device_qty || 1, 10);
            if (calculatedSetupFee > 0 || totalDeviceQty > 0) {
                validServices.push({
                    service_name: title || 'Camera / Setup Service',
                    quantity: totalDeviceQty,
                    unit_rate: totalDeviceQty > 0 ? (calculatedSetupFee / totalDeviceQty) : calculatedSetupFee,
                    line_total: calculatedSetupFee,
                    notes: ''
                });
            }
        }

        const finalPerUnitRate = totalDeviceQty > 0 ? (calculatedSetupFee / totalDeviceQty) : parseFloat(per_unit_rate || 0);
        const finalConveyance = conveyance !== null && conveyance !== undefined ? parseFloat(conveyance || 0) : parseFloat(conveyance_cost || 0);
        const finalMealAllowance = parseFloat(meal_allowance || 0);
        const finalCustomerBilling = parseFloat(customer_billing_amount || 0);

        const totalTechPayout = calculatedSetupFee + finalConveyance + finalMealAllowance;

        const initialStatus = technician_id ? 'assigned' : 'unassigned';
        const techStatus = technician_id ? 'assigned' : null;

        const insertQuery = `
            INSERT INTO service_projects (
                project_code, title, project_type, customer_id, technician_id,
                charges, description, status, invoice_id, invoice_no,
                device_qty, per_unit_rate,
                setup_charge, setup_fee, conveyance_cost, conveyance, meal_allowance, customer_billing_amount,
                technician_status, admin_confirmed, site_address, site_phone,
                equipment_details, start_date, deadline, created_at, updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10,
                $11, $12,
                $13, $14, $15, $16, $17, $18,
                $19, false, $20, $21,
                $22, $23, $24, NOW(), NOW()
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
            totalDeviceQty,
            finalPerUnitRate,
            calculatedSetupFee,
            calculatedSetupFee,
            finalConveyance,
            finalConveyance,
            finalMealAllowance,
            finalCustomerBilling,
            techStatus,
            site_address,
            site_phone,
            JSON.stringify(equipment_details || []),
            start_date || new Date().toISOString().split('T')[0],
            deadline || null
        ];

        const result = await pool.query(insertQuery, values);
        const createdProject = result.rows[0];

        // Insert service rows into project_services
        if (validServices.length > 0) {
            for (const s of validServices) {
                await pool.query(`
                    INSERT INTO project_services (project_id, service_name, quantity, unit_rate, line_total, notes, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                `, [createdProject.id, s.service_name, s.quantity, s.unit_rate, s.line_total, s.notes || null]).catch(err => {
                    console.error('Error inserting project_service:', err);
                });
            }
        }
        createdProject.services = validServices;

        return res.status(201).json({
            success: true,
            message: 'প্রজেক্ট বা সার্ভিস এন্ট্রি সফলভাবে সম্পন্ন হয়েছে। টেকনিশিয়ানকে নোটিফাই করা হয়েছে।',
            data: createdProject
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

// ৮. সকল প্রজেক্ট বা সার্ভিসের তালিকা দেখা (উন্নত ফিল্টারিং ও জয়েন সহ)
exports.getProjects = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.*,
                COALESCE(c.name, 'Walking / Direct Client') AS customer_name,
                c.phone AS customer_phone,
                c.address AS customer_base_address,
                COALESCE(u.name, 'Unassigned') AS technician_name,
                COALESCE(u.phone, u.email, '') AS technician_contact,
                conf_user.name AS confirmed_by_name,
                COALESCE(
                    (
                        SELECT json_agg(json_build_object(
                            'id', ps.id,
                            'service_name', ps.service_name,
                            'quantity', ps.quantity,
                            'unit_rate', ps.unit_rate,
                            'line_total', ps.line_total,
                            'notes', ps.notes
                        ) ORDER BY ps.id ASC)
                        FROM project_services ps
                        WHERE ps.project_id = p.id
                    ), '[]'::json
                ) AS services
            FROM service_projects p
            LEFT JOIN customers c ON p.customer_id = c.id
            LEFT JOIN users u ON p.technician_id = u.id
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

// ৮.১ একক প্রজেক্টের বিস্তারিত তথ্য সংগ্রহ (সার্ভিসেস সহ)
exports.getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                p.*,
                COALESCE(c.name, 'Walking / Direct Client') AS customer_name,
                c.phone AS customer_phone,
                c.address AS customer_base_address,
                COALESCE(u.name, 'Unassigned') AS technician_name,
                COALESCE(u.phone, u.email, '') AS technician_contact,
                conf_user.name AS confirmed_by_name,
                COALESCE(
                    (
                        SELECT json_agg(json_build_object(
                            'id', ps.id,
                            'service_name', ps.service_name,
                            'quantity', ps.quantity,
                            'unit_rate', ps.unit_rate,
                            'line_total', ps.line_total,
                            'notes', ps.notes
                        ) ORDER BY ps.id ASC)
                        FROM project_services ps
                        WHERE ps.project_id = p.id
                    ), '[]'::json
                ) AS services
            FROM service_projects p
            LEFT JOIN customers c ON p.customer_id = c.id
            LEFT JOIN users u ON p.technician_id = u.id
            LEFT JOIN users conf_user ON p.confirmed_by = conf_user.id
            WHERE p.id = $1 AND p.deleted_at IS NULL;
        `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'প্রজেক্ট পাওয়া যায়নি।' });
        }
        return res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Get project by id error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর: ' + error.message });
    }
};

// ৮.২ ওয়ার্ক অর্ডার এডিট / আপডেট (টেকনিশিয়ান পরিবর্তন ও ডায়নামিক সার্ভিস আপডেট)
exports.updateProject = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const {
            title,
            project_type,
            technician_id,
            site_phone,
            site_address,
            services = [],
            device_qty,
            per_unit_rate,
            setup_fee,
            setup_charge,
            conveyance,
            conveyance_cost,
            meal_allowance,
            customer_billing_amount,
            equipment_details,
            description,
            start_date,
            deadline
        } = req.body;

        await client.query('BEGIN');

        const projRes = await client.query('SELECT * FROM service_projects WHERE id = $1 AND deleted_at IS NULL FOR UPDATE', [id]);
        if (projRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'প্রজেক্ট পাওয়া যায়নি।' });
        }

        const project = projRes.rows[0];
        if (project.status === 'completed' || project.technician_status === 'completed') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'সম্পন্ন কাজের ওয়ার্ক অর্ডার পরিবর্তন করা যাবে না কারণ টেকনিশিয়ানের ওয়ালেটে টাকা পরিশোধ হয়ে গেছে।'
            });
        }

        // Dynamic services calculation
        let calculatedSetupFee = 0;
        let totalDeviceQty = 0;
        let validServices = [];

        if (Array.isArray(services) && services.length > 0) {
            validServices = services.map(s => {
                const sName = (s.service_name || s.name || 'Setup Service').trim();
                const qty = parseInt(s.quantity || s.qty || 1, 10) || 1;
                const rate = parseFloat(s.unit_rate || s.rate || 0) || 0;
                const lTotal = parseFloat(s.line_total !== undefined ? s.line_total : (qty * rate)) || (qty * rate);
                calculatedSetupFee += lTotal;
                totalDeviceQty += qty;
                return {
                    service_name: sName,
                    quantity: qty,
                    unit_rate: rate,
                    line_total: lTotal,
                    notes: s.notes || ''
                };
            });
        } else {
            const rawSetup = setup_fee !== undefined && setup_fee !== null ? setup_fee : setup_charge;
            calculatedSetupFee = rawSetup !== undefined && rawSetup !== null ? parseFloat(rawSetup || 0) : parseFloat(project.setup_fee || project.setup_charge || 0);
            totalDeviceQty = device_qty !== undefined ? parseInt(device_qty || 1, 10) : (project.device_qty || 1);
        }

        const finalPerUnitRate = totalDeviceQty > 0 ? (calculatedSetupFee / totalDeviceQty) : (parseFloat(per_unit_rate || 0));
        
        const finalConveyance = conveyance !== undefined && conveyance !== null 
            ? parseFloat(conveyance || 0) 
            : (conveyance_cost !== undefined && conveyance_cost !== null ? parseFloat(conveyance_cost || 0) : parseFloat(project.conveyance || project.conveyance_cost || 0));
            
        const finalMeal = meal_allowance !== undefined && meal_allowance !== null 
            ? parseFloat(meal_allowance || 0) 
            : parseFloat(project.meal_allowance || 0);
            
        const finalCustBilling = customer_billing_amount !== undefined && customer_billing_amount !== null 
            ? parseFloat(customer_billing_amount || 0) 
            : parseFloat(project.customer_billing_amount || 0);

        const totalTechPayout = calculatedSetupFee + finalConveyance + finalMeal;

        // Technician reassignment logic
        let nextTechId = technician_id !== undefined ? (technician_id ? Number(technician_id) : null) : project.technician_id;
        let nextTechStatus = project.technician_status;
        let nextStatus = project.status;
        let nextAdminConfirmed = project.admin_confirmed;

        if (technician_id !== undefined && Number(technician_id) !== Number(project.technician_id)) {
            if (nextTechId) {
                nextTechStatus = 'assigned';
                nextStatus = 'assigned';
                nextAdminConfirmed = false; // require confirmation for new tech
            } else {
                nextTechStatus = null;
                nextStatus = 'unassigned';
                nextAdminConfirmed = false;
            }
        }

        // 1. Update service_projects
        const updateQuery = `
            UPDATE service_projects
            SET 
                title = COALESCE($1, title),
                project_type = COALESCE($2, project_type),
                technician_id = $3,
                site_phone = COALESCE($4, site_phone),
                site_address = COALESCE($5, site_address),
                device_qty = $6,
                per_unit_rate = $7,
                setup_charge = $8,
                setup_fee = $8,
                conveyance_cost = $9,
                conveyance = $9,
                meal_allowance = $10,
                customer_billing_amount = $11,
                charges = $12,
                technician_status = $13,
                status = $14,
                admin_confirmed = $15,
                equipment_details = COALESCE($16, equipment_details),
                description = COALESCE($17, description),
                start_date = COALESCE($18, start_date),
                deadline = COALESCE($19, deadline),
                updated_at = NOW()
            WHERE id = $20
            RETURNING *;
        `;

        const updateValues = [
            title !== undefined ? title : null,
            project_type !== undefined ? project_type : null,
            nextTechId,
            site_phone !== undefined ? site_phone : null,
            site_address !== undefined ? site_address : null,
            totalDeviceQty,
            finalPerUnitRate,
            calculatedSetupFee,
            finalConveyance,
            finalMeal,
            finalCustBilling,
            totalTechPayout,
            nextTechStatus,
            nextStatus,
            nextAdminConfirmed,
            equipment_details ? JSON.stringify(equipment_details) : null,
            description !== undefined ? description : null,
            start_date !== undefined ? start_date : null,
            deadline !== undefined ? deadline : null,
            id
        ];

        const updatedProjRes = await client.query(updateQuery, updateValues);
        const updatedProject = updatedProjRes.rows[0];

        // 2. Update project_services
        if (validServices.length > 0) {
            await client.query('DELETE FROM project_services WHERE project_id = $1', [id]);
            for (const s of validServices) {
                await client.query(`
                    INSERT INTO project_services (project_id, service_name, quantity, unit_rate, line_total, notes, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                `, [id, s.service_name, s.quantity, s.unit_rate, s.line_total, s.notes || null]);
            }
        }

        // Fetch refreshed services
        const servRes = await client.query('SELECT * FROM project_services WHERE project_id = $1 ORDER BY id ASC', [id]);
        updatedProject.services = servRes.rows;

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: 'ওয়ার্ক অর্ডার সফলভাবে আপডেট করা হয়েছে।',
            data: updatedProject
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('updateProject error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভার এরর: ' + error.message });
    } finally {
        client.release();
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
