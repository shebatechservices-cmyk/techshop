const { getFinancialAnalytics } = require('./reports/financialAnalyticsController');
const { getSalesAuditReport } = require('./reports/salesAuditReportController');

module.exports = {
    getFinancialAnalytics,
    getSalesAuditReport,
};
