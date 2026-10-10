import React from 'react';
import { fullCatalogName } from '../../../utils/productUtils';

export default function CatalogTab({
  filteredCatalog,
  catalogSearch,
  setCatalogSearch,
  catalogStockFilter,
  setCatalogStockFilter,
  setIsNewOrderModalOpen,
  onOpenQuotation,
  taka,
}) {
  return (
    <div>
      {/* Catalog Filter Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 mb-5 flex justify-between items-center flex-wrap gap-3 shadow-xs">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            value={catalogSearch}
            onChange={(e) => setCatalogSearch(e.target.value)}
            placeholder="🔍 Search catalog by product name, SKU, brand..."
            className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm outline-none focus:border-teal-500 box-border bg-white"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={catalogStockFilter}
            onChange={(e) => setCatalogStockFilter(e.target.value)}
            className="px-3 py-2 rounded-md border border-slate-300 text-sm bg-white outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="all">All Stock Statuses</option>
            <option value="instock">In Stock (Stock &gt; 0)</option>
            <option value="lowstock">Low Stock (Stock ≤ 5)</option>
            <option value="outofstock">Out of Stock</option>
          </select>

          {onOpenQuotation && (
            <button
              type="button"
              onClick={() => onOpenQuotation(null)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold text-sm cursor-pointer transition-colors shadow-xs flex items-center gap-1"
            >
              📄 + Quotation
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsNewOrderModalOpen(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-bold text-sm cursor-pointer transition-colors shadow-xs"
          >
            + Create Order with Product
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
        {filteredCatalog.map((p) => {
          const stock = Number(p.stock || 0);
          const isOut = stock <= 0;
          const isLow = stock > 0 && stock <= 5;

          return (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col justify-between shadow-xs hover:-translate-y-0.5 hover:shadow-lg transition-all duration-150"
            >
              <div>
                {/* Header: SKU & Stock Badge */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-500 font-semibold">
                    SKU: {p.sku || 'N/A'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                      isOut
                        ? 'bg-red-100 text-red-700'
                        : isLow
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {isOut ? 'Out of Stock' : isLow ? `Low (${stock})` : `In Stock (${stock})`}
                  </span>
                </div>

                {/* Product Name */}
                <div className="font-bold text-sm text-slate-900 leading-snug mb-1.5 break-words">
                  {fullCatalogName(p) || p.name}
                </div>

                {p.brand_name && (
                  <div className="text-xs text-slate-500 mb-2">
                    Brand: <strong className="text-slate-700">{p.brand_name}</strong>
                  </div>
                )}
              </div>

              {/* Pricing & Action */}
              <div className="border-t border-slate-100 pt-2.5 mt-2.5 flex justify-between items-center">
                <div>
                  <span className="text-[11px] text-slate-500 block">Selling Price</span>
                  <span className="text-lg font-black text-emerald-600">
                    {taka(p.selling_price || p.purchase_price || 0)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {onOpenQuotation && (
                    <button
                      type="button"
                      onClick={() => onOpenQuotation(p)}
                      className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-700 rounded-md text-xs font-bold cursor-pointer transition-colors"
                      title="Generate price quotation for this product"
                    >
                      📄 Quotation
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsNewOrderModalOpen(true)}
                    className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-600 rounded-md text-xs font-bold cursor-pointer transition-colors"
                  >
                    + Order
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
