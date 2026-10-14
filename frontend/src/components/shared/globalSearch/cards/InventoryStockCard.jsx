import React from 'react';

/**
 * Dimension 2: Inventory & Stock Status Card
 */
export default function InventoryStockCard({
  inventory,
  product,
  isSold,
  taka,
  onClose,
  onNavigate,
}) {
  const stockCount = inventory.stock ?? product.stock ?? 0;

  return (
    <div className="bg-white rounded-xl border border-emerald-100 shadow-xs p-4 flex flex-col justify-between hover:border-emerald-300 transition">
      <div>
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-emerald-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-sm">📦</span>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
              2. Inventory &amp; Stock Status
            </h4>
          </div>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded ${
              Number(stockCount) > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            Stock: {stockCount} pcs
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Current Unit State:</span>
            <span className="font-bold text-slate-800">
              {inventory.unit_status || (isSold ? 'Sold to Customer' : 'Available in Inventory')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Selling Price:</span>
            <span className="font-bold text-emerald-700">{taka(inventory.sale_price || product.sale_price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Cost Valuation:</span>
            <span className="font-semibold text-slate-700">{taka(inventory.cost_price || product.cost_price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Serial Tracking:</span>
            <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
              Individual Serial Tracked
            </span>
          </div>
        </div>
      </div>

      {onNavigate && (
        <button
          type="button"
          onClick={() => {
            onClose();
            onNavigate({ section: 'inventory', search: product.name || product.sku });
          }}
          className="mt-3 w-full py-1.5 text-center text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
        >
          Inspect in Inventory →
        </button>
      )}
    </div>
  );
}
