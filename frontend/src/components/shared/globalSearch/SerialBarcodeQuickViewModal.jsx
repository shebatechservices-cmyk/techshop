import React, { useEffect } from 'react';
import PurchaseInfoCard from './cards/PurchaseInfoCard';
import InventoryStockCard from './cards/InventoryStockCard';
import SalesInvoiceCard from './cards/SalesInvoiceCard';
import WarrantyReturnsCard from './cards/WarrantyReturnsCard';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SerialBarcodeQuickViewModal({
  isOpen,
  onClose,
  data,
  matchType,
  scannedCode,
  onNavigate,
}) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const product = data.product || {};
  const purchase = data.purchase || {};
  const inventory = data.inventory || {};
  const sale = data.sale || null;
  const warranty = data.warranty || {};
  const serialCode = data.serial_code || scannedCode;

  const isSold = data.status === 'Sold' || Boolean(sale?.invoice_no);

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-white/10 rounded-xl text-xl backdrop-blur-md">
              🔍
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  {matchType === 'SERIAL_SOLD'
                    ? 'Unit Serial (Sold)'
                    : matchType === 'SERIAL_INVENTORY'
                    ? 'Unit Serial (In Stock)'
                    : matchType === 'PRODUCT_BARCODE'
                    ? 'Product Model Barcode'
                    : 'Tracked Record'}
                </span>
                {serialCode && (
                  <span className="font-mono text-xs font-bold bg-white/10 px-2 py-0.5 rounded border border-white/20">
                    S/N: {serialCode}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
                {product.name || 'Product Details'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
            title="Close (Esc)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Product Identity Subheader */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap text-slate-600">
            {product.brand_name && (
              <span>Brand: <strong className="text-slate-800">{product.brand_name}</strong></span>
            )}
            {product.category_name && (
              <span>Category: <strong className="text-slate-800">{product.category_name}</strong></span>
            )}
            {product.sku && (
              <span>SKU: <strong className="font-mono text-slate-800">{product.sku}</strong></span>
            )}
            {product.barcode && (
              <span>Barcode: <strong className="font-mono text-slate-800">{product.barcode}</strong></span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${
                isSold
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : Number(inventory.stock || product.stock) > 0
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-100 text-rose-700 border border-rose-200'
              }`}
            >
              ● {isSold ? 'Sold Unit' : Number(inventory.stock || product.stock) > 0 ? 'In Stock Unit' : 'Out of Stock'}
            </span>
          </div>
        </div>

        {/* Modal Body - 4 Operational Dimensions Grid */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PurchaseInfoCard
              purchase={purchase}
              product={product}
              taka={taka}
              onClose={onClose}
              onNavigate={onNavigate}
            />

            <InventoryStockCard
              inventory={inventory}
              product={product}
              isSold={isSold}
              taka={taka}
              onClose={onClose}
              onNavigate={onNavigate}
            />

            <SalesInvoiceCard
              sale={sale}
              taka={taka}
              onClose={onClose}
              onNavigate={onNavigate}
            />

            <WarrantyReturnsCard
              warranty={warranty}
              product={product}
              isSold={isSold}
              serialCode={serialCode}
              taka={taka}
              onClose={onClose}
              onNavigate={onNavigate}
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-500 font-medium">
            Press <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[11px] font-mono">Esc</kbd> to dismiss popup
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
