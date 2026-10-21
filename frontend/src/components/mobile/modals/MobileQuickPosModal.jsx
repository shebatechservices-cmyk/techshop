import React from 'react';
import useMobileQuickPos from './useMobileQuickPos';
import MobileCameraScannerModal from './MobileCameraScannerModal';
import MobilePosCartItemList from './MobilePosCartItemList';
import MobilePosCheckoutFooter from './MobilePosCheckoutFooter';

const taka = (v) => `৳ ${Number(v || 0).toLocaleString('en-BD', { minimumFractionDigits: 0 })}`;

export default function MobileQuickPosModal({ isOpen, onClose, onSaleCompleted }) {
  const {
    cart,
    customers,
    filteredProducts,
    selectedCustomerId,
    setSelectedCustomerId,
    discount,
    setDiscount,
    paidMethod,
    setPaidMethod,
    search,
    setSearch,
    isScannerOpen,
    setIsScannerOpen,
    saving,
    error,
    totalPayable,
    dueAmount,
    addToCart,
    updateQuantity,
    removeFromCart,
    handleScanCode,
    handleCompleteSale,
  } = useMobileQuickPos({ isOpen, onClose, onSaleCompleted });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9995] bg-slate-950/60 backdrop-blur-sm flex flex-col justify-end"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-800 h-[94vh] flex flex-col animate-slideUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm m-0">
                কুইক বিক্রি (Quick POS)
              </h3>
              <p className="text-[10px] text-slate-500 m-0">মোবাইলে দ্রুত পণ্য নির্বাচন ও ক্যাশ রিসিট</p>
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

        {/* Search Bar + Scanner */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200/80 dark:border-slate-800 flex gap-2 relative">
          <input
            type="text"
            placeholder="পণ্য সার্চ / বারকোড..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-3 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95"
          >
            <span>📷</span>
          </button>

          {/* Search Dropdown Results */}
          {search.trim().length > 0 && (
            <div className="absolute left-2.5 right-2.5 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-20 max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addToCart(p)}
                  className="w-full text-left p-2.5 hover:bg-emerald-50 dark:hover:bg-slate-700 flex justify-between items-center"
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate flex-1 pr-2">
                    {p.name}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-600 whitespace-nowrap">
                    {taka(p.selling_price || p.sale_price)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <MobilePosCartItemList
            cart={cart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
          />

          {/* Customer Selection & Discount */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">গ্রাহক</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-800"
              >
                <option value="">নগদ খদ্দের (Walk-in)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone || 'বাকি'})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">ডিসকাউন্ট (৳)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Payment Methods */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">পেমেন্ট মেথড</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'CASH', label: 'ক্যাশ', icon: '💵' },
                { id: 'BKASH', label: 'বিকাশ', icon: '📱' },
                { id: 'DUE', label: 'বাকি', icon: '⏳' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaidMethod(m.id)}
                  className={`py-2 px-1 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 border transition-all ${
                    paidMethod === m.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200'
                  }`}
                >
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <MobilePosCheckoutFooter
          totalPayable={totalPayable}
          dueAmount={dueAmount}
          saving={saving}
          cartEmpty={cart.length === 0}
          onCompleteSale={handleCompleteSale}
        />
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
