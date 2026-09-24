const express = require('express');
const router = express.Router();
const { getAll, create, update, remove } = require('../controllers/masterController');
const { upload } = require('../controllers/imageController');

router.get('/:entity', getAll);
router.post('/:entity', upload.any(), create);
router.put('/:entity/:id', upload.any(), update);
router.delete('/:entity/:id', remove);

module.exports = router;