const fs = require('fs');
const path = require('path');
const multer = require('multer');

const tempUploadDir = path.join(__dirname, '..', 'uploads', 'temp_shares');
if (!fs.existsSync(tempUploadDir)) {
    fs.mkdirSync(tempUploadDir, { recursive: true });
}

// Clean files older than 48 hours
function cleanOldTempFiles() {
    try {
        const now = Date.now();
        const maxAgeMs = 48 * 60 * 60 * 1000;
        const files = fs.readdirSync(tempUploadDir);
        for (const f of files) {
            const filePath = path.join(tempUploadDir, f);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > maxAgeMs) {
                fs.unlinkSync(filePath);
            }
        }
    } catch (err) {
        console.warn('Temp files cleanup notice:', err.message);
    }
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cleanOldTempFiles();
        cb(null, tempUploadDir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
        const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
        cb(null, `${baseName}_${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (_req, file, cb) => {
    const allowed = new Set([
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp'
    ]);
    if (allowed.has(file.mimetype) || file.originalname.endsWith('.pdf') || file.originalname.endsWith('.jpg') || file.originalname.endsWith('.png')) {
        return cb(null, true);
    }
    return cb(new Error('Only PDF and Image files (JPG/PNG/WEBP) are allowed for invoice sharing'));
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 } // 20 MB limit
});

const uploadTempShare = async (req, res) => {
    try {
        let filename = null;
        let originalName = 'Invoice.pdf';

        if (req.file) {
            filename = req.file.filename;
            originalName = req.file.originalname;
        } else if (req.body.file_base64) {
            const rawBase64 = req.body.file_base64;
            const customName = (req.body.file_name || 'Invoice').replace(/[^a-zA-Z0-9_-]/g, '_');
            const ext = req.body.file_type === 'image' || req.body.file_type === 'image/jpeg' ? '.jpg' : '.pdf';
            originalName = `${customName}${ext}`;

            const base64Data = rawBase64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '');
            filename = `${customName}_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
            const targetPath = path.join(tempUploadDir, filename);
            fs.writeFileSync(targetPath, Buffer.from(base64Data, 'base64'));
        } else {
            return res.status(400).json({ success: false, message: 'No file or base64 data provided' });
        }

        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
        const host = req.get('host') || `localhost:${process.env.PORT || 3000}`;
        const fileUrl = `/uploads/temp_shares/${filename}`;
        const fullUrl = `${protocol}://${host}${fileUrl}`;

        return res.status(200).json({
            success: true,
            message: 'Invoice temporary share link generated successfully',
            file_url: fileUrl,
            full_url: fullUrl,
            filename: originalName,
            expires_in: '48 hours'
        });
    } catch (err) {
        console.error('uploadTempShare error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    upload,
    uploadTempShare
};
