const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { upload } = require('../controllers/imageController');

router.post('/', upload.any(), productController.createProduct);
router.put('/:id', upload.any(), productController.updateProduct);
router.get('/', productController.getAllProducts);

module.exports = router;
