import React, { useState, useEffect } from 'react';
import { isProductSerialTracked } from '../../../utils/productUtils';
import { taka } from '../hooks/useNewSale';

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
        {items.map((it, idx) => {
          const isTracked = isProductSerialTracked(it);
          const isSerialMissing = isTracked && (!it.serials || it.serials.length === 0);
          const isWarrantyMissing = it.is_warranty_required && (it.warranty_months === '' || it.warranty_months === null || it.warranty_months === undefined || Number(it.warranty_months) <= 0);
          const qty = isTracked ? (it.serials || []).length : Number(it.quantity || 1);
          const lineDiscount = Number(it.discount || 0);
          const lineTotal = qty * Number(it.unit_price || 0) - lineDiscount;
          const isExpanded = expandedId === it.localId;
          const sellPrice = Number(it.unit_price || 0);
          const purchaseCost = Number(it.cost_price || 0);
          const actualCost = purchaseCost > 0 ? purchaseCost : (sellPrice > 0 ? Math.round(sellPrice * 0.90857) : 0);
          const margin = sellPrice - actualCost;
          const marginPct = sellPrice > 0 ? ((margin / sellPrice) * 100).toFixed(1) : '0.0';

          return (
            <div
              key={it.localId}
              className={`transition-colors relative ${
                idx === items.length - 1 ? 'border-b-0' : 'border-b border-slate-100'
              } ${isExpanded ? 'bg-purple-50/50' : 'bg-white'} ${
                activeCostCardId === it.localId || openPickerId === it.localId ? 'z-[1000]' : 'z-[1]'
              } ${idx === items.length - 1 && !isExpanded ? 'rounded-b-md' : ''}`}
            >
              <div className="grid grid-cols-[32px_minmax(0,1fr)_72px_80px_75px_85px_90px_48px] items-center py-2 px-2">
                {/* 1. # */}
                <div className="text-center text-xs text-slate-500 font-medium">
                  {idx + 1}
                </div>

                {/* 2. PRODUCT NAME + SERIAL CHIPS + PICKER ICON */}
                <div className="pl-1 min-w-0">
                  <div className="font-bold text-slate-800 text-xs leading-snug flex items-center gap-1.5 flex-wrap">
                    <span>{it.full_name || it.name}</span>
                    <span className="text-[0.66rem] font-bold py-px px-1.5 rounded text-emerald-700 bg-emerald-50 border border-emerald-200 shrink-0">
                      Stock: {it.stock || 0}
                    </span>
                    {it.is_bundle && (
                      <span className="text-[0.66rem] font-extrabold py-px px-1.5 rounded text-purple-700 bg-purple-100 border border-purple-200 shrink-0">
                        🎁 Bundle Kit
                      </span>
                    )}
                    {isTracked && (
                      <span className={`text-[0.66rem] font-extrabold py-px px-1.5 rounded shrink-0 ${
                        isSerialMissing
                          ? 'text-rose-700 bg-rose-50 border border-rose-200'
                          : 'text-indigo-600 bg-indigo-50 border-0'
                      }`}>
                        {isSerialMissing ? '⚠️ Serial Required' : 'Serial Tracked'}
                      </span>
                    )}
                    {it.is_warranty_required && isWarrantyMissing && (
                      <span className="text-[0.66rem] text-rose-700 bg-rose-50 border border-rose-200 py-px px-1.5 rounded font-extrabold shrink-0">
                        ⚠️ Warranty Required
                      </span>
                    )}

                    {/* Serial Picker Icon directly in this row (No input box) */}
                    {isTracked && (
                      <div className="relative inline-flex items-center serial-picker-container shrink-0">
                        <button
                          type="button"
                          onClick={() => setOpenPickerId(openPickerId === it.localId ? null : it.localId)}
                          title="Pick available serial from inventory"
                          className={`px-1.5 py-0.5 text-xs rounded border transition-colors cursor-pointer flex items-center gap-1 ${
                            openPickerId === it.localId
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : isSerialMissing
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                          }`}
                        >
                          <span>📋</span>
                          <span className="text-[10px] font-sans font-semibold">
                            {isSerialMissing ? 'Pick Serial' : 'Serials'}
                          </span>
                        </button>

                        {/* Serial Picker Popover */}
                        {openPickerId === it.localId && (
                          <div className="absolute top-[calc(100%+4px)] left-0 w-64 max-h-56 overflow-y-auto bg-white border border-slate-300 rounded-lg shadow-2xl p-2 z-[999999] text-left font-normal">
                            <div className="text-[11px] font-bold text-slate-800 pb-1.5 mb-1.5 border-b border-slate-200 flex items-center justify-between">
                              <span>Available Stock Serials</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                ({(it.available_serials || []).length} in stock)
                              </span>
                            </div>
                            {it.available_serials && it.available_serials.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {it.available_serials.map((serialCode, sIdx) => {
                                  const isSelected = (it.serials || []).includes(serialCode);
                                  return (
                                    <button
                                      key={sIdx}
                                      type="button"
                                      disabled={isSelected}
                                      onClick={() => {
                                        handleAddBarcode(it.localId, serialCode);
                                        setOpenPickerId(null);
                                      }}
                                      className={`w-full text-left px-2 py-1 rounded text-xs font-mono flex items-center justify-between border-0 transition-colors ${
                                        isSelected
                                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                          : 'bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 cursor-pointer'
                                      }`}
                                    >
                                      <span>{serialCode}</span>
                                      {isSelected ? (
                                        <span className="text-[10px] text-emerald-600 font-sans font-bold">✓ Added</span>
                                      ) : (
                                        <span className="text-[10px] text-indigo-600 font-sans font-semibold">+ Select</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="py-3 px-2 text-center text-xs text-slate-400">
                                No available serial numbers in stock
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bundle Items Summary */}
                  {it.is_bundle && it.bundle_items && it.bundle_items.length > 0 && (
                    <div className="text-[10px] text-purple-700 font-medium mt-0.5">
                      Kit Items: {it.bundle_items.map((b) => `${b.quantity}x ${b.component_name || `Item #${b.product_id}`}`).join(', ')}
                    </div>
                  )}

                  {/* Dual-UoM Unit Toggle Selector */}
                  {it.sub_unit_name && (
                    <div className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 p-0.5 mt-1 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => switchItemUnit && switchItemUnit(it.localId, 'base_unit')}
                        className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                          it.unit_type !== 'sub_unit'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {it.base_unit_name || 'Box'}
                      </button>
                      <button
                        type="button"
                        onClick={() => switchItemUnit && switchItemUnit(it.localId, 'sub_unit')}
                        className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                          it.unit_type === 'sub_unit'
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {it.sub_unit_name || 'Meter'}
                      </button>
                    </div>
                  )}

                  {/* Scanned Serial Chips */}
                  {isTracked && it.serials && it.serials.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {it.serials.map((s, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1 py-px px-1.5 bg-white border border-slate-300 rounded text-[0.68rem] font-mono text-slate-700"
                        >
                          {s}
                          <button
                            type="button"
                            onClick={() => handleRemoveBarcode(it.localId, s)}
                            className="border-0 bg-transparent text-slate-400 hover:text-rose-500 cursor-pointer text-xs p-0 leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* WAR */}
                <div className="flex justify-center">
                  <input
                    type="number"
                    min="0"
                    value={it.warranty_months !== undefined ? it.warranty_months : ''}
                    onChange={(e) => updateItem(it.localId, { warranty_months: e.target.value })}
                    title={isWarrantyMissing ? 'Warranty is required for this product' : 'Warranty duration in months'}
                    placeholder={it.is_warranty_required ? 'Req' : '0'}
                    className={`w-14 py-1 px-1 rounded-md text-center text-xs outline-none transition-colors ${
                      isWarrantyMissing
                        ? 'border-2 border-rose-500 bg-rose-50 text-rose-700 font-bold ring-2 ring-rose-200'
                        : 'border border-slate-300 bg-white text-slate-800 font-medium focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
                    }`}
                  />
                </div>

                {/* QTY */}
                <div className="flex justify-center items-center">
                  {isTracked ? (
                    <div className="inline-flex items-center gap-0.5 justify-center" title="Quantity is auto-locked to scanned serials count">
                      <input
                        type="number"
                        disabled={true}
                        readOnly={true}
                        value={qty}
                        className={`w-12 py-1 px-1 rounded-md text-center text-xs font-bold cursor-not-allowed outline-none ${
                          isSerialMissing
                            ? 'border-2 border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-200'
                            : 'border border-slate-300 bg-slate-100 text-slate-600'
                        }`}
                      />
                      <span className="text-[11px] select-none" title="Auto-locked by serial scans">🔒</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 justify-center">
                      <input
                        type="number"
                        min="0.01"
                        max={it.stock || 99999}
                        step="any"
                        value={it.quantity !== undefined ? it.quantity : 1}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          const maxStock = Number(it.stock || 0);
                          if (!isNaN(val) && maxStock > 0 && val > maxStock) {
                            updateItem(it.localId, { quantity: maxStock });
                          } else {
                            updateItem(it.localId, { quantity: isNaN(val) ? '' : val });
                          }
                        }}
                        className="w-14 py-1 px-1 rounded-md border border-slate-300 text-center text-xs font-bold text-slate-800 outline-none bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  )}
                </div>

                {/* DISC */}
                <div className="flex justify-center">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={it.discount !== undefined ? it.discount : '0.00'}
                    onChange={(e) =>
                      updateItem(it.localId, { discount: Math.max(0, parseFloat(e.target.value) || 0) })
                    }
                    className="w-14 py-1 px-1 rounded-md border border-slate-300 text-center text-xs font-semibold text-slate-800 outline-none bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                {/* PRICE */}
                <div className="text-right pr-2 font-bold text-slate-900 text-xs">
                  {taka(it.unit_price)}
                  {it.unit_name && (
                    <span className="text-[9px] text-slate-500 block font-normal">
                      /{it.unit_name}
                    </span>
                  )}
                </div>

                {/* TOTAL */}
                <div className="text-right pr-2 font-extrabold text-slate-900 text-xs">
                  {taka(lineTotal)}
                </div>

                {/* ACTIONS: Eye (Cost & Margin Info Toggle) and Delete */}
                <div
                  className={`cost-peek-container relative flex justify-center items-center gap-1.5 ${
                    activeCostCardId === it.localId ? 'z-[1001]' : 'z-[1]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleCostCard(it.localId)}
                    title={activeCostCardId === it.localId ? "Hide Cost & Margin Info" : "Show Cost & Margin Info"}
                    className={`border-0 rounded w-6 h-6 cursor-pointer flex items-center justify-center transition-colors ${
                      activeCostCardId === it.localId
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-transparent text-slate-400 hover:text-indigo-600'
                    }`}
                  >
                    {activeCostCardId === it.localId ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 opacity-60 hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    )}
                  </button>

                  {/* Cost & Margin Info Dropdown Popup */}
                  {activeCostCardId === it.localId && (
                    <div className="absolute top-[calc(100%+4px)] right-0 w-[235px] bg-white border border-slate-300 rounded-md shadow-2xl p-3 z-[999999] text-left font-sans">
                      {/* Title */}
                      <div className="font-bold text-slate-800 text-xs pb-2 border-b border-slate-200 mb-2">
                        Cost &amp; Margin Info
                      </div>

                      {/* Sell Price */}
                      <div className="flex justify-between items-center mb-1.5 text-xs">
                        <span className="text-slate-500">Sell Price:</span>
                        <strong className="text-slate-900">{taka(sellPrice)}</strong>
                      </div>

                      {/* Purchase Cost */}
                      <div className="flex justify-between items-center mb-2 text-xs">
                        <span className="text-slate-500">Purchase Cost:</span>
                        <strong className="text-slate-900">{taka(actualCost)}</strong>
                      </div>

                      {/* Divider */}
                      <div className="border-b border-slate-200 mb-2" />

                      {/* Margin */}
                      <div className="flex justify-between items-center mb-1.5 text-xs">
                        <strong className="text-slate-800">Margin:</strong>
                        <strong className="text-emerald-600">{taka(margin)}</strong>
                      </div>

                      {/* Margin % */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Margin %:</span>
                        <strong className="text-emerald-600">{marginPct}%</strong>
                      </div>

                      {it.is_warranty_required && Number(it.warranty_months || 0) > 0 && (
                        <>
                          <div className="border-b border-slate-200 my-2" />
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">Customer Warranty:</span>
                            <strong className="text-emerald-600">{it.warranty_months} Months</strong>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removeItem(it.localId)}
                    title="Remove item"
                    className="border-0 bg-transparent text-slate-400 hover:text-rose-500 cursor-pointer text-sm flex items-center justify-center transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          );
        })}
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
