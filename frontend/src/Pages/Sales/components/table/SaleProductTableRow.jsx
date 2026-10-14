import React from 'react';
import { isProductSerialTracked } from '../../../../utils/productUtils';
import { taka } from '../../hooks/useNewSale';
import SaleProductCostPeekCard from './SaleProductCostPeekCard';
import SaleProductSerialPicker from './SaleProductSerialPicker';

/**
 * Individual product table row in POS sale table.
 */
export default function SaleProductTableRow({
  it,
  idx,
  itemsLength,
  expandedId,
  activeCostCardId,
  openPickerId,
  setOpenPickerId,
  toggleCostCard,
  updateItem,
  switchItemUnit,
  removeItem,
  handleAddBarcode,
  handleRemoveBarcode,
}) {
  const isTracked = isProductSerialTracked(it);
  const isSerialMissing = isTracked && (!it.serials || it.serials.length === 0);
  const isWarrantyMissing =
    it.is_warranty_required &&
    (it.warranty_months === '' ||
      it.warranty_months === null ||
      it.warranty_months === undefined ||
      Number(it.warranty_months) <= 0);

  const qty = isTracked ? (it.serials || []).length : Number(it.quantity || 1);
  const lineDiscount = Number(it.discount || 0);
  const lineTotal = qty * Number(it.unit_price || 0) - lineDiscount;
  const isExpanded = expandedId === it.localId;
  const sellPrice = Number(it.unit_price || 0);
  const purchaseCost = Number(it.cost_price || 0);
  const actualCost = purchaseCost > 0 ? purchaseCost : sellPrice > 0 ? Math.round(sellPrice * 0.90857) : 0;
  const margin = sellPrice - actualCost;
  const marginPct = sellPrice > 0 ? ((margin / sellPrice) * 100).toFixed(1) : '0.0';

  return (
    <div
      key={it.localId}
      className={`transition-colors relative ${
        idx === itemsLength - 1 ? 'border-b-0' : 'border-b border-slate-100'
      } ${isExpanded ? 'bg-purple-50/50' : 'bg-white'} ${
        activeCostCardId === it.localId || openPickerId === it.localId ? 'z-[1000]' : 'z-[1]'
      } ${idx === itemsLength - 1 && !isExpanded ? 'rounded-b-md' : ''}`}
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
              Stock: {it.sub_unit_name && Number(it.conversion_rate || 1) > 1
                ? it.unit_type === 'sub_unit'
                  ? `${it.stock || 0} ${it.sub_unit_name}`
                  : `${(Number(it.stock || 0) / Number(it.conversion_rate)).toFixed(2)} ${it.base_unit_name || 'Roll'}`
                : `${it.stock || 0} ${it.unit_name || ''}`.trim()}
            </span>
            {it.is_bundle && (
              <span className="text-[0.66rem] font-extrabold py-px px-1.5 rounded text-purple-700 bg-purple-100 border border-purple-200 shrink-0">
                🎁 Bundle Kit
              </span>
            )}
            {isTracked && (
              <span
                className={`text-[0.66rem] font-extrabold py-px px-1.5 rounded shrink-0 ${
                  isSerialMissing
                    ? 'text-rose-700 bg-rose-50 border border-rose-200'
                    : 'text-indigo-600 bg-indigo-50 border-0'
                }`}
              >
                {isSerialMissing ? '⚠️ Serial Required' : 'Serial Tracked'}
              </span>
            )}
            {it.is_warranty_required && isWarrantyMissing && (
              <span className="text-[0.66rem] text-rose-700 bg-rose-50 border border-rose-200 py-px px-1.5 rounded font-extrabold shrink-0">
                ⚠️ Warranty Required
              </span>
            )}

            {/* Serial Picker Icon */}
            {isTracked && (
              <SaleProductSerialPicker
                item={it}
                openPickerId={openPickerId}
                setOpenPickerId={setOpenPickerId}
                isSerialMissing={isSerialMissing}
                handleAddBarcode={handleAddBarcode}
              />
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

        {/* 3. WAR */}
        <div className="flex justify-center items-center px-1">
          <input
            type="number"
            min="0"
            value={it.warranty_months !== undefined ? it.warranty_months : ''}
            onChange={(e) => updateItem(it.localId, { warranty_months: e.target.value })}
            title={isWarrantyMissing ? 'Warranty is required for this product' : 'Warranty duration in months'}
            placeholder={it.is_warranty_required ? 'Req' : '0'}
            className={`w-full py-1 px-1 rounded-md text-center text-xs outline-none transition-colors ${
              isWarrantyMissing
                ? 'border-2 border-rose-500 bg-rose-50 text-rose-700 font-bold ring-2 ring-rose-200'
                : 'border border-slate-300 bg-white text-slate-800 font-medium focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
            }`}
          />
        </div>

        {/* 4. QTY */}
        <div className="flex justify-center items-center px-1">
          {isTracked ? (
            <div className="flex items-center gap-1 justify-center w-full" title="Quantity is auto-locked to scanned serials count">
              <input
                type="number"
                disabled={true}
                readOnly={true}
                value={qty}
                className={`w-full py-1 px-1 rounded-md text-center text-xs font-bold cursor-not-allowed outline-none ${
                  isSerialMissing
                    ? 'border-2 border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-200'
                    : 'border border-slate-300 bg-slate-100 text-slate-600'
                }`}
              />
              <span className="text-[11px] select-none shrink-0" title="Auto-locked by serial scans">🔒</span>
            </div>
          ) : (
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
              className="w-full py-1 px-1 rounded-md border border-slate-300 text-center text-xs font-bold text-slate-800 outline-none bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          )}
        </div>

        {/* 5. DISC */}
        <div className="flex justify-center items-center px-1">
          <input
            type="number"
            min="0"
            step="any"
            value={it.discount !== undefined ? it.discount : '0.00'}
            onChange={(e) =>
              updateItem(it.localId, { discount: Math.max(0, parseFloat(e.target.value) || 0) })
            }
            className="w-full py-1 px-1 rounded-md border border-slate-300 text-center text-xs font-semibold text-slate-800 outline-none bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* 6. PRICE */}
        <div className="text-right pr-2 font-bold text-slate-900 text-xs">
          {taka(it.unit_price)}
          {it.unit_name && (
            <span className="text-[9px] text-slate-500 block font-normal">
              /{it.unit_name}
            </span>
          )}
        </div>

        {/* 7. TOTAL */}
        <div className="text-right pr-2 font-extrabold text-slate-900 text-xs">
          {taka(lineTotal)}
        </div>

        {/* 8. Cost & Margin Toggle + Delete */}
        <div className="flex justify-center items-center gap-1.5">
          <SaleProductCostPeekCard
            item={it}
            activeCostCardId={activeCostCardId}
            toggleCostCard={toggleCostCard}
            sellPrice={sellPrice}
            actualCost={actualCost}
            margin={margin}
            marginPct={marginPct}
          />

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
}
