const express = require('express');
const router = express.Router();
const { getAll, create, update, remove } = require('../controllers/masterController');

router.get('/:entity', getAll);
router.post('/:entity', create);
router.put('/:entity/:id', update);
router.delete('/:entity/:id', remove);

module.exports = router;