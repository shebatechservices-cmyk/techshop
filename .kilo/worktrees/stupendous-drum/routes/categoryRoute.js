const express = require('express');
const router = express.Router();
const {
    addCategory,
    getCategories,
    addSubCategory,
    getSubCategories,
} = require('../controllers/categoryController');

router.post('/add', addCategory);
router.post('/', addCategory);
router.get('/all', getCategories);
router.get('/', getCategories);
router.post('/sub/add', addSubCategory);
router.post('/sub', addSubCategory);
router.get('/sub/all', getSubCategories);
router.get('/sub', getSubCategories);

module.exports = router;
