import React from 'react';
import { fullCatalogName, taka } from '../hooks/usePurchaseCart';

export default React.memo(function ProductSearchSection({
  searchContainerRef,
  searchInputRef,
  query,
  setQuery,
  isSearchOpen,
  setIsSearchOpen,
  matches = [],
  addProduct,
  items = [],
  setIsAddProductOpen,
  onClose,
  onOpenAddProduct,
}) {
  return (
    <div ref={searchContainerRef} className="relative">
      <label className="block text-sm font-bold text-slate-700 mb-1.5">
        Add product to order
      </label>
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 flex items-center">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              setIsSearchOpen(val.trim().length > 0);
            }}
            onFocus={() => {
              if (query.trim().length > 0) {
                setIsSearchOpen(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsSearchOpen(false);
              }
            }}
            placeholder="Search by full catalog name, brand, model, SKU or barcode..."
            className="w-full py-2.5 pl-10 pr-9 rounded-lg border-[1.5px] border-slate-300 text-sm outline-none focus:border-emerald-500"
          />
          <span className="absolute right-3 text-slate-400 pointer-events-none">
            ⇅
          </span>
        </div>

        {/* Inline '+' Button: Triggers global add product */}
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            if (onOpenAddProduct) {
              onOpenAddProduct();
            } else {
              window.dispatchEvent(new CustomEvent('open-add-product'));
            }
          }}
          className="w-[38px] h-[38px] rounded-lg border-[1.5px] border-slate-300 bg-slate-50 text-emerald-500 text-xl font-bold flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
          title="Add Product to Catalog"
        >
          +
        </button>

        <button
          type="button"
          onClick={() => {
            searchInputRef?.current?.focus();
            if (query.trim().length > 0) {
              setIsSearchOpen(true);
            }
          }}
          className="py-2.5 px-4.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white border-0 font-semibold text-sm cursor-pointer flex items-center gap-1.5 whitespace-nowrap transition-colors"
        >
          + Add More
        </button>
      </div>

      {/* Autocomplete dropdown with Full Catalog Name - only render if query has length > 0 */}
      {isSearchOpen && query.trim().length > 0 && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[100] bg-white rounded-xl border-[1.5px] border-emerald-500 shadow-2xl max-h-[260px] overflow-y-auto p-1.5">
          {matches.length === 0 ? (
            <div className="p-3.5 text-center text-slate-400 text-sm">
              No matching products found.
              <div className="mt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    if (setIsAddProductOpen) setIsAddProductOpen(true);
                  }}
                  className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md py-1 px-2.5 text-xs font-semibold cursor-pointer hover:bg-emerald-100 transition-colors"
                >
                  + Create "{query.trim()}" as new product
                </button>
              </div>
            </div>
          ) : (
            matches.map((p) => {
              const fullDesc = fullCatalogName(p);
              const costHint = Number(
                p.last_purchase_price || p.purchase_price || p.cost_price || 0
              );
              const isAlreadyAdded = items.some((it) => it.product_id === p.id);

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    if (isAlreadyAdded) return;
                    addProduct(p);
                    setQuery('');
                    setIsSearchOpen(false);
                  }}
                  className={`py-2 px-3 rounded-md flex justify-between items-center text-sm border-b border-slate-100 transition-colors ${
                    isAlreadyAdded
                      ? 'cursor-not-allowed opacity-45 bg-slate-50'
                      : 'cursor-pointer hover:bg-emerald-50 bg-transparent'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold ${
                          isAlreadyAdded ? 'text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {fullDesc}
                      </span>
                      {isAlreadyAdded && (
                        <span className="text-[0.68rem] font-bold bg-rose-100 text-rose-700 py-0.5 px-1.5 rounded">
                          ✓ Already in PO
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex gap-2 mt-0.5">
                      <span>SKU: {p.sku || `PRD-${p.id}`}</span>
                      {p.barcode && <span>Barcode: {p.barcode}</span>}
                      {p.category_name && <span>({p.category_name})</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    {isAlreadyAdded ? (
                      <span className="text-xs text-rose-600 font-semibold">
                        Cannot add twice
                      </span>
                    ) : costHint > 0 ? (
                      <span className="text-xs font-semibold text-sky-600">
                        Last Cost: {taka(costHint)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">New Item</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
});
