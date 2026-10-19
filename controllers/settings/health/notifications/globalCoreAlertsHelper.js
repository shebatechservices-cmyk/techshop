/**
 * Core commercial and stock alert queries for global staff feed
 */

async function fetchGlobalCoreAlerts(pool) {
    const notifications = [];

    // 0. কোর অফারসমূহ (Core Offers for Customers & Technicians)
    try {
        const settingsRes = await pool.query(
            "SELECT customer_offer_headline, customer_offer_enabled, technician_offer_headline, technician_offer_enabled FROM shop_settings WHERE id = 1"
        );
        if (settingsRes.rows.length > 0) {
            const s = settingsRes.rows[0];
            if (s.customer_offer_enabled !== false && s.customer_offer_headline) {
                notifications.push({
                    id: 'offer-cust',
                    type: 'offer_customer',
                    category: 'Offers & Campaigns',
                    priority: 'urgent',
                    badgeText: '🔥 কাস্টমার অফার',
                    icon: '🎁',
                    title: 'কাস্টমার স্পেশাল অফার',
                    message: s.customer_offer_headline,
                    targetSection: 'sales',
                    targetTab: 'new',
                    timestamp: 'Active Now',
                    isRead: false
                });
            }
            if (s.technician_offer_enabled !== false && s.technician_offer_headline) {
                notifications.push({
                    id: 'offer-tech',
                    type: 'offer_technician',
                    category: 'Offers & Campaigns',
                    priority: 'urgent',
                    badgeText: '⚡ টেকনিশিয়ান বোনাস',
                    icon: '👷',
                    title: 'টেকনিশিয়ান ইনসেনটিভ অফার',
                    message: s.technician_offer_headline,
                    targetSection: 'projects',
                    targetTab: 'wallet',
                    timestamp: 'Active Now',
                    isRead: false
                });
            }
        }
    } catch (e) {
        console.error('Offers fetch error:', e);
    }

    // 1. স্টক আউট ও লো স্টক এলার্ট (Stock Out & Low Stock)
    try {
        const lowStockRes = await pool.query(
            "SELECT id, name, sku, stock_quantity FROM products WHERE stock_quantity <= 5 AND deleted_at IS NULL ORDER BY stock_quantity ASC LIMIT 4"
        );
        for (const p of lowStockRes.rows) {
            const isOutOfStock = Number(p.stock_quantity) <= 0;
            notifications.push({
                id: 'stock-' + p.id,
                type: 'stock',
                category: 'Stock & Inventory',
                priority: isOutOfStock ? 'urgent' : 'warning',
                badgeText: isOutOfStock ? '🚨 আউট অব স্টক' : '⚠️ লো স্টক',
                icon: isOutOfStock ? '🚨' : '⚠️',
                title: isOutOfStock ? ('আউট অব স্টক: ' + p.name) : ('লো-স্টক সতর্কতা: ' + p.name),
                message: isOutOfStock 
                    ? 'পণ্যের স্টক শেষ (০ ইউনিট)! অবিলম্বে রিস্টক করুন। (SKU: ' + (p.sku || 'N/A') + ')' 
                    : 'পণ্যের বর্তমান স্টক মাত্র ' + p.stock_quantity + ' টি ইউনিট রয়েছে। দ্রুত রিস্টক করুন। (SKU: ' + (p.sku || 'N/A') + ')',
                targetSection: 'inventory',
                targetTab: 'low_stock',
                timestamp: 'Live Alert',
                isRead: false
            });
        }
    } catch (e) {}

    // 2. কাস্টমার বকেয়া তাগাদা রিমাইন্ডার (Customer Due Reminder)
    try {
        const dueRes = await pool.query(
            "SELECT id, name, phone, current_balance FROM customers WHERE current_balance > 1000 AND deleted_at IS NULL ORDER BY current_balance DESC LIMIT 3"
        );
        for (const c of dueRes.rows) {
            notifications.push({
                id: 'due-' + c.id,
                type: 'due',
                category: 'Customer Due & Credit',
                priority: 'warning',
                badgeText: '💸 বকেয়া তাগাদা',
                icon: '💸',
                title: 'বকেয়া তাগাদা: ' + c.name,
                message: 'গ্রাহকের মোট বকেয়া ৳ ' + Number(c.current_balance).toLocaleString('en-IN') + ' রয়েছে। ফোন: ' + (c.phone || 'N/A'),
                targetSection: 'accounts',
                targetTab: 'parties',
                timestamp: 'Pending Due',
                isRead: false
            });
        }
    } catch (e) {}

    // 3. লেটেস্ট বিক্রয় (Latest Sales Feed)
    try {
        const salesRes = await pool.query(
            "SELECT id, invoice_no, final_amount, customer_name, created_at FROM sales ORDER BY id DESC LIMIT 3"
        );
        for (const s of salesRes.rows) {
            notifications.push({
                id: 'sale-' + s.id,
                type: 'sales',
                category: 'POS Sales',
                priority: 'success',
                badgeText: '🛒 লেটেস্ট সেল',
                icon: '🛒',
                title: 'নতুন বিক্রয়: #' + s.invoice_no,
                message: (s.customer_name || 'Walk-in Customer') + ' এর নিকট ৳ ' + Number(s.final_amount).toLocaleString('en-IN') + ' টাকার ক্যাশ মেমো ইস্যু হয়েছে।',
                targetSection: 'sales',
                targetTab: 'history',
                timestamp: 'Recent',
                isRead: true
            });
        }
    } catch (e) {}

    return notifications;
}

module.exports = {
    fetchGlobalCoreAlerts
};
