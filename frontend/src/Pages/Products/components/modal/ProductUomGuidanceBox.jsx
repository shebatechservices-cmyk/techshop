import React from "react";

export default function ProductUomGuidanceBox({ form }) {
  return (
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
  );
}
