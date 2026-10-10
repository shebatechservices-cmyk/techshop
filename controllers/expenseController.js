/**
 * Expense Controller (Unified Facade)
 * Architectural Decomposition: SRP & Sub-Controllers
 * 
 * Sub-modules:
 * - ./expenses/expenseQueryController: Analytics overview, filtered expenses list, table migrations
 * - ./expenses/expenseMutationController: Create with ledger debit, update with ledger rebalance, soft delete with restoration
 * - ./expenses/expenseCategoryController: Category listings and creation
 */

const expenseQuery = require('./expenses/expenseQueryController');
const expenseMutation = require('./expenses/expenseMutationController');
const expenseCategory = require('./expenses/expenseCategoryController');

module.exports = {
    ...expenseQuery,
    ...expenseMutation,
    ...expenseCategory
};
