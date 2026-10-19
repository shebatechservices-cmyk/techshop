const pool = require("../../../config/db");

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
