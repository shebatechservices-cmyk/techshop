const pool = require('../config/db');

// Module definition with table name, display label, and title/subtitle formatters
const MODULE_CONFIG = {
    products: {
        table: 'products',
        label: 'Product (পণ্য)',
        icon: '📦',
        getTitle: (r) => r.name || 'Unnamed Product',
        getSubtitle: (r) => `SKU: ${r.sku || 'N/A'} | Stock: ${r.stock || 0} | Price: ৳${parseFloat(r.selling_price || 0).toLocaleString()}`
    },
    sales: {
        table: 'sales',
        label: 'Sales Invoice (বিক্রয় মেমো)',
        icon: '🧾',
        getTitle: (r) => `Invoice #${r.invoice_no || r.id}`,
        getSubtitle: (r) => `Total: ৳${parseFloat(r.total_amount || 0).toLocaleString()} | Paid: ৳${parseFloat(r.paid_amount || 0).toLocaleString()} | Date: ${r.sale_date ? new Date(r.sale_date).toLocaleDateString() : 'N/A'}`
    },
    purchases: {
        table: 'purchase_orders',
        label: 'Purchase Order (ক্রয়)',
        icon: '🛒',
        getTitle: (r) => `PO #${r.po_number || r.id}`,
        getSubtitle: (r) => `Total Cost: ৳${parseFloat(r.total_cost || 0).toLocaleString()} | Items: ${r.item_count || 0} | Status: ${r.status || 'Received'}`
    },
    customers: {
        table: 'customers',
        label: 'Customer (গ্রাহক)',
        icon: '👥',
        getTitle: (r) => r.name || 'Unnamed Customer',
        getSubtitle: (r) => `Phone: ${r.phone || 'N/A'} | Balance: ৳${parseFloat(r.receivable_balance || 0).toLocaleString()}`
    },
    suppliers: {
        table: 'suppliers',
        label: 'Supplier (সরবরাহকারী)',
        icon: '🏭',
        getTitle: (r) => r.name || 'Unnamed Supplier',
        getSubtitle: (r) => `Phone: ${r.phone || 'N/A'} | Payable: ৳${parseFloat(r.payable_balance || 0).toLocaleString()}`
    },
    expenses: {
        table: 'expenses',
        label: 'Expense (দৈনিক খরচ)',
        icon: '💸',
        getTitle: (r) => `${r.voucher_no || 'EXP-' + r.id} (${r.category_name || 'General'})`,
        getSubtitle: (r) => `Amount: ৳${parseFloat(r.amount || 0).toLocaleString()} | Payee: ${r.payee_name || 'N/A'} | Note: ${r.note || 'None'}`
    },
    projects: {
        table: 'service_projects',
        label: 'Project (সার্ভিস প্রজেক্ট)',
        icon: '🛠️',
        getTitle: (r) => `Project #${r.project_code || 'PRJ-' + r.id}`,
        getSubtitle: (r) => `Customer: ${r.customer_name || 'N/A'} | Status: ${r.status || 'Active'} | Cost: ৳${parseFloat(r.total_cost || 0).toLocaleString()}`
    },
    ecommerce: {
        table: 'ecommerce_orders',
        label: 'E-Commerce Order (অনলাইন অর্ডার)',
        icon: '🌐',
        getTitle: (r) => `Order #${r.order_number || 'ECOM-' + r.id}`,
        getSubtitle: (r) => `Customer: ${r.customer_name || 'Guest'} | Total: ৳${parseFloat(r.grand_total || 0).toLocaleString()} | Status: ${r.order_status || 'Pending'}`
    },
    categories: {
        table: 'categories',
        label: 'Category (ক্যাটাগরি)',
        icon: '🏷️',
        getTitle: (r) => r.name || 'Unnamed Category',
        getSubtitle: (r) => `Category Master Item #${r.id}`
    },
    sub_categories: {
        table: 'sub_categories',
        label: 'Sub-Category (সাব-ক্যাটাগরি)',
        icon: '📂',
        getTitle: (r) => r.name || 'Unnamed Sub-category',
        getSubtitle: (r) => `Sub-Category ID: #${r.id} | Category ID: #${r.category_id || 'N/A'}`
    },
    brands: {
        table: 'brands',
        label: 'Brand (ব্র্যান্ড)',
        icon: '🏷️',
        getTitle: (r) => r.name || 'Unnamed Brand',
        getSubtitle: (r) => `Brand Master Item #${r.id}`
    },
    models: {
        table: 'models',
        label: 'Model (মডেল)',
        icon: '📐',
        getTitle: (r) => r.name || 'Unnamed Model',
        getSubtitle: (r) => `Model ID: #${r.id} | Brand ID: #${r.brand_id || 'N/A'}`
    },
    series: {
        table: 'series',
        label: 'Series (সিরিজ)',
        icon: '🔖',
        getTitle: (r) => r.name || 'Unnamed Series',
        getSubtitle: (r) => `Series ID: #${r.id} | Brand ID: #${r.brand_id || 'N/A'}`
    },
    product_names: {
        table: 'product_names',
        label: 'Product Name (পণ্যের নাম)',
        icon: '📝',
        getTitle: (r) => r.name || 'Unnamed Product Name',
        getSubtitle: (r) => `Product Name Master Item #${r.id}`
    },
    quotations: {
        table: 'sales_quotations',
        label: 'Sales Quotation (কোটেশন)',
        icon: '📑',
        getTitle: (r) => `Quote #${r.quotation_no || r.id}`,
        getSubtitle: (r) => `Total: ৳${parseFloat(r.total_amount || 0).toLocaleString()} | Status: ${r.status || 'Draft'}`
    },
    users: {
        table: 'users',
        label: 'Staff Member (কর্মী)',
        icon: '👤',
        getTitle: (r) => r.name || 'Unnamed Staff',
        getSubtitle: (r) => `Role: ${r.user_role || 'Staff'} | Email: ${r.email || 'N/A'}`
    },
    warranty_claims: {
        table: 'warranty_claims',
        label: 'Warranty Claim (ওয়ারেন্টি ক্লেইম)',
        icon: '🛡️',
        getTitle: (r) => `Claim #${r.claim_no || r.id}`,
        getSubtitle: (r) => `Product: ${r.product_name || 'N/A'} | Serial: ${r.serial_code || 'N/A'} | Status: ${r.status || 'Received'}`
    },
    product_returns: {
        table: 'product_returns',
        label: 'Product Return / Refund (পণ্য ফেরত)',
        icon: '🔄',
        getTitle: (r) => `Return #${r.return_no || r.id}`,
        getSubtitle: (r) => `Product: ${r.product_name || 'N/A'} | Refund: ৳${parseFloat(r.refund_amount || 0).toLocaleString()} | Type: ${r.return_type || 'Refund'}`
    }
};

