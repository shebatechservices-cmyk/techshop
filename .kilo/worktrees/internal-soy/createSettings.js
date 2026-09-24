const fs = require('fs');

const controller = `const pool = require('../config/db');
const { exec } = require('child_process');
const path = require('path');

// ১. শপ সেটিংস গেট করা
exports.getSettings = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM shop_settings WHERE id = 1');
        return res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ২. শপ সেটিংস আপডেট করা (নাম, থিম, ইনভয়েস টেম্প্লেট ইত্যাদি)
exports.updateSettings = async (req, res) => {
    try {
        const { shop_name, shop_title, description, phone, email, address, website, logo_url, banner_url, theme_mode, invoice_template, invoice_color_scheme, loyalty_enabled, loyalty_rate } = req.body;
        
        const query = \`
            UPDATE shop_settings 
            SET shop_name = COALESCE($1, shop_name),
                shop_title = COALESCE($2, shop_title),
                description = COALESCE($3, description),
                phone = COALESCE($4, phone),
                email = COALESCE($5, email),
                address = COALESCE($6, address),
                website = COALESCE($7, website),
                logo_url = COALESCE($8, logo_url),
                banner_url = COALESCE($9, banner_url),
                theme_mode = COALESCE($10, theme_mode),
                invoice_template = COALESCE($11, invoice_template),
                invoice_color_scheme = COALESCE($12, invoice_color_scheme),
                loyalty_enabled = COALESCE($13, loyalty_enabled),
                loyalty_rate = COALESCE($14, loyalty_rate),
                updated_at = NOW()
            WHERE id = 1 RETURNING *;
        \`;
        const values = [shop_name, shop_title, description, phone, email, address, website, logo_url, banner_url, theme_mode, invoice_template, invoice_color_scheme, loyalty_enabled, loyalty_rate];
        
        const result = await pool.query(query, values);
        return res.status(200).json({ success: true, message: 'সেটিংস সফলভাবে আপডেট হয়েছে!', data: result.rows[0] });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ৩. পেমেন্ট মেথড লিস্ট এবং ম্যানেজ
exports.getPaymentMethods = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM payment_methods WHERE deleted_at IS NULL');
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.addPaymentMethod = async (req, res) => {
    try {
        const { method_name, account_details } = req.body;
        const result = await pool.query(
            'INSERT INTO payment_methods (method_name, account_details) VALUES ($1, $2) RETURNING *',
            [method_name, account_details]
        );
        return res.status(201).json({ success: true, message: 'পেমেন্ট মেথড যোগ করা হয়েছে', data: result.rows[0] });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ৪. ডেটাবেজ ব্যাকআপ (PostgreSQL pg_dump)
exports.backupDatabase = async (req, res) => {
    try {
        const backupFileName = \`backup-\${Date.now()}.sql\`;
        const backupPath = path.join(__dirname, '../', backupFileName);
        
        // কমান্ড: pg_dump -U postgres product_catalog > backup.sql
        const command = \`pg_dump -U postgres product_catalog > "\${backupPath}"\`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                return res.status(500).json({ success: false, message: 'ব্যাকআপ তৈরি করতে সমস্যা হয়েছে: ' + error.message });
            }
            return res.download(backupPath, backupFileName, (err) => {
                if (err) console.error('Download error:', err);
            });
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};`;

const route = `const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { checkPermission } = require('../middlewares/authMiddleware');

router.get('/', settingsController.getSettings);
router.put('/update', checkPermission('manage_settings'), settingsController.updateSettings);

router.get('/payment-methods', settingsController.getPaymentMethods);
router.post('/payment-methods', checkPermission('manage_settings'), settingsController.addPaymentMethod);

router.get('/backup', checkPermission('manage_settings'), settingsController.backupDatabase);

module.exports = router;`;

fs.writeFileSync('controllers/settingsController.js', controller);
fs.writeFileSync('routes/settingsRoute.js', route);

let serverContent = fs.readFileSync('server.js', 'utf8');
if (!serverContent.includes('/api/settings')) {
    serverContent = serverContent.replace('app.listen(', 'app.use("/api/settings", require("./routes/settingsRoute"));\napp.listen(');
    fs.writeFileSync('server.js', serverContent);
}

console.log('Settings API Created Successfully!');
