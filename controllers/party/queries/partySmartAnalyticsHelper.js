const pool = require('../../../config/db');

async function getCustomerSmartMetrics(partyId, stats) {
    try {
        const topProductsRes = await pool.query(`
            SELECT p.name, 
                   MAX(p.id) AS id,
                   COALESCE(SUM(si.quantity), 0)::int AS total_qty, 
                   COALESCE(SUM(si.line_total), 0)::numeric(14,2) AS total_spent
            FROM sales_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN products p ON si.product_id = p.id
            WHERE s.customer_id = $1 AND s.deleted_at IS NULL
            GROUP BY p.name
            ORDER BY total_qty DESC LIMIT 4
        `, [partyId]);

        const dateRangeRes = await pool.query(`
            SELECT MIN(created_at) AS first_sale, MAX(created_at) AS last_sale
            FROM sales
            WHERE customer_id = $1 AND deleted_at IS NULL
        `, [partyId]);

        const totalInvoices = parseInt(stats?.total_invoices || 0, 10);
        const lifetime = parseFloat(stats?.lifetime_purchases || 0);
        const totalDue = parseFloat(stats?.total_due || 0);
        const aov = totalInvoices > 0 ? (lifetime / totalInvoices) : 0;

        let frequencyDays = null;
        const firstSale = dateRangeRes.rows[0]?.first_sale;
        const lastSale = dateRangeRes.rows[0]?.last_sale;
        if (firstSale && lastSale && totalInvoices > 1) {
            const diffDays = Math.max(1, Math.round((new Date(lastSale) - new Date(firstSale)) / (1000 * 60 * 60 * 24)));
            frequencyDays = Math.round(diffDays / (totalInvoices - 1));
        }

        let trustTier = 'new';
        let trustLabel = 'New Customer';
        let badgeColor = 'bg-slate-100 text-slate-700';

        if (totalInvoices === 0) {
            trustTier = 'new';
            trustLabel = 'New Client';
            badgeColor = 'bg-slate-100 text-slate-700 border-slate-300';
        } else if (totalDue <= 0 && totalInvoices >= 2) {
            trustTier = 'vip';
            trustLabel = '★ VIP (Prompt Payer)';
            badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
        } else if (totalDue > 0 && (lifetime === 0 || (totalDue / lifetime) <= 0.25)) {
            trustTier = 'good';
            trustLabel = 'Regular (Low Due)';
            badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
        } else if ((totalDue / lifetime) <= 0.60) {
            trustTier = 'moderate';
            trustLabel = 'Moderate Due';
            badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
        } else {
            trustTier = 'high_risk';
            trustLabel = '⚠️ High Due Ratio';
            badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
        }

        return {
            aov: Math.round(aov * 100) / 100,
            frequency_days: frequencyDays,
            trust_tier: trustTier,
            trust_label: trustLabel,
            badge_color: badgeColor,
            top_products: topProductsRes.rows || [],
            last_order_date: lastSale,
        };
    } catch (e) {
        console.warn('getCustomerSmartMetrics error:', e.message);
        return { aov: 0, top_products: [], trust_label: 'Standard', badge_color: 'bg-slate-100' };
    }
}

async function getSupplierSmartMetrics(partyId, stats) {
    try {
        const topProductsRes = await pool.query(`
            SELECT p.name,
                   MAX(p.id) AS id,
                   SUM(p.stock) AS stock,
                   COALESCE(MAX(p.min_stock), 5) AS min_stock,
                   COALESCE(SUM(poi.quantity), 0)::int AS total_qty_supplied,
                   ROUND(AVG(poi.cost_price), 2) AS avg_cost_price
            FROM purchase_order_items poi
            JOIN purchase_orders po ON poi.purchase_order_id = po.id
            JOIN products p ON poi.product_id = p.id
            WHERE po.supplier_id = $1
            GROUP BY p.name
            ORDER BY total_qty_supplied DESC LIMIT 4
        `, [partyId]);

        const lowStockRes = await pool.query(`
            SELECT DISTINCT ON (p.name) p.id, p.name, p.stock, COALESCE(p.min_stock, 5) AS min_stock, p.purchase_price
            FROM purchase_order_items poi
            JOIN purchase_orders po ON poi.purchase_order_id = po.id
            JOIN products p ON poi.product_id = p.id
            WHERE po.supplier_id = $1 AND p.deleted_at IS NULL AND p.stock <= COALESCE(p.min_stock, 5)
            ORDER BY p.name, p.stock ASC LIMIT 5
        `, [partyId]);

        const totalPos = parseInt(stats?.total_pos || 0, 10);
        return {
            reliability_label: totalPos >= 3 ? '🌟 Preferred Vendor' : 'Standard Supplier',
            badge_color: totalPos >= 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700',
            top_products: topProductsRes.rows || [],
            low_stock_reorders: lowStockRes.rows || [],
        };
    } catch (e) {
        console.warn('getSupplierSmartMetrics error:', e.message);
        return { top_products: [], low_stock_reorders: [] };
    }
}

async function getStaffSmartMetrics(staffId, staffName) {
    try {
        const monthSalesRes = await pool.query(`
            SELECT 
                COUNT(*)::int AS month_sales_count,
                COALESCE(SUM(total_amount), 0)::numeric(14,2) AS month_sales_volume,
                COALESCE(SUM(paid_amount), 0)::numeric(14,2) AS month_collected
            FROM sales
            WHERE sales_person = $1
              AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
              AND deleted_at IS NULL
        `, [staffName]);

        const projectRes = await pool.query(`
            SELECT 
                COUNT(*)::int AS total_projects,
                COUNT(CASE WHEN status = 'completed' THEN 1 END)::int AS completed_projects,
                COUNT(CASE WHEN status = 'ongoing' THEN 1 END)::int AS ongoing_projects,
                COALESCE(SUM(contract_amount), 0)::numeric(14,2) AS total_project_value
            FROM service_projects
            WHERE (assigned_technician = $1 OR technician_id = $1)
              AND deleted_at IS NULL
        `, [staffId]);

        const projectStats = projectRes.rows[0] || {};
        const totalProj = parseInt(projectStats.total_projects || 0, 10);
        const compProj = parseInt(projectStats.completed_projects || 0, 10);
        const completionRate = totalProj > 0 ? Math.round((compProj / totalProj) * 100) : 100;

        return {
            month_sales: monthSalesRes.rows[0] || {},
            projects: {
                ...projectStats,
                completion_rate: completionRate,
            },
        };
    } catch (e) {
        console.warn('getStaffSmartMetrics error:', e.message);
        return { month_sales: {}, projects: {} };
    }
}

module.exports = {
    getCustomerSmartMetrics,
    getSupplierSmartMetrics,
    getStaffSmartMetrics,
};