// Helper: resolve module key to table name and config
function resolveModule(key) {
    if (MODULE_CONFIG[key]) return { moduleKey: key, config: MODULE_CONFIG[key] };
    // Reverse lookup by table name
    for (const [k, v] of Object.entries(MODULE_CONFIG)) {
        if (v.table === key) return { moduleKey: k, config: v };
    }
    return null;
}

// -------------------------------------------------------------
// ১. গ্লোবাল ট্র্যাশ তালিকা (Get All Trash Records across entire system)
// -------------------------------------------------------------
exports.getAllTrash = async (req, res) => {
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

// -------------------------------------------------------------
// ২. মডিউল ভিত্তিক ট্র্যাশ কাউন্ট (Get Counts for UI Tabs)
// -------------------------------------------------------------
exports.getTrashCounts = async (req, res) => {
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

// -------------------------------------------------------------
// ৩. মডিউল প্রিভিউ (Get Trash Preview for Single Module - Legacy/Direct)
// -------------------------------------------------------------
exports.getTrashPreview = async (req, res) => {
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

// -------------------------------------------------------------
// ৪. ট্র্যাশ থেকে রিস্টোর করা (Restore Single Item)
// -------------------------------------------------------------
exports.restoreData = async (req, res) => {
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

// -------------------------------------------------------------
// ৫. সকল ট্র্যাশ রিস্টোর করা (Restore All Trashed Items)
// -------------------------------------------------------------
exports.restoreAll = async (req, res) => {
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

// -------------------------------------------------------------
// ৬. চিরতরে মুছে ফেলা (Permanent Delete Single Item)
// -------------------------------------------------------------
exports.permanentDelete = async (req, res) => {
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

// -------------------------------------------------------------
// ৭. ট্র্যাশ খালি করা (Empty Entire Trash)
// -------------------------------------------------------------
exports.emptyTrash = async (req, res) => {
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
