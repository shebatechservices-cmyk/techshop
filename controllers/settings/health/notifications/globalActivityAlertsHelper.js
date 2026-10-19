/**
 * Secondary activity alerts: Purchases, New Products, Warranty Claims, SMS Logs
 */

async function fetchGlobalActivityAlerts(pool) {
    const notifications = [];

    // 4. লেটেস্ট পারচেজ (Latest Purchases Feed)
    try {
        const purchaseRes = await pool.query(
            "SELECT id, purchase_number, supplier_name, total_amount, created_at FROM purchases ORDER BY id DESC LIMIT 2"
        );
        for (const p of purchaseRes.rows) {
            notifications.push({
                id: 'purchase-' + p.id,
                type: 'purchase',
                category: 'Purchases',
                priority: 'info',
                badgeText: '📦 নতুন পারচেজ',
                icon: '📦',
                title: 'নতুন মালামাল রিসিভ: #' + (p.purchase_number || p.id),
                message: (p.supplier_name || 'সাপ্লায়ার') + ' থেকে ৳ ' + Number(p.total_amount).toLocaleString('en-IN') + ' টাকার ইনভেন্টরি স্টক যুক্ত হয়েছে।',
                targetSection: 'purchases',
                targetTab: 'history',
                timestamp: 'Recent Purchase',
                isRead: true
            });
        }
    } catch (e) {}

    // 5. লেটেস্ট নতুন প্রোডাক্ট (Newly Cataloged Products)
    try {
        const newProdRes = await pool.query(
            "SELECT id, name, sku, selling_price, created_at FROM products WHERE deleted_at IS NULL ORDER BY id DESC LIMIT 2"
        );
        for (const np of newProdRes.rows) {
            notifications.push({
                id: 'newprod-' + np.id,
                type: 'new_product',
                category: 'New Products',
                priority: 'info',
                badgeText: '✨ নতুন পণ্য',
                icon: '🏷️',
                title: 'নতুন পণ্য ক্যাটালগ: ' + np.name,
                message: 'ইনভেন্টরিতে নতুন পণ্য যুক্ত হয়েছে (বিক্রয় মূল্য: ৳ ' + Number(np.selling_price || 0).toLocaleString('en-IN') + ')।',
                targetSection: 'products',
                targetTab: 'catalog',
                timestamp: 'New Catalog',
                isRead: true
            });
        }
    } catch (e) {}

    // 6. ওয়ারেন্টি ক্লেইম (Warranty & Claims)
    try {
        const warrRes = await pool.query(
            "SELECT id, claim_token, product_name, customer_name, status, updated_at FROM warranty_claims WHERE status IN ('received', 'ready') ORDER BY updated_at DESC LIMIT 2"
        );
        for (const w of warrRes.rows) {
            const isReady = w.status === 'ready';
            notifications.push({
                id: 'warr-' + w.id,
                type: 'warranty',
                category: 'Warranty & Claims',
                priority: isReady ? 'success' : 'info',
                badgeText: isReady ? '✅ সার্ভিস সম্পন্ন' : '🏷️ ওয়ারেন্টি জমা',
                icon: isReady ? '✅' : '🏷️',
                title: isReady ? ('সার্ভিস সম্পন্ন: টোকেন #' + w.claim_token) : ('ওয়ারেন্টি ক্লেইম জমা: #' + w.claim_token),
                message: isReady 
                    ? (w.customer_name + ' এর ' + w.product_name + ' সার্ভিসিং সম্পন্ন ও ডেলিভারির জন্য প্রস্তুত।') 
                    : (w.customer_name + ' এর ' + w.product_name + ' শপে সার্ভিসিং ক্লেইম জমা হয়েছে।'),
                targetSection: 'warranty',
                targetTab: 'claims',
                timestamp: 'Warranty',
                isRead: false
            });
        }
    } catch (e) {}

    // 7. এসএমএস গেটওয়ে লগ (SMS Gateway Logs)
    try {
        const smsRes = await pool.query(
            "SELECT id, trigger_key, recipient_phone, message_content, created_at FROM sms_logs ORDER BY id DESC LIMIT 2"
        );
        for (const sms of smsRes.rows) {
            notifications.push({
                id: 'sms-' + sms.id,
                type: 'sms',
                category: 'SMS Gateway',
                priority: 'info',
                badgeText: '📱 এসএমএস',
                icon: '📱',
                title: 'এসএমএস ডেলিভারি: ' + sms.trigger_key,
                message: sms.recipient_phone + ' এ স্বয়ংক্রিয় এসএমএস সফলভাবে প্রেরিত হয়েছে।',
                targetSection: 'settings',
                targetTab: 'sms',
                timestamp: 'Today',
                isRead: true
            });
        }
    } catch (e) {}

    return notifications;
}

module.exports = {
    fetchGlobalActivityAlerts
};
