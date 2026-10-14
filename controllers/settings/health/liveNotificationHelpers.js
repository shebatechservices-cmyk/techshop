/**
 * Live notification feed query builders for technicians and global staff.
 */

async function fetchTechnicianNotifications(pool, technicianId) {
    const notifications = [];

    // 1. Technician Incentive / Bonus Offer (from shop_settings)
    try {
        const settingsRes = await pool.query(
            "SELECT technician_offer_headline, technician_offer_enabled FROM shop_settings WHERE id = 1"
        );
        if (settingsRes.rows.length > 0) {
            const s = settingsRes.rows[0];
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
        console.error('Technician offer fetch error:', e);
    }

    // 2. Assigned Service Projects for this Technician
    if (technicianId) {
        try {
            const projRes = await pool.query(`
                SELECT id, project_code, title, status, customer_billing_amount, updated_at
                FROM service_projects
                WHERE (technician_id = $1 OR assigned_technician = $1)
                  AND deleted_at IS NULL
                ORDER BY updated_at DESC
                LIMIT 5
            `, [technicianId]);

            for (const p of projRes.rows) {
                const isPending = p.status === 'pending' || p.status === 'assigned';
                const isCompleted = p.status === 'completed';
                notifications.push({
                    id: 'proj-' + p.id,
                    type: 'project',
                    category: 'Assigned Projects',
                    priority: isPending ? 'urgent' : isCompleted ? 'success' : 'info',
                    badgeText: isPending ? '📌 নতুন প্রজেক্ট' : isCompleted ? '✅ প্রজেক্ট সম্পন্ন' : '🛠️ চলমান কাজ',
                    icon: isCompleted ? '✅' : '🛠️',
                    title: (isPending ? 'নতুন এসাইনকৃত প্রজেক্ট: #' : isCompleted ? 'প্রজেক্ট সম্পন্ন: #' : 'চলমান প্রজেক্ট: #') + (p.project_code || p.id),
                    message: `${p.title || 'সার্ভিস প্রজেক্ট'} (বিলিং: ৳ ${Number(p.customer_billing_amount || 0).toLocaleString('en-IN')})`,
                    targetSection: 'projects',
                    targetTab: 'all',
                    timestamp: 'Project Update',
                    isRead: isCompleted
                });
            }
        } catch (e) {
            console.error('Technician projects fetch error:', e);
        }

        // 3. Technician Personal Wallet Balance
        try {
            const walletRes = await pool.query(
                "SELECT balance FROM wallets WHERE entity_type = 'technician' AND entity_id = $1 AND deleted_at IS NULL",
                [technicianId]
            );
            if (walletRes.rows.length > 0) {
                const balance = Number(walletRes.rows[0].balance || 0);
                notifications.push({
                    id: 'tech-wallet-' + technicianId,
                    type: 'wallet',
                    category: 'My Wallet',
                    priority: balance > 0 ? 'success' : 'info',
                    badgeText: '👛 ওয়ালেট ব্যালেন্স',
                    icon: '👛',
                    title: 'আপনার ওয়ালেট ব্যালেন্স: ৳ ' + balance.toLocaleString('en-IN'),
                    message: balance > 0
                        ? 'আপনার বর্তমান মোট পে-আউটযোগ্য কমিশন ব্যালেন্স ৳ ' + balance.toLocaleString('en-IN') + ' রয়েছে।'
                        : 'কোনো বকেয়া কমিশন ব্যালেন্স নেই। প্রজেক্ট সম্পন্ন করে আর্ন করুন।',
                    targetSection: 'projects',
                    targetTab: 'wallet',
                    timestamp: 'Current Balance',
                    isRead: true
                });
            }
        } catch (e) {
            console.error('Technician wallet fetch error:', e);
        }

        // 4. Technician Payout Requests
        try {
            const reqRes = await pool.query(`
                SELECT id, amount, channel, status, created_at
                FROM technician_wallet_requests
                WHERE technician_id = $1
                ORDER BY id DESC
                LIMIT 3
            `, [technicianId]);
            for (const r of reqRes.rows) {
                const isApproved = r.status === 'approved' || r.status === 'completed';
                const isPending = r.status === 'pending';
                notifications.push({
                    id: 'payout-req-' + r.id,
                    type: 'payout',
                    category: 'My Wallet',
                    priority: isApproved ? 'success' : isPending ? 'warning' : 'info',
                    badgeText: isApproved ? '💵 পে-আউট সম্পন্ন' : isPending ? '⏳ পে-আউট পেন্ডিং' : '📄 পে-আউট আপডেট',
                    icon: '💵',
                    title: `পে-আউট #${r.id}: ৳ ${Number(r.amount).toLocaleString('en-IN')}`,
                    message: `পেমেন্ট মেথড: ${r.channel || 'Cash'} (স্ট্যাটাস: ${r.status})`,
                    targetSection: 'projects',
                    targetTab: 'wallet',
                    timestamp: 'Recent Payout',
                    isRead: isApproved
                });
            }
        } catch (e) {
            console.error('Technician payout requests fetch error:', e);
        }
    }

    return notifications;
}

async function fetchGlobalNotifications(pool) {
    const notifications = [];

    // 0. কোর অফারসমূহ (Core Offers for Customers & Technicians - Priority 1)
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
    fetchTechnicianNotifications,
    fetchGlobalNotifications,
};
