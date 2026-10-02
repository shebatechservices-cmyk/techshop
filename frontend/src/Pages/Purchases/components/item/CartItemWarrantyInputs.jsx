import React from 'react';

export default function CartItemWarrantyInputs({ item, updateItem }) {
  return (
    <>
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
                const next = Math.max(0, cur - 1);
                updateItem(item.localId, {
                  supplier_warranty_months: next,
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
                const next = cur + 1;
                updateItem(item.localId, {
                  supplier_warranty_months: next,
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
    </>
  );
}
