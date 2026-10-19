import React from "react";

export default function ProductMetaFields({
  form,
  setForm,
  handleFieldChange,
  generateAutoSku,
}) {
  return (
    <>
      {/* SKU */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700">SKU (Auto Generated)</label>
        <div className="flex gap-2">
          <input
            name="sku"
            value={form.sku || ""}
            onChange={handleFieldChange}
            placeholder="e.g. SKU-123456"
            required
            className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-slate-800"
          />
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, sku: generateAutoSku() }))}
            title="Generate New SKU Code"
            className="px-3.5 border border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer text-base font-bold"
          >
            🎲
          </button>
        </div>
      </div>

      {/* Primary Barcode */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700">Main Barcode (Optional)</label>
        <input
          name="barcode"
          value={form.barcode || ""}
          onChange={handleFieldChange}
          placeholder="e.g. Box Barcode / Item Barcode"
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-slate-800"
        />
      </div>

      {/* Min Stock */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
          <span>Min Stock Alert (Low Stock Threshold)</span>
          <span className="text-rose-500">*</span>
        </label>
        <input
          type="number"
          name="min_stock"
          value={form.min_stock}
          onChange={handleFieldChange}
          min="0"
          required
          placeholder="e.g. 5"
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
        />
      </div>

      {/* Condition */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700">Condition</label>
        <select
          name="condition"
          value={form.condition}
          onChange={handleFieldChange}
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
        >
          <option>New</option>
          <option>Used</option>
          <option>Refurbished</option>
        </select>
      </div>
    </>
  );
}
