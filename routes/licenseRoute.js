const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/licenseController');

// Public status check (allows frontend to verify status before/after login)
router.get('/status', licenseController.getLicenseStatus);

// Trigger handshake sync
router.post('/handshake', licenseController.triggerHandshake);

// Heartbeat ping
router.post('/heartbeat', licenseController.sendHeartbeat);

// Submit Redemption Code (Activation, Renewal, Quota Expansion)
router.post('/redeem', licenseController.redeemLicenseCode);

// Activate / Update License Key
router.post('/activate', licenseController.activateLicense);

// Activate / Register 15-Day Free Trial
router.post('/activate-trial', licenseController.activateTrial);

module.exports = router;
