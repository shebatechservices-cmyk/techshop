const express = require('express');
const router = express.Router();
const { upload, uploadTempShare } = require('../controllers/invoiceShareController');

// Upload invoice file (PDF/JPG) for temporary shareable link
router.post('/temp-share', upload.single('file'), uploadTempShare);

module.exports = router;
