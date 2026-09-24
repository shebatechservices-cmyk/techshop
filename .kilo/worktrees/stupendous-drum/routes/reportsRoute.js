const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');

router.get('/analytics', reportsController.getFinancialAnalytics);
router.get('/sales-audit', reportsController.getSalesAuditReport);

module.exports = router;
