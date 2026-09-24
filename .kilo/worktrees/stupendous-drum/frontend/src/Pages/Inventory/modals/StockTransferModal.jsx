import React from 'react';

export default function StockTransferModal({
  isOpen,
  onClose,
  products = [],
  warehouses = [],
  transferForm,
  setTransferForm,
  onSubmit,
  transferSubmitting,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/65 flex items-center justify-center z-[99999] p-5 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-[520px] w-full p-6 shadow-2xl animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4.5">
          <div>
            <h3 className="m-0 text-lg font-extrabold text-slate-900">
              🔄 Transfer Stock Between Warehouses
            </h3>
            <p className="mt-0.5 mb-0 text-slate-500 text-xs">
              Move stock items from one warehouse or branch to another
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-transparent border-0 text-2xl text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {/* Product Selection */}
          <div className="mb-3.5">
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Select Product:
            </label>
            <select
              value={transferForm.product_id}
              onChange={(e) => setTransferForm({ ...transferForm, product_id: e.target.value })}
              className="w-full py-2 px-3 rounded-md border border-slate-300 text-sm bg-white outline-none focus:border-sky-500"
              required
            >
              <option value="">-- Choose Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.composite_name || p.name} (In-Stock: {p.stock} pcs)
                </option>
              ))}
            </select>
          </div>

          {/* Source & Destination Warehouses */}
          <div className="grid grid-cols-2 gap-3 mb-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                From (Source):
              </label>
              <select
                value={transferForm.source_warehouse_id}
                onChange={(e) => setTransferForm({ ...transferForm, source_warehouse_id: Number(e.target.value) })}
                className="w-full py-2 px-2.5 rounded-md border border-slate-300 text-xs bg-slate-50 outline-none"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                To (Destination):
              </label>
              <select
                value={transferForm.dest_warehouse_id}
                onChange={(e) => setTransferForm({ ...transferForm, dest_warehouse_id: Number(e.target.value) })}
                className="w-full py-2 px-2.5 rounded-md border border-slate-300 text-xs bg-green-50 outline-none"
              >
                {warehouses
                  .filter((wh) => wh.id !== transferForm.source_warehouse_id)
                  .map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Transfer Quantity */}
          <div className="mb-3.5">
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Transfer Quantity (Units):
            </label>
            <input
              type="number"
              min="1"
              value={transferForm.quantity}
              onChange={(e) => setTransferForm({ ...transferForm, quantity: parseInt(e.target.value, 10) || 1 })}
              className="w-full py-2 px-3 rounded-md border border-slate-300 text-sm font-bold box-border outline-none focus:border-sky-500"
              required
            />
          </div>

          {/* Transfer Notes */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Reference / Transfer Note:
            </label>
            <input
              type="text"
              placeholder="e.g. Branch replenishment, showroom display, etc."
              value={transferForm.notes}
              onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
              className="w-full py-2 px-3 rounded-md border border-slate-300 text-xs box-border outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 font-semibold cursor-pointer text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={transferSubmitting}
              className="py-2 px-5 rounded-md border-0 bg-sky-600 hover:bg-sky-700 text-white font-bold cursor-pointer text-xs transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {transferSubmitting ? 'Transferring...' : '✓ Confirm Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
