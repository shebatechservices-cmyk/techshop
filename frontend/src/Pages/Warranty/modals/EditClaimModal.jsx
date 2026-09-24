import React from 'react';

export default function EditClaimModal({
  editingClaim,
  setEditingClaim,
  handleUpdateClaimSubmit,
}) {
  if (!editingClaim) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) setEditingClaim(null);
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-scaleUp">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>✏️</span> Edit Warranty Claim #{editingClaim.claim_no}
          </h3>
          <button
            type="button"
            onClick={() => setEditingClaim(null)}
            className="text-slate-400 hover:text-slate-600 transition p-1 text-sm rounded-md"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleUpdateClaimSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editingClaim.customer_name || ''}
                onChange={(e) => setEditingClaim({ ...editingClaim, customer_name: e.target.value })}
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
                value={editingClaim.customer_phone || ''}
                onChange={(e) => setEditingClaim({ ...editingClaim, customer_phone: e.target.value })}
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
              value={editingClaim.product_name || ''}
              onChange={(e) => setEditingClaim({ ...editingClaim, product_name: e.target.value })}
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
                value={editingClaim.serial_code || ''}
                onChange={(e) => setEditingClaim({ ...editingClaim, serial_code: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={editingClaim.status || 'Received'}
                onChange={(e) => setEditingClaim({ ...editingClaim, status: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              >
                <option value="Received">Received</option>
                <option value="Sent to Service">Sent to Service</option>
                <option value="Ready for Delivery">Ready for Delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Issue Description
            </label>
            <textarea
              rows={2}
              value={editingClaim.issue_description || ''}
              onChange={(e) => setEditingClaim({ ...editingClaim, issue_description: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Backup Unit Provided
              </label>
              <input
                type="text"
                value={editingClaim.backup_unit_provided || ''}
                onChange={(e) => setEditingClaim({ ...editingClaim, backup_unit_provided: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Est. Delivery Date
              </label>
              <input
                type="date"
                value={
                  editingClaim.estimated_delivery_date
                    ? editingClaim.estimated_delivery_date.substring(0, 10)
                    : ''
                }
                onChange={(e) =>
                  setEditingClaim({ ...editingClaim, estimated_delivery_date: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Service Notes
            </label>
            <textarea
              rows={2}
              value={editingClaim.service_notes || ''}
              onChange={(e) => setEditingClaim({ ...editingClaim, service_notes: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition resize-y"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingClaim(null)}
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
