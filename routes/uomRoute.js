const express = require('express');
const router = express.Router();
const uomController = require('../controllers/uomController');

router.get('/', uomController.getAllUom);
router.get('/:id', uomController.getUomById);
router.post('/', uomController.createUom);
router.put('/:id', uomController.updateUom);
router.delete('/:id', uomController.deleteUom);

module.exports = router;
