import React, { useState } from "react";
import ManageUomModal from "../modals/ManageUomModal";

export default function CategoriesAttributesTab({
  categories = [],
  subCategories = [],
  brands = [],
  productNames = [],
  models = [],
  series = [],
  showAttributeAdd,
  setShowAttributeAdd,
  attributeDraft,
  setAttributeDraft,
  attributeError,
  setAttributeError,
  saveAttributeItem,
  openQuickEditModal,
  openQuickAddModal,
  deleteAttribute,
}) {
  const [isManageUomOpen, setIsManageUomOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntityFilter, setSelectedEntityFilter] = useState("ALL");

  const totalAttributesCount =
    categories.length +
    subCategories.length +
    brands.length +
    productNames.length +
    models.length +
    series.length;

  const panels = [
    {
      entity: "categories",
      title: "Categories",
      description: "Primary department or product classification group",
      items: categories,
      accentBorder: "border-t-amber-500",
    },
    {
      entity: "sub_categories",
      title: "Sub-categories",
      description: "Inner sub-grouping under main categories",
      items: subCategories,
      accentBorder: "border-t-teal-500",
    },
    {
      entity: "brands",
      title: "Brands",
      description: "Manufacturers and brand partners",
      items: brands,
      accentBorder: "border-t-blue-500",
    },
    {
      entity: "product_names",
      title: "Product Names",
      description: "Base product name / core equipment types",
      items: productNames,
      accentBorder: "border-t-emerald-500",
    },
    {
      entity: "models",
      title: "Models",
      description: "Specific hardware models per brand",
      items: models,
      accentBorder: "border-t-purple-500",
    },
    {
      entity: "series",
      title: "Series",
      description: "Product family or collection lines",
      items: series,
      accentBorder: "border-t-orange-500",
    },
  ];

  const getParentContext = (entity, item) => {
    if (entity === "sub_categories") {
      const parent = categories.find((c) => String(c.id) === String(item.category_id));
      return parent
        ? { label: "Category", name: parent.name }
        : item.category_name
        ? { label: "Category", name: item.category_name }
        : null;
    }
    if (entity === "brands") {
      const parent = subCategories.find((s) => String(s.id) === String(item.sub_category_id));
      return parent
        ? { label: "Sub-category", name: parent.name }
        : item.sub_category_name
        ? { label: "Sub-category", name: item.sub_category_name }
        : null;
    }
    if (entity === "product_names") {
      const parent = brands.find((b) => String(b.id) === String(item.brand_id));
      return parent
        ? { label: "Brand", name: parent.name }
        : item.brand_name
        ? { label: "Brand", name: item.brand_name }
        : null;
    }
    if (entity === "models") {
      const parent = brands.find((b) => String(b.id) === String(item.brand_id));
      return parent
        ? { label: "Brand", name: parent.name }
        : item.brand_name
        ? { label: "Brand", name: item.brand_name }
        : null;
    }
    if (entity === "series") {
      const parent = models.find((m) => String(m.id) === String(item.model_id));
      return parent
        ? { label: "Model", name: parent.name }
        : item.model_name
        ? { label: "Model", name: item.model_name }
        : null;
    }
    return null;
  };

  const getFilteredItems = (entity, items) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const name = (item.name || "").toLowerCase();
      const parent = getParentContext(entity, item);
      const parentName = (parent?.name || "").toLowerCase();
      return name.includes(q) || parentName.includes(q);
    });
  };

  const hasActiveFilters = Boolean(searchQuery.trim() || selectedEntityFilter !== "ALL");

  const handleResetAll = () => {
    setSearchQuery("");
    setSelectedEntityFilter("ALL");
  };

  const visiblePanels = panels.filter(
    (p) => selectedEntityFilter === "ALL" || p.entity === selectedEntityFilter
  );

  const totalFilteredCount = visiblePanels.reduce(
    (sum, p) => sum + getFilteredItems(p.entity, p.items).length,
    0
  );

  return (
    <div className="space-y-4">
      {/* Intro Heading & KPI Cards */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center flex-wrap gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-600 block mb-0.5">
            Master Data Catalog
          </span>
          <h2 className="text-lg font-extrabold text-slate-900">Categories & Attributes</h2>
          <p className="text-xs text-slate-500">
            Configure classifications, manufacturers, and hardware specifications for products.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsManageUomOpen(true)}
            className="bg-white hover:bg-sky-50 border border-sky-300 text-sky-700 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>📏</span>
            <span>Manage Units (UOM)</span>
          </button>
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedEntityFilter("ALL")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedEntityFilter === "ALL"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              All ({totalAttributesCount})
            </button>
            {panels.map((p) => (
              <button
                key={p.entity}
                type="button"
                onClick={() =>
                  setSelectedEntityFilter(selectedEntityFilter === p.entity ? "ALL" : p.entity)
                }
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  selectedEntityFilter === p.entity
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
                title={`Filter by ${p.title}`}
              >
                {p.title} ({p.items.length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
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

      {/* Grid of Attribute Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visiblePanels.map(({ entity, title, description, items, accentBorder }) => {
          const filteredItems = getFilteredItems(entity, items);
          const isSearching = Boolean(searchQuery.trim());

          return (
            <div
              key={entity}
              className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs border-t-4 ${accentBorder} flex flex-col justify-between`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
                    <p className="text-[11px] text-slate-500">{description}</p>
                  </div>
                  <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-md">
                    {isSearching ? `${filteredItems.length} / ${items.length}` : items.length}
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 my-3">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => {
                      const parentContext = getParentContext(entity, item);

                      return (
                        <div
                          key={item.id}
                          className="flex justify-between items-center px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100 text-xs hover:bg-slate-100/70 transition-colors"
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="font-semibold text-slate-800 truncate">
                              {item.name}
                            </span>
                            {parentContext && (
                              <span className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                                <span className="text-slate-400">{parentContext.label}:</span>
                                <span className="font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-100">
                                  {parentContext.name}
                                </span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => openQuickEditModal(entity, item)}
                              className="text-sky-600 hover:text-sky-800 text-[11px] font-bold cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteAttribute(entity, item)}
                              className="text-rose-500 hover:text-rose-700 text-[11px] font-bold cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs font-medium">
                      {isSearching ? `No matching ${title.toLowerCase()}` : "No items found"}
                    </div>
                  )}
                </div>
              </div>

              {/* Add Button or Inline Form */}
              {(entity === "categories" || entity === "sub_categories") && showAttributeAdd[entity] ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveAttributeItem(entity);
                  }}
                  className="space-y-2 pt-2 border-t border-slate-100 text-xs"
                >
                  {entity === "sub_categories" && (
                    <select
                      value={attributeDraft.sub_category_parent}
                      onChange={(e) =>
                        setAttributeDraft((prev) => ({
                          ...prev,
                          sub_category_parent: e.target.value,
                        }))
                      }
                      required
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    value={attributeDraft[entity]}
                    onChange={(e) =>
                      setAttributeDraft((prev) => ({ ...prev, [entity]: e.target.value }))
                    }
                    placeholder={entity === "categories" ? "New category name" : "New sub-category name"}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAttributeAdd((prev) => ({ ...prev, [entity]: false }));
                        setAttributeError("");
                      }}
                      className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  {attributeError && (
                    <p className="text-[11px] text-rose-600 font-bold">{attributeError}</p>
                  )}
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (entity === "categories" || entity === "sub_categories") {
                      setAttributeError("");
                      setShowAttributeAdd((prev) => ({ ...prev, [entity]: true }));
                    } else {
                      openQuickAddModal(entity);
                    }
                  }}
                  className="w-full py-2 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 text-slate-700 font-bold text-xs rounded-xl border border-dashed border-slate-300 transition-colors cursor-pointer mt-2"
                >
                  + Add {title.endsWith("ies") ? title.slice(0, -3) + "y" : title.slice(0, -1)}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Standalone Manage UOM Modal */}
      <ManageUomModal
        isOpen={isManageUomOpen}
        onClose={() => setIsManageUomOpen(false)}
      />
    </div>
  );
}
