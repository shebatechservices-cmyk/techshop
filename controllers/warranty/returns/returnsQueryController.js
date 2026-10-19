const pool = require('../../../config/db');
const { ensureWarrantyTables } = require('../warrantySchema');

// Get All Product Returns
exports.getReturns = async (req, res) => {
    try {
        await ensureWarrantyTables();
        const { search } = req.query;
        let conditions = ['deleted_at IS NULL'];
        let params = [];

        if (search && search.trim()) {
            params.push(`%${search.trim().toLowerCase()}%`);
            conditions.push(`(
                LOWER(return_no) LIKE $${params.length} OR 
                LOWER(invoice_no) LIKE $${params.length} OR 
                LOWER(customer_name) LIKE $${params.length} OR 
                LOWER(product_name) LIKE $${params.length} OR 
                LOWER(serial_code) LIKE $${params.length}
            )`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const result = await pool.query(`SELECT * FROM product_returns ${whereClause} ORDER BY id DESC LIMIT 200;`, params);

        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Get returns error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Update Return (Edit Return Record)
exports.updateReturn = async (req, res) => {
    try {
        await ensureWarrantyTables();
        const { id } = req.params;
        const {
            customer_name,
            customer_phone,
            product_name,
            serial_code,
            return_type,
            condition,
            refund_amount,
            return_reason,
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
        if (return_type !== undefined) {
            values.push(return_type);
            updateFields.push(`return_type = $${values.length}`);
        }
        if (condition !== undefined) {
            values.push(condition);
            updateFields.push(`condition = $${values.length}`);
        }
        if (refund_amount !== undefined) {
            values.push(parseFloat(refund_amount || 0));
            updateFields.push(`refund_amount = $${values.length}`);
        }
        if (return_reason !== undefined) {
            values.push(return_reason ? return_reason.trim() : null);
            updateFields.push(`return_reason = $${values.length}`);
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
            UPDATE product_returns 
            SET ${updateFields.join(', ')} 
            WHERE id = $${values.length} 
            RETURNING *;
        `;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Return record not found.' });
        }

        return res.status(200).json({
            success: true,
            message: `Product return ${result.rows[0].return_no} updated successfully!`,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('updateReturn error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
