import React from 'react';

export default function QuickAddModalHeader({ onClose, duplicateAlert, setDuplicateAlert }) {
  return (
    <>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">📦</span>
          <div>
            <h2 className="m-0 text-lg font-extrabold text-slate-900">
              Add New Catalog Product
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Create product directly into catalog and append to this purchase order
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="bg-transparent border-0 text-xl text-slate-400 hover:text-slate-600 cursor-pointer p-1 leading-none transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Duplicate Notification Alert */}
      {duplicateAlert && (
        <div className="mx-6 mt-4 p-3.5 px-4.5 rounded-lg bg-red-50 border-[1.5px] border-red-500 flex items-center justify-between shadow-md shadow-red-500/15">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚠️</span>
            <div>
              <strong className="text-red-900 text-sm font-bold block">
                Already added this product, add a new product for catalog
              </strong>
              <span className="text-xs text-red-700">
                A product with the same name, model, SKU, or barcode already exists in the catalog.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDuplicateAlert(false)}
            className="bg-red-500 hover:bg-red-600 text-white border-0 py-1.5 px-3 rounded-md font-semibold text-xs cursor-pointer transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}
