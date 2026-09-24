import React from 'react';

export default function AdminOverrideModal({
  overrideModal,
  setOverrideModal,
  handleConfirmOverride,
  taka,
}) {
  if (!overrideModal?.isOpen) return null;

  const isDelete = overrideModal.actionType === 'delete';

  return (
    <div
      className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center z-[99999] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setOverrideModal({
            isOpen: false,
            actionType: null,
            sale: null,
            enteredPin: '',
            error: '',
            lockReason: '',
          });
        }
      }}
    >
      <div className="bg-white rounded-2xl max-w-[460px] w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div
          className={`p-5 px-6 text-white flex items-center justify-between ${
            isDelete
              ? 'bg-gradient-to-br from-red-500 to-red-700'
              : 'bg-gradient-to-br from-blue-500 to-blue-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🔐</span>
            <div>
              <h3 className="m-0 text-base font-bold">Admin Security PIN Override</h3>
              <p className="m-0 mt-0.5 text-xs opacity-90">
                Authorization required for locked record {isDelete ? 'deletion' : 'modification'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setOverrideModal({
                isOpen: false,
                actionType: null,
                sale: null,
                enteredPin: '',
                error: '',
                lockReason: '',
              })
            }
            className="bg-white/20 hover:bg-white/30 border-0 text-white text-lg rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Lock notice alert */}
          <div className="p-3 px-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs mb-4 flex items-start gap-2">
            <span className="text-base">⚠️</span>
            <div>
              <strong className="font-bold">Lock Rule Enforced:</strong>
              <div className="mt-0.5">{overrideModal.lockReason}</div>
            </div>
          </div>

          {/* Invoice details summary */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 mb-5 grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-500">Invoice: </span>
              <strong className="text-slate-900 font-bold">
                #{overrideModal.sale?.invoice_no || overrideModal.sale?.id}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Total: </span>
              <strong className="text-slate-900 font-bold">
                {taka(overrideModal.sale?.total_amount)}
              </strong>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500">Customer: </span>
              <strong className="text-slate-900 font-bold">
                {overrideModal.sale?.customer_name || 'Walk-in Customer'}
              </strong>
            </div>
          </div>

          {/* PIN input */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Enter Admin Security PIN
            </label>
            <input
              type="password"
              maxLength={10}
              autoFocus
              value={overrideModal.enteredPin}
              onChange={(e) =>
                setOverrideModal((prev) => ({
                  ...prev,
                  enteredPin: e.target.value,
                  error: '',
                }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmOverride();
              }}
              placeholder="••••"
              className={`w-full py-2.5 px-3.5 text-xl tracking-[0.25em] text-center rounded-lg outline-none box-border ${
                overrideModal.error
                  ? 'border-2 border-red-500 focus:border-red-600'
                  : 'border border-slate-300 focus:border-blue-500'
              }`}
            />
            {overrideModal.error && (
              <p className="text-red-500 text-xs mt-1.5 mb-0 font-medium">{overrideModal.error}</p>
            )}
            <p className="text-slate-500 text-[0.75rem] mt-1.5 mb-0">
              Security PIN is configured in Settings &gt; Session &amp; Security.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={() =>
              setOverrideModal({
                isOpen: false,
                actionType: null,
                sale: null,
                enteredPin: '',
                error: '',
                lockReason: '',
              })
            }
            className="py-2 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmOverride}
            className={`py-2 px-5 rounded-lg border-0 text-white text-xs font-semibold cursor-pointer shadow-sm transition-colors ${
              isDelete ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isDelete ? 'Authorize & Delete' : 'Authorize & Edit'}
          </button>
        </div>
      </div>
    </div>
  );
}
