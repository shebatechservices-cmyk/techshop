import React from 'react';
import { EXTRA_COST_CATEGORIES } from '../../../Purchases/hooks/usePurchaseCart';
import { taka } from '../../hooks/useNewSale';

/**
 * Addons and optional charges toolbar (VAT, Setup, Logistics, Privilege discounts)
 * and their expandable details.
 */
export default function SalePaymentAddonsToolbar({
  vat,
  setVat,
  hasSetupCharge,
  handleToggleSetupCharge,
  totalSetupCharge,
  cameraCount,
  handleCameraCountChange,
  setupRatePerCamera,
  handleRateChange,
  setupCharge,
  handleDirectSetupChargeChange,
  hasExtraCost,
  setHasExtraCost,
  extraCost,
  setExtraCost,
  extraCostCategory,
  setExtraCostCategory,
  totalExtraCost,
  isTechnician,
  isReseller,
  isGroupDiscountActive,
  handleToggleGroupDiscount,
  groupDiscountAmount,
}) {
  return (
    <>
      {/* Optional charges / Add-ons toolbar */}
      <div className="flex items-center gap-2 flex-wrap py-1 px-2 bg-white border border-slate-200 rounded-md mb-1.5 text-xs">
        <label className="inline-flex items-center gap-1 cursor-pointer font-semibold text-slate-600">
          <span>VAT (৳):</span>
          <input
            type="number"
            min="0"
            step="1"
            placeholder="0.00"
            value={vat || ''}
            onChange={(e) => setVat(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-16 h-6 py-0.5 px-1.5 rounded border border-slate-300 text-xs box-border"
          />
        </label>

        <label
          className={`inline-flex items-center gap-1 cursor-pointer font-semibold ${
            hasSetupCharge ? 'text-emerald-700' : 'text-slate-600'
          }`}
        >
          <input
            type="checkbox"
            checked={hasSetupCharge}
            onChange={(e) => handleToggleSetupCharge(e.target.checked)}
            className="accent-emerald-600"
          />
          <span>🛠️ Setup ({taka(totalSetupCharge)})</span>
        </label>

        <label
          className={`inline-flex items-center gap-1 cursor-pointer font-semibold ${
            hasExtraCost ? 'text-orange-700' : 'text-slate-600'
          }`}
        >
          <input
            type="checkbox"
            checked={hasExtraCost}
            onChange={(e) => setHasExtraCost(e.target.checked)}
            className="accent-orange-600"
          />
          <span>🚚 Logistics ({taka(totalExtraCost)})</span>
        </label>

        {(isTechnician || isReseller) && (
          <button
            type="button"
            onClick={handleToggleGroupDiscount}
            className={`ml-auto py-0.5 px-2 rounded border-0 text-white font-bold text-[0.70rem] cursor-pointer transition-colors ${
              isGroupDiscountActive ? 'bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isGroupDiscountActive
              ? '✓ 5% Privilege Applied'
              : `⚡ Apply 5% Privilege (${taka(groupDiscountAmount)})`}
          </button>
        )}
      </div>

      {/* Collapsible Setup charge details if enabled */}
      {hasSetupCharge && (
        <div className="mb-1.5 bg-emerald-50 border border-emerald-300 rounded p-1.5 grid grid-cols-3 gap-1.5">
          <div>
            <label className="block text-[0.62rem] font-bold text-emerald-800 mb-0.5">Camera Qty</label>
            <input
              type="number"
              min="1"
              value={cameraCount}
              onChange={(e) => handleCameraCountChange(e.target.value)}
              className="w-full h-6 py-0.5 px-1 rounded border border-emerald-300 bg-white text-xs box-border"
            />
          </div>
          <div>
            <label className="block text-[0.62rem] font-bold text-emerald-800 mb-0.5">Rate / Cam (৳)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={setupRatePerCamera}
              onChange={(e) => handleRateChange(e.target.value)}
              className="w-full h-6 py-0.5 px-1 rounded border border-emerald-300 bg-white text-xs box-border"
            />
          </div>
          <div>
            <label className="block text-[0.62rem] font-bold text-emerald-800 mb-0.5">Setup Charge (৳)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={setupCharge}
              onChange={(e) => handleDirectSetupChargeChange(e.target.value)}
              className="w-full h-6 py-0.5 px-1 rounded border-[1.5px] border-emerald-600 bg-white text-xs font-extrabold text-emerald-700 box-border"
            />
          </div>
        </div>
      )}

      {/* Collapsible Extra Cost details if enabled */}
      {hasExtraCost && (
        <div className="mb-1.5 bg-orange-50 border border-orange-300 rounded p-1.5 grid grid-cols-[1fr_1.4fr] gap-1.5">
          <div>
            <label className="block text-[0.62rem] font-bold text-orange-900 mb-0.5">Extra Cost (৳)</label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={extraCost || ''}
              onChange={(e) => setExtraCost(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full h-6 py-0.5 px-1 rounded border border-orange-300 bg-white text-xs font-bold text-orange-900 box-border"
            />
          </div>
          <div>
            <label className="block text-[0.62rem] font-bold text-orange-900 mb-0.5">Category</label>
            <select
              value={extraCostCategory}
              onChange={(e) => setExtraCostCategory(e.target.value)}
              className="w-full h-6 py-0.5 px-1 rounded border border-orange-300 bg-white text-xs box-border"
            >
              {EXTRA_COST_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </>
  );
}
