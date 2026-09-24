const express = require('express');
const router = express.Router();
const { upload, saveImages, deleteImage, logoUpload, uploadLogo } = require('../controllers/imageController');
const { requireAuth } = require('../middlewares/authMiddleware');

router.use(requireAuth);

router.post('/products/:productId', upload.array('images', 10), saveImages);
router.post('/logo', logoUpload.single('file'), uploadLogo);
router.delete('/:id', deleteImage);

module.exports = router;
