import React from "react";
import ProductCatalogKpiCards from "./catalog/ProductCatalogKpiCards";
import ProductCatalogFilterBar from "./catalog/ProductCatalogFilterBar";
import ProductCatalogTableRow from "./catalog/ProductCatalogTableRow";
import ProductCatalogPagination from "./catalog/ProductCatalogPagination";

export default function ProductCatalogTab({
  products = [],
  filteredProducts = [],
  visibleProducts = [],
  selectedProductIds = [],
  productFilterQuery = "",
  setProductFilterQuery,
  categoryFilter = "ALL",
  setCategoryFilter,
  statusFilter = "ALL",
  setStatusFilter,
  categoriesList = [],
  resetFilters,
  currentPage = 1,
  setCurrentPage,
  totalProductPages = 1,
  openProductAction,
  setOpenProductAction,
  toggleProduct,
  toggleAllProducts,
  deleteProduct,
  toggleProductStatus,
  handleEditProduct,
  productLabel,
  saveSuccess,
}) {
  const hasActiveFilters = Boolean(
    (productFilterQuery && productFilterQuery.trim()) ||
    (categoryFilter && categoryFilter !== "ALL") ||
    (statusFilter && statusFilter !== "ALL")
  );

  const handleResetAll = () => {
    if (resetFilters) {
      resetFilters();
    } else {
      setProductFilterQuery?.("");
      setCategoryFilter?.("ALL");
      setStatusFilter?.("ALL");
      setCurrentPage?.(1);
    }
  };

  return (
    <div className="space-y-4">
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold shadow-xs">
          {saveSuccess}
        </div>
      )}

      {/* Summary KPI Cards */}
      <ProductCatalogKpiCards
        products={products}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Search & Filter Toolbar */}
      <ProductCatalogFilterBar
        productFilterQuery={productFilterQuery}
        setProductFilterQuery={setProductFilterQuery}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        categoriesList={categoriesList}
        setCurrentPage={setCurrentPage}
        hasActiveFilters={hasActiveFilters}
        handleResetAll={handleResetAll}
        filteredProducts={filteredProducts}
        products={products}
      />

      {/* Main Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={
                      visibleProducts.length > 0 &&
                      visibleProducts.every((p) => selectedProductIds.includes(p.id))
                    }
                    onChange={toggleAllProducts}
                    className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 w-12">Image</th>
                <th className="py-3 px-3.5 min-w-[200px]">Product Details</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Sub-category</th>
                <th className="py-3 px-3 text-center">Serial Tracked</th>
                <th className="py-3 px-3 text-center">Warranty</th>
                <th className="py-3 px-3 text-right">Stock / Min</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleProducts.length > 0 ? (
                visibleProducts.map((product) => (
                  <ProductCatalogTableRow
                    key={product.id}
                    product={product}
                    isSelected={selectedProductIds.includes(product.id)}
                    onToggleSelect={toggleProduct}
                    productLabel={productLabel}
                    handleEditProduct={handleEditProduct}
                    deleteProduct={deleteProduct}
                    toggleProductStatus={toggleProductStatus}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-16 text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">🔍</span>
                      <p className="font-bold text-slate-700 text-sm">No products found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {hasActiveFilters
                          ? "No products match your current search query or filter criteria. Try adjusting your filters or search terms."
                          : "No products registered in the catalog yet."}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetAll}
                          className="mt-2 px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold hover:bg-sky-100 cursor-pointer transition-colors shadow-xs"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <ProductCatalogPagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalProductPages={totalProductPages}
        />
      </div>
    </div>
  );
}
