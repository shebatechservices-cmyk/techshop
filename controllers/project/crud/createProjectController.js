const pool = require("../../../config/db");

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
