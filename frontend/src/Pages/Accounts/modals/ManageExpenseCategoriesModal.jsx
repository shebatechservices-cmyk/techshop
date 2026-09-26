import React from 'react';

export default function ManageExpenseCategoriesModal({
  isOpen,
  onClose,
  categories,
  categorySearchQuery,
  setCategorySearchQuery,
  editingCatId,
  setEditingCatId,
  editingCatName,
  setEditingCatName,
  savingCatId,
  deletingCatId,
  handleStartEditCategory,
  handleCancelEditCategory,
  handleSaveEditCategory,
  handleDeleteCategory,
  onOpenAddCategory,
}) {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    if (setEditingCatId) setEditingCatId(null);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-[999999] p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="py-4 px-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚙️</span>
            <div>
              <h3 className="m-0 text-base font-extrabold text-slate-900">
                Manage Expense Categories
              </h3>
              <p className="m-0 mt-0.5 text-xs text-slate-500">
                Edit or delete existing categories. Protected against accidental deletion if in use.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAddCategory}
              className="py-1.5 px-3 rounded-md border-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              + Add New
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="bg-transparent border-0 text-xl text-slate-400 hover:text-slate-600 cursor-pointer p-1 leading-none transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="py-3 px-6 border-b border-slate-100 bg-white flex justify-between items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search categories..."
            value={categorySearchQuery}
            onChange={(e) => setCategorySearchQuery(e.target.value)}
            className="w-64 py-1.5 px-3 rounded-md border border-slate-300 text-xs outline-none focus:border-blue-600"
          />
          <span className="text-xs text-slate-500 font-semibold">
            Total: {categories.length} categories
          </span>
        </div>

        {/* Data Table */}
        <div className="overflow-y-auto flex-1 px-6">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-500 text-[0.72rem] uppercase tracking-wider font-bold">
                <th className="py-3 px-2 w-10">#</th>
                <th className="py-3 px-2">Category Name</th>
                <th className="py-3 px-2 w-32">Created At</th>
                <th className="py-3 px-2 w-36 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No categories found. Click "+ Add New" to create one.
                  </td>
                </tr>
              ) : (
                categories
                  .filter((c) => !categorySearchQuery.trim() || c.name.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                  .map((cat, idx) => (
                    <tr key={cat.id || idx} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-2 text-slate-400 text-xs">{idx + 1}</td>
                      <td className="py-3 px-2">
                        {editingCatId === cat.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              autoFocus
                              value={editingCatName}
                              onChange={(e) => setEditingCatName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEditCategory(cat.id);
                                if (e.key === 'Escape') handleCancelEditCategory();
                              }}
                              className="w-full py-1.5 px-2.5 rounded-md border-1.5 border-blue-600 text-xs outline-none"
                            />
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-900">{cat.name}</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-slate-500 text-xs">
                        {cat.created_at ? new Date(cat.created_at).toLocaleDateString() : 'System'}
                      </td>
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        {editingCatId === cat.id ? (
                          <div className="inline-flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveEditCategory(cat.id)}
                              disabled={savingCatId === cat.id}
                              className="py-1 px-2.5 rounded border-0 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors"
                              title="Save changes"
                            >
                              {savingCatId === cat.id ? '...' : '✓ Save'}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditCategory}
                              className="py-1 px-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-xs cursor-pointer transition-colors"
                              title="Cancel editing"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEditCategory(cat)}
                              className="py-1 px-2 rounded border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold cursor-pointer flex items-center gap-0.75 transition-colors"
                              title="Edit category name"
                            >
                              <span>✏️</span>
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat)}
                              disabled={deletingCatId === cat.id}
                              className="py-1 px-2 rounded border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold cursor-pointer flex items-center gap-0.75 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                              title="Delete category"
                            >
                              <span>🗑️</span>
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="py-3.5 px-6 border-t border-slate-200 flex justify-end bg-slate-50">
          <button
            type="button"
            onClick={handleClose}
            className="py-1.5 px-4 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
