const pool = require('../../config/db');
const { MODULE_CONFIG, resolveModule } = require('./trashConfig');

// ৬. চিরতরে মুছে ফেলা (Permanent Delete Single Item)
const permanentDelete = async (req, res) => {
    try {
        const { module_name, module: reqModule, id } = req.body;
        const resolved = resolveModule(module_name || reqModule);
        if (!resolved) {
            return res.status(400).json({ success: false, message: 'ভুল মডিউল নাম!' });
        }

        const { config } = resolved;
        const query = `DELETE FROM ${config.table} WHERE id = $1 RETURNING id`;
        const result = await pool.query(query, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'রেকর্ড পাওয়া যায়নি।' });
        }

        // Clean up trash_records
        await pool.query(`DELETE FROM trash_records WHERE table_name = $1 AND record_id = $2`, [config.table, id]).catch(() => {});

        return res.status(200).json({
            success: true,
            message: `"${config.label}" চিরতরে মুছে ফেলা হয়েছে!`
        });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({
                success: false,
                message: 'এই রেকর্ডটি অন্য কোনো টেবিলে রেফারেন্স হিসেবে যুক্ত রয়েছে। আগে সম্পর্কিত রেকর্ডগুলো মুছতে হবে।'
            });
        }
        console.error('permanentDelete error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ৭. ট্র্যাশ খালি করা (Empty Entire Trash)
const emptyTrash = async (req, res) => {
    try {
        const { module_name } = req.body;
        let deletedTotal = 0;

        if (module_name && module_name !== 'all') {
            const resolved = resolveModule(module_name);
            if (!resolved) return res.status(400).json({ success: false, message: 'ভুল মডিউল নাম!' });
            const result = await pool.query(`DELETE FROM ${resolved.config.table} WHERE deleted_at IS NOT NULL RETURNING id`);
            deletedTotal = result.rowCount;
            await pool.query(`DELETE FROM trash_records WHERE table_name = $1`, [resolved.config.table]).catch(() => {});
        } else {
            for (const [_, config] of Object.entries(MODULE_CONFIG)) {
                try {
                    const result = await pool.query(`DELETE FROM ${config.table} WHERE deleted_at IS NOT NULL RETURNING id`);
                    deletedTotal += result.rowCount;
                } catch {}
            }
            await pool.query(`TRUNCATE TABLE trash_records`).catch(() => {});
        }

        return res.status(200).json({
            success: true,
            message: `ট্র্যাশ খালি করা হয়েছে! মোট ${deletedTotal} টি রেকর্ড চিরতরে মুছে ফেলা হলো।`,
            count: deletedTotal
        });
    } catch (error) {
        console.error('emptyTrash error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    permanentDelete,
    emptyTrash,
};
