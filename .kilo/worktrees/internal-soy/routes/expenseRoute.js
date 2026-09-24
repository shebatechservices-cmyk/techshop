const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

// Expense Overview & Metrics
router.get('/overview', expenseController.getOverview);

// Expense Entries
router.get('/', expenseController.getExpenses);
router.post('/', expenseController.createExpense);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

// Expense Categories
router.get('/categories', expenseController.getCategories);
router.post('/categories', expenseController.createCategory);

module.exports = router;
