import React from 'react';

export default function AttributeFilterToolbar({
  searchQuery,
  setSearchQuery,
  selectedEntityFilter,
  setSelectedEntityFilter,
  totalAttributesCount,
  categories,
  subCategories,
  brands,
  productNames,
  models,
  series,
  panels,
  hasActiveFilters,
  handleResetAll,
  totalFilteredCount,
}) {
  return (
    <>
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search attributes by name, category, brand, model, series..."
            className="w-full pl-10 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all outline-none font-medium text-slate-800 placeholder:text-slate-400"
            style={{ paddingLeft: '2.5rem' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer text-xs font-bold"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Dropdowns and Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium hidden lg:inline">Attribute Type:</span>
            <select
              value={selectedEntityFilter}
              onChange={(e) => setSelectedEntityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 outline-none cursor-pointer focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
            >
              <option value="ALL">All Attribute Types ({totalAttributesCount})</option>
              <option value="categories">Categories ({categories.length})</option>
              <option value="sub_categories">Sub-categories ({subCategories.length})</option>
              <option value="brands">Brands ({brands.length})</option>
              <option value="product_names">Product Names ({productNames.length})</option>
              <option value="models">Models ({models.length})</option>
              <option value="series">Series ({series.length})</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetAll}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Reset all filters"
            >
              <span>✕</span>
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Tags Indicator */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between p-3 bg-sky-50/70 border border-sky-200 rounded-xl text-xs text-sky-900 font-semibold shadow-xs flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Showing <strong>{totalFilteredCount}</strong> of <strong>{totalAttributesCount}</strong> attributes
            </span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-white border border-sky-300 text-sky-800 px-2 py-0.5 rounded-lg text-[11px] font-bold">
                Query: "{searchQuery}"
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="hover:text-rose-600 font-bold ml-0.5 cursor-pointer"
                  title="Remove query filter"
                >
                  ✕
                </button>
              </span>
            )}
            {selectedEntityFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 bg-white border border-sky-300 text-sky-800 px-2 py-0.5 rounded-lg text-[11px] font-bold">
                Type: {panels.find((p) => p.entity === selectedEntityFilter)?.title || selectedEntityFilter}
                <button
                  type="button"
                  onClick={() => setSelectedEntityFilter("ALL")}
                  className="hover:text-rose-600 font-bold ml-0.5 cursor-pointer"
                  title="Show all attribute types"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleResetAll}
            className="text-xs text-sky-700 hover:text-rose-600 font-bold underline cursor-pointer transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </>
  );
}
