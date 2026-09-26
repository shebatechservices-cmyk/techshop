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
    <div ref={fabRef} className="mobile-fab-container md:hidden">
      {/* Speed Dial Menu Items */}
      {isOpen && (
        <div className="mobile-fab-menu" role="menu" aria-label="Quick Actions Menu">
          {/* Quick POS Sale */}
          <button
            type="button"
            className="mobile-fab-action-btn fab-sale"
            onClick={() => handleAction(onQuickSale)}
            title="New Quick Sale"
          >
            <span className="fab-action-icon">⚡</span>
            <span className="fab-action-label">New Sale</span>
          </button>

          {/* Quick Expense */}
          <button
            type="button"
            className="mobile-fab-action-btn fab-expense"
            onClick={() => handleAction(onQuickExpense)}
            title="Quick Expense Entry"
          >
            <span className="fab-action-icon">💸</span>
            <span className="fab-action-label">Quick Expense</span>
          </button>

          {/* Quick Purchase */}
          <button
            type="button"
            className="mobile-fab-action-btn fab-purchase"
            onClick={() => handleAction(onQuickPurchase)}
            title="New Purchase Entry"
          >
            <span className="fab-action-icon">🛒</span>
            <span className="fab-action-label">New Purchase</span>
          </button>

          {/* Barcode Scanner / Search */}
          <button
            type="button"
            className="mobile-fab-action-btn fab-scanner"
            onClick={() => handleAction(onQuickScanner)}
            title="Barcode Scanner / Search"
          >
            <span className="fab-action-icon">📷</span>
            <span className="fab-action-label">Barcode Scanner</span>
          </button>
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        type="button"
        className={`mobile-fab-main-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Quick Actions Speed Dial"
        title="Quick Actions"
      >
        <span className="fab-icon-symbol">{isOpen ? '✕' : '⚡'}</span>
      </button>
    </div>
  );
}
