const pool = require('../../config/db');
const { MODULE_CONFIG, resolveModule } = require('./trashConfig');

// ১. গ্লোবাল ট্র্যাশ তালিকা (Get All Trash Records across entire system)
const getAllTrash = async (req, res) => {
    try {
        const { module: reqModule, search } = req.query;
        let modulesToQuery = [];

        if (reqModule && reqModule !== 'all') {
            const resolved = resolveModule(reqModule);
            if (resolved) {
                modulesToQuery.push(resolved);
            } else {
                return res.status(400).json({ success: false, message: 'ভুল মডিউল নাম!' });
            }
        } else {
            // Query all configured modules
            modulesToQuery = Object.keys(MODULE_CONFIG).map(k => ({ moduleKey: k, config: MODULE_CONFIG[k] }));
        }

        let allTrashed = [];

        for (const { moduleKey, config } of modulesToQuery) {
            try {
                const query = `SELECT * FROM ${config.table} WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC LIMIT 100`;
                const result = await pool.query(query);

                for (const row of result.rows) {
                    allTrashed.push({
                        id: row.id,
                        module: moduleKey,
                        table_name: config.table,
                        module_label: config.label,
                        icon: config.icon,
                        title: config.getTitle(row),
                        subtitle: config.getSubtitle(row),
                        deleted_at: row.deleted_at,
                        deleted_by: row.deleted_by || 'Admin',
                        raw_data: row
                    });
                }
            } catch (tableErr) {
                // Table might not have deleted_at or might not exist; safely continue
                console.warn(`Notice reading trash from ${config.table}:`, tableErr.message);
            }
        }

        // Apply search filter if provided
        if (search && search.trim()) {
            const s = search.trim().toLowerCase();
            allTrashed = allTrashed.filter(item => 
                item.title.toLowerCase().includes(s) || 
                item.subtitle.toLowerCase().includes(s) || 
                String(item.id).includes(s) ||
                item.module.toLowerCase().includes(s)
            );
        }

        // Sort globally by deleted_at descending
        allTrashed.sort((a, b) => new Date(b.deleted_at || 0) - new Date(a.deleted_at || 0));

        return res.status(200).json({
            success: true,
            count: allTrashed.length,
            data: allTrashed
        });
    } catch (error) {
        console.error('getAllTrash error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ২. মডিউল ভিত্তিক ট্র্যাশ কাউন্ট (Get Counts for UI Tabs)
const getTrashCounts = async (req, res) => {
    try {
        const counts = { all: 0 };

        for (const [key, config] of Object.entries(MODULE_CONFIG)) {
            try {
                const q = `SELECT COUNT(*) FROM ${config.table} WHERE deleted_at IS NOT NULL`;
                const r = await pool.query(q);
                const count = parseInt(r.rows[0].count, 10) || 0;
                counts[key] = count;
                counts.all += count;
            } catch {
                counts[key] = 0;
            }
        }

        return res.status(200).json({ success: true, counts });
    } catch (error) {
        console.error('getTrashCounts error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ৩. মডিউল প্রিভিউ (Get Trash Preview for Single Module - Legacy/Direct)
const getTrashPreview = async (req, res) => {
    try {
        const { module_name } = req.params;
        const resolved = resolveModule(module_name);
        if (!resolved) {
            return res.status(400).json({ success: false, message: 'ভুল মডিউল নাম!' });
        }

        const { config } = resolved;
        const query = `SELECT * FROM ${config.table} WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`;
        const result = await pool.query(query);

        const formatted = result.rows.map(row => ({
            id: row.id,
            module: resolved.moduleKey,
            title: config.getTitle(row),
            subtitle: config.getSubtitle(row),
            deleted_at: row.deleted_at,
            deleted_by: row.deleted_by || 'Admin',
            raw_data: row
        }));

        return res.status(200).json({ success: true, count: formatted.length, data: formatted });
    } catch (error) {
        console.error('getTrashPreview error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllTrash,
    getTrashCounts,
    getTrashPreview,
};
