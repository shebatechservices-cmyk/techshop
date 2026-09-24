import React from 'react';

export default function AddExpenseModal({
  isOpen,
  onClose,
  newExpense,
  setNewExpense,
  categories,
  categoriesLoading,
  accounts,
  handleCreateExpense,
  onOpenAddCategory,
  onOpenManageCategories,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-[99999] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl border border-slate-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="m-0 mb-4 text-lg font-extrabold text-slate-900">
          + Record Expense (দৈনিক খরচ এন্ট্রি)
        </h3>
        <form onSubmit={handleCreateExpense}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Expense Category (খাত) *
              </label>
              <div className="flex items-center gap-2">
                <select
                  required
                  value={newExpense.category_name}
                  onChange={(e) => {
                    const sel = categories.find((c) => c.name === e.target.value);
                    setNewExpense({
                      ...newExpense,
                      category_name: e.target.value,
                      category_id: sel?.id || null,
                    });
                  }}
                  className="flex-1 w-full py-2 px-2.5 rounded-md border border-slate-300 text-xs bg-white outline-none focus:border-sky-500"
                >
                  <option value="">{categoriesLoading ? 'Loading categories...' : '-- Select Expense Category --'}</option>
                  {categories.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={onOpenAddCategory}
                  title="Add New Category"
                  className="h-9 w-9 min-w-[36px] flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold transition active:scale-95 cursor-pointer shadow-xs shrink-0"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={onOpenManageCategories}
                  title="Manage Categories"
                  className="h-9 flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md font-bold text-xs px-2.5 whitespace-nowrap transition active:scale-95 cursor-pointer shadow-xs shrink-0"
                >
                  <span>⚙️</span>
                  <span>Manage</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Paid From Account (টাকা প্রদান) *
              </label>
              <select
                required
                value={newExpense.account_id}
                onChange={(e) => {
                  const acc = accounts.find((a) => String(a.id) === String(e.target.value));
                  setNewExpense({
                    ...newExpense,
                    account_id: e.target.value,
                    account_name: acc ? acc.name : 'Cash in Hand (Counter Drawer)',
                  });
                }}
                className="w-full py-2 px-2.5 rounded-md border border-slate-300 text-xs bg-white outline-none focus:border-sky-500"
              >
                {accounts.length === 0 ? (
                  <option value="1">Cash in Hand (Counter Drawer)</option>
                ) : (
                  accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Bal: ৳{Number(a.balance || 0).toLocaleString()})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Expense Amount (৳) *
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 350"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="w-full py-2 px-2.5 rounded-md border-1.5 border-red-600 text-sm font-bold outline-none focus:ring-2 focus:ring-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Expense Date *
              </label>
              <input
                type="date"
                required
                value={newExpense.expense_date}
                onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                className="w-full py-2 px-2.5 rounded-md border border-slate-300 text-xs outline-none focus:border-sky-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Paid To (প্রাপক / ব্যক্তি / প্রতিষ্ঠান)
              </label>
              <input
                type="text"
                placeholder="e.g. Technician Tanvir or Mamun Tea"
                value={newExpense.payee_name}
                onChange={(e) => setNewExpense({ ...newExpense, payee_name: e.target.value })}
                className="w-full py-2 px-2.5 rounded-md border border-slate-300 text-xs outline-none focus:border-sky-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Voucher / Memo Reference No
              </label>
              <input
                type="text"
                placeholder="e.g. CASH-MEMO-441"
                value={newExpense.reference_no}
                onChange={(e) => setNewExpense({ ...newExpense, reference_no: e.target.value })}
                className="w-full py-2 px-2.5 rounded-md border border-slate-300 text-xs outline-none focus:border-sky-500 bg-white font-mono"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description / Purpose of Expense
            </label>
            <textarea
              rows={2}
              placeholder="Detail notes regarding this expense..."
              value={newExpense.note}
              onChange={(e) => setNewExpense({ ...newExpense, note: e.target.value })}
              className="w-full py-2 px-2.5 rounded-md border border-slate-300 text-xs outline-none focus:border-sky-500 bg-white"
            />
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-5 rounded-md border-0 bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              Record & Deduct Balance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
