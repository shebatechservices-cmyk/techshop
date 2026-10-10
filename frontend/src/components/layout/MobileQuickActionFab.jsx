import React, { useState, useEffect, useRef } from 'react';

export default function MobileQuickActionFab({
  onQuickSale,
  onQuickPurchase,
  onQuickExpense,
  onQuickScanner,
  onQuickAddProduct,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (fabRef.current && !fabRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen]);

  const handleAction = (callback) => {
    setIsOpen(false);
    if (typeof callback === 'function') {
      callback();
    }
  };

  return (
    <div ref={fabRef} className="mobile-fab-container fixed bottom-18 right-4 z-40 md:hidden">
      {/* Speed Dial Menu Items */}
      {isOpen && (
        <div className="mobile-fab-menu mb-3 flex flex-col items-end gap-2" role="menu" aria-label="Quick Actions Menu">
          {/* Quick POS Sale */}
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 bg-white text-slate-800 rounded-full shadow-lg border border-slate-200 text-xs font-bold active:scale-95 transition-transform"
            onClick={() => handleAction(onQuickSale)}
            title="New Quick Sale"
          >
            <span className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm shadow-sm">⚡</span>
            <span>New Sale</span>
          </button>

          {/* Quick Expense */}
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 bg-white text-slate-800 rounded-full shadow-lg border border-slate-200 text-xs font-bold active:scale-95 transition-transform"
            onClick={() => handleAction(onQuickExpense)}
            title="Quick Expense Entry"
          >
            <span className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-sm shadow-sm">💸</span>
            <span>Quick Expense</span>
          </button>

          {/* Quick Purchase */}
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 bg-white text-slate-800 rounded-full shadow-lg border border-slate-200 text-xs font-bold active:scale-95 transition-transform"
            onClick={() => handleAction(onQuickPurchase)}
            title="New Purchase Entry"
          >
            <span className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm shadow-sm">🛒</span>
            <span>New Purchase</span>
          </button>

          {/* Barcode Scanner / Search */}
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 bg-white text-slate-800 rounded-full shadow-lg border border-slate-200 text-xs font-bold active:scale-95 transition-transform"
            onClick={() => handleAction(onQuickScanner)}
            title="Barcode Scanner / Search"
          >
            <span className="w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm shadow-sm">📷</span>
            <span>Scan Barcode</span>
          </button>
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        type="button"
        className={`w-13 h-13 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center text-xl shadow-xl shadow-sky-500/30 active:scale-90 transition-all ${
          isOpen ? 'rotate-45 !from-rose-500 !to-red-600' : ''
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Quick Actions Speed Dial"
        title="Quick Actions"
      >
        <span className="leading-none">{isOpen ? '✕' : '⚡'}</span>
      </button>
    </div>
  );
}
