import React from 'react';

export default function ProductDetailsWarranty({
  product,
  supMonths,
  expDateStr,
  validity,
  handleOpenWarrantyModal,
  onClose,
}) {
  return (
    <>
      {/* Supplier Warranty Information */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
            <span>🛡️</span> Supplier Warranty Status
          </span>
          {handleOpenWarrantyModal && (
            <button
              type="button"
              onClick={() => {
                handleOpenWarrantyModal(product);
                onClose();
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
            >
              View Serial Details →
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <span className="text-[0.7rem] text-slate-500 uppercase font-bold block">Warranty Duration</span>
            <span className="font-bold text-slate-800">
              {supMonths > 0 ? `${supMonths} Months` : 'No Warranty / None'}
            </span>
          </div>

          <div>
            <span className="text-[0.7rem] text-slate-500 uppercase font-bold block">Supplier Expiry Date</span>
            <span className="font-mono text-slate-800">
              {expDateStr ? new Date(expDateStr).toLocaleDateString() : '—'}
            </span>
          </div>

          <div>
            <span className="text-[0.7rem] text-slate-500 uppercase font-bold block">Warranty Validity</span>
            {validity ? (
              <span
                className={`inline-block py-0.5 px-2 rounded text-xs font-bold ${
                  validity.expired ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {validity.text}
              </span>
            ) : (
              <span className="text-slate-400">N/A</span>
            )}
          </div>
        </div>
      </div>

      {/* Product Description (if available) */}
      {product.description && (
        <div className="p-3 bg-white border border-slate-200 rounded-xl">
          <span className="text-[0.72rem] text-slate-500 font-bold uppercase block mb-1">
            Description / Specifications
          </span>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line m-0">
            {product.description}
          </p>
        </div>
      )}
    </>
  );
}
