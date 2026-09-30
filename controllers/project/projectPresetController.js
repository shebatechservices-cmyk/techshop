const pool = require("../../config/db");

// ==========================================
// SERVICE PRESETS CRUD HANDLERS (RULE 1)
// ==========================================

// ১৩. সার্ভিস প্রিসেট তালিকা খোঁজা
exports.getServicePresets = async (req, res) => {
    try {
        const { active_only } = req.query;
        let query = 'SELECT id, name, default_rate, is_active, created_at, updated_at FROM service_presets';
        const params = [];

        if (active_only === 'true' || active_only === '1') {
            query += ' WHERE is_active = true';
        }

        query += ' ORDER BY id ASC';

        const result = await pool.query(query, params);
        return res.status(200).json({
            success: true,
            data: result.rows.map(r => ({
                id: r.id,
                name: r.name,
                default_rate: parseFloat(r.default_rate || 0),
                is_active: Boolean(r.is_active),
                created_at: r.created_at,
                updated_at: r.updated_at
            }))
        });
    } catch (error) {
        console.error('getServicePresets error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভিস প্রিসেট লোড করতে সমস্যা হয়েছে।' });
    }
};

// ১৪. নতুন সার্ভিস প্রিসেট তৈরি করা
exports.createServicePreset = async (req, res) => {
    try {
        const { name, default_rate, is_active } = req.body;

        if (!name || !String(name).trim()) {
            return res.status(400).json({ success: false, message: 'সার্ভিসের নাম দেওয়া আবশ্যক।' });
        }

        const rate = parseFloat(default_rate) || 0;
        const active = is_active !== undefined ? Boolean(is_active) : true;

        const result = await pool.query(`
            INSERT INTO service_presets (name, default_rate, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING *;
        `, [name.trim(), rate, active]);

        const created = result.rows[0];
        return res.status(201).json({
            success: true,
            message: 'সার্ভিস প্রিসেট সফলভাবে যুক্ত হয়েছে।',
            data: {
                id: created.id,
                name: created.name,
                default_rate: parseFloat(created.default_rate || 0),
                is_active: Boolean(created.is_active),
                created_at: created.created_at,
                updated_at: created.updated_at
            }
        });
    } catch (error) {
        console.error('createServicePreset error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভিস প্রিসেট তৈরি করতে সমস্যা হয়েছে।' });
    }
};

// ১৫. সার্ভিস প্রিসেট আপডেট করা
exports.updateServicePreset = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, default_rate, is_active } = req.body;

        const existing = await pool.query('SELECT id FROM service_presets WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'সার্ভিস প্রিসেট পাওয়া যায়নি।' });
        }

        const updates = [];
        const values = [];
        let pIndex = 1;

        if (name !== undefined) {
            if (!String(name).trim()) {
                return res.status(400).json({ success: false, message: 'সার্ভিসের নাম ফাঁকা হতে পারে না।' });
            }
            updates.push(`name = $${pIndex++}`);
            values.push(name.trim());
        }

        if (default_rate !== undefined) {
            updates.push(`default_rate = $${pIndex++}`);
            values.push(parseFloat(default_rate) || 0);
        }

        if (is_active !== undefined) {
            updates.push(`is_active = $${pIndex++}`);
            values.push(Boolean(is_active));
        }

        updates.push(`updated_at = NOW()`);
        values.push(id);

        const updateQuery = `
            UPDATE service_presets 
            SET ${updates.join(', ')}
            WHERE id = $${pIndex}
            RETURNING *;
        `;

        const result = await pool.query(updateQuery, values);
        const updated = result.rows[0];

        return res.status(200).json({
            success: true,
            message: 'সার্ভিস প্রিসেট সফলভাবে আপডেট করা হয়েছে।',
            data: {
                id: updated.id,
                name: updated.name,
                default_rate: parseFloat(updated.default_rate || 0),
                is_active: Boolean(updated.is_active),
                created_at: updated.created_at,
                updated_at: updated.updated_at
            }
        });
    } catch (error) {
        console.error('updateServicePreset error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভিস প্রিসেট আপডেট করতে সমস্যা হয়েছে।' });
    }
};

// ১৬. সার্ভিস প্রিসেট ডিলিট করা
exports.deleteServicePreset = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM service_presets WHERE id = $1 RETURNING *;', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'সার্ভিস প্রিসেট পাওয়া যায়নি।' });
        }

        return res.status(200).json({
            success: true,
            message: 'সার্ভিস প্রিসেট মুছে ফেলা হয়েছে।',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('deleteServicePreset error:', error);
        return res.status(500).json({ success: false, message: 'সার্ভিস প্রিসেট মুছতে সমস্যা হয়েছে।' });
    }
};

