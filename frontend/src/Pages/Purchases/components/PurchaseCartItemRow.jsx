import React, { useState, useRef } from 'react';
import {
  taka,
  money,
  computeFinalSale,
  isProductSerialTracked,
} from '../hooks/usePurchaseCart';
import CartItemCameraScanner from './CartItemCameraScanner';
import CartItemSerialsList, { CartItemSerialChips } from './CartItemSerialsList';

const PurchaseCartItemRow = React.memo(function PurchaseCartItemRow({
  item,
  isExpanded,
  setExpandedId,
  barcodeScanErrors = {},
  updateItem,
  handleItemCostChange,
  handleItemMarginChange,
  handleAddBarcode,
  handleRemoveBarcode,
  handleRemoveItem,
  totalGoodsCost = 0,
  extraCostValue = 0,
}) {
  const [tempBarcode, setTempBarcode] = useState('');
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const inputRef = useRef(null);

  const cost = money(item.cost_price);
  const qty = Number(item.quantity || 1);
  const lineTotal = Number((cost * qty).toFixed(2));
  const safeTotalGoodsCost = money(totalGoodsCost);
  const safeExtraCost = money(extraCostValue);
  const overheadRatio = safeTotalGoodsCost > 0 && safeExtraCost > 0
    ? safeExtraCost / safeTotalGoodsCost
    : 0;
  const finalUnitCost = Number((cost * (1 + overheadRatio)).toFixed(2));
  const finalLineTotal = Number((finalUnitCost * qty).toFixed(2));
  const finalSale = computeFinalSale(item, finalUnitCost) || money(item.sale_price);
  const displayName =
    (item?.full_name && item.full_name !== 'Product' ? item.full_name : '') ||
    (item?.product_name && item.product_name !== 'Product' ? item.product_name : '') ||
    item?.product?.full_name ||
    item?.product?.name ||
    item?.Product?.name ||
    item?.Product?.full_name ||
    item?.item_name ||
    (item?.name && item.name !== 'Product' ? item.name : '') ||
    item?.catalog_name ||
    (item?.brand_name && item?.model_name ? `${item.brand_name} ${item.model_name}` : '') ||
    item?.brand_name ||
    item?.model_name ||
    (item?.sku ? `SKU: ${item.sku}` : 'Product');
  const barcodesList = Array.isArray(item.barcodes)
    ? item.barcodes
    : Array.isArray(item.serials)
    ? item.serials
    : [];

  const isSerialTracked = Boolean(
    barcodesList.length > 0 ||
    item.is_serial_tracked ||
    item.is_serial_required ||
    item.isSerialRequired ||
    item.has_serials ||
    isProductSerialTracked(item)
  );

  const soldQuantity = Number(
    item.soldQuantity || item.sold_quantity || item.sold_count || 0
  );
  const isSoldLocked = soldQuantity > 0;

  const onAdd = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const currentInputValue = tempBarcode.toUpperCase().trim();
    if (!currentInputValue) return;

    handleAddBarcode(item.localId, currentInputValue);
    setTempBarcode('');

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // EXPANDED ITEM VIEW
  if (isExpanded) {
    return (
      <div className="border-[1.5px] border-emerald-500 rounded-xl bg-white p-3.5 shadow-sm">
        {/* Line 1: Full Catalog Name at Top */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-emerald-500 text-lg leading-none shrink-0">⬡</span>
            <span className="font-extrabold text-sm text-slate-900 truncate">
              {displayName}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setExpandedId(null)}
              className="bg-transparent border-0 text-sky-600 font-bold text-xs cursor-pointer p-0 hover:text-sky-700"
            >
              ▲ Collapse
            </button>
            <button
              type="button"
              disabled={isSoldLocked}
              onClick={() => {
                if (!isSoldLocked) handleRemoveItem(item.localId);
              }}
              className={`border-0 text-sm p-0 transition-colors ${
                isSoldLocked
                  ? 'bg-transparent text-slate-300 cursor-not-allowed'
                  : 'bg-transparent text-rose-500 hover:text-rose-700 cursor-pointer'
              }`}
              title={
                isSoldLocked
                  ? `Cannot remove: ${soldQuantity} unit(s) already sold`
                  : 'Remove product'
              }
            >
              {isSoldLocked ? '🔒' : '✕'}
            </button>
          </div>
        </div>

        {/* Line 2: Summary Details Badge Bar (Uncollapsed) */}
        <div className="flex items-center gap-1.5 flex-wrap py-1.5 px-2.5 bg-slate-50 rounded-lg border border-slate-200 mb-2.5 text-xs">
          <span className="bg-slate-200 text-slate-700 py-0.5 px-2 rounded-full font-semibold">
            📦 {qty} units / {isSerialTracked ? `${barcodesList.length} serials` : 'No Serial'}
          </span>
          <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 py-0.5 px-2 rounded-full font-bold">
            Unit Cost: {taka(cost)}
          </span>
          {overheadRatio > 0 && (
            <span
              className="bg-indigo-50 border border-indigo-200 text-indigo-800 py-0.5 px-2 rounded-full font-bold"
              title={`Landed / Final Cost: ${taka(finalUnitCost)} per unit (includes +${(overheadRatio * 100).toFixed(2)}% recurring logistics/extra cost)`}
            >
              Final Cost: {taka(finalUnitCost)}
              <span className="text-[10px] ml-1 text-indigo-600 font-black">
                (+{(overheadRatio * 100).toFixed(2)}%)
              </span>
            </span>
          )}
          <span className="bg-amber-50 border border-amber-200 text-amber-800 py-0.5 px-2 rounded-full font-bold">
            Sale Margin: {item.margin_value || 15}
            {item.margin_type === 'percent' ? '%' : '৳'}
          </span>
          <span className="bg-sky-50 border border-sky-200 text-sky-700 py-0.5 px-2 rounded-full font-bold">
            Total Cost: {taka(overheadRatio > 0 ? finalLineTotal : lineTotal)}
          </span>
          <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 py-0.5 px-2 rounded-full font-bold">
            Total Sale: {taka(Number((finalSale * qty).toFixed(2)))}
          </span>
        </div>

        {/* Editable Form Controls - Stacked Grid: Quantity, Cost Price, Final Cost (Auto), Sales Margin (%), Final Sale (Unit) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-2.5 items-center">
          {/* Quantity */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Quantity *
            </label>
            <input
              type="number"
              min={isSoldLocked ? soldQuantity : 1}
              readOnly={isSerialTracked}
              value={isSerialTracked ? barcodesList.length : item.quantity}
              onChange={(e) => {
                if (isSerialTracked) return;
                const minVal = isSoldLocked ? soldQuantity : 1;
                updateItem(item.localId, {
                  quantity: Math.max(minVal, Number(e.target.value || minVal)),
                });
              }}
              className={`w-full min-w-[90px] py-1 px-2 rounded-md text-xs text-center box-border ${
                isSerialTracked && barcodesList.length === 0
                  ? 'border-2 border-rose-500'
                  : 'border border-slate-300'
              } ${
                isSerialTracked
                  ? 'bg-slate-50 text-slate-900 font-bold cursor-not-allowed'
                  : 'bg-white text-slate-900 font-bold cursor-text'
              }`}
              title={
                isSerialTracked
                  ? 'Quantity is automatically calculated from scanned serials and cannot be manually modified'
                  : isSoldLocked
                  ? `Quantity locked to minimum ${soldQuantity} sold unit(s)`
                  : 'Enter quantity manually'
              }
            />
          </div>

          {/* Cost Price */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-sky-600 whitespace-nowrap">
              Cost Price ৳ *
            </label>
            <input
              type="number"
              step="any"
              value={item.cost_price}
              onChange={(e) => handleItemCostChange(item, e.target.value)}
              placeholder="0.00"
              className="w-full min-w-[90px] py-1 px-2 rounded-md border border-sky-400 text-xs box-border font-semibold focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Final Cost (Auto-adjusted Landed Cost) */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-700 whitespace-nowrap">
                Final Cost ৳
              </label>
              {overheadRatio > 0 && (
                <span
                  className="text-[10px] font-black text-indigo-700 bg-indigo-100/90 px-1 py-0.5 rounded border border-indigo-200 leading-none"
                  title={`+${(overheadRatio * 100).toFixed(2)}% logistics overhead added from total extra cost`}
                >
                  +{(overheadRatio * 100).toFixed(2)}%
                </span>
              )}
            </div>
            <input
              type="text"
              readOnly
              value={finalUnitCost > 0 ? taka(finalUnitCost) : '৳ 0.00'}
              className="w-full min-w-[90px] py-1 px-2 rounded-md border border-indigo-300 bg-indigo-50/70 text-indigo-950 text-xs font-black text-center box-border cursor-default focus:outline-none"
              title={
                overheadRatio > 0
                  ? `Final Landed Cost: Base ${taka(cost)} + ${taka(finalUnitCost - cost)} transport/logistics per unit`
                  : 'Final unit cost is automatically calculated from Cost Price + pro-rata logistics/extra cost.'
              }
            />
          </div>

          {/* Sales Margin (%) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Margin ({item.margin_type === 'percent' ? '%' : '৳'})
            </label>
            <div className="w-full min-w-0 flex gap-1 items-center">
              <input
                type="number"
                step="any"
                value={item.margin_value}
                onChange={(e) => handleItemMarginChange(item, e.target.value)}
                placeholder="15"
                className="w-full min-w-[90px] py-1 px-2 rounded-md border border-slate-300 text-xs text-center font-bold box-border focus:outline-none focus:border-emerald-500"
              />
              <div className="flex rounded-md overflow-hidden border border-slate-300 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    updateItem(item.localId, { margin_type: 'percent' });
                  }}
                  className={`px-1.5 py-1 border-0 cursor-pointer text-[11px] font-bold ${
                    item.margin_type === 'percent'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                  title="Percentage Margin (Default)"
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateItem(item.localId, { margin_type: 'amount' });
                  }}
                  className={`px-1.5 py-1 border-0 cursor-pointer text-[11px] font-bold ${
                    item.margin_type === 'amount'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                  title="Fixed Taka Margin"
                >
                  ৳
                </button>
              </div>
            </div>
          </div>

          {/* Final Sale (Unit) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-emerald-600 whitespace-nowrap">
              Final Sale ৳
            </label>
            <input
              type="text"
              readOnly
              value={finalSale > 0 ? taka(finalSale) : '৳ 0.00'}
              className="w-full min-w-[90px] py-1 px-2 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-700 text-xs font-extrabold text-center box-border cursor-default"
              title="Final sale price is calculated from Landed Cost + Margin and cannot be manually modified."
            />
          </div>
        </div>

        {/* Editable Form Controls - Row 2: Expected Date, Customer Warranty, Supplier Warranty, Barcode Scan Input */}
        <div className="grid grid-cols-[140px_110px_110px_1fr] gap-2 items-end">
          {/* Expected Inward Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5 truncate">
              Expected Date *
            </label>
            <input
              type="date"
              value={item.expected_date}
              onChange={(e) =>
                updateItem(item.localId, { expected_date: e.target.value })
              }
              className="w-full py-1 px-2 rounded-md border border-slate-300 text-xs box-border focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Customer Warranty (Months) */}
          <div>
            <div className="flex justify-between items-center mb-0.5">
              <label className="text-[11px] font-bold text-emerald-700 truncate">
                Cust. Warranty (M) *
              </label>
              <span className="text-[0.6rem] text-emerald-500 font-semibold">
                (Inv)
              </span>
            </div>
            <div className="flex items-center border border-emerald-200 rounded-md overflow-hidden bg-white focus-within:border-emerald-500 transition-colors">
              <input
                type="number"
                min="0"
                required
                value={
                  item.warranty_months !== undefined &&
                  item.warranty_months !== null
                    ? item.warranty_months
                    : ''
                }
                onChange={(e) => {
                  const val =
                    e.target.value === ''
                      ? 0
                      : Math.max(0, parseInt(e.target.value, 10) || 0);
                  updateItem(item.localId, {
                    warranty_months: val,
                    customer_warranty_months: val,
                  });
                }}
                placeholder="12"
                className="w-full min-w-0 py-1 px-1 border-0 outline-none text-xs text-center font-bold text-emerald-800 bg-transparent box-border"
              />
              <div className="flex items-center border-l border-emerald-200 divide-x divide-emerald-200 shrink-0 bg-emerald-50">
                <button
                  type="button"
                  onClick={() => {
                    const cur =
                      parseInt(
                        item.warranty_months !== undefined
                          ? item.warranty_months
                          : 0,
                        10
                      ) || 0;
                    const next = Math.max(0, cur - 1);
                    updateItem(item.localId, {
                      warranty_months: next,
                      customer_warranty_months: next,
                    });
                  }}
                  className="py-1 px-1 border-0 bg-transparent cursor-pointer text-[10px] font-bold text-emerald-600 hover:bg-emerald-100 transition-colors leading-none"
                  title="Decrease customer warranty months"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cur =
                      parseInt(
                        item.warranty_months !== undefined
                          ? item.warranty_months
                          : 0,
                        10
                      ) || 0;
                    const next = cur + 1;
                    updateItem(item.localId, {
                      warranty_months: next,
                      customer_warranty_months: next,
                    });
                  }}
                  className="py-1 px-1 border-0 bg-transparent cursor-pointer text-[10px] font-bold text-emerald-600 hover:bg-emerald-100 transition-colors leading-none"
                  title="Increase customer warranty months"
                >
                  ▲
                </button>
              </div>
            </div>
          </div>

          {/* Supplier Warranty (Months) */}
          <div>
            <div className="flex justify-between items-center mb-0.5">
              <label className="text-[11px] font-bold text-indigo-700 truncate">
                Supp. Warranty (M) *
              </label>
              <span className="text-[0.6rem] text-indigo-500 font-semibold">
                (Ven)
              </span>
            </div>
            <div className="flex items-center border border-indigo-200 rounded-md overflow-hidden bg-white focus-within:border-indigo-500 transition-colors">
              <input
                type="number"
                min="0"
                required
                value={
                  item.supplier_warranty_months !== undefined &&
                  item.supplier_warranty_months !== null
                    ? item.supplier_warranty_months
                    : item.warranty_months || ''
                }
                onChange={(e) =>
                  updateItem(item.localId, {
                    supplier_warranty_months:
                      e.target.value === ''
                        ? 0
                        : Math.max(0, parseInt(e.target.value, 10) || 0),
                  })
                }
                placeholder="14"
                className="w-full min-w-0 py-1 px-1 border-0 outline-none text-xs text-center font-bold text-indigo-800 bg-transparent box-border"
              />
              <div className="flex items-center border-l border-indigo-200 divide-x divide-indigo-200 shrink-0 bg-indigo-50">
                <button
                  type="button"
                  onClick={() => {
                    const cur =
                      parseInt(
                        item.supplier_warranty_months !== undefined
                          ? item.supplier_warranty_months
                          : item.warranty_months || 0,
                        10
                      ) || 0;
                    updateItem(item.localId, {
                      supplier_warranty_months: Math.max(0, cur - 1),
                    });
                  }}
                  className="py-1 px-1 border-0 bg-transparent cursor-pointer text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition-colors leading-none"
                  title="Decrease supplier warranty months"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cur =
                      parseInt(
                        item.supplier_warranty_months !== undefined
                          ? item.supplier_warranty_months
                          : item.warranty_months || 0,
                        10
                      ) || 0;
                    updateItem(item.localId, {
                      supplier_warranty_months: cur + 1,
                    });
                  }}
                  className="py-1 px-1 border-0 bg-transparent cursor-pointer text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition-colors leading-none"
                  title="Increase supplier warranty months"
                >
                  ▲
                </button>
              </div>
            </div>
          </div>

          {/* Barcode / Serial Scanning */}
          <CartItemSerialsList
            item={item}
            tempBarcode={tempBarcode}
            setTempBarcode={setTempBarcode}
            inputRef={inputRef}
            onAdd={onAdd}
            setIsCameraScannerOpen={setIsCameraScannerOpen}
            barcodesList={barcodesList}
            barcodeScanErrors={barcodeScanErrors}
            handleRemoveBarcode={handleRemoveBarcode}
            isSerialTracked={isSerialTracked}
            renderChips={false}
          />
        </div>

        {/* Camera Barcode Scanner Modal */}
        <CartItemCameraScanner
          isOpen={isCameraScannerOpen}
          onClose={() => setIsCameraScannerOpen(false)}
          displayName={displayName}
        />

        {/* Serial Chips */}
        <CartItemSerialChips
          item={item}
          barcodesList={barcodesList}
          handleRemoveBarcode={handleRemoveBarcode}
        />
      </div>
    );
  }

  // COLLAPSED ITEM VIEW
  return (
    <div className="border border-slate-200 rounded-xl bg-white py-1.5 px-3 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2 flex-1 min-w-[320px]">
        <span className="text-emerald-500 text-lg">⬡</span>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="font-extrabold text-sm text-slate-900">
              {displayName}
            </span>
            <span className="bg-slate-200 text-slate-700 py-0.5 px-1.5 rounded font-semibold">
              📦 {qty} units / {isSerialTracked ? `${barcodesList.length} serials` : 'No Serial'}
            </span>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 py-0.5 px-1.5 rounded font-bold">
              Unit Cost: {taka(cost)}
            </span>
            {overheadRatio > 0 && (
              <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 py-0.5 px-1.5 rounded font-bold" title="Landed / Final Cost including logistics">
                Final Cost: {taka(finalUnitCost)}
              </span>
            )}
            <span className="bg-amber-50 text-amber-800 border border-amber-200 py-0.5 px-1.5 rounded font-bold">
              Sale Margin: {item.margin_value || 15}
              {item.margin_type === 'percent' ? '%' : '৳'}
            </span>
            <span className="bg-sky-50 text-sky-700 border border-sky-200 py-0.5 px-1.5 rounded font-bold">
              Total Cost: {taka(overheadRatio > 0 ? finalLineTotal : lineTotal)}
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 py-0.5 px-1.5 rounded font-bold">
              Total Sale: {taka(Number((finalSale * qty).toFixed(2)))}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpandedId(item.localId)}
          className="py-1 px-2.5 rounded-md border border-slate-300 bg-slate-50 text-slate-900 font-semibold text-xs cursor-pointer hover:bg-slate-100 transition-colors"
        >
          ✏️ Edit
        </button>
        <button
          type="button"
          disabled={isSoldLocked}
          onClick={() => {
            if (!isSoldLocked) handleRemoveItem(item.localId);
          }}
          className={`border-0 text-base p-0.5 transition-colors ${
            isSoldLocked
              ? 'bg-transparent text-slate-300 cursor-not-allowed'
              : 'bg-transparent text-rose-500 hover:text-rose-700 cursor-pointer'
          }`}
          title={
            isSoldLocked
              ? `Cannot remove: ${soldQuantity} unit(s) already sold`
              : 'Remove product'
          }
        >
          {isSoldLocked ? '🔒' : '✕'}
        </button>
      </div>
    </div>
  );
});

export default PurchaseCartItemRow;
