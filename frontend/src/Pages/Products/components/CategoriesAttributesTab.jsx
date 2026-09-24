import React from "react";

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

  return (
    <div className="space-y-4">
      {/* Intro Heading */}
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex-wrap gap-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-600 block mb-0.5">
            Master Data Catalog
          </span>
          <h2 className="text-lg font-extrabold text-slate-900">Categories & Attributes</h2>
          <p className="text-xs text-slate-500">
            Configure classifications, manufacturers, and hardware specifications for products.
          </p>
        </div>
        <span className="bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-xs">
          {totalAttributesCount} Total Attributes
        </span>
      </div>

      {/* Grid of Attribute Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {panels.map(({ entity, title, description, items, accentBorder }) => (
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
                  {items.length}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 my-3">
                {items.length > 0 ? (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100 text-xs hover:bg-slate-100/70 transition-colors"
                    >
                      <span className="font-semibold text-slate-800">
                        {item.name}
                        {entity === "sub_categories" && item.category_id ? (
                          <small className="text-slate-400 font-normal ml-1">
                            ({categories.find((c) => c.id === item.category_id)?.name || ""})
                          </small>
                        ) : null}
                      </span>
                      <div className="flex items-center gap-2">
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
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs font-medium">
                    No items found
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
        ))}
      </div>
    </div>
  );
}
