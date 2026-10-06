import React, { useState } from 'react';

export default function ProductDetailsModal({
  product,
  onClose,
  onOpenNewSale,
  handleOpenTransferModal,
  handleOpenLabelModal,
  handleOpenWarrantyModal,
  taka = '৳',
  getWarrantyValidity,
}) {
  const [showCost, setShowCost] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  if (!product) return null;

  const stock = Number(product.stock || 0);
  const minStock = Number(product.min_stock || 5);
  const isOut = stock <= 0;
  const isLow = stock <= minStock && !isOut;

  const costPrice = Number(product.cost_price || product.purchase_price || 0);
  const salePrice = Number(product.sale_price || product.selling_price || product.mrp || 0);
  const mrp = Number(product.mrp || 0);
  const convRate = Number(product.conversion_rate || 1) > 1 ? Number(product.conversion_rate) : 1;
  const effectiveCost = convRate > 1 ? (costPrice / convRate) : costPrice;
  const effectiveSale = convRate > 1 ? (salePrice / convRate) : salePrice;
  const margin = salePrice > 0 && costPrice > 0 ? salePrice - costPrice : 0;
  const marginPercent = costPrice > 0 ? ((margin / costPrice) * 100).toFixed(1) : 0;
  const totalValuation = stock * effectiveCost;

  // Supplier warranty calculation
  const supMonths = Number(product.supplier_warranty_months || product.warranty_months || 0);
  let expDateStr = product.supplier_warranty_expire_date;
  if (!expDateStr && product.purchase_date && supMonths > 0) {
    const pd = new Date(product.purchase_date);
    if (!isNaN(pd.getTime())) {
      const exp = new Date(pd);
      exp.setMonth(exp.getMonth() + supMonths);
      expDateStr = exp.toISOString().split('T')[0];
    }
  }
  const validity = expDateStr && getWarrantyValidity ? getWarrantyValidity(expDateStr) : null;
  const agingDays = Number(product.aging_days || 0);

  const formatMoney = (val) => {
    if (typeof taka === 'function') {
      return taka(val);
    }
    const symbol = typeof taka === 'string' ? taka : '৳';
    return `${symbol}${Number(val || 0).toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/65 flex items-center justify-center z-[99999] p-4 sm:p-6 backdrop-blur-[3px] overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-[760px] w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn my-auto border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl p-1.5 bg-sky-100 rounded-lg text-sky-700">📦</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[0.7rem] uppercase tracking-wider font-extrabold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  Inventory Product Details
                </span>
                <span className="font-mono text-xs text-slate-400">ID #{product.id}</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 truncate mt-0.5">
                {product.composite_name || product.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 bg-slate-200/60 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold transition-colors ml-3 shrink-0"
            title="Close modal (Esc)"
          >
            ✕
          </button>
        </div>

        {/* 2. Scrollable Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 text-xs sm:text-sm">
          {/* Top Banner: Image + Quick Badges + SKU */}
          <div className="flex flex-col sm:flex-row gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200/90 items-start">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm mx-auto sm:mx-0">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <div className="text-3xl mb-1">📷</div>
                  <div className="text-[10px] uppercase font-bold">No Image</div>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2 w-full">
              <div className="flex flex-wrap items-center gap-2">
                {/* Stock Status Badge */}
                <span
                  className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full font-extrabold text-xs border ${
                    isOut
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : isLow
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
                  {isOut ? 'Out of Stock' : isLow ? `Low Stock (${stock} pcs)` : `In Stock (${stock} pcs)`}
                </span>

                {/* Category & Subcategory */}
                {(product.category_name || product.sub_category_name) && (
                  <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold">
                    <span>📁</span>
                    {product.category_name || 'General'}
                    {product.sub_category_name ? ` › ${product.sub_category_name}` : ''}
                  </span>
                )}

                {/* E-Commerce Status */}
                <span
                  className={`inline-flex items-center gap-1 py-1 px-2 rounded text-[0.7rem] font-bold ${
                    product.is_ecommerce_active !== false
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  🛒 E-Com: {product.is_ecommerce_active !== false ? 'Live' : 'Hidden'}
                </span>
              </div>

              {/* SKU & Barcode Pills with Quick Copy */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {product.sku && (
                  <button
                    type="button"
                    onClick={() => handleCopy(product.sku, 'sku')}
                    className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-mono text-xs font-bold transition-colors text-left"
                    title="Click to copy SKU"
                  >
                    <span>SKU: {product.sku}</span>
                    <span className="text-[10px]">{copiedKey === 'sku' ? '✓ Copied' : '📋'}</span>
                  </button>
                )}

                {product.barcode && (
                  <button
                    type="button"
                    onClick={() => handleCopy(product.barcode, 'barcode')}
                    className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-mono text-xs font-bold transition-colors text-left"
                    title="Click to copy Barcode"
                  >
                    <span>Barcode: {product.barcode}</span>
                    <span className="text-[10px]">{copiedKey === 'barcode' ? '✓ Copied' : '📋'}</span>
                  </button>
                )}
              </div>

              {/* Hierarchy badges (Brand, Model, Series) */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 pt-0.5">
                {product.brand_name && (
                  <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-medium">
                    Brand: <strong className="text-slate-800">{product.brand_name}</strong>
                  </span>
                )}
                {product.model_name && (
                  <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-medium">
                    Model: <strong className="text-slate-800">{product.model_name}</strong>
                  </span>
                )}
                {product.series_name && (
                  <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-medium">
                    Series: <strong className="text-slate-800">{product.series_name}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3. Metrics Summary (Stock, Inflow, Sold, Aging) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <div className="text-[0.7rem] uppercase tracking-wider font-bold text-slate-500 mb-1">
                Available Stock
              </div>
              <div className="text-xl font-black text-slate-900">
                {stock} <span className="text-xs font-normal text-slate-500">pcs</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Min: {minStock} pcs</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <div className="text-[0.7rem] uppercase tracking-wider font-bold text-slate-500 mb-1">
                Total Inflow
              </div>
              <div className="text-xl font-black text-sky-700">
                {product.total_inflow_units || product.purchase_count || 0}{' '}
                <span className="text-xs font-normal text-slate-500">pcs</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">All Purchases</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <div className="text-[0.7rem] uppercase tracking-wider font-bold text-slate-500 mb-1">
                Total Sold
              </div>
              <div className="text-xl font-black text-emerald-700">
                {product.total_sold_units || 0}{' '}
                <span className="text-xs font-normal text-slate-500">pcs</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">POS & Invoices</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <div className="text-[0.7rem] uppercase tracking-wider font-bold text-slate-500 mb-1">
                Inventory Aging
              </div>
              <div className={`text-xl font-black ${agingDays >= 60 ? 'text-red-600' : 'text-slate-900'}`}>
                {agingDays} <span className="text-xs font-normal text-slate-500">Days</span>
              </div>
              <div className="text-[10px] mt-0.5">
                {agingDays >= 60 ? (
                  <span className="text-red-600 font-bold">⚠️ Aged Stock</span>
                ) : (
                  <span className="text-emerald-600 font-medium">✓ Normal</span>
                )}
              </div>
            </div>
          </div>

          {/* 4. Pricing, Cost & Valuation Card */}
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
              <div className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <span>💰</span> Pricing &amp; Financial Valuation
              </div>
              <button
                type="button"
                onClick={() => setShowCost(!showCost)}
                className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 cursor-pointer"
              >
                <span>{showCost ? '🔒 Hide Cost' : '👁️ Reveal Cost'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[0.72rem] text-slate-500 block font-semibold">Selling Price</span>
                <span className="text-lg font-black text-emerald-700">
                  {formatMoney(salePrice)}
                  {convRate > 1 && <span className="text-xs font-normal text-slate-500"> /{product.unit_name || 'Box'}</span>}
                </span>
                {convRate > 1 && (
                  <span className="text-[0.68rem] text-slate-500 block font-medium">
                    {formatMoney(effectiveSale)} /{product.sub_unit_name || 'Unit'}
                  </span>
                )}
              </div>

              <div>
                <span className="text-[0.72rem] text-slate-500 block font-semibold">Purchase Cost</span>
                <span className="text-lg font-mono font-bold text-slate-700">
                  {showCost ? (
                    <>
                      {formatMoney(costPrice)}
                      {convRate > 1 && <span className="text-xs font-normal text-slate-500 font-sans"> /{product.unit_name || 'Box'}</span>}
                    </>
                  ) : '••••••'}
                </span>
                {showCost && convRate > 1 && (
                  <span className="text-[0.68rem] text-slate-500 block font-medium font-mono">
                    {formatMoney(effectiveCost)} /{product.sub_unit_name || 'Unit'}
                  </span>
                )}
              </div>

              <div>
                <span className="text-[0.72rem] text-slate-500 block font-semibold">Unit Margin</span>
                <span className="text-lg font-bold text-sky-700">
                  {showCost ? (
                    <>
                      {formatMoney(margin)}{' '}
                      <span className="text-xs font-normal text-slate-500">({marginPercent}%)</span>
                    </>
                  ) : (
                    '••••••'
                  )}
                </span>
              </div>

              <div>
                <span className="text-[0.72rem] text-slate-500 block font-semibold">In-Stock Valuation</span>
                <span className="text-lg font-bold text-indigo-700">
                  {showCost ? formatMoney(totalValuation) : '••••••'}
                </span>
              </div>
            </div>

            {mrp > 0 && (
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Maximum Retail Price (MRP): <strong>{formatMoney(mrp)}</strong></span>
                {product.latest_purchase_date && (
                  <span>Last Inflow Date: <strong>{new Date(product.latest_purchase_date).toLocaleDateString()}</strong></span>
                )}
              </div>
            )}
          </div>

          {/* 4.1 Purchase Batches & Fixed Costs Breakdown */}
          {Array.isArray(product.batches) && product.batches.length > 0 && (
            <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-sky-100 rounded text-sky-700 text-xs">📋</span>
                  <span className="font-extrabold text-sm text-slate-900">
                    Purchase Batches &amp; Fixed Costs ({product.batches.length})
                  </span>
                </div>
                <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded border border-sky-200">
                  Batch-Fixed Rates
                </span>
              </div>
              <div className="divide-y divide-sky-100 border border-sky-100 rounded-lg bg-white overflow-hidden text-xs">
                {product.batches.map((batch, bIdx) => {
                  const bCost = Number(batch.cost_price || 0);
                  const bFinal = Number(batch.final_cost || bCost);
                  const bDate = batch.purchase_date
                    ? new Date(batch.purchase_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'N/A';
                  return (
                    <div key={batch.purchase_order_id || bIdx} className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sky-800">{batch.po_number || `PO #${batch.purchase_order_id}`}</span>
                          <span className="text-[10px] text-slate-400">• {bDate}</span>
                          <span className="text-[11px] font-medium text-slate-600 truncate max-w-[150px]">{batch.supplier_name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Inflow: <strong className="text-slate-700">{batch.quantity} units</strong>
                        </div>
                      </div>
                      <div className="text-right ml-3 shrink-0 space-y-0.5">
                        <div className="font-mono text-xs">
                          <span className="text-[10px] text-slate-500 font-sans mr-1">Cost:</span>
                          <strong className="text-slate-900">{formatMoney(bCost)}</strong>
                          {bFinal > bCost && (
                            <span className="text-[10px] text-orange-600 font-semibold ml-1">
                              (Landed: {formatMoney(bFinal)})
                            </span>
                          )}
                        </div>
                        {batch.sale_price > 0 && (
                          <div className="font-mono text-xs">
                            <span className="text-[10px] text-slate-500 font-sans mr-1">Batch Sale:</span>
                            <strong className="text-emerald-700">{formatMoney(batch.sale_price)}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {product.batch_valuation > 0 && (
                <div className="mt-2.5 flex items-center justify-between text-xs pt-1.5 border-t border-sky-200/60 text-slate-600">
                  <span>Actual Batch Stock Valuation:</span>
                  <strong className="font-mono text-sky-800">{formatMoney(product.batch_valuation)}</strong>
                </div>
              )}
            </div>
          )}

          {/* 5. Supplier Warranty Information */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <span>🛡️</span> Supplier Warranty Status
              </span>
              {handleOpenWarrantyModal && (
                <button
                  type="button"
                  onClick={() => {
                    handleOpenWarrantyModal(product);
                    onClose();
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                >
                  View Serial Details →
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <span className="text-[0.7rem] text-slate-500 uppercase font-bold block">Warranty Duration</span>
                <span className="font-bold text-slate-800">
                  {supMonths > 0 ? `${supMonths} Months` : 'No Warranty / None'}
                </span>
              </div>

              <div>
                <span className="text-[0.7rem] text-slate-500 uppercase font-bold block">Supplier Expiry Date</span>
                <span className="font-mono text-slate-800">
                  {expDateStr ? new Date(expDateStr).toLocaleDateString() : '—'}
                </span>
              </div>

              <div>
                <span className="text-[0.7rem] text-slate-500 uppercase font-bold block">Warranty Validity</span>
                {validity ? (
                  <span
                    className={`inline-block py-0.5 px-2 rounded text-xs font-bold ${
                      validity.expired ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {validity.text}
                  </span>
                ) : (
                  <span className="text-slate-400">N/A</span>
                )}
              </div>
            </div>
          </div>

          {/* 6. Product Description (if available) */}
          {product.description && (
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[0.72rem] text-slate-500 font-bold uppercase block mb-1">
                Description / Specifications
              </span>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line m-0">
                {product.description}
              </p>
            </div>
          )}
        </div>

        {/* 7. Modal Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 flex-wrap">
            {/* New Sale Button */}
            {onOpenNewSale && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewSale(product);
                }}
                disabled={isOut}
                className={`py-2 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm ${
                  isOut
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                }`}
              >
                <span>🛒</span> New Sale
              </button>
            )}

            {/* Stock Transfer Button */}
            {handleOpenTransferModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  handleOpenTransferModal(product);
                }}
                className="py-2 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white cursor-pointer transition-colors shadow-sm"
              >
                <span>🔄</span> Transfer Stock
              </button>
            )}

            {/* Print Barcode Label */}
            {handleOpenLabelModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  handleOpenLabelModal(product);
                }}
                className="py-2 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer transition-colors"
              >
                <span>🏷️</span> Print Label
              </button>
            )}

            {/* Warranty & Serials */}
            {handleOpenWarrantyModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  handleOpenWarrantyModal(product);
                }}
                className="py-2 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 cursor-pointer transition-colors"
              >
                <span>🛡️</span> Serials &amp; Warranty
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
