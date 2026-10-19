// Facade controller for expense categories (Rule 1: < 200 lines)
const { ensureExpenseCategoriesTable } = require('./expenseCategory/expenseCategorySchema');
const { getExpenseCategories } = require('./expenseCategory/expenseCategoryQueryController');
const {
    createExpenseCategory,
    updateExpenseCategory,
} = require('./expenseCategory/expenseCategoryMutationController');
const { deleteExpenseCategory } = require('./expenseCategory/expenseCategoryDeleteController');

module.exports = {
    ensureExpenseCategoriesTable,
    getExpenseCategories,
    createExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
};
