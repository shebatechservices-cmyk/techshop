const pool = require('../../config/db');

// Payment Methods Management (Centralized Database-Driven System)
exports.getPaymentMethods = async (req, res) => {
    try {
        const activeOnly = String(req.query.active_only || req.query.is_active || '').toLowerCase() === 'true';
        let query = 'SELECT * FROM payment_methods WHERE deleted_at IS NULL';
        if (activeOnly) {
            query += ' AND is_active = true';
        }
        query += ' ORDER BY id ASC';

        const result = await pool.query(query);
        const data = result.rows.map((row) => ({
            ...row,
            name: row.name || row.method_name,
            method_name: row.method_name || row.name,
            type: row.type || 'cash',
            account_number: row.account_number || '',
            is_active: row.is_active ?? true,
        }));
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.addPaymentMethod = async (req, res) => {
    try {
        const rawName = req.body.name || req.body.method_name;
        if (!rawName || !String(rawName).trim()) {
            return res.status(400).json({ success: false, message: 'পেমেন্ট মেথডের নাম আবশ্যক' });
        }
        const name = String(rawName).trim();
        const type = String(req.body.type || 'cash').trim().toLowerCase();
        const accountNumber = req.body.account_number ? String(req.body.account_number).trim() : null;
        const details = req.body.account_details ? String(req.body.account_details).trim() : null;
        const isActive = req.body.is_active !== undefined ? Boolean(req.body.is_active) : true;

        const result = await pool.query(
            `INSERT INTO payment_methods (name, method_name, type, account_number, account_details, is_active, created_at, updated_at, deleted_at) 
             VALUES ($1, $1, $2, $3, $4, $5, NOW(), NOW(), NULL)
             ON CONFLICT (method_name) 
             DO UPDATE SET 
                name = EXCLUDED.name,
                type = EXCLUDED.type,
                account_number = COALESCE(EXCLUDED.account_number, payment_methods.account_number),
                account_details = COALESCE(EXCLUDED.account_details, payment_methods.account_details),
                is_active = EXCLUDED.is_active,
                updated_at = NOW(),
                deleted_at = NULL
             RETURNING *`,
            [name, type, accountNumber, details, isActive]
        );
        const saved = {
            ...result.rows[0],
            name: result.rows[0].name || result.rows[0].method_name,
            method_name: result.rows[0].method_name || result.rows[0].name,
        };
        return res.status(201).json({ success: true, message: 'পেমেন্ট মেথড যোগ করা হয়েছে', data: saved });
    } catch (error) {
        console.error('addPaymentMethod error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.updatePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const rawName = req.body.name || req.body.method_name;
        const type = req.body.type !== undefined ? String(req.body.type).trim().toLowerCase() : undefined;
        const accountNumber = req.body.account_number !== undefined ? (req.body.account_number ? String(req.body.account_number).trim() : null) : undefined;
        const details = req.body.account_details !== undefined ? (req.body.account_details ? String(req.body.account_details).trim() : null) : undefined;
        const isActive = req.body.is_active !== undefined ? Boolean(req.body.is_active) : undefined;

        let name = undefined;
        if (rawName !== undefined) {
            name = String(rawName).trim();
            if (!name) return res.status(400).json({ success: false, message: 'পেমেন্ট মেথডের নাম খালি রাখা যাবে না' });
        }

        const result = await pool.query(
            `UPDATE payment_methods 
             SET name = COALESCE($1, name),
                 method_name = COALESCE($1, method_name),
                 type = COALESCE($2, type),
                 account_number = CASE WHEN $3::boolean THEN $4 ELSE account_number END,
                 account_details = CASE WHEN $5::boolean THEN $6 ELSE account_details END,
                 is_active = COALESCE($7, is_active),
                 updated_at = NOW()
             WHERE id = $8 AND deleted_at IS NULL
             RETURNING *`,
            [
                name,
                type,
                accountNumber !== undefined,
                accountNumber,
                details !== undefined,
                details,
                isActive,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'পেমেন্ট মেথড পাওয়া যায়নি' });
        }

        const updated = {
            ...result.rows[0],
            name: result.rows[0].name || result.rows[0].method_name,
            method_name: result.rows[0].method_name || result.rows[0].name,
        };
        return res.status(200).json({ success: true, message: 'পেমেন্ট মেথড আপডেট করা হয়েছে', data: updated });
    } catch (error) {
        console.error('updatePaymentMethod error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.togglePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'UPDATE payment_methods SET is_active = NOT COALESCE(is_active, true), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'পেমেন্ট মেথড পাওয়া যায়নি' });
        }
        const updated = {
            ...result.rows[0],
            name: result.rows[0].name || result.rows[0].method_name,
            method_name: result.rows[0].method_name || result.rows[0].name,
        };
        return res.status(200).json({ success: true, message: 'স্ট্যাটাস পরিবর্তন করা হয়েছে', data: updated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.deletePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'UPDATE payment_methods SET deleted_at = NOW(), is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'পেমেন্ট মেথড পাওয়া যায়নি' });
        }
        return res.status(200).json({ success: true, message: 'পেমেন্ট মেথড সফলভাবে নিষ্ক্রিয় (Soft Delete) করা হয়েছে' });
    } catch (error) {
        console.error('deletePaymentMethod error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
