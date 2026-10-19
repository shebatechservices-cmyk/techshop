// Helper to calculate date range based on period
function getDateRange(period, customFrom, customTo) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (customFrom && customTo) {
        return { from: customFrom, to: customTo };
    }

    switch (period) {
        case 'today':
            return { from: todayStr, to: todayStr };
        case 'yesterday': {
            const y = new Date(now);
            y.setDate(y.getDate() - 1);
            const yStr = y.toISOString().split('T')[0];
            return { from: yStr, to: yStr };
        }
        case '7days': {
            const d7 = new Date(now);
            d7.setDate(d7.getDate() - 6);
            return { from: d7.toISOString().split('T')[0], to: todayStr };
        }
        case '30days': {
            const d30 = new Date(now);
            d30.setDate(d30.getDate() - 29);
            return { from: d30.toISOString().split('T')[0], to: todayStr };
        }
        case 'this_month': {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            return { from: firstDay, to: todayStr };
        }
        case 'last_month': {
            const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
            const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
            return { from: firstDay, to: lastDay };
        }
        case 'this_year': {
            const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
            return { from: firstDay, to: todayStr };
        }
        case 'all':
        default:
            return { from: '2020-01-01', to: todayStr };
    }
}

module.exports = {
    getDateRange,
};
