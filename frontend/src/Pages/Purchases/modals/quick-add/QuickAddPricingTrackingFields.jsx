import React from 'react';

export default function QuickAddPricingTrackingFields({
  formData,
  handleChange,
  generateSku,
}) {
  return (
    <>
      {/* Pricing: Purchase Cost & Selling Price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
        <div>
          <label className="block text-xs font-bold text-sky-700 mb-1">
            Purchase Cost Price ৳ *
          </label>
          <input
            type="number"
            step="any"
            required
            value={formData.purchase_price}
            onChange={(e) => handleChange('purchase_price', e.target.value)}
            placeholder="0.00"
            className="w-full py-2 px-3 rounded-lg border-[1.5px] border-sky-400 focus:border-sky-600 focus:outline-none text-sm box-border bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-emerald-600 mb-1">
            Selling Retail Price ৳
          </label>
          <input
            type="number"
            step="any"
            value={formData.selling_price}
            onChange={(e) => handleChange('selling_price', e.target.value)}
            placeholder="0.00"
            className="w-full py-2 px-3 rounded-lg border-[1.5px] border-emerald-400 focus:border-emerald-600 focus:outline-none text-sm box-border bg-white"
          />
        </div>
      </div>

      {/* SKU & Barcode */}
      <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr] gap-3.5">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-700">
              Auto SKU Code
            </label>
            <button
              type="button"
              onClick={() => handleChange('sku', generateSku(formData.brand_name || 'PRD', formData.name || 'ITM'))}
              className="bg-transparent border-0 text-blue-600 hover:text-blue-700 text-xs font-semibold cursor-pointer p-0"
            >
              ⚡ Regenerate
            </button>
          </div>
          <input
            type="text"
            value={formData.sku}
            onChange={(e) => handleChange('sku', e.target.value)}
            placeholder="e.g. NET-ROU-4821"
            className="w-full py-2 px-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:outline-none text-sm box-border font-semibold text-slate-800"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Barcode
          </label>
          <input
            type="text"
            value={formData.barcode}
            onChange={(e) => handleChange('barcode', e.target.value)}
            placeholder="e.g. 890123456789"
            className="w-full py-2 px-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:outline-none text-sm box-border"
          />
        </div>
      </div>

      {/* Serial / Barcode & Warranty Tracking Options */}
      <div className="flex flex-col gap-2 bg-slate-50 p-2.5 px-3.5 rounded-lg border border-slate-200">
        <label className="flex items-center justify-between cursor-pointer text-sm">
          <span>
            <strong className={formData.isSerialRequired ? "text-emerald-800 font-bold" : "text-slate-800 font-bold"}>
              📦 Requires Serial / Barcode Tracking
            </strong>
            <br />
            <small className="text-slate-500 text-xs">Enforces barcode scanning on purchase and sale rows</small>
          </span>
          <input
            type="checkbox"
            checked={Boolean(formData.isSerialRequired)}
            onChange={(e) => handleChange('isSerialRequired', e.target.checked)}
            className="w-4.5 h-4.5 accent-emerald-600 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer text-sm border-t border-dashed border-slate-200 pt-2">
          <span>
            <strong className={formData.isWarrantyRequired ? "text-blue-800 font-bold" : "text-slate-800 font-bold"}>
              🛡️ Requires Warranty Tracking
            </strong>
            <br />
            <small className="text-slate-500 text-xs">Enforces batch warranty on purchase and customer invoice</small>
          </span>
          <input
            type="checkbox"
            checked={Boolean(formData.isWarrantyRequired)}
            onChange={(e) => handleChange('isWarrantyRequired', e.target.checked)}
            className="w-4.5 h-4.5 accent-blue-600 cursor-pointer"
          />
        </label>

        {formData.isWarrantyRequired && (
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-xs font-semibold text-blue-800">
              Default Warranty (Months):
            </span>
            <input
              type="number"
              min="0"
              value={formData.warranty_months}
              onChange={(e) => handleChange('warranty_months', e.target.value)}
              placeholder="12"
              className="w-20 py-1.5 px-2 rounded-md border border-blue-300 focus:border-blue-500 focus:outline-none text-sm text-center font-bold box-border"
            />
          </div>
        )}
      </div>
    </>
  );
}