// ==========================================
// JOB / SERVICE TYPES CRUD HANDLERS (RULE 1)
// ==========================================

// ১৭. প্রজেক্ট/জব টাইপ তালিকা খোঁজা
exports.getJobTypes = async (req, res) => {
    try {
        const { active_only } = req.query;
        let query = 'SELECT id, name, description, is_active, created_at, updated_at FROM project_job_types';
        const params = [];

        if (active_only === 'true' || active_only === '1') {
            query += ' WHERE is_active = true';
        }

        query += ' ORDER BY id ASC';

        const result = await pool.query(query, params);
        return res.status(200).json({
            success: true,
            data: result.rows.map(r => ({
                id: r.id,
                name: r.name,
                description: r.description || '',
                is_active: Boolean(r.is_active),
                created_at: r.created_at,
                updated_at: r.updated_at
            }))
        });
    } catch (error) {
        console.error('getJobTypes error:', error);
        return res.status(500).json({ success: false, message: 'জব টাইপ লোড করতে সমস্যা হয়েছে।' });
    }
};

// ১৮. নতুন প্রজেক্ট/জব টাইপ তৈরি করা
exports.createJobType = async (req, res) => {
    try {
        const { name, description, is_active } = req.body;

        if (!name || !String(name).trim()) {
            return res.status(400).json({ success: false, message: 'জব টাইপের নাম দেওয়া আবশ্যক।' });
        }

        const active = is_active !== undefined ? Boolean(is_active) : true;
        const desc = description ? String(description).trim() : null;

        const result = await pool.query(`
            INSERT INTO project_job_types (name, description, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING *;
        `, [name.trim(), desc, active]);

        const created = result.rows[0];
        return res.status(201).json({
            success: true,
            message: 'জব টাইপ সফলভাবে যুক্ত হয়েছে।',
            data: {
                id: created.id,
                name: created.name,
                description: created.description || '',
                is_active: Boolean(created.is_active),
                created_at: created.created_at,
                updated_at: created.updated_at
            }
        });
    } catch (error) {
        console.error('createJobType error:', error);
        return res.status(500).json({ success: false, message: 'জব টাইপ তৈরি করতে সমস্যা হয়েছে।' });
    }
};

// ১৯. প্রজেক্ট/জব টাইপ আপডেট করা
exports.updateJobType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, is_active } = req.body;

        const existing = await pool.query('SELECT id FROM project_job_types WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'জব টাইপ পাওয়া যায়নি।' });
        }

        const updates = [];
        const values = [];
        let pIndex = 1;

        if (name !== undefined) {
            if (!String(name).trim()) {
                return res.status(400).json({ success: false, message: 'জব টাইপের নাম ফাঁকা হতে পারে না।' });
            }
            updates.push(`name = $${pIndex++}`);
            values.push(name.trim());
        }

        if (description !== undefined) {
            updates.push(`description = $${pIndex++}`);
            values.push(description ? String(description).trim() : null);
        }

        if (is_active !== undefined) {
            updates.push(`is_active = $${pIndex++}`);
            values.push(Boolean(is_active));
        }

        updates.push(`updated_at = NOW()`);
        values.push(id);

        const updateQuery = `
            UPDATE project_job_types 
            SET ${updates.join(', ')}
            WHERE id = $${pIndex}
            RETURNING *;
        `;

        const result = await pool.query(updateQuery, values);
        const updated = result.rows[0];

        return res.status(200).json({
            success: true,
            message: 'জব টাইপ সফলভাবে আপডেট করা হয়েছে।',
            data: {
                id: updated.id,
                name: updated.name,
                description: updated.description || '',
                is_active: Boolean(updated.is_active),
                created_at: updated.created_at,
                updated_at: updated.updated_at
            }
        });
    } catch (error) {
        console.error('updateJobType error:', error);
        return res.status(500).json({ success: false, message: 'জব টাইপ আপডেট করতে সমস্যা হয়েছে।' });
    }
};

// ২০. প্রজেক্ট/জব টাইপ ডিলিট করা
exports.deleteJobType = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM project_job_types WHERE id = $1 RETURNING *;', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'জব টাইপ পাওয়া যায়নি।' });
        }

        return res.status(200).json({
            success: true,
            message: 'জব টাইপ মুছে ফেলা হয়েছে।',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('deleteJobType error:', error);
        return res.status(500).json({ success: false, message: 'জব টাইপ মুছতে সমস্যা হয়েছে।' });
    }
};


