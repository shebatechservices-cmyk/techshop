const pool = require('../../config/db');
const { ensureWarrantyTables } = require('./warrantySchema');

// Get All Warranty Claims
exports.getClaims = async (req, res) => {
    try {
        await ensureWarrantyTables();
        const { status, search } = req.query;
        let conditions = ['deleted_at IS NULL'];
        let params = [];

        if (status && status !== 'ALL') {
            params.push(status);
            conditions.push(`status = $${params.length}`);
        }

        if (search && search.trim()) {
            params.push(`%${search.trim().toLowerCase()}%`);
            conditions.push(`(
                LOWER(claim_no) LIKE $${params.length} OR 
                LOWER(serial_code) LIKE $${params.length} OR 
                LOWER(customer_name) LIKE $${params.length} OR 
                LOWER(customer_phone) LIKE $${params.length} OR 
                LOWER(product_name) LIKE $${params.length} OR 
                LOWER(invoice_no) LIKE $${params.length}
            )`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const query = `SELECT * FROM warranty_claims ${whereClause} ORDER BY id DESC LIMIT 200;`;
        const result = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Get claims error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Create Warranty Claim
exports.createWarrantyClaim = async (req, res) => {
    try {
        await ensureWarrantyTables();
        const {
            order_source = 'offline',
            invoice_no,
            ecommerce_order_no,
            customer_id,
            customer_name,
            customer_phone,
            product_id,
            product_name,
            serial_code,
            barcode,
            issue_description,
            backup_unit_provided,
            estimated_delivery_date,
            service_notes
        } = req.body;

        if (!issue_description) {
            return res.status(400).json({ success: false, message: 'Please enter issue description.' });
        }

        const claim_no = 'CLM-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
        const effectiveSerial = serial_code || barcode || 'S/N-MANUAL';

        const query = `
            INSERT INTO warranty_claims 
            (claim_no, order_source, invoice_no, ecommerce_order_no, customer_id, customer_name, customer_phone, 
             product_id, product_name, serial_code, barcode, issue_description, status, backup_unit_provided, 
             estimated_delivery_date, service_notes) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Received', $13, $14, $15) 
            RETURNING *;
        `;
        const values = [
            claim_no,
            order_source,
            invoice_no || null,
            ecommerce_order_no || null,
            customer_id || null,
            customer_name || 'Walk-in Customer',
            customer_phone || '',
            product_id || null,
            product_name || 'Product Unit',
            effectiveSerial,
            barcode || effectiveSerial,
            issue_description,
            backup_unit_provided || 'None',
            estimated_delivery_date || null,
            service_notes || ''
        ];

        const result = await pool.query(query, values);

        return res.status(201).json({
            success: true,
            message: `Warranty claim accepted! Token Slip: ${claim_no}`,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Create warranty claim error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Update Claim Status & Notes
exports.updateClaimStatus = async (req, res) => {
    try {
        await ensureWarrantyTables();
        const { id } = req.params;
        const { status, service_notes, replacement_serial_code } = req.body;

        const updateFields = [];
        const values = [];

        if (status) {
            values.push(status);
            updateFields.push(`status = $${values.length}`);
            if (status === 'Delivered') {
                updateFields.push(`completed_date = NOW()`);
            }
        }
        if (service_notes !== undefined) {
            values.push(service_notes);
            updateFields.push(`service_notes = $${values.length}`);
        }
        if (replacement_serial_code !== undefined) {
            values.push(replacement_serial_code);
            updateFields.push(`replacement_serial_code = $${values.length}`);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields provided to update.' });
        }

        values.push(id);
        const query = `
            UPDATE warranty_claims 
            SET ${updateFields.join(', ')} 
            WHERE id = $${values.length} 
            RETURNING *;
        `;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Claim not found.' });
        }

        return res.status(200).json({
            success: true,
            message: `Claim status updated to ${status}!`,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Update claim status error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Full Claim Edit
exports.updateClaim = async (req, res) => {
    try {
        await ensureWarrantyTables();
        const { id } = req.params;
        const {
            customer_name,
            customer_phone,
            product_name,
            serial_code,
            issue_description,
            backup_unit_provided,
            status,
            service_notes,
            replacement_serial_code,
            estimated_delivery_date,
            invoice_no
        } = req.body;

        const updateFields = [];
        const values = [];

        if (customer_name !== undefined) {
            values.push(customer_name ? customer_name.trim() : null);
            updateFields.push(`customer_name = $${values.length}`);
        }
        if (customer_phone !== undefined) {
            values.push(customer_phone ? customer_phone.trim() : null);
            updateFields.push(`customer_phone = $${values.length}`);
        }
        if (product_name !== undefined) {
            values.push(product_name ? product_name.trim() : null);
            updateFields.push(`product_name = $${values.length}`);
        }
        if (serial_code !== undefined) {
            values.push(serial_code ? serial_code.trim() : null);
            updateFields.push(`serial_code = $${values.length}`);
        }
        if (issue_description !== undefined) {
            values.push(issue_description ? issue_description.trim() : null);
            updateFields.push(`issue_description = $${values.length}`);
        }
        if (backup_unit_provided !== undefined) {
            values.push(backup_unit_provided ? backup_unit_provided.trim() : null);
            updateFields.push(`backup_unit_provided = $${values.length}`);
        }
        if (status !== undefined) {
            values.push(status);
            updateFields.push(`status = $${values.length}`);
            if (status === 'Delivered') {
                updateFields.push(`completed_date = NOW()`);
            }
        }
        if (service_notes !== undefined) {
            values.push(service_notes ? service_notes.trim() : null);
            updateFields.push(`service_notes = $${values.length}`);
        }
        if (replacement_serial_code !== undefined) {
            values.push(replacement_serial_code ? replacement_serial_code.trim() : null);
            updateFields.push(`replacement_serial_code = $${values.length}`);
        }
        if (estimated_delivery_date !== undefined) {
            values.push(estimated_delivery_date || null);
            updateFields.push(`estimated_delivery_date = $${values.length}`);
        }
        if (invoice_no !== undefined) {
            values.push(invoice_no ? invoice_no.trim() : null);
            updateFields.push(`invoice_no = $${values.length}`);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields provided to update.' });
        }

        values.push(id);
        const query = `
            UPDATE warranty_claims 
            SET ${updateFields.join(', ')} 
            WHERE id = $${values.length} 
            RETURNING *;
        `;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Claim not found.' });
        }

        return res.status(200).json({
            success: true,
            message: `Warranty claim ${result.rows[0].claim_no} updated successfully!`,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('updateClaim error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Delete Claim (Soft Delete to Trash)
exports.deleteClaim = async (req, res) => {
    try {
        const { id } = req.params;
        const claimId = parseInt(id, 10);
        if (!claimId) return res.status(400).json({ success: false, message: 'Invalid claim ID' });

        const existing = await pool.query('SELECT * FROM warranty_claims WHERE id = $1', [claimId]);
        if (!existing.rows.length) return res.status(404).json({ success: false, message: 'Claim not found' });

        const row = existing.rows[0];
        await pool.query('UPDATE warranty_claims SET deleted_at = NOW() WHERE id = $1', [claimId]);
        await pool.query(
            `INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
             VALUES ('warranty_claims', $1, $2, $3, NOW())`,
            [claimId, `Warranty Claim ${row.claim_no}`, JSON.stringify(row)]
        ).catch(() => null);

        return res.status(200).json({ success: true, message: `Warranty claim ${row.claim_no} moved to Trash.` });
    } catch (err) {
        console.error('Delete claim error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
