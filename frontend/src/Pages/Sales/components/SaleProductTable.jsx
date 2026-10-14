import React, { useState, useEffect } from 'react';
import { taka } from '../hooks/useNewSale';
import SaleProductTableRow from './table/SaleProductTableRow';

export default function SaleProductTable({
  items,
  expandedId,
  setExpandedId,
  activeCostCardId,
  toggleCostCard,
  updateItem,
  switchItemUnit,
  removeItem,
  handleAddBarcode,
  handleRemoveBarcode,
  barcodeInput,
  setBarcodeInput,
  barcodeError,
  setBarcodeError,
  barcodeInputRef,
  subtotal,
  currentSaleTotal,
}) {
  const [openPickerId, setOpenPickerId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openPickerId && !e.target.closest('.serial-picker-container')) {
        setOpenPickerId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openPickerId]);

  if (items.length === 0) {
    return (
      <div className="text-center py-9 px-5 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 mb-4">
        <span className="text-3xl block mb-1.5">📦</span>
        <p className="m-0 text-sm font-semibold text-slate-600">No products added yet</p>
        <p className="mt-1 mb-0 text-xs text-slate-400">
          Scan a barcode or use the search bar above to add products to this sale
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-slate-200 overflow-visible relative mb-1.5 shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-[32px_minmax(0,1fr)_72px_80px_75px_85px_90px_48px] items-center bg-slate-50 px-2 py-2 text-xs font-bold text-slate-500 border-b-2 border-slate-200 rounded-t-md">
          <div className="text-center">#</div>
          <div className="pl-1 min-w-0">PRODUCT</div>
          <div className="text-center" title="Customer Warranty (Months)">WAR</div>
          <div className="text-center">QTY</div>
          <div className="text-center">DISC</div>
          <div className="text-right pr-2">PRICE</div>
          <div className="text-right pr-2">TOTAL</div>
          <div className="text-center"></div>
        </div>

        {/* Items Rows */}
        {items.map((it, idx) => (
          <SaleProductTableRow
            key={it.localId}
            it={it}
            idx={idx}
            itemsLength={items.length}
            expandedId={expandedId}
            activeCostCardId={activeCostCardId}
            openPickerId={openPickerId}
            setOpenPickerId={setOpenPickerId}
            toggleCostCard={toggleCostCard}
            updateItem={updateItem}
            switchItemUnit={switchItemUnit}
            removeItem={removeItem}
            handleAddBarcode={handleAddBarcode}
            handleRemoveBarcode={handleRemoveBarcode}
          />
        ))}
      </div>

      {/* Under-Table Item Summary Bar */}
      <div className="text-right py-2 px-1 text-xs text-slate-600">
        <span>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
        {' · '}
        <span>
          New Items Subtotal: <strong className="text-slate-900">{taka(subtotal)}</strong>
        </span>
        {' · '}
        <span>
          Net Payable: <strong className="text-slate-900">{taka(currentSaleTotal)}</strong>
        </span>
      </div>
    </>
  );
}
