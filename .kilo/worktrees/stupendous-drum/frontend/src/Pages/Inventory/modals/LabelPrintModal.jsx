import React from 'react';
import { taka } from '../hooks/useInventoryManager';

export default function LabelPrintModal({
  product,
  labelQuantity,
  setLabelQuantity,
  onPrint,
  onClose,
  printLabelRef,
}) {
  if (!product) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/65 flex items-center justify-center z-[99999] p-5 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-[600px] w-full p-6 shadow-2xl animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4.5">
          <div>
            <h3 className="m-0 text-lg font-extrabold text-slate-900">
              Print Barcode Labels
            </h3>
            <p className="mt-0.5 mb-0 text-slate-500 text-xs">
              {product.composite_name || product.name}
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

        {/* Label Quantity Selector */}
        <div className="mb-4.5">
          <label className="block text-xs font-bold text-slate-600 mb-1.5">
            Number of Labels to Print:
          </label>
          <div className="flex gap-2">
            {[1, 2, 4, 8, 12, 24].map((qty) => (
              <button
                key={qty}
                type="button"
                onClick={() => setLabelQuantity(qty)}
                className={`py-1.5 px-3.5 rounded-md font-bold cursor-pointer text-xs transition-colors ${
                  labelQuantity === qty
                    ? 'border-2 border-sky-600 bg-sky-100 text-sky-600'
                    : 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                {qty}
              </button>
            ))}
          </div>
        </div>

        {/* Sticker Preview Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
          <div className="text-xs font-bold text-slate-500 uppercase mb-2">
            Sticker Preview (58mm x 38mm)
          </div>
          <div className="w-[240px] bg-white border-[1.5px] border-dashed border-slate-400 rounded-md p-2.5 shadow-sm mx-auto">
            <div className="text-[0.65rem] font-extrabold text-sky-600 uppercase tracking-wider">
              SHEBA TECHNOLOGY
            </div>
            <div className="text-xs font-bold text-slate-900 my-1 leading-snug">
              {product.composite_name || product.name}
            </div>
            <div className="text-[0.7rem] text-slate-500 font-mono">
              SKU: {product.sku || product.barcode || `PRD-${product.id}`}
            </div>
            {/* Simulated Barcode */}
            <div
              style={{
                height: '24px',
                margin: '6px 0',
                background: 'repeating-linear-gradient(90deg, #000 0, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 6px, transparent 6px, transparent 8px)',
              }}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-[0.68rem] text-slate-500">
                {product.warranty_months ? `Warranty: ${product.warranty_months}m` : ''}
              </span>
              <span className="text-sm font-black text-slate-900">
                {taka(product.sale_price)}
              </span>
            </div>
          </div>
        </div>

        {/* Hidden Printable Elements Generator */}
        <div className="hidden" ref={printLabelRef}>
          {Array.from({ length: labelQuantity }).map((_, idx) => (
            <div key={idx} className="label-sticker">
              <div className="store-name">SHEBA TECHNOLOGY</div>
              <div className="prod-title">{product.composite_name || product.name}</div>
              <div className="prod-sku">SKU: {product.sku || product.barcode || `PRD-${product.id}`}</div>
              <div className="barcode-lines"></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '7pt', color: '#64748b' }}>
                  {product.warranty_months ? `Warranty: ${product.warranty_months}m` : ''}
                </span>
                <span className="prod-price">{taka(product.sale_price)}</span>
              </div>
            </div>
          ))}
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
            type="button"
            onClick={onPrint}
            className="py-2 px-5 rounded-md border-0 bg-sky-600 hover:bg-sky-700 text-white font-bold cursor-pointer flex items-center gap-1.5 text-xs transition-colors"
          >
            <span>🖨️</span> Print {labelQuantity} Labels
          </button>
        </div>
      </div>
    </div>
  );
}
