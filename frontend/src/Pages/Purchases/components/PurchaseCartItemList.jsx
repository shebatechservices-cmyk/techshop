import React from 'react';
import {
  taka,
  money,
  computeFinalSale,
  isProductSerialTracked,
} from '../hooks/usePurchaseCart';

export default function PurchaseCartItemList({
  items = [],
  expandedId,
  setExpandedId,
  barcodeInput,
  setBarcodeInput,
  barcodeInputRef,
  barcodeScanErrors = {},
  updateItem,
  handleItemCostChange,
  handleItemMarginChange,
  handleAddBarcode,
  handleRemoveBarcode,
  handleRemoveItem,
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 && (
        <div className="p-7 text-center border-[1.5px] border-dashed border-slate-300 rounded-xl text-slate-500 text-sm">
          🛒 No products added yet. Search and add products above or click{' '}
          <strong>+</strong> to add a new catalog item.
        </div>
      )}

      {items.map((item) => {
        const isExpanded = expandedId === item.localId;
        const cost = money(item.cost_price);
        const qty = Number(item.quantity || 1);
        const lineTotal = Number((cost * qty).toFixed(2));
        const finalSale = computeFinalSale(item) || money(item.sale_price);
        const displayName = item.full_name || item.name;

        // EXPANDED ITEM VIEW
        if (isExpanded) {
          return (
            <div
              key={item.localId}
              className="border-[1.5px] border-emerald-500 rounded-xl bg-white p-4 shadow-sm"
            >
              {/* Line 1: Full Catalog Name at Top */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 text-xl leading-none">⬡</span>
                  <span className="font-extrabold text-[0.98rem] text-slate-900">
                    {displayName}
                  </span>
                </div>

                <div className="flex items-center gap-3.5">
                  <button
                    type="button"
                    onClick={() => setExpandedId(null)}
                    className="bg-transparent border-0 text-sky-600 font-bold text-sm cursor-pointer p-0 hover:text-sky-700"
                  >
                    ▲ Collapse
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.localId)}
                    className="bg-transparent border-0 text-rose-500 text-base cursor-pointer p-0 hover:text-rose-700"
                    title="Remove product"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Line 2: Summary Details Badge Bar */}
              <div className="flex items-center gap-2 flex-wrap py-2 px-3 bg-slate-50 rounded-lg border border-slate-200 mb-3.5 text-xs">
                <span className="bg-slate-200 text-slate-700 py-0.5 px-2 rounded-full font-semibold">
                  📦 {qty} units
                </span>
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 py-0.5 px-2 rounded-full font-bold">
                  Unit Cost: {taka(cost)}
                </span>
                <span className="bg-sky-50 border border-sky-200 text-sky-700 py-0.5 px-2 rounded-full font-bold">
                  Total Cost: {taka(lineTotal)}
                </span>
                <span className="bg-amber-50 border border-amber-200 text-amber-800 py-0.5 px-2 rounded-full font-bold">
                  Margin: {item.margin_value || 15}
                  {item.margin_type === 'percent' ? '%' : '৳'}
                </span>
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 py-0.5 px-2 rounded-full font-bold">
                  Final Sale: {taka(finalSale)}
                </span>
                {item.previous_margin && (
                  <span className="bg-slate-100 border border-slate-300 text-slate-600 py-0.5 px-2 rounded-full font-semibold">
                    🏷️ Prev Margin: {item.previous_margin}%{' '}
                    {item.previous_cost ? `· ৳${item.previous_cost}` : ''}
                  </span>
                )}
                {item.serials && item.serials.length > 0 && (
                  <span className="bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-800 py-0.5 px-2 rounded-full font-semibold">
                    📷 {item.serials.length} serials
                  </span>
                )}
              </div>

              {/* Editable Form Controls - Row 1: Quantity, Cost Price, Margin, Final Sale */}
              <div className="grid grid-cols-[80px_130px_160px_130px] gap-3 mb-3 items-end">
                {/* Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 truncate">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    readOnly={Boolean(item.is_serial_tracked)}
                    value={
                      item.is_serial_tracked
                        ? item.serials
                          ? item.serials.length
                          : 0
                        : item.quantity
                    }
                    onChange={(e) => {
                      if (item.is_serial_tracked) return;
                      updateItem(item.localId, {
                        quantity: Math.max(1, Number(e.target.value || 1)),
                      });
                    }}
                    className={`w-full py-1.5 px-2 rounded-md text-sm text-center box-border ${
                      item.is_serial_tracked &&
                      (!item.serials || item.serials.length === 0)
                        ? 'border-2 border-rose-500'
                        : 'border border-slate-300'
                    } ${
                      item.is_serial_tracked
                        ? 'bg-slate-50 text-slate-900 font-bold cursor-not-allowed'
                        : 'bg-white text-slate-900 font-bold cursor-text'
                    }`}
                    title={
                      item.is_serial_tracked
                        ? 'Quantity is automatically calculated from scanned barcodes and cannot be manually modified'
                        : 'Enter quantity manually'
                    }
                  />
                </div>

                {/* Cost Price */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-sky-600 truncate">
                      Cost Price ৳ *
                    </label>
                    {item.previous_cost && (
                      <span className="text-[0.66rem] text-slate-400">
                        (Last: ৳{item.previous_cost})
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={item.cost_price}
                    onChange={(e) => handleItemCostChange(item, e.target.value)}
                    placeholder="0.00"
                    className="w-full py-1.5 px-2.5 rounded-md border-[1.5px] border-sky-400 text-sm box-border font-semibold focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Sales Margin (%) Default */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 truncate">
                    Sales Margin ({item.margin_type === 'percent' ? '%' : '৳'})
                  </label>
                  <div className="flex gap-1 items-center">
                    <input
                      type="number"
                      step="any"
                      value={item.margin_value}
                      onChange={(e) => handleItemMarginChange(item, e.target.value)}
                      placeholder="15"
                      className="w-[95px] py-1.5 px-2 rounded-md border border-slate-300 text-sm text-center font-bold box-border focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex rounded-md overflow-hidden border border-slate-300 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          updateItem(item.localId, { margin_type: 'percent' });
                        }}
                        className={`px-2 py-1.5 border-0 cursor-pointer text-xs font-bold ${
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
                        className={`px-2 py-1.5 border-0 cursor-pointer text-xs font-bold ${
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

                {/* Final Sale Price */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-emerald-600 truncate">
                      Final Sale ৳
                    </label>
                    <span className="text-[0.66rem] text-emerald-600 font-semibold">
                      (Calc)
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={finalSale > 0 ? taka(finalSale) : '৳ 0.00'}
                    className="w-full py-1.5 px-2 rounded-md border-[1.5px] border-emerald-300 bg-emerald-50 text-emerald-700 text-sm font-extrabold text-center box-border cursor-default"
                    title="Final sale price is strictly calculated from Cost Price + Margin and cannot be manually modified."
                  />
                </div>
              </div>

              {/* Editable Form Controls - Row 2: Expected Date, Customer Warranty, Supplier Warranty, Barcode Scan Input */}
              <div className="grid grid-cols-[140px_100px_100px_260px] gap-3 items-end justify-start">
                {/* Expected Inward Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 truncate">
                    Expected Inward Date *
                  </label>
                  <input
                    type="date"
                    value={item.expected_date}
                    onChange={(e) =>
                      updateItem(item.localId, { expected_date: e.target.value })
                    }
                    className="w-full py-1.5 px-2 rounded-md border border-slate-300 text-xs box-border focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Customer Warranty (Months) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-emerald-700 truncate">
                      Cust. Warranty (M) *
                    </label>
                    <span className="text-[0.64rem] text-emerald-500 font-semibold">
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
                      className="w-full min-w-0 py-1.5 px-1 border-0 outline-none text-xs text-center font-bold text-emerald-800 bg-transparent box-border"
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
                        className="py-1.5 px-1.5 border-0 bg-transparent cursor-pointer text-[10px] font-bold text-emerald-600 hover:bg-emerald-100 transition-colors leading-none"
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
                        className="py-1.5 px-1.5 border-0 bg-transparent cursor-pointer text-[10px] font-bold text-emerald-600 hover:bg-emerald-100 transition-colors leading-none"
                        title="Increase customer warranty months"
                      >
                        ▲
                      </button>
                    </div>
                  </div>
                </div>

                {/* Supplier Warranty (Months) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-indigo-700 truncate">
                      Supp. Warranty (M) *
                    </label>
                    <span className="text-[0.64rem] text-indigo-500 font-semibold">
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
                      className="w-full min-w-0 py-1.5 px-1 border-0 outline-none text-xs text-center font-bold text-indigo-800 bg-transparent box-border"
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
                        className="py-1.5 px-1.5 border-0 bg-transparent cursor-pointer text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition-colors leading-none"
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
                        className="py-1.5 px-1.5 border-0 bg-transparent cursor-pointer text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition-colors leading-none"
                        title="Increase supplier warranty months"
                      >
                        ▲
                      </button>
                    </div>
                  </div>
                </div>

                {/* Barcode / Serial Scanning */}
                <div className="min-w-0">
                  {!(
                    item.isSerialRequired ||
                    item.is_serial_required ||
                    item.is_serial_tracked ||
                    isProductSerialTracked(item)
                  ) ? (
                    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg py-1.5 px-2.5 flex items-center h-[34px] box-border">
                      <span className="text-xs text-slate-500 font-semibold truncate">
                        📦 Non-serialized product (Standard Quantity)
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-1 gap-1 min-w-0">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-900 whitespace-nowrap overflow-hidden">
                          <span className="truncate">📷 Scan Barcode</span>
                          <span className="text-[0.65rem] text-rose-700 bg-rose-100 py-0.25 px-1.5 rounded font-extrabold whitespace-nowrap">
                            Serial Required
                          </span>
                          <span
                            className={`text-[0.65rem] font-bold whitespace-nowrap ${
                              (item.serials || []).length > 0
                                ? 'text-emerald-500'
                                : 'text-rose-500'
                            }`}
                          >
                            ({(item.serials || []).length} scanned)
                          </span>
                        </label>
                        {item.serials && item.serials.length > 0 && (
                          <span
                            className="text-[0.65rem] text-sky-700 font-semibold bg-sky-100 py-0.25 px-1.5 rounded whitespace-nowrap"
                            title="All subsequent barcodes must match this length"
                          >
                            Ref: {item.serials[0].length} chars
                          </span>
                        )}
                      </div>
                      <div
                        className={`flex items-center gap-1.5 rounded-lg py-0.5 pr-1 pl-2 ${
                          barcodeScanErrors[item.localId] ||
                          !item.serials ||
                          item.serials.length === 0
                            ? 'border-2 border-rose-500 bg-rose-50'
                            : 'border-[1.5px] border-emerald-500 bg-white'
                        }`}
                      >
                        <span
                          className={`text-xs ${
                            barcodeScanErrors[item.localId] ||
                            !item.serials ||
                            item.serials.length === 0
                              ? 'text-rose-500'
                              : 'text-emerald-500'
                          }`}
                        >
                          [ ]
                        </span>
                        <input
                          ref={barcodeInputRef}
                          type="text"
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddBarcode(item.localId);
                            }
                          }}
                          placeholder={
                            item.serials && item.serials.length > 0
                              ? `Scan ${item.serials[0].length}-digit barcode...`
                              : '|এখানে ক্লিক করে স্ক্যান / এন্টার দিন...'
                          }
                          className="flex-1 min-w-0 border-0 outline-none text-xs py-1.5 px-1 bg-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddBarcode(item.localId)}
                          title="Add Serial / Barcode"
                          className="w-7 h-7 bg-emerald-500 text-white border-0 rounded font-bold text-base cursor-pointer flex items-center justify-center leading-none hover:bg-emerald-600 transition-colors shrink-0"
                        >
                          +
                        </button>
                      </div>
                      {barcodeScanErrors[item.localId] && (
                        <div className="text-xs text-rose-600 mt-1 font-semibold truncate">
                          {barcodeScanErrors[item.localId]}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Serial Chips */}
              {item.serials && item.serials.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {item.serials.map((sn) => (
                    <span
                      key={sn}
                      className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full py-0.5 px-2.5 text-xs font-semibold text-emerald-800"
                    >
                      <span>{sn}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBarcode(item.localId, sn)}
                        className="bg-transparent border-0 text-rose-600 cursor-pointer text-xs p-0 hover:text-rose-800"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // COLLAPSED ITEM VIEW
        return (
          <div
            key={item.localId}
            className="border border-slate-200 rounded-xl bg-white py-2 px-3 flex items-center justify-between flex-wrap gap-2.5"
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-[320px]">
              <span className="text-emerald-500 text-xl">⬡</span>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-extrabold text-sm text-slate-900">
                    {displayName}
                  </span>
                  <span className="bg-slate-200 text-slate-700 py-0.5 px-1.5 rounded text-xs font-semibold">
                    📦 {qty} units
                  </span>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 py-0.5 px-1.5 rounded text-xs font-bold">
                    Unit Cost: {taka(cost)}
                  </span>
                  <span className="bg-sky-50 text-sky-700 border border-sky-200 py-0.5 px-1.5 rounded text-xs font-bold">
                    Total Cost: {taka(lineTotal)}
                  </span>
                  <span className="bg-amber-50 text-amber-800 border border-amber-200 py-0.5 px-1.5 rounded text-xs font-bold">
                    Margin: {item.margin_value || 15}
                    {item.margin_type === 'percent' ? '%' : '৳'}
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 py-0.5 px-1.5 rounded text-xs font-bold">
                    Sale: {taka(finalSale)}
                  </span>
                  {item.serials?.length > 0 && (
                    <span className="text-sky-600 font-semibold text-xs">
                      ({item.serials.length} serials)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setExpandedId(item.localId)}
                className="py-1 px-3 rounded-md border border-slate-300 bg-slate-50 text-slate-900 font-semibold text-xs cursor-pointer hover:bg-slate-100 transition-colors"
              >
                ✏️ Edit
              </button>
              <button
                type="button"
                onClick={() => handleRemoveItem(item.localId)}
                className="bg-transparent border-0 text-rose-500 text-base cursor-pointer p-1 hover:text-rose-700"
                title="Remove product"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
