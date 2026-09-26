import React from "react";

export default function ProductUomFormSection({
  form,
  setForm,
  handleFieldChange,
}) {
  return (
    <div className="bg-slate-50/90 p-5 rounded-xl border border-slate-200 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <span>📏 Unit of Measurement (Base Unit & Fractional Sell Unit)</span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Buy in bulk Base Units (e.g., Box) and sell in fractional units (e.g., Meter).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        {/* Base Unit */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
            <span>Base Unit (Purchase / Bulk Unit)</span>
            <span className="text-slate-400 font-normal text-xs">(e.g. Box, Drum, Roll, Carton, Pack)</span>
          </label>
          <input
            name="unit_name"
            value={form.unit_name || "Box"}
            onChange={handleFieldChange}
            placeholder="e.g. Box"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800"
          />
        </div>

        {/* Sell Unit / Fractional Unit Enable Toggle */}
        <label className="flex items-center gap-2.5 p-3 bg-white rounded-lg border border-slate-200 text-sm font-bold text-slate-800 cursor-pointer hover:bg-slate-50 transition-colors shadow-2xs">
          <input
            type="checkbox"
            checked={Boolean(form.enable_sub_unit)}
            onChange={(e) => setForm((p) => ({ ...p, enable_sub_unit: e.target.checked }))}
            className="w-4.5 h-4.5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
          />
          <span>Enable Sell Unit / Fractional Selling (e.g., Meter)</span>
        </label>
      </div>

      {/* Fractional / Sell Unit Details when enabled */}
      {form.enable_sub_unit && (
        <div className="space-y-3.5 bg-white p-4.5 rounded-xl border border-sky-200 shadow-2xs animate-in fade-in duration-100">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Sell Unit (Retail Unit)
              </label>
              <input
                name="sub_unit_name"
                value={form.sub_unit_name || ""}
                onChange={handleFieldChange}
                placeholder="e.g. Meter"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-sky-500 text-slate-800"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Conversion Rate (1 {form.unit_name || "Box"} =)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  name="conversion_rate"
                  min="1"
                  step="any"
                  value={form.conversion_rate || "305"}
                  onChange={handleFieldChange}
                  placeholder="305"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-sky-500 text-slate-800"
                />
                <span className="text-xs text-slate-500 font-bold whitespace-nowrap">
                  {form.sub_unit_name || "Meters"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Per-{form.sub_unit_name || "Meter"} Price (Tk)
              </label>
              <input
                type="number"
                name="sub_unit_selling_price"
                min="0"
                step="any"
                value={form.sub_unit_selling_price || ""}
                onChange={handleFieldChange}
                placeholder="e.g. 15.00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-right focus:ring-2 focus:ring-sky-500 text-slate-800"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Sell Unit Barcode (Optional)
              </label>
              <input
                name="sub_unit_barcode"
                value={form.sub_unit_barcode || ""}
                onChange={handleFieldChange}
                placeholder="e.g. Barcode on cable"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-sky-500 text-slate-800"
              />
            </div>
          </div>

          {/* Informational Guidance Box */}
          <div className="bg-sky-50/80 border border-sky-200 rounded-lg p-3 text-xs text-sky-900 flex items-start gap-2.5">
            <span className="text-base leading-none">💡</span>
            <div>
              <span className="font-bold">Inventory & POS Fraction Logic: </span>
              <span>
                When you purchase 1 {form.unit_name || "Box"}, stock automatically reflects{" "}
                <strong className="text-sky-950 font-bold">
                  {form.conversion_rate || 305} {form.sub_unit_name || "Meters"}
                </strong>.
                In POS, you can sell fractional quantities (e.g. 20 {form.sub_unit_name || "Meters"}), and the system will automatically charge the per-{form.sub_unit_name || "meter"} price and deduct exactly 20 {form.sub_unit_name || "Meters"} from total inventory.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
