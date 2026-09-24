import React from 'react';
import useExpensesManager from './hooks/useExpensesManager';
import AddExpenseModal from './modals/AddExpenseModal';
import AddExpenseCategoryModal from './modals/AddExpenseCategoryModal';
import ManageExpenseCategoriesModal from './modals/ManageExpenseCategoriesModal';
import ExpenseVoucherPrintModal from './modals/ExpenseVoucherPrintModal';
import EditExpenseModal from './modals/EditExpenseModal';

export default function Expenses() {
  const {
    // State
    expenses,
    setExpenses,
    categories,
    setCategories,
    categoriesLoading,
    setCategoriesLoading,
    categorySubmitting,
    setCategorySubmitting,
    accounts,
    setAccounts,
    loading,
    setLoading,
    toastMsg,
    setToastMsg,
    overview,
    setOverview,
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
    setSavingCatId,
    deletingCatId,
    setDeletingCatId,
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
    newCategoryDesc,
    setNewCategoryDesc,

    // Memos / Computed
    filteredExpenses,
    totalFilteredAmount,

    // Handlers
    showToast,
    fetchExpenseCategories,
    loadData,
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
      <div className="flex justify-between items-center mb-2.5 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-base font-extrabold text-slate-900">
            Expenses & Operating Overheads
          </span>
          <span className="text-[0.7rem] font-extrabold py-0.5 px-2 rounded-full bg-red-100 text-red-700 uppercase">
            CASH OUTFLOW
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsManageCategoriesOpen(true)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md py-1.5 px-3 text-xs font-bold cursor-pointer flex items-center gap-1.25 transition-colors shadow-xs"
          >
            <span>⚙️</span>
            <span>Categories</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddExpenseOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white border-0 rounded-md py-1.5 px-3.5 text-xs font-bold cursor-pointer flex items-center gap-1.25 shadow-xs transition-colors"
          >
            <span>+</span>
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <div className="bg-white rounded-lg border border-slate-200 py-2.5 px-3.5 shadow-xs">
          <div className="text-[0.74rem] font-bold text-slate-500 uppercase">
            Today's Expense
          </div>
          <div className="text-xl font-extrabold text-red-600 mt-0.5 font-mono">
            ৳ {Number(overview.total_today || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[0.72rem] text-slate-500">
            {overview.count_today || 0} vouchers today
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 py-2.5 px-3.5 shadow-xs">
          <div className="text-[0.74rem] font-bold text-slate-500 uppercase">
            This Month Total
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-0.5 font-mono">
            ৳ {Number(overview.total_month || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[0.72rem] text-slate-500">
            {overview.count_month || 0} expenses this month
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 py-2.5 px-3.5 shadow-xs">
          <div className="text-[0.74rem] font-bold text-slate-500 uppercase">
            Cash Drawer Outflow
          </div>
          <div className="text-xl font-extrabold text-amber-700 mt-0.5 font-mono">
            ৳{' '}
            {Number(
              expenses
                .filter((e) => String(e.account_name).toLowerCase().includes('cash') || String(e.account_name).toLowerCase().includes('drawer'))
                .reduce((s, e) => s + Number(e.amount || 0), 0)
            ).toLocaleString('en-IN')}
          </div>
          <div className="text-[0.72rem] text-amber-800">
            Direct cash in hand
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 py-2.5 px-3.5 shadow-xs">
          <div className="text-[0.74rem] font-bold text-slate-500 uppercase">
            Top Category
          </div>
          <div className="text-lg font-extrabold text-sky-600 mt-0.5 truncate">
            {overview.category_breakdown?.[0]?.category_name || 'Rent & Utilities'}
          </div>
          <div className="text-[0.72rem] text-slate-500">
            ৳ {Number(overview.category_breakdown?.[0]?.total_amount || 3200).toLocaleString('en-IN')} (Highest)
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-lg border border-slate-200 py-2 px-3.5 mb-3 flex justify-between items-center flex-wrap gap-2 shadow-xs">
        {/* Date Presets */}
        <div className="flex gap-1">
          {[
            { id: 'today', label: 'Today' },
            { id: 'this_week', label: 'This Week' },
            { id: 'this_month', label: 'This Month' },
            { id: 'all', label: 'All History' },
          ].map((dp) => (
            <button
              key={dp.id}
              type="button"
              onClick={() => setDateFilter(dp.id)}
              className={`py-1 px-2.5 rounded border text-xs font-bold cursor-pointer transition-colors ${
                dateFilter === dp.id
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {dp.label}
            </button>
          ))}
        </div>

        {/* Dropdown Filters & Search */}
        <div className="flex gap-2 items-center flex-wrap">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-1 px-2.5 rounded-md border border-slate-300 text-xs text-slate-700 font-semibold bg-white cursor-pointer outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id || c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Account Filter */}
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="py-1 px-2.5 rounded-md border border-slate-300 text-xs text-slate-700 font-semibold bg-white cursor-pointer outline-none"
          >
            <option value="ALL">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <input
            type="text"
            placeholder="Search voucher, payee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="py-1 px-2.5 rounded-md border border-slate-300 text-xs min-w-[180px] bg-white outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white text-[0.74rem] font-extrabold tracking-wider uppercase">
                <th className="py-3 px-3.5">DATE & VOUCHER #</th>
                <th className="py-3 px-3.5">EXPENSE CATEGORY</th>
                <th className="py-3 px-3.5">PAID TO (PAYEE) & NOTE</th>
                <th className="py-3 px-3.5">PAYMENT SOURCE (ACCOUNT)</th>
                <th className="py-3 px-3.5">REF / MEMO</th>
                <th className="py-3 px-3.5 text-right">AMOUNT (৳)</th>
                <th className="py-3 px-3.5 text-center w-[130px]">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-9 px-3.5 text-center text-slate-400">
                    No expense records found for this filter.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((ex, idx) => (
                  <tr
                    key={ex.id || idx}
                    className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                    }`}
                  >
                    {/* Date & Voucher */}
                    <td className="py-3 px-3.5">
                      <strong className="font-mono text-sky-600">
                        {ex.voucher_no || `EXP-${ex.id}`}
                      </strong>
                      <div className="text-[0.74rem] text-slate-500 mt-0.5">
                        {new Date(ex.expense_date).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3.5">
                      <span className="inline-block py-0.5 px-2 rounded-md text-xs font-bold bg-slate-100 text-slate-800">
                        {ex.category_name}
                      </span>
                    </td>

                    {/* Payee & Note */}
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{ex.payee_name || 'General'}</div>
                      <div className="text-xs text-slate-500 mt-0.5 max-w-[280px] truncate" title={ex.note || 'No additional note'}>
                        {ex.note || 'No additional note'}
                      </div>
                    </td>

                    {/* Payment Source */}
                    <td className="py-3 px-3.5">
                      <span
                        className={`py-0.5 px-2 rounded text-xs font-semibold ${
                          String(ex.account_name).toLowerCase().includes('cash') || String(ex.account_name).toLowerCase().includes('drawer')
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {String(ex.account_name).toLowerCase().includes('cash') ? '💵' : '💳'} {ex.account_name || 'Cash in Hand'}
                      </span>
                    </td>

                    {/* Reference Memo */}
                    <td className="py-3 px-3.5 font-mono text-xs text-slate-500">
                      {ex.reference_no || '-'}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3.5 text-right font-extrabold text-red-600 text-sm font-mono">
                      ৳ {Number(ex.amount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setVoucherToPrint(ex)}
                        className="py-1 px-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold cursor-pointer mr-1 transition-colors"
                        title="Print Official Debit Payment Voucher"
                      >
                        🖨️ Voucher
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingExpense({ ...ex })}
                        className="py-1 px-2 rounded border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold cursor-pointer mr-1 transition-colors"
                        title="Edit Expense"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(ex.id, ex.voucher_no, ex.amount)}
                        className="py-1 px-2 rounded border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold cursor-pointer transition-colors"
                        title="Delete & Refund to Account"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredExpenses.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-300 font-extrabold">
                  <td colSpan={5} className="py-3 px-3.5 text-right text-slate-600 text-xs">
                    FILTERED EXPENSES TOTAL:
                  </td>
                  <td className="py-3 px-3.5 text-right text-red-600 text-sm font-mono">
                    ৳ {totalFilteredAmount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

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
