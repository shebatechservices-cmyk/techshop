import React from 'react';

export default function AddExpenseCategoryModal({
  isOpen,
  onClose,
  newCategoryName,
  setNewCategoryName,
  categorySubmitting,
  handleCreateCategory,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-[999999] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl border border-slate-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="m-0 text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span>📁</span>
            <span>New Expense Category</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="bg-transparent border-0 text-xl text-slate-400 hover:text-slate-600 cursor-pointer p-1 leading-none transition-colors"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleCreateCategory}>
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Office Supplies or Generator Fuel"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full py-2.5 px-3 rounded-lg border-1.5 border-slate-300 text-sm outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={categorySubmitting || !newCategoryName.trim()}
              className="py-2 px-5 rounded-lg border-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {categorySubmitting ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
