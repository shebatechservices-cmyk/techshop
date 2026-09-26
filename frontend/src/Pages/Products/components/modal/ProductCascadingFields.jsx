import React from "react";

export default function ProductCascadingFields({
  categories = [],
  catalogSubCategories = [],
  catalogBrands = [],
  productNames = [],
  models = [],
  series = [],
  selectedCategory,
  selectedSubCategory,
  selectedBrand,
  selectedModel,
  selectedSeries,
  form,
  setForm,
  handleFieldChange,
  handleCategoryChange,
  handleSubCategoryChange,
  handleBrandChange,
  handleProductNameChange,
  handleModelChange,
  handleSeriesChange,
  openQuickAddModal,
  generateAutoSku,
}) {
  const activeCategory = categories.find((c) => String(c.id) === String(selectedCategory));
  const activeSubCategory = catalogSubCategories.find((s) => String(s.id) === String(selectedSubCategory));
  const activeBrand = catalogBrands.find((b) => String(b.id) === String(selectedBrand));
  const activeProductName = form.name || "";
  const activeModel = models.find((m) => String(m.id) === String(selectedModel));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
          <span>Category</span>
          <span className="text-rose-500">*</span>
        </label>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
            required
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openQuickAddModal("categories");
            }}
            title="Add new category"
            className="w-10 h-10 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer text-lg"
          >
            +
          </button>
        </div>
      </div>

      {/* Sub-Category */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5 flex-wrap">
          <span>Sub-category</span>
          {activeCategory?.name && (
            <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 animate-fadeIn">
              ({activeCategory.name})
            </span>
          )}
          <span className="text-rose-500">*</span>
        </label>
        <div className="flex gap-2">
          <select
            value={selectedSubCategory}
            disabled={!selectedCategory}
            onChange={handleSubCategoryChange}
            className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:opacity-60 text-slate-800"
            required
          >
            <option value="">
              {!selectedCategory
                ? "Select category first"
                : catalogSubCategories.length === 0
                ? "No sub-categories (click + to add)"
                : "Select sub-category"}
            </option>
            {catalogSubCategories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selectedCategory}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openQuickAddModal("sub_categories");
            }}
            title={selectedCategory ? `Add new sub-category for ${activeCategory?.name || 'selected category'}` : "Select category first"}
            className="w-10 h-10 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-lg"
          >
            +
          </button>
        </div>
      </div>

      {/* Brand */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5 flex-wrap">
          <span>Brand</span>
          {activeSubCategory?.name && (
            <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 animate-fadeIn">
              ({activeSubCategory.name})
            </span>
          )}
          <span className="text-rose-500">*</span>
        </label>
        <div className="flex gap-2">
          <select
            value={selectedBrand}
            disabled={!selectedSubCategory}
            onChange={handleBrandChange}
            className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:opacity-60 text-slate-800"
            required
          >
            <option value="">
              {!selectedSubCategory
                ? "Select sub-category first"
                : catalogBrands.length === 0
                ? "No brands (click + to add)"
                : "Select brand"}
            </option>
            {catalogBrands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selectedSubCategory}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openQuickAddModal("brands");
            }}
            title={selectedSubCategory ? `Add new brand for ${activeSubCategory?.name || 'selected sub-category'}` : "Select sub-category first"}
            className="w-10 h-10 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-lg"
          >
            +
          </button>
        </div>
      </div>

      {/* Product Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5 flex-wrap">
          <span>Product Name / Item Type</span>
          {activeBrand?.name && (
            <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 animate-fadeIn">
              ({activeBrand.name})
            </span>
          )}
          <span className="text-rose-500">*</span>
        </label>
        <div className="flex gap-2">
          <select
            name="name"
            value={form.name || ""}
            disabled={!selectedBrand}
            onChange={handleProductNameChange}
            required
            className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:opacity-60 text-slate-800"
          >
            <option value="">
              {!selectedBrand
                ? "Select brand first"
                : productNames.length === 0
                ? "No product names for this brand (click + to add)"
                : "Select product name"}
            </option>
            {productNames
              .filter((item) => String(item.brand_id) === String(selectedBrand))
              .map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            disabled={!selectedBrand}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openQuickAddModal("product_names");
            }}
            title={selectedBrand ? `Add new product name for ${activeBrand?.name || 'selected brand'}` : "Select brand first"}
            className="w-10 h-10 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-lg"
          >
            +
          </button>
        </div>
      </div>

      {/* Model */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5 flex-wrap">
          <span>Model</span>
          {activeProductName && (
            <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 animate-fadeIn">
              ({activeProductName})
            </span>
          )}
          <span className="text-rose-500">*</span>
        </label>
        <div className="flex gap-2">
          <select
            value={selectedModel}
            disabled={!selectedBrand || !form.name}
            onChange={handleModelChange}
            className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:opacity-60 text-slate-800"
            required
          >
            <option value="">
              {!selectedBrand
                ? "Select brand first"
                : !form.name
                ? "Select product name first"
                : models.length === 0
                ? "No models for this brand (click + to add)"
                : "Select model"}
            </option>
            {models
              .filter((model) => String(model.brand_id) === String(selectedBrand))
              .map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            disabled={!selectedBrand || !form.name}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openQuickAddModal("models");
            }}
            title={
              !selectedBrand
                ? "Select brand first"
                : !form.name
                ? "Select product name first"
                : `Add new model for ${activeProductName || 'selected product'}`
            }
            className="w-10 h-10 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-lg"
          >
            +
          </button>
        </div>
      </div>

      {/* Series */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5 flex-wrap">
          <span>Series</span>
          {activeModel?.name && (
            <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 animate-fadeIn">
              ({activeModel.name})
            </span>
          )}
          <span className="text-rose-500">*</span>
        </label>
        <div className="flex gap-2">
          <select
            value={selectedSeries}
            disabled={!selectedModel}
            onChange={handleSeriesChange}
            className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:opacity-60 text-slate-800"
            required
          >
            <option value="">
              {!selectedModel
                ? "Select model first"
                : series.length === 0
                ? "No series for this model (click + to add)"
                : "Select series"}
            </option>
            {series
              .filter((item) => String(item.model_id) === String(selectedModel))
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            disabled={!selectedModel}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openQuickAddModal("series");
            }}
            title={selectedModel ? `Add new series for ${activeModel?.name || 'selected model'}` : "Select model first"}
            className="w-10 h-10 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-lg"
          >
            +
          </button>
        </div>
      </div>

      {/* SKU */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700">SKU (Auto Generated)</label>
        <div className="flex gap-2">
          <input
            name="sku"
            value={form.sku || ""}
            onChange={handleFieldChange}
            placeholder="e.g. SKU-123456"
            required
            className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-slate-800"
          />
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, sku: generateAutoSku() }))}
            title="Generate New SKU Code"
            className="px-3.5 border border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer text-base font-bold"
          >
            🎲
          </button>
        </div>
      </div>

      {/* Primary Barcode */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700">Main Barcode (Optional)</label>
        <input
          name="barcode"
          value={form.barcode || ""}
          onChange={handleFieldChange}
          placeholder="e.g. Box Barcode / Item Barcode"
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-slate-800"
        />
      </div>

      {/* Min Stock */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
          <span>Min Stock Alert (Low Stock Threshold)</span>
          <span className="text-rose-500">*</span>
        </label>
        <input
          type="number"
          name="min_stock"
          value={form.min_stock}
          onChange={handleFieldChange}
          min="0"
          required
          placeholder="e.g. 5"
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
        />
      </div>

      {/* Condition */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700">Condition</label>
        <select
          name="condition"
          value={form.condition}
          onChange={handleFieldChange}
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
        >
          <option>New</option>
          <option>Used</option>
          <option>Refurbished</option>
        </select>
      </div>
    </div>
  );
}
