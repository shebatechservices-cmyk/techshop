import React from 'react';
import useExpensesManager from './hooks/useExpensesManager';
import ExpensesHeader from './components/ExpensesHeader';
import ExpensesKpiCards from './components/ExpensesKpiCards';
import ExpensesToolbar from './components/ExpensesToolbar';
import ExpensesTable from './components/ExpensesTable';
import AddExpenseModal from './modals/AddExpenseModal';
import AddExpenseCategoryModal from './modals/AddExpenseCategoryModal';
import ManageExpenseCategoriesModal from './modals/ManageExpenseCategoriesModal';
import ExpenseVoucherPrintModal from './modals/ExpenseVoucherPrintModal';
import EditExpenseModal from './modals/EditExpenseModal';

export default function Expenses() {
  const {
    // State
    expenses,
    categories,
    categoriesLoading,
    categorySubmitting,
    accounts,
    toastMsg,
    overview,
    dateFilter,
    setDateFilter,
    categoryFilter,
    setCategoryFilter,
    accountFilter,
    setAccountFilter,
    searchQuery,
    setSearchQuery,
    isAddExpenseOpen,
    setIsAddExpenseOpen,
    isAddCategoryOpen,
    setIsAddCategoryOpen,
    isManageCategoriesOpen,
    setIsManageCategoriesOpen,
    editingCatId,
    setEditingCatId,
    editingCatName,
    setEditingCatName,
    savingCatId,
    deletingCatId,
    categorySearchQuery,
    setCategorySearchQuery,
    voucherToPrint,
    setVoucherToPrint,
    editingExpense,
    setEditingExpense,
    newExpense,
    setNewExpense,
    newCategoryName,
    setNewCategoryName,

    // Memos / Computed
    filteredExpenses,
    totalFilteredAmount,

    // Handlers
    handleCreateExpense,
    handleDeleteExpense,
    handleUpdateExpense,
    handleCreateCategory,
    handleStartEditCategory,
    handleCancelEditCategory,
    handleSaveEditCategory,
    handleDeleteCategory,
  } = useExpensesManager();

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-6 z-[999999] bg-slate-900 text-white py-3 px-5 rounded-lg shadow-xl flex items-center gap-2.5 text-sm font-semibold border-l-4 border-red-500">
          <span>💸</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Compact Sub-header */}
      <ExpensesHeader
        setIsManageCategoriesOpen={setIsManageCategoriesOpen}
        setIsAddExpenseOpen={setIsAddExpenseOpen}
      />

      {/* KPI Cards */}
      <ExpensesKpiCards overview={overview} expenses={expenses} />

      {/* Filter Toolbar */}
      <ExpensesToolbar
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        accountFilter={accountFilter}
        setAccountFilter={setAccountFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categories={categories}
        accounts={accounts}
      />

      {/* Expenses Table */}
      <ExpensesTable
        filteredExpenses={filteredExpenses}
        totalFilteredAmount={totalFilteredAmount}
        setVoucherToPrint={setVoucherToPrint}
        setEditingExpense={setEditingExpense}
        handleDeleteExpense={handleDeleteExpense}
      />

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        newExpense={newExpense}
        setNewExpense={setNewExpense}
        categories={categories}
        categoriesLoading={categoriesLoading}
        accounts={accounts}
        handleCreateExpense={handleCreateExpense}
        onOpenAddCategory={() => setIsAddCategoryOpen(true)}
        onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
      />

      <AddExpenseCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => {
          setIsAddCategoryOpen(false);
          setNewCategoryName('');
        }}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        categorySubmitting={categorySubmitting}
        handleCreateCategory={handleCreateCategory}
      />

      <ManageExpenseCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        categories={categories}
        categorySearchQuery={categorySearchQuery}
        setCategorySearchQuery={setCategorySearchQuery}
        editingCatId={editingCatId}
        setEditingCatId={setEditingCatId}
        editingCatName={editingCatName}
        setEditingCatName={setEditingCatName}
        savingCatId={savingCatId}
        deletingCatId={deletingCatId}
        handleStartEditCategory={handleStartEditCategory}
        handleCancelEditCategory={handleCancelEditCategory}
        handleSaveEditCategory={handleSaveEditCategory}
        handleDeleteCategory={handleDeleteCategory}
        onOpenAddCategory={() => setIsAddCategoryOpen(true)}
      />

      <ExpenseVoucherPrintModal
        voucherToPrint={voucherToPrint}
        onClose={() => setVoucherToPrint(null)}
      />

      <EditExpenseModal
        editingExpense={editingExpense}
        setEditingExpense={setEditingExpense}
        onClose={() => setEditingExpense(null)}
        categories={categories}
        accounts={accounts}
        handleUpdateExpense={handleUpdateExpense}
        onOpenAddCategory={() => setIsAddCategoryOpen(true)}
        onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
      />
    </div>
  );
}
