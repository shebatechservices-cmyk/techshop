import React from 'react';

export default function DeleteClaimModal({
  claimToDelete,
  setClaimToDelete,
  handleConfirmDeleteClaim,
}) {
  if (!claimToDelete) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) setClaimToDelete(null);
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 text-center animate-scaleUp">
        <div className="text-4xl mb-3">🗑️</div>
        <h3 className="text-base font-bold text-slate-900 mb-2">
          Delete Warranty Claim?
        </h3>
        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
          Are you sure you want to delete claim{' '}
          <strong className="text-slate-900">{claimToDelete.claim_no}</strong> for{' '}
          <strong className="text-slate-900">{claimToDelete.customer_name}</strong>? It will be moved to the Trash bin.
        </p>
        <div className="flex justify-center gap-2.5">
          <button
            type="button"
            onClick={() => setClaimToDelete(null)}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDeleteClaim}
            className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-sm shadow-red-600/30 transition cursor-pointer text-xs"
          >
            Delete Claim
          </button>
        </div>
      </div>
    </div>
  );
}
