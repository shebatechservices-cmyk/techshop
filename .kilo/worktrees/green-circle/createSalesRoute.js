const fs = require('fs');

const route = `const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { checkPermission } = require('../middlewares/authMiddleware');

// নতুন বিক্রি ও লয়্যালটি পয়েন্ট ব্যবহার করে সেলস তৈরি (পারমিশন চেক সহ)
router.post('/create', checkPermission('manage_sales'), salesController.createSale);

module.exports = router;`;

fs.writeFileSync('routes/salesRoute.js', route);

let serverContent = fs.readFileSync('server.js', 'utf8');
if (!serverContent.includes('/api/sales')) {
    serverContent = serverContent.replace('app.listen(', 'app.use("/api/sales", require("./routes/salesRoute"));\napp.listen(');
    fs.writeFileSync('server.js', serverContent);
}

console.log('Sales Route Created & Integrated!');
