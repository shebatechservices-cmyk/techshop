const express = require('express');
const router = express.Router();
const expenseCategoryController = require('../controllers/expenseCategoryController');

// GET /api/expense-categories
router.get('/', expenseCategoryController.getExpenseCategories);

// POST /api/expense-categories
router.post('/', expenseCategoryController.createExpenseCategory);

// PUT /api/expense-categories/:id
router.put('/:id', expenseCategoryController.updateExpenseCategory);

// DELETE /api/expense-categories/:id
router.delete('/:id', expenseCategoryController.deleteExpenseCategory);

module.exports = router;
