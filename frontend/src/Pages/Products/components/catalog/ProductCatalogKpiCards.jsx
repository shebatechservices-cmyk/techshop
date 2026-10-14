import React from 'react';

export default function ProductCatalogKpiCards({
  products = [],
  statusFilter = "ALL",
  setStatusFilter,
}) {
  const activeCount = products.filter((p) => p.status === "active").length;
  const lowStockCount = products.filter(
    (p) => Number(p.stock || 0) <= Number(p.min_stock || 0) && Number(p.min_stock || 0) > 0
  ).length;

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center flex-wrap gap-4">
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-600 block mb-0.5">
          Inventory Overview
        </span>
        <h2 className="text-lg font-extrabold text-slate-900">Product Catalog</h2>
        <p className="text-xs text-slate-500">
          View all registered products, stock levels, and active status at a glance.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <button
          type="button"
          onClick={() => setStatusFilter?.("ALL")}
          className={`flex flex-col items-center px-4 py-2 rounded-xl border transition-all cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-sky-50 border-sky-300 ring-2 ring-sky-200"
              : "bg-slate-50 border-slate-200 hover:bg-slate-100"
          }`}
          title="Click to view all products"
        >
          <strong className="text-base font-extrabold text-slate-900">{products.length}</strong>
          <small className="text-[10px] font-semibold text-slate-500 uppercase">Total Items</small>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter?.(statusFilter === "active" ? "ALL" : "active")}
          className={`flex flex-col items-center px-4 py-2 rounded-xl border transition-all cursor-pointer ${
            statusFilter === "active"
              ? "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-300"
              : "bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70"
          }`}
          title="Click to filter active products"
        >
          <strong className="text-base font-extrabold text-emerald-700">
            {activeCount}
          </strong>
          <small className="text-[10px] font-semibold text-emerald-600 uppercase">Active</small>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter?.(statusFilter === "low_stock" ? "ALL" : "low_stock")}
          className={`flex flex-col items-center px-4 py-2 rounded-xl border transition-all cursor-pointer ${
            statusFilter === "low_stock"
              ? "bg-rose-100 border-rose-400 ring-2 ring-rose-300"
              : "bg-rose-50 border-rose-200 hover:bg-rose-100/70"
          }`}
          title="Click to filter low stock products"
        >
          <strong className="text-base font-extrabold text-rose-700">
            {lowStockCount}
          </strong>
          <small className="text-[10px] font-semibold text-rose-600 uppercase">Low Stock</small>
        </button>
      </div>
    </div>
  );
}
