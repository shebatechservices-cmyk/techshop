const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

// These are the only public security endpoints. All administrative security
// operations below require an authenticated admin session.
router.post('/login', securityController.login);
router.post('/signup', securityController.signup);
router.post('/recovery-request', securityController.submitRecoveryRequest);
router.use(requireAuth);

// Any signed-in user can end or validate their own session.
router.post('/logout', securityController.logout);
router.get('/session-verify', securityController.verifySession);
router.get('/me', securityController.getCurrentUser);

// Security administration is restricted to owner/admin roles.
router.use(requireRole(1, 2));

// Security Posture Overview
router.get('/overview', securityController.getSecurityOverview);

// SIEM Audit Logs
router.get('/logs', securityController.getAuditLogs);

// Staff & Technician Access Control
router.get('/users', securityController.getUsers);
router.post('/users', securityController.createUser);
router.patch('/users/:id/status', securityController.updateUserStatus);
router.put('/users/:id', securityController.updateUser);
router.delete('/users/:id', securityController.deleteUser);

// Trusted Devices (Device ID & Hardware Fingerprints)
router.get('/devices', securityController.getDevices);
router.post('/devices', securityController.createDevice);
router.patch('/devices/:id/status', securityController.updateDeviceStatus);
router.delete('/devices/:id', securityController.deleteDevice);

// Staff Approvals by Admin
router.get('/pending-staff', securityController.getPendingStaff);
router.post('/approve-staff', securityController.approveStaff);

// Password & Credential Recovery
router.get('/recovery-requests', securityController.getStaffRecoveryRequests);
router.post('/recovery-resolve', securityController.resolveStaffRecovery);

// IP Firewall & Anti-Spam
router.get('/ip-rules', securityController.getIpRules);
router.post('/ip-rules', securityController.createIpRule);
router.delete('/ip-rules/:id', securityController.deleteIpRule);

module.exports = router;
