/**
 * Security Controller (Facade / Dispatcher)
 * Modularized sub-controllers:
 * - securitySchema.js (Table migrations & schema initialization)
 * - authController.js (Login, Signup, Logout, Session Verification)
 * - deviceController.js (Device whitelist & tracking)
 * - firewallController.js (IP firewall & blocking rules)
 * - recoveryController.js (Password recovery requests & resolution)
 * - auditLogController.js (Audit logging, User management, Staff approval, Security overview)
 */

const authController = require('./security/authController');
const deviceController = require('./security/deviceController');
const firewallController = require('./security/firewallController');
const recoveryController = require('./security/recoveryController');
const auditLogController = require('./security/auditLogController');

module.exports = {
    // Auth
    login: authController.login,
    signup: authController.signup,
    logout: authController.logout,
    verifySession: authController.verifySession,
    getCurrentUser: authController.getCurrentUser,

    // Devices
    getDevices: deviceController.getDevices,
    createDevice: deviceController.createDevice,
    updateDeviceStatus: deviceController.updateDeviceStatus,
    deleteDevice: deviceController.deleteDevice,

    // Firewall & IP
    getIpRules: firewallController.getIpRules,
    createIpRule: firewallController.createIpRule,
    deleteIpRule: firewallController.deleteIpRule,

    // Password Recovery
    submitRecoveryRequest: recoveryController.submitRecoveryRequest,
    getStaffRecoveryRequests: recoveryController.getStaffRecoveryRequests,
    resolveStaffRecovery: recoveryController.resolveStaffRecovery,

    // Audit & User Management
    createAuditLog: auditLogController.createAuditLog,
    getSecurityOverview: auditLogController.getSecurityOverview,
    getAuditLogs: auditLogController.getAuditLogs,
    getUsers: auditLogController.getUsers,
    createUser: auditLogController.createUser,
    updateUserStatus: auditLogController.updateUserStatus,
    updateUser: auditLogController.updateUser,
    deleteUser: auditLogController.deleteUser,
    getPendingStaff: auditLogController.getPendingStaff,
    approveStaff: auditLogController.approveStaff,
};
