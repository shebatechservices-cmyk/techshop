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
