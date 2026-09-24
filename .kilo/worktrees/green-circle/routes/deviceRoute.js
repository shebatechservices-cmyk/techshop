const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

router.post('/check-or-register', deviceController.checkOrRegisterDevice);
router.get('/', deviceController.getDevices);
router.delete('/:device_id', deviceController.deleteDevice);
router.post('/logout', deviceController.deleteDevice);
router.put('/:device_id/rename', deviceController.renameDevice);

module.exports = router;
