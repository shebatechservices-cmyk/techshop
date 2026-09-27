import React, { useState, useEffect, useCallback } from "react";
import API from "../../../../services/api";
import ManageUomModal from "../../modals/ManageUomModal";

const DEFAULT_UOMS = [
  { name: 'Piece', code: 'PCS', is_fractional_allowed: false },
  { name: 'Box', code: 'BOX', is_fractional_allowed: false },
  { name: 'Meter', code: 'MTR', is_fractional_allowed: true },
  { name: 'Drum / Spool', code: 'DRM', is_fractional_allowed: true },
  { name: 'Roll', code: 'ROLL', is_fractional_allowed: true },
  { name: 'Carton', code: 'CTN', is_fractional_allowed: false },
  { name: 'Pack', code: 'PK', is_fractional_allowed: false },
  { name: 'Set', code: 'SET', is_fractional_allowed: false },
  { name: 'Kilogram', code: 'KG', is_fractional_allowed: true },
  { name: 'Foot', code: 'FT', is_fractional_allowed: true }
];

export default function ProductUomFormSection({
  form,
  setForm,
  handleFieldChange,
}) {
  const [uoms, setUoms] = useState(DEFAULT_UOMS);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const fetchActiveUoms = useCallback(async () => {
    try {
      const res = await fetch(`${API}/uom?active_only=true`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setUoms(json.data);
        }
      }
    } catch (err) {
      console.error("Error loading active UOMs:", err);
    }
  }, []);

  useEffect(() => {
    fetchActiveUoms();
  }, [fetchActiveUoms]);

  // Ensure current selected values exist in dropdown options
  const baseUnitValue = form.unit_name || "Piece";
  const sellUnitValue = form.sub_unit_name || "";

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
        <button
          type="button"
          onClick={() => setIsManageModalOpen(true)}
          className="text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          title="Manage Units of Measurement"
        >
          <span>⚙️</span>
          <span>Manage UOM</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        {/* Base Unit */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
              <span>Base Unit (Purchase / Bulk Unit)</span>
              <span className="text-slate-400 font-normal text-xs">(e.g. Box, Drum, Roll, Carton, Pack)</span>
            </label>
          </div>
          <div className="flex gap-2">
            <select
              name="unit_name"
              value={baseUnitValue}
              onChange={handleFieldChange}
              className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800"
            >
              {uoms.map((u) => (
                <option key={u.id || u.name} value={u.name}>
                  {u.name} {u.code ? `(${u.code})` : ""}
                </option>
              ))}
              {/* Fallback if form has a legacy custom unit not in uoms list */}
              {baseUnitValue && !uoms.some((u) => u.name === baseUnitValue) && (
                <option value={baseUnitValue}>{baseUnitValue} (Custom)</option>
              )}
            </select>
            <button
              type="button"
              onClick={() => setIsManageModalOpen(true)}
              title="Add or Edit Units"
              className="w-10 h-10 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer text-lg"
            >
              +
            </button>
          </div>
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
              <select
                name="sub_unit_name"
                value={sellUnitValue}
                onChange={handleFieldChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-sky-500 text-slate-800 bg-white"
              >
                <option value="">Select Retail Unit</option>
                {uoms.map((u) => (
                  <option key={u.id || u.name} value={u.name}>
                    {u.name} {u.code ? `(${u.code})` : ""} {u.is_fractional_allowed ? "— (Fractional)" : ""}
                  </option>
                ))}
                {sellUnitValue && !uoms.some((u) => u.name === sellUnitValue) && (
                  <option value={sellUnitValue}>{sellUnitValue} (Custom)</option>
                )}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Conversion Rate (1 {form.unit_name || "Base Unit"} =)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  name="conversion_rate"
                  min="1"
                  step="any"
                  value={form.conversion_rate || ""}
                  onChange={handleFieldChange}
                  placeholder="305"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-sky-500 text-slate-800"
                />
                <span className="text-xs text-slate-500 font-bold whitespace-nowrap">
                  {form.sub_unit_name || "Units"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Per-{form.sub_unit_name || "Unit"} Price (Tk)
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
                When you purchase 1 {form.unit_name || "Base Unit"}, stock automatically reflects{" "}
                <strong className="text-sky-950 font-bold">
                  {form.conversion_rate || 1} {form.sub_unit_name || "Units"}
                </strong>.
                In POS, you can sell fractional quantities (e.g. 20 {form.sub_unit_name || "Units"}), and the system will automatically charge the per-{form.sub_unit_name || "unit"} price and deduct exactly 20 {form.sub_unit_name || "Units"} from total inventory.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Manage UOM Modal */}
      <ManageUomModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        onUomUpdated={(updatedList) => {
          setUoms(updatedList);
        }}
      />
    </div>
  );
}
