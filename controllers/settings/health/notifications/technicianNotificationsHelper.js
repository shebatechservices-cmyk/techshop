/**
 * Technician-specific live notification queries
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

module.exports = {
    fetchTechnicianNotifications
};
