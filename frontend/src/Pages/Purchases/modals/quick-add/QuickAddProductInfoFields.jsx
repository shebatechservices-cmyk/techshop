import React from 'react';

export default function QuickAddProductInfoFields({
  formData,
  categories,
  brands,
  handleChange,
}) {
  return (
    <>
      {/* Product Name */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Product Name *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g. AC1200 Dual Band Gigabit Router"
          className="w-full py-2 px-3 rounded-lg border-[1.5px] border-slate-300 focus:border-sky-500 focus:outline-none text-sm box-border"
        />
      </div>

      {/* Category & Brand */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Category
          </label>
          <input
            type="text"
            list="category-options"
            value={formData.category_name}
            onChange={(e) => handleChange('category_name', e.target.value)}
            placeholder="e.g. Routers / Networking"
            className="w-full py-2 px-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:outline-none text-sm box-border"
          />
          <datalist id="category-options">
            {categories.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Brand
          </label>
          <input
            type="text"
            list="brand-options"
            value={formData.brand_name}
            onChange={(e) => handleChange('brand_name', e.target.value)}
            placeholder="e.g. TP-Link, Netis, Dahua"
            className="w-full py-2 px-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:outline-none text-sm box-border"
          />
          <datalist id="brand-options">
            {brands.map((b) => (
              <option key={b.id} value={b.name} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Model & Series */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Model
          </label>
          <input
            type="text"
            value={formData.model_name}
            onChange={(e) => handleChange('model_name', e.target.value)}
            placeholder="e.g. Archer C6, NC21"
            className="w-full py-2 px-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:outline-none text-sm box-border"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Series
          </label>
          <input
            type="text"
            value={formData.series_name}
            onChange={(e) => handleChange('series_name', e.target.value)}
            placeholder="e.g. Pro, V4, Gigabit"
            className="w-full py-2 px-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:outline-none text-sm box-border"
          />
        </div>
      </div>
    </>
  );
}
