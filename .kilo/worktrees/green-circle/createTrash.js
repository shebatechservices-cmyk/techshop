const fs = require('fs');

const controller = `const pool = require('../config/db');

// সিকিউরিটির জন্য শুধু অনুমোদিত টেবিলগুলোর লিস্ট
const allowedTables = ['products', 'customers', 'sales', 'purchases', 'suppliers', 'users', 'categories', 'quotations', 'warranty_claims', 'product_returns'];

// ১. ট্র্যাশ লিস্ট বা প্রিভিউ দেখা (টেবিলের নাম অনুযায়ী)
exports.getTrashPreview = async (req, res) => {
    try {
        const { module_name } = req.params;
        if (!allowedTables.includes(module_name)) return res.status(400).json({ success: false, message: 'ভুল মডিউল নাম!' });

        const query = \`SELECT * FROM \${module_name} WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC\`;
        const result = await pool.query(query);
        
        return res.status(200).json({ success: true, count: result.rowCount, data: result.rows });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ২. ট্র্যাশ থেকে রিস্টোর করা
exports.restoreData = async (req, res) => {
    try {
        const { module_name, id } = req.body;
        if (!allowedTables.includes(module_name)) return res.status(400).json({ success: false, message: 'ভুল মডিউল নাম!' });

        const query = \`UPDATE \${module_name} SET deleted_at = NULL WHERE id = $1 RETURNING id\`;
        const result = await pool.query(query, [id]);

        if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'ডেটা পাওয়া যায়নি!' });
        return res.status(200).json({ success: true, message: 'সফলভাবে রিস্টোর করা হয়েছে।' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ৩. চিরতরে মুছে ফেলা (Permanent Delete)
exports.permanentDelete = async (req, res) => {
    try {
        const { module_name, id } = req.body;
        if (!allowedTables.includes(module_name)) return res.status(400).json({ success: false, message: 'ভুল মডিউল নাম!' });

        const query = \`DELETE FROM \${module_name} WHERE id = $1 RETURNING id\`;
        const result = await pool.query(query, [id]);

        if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'ডেটা পাওয়া যায়নি!' });
        return res.status(200).json({ success: true, message: 'ডেটা চিরতরে মুছে ফেলা হয়েছে!' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};`;

const route = `const express = require('express');
const router = express.Router();
const trashController = require('../controllers/trashController');
const { checkPermission } = require('../middlewares/authMiddleware');

// সুপার এডমিন বা স্পেশাল পারমিশন ছাড়া কেউ ট্র্যাশ অ্যাক্সেস করতে পারবে না
router.get('/preview/:module_name', checkPermission('manage_settings'), trashController.getTrashPreview);
router.post('/restore', checkPermission('manage_settings'), trashController.restoreData);
router.delete('/permanent', checkPermission('manage_settings'), trashController.permanentDelete);

module.exports = router;`;

fs.writeFileSync('controllers/trashController.js', controller);
fs.writeFileSync('routes/trashRoute.js', route);

let serverContent = fs.readFileSync('server.js', 'utf8');
if (!serverContent.includes('/api/trash')) {
    serverContent = serverContent.replace('app.listen(', 'app.use("/api/trash", require("./routes/trashRoute"));\napp.listen(');
    fs.writeFileSync('server.js', serverContent);
}

console.log('Global Trash (Recycle Bin) APIs Created!');
