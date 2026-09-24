const express = require('express');
const router = express.Router();
const trashController = require('../controllers/trashController');
const { checkPermission } = require('../middlewares/authMiddleware');

// সুপার এডমিন বা স্পেশাল পারমিশন ছাড়া কেউ ট্র্যাশ অ্যাক্সেস করতে পারবে না
router.get('/all', checkPermission('manage_settings'), trashController.getAllTrash);
router.get('/counts', checkPermission('manage_settings'), trashController.getTrashCounts);
router.get('/preview/:module_name', checkPermission('manage_settings'), trashController.getTrashPreview);
router.post('/restore', checkPermission('manage_settings'), trashController.restoreData);
router.post('/restore-all', checkPermission('manage_settings'), trashController.restoreAll);
router.delete('/permanent', checkPermission('manage_settings'), trashController.permanentDelete);
router.delete('/empty', checkPermission('manage_settings'), trashController.emptyTrash);

module.exports = router;