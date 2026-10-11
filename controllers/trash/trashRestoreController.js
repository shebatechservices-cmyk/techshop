const pool = require('../../config/db');
const { MODULE_CONFIG, resolveModule } = require('./trashConfig');

// ৪. ট্র্যাশ থেকে রিস্টোর করা (Restore Single Item)
const restoreData = async (req, res) => {
    try {
        const { module_name, module: reqModule, id } = req.body;
        const resolved = resolveModule(module_name || reqModule);
        if (!resolved) {
            return res.status(400).json({ success: false, message: 'ভুল মডিউল নাম!' });
        }

        const { config } = resolved;
        const query = `UPDATE ${config.table} SET deleted_at = NULL, deleted_by = NULL WHERE id = $1 RETURNING id`;
        const result = await pool.query(query, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'রেকর্ড পাওয়া যায়নি অথবা ইতিমধ্যে রিস্টোর করা হয়েছে।' });
        }

        // Live Inventory sync: if purchase order is restored, replenish warehouse stock
        if (config.table === 'purchase_orders') {
            const poItems = await pool.query(
                'SELECT product_id, quantity FROM purchase_order_items WHERE purchase_order_id = $1',
                [id]
            );
            for (const item of poItems.rows) {
                await pool.query(
                    `UPDATE products
                     SET stock = COALESCE(stock, 0) + $1,
                         updated_at = NOW()
                     WHERE id = $2`,
                    [Number(item.quantity || 0), item.product_id]
                );
            }
            const poRow = await pool.query('SELECT supplier_id, total_due FROM purchase_orders WHERE id = $1', [id]);
            if (poRow.rows.length && poRow.rows[0].supplier_id && Number(poRow.rows[0].total_due) > 0) {
                await pool.query(
                    `UPDATE suppliers SET payable_balance = COALESCE(payable_balance, 0) + $1, updated_at = NOW() WHERE id = $2`,
                    [Number(poRow.rows[0].total_due), poRow.rows[0].supplier_id]
                );
            }
        }

        // Live Inventory sync: if sale invoice is restored, restore items & serials and deduct stock
        if (config.table === 'sales') {
            const trashRes = await pool.query(
                'SELECT record_data FROM trash_records WHERE table_name = $1 AND record_id = $2',
                [config.table, id]
            ).catch(() => ({ rows: [] }));
            const recordData = trashRes.rows[0]?.record_data;
            if (recordData && Array.isArray(recordData.items) && recordData.items.length > 0) {
                const currentItemsCount = await pool.query('SELECT COUNT(*) FROM sales_items WHERE sale_id = $1', [id]);
                if (Number(currentItemsCount.rows[0]?.count || 0) === 0) {
                    for (const it of recordData.items) {
                        const insRes = await pool.query(`
                            INSERT INTO sales_items (
                                sale_id, product_id, quantity, unit_price, cost_price, line_total,
                                warranty_months, warranty_expire_date, unit_type, conversion_rate, unit_name, discount
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                            RETURNING id
                        `, [
                            id, it.product_id, it.quantity, it.unit_price, it.cost_price, it.line_total,
                            it.warranty_months || 0, it.warranty_expire_date || null,
                            it.unit_type || 'base_unit', it.conversion_rate || 1, it.unit_name || null, it.discount || 0
                        ]);
                        const newId = insRes.rows[0]?.id;
                        if (newId && Array.isArray(it.serials) && it.serials.length > 0) {
                            for (const s of it.serials) {
                                await pool.query(
                                    'INSERT INTO sales_item_serials (sales_item_id, serial_code) VALUES ($1, $2)',
                                    [newId, s]
                                );
                            }
                        }
                        // Deduct stock for restored item
                        await pool.query(
                            'UPDATE products SET stock = GREATEST(0, COALESCE(stock, 0) - $1), updated_at = NOW() WHERE id = $2',
                            [Number(it.quantity || 1), it.product_id]
                        );
                    }
                }
            }
        }

        // Also clean up from trash_records archive if present
        await pool.query(`DELETE FROM trash_records WHERE table_name = $1 AND record_id = $2`, [config.table, id]).catch(() => {});

        return res.status(200).json({
            success: true,
            message: `"${config.label}" সফলভাবে রিস্টোর করা হয়েছে!`
        });
    } catch (error) {
        console.error('restoreData error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ৫. সকল ট্র্যাশ রিস্টোর করা (Restore All Trashed Items)
const restoreAll = async (req, res) => {
    try {
        const { module_name, module: reqModule } = req.body;
        const targetModule = module_name || reqModule;
        let restoredCount = 0;

        if (targetModule && targetModule !== 'all') {
            const resolved = resolveModule(targetModule);
            if (!resolved) return res.status(400).json({ success: false, message: 'ভুল মডিউল নাম!' });
            const result = await pool.query(`UPDATE ${resolved.config.table} SET deleted_at = NULL, deleted_by = NULL WHERE deleted_at IS NOT NULL RETURNING id`);
            restoredCount = result.rowCount;
            await pool.query(`DELETE FROM trash_records WHERE table_name = $1`, [resolved.config.table]).catch(() => {});
        } else {
            for (const [_, config] of Object.entries(MODULE_CONFIG)) {
                try {
                    const result = await pool.query(`UPDATE ${config.table} SET deleted_at = NULL, deleted_by = NULL WHERE deleted_at IS NOT NULL RETURNING id`);
                    restoredCount += result.rowCount;
                } catch {}
            }
            await pool.query(`TRUNCATE TABLE trash_records`).catch(() => {});
        }

        return res.status(200).json({
            success: true,
            message: `মোট ${restoredCount} টি রেকর্ড সফলভাবে রিস্টোর করা হয়েছে!`,
            count: restoredCount
        });
    } catch (error) {
        console.error('restoreAll error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    restoreData,
    restoreAll,
};
