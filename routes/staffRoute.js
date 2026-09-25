const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');

// 1. Get available roles
router.get('/roles', staffController.getRoles);

// 2. Get staff list with stats & filters
router.get('/', staffController.getStaff);

// 3. Get single staff member
router.get('/:id', staffController.getStaffById);

// 4. Create new staff member
router.post('/', staffController.createStaff);

// 5. Update staff member
router.put('/:id', staffController.updateStaff);

// 6. Quick toggle active status
router.patch('/:id/status', staffController.toggleStaffStatus);

// 7. Delete staff member
router.delete('/:id', staffController.deleteStaff);

module.exports = router;
