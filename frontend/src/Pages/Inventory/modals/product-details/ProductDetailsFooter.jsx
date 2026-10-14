import React from 'react';

export default function ProductDetailsFooter({
  product,
  isTechnician,
  isOut,
  onClose,
  onOpenNewQuotation,
  onOpenNewSale,
  handleOpenTransferModal,
  handleOpenLabelModal,
  handleOpenWarrantyModal,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-200 bg-slate-50">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Create Quotation Button (for technicians and shop users) */}
        {onOpenNewQuotation && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenNewQuotation(product);
            }}
            className="py-2 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-colors shadow-sm"
          >
            <span>📝</span> Create Quotation
          </button>
        )}

        {/* New Sale Button (admin/staff only) */}
        {!isTechnician && onOpenNewSale && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenNewSale(product);
            }}
            disabled={isOut}
            className={`py-2 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm ${
              isOut
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
            }`}
          >
            <span>🛒</span> New Sale
          </button>
        )}

        {/* Stock Transfer Button (admin/staff only) */}
        {!isTechnician && handleOpenTransferModal && (
          <button
            type="button"
            onClick={() => {
              onClose();
              handleOpenTransferModal(product);
            }}
            className="py-2 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white cursor-pointer transition-colors shadow-sm"
          >
            <span>🔄</span> Transfer Stock
          </button>
        )}

        {/* Print Barcode Label (admin/staff only) */}
        {!isTechnician && handleOpenLabelModal && (
          <button
            type="button"
            onClick={() => {
              onClose();
              handleOpenLabelModal(product);
            }}
            className="py-2 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer transition-colors"
          >
            <span>🏷️</span> Print Label
          </button>
        )}

        {/* Warranty & Serials */}
        {handleOpenWarrantyModal && (
          <button
            type="button"
            onClick={() => {
              onClose();
              handleOpenWarrantyModal(product);
            }}
            className="py-2 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 cursor-pointer transition-colors"
          >
            <span>🛡️</span> Serials &amp; Warranty
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="py-2 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
      >
        Close
      </button>
    </div>
  );
}
