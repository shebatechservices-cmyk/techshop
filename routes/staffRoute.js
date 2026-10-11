const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

// 1. Get available roles (Authenticated)
router.get('/roles', staffController.getRoles);

// Wallet Requests approval (Admin only: Role 1, 2)
router.get('/wallet-requests/pending', requireRole(1, 2), staffController.getPendingWalletRequests);
router.post('/wallet-requests/:requestId/respond', requireRole(1, 2), staffController.respondWalletRequest);

// 2. Staff directory lookup & stats (Admin only: Role 1, 2)
router.get('/', requireRole(1, 2), staffController.getStaff);
router.get('/:id', requireRole(1, 2), staffController.getStaffById);

// 3. Administrative Staff Management (Create, Update, Status, Delete) (Admin only: Role 1, 2)
router.post('/', requireRole(1, 2), staffController.createStaff);
router.put('/:id', requireRole(1, 2), staffController.updateStaff);
router.patch('/:id/status', requireRole(1, 2), staffController.toggleStaffStatus);
router.delete('/:id', requireRole(1, 2), staffController.deleteStaff);

// 4. Technician / Staff Personal Wallet
// (A user can view/request for their own wallet, or Admins can view/adjust any wallet)
const canAccessWallet = (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
    const targetUserId = parseInt(req.params.id, 10);
    const isSelf = parseInt(req.user.id, 10) === targetUserId;
    const isAdmin = [1, 2].includes(Number(req.user.role_id));
    if (isSelf || isAdmin) {
        return next();
    }
    return res.status(403).json({ success: false, message: 'You are only authorized to view your own wallet.' });
};

router.get('/wallet/:id', canAccessWallet, staffController.getStaffWallet);
router.post('/wallet/:id/request', canAccessWallet, staffController.submitWalletRequest);
router.get('/wallet/:id/requests', canAccessWallet, staffController.getStaffWalletRequests);

// 5. Admin Wallet Adjustment (Admin only: Role 1, 2)
router.post('/wallet/:id/adjust', requireRole(1, 2), staffController.adjustStaffWallet);

module.exports = router;
