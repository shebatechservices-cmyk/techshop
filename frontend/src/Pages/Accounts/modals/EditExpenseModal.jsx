import React from 'react';

export default function EditExpenseModal({
  editingExpense,
  setEditingExpense,
  onClose,
  categories,
  accounts,
  handleUpdateExpense,
  onOpenAddCategory,
  onOpenManageCategories,
}) {
  if (!editingExpense) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[99999] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="m-0 mb-4 text-lg font-extrabold text-slate-900">
          ✏️ Edit Expense Voucher #{editingExpense.voucher_no}
        </h3>

        <form onSubmit={handleUpdateExpense}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Category *</label>
              <div className="flex items-center gap-2">
                <select
                  value={editingExpense.category_name || ''}
                  onChange={(e) => {
                    const sel = categories.find((c) => c.name === e.target.value);
                    setEditingExpense({
                      ...editingExpense,
                      category_name: e.target.value,
                      category_id: sel?.id || null,
                    });
                  }}
                  className="flex-1 w-full py-2 px-2.5 rounded-md border border-slate-300 text-xs bg-white outline-none focus:border-blue-600"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((c) => (
                    <option key={c.id || c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={onOpenAddCategory}
                  title="Add New Category"
                  className="h-8.5 w-8.5 min-w-[34px] flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold transition active:scale-95 cursor-pointer shadow-xs shrink-0"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={onOpenManageCategories}
                  title="Manage Categories"
                  className="h-8.5 flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md font-bold text-xs px-2 whitespace-nowrap transition active:scale-95 cursor-pointer shadow-xs shrink-0"
                >
                  <span>⚙️</span>
                  <span>Manage</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Payment Account *</label>
              <select
                value={editingExpense.account_id || ''}
                onChange={(e) => {
                  const selAcc = accounts.find((a) => String(a.id) === String(e.target.value));
                  setEditingExpense({
                    ...editingExpense,
                    account_id: e.target.value,
                    account_name: selAcc ? selAcc.name : editingExpense.account_name,
                  });
                }}
                className="w-full py-2 px-2.5 rounded-md border border-slate-300 text-xs bg-white outline-none focus:border-blue-600"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} (৳ {Number(a.balance || 0).toLocaleString()})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Amount (৳) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={editingExpense.amount || ''}
                onChange={(e) => setEditingExpense({ ...editingExpense, amount: e.target.value })}
                className="w-full py-2 px-2.5 rounded-md border-1.5 border-sky-600 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Expense Date *</label>
              <input
                type="date"
                required
                value={editingExpense.expense_date ? editingExpense.expense_date.substring(0, 10) : ''}
                onChange={(e) => setEditingExpense({ ...editingExpense, expense_date: e.target.value })}
                className="w-full py-2 px-2.5 rounded-md border border-slate-300 text-xs bg-white outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Paid To (Payee)</label>
              <input
                type="text"
                value={editingExpense.payee_name || ''}
                onChange={(e) => setEditingExpense({ ...editingExpense, payee_name: e.target.value })}
                className="w-full py-2 px-2.5 rounded-md border border-slate-300 text-xs bg-white outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Reference / Memo #</label>
              <input
                type="text"
                value={editingExpense.reference_no || ''}
                onChange={(e) => setEditingExpense({ ...editingExpense, reference_no: e.target.value })}
                className="w-full py-2 px-2.5 rounded-md border border-slate-300 text-xs bg-white outline-none focus:border-blue-600 font-mono"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-600 mb-1">Note / Reason</label>
            <textarea
              rows={2}
              value={editingExpense.note || ''}
              onChange={(e) => setEditingExpense({ ...editingExpense, note: e.target.value })}
              className="w-full py-2 px-2.5 rounded-md border border-slate-300 text-xs bg-white outline-none focus:border-blue-600"
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
              className="py-2 px-5 rounded-md border-0 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
