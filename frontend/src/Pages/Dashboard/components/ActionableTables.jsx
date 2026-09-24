import React from "react";

export default function ActionableTables({ lowStockItems = [], recentPurchases = [], taka }) {
  const formatTaka = (val) => (taka ? taka(val) : `৳${Number(val || 0).toFixed(2)}`);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Critical Stock Alert Box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>Critical Stock Reorder Alerts</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold ml-1">
                {lowStockItems.length}
              </span>
            </h3>
            <span className="text-xs text-red-600 font-bold">Needs Attention</span>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="text-center py-8 text-emerald-600 font-semibold text-xs">
              ✓ All products have healthy stock levels!
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStockItems.map((prod) => {
                const isOut = Number(prod.stock) <= 0;
                return (
                  <div
                    key={prod.id}
                    className={`flex justify-between items-center p-3 rounded-xl border transition-colors ${
                      isOut
                        ? "bg-red-50/70 border-red-200/80"
                        : "bg-amber-50/60 border-amber-200/80"
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="font-semibold text-xs text-slate-800 truncate">
                        {prod.composite_name || prod.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        SKU: {prod.sku || `PRD-${prod.id}`} · Min Alert: {prod.min_stock || 5}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-2xs ${
                          isOut ? "bg-red-600" : "bg-amber-500"
                        }`}
                      >
                        {isOut ? "Out of Stock" : `${prod.stock} Left`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Purchases & Inventory Inflow */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>📦</span>
              <span>Recent Inward Purchases</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">Latest 5 Orders</span>
          </div>

          {recentPurchases.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No purchase orders recorded yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentPurchases.map((po) => {
                const totalDue = Number(po.total_due || 0);
                const hasDue = totalDue > 0;
                return (
                  <div
                    key={po.id}
                    className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {po.po_number || `PO-${po.id}`}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        Supplier: {po.supplier_name || "Supplier"} ·{" "}
                        {new Date(po.created_at || po.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-extrabold text-xs text-sky-700">
                        {formatTaka(po.total_cost)}
                      </div>
                      <div
                        className={`text-[10px] font-semibold mt-0.5 ${
                          hasDue ? "text-red-600" : "text-emerald-600"
                        }`}
                      >
                        {hasDue ? `Due: ${formatTaka(totalDue)}` : "Paid in Full"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
