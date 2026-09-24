import React from 'react';

export default function EditReturnModal({
  editingReturn,
  setEditingReturn,
  handleUpdateReturnSubmit,
}) {
  if (!editingReturn) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) setEditingReturn(null);
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-scaleUp">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>✏️</span> Edit Return Record #{editingReturn.return_no}
          </h3>
          <button
            type="button"
            onClick={() => setEditingReturn(null)}
            className="text-slate-400 hover:text-slate-600 transition p-1 text-sm rounded-md"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleUpdateReturnSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editingReturn.customer_name || ''}
                onChange={(e) =>
                  setEditingReturn({ ...editingReturn, customer_name: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editingReturn.customer_phone || ''}
                onChange={(e) =>
                  setEditingReturn({ ...editingReturn, customer_phone: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={editingReturn.product_name || ''}
              onChange={(e) =>
                setEditingReturn({ ...editingReturn, product_name: e.target.value })
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Serial (S/N)
              </label>
              <input
                type="text"
                value={editingReturn.serial_code || ''}
                onChange={(e) =>
                  setEditingReturn({ ...editingReturn, serial_code: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Invoice No
              </label>
              <input
                type="text"
                value={editingReturn.invoice_no || ''}
                onChange={(e) =>
                  setEditingReturn({ ...editingReturn, invoice_no: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Return Type
              </label>
              <select
                value={editingReturn.return_type || 'Refund'}
                onChange={(e) =>
                  setEditingReturn({ ...editingReturn, return_type: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              >
                <option value="Refund">Refund</option>
                <option value="Exchange">Exchange</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Condition
              </label>
              <select
                value={editingReturn.condition || 'Good'}
                onChange={(e) =>
                  setEditingReturn({ ...editingReturn, condition: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              >
                <option value="Good">Good (Restocked)</option>
                <option value="Damaged">Damaged (Quarantine)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Refund Amount (৳)
            </label>
            <input
              type="number"
              value={editingReturn.refund_amount !== undefined ? editingReturn.refund_amount : ''}
              onChange={(e) =>
                setEditingReturn({ ...editingReturn, refund_amount: e.target.value })
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Return Reason
            </label>
            <textarea
              rows={2}
              value={editingReturn.return_reason || ''}
              onChange={(e) =>
                setEditingReturn({ ...editingReturn, return_reason: e.target.value })
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition resize-y"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingReturn(null)}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-sm shadow-sky-600/30 transition cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
