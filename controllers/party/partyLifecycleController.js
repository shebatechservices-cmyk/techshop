const pool = require('../../config/db');

// 3. IN-PLACE PROFILE EDIT
exports.updatePartyProfile = async (req, res) => {
    try {
        const { type, id } = req.params;
        const partyId = parseInt(id);
        const { name, phone, email, address, role_or_type, role_id } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }

        if (type === 'customer') {
            const result = await pool.query(`
                UPDATE customers 
                SET name = $1, phone = $2, email = $3, address = $4, customer_type = $5
                WHERE id = $6
                RETURNING *
            `, [name.trim(), phone || '', email || '', address || '', role_or_type || 'Retail', partyId]);
            if (!result.rows.length) return res.status(404).json({ success: false, message: 'Customer not found' });
            return res.status(200).json({ success: true, message: 'Customer profile updated successfully', data: result.rows[0] });

        } else if (type === 'supplier') {
            const result = await pool.query(`
                UPDATE suppliers
                SET name = $1, phone = $2, mobile = $2, email = $3, address = $4, contact_person = $5
                WHERE id = $6
                RETURNING *
            `, [name.trim(), phone || '', email || '', address || '', role_or_type || 'Vendor', partyId]);
            if (!result.rows.length) return res.status(404).json({ success: false, message: 'Supplier not found' });
            return res.status(200).json({ success: true, message: 'Supplier profile updated successfully', data: result.rows[0] });

        } else if (type === 'staff') {
            const roleVal = role_id ? parseInt(role_id) : 3;
            const result = await pool.query(`
                UPDATE users
                SET name = $1, phone = $2, email = $3, role_id = $4
                WHERE id = $5
                RETURNING id, name, phone, email, role_id, is_active
            `, [name.trim(), phone || '', email || '', roleVal, partyId]);
            if (!result.rows.length) return res.status(404).json({ success: false, message: 'Staff member not found' });
            return res.status(200).json({ success: true, message: 'Staff profile updated successfully', data: result.rows[0] });

        } else {
            return res.status(400).json({ success: false, message: 'Invalid party type' });
        }
    } catch (error) {
        console.error('updatePartyProfile error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 4. SAFE DELETION (ONLY IF ZERO ACTIVITY)
exports.deleteParty = async (req, res) => {
    try {
        const { type, id } = req.params;
        const partyId = parseInt(id);
        if (!partyId) return res.status(400).json({ success: false, message: 'Invalid ID' });

        if (type === 'customer') {
            // Check sales
            const salesCheck = await pool.query('SELECT COUNT(*) FROM sales WHERE customer_id = $1', [partyId]);
            const salesCount = parseInt(salesCheck.rows[0].count);

            // Check quotations
            const quoteCheck = await pool.query('SELECT COUNT(*) FROM sales_quotations WHERE customer_id = $1', [partyId]);
            const quoteCount = parseInt(quoteCheck.rows[0].count);

            // Check service projects
            const projCheck = await pool.query('SELECT COUNT(*) FROM service_projects WHERE customer_id = $1 AND deleted_at IS NULL', [partyId]).catch(() => ({ rows: [{ count: 0 }] }));
            const projCount = parseInt(projCheck.rows[0].count, 10) || 0;

            // Check balance
            const balCheck = await pool.query('SELECT receivable_balance FROM customers WHERE id = $1', [partyId]);
            const bal = balCheck.rows.length ? parseFloat(balCheck.rows[0].receivable_balance || 0) : 0;

            if ((salesCount > 0 || quoteCount > 0 || projCount > 0) && req.query.force !== 'true') {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete customer: ${salesCount} sales invoices, ${quoteCount} quotations, or ${projCount} service projects exist. Records must be preserved.`
                });
            }

            const custRes = await pool.query('SELECT * FROM customers WHERE id = $1', [partyId]);
            const cust = custRes.rows[0] || { id: partyId, type: 'customer' };

            // Safe to soft delete into Trash
            await pool.query('UPDATE customers SET deleted_at = NOW() WHERE id = $1', [partyId]);
            await pool.query(`
                INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
                VALUES ('customers', $1, $2, $3, NOW())
            `, [partyId, cust.name || `Customer #${partyId}`, JSON.stringify(cust)]).catch(() => null);
            return res.status(200).json({ success: true, message: 'Customer moved to Trash successfully.' });

        } else if (type === 'supplier') {
            // Check purchase orders
            const poCheck = await pool.query('SELECT COUNT(*) FROM purchase_orders WHERE supplier_id = $1 AND deleted_at IS NULL', [partyId]);
            const poCount = parseInt(poCheck.rows[0].count);

            // Check quotations
            const quoteCheck = await pool.query('SELECT COUNT(*) FROM purchase_quotations WHERE supplier_id = $1 AND deleted_at IS NULL', [partyId]);
            const quoteCount = parseInt(quoteCheck.rows[0].count);

            if ((poCount > 0 || quoteCount > 0) && req.query.force !== 'true') {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete supplier: ${poCount} purchase orders or ${quoteCount} quotations exist. Records must be preserved.`
                });
            }

            const supRes = await pool.query('SELECT * FROM suppliers WHERE id = $1', [partyId]);
            const sup = supRes.rows[0] || { id: partyId, type: 'supplier' };

            // Safe to soft delete into Trash
            await pool.query('UPDATE suppliers SET deleted_at = NOW() WHERE id = $1', [partyId]);
            await pool.query(`
                INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
                VALUES ('suppliers', $1, $2, $3, NOW())
            `, [partyId, sup.name || `Supplier #${partyId}`, JSON.stringify(sup)]).catch(() => null);
            return res.status(200).json({ success: true, message: 'Supplier moved to Trash successfully.' });

        } else if (type === 'staff') {
            if (partyId === 1) {
                return res.status(400).json({ success: false, message: 'Super Admin account cannot be deleted.' });
            }

            const staffCheck = await pool.query('SELECT name FROM users WHERE id = $1', [partyId]);
            if (!staffCheck.rows.length) return res.status(404).json({ success: false, message: 'Staff member not found' });
            const staffName = staffCheck.rows[0].name;

            // 1. Check sales
            const salesCheck = await pool.query(
                'SELECT COUNT(*) FROM sales WHERE (sales_person = $1 OR sold_by = $2) AND deleted_at IS NULL',
                [staffName, partyId]
            ).catch(() => ({ rows: [{ count: 0 }] }));
            const salesCount = parseInt(salesCheck.rows[0].count, 10) || 0;

            // 2. Check service projects (assigned technician or confirmed by)
            const projCheck = await pool.query(
                'SELECT COUNT(*) FROM service_projects WHERE (assigned_technician = $1 OR technician_id = $1 OR confirmed_by = $1) AND deleted_at IS NULL',
                [partyId]
            ).catch(() => ({ rows: [{ count: 0 }] }));
            const projCount = parseInt(projCheck.rows[0].count, 10) || 0;

            // 3. Check expenses created
            const expCheck = await pool.query(
                'SELECT COUNT(*) FROM expenses WHERE created_by = $1',
                [partyId]
            ).catch(() => ({ rows: [{ count: 0 }] }));
            const expCount = parseInt(expCheck.rows[0].count, 10) || 0;

            if (salesCount > 0 || projCount > 0 || expCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete staff/technician: ${projCount} service projects, ${salesCount} sales invoices, or ${expCount} expenses are attached to this user.`
                });
            }

            await pool.query('UPDATE users SET deleted_at = NOW() WHERE id = $1', [partyId]);
            await pool.query(`
                INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
                VALUES ('users', $1, $2, $3, NOW())
            `, [partyId, staffName || `Staff #${partyId}`, JSON.stringify({ id: partyId, name: staffName })]).catch(() => null);
            return res.status(200).json({ success: true, message: 'Staff member moved to Trash successfully.' });

        } else {
            return res.status(400).json({ success: false, message: 'Invalid party type' });
        }
    } catch (error) {
        console.error('deleteParty error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
