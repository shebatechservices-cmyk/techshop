const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerController');

// Shift Management & Blind Close
router.get('/current-shift', registerController.getCurrentShift);
router.post('/open', registerController.openShift);
router.post('/close', registerController.closeShift);
router.get('/shifts', registerController.getShiftHistory);
router.get('/shifts/:id', registerController.getShiftDetails);

module.exports = router;
