import React from 'react';
import useStockLookup from './useStockLookup';
import MobileCameraScannerModal from './MobileCameraScannerModal';

const taka = (v) => `৳ ${Number(v || 0).toLocaleString('en-BD', { minimumFractionDigits: 0 })}`;

export default function MobileStockLookupModal({ isOpen, onClose, currentUser }) {
  const {
    filteredProducts,
    loading,
    search,
    setSearch,
    isScannerOpen,
    setIsScannerOpen,
    handleScanCode,
  } = useStockLookup({ isOpen });

  if (!isOpen) return null;

  const isPrivileged = ['ADMIN', 'SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(
    (currentUser?.role || '').toUpperCase()
  );

  return (
    <div
      className="fixed inset-0 z-[9995] bg-slate-950/60 backdrop-blur-sm flex flex-col justify-end"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-800 h-[90vh] flex flex-col animate-slideUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔍</span>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm m-0">
                স্টক ও দর চেক (Stock Lookup)
              </h3>
              <p className="text-[11px] text-slate-500 m-0">নাম বা বারকোড দিয়ে পণ্যের দাম ও মজুত দেখুন</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Search Bar + Camera Scan Button */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200/80 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            placeholder="পণ্য সার্চ (নাম / বারকোড)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-3 py-2 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all"
            title="Scan with Camera"
          >
            <span>📷</span>
            <span>স্ক্যান</span>
          </button>
        </div>

        {/* Product Cards List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {loading && (
            <div className="py-12 text-center text-xs text-slate-400 font-semibold">
              পণ্য লোড হচ্ছে...
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400">
              কোনো পণ্য পাওয়া যায়নি
            </div>
          )}

          {filteredProducts.map((p) => {
            const stockQty = Number(p.stock_quantity ?? p.stock ?? 0);
            const isOutOfStock = stockQty <= 0;
            const isLowStock = stockQty > 0 && stockQty <= Number(p.min_stock_alert || 5);

            return (
              <div
                key={p.id}
                className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-sm flex flex-col gap-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs m-0 truncate">
                      {p.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium">
                      SKU: {p.sku || p.barcode || 'N/A'} {p.category_name && `• ${p.category_name}`}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isOutOfStock
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                        : isLowStock
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                    }`}
                  >
                    স্টক: {stockQty} {p.unit || 'টি'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/50 text-[11px]">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 uppercase font-bold">খুচরা বিক্রয়</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-black">
                      {taka(p.selling_price || p.sale_price || p.price)}
                    </strong>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 uppercase font-bold">পাইকারি রেট</span>
                    <strong className="text-sky-600 dark:text-sky-400 font-black">
                      {taka(p.wholesale_price || p.selling_price)}
                    </strong>
                  </div>
                  {isPrivileged && (
                    <div className="col-span-2 flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span>ক্রয়মূল্য (Purchase):</span>
                      <strong className="text-slate-600 dark:text-slate-300">
                        {taka(p.purchase_cost || p.cost_price || p.purchase_price)}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <MobileCameraScannerModal
        isOpen={isScannerOpen}
        onScan={handleScanCode}
        onClose={() => setIsScannerOpen(false)}
        title="পণ্যের বারকোড স্ক্যান করুন"
      />
    </div>
  );
}
