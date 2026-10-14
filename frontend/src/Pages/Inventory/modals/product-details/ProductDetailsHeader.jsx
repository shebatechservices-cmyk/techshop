import React from 'react';

export default function ProductDetailsHeader({ product, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-2xl p-1.5 bg-sky-100 rounded-lg text-sky-700">📦</span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[0.7rem] uppercase tracking-wider font-extrabold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              Inventory Product Details
            </span>
            <span className="font-mono text-xs text-slate-400">ID #{product.id}</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 truncate mt-0.5">
            {product.composite_name || product.name}
          </h2>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-slate-400 hover:text-slate-700 bg-slate-200/60 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold transition-colors ml-3 shrink-0"
        title="Close modal (Esc)"
      >
        ✕
      </button>
    </div>
  );
}
