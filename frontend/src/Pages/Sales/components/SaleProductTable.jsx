import React from 'react';
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
        <div className="grid grid-cols-[40px_minmax(200px,1fr)_68px_62px_72px_110px_110px_56px] items-center bg-slate-50 p-2 text-xs font-bold text-slate-500 border-b-2 border-slate-200 rounded-t-md">
          <div className="text-center">#</div>
          <div className="pl-1.5">PRODUCT</div>
          <div className="text-center" title="Customer Warranty (Months)">WAR (Cust)</div>
          <div className="text-center">QTY</div>
          <div className="text-center">DISC</div>
          <div className="text-right pr-3">PRICE</div>
          <div className="text-right pr-3">TOTAL</div>
          <div className="text-center"></div>
        </div>

        {/* Items Rows */}
        {items.map((it, idx) => {
          const isSerialMissing = it.is_serial_tracked && (!it.serials || it.serials.length === 0);
          const isWarrantyMissing = it.is_warranty_required && (it.warranty_months === '' || it.warranty_months === null || it.warranty_months === undefined || Number(it.warranty_months) <= 0);
          const qty = it.is_serial_tracked ? (it.serials || []).length : Number(it.quantity || 1);
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
                activeCostCardId === it.localId ? 'z-[1000]' : 'z-[1]'
              } ${idx === items.length - 1 && !isExpanded ? 'rounded-b-md' : ''}`}
            >
              <div className="grid grid-cols-[40px_minmax(200px,1fr)_68px_62px_72px_110px_110px_56px] items-center py-1.5 px-2">
                {/* # */}
                <div className="text-center text-xs text-slate-500 font-medium">
                  {idx + 1}
                </div>

                {/* PRODUCT NAME + SERIAL CHIPS */}
                <div className="pl-1.5">
                  <div className="font-bold text-slate-800 text-xs leading-snug flex items-center gap-1.5 flex-wrap">
                    <span>{it.full_name || it.name}</span>
                    {it.is_bundle && (
                      <span className="text-[0.66rem] font-extrabold py-px px-1.5 rounded text-purple-700 bg-purple-100 border border-purple-200">
                        🎁 Bundle Kit
                      </span>
                    )}
                    {it.is_serial_tracked && (
                      <span className={`text-[0.66rem] font-extrabold py-px px-1.5 rounded ${
                        isSerialMissing
                          ? 'text-rose-700 bg-rose-50 border border-rose-200'
                          : 'text-indigo-600 bg-indigo-50 border-0'
                      }`}>
                        {isSerialMissing ? '⚠️ Serial Required' : 'Serial Tracked'}
                      </span>
                    )}
                    {it.is_warranty_required && isWarrantyMissing && (
                      <span className="text-[0.66rem] text-rose-700 bg-rose-50 border border-rose-200 py-px px-1.5 rounded font-extrabold">
                        ⚠️ Warranty Required
                      </span>
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

                  {/* Barcode/Serial Chips */}
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    {it.serials &&
                      it.serials.map((s, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1 py-px px-1.5 bg-white border border-slate-300 rounded text-[0.7rem] font-mono text-slate-700"
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
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : it.localId)}
                      title={isSerialMissing ? 'Serial numbers are strictly required' : 'Scan or add barcode/serial'}
                      className={`rounded py-0.5 px-1.5 text-[0.7rem] font-bold cursor-pointer transition-colors ${
                        isSerialMissing
                          ? 'border-[1.5px] border-rose-500 bg-rose-50 text-rose-600 ring-2 ring-rose-200'
                          : isExpanded
                          ? 'border border-slate-300 bg-indigo-100 text-indigo-600'
                          : 'border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {isExpanded ? '✕ Close' : (isSerialMissing ? '⚠️ + Add Serial' : '+ Barcode')}
                    </button>
                  </div>
                </div>

                {/* WAR */}
                <div className="text-center">
                  <input
                    type="number"
                    min="0"
                    value={it.warranty_months !== undefined ? it.warranty_months : ''}
                    onChange={(e) => updateItem(it.localId, { warranty_months: e.target.value })}
                    title={isWarrantyMissing ? 'Warranty is required for this product' : 'Warranty duration in months'}
                    placeholder={it.is_warranty_required ? 'Req' : '0'}
                    className={`w-11 py-1 px-1 rounded-md text-center text-xs outline-none transition-colors ${
                      isWarrantyMissing
                        ? 'border-2 border-rose-500 bg-rose-50 text-rose-700 font-bold ring-2 ring-rose-200'
                        : 'border border-slate-300 bg-white text-slate-800 font-medium'
                    }`}
                  />
                </div>

                {/* QTY */}
                <div className="text-center">
                  {it.is_serial_tracked ? (
                    <input
                      type="number"
                      readOnly={true}
                      value={qty}
                      title="Quantity is auto-calculated from scanned serials count"
                      className={`w-12 py-1 px-1 rounded-md text-center text-xs font-bold cursor-not-allowed outline-none ${
                        isSerialMissing
                          ? 'border-2 border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-200'
                          : 'border border-slate-300 bg-slate-100 text-slate-600'
                      }`}
                    />
                  ) : (
                    <div className="inline-flex items-center gap-1 justify-center">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={it.quantity !== undefined ? it.quantity : 1}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          updateItem(it.localId, { quantity: isNaN(val) ? '' : val });
                        }}
                        className="w-14 py-1 px-1 rounded-md border border-slate-300 text-center text-xs font-semibold text-slate-800 outline-none bg-white focus:ring-1 focus:ring-sky-500"
                      />
                      {it.unit_name && (
                        <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap">
                          {it.unit_name}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* DISC */}
                <div className="text-center">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={it.discount !== undefined ? it.discount : '0.00'}
                    onChange={(e) =>
                      updateItem(it.localId, { discount: Math.max(0, parseFloat(e.target.value) || 0) })
                    }
                    className="w-14 py-1 px-1 rounded-md border border-slate-300 text-center text-xs font-medium text-slate-800 outline-none bg-white"
                  />
                </div>

                {/* PRICE */}
                <div className="text-right pr-3 font-bold text-slate-900 text-sm">
                  {taka(it.unit_price)}
                  {it.unit_name && (
                    <span className="text-[10px] text-slate-500 block font-normal">
                      /{it.unit_name}
                    </span>
                  )}
                </div>

                {/* TOTAL */}
                <div className="text-right pr-3 font-extrabold text-slate-900 text-sm">
                  {taka(lineTotal)}
                </div>

                {/* ACTIONS: Eye (Cost & Margin Info Toggle) and Delete */}
                <div
                  className={`cost-peek-container relative flex justify-center items-center gap-2 ${
                    activeCostCardId === it.localId ? 'z-[1001]' : 'z-[1]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleCostCard(it.localId)}
                    title="Cost & Margin Info"
                    className={`border-0 rounded w-6 h-6 cursor-pointer flex items-center justify-center text-sm transition-colors ${
                      activeCostCardId === it.localId ? 'bg-indigo-100 text-indigo-600' : 'bg-transparent text-slate-400 hover:text-indigo-600'
                    }`}
                  >
                    👁
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

              {/* Barcode Scanner Row for Serial-Tracked items or Expanded items */}
              {(it.isSerialRequired || it.is_serial_required || it.is_serial_tracked || isProductSerialTracked(it) || isExpanded) && (
                <div
                  className={`py-2 pr-4 pl-14 flex items-center gap-2.5 flex-wrap border-t border-dashed border-slate-200 ${
                    it.is_serial_tracked && (!it.serials || it.serials.length === 0) ? 'bg-rose-50' : 'bg-slate-50'
                  } ${it.is_serial_tracked ? 'border-l-[3px] border-l-indigo-500' : ''}`}
                >
                  <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                    <span>📷</span>
                    <span>Scan Serial / Barcode:</span>
                  </span>
                  <div className="flex gap-1.5 items-center flex-1 max-w-[380px]">
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => {
                        setBarcodeInput(e.target.value);
                        if (barcodeError[it.localId]) setBarcodeError((prev) => ({ ...prev, [it.localId]: '' }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddBarcode(it.localId, barcodeInput);
                        }
                      }}
                      placeholder="Scan barcode with scanner or press Enter..."
                      className={`flex-1 py-1.5 px-2.5 rounded-md text-xs outline-none bg-white ${
                        (barcodeError[it.localId] || (it.is_serial_tracked && (!it.serials || it.serials.length === 0)))
                          ? 'border-[1.5px] border-rose-500'
                          : 'border-[1.5px] border-indigo-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddBarcode(it.localId, barcodeInput)}
                      className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white border-0 rounded-md text-xs font-bold cursor-pointer whitespace-nowrap transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                  {it.is_serial_tracked && (!it.serials || it.serials.length === 0) && !barcodeError[it.localId] && (
                    <span className="text-rose-600 text-[0.74rem] font-bold">
                      ⚠️ Serial scan required (Quantity auto-locked to count)
                    </span>
                  )}
                  {barcodeError[it.localId] && (
                    <span className="text-rose-600 text-xs font-semibold">
                      ⚠️ {barcodeError[it.localId]}
                    </span>
                  )}
                </div>
              )}
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
