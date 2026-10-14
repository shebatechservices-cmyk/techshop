import React from 'react';
import { fullCatalogName } from '../../../../utils/productUtils';
import { taka } from '../../hooks/useNewSale';

export default function NewSaleProductSearch({
  searchContainerRef,
  searchInputRef,
  searchQuery,
  setSearchQuery,
  isSearchOpen,
  setIsSearchOpen,
  searchError,
  setSearchError,
  handleScanEnter,
  filteredProducts = [],
  items = [],
  addProduct,
  autoFocusEnabled,
}) {
  return (
    <div ref={searchContainerRef} className="relative mb-4">
      <input
        ref={searchInputRef}
        type="text"
        value={searchQuery}
        onFocus={() => setIsSearchOpen(true)}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          if (searchError) setSearchError('');
          setIsSearchOpen(true);
        }}
        onKeyDown={handleScanEnter}
        placeholder="🔍 Scan barcode or search products by name, SKU, brand to add..."
        className="w-full py-2.5 px-3.5 rounded-lg border-[1.5px] border-emerald-600 text-sm outline-none bg-white box-border focus:ring-2 focus:ring-emerald-200"
      />

      {/* Floating Dropdown */}
      {isSearchOpen && filteredProducts.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-300 rounded-xl shadow-2xl max-h-[260px] overflow-y-auto p-1.5">
          {filteredProducts.map((prod) => {
            const isAdded = items.some((it) => it.product_id === prod.id);
            return (
              <div
                key={prod.id}
                onClick={() => {
                  addProduct(prod);
                  if (autoFocusEnabled) {
                    setTimeout(() => {
                      const active = document.activeElement;
                      const isOtherInputFocused =
                        active &&
                        active !== document.body &&
                        active !== searchInputRef.current &&
                        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT');
                      if (!isOtherInputFocused) {
                        searchInputRef.current?.focus();
                      }
                    }, 50);
                  }
                }}
                className={`flex justify-between items-center py-2 px-3 rounded-md cursor-pointer text-sm transition-colors ${
                  isAdded ? 'bg-emerald-50' : 'hover:bg-slate-100 bg-transparent'
                }`}
              >
                <div>
                  <strong className="text-slate-900">{fullCatalogName(prod)}</strong>
                  <span className="text-xs text-slate-500 ml-2">
                    SKU: {prod.sku || 'N/A'} · Stock: {prod.stock || 0}
                  </span>
                  {Number(prod.stock || 0) <= 0 && (
                    <span className="text-[0.7rem] text-rose-700 font-bold ml-2">
                      Out of stock
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-600">
                    {taka(prod.sale_price ?? prod.salePrice ?? prod.selling_price ?? prod.purchase_price ?? 0)}
                  </span>
                  {isAdded && (
                    <span className="text-[0.72rem] text-emerald-600 font-bold bg-emerald-100 py-0.5 px-1.5 rounded">
                      ✓ Added
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {searchError && (
        <div className="mt-1.5 py-2 px-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold">
          ⚠️ {searchError}
        </div>
      )}
    </div>
  );
}
