const express = require('express');
const { getAll, create, update, remove } = require('../controllers/masterController');
const { upload } = require('../controllers/imageController');

function createEntityRouter(entityName) {
    const router = express.Router();
    const setEntity = (req, res, next) => {
        req.params.entity = entityName;
        next();
    };
    router.get('/', setEntity, getAll);
    router.get('/all', setEntity, getAll);
    router.post('/', upload.any(), setEntity, create);
    router.post('/add', upload.any(), setEntity, create);
    router.put('/:id', upload.any(), setEntity, update);
    router.delete('/:id', setEntity, remove);
    return router;
}

module.exports = createEntityRouter;
