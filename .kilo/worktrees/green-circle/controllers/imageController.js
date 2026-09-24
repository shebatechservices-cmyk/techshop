const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pool = require('../config/db');

const uploadDirectory = path.join(__dirname, '..', 'uploads', 'products');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (_req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
        callback(null, safeName);
    },
});

const logoUploadDirectory = path.join(__dirname, '..', 'uploads', 'logos');
fs.mkdirSync(logoUploadDirectory, { recursive: true });

const logoStorage = multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, logoUploadDirectory),
    filename: (_req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
        callback(null, safeName);
    },
});

const imageFilter = (_req, file, callback) => {
    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    if (!allowedMimeTypes.has(file.mimetype)) return callback(new Error('শুধু JPEG, PNG, WebP, অথবা GIF image দেওয়া যাবে'));
    callback(null, true);
};

const upload = multer({
    storage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

const logoUpload = multer({
    storage: logoStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadLogo = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'কোনো image দেওয়া হয়নি' });
    const url = `/uploads/logos/${req.file.filename}`;
    res.status(201).json({ message: 'Logo সফলভাবে আপলোড হয়েছে!', url });
};

const saveImages = async (req, res) => {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId)) return res.status(400).json({ error: 'অবৈধ product id' });
    if (!req.files?.length) return res.status(400).json({ error: 'কোনো image দেওয়া হয়নি' });

    const product = await pool.query('SELECT id FROM products WHERE id = $1', [productId]);
    if (!product.rows.length) return res.status(404).json({ error: 'প্রোডাক্ট পাওয়া যায়নি' });

    const featureImage = req.body.type === 'feature';
    const savedImages = [];
    for (const file of req.files) {
        const imageUrl = `/uploads/products/${file.filename}`;
        const imageType = featureImage && savedImages.length === 0 ? 'feature' : 'gallery';
        const result = await pool.query(
            `INSERT INTO product_images (product_id, image_url, image_type, sort_order)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [productId, imageUrl, imageType, savedImages.length]
        );
        savedImages.push(result.rows[0]);
        if (imageType === 'feature') await pool.query('UPDATE products SET image_url = $1, updated_at = NOW() WHERE id = $2', [imageUrl, productId]);
    }

    res.status(201).json({ message: 'Image সফলভাবে সেভ হয়েছে!', data: savedImages });
};

const deleteImage = async (req, res) => {
    const result = await pool.query('DELETE FROM product_images WHERE id = $1 RETURNING image_url', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Image পাওয়া যায়নি' });
    const filePath = path.join(__dirname, '..', result.rows[0].image_url.replace(/^\//, ''));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ message: 'Image ডিলিট হয়েছে' });
};

module.exports = { upload, saveImages, deleteImage, logoUpload, uploadLogo };
