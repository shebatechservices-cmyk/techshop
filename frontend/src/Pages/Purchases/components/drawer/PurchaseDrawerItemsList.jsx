import React from 'react';
import { fullCatalogName } from '../../../../utils/productUtils';

export default function PurchaseDrawerItemsList({ order, taka }) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const unitCount =
    order?.unit_count ||
    items.reduce((sum, it) => sum + Number(it.quantity || 1), 0) ||
    0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
          Purchased Products ({items.length})
        </span>
        <span className="text-[0.7rem] text-slate-400">Units: {unitCount}</span>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
        {items.length > 0 ? (
          items.map((item, idx) => {
            const itemQty = Number(item.quantity || 1);
            const itemCost = Number(item.cost_price || 0);
            const finalCost = Number(item.final_cost || itemCost);
            const itemLineTotal = Number(item.line_total || itemQty * itemCost);
            const serials = Array.isArray(item.serials) ? item.serials : [];
            const suppWarranty = item.supplier_warranty_months || item.warranty_months || 0;
            const custWarranty = item.customer_warranty_months || item.warranty_months || 0;

            return (
              <div key={item.id || idx} className="p-3 hover:bg-slate-50/60 transition-colors">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 text-xs">
                      {item.full_name || item.name || fullCatalogName(item) || item.product_name || 'Product'}
                    </div>
                    {item.sku && (
                      <div className="text-[0.68rem] text-slate-400 font-mono mt-0.5">
                        SKU: {item.sku}
                      </div>
                    )}
                    <div className="text-[0.7rem] text-slate-500 mt-0.5">
                      {itemQty} × {taka(itemCost)}
                      {finalCost > itemCost && (
                        <span className="ml-1.5 text-orange-600 font-semibold">
                          (Final Cost: {taka(finalCost)})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="font-extrabold text-slate-900 text-xs text-right">
                    {taka(itemLineTotal)}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                  {suppWarranty > 0 && (
                    <span className="inline-flex items-center gap-1 text-[0.66rem] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                      <span>🏭</span> Supplier: {suppWarranty}m
                    </span>
                  )}

                  {custWarranty > 0 && (
                    <span className="inline-flex items-center gap-1 text-[0.66rem] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                      <span>🛡️</span> Customer: {custWarranty}m
                    </span>
                  )}

                  {serials.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      {serials.map((s, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-0.5 text-[0.66rem] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded"
                        >
                          <span>🏷️</span> {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-xs text-slate-400">
            Item details not available in this view
          </div>
        )}
      </div>
    </div>
  );
}
