import React from 'react';

export default function DeactivatePaymentMethodModal({
  deactivateModal,
  setDeactivateModal,
  handleConfirmDeactivate,
}) {
  if (!deactivateModal?.isOpen || !deactivateModal?.method) return null;

  const methodName = deactivateModal.method.name || deactivateModal.method.method_name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 p-6 animate-scaleUp">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-lg flex-shrink-0">
            ⚠️
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">
              Deactivate Payment Method?
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirm status change for this payment method
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Are you sure you want to deactivate <span className="font-bold text-slate-800">"{methodName}"</span>?
        </p>

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 leading-normal mb-5 flex items-start gap-2">
          <span>🛡️</span>
          <span>Historical transactions, invoices, and purchase records will remain completely intact.</span>
        </div>

        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => setDeactivateModal({ isOpen: false, method: null, loading: false })}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deactivateModal.loading}
            onClick={handleConfirmDeactivate}
            className={`px-5 py-2 text-xs font-bold rounded-lg text-white bg-red-600 hover:bg-red-700 shadow-sm shadow-red-500/30 transition ${
              deactivateModal.loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {deactivateModal.loading ? 'Deactivating...' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  );
}
