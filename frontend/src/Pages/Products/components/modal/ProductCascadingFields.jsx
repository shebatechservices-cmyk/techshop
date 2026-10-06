import React from "react";
import SearchableSelect from "../../../../components/shared/SearchableSelect";

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

  const filteredProductNames = React.useMemo(() => {
    return productNames.filter((item) => String(item.brand_id) === String(selectedBrand));
  }, [productNames, selectedBrand]);

  const filteredModels = React.useMemo(() => {
    return models.filter((model) => String(model.brand_id) === String(selectedBrand));
  }, [models, selectedBrand]);

  const filteredSeries = React.useMemo(() => {
    return series.filter((item) => !selectedBrand || String(item.brand_id) === String(selectedBrand));
  }, [series, selectedBrand]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
          <span>Category</span>
          <span className="text-rose-500">*</span>
        </label>
        <div className="flex gap-2">
          <SearchableSelect
            name="category_id"
            value={selectedCategory}
            onChange={handleCategoryChange}
            options={categories}
            placeholder="Select category"
            searchPlaceholder="Search category..."
            required
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openQuickAddModal("categories");
            }}
            title="Add new category"
            className="w-10 h-10 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer text-lg shrink-0"
          >
            +
          </button>
        </div>
      </div>

      {/* Sub-Category */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
          <span>Sub-category</span>
          <span className="text-rose-500">*</span>
        </label>
        <div className="flex gap-2">
          <SearchableSelect
            name="sub_category_id"
            value={selectedSubCategory}
            disabled={!selectedCategory}
            disabledPlaceholder="Select category first"
            onChange={handleSubCategoryChange}
            options={catalogSubCategories}
            placeholder={
              catalogSubCategories.length === 0
                ? "No sub-categories (click + to add)"
                : "Select sub-category"
            }
            searchPlaceholder="Search sub-category..."
            required
          />
          <button
            type="button"
            disabled={!selectedCategory}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openQuickAddModal("sub_categories", { parentName: activeCategory?.name, parentType: "Category" });
            }}
            title={selectedCategory ? `Add new sub-category for ${activeCategory?.name || 'selected category'}` : "Select category first"}
            className="w-10 h-10 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-lg shrink-0"
          >
            +
          </button>
        </div>
      </div>

      {/* Brand */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
          <span>Brand</span>
          <span className="text-rose-500">*</span>
        </label>
        <div className="flex gap-2">
          <SearchableSelect
            name="brand_id"
            value={selectedBrand}
            disabled={!selectedSubCategory}
            disabledPlaceholder="Select sub-category first"
            onChange={handleBrandChange}
            options={catalogBrands}
            placeholder={
              catalogBrands.length === 0
                ? "No brands (click + to add)"
                : "Select brand"
            }
            searchPlaceholder="Search brand..."
            required
          />
          <button
            type="button"
            disabled={!selectedSubCategory}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openQuickAddModal("brands", { parentName: activeSubCategory?.name, parentType: "Sub-category" });
            }}
            title={selectedSubCategory ? `Add new brand for ${activeSubCategory?.name || 'selected sub-category'}` : "Select sub-category first"}
            className="w-10 h-10 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-lg shrink-0"
          >
            +
          </button>
        </div>
      </div>

      {/* Product Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
          <span>Product Name / Item Type</span>
          <span className="text-rose-500">*</span>
        </label>
        <div className="flex gap-2">
          <SearchableSelect
            name="name"
            value={form.name || ""}
            valueKey="name"
            labelKey="name"
            disabled={!selectedBrand}
            disabledPlaceholder="Select brand first"
            onChange={handleProductNameChange}
            options={filteredProductNames}
            placeholder={
              filteredProductNames.length === 0
                ? "No product names for this brand (click + to add)"
                : "Select product name"
            }
            searchPlaceholder="Search product name..."
            required
          />
          <button
            type="button"
            disabled={!selectedBrand}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openQuickAddModal("product_names", { parentName: activeBrand?.name, parentType: "Brand" });
            }}
            title={selectedBrand ? `Add new product name for ${activeBrand?.name || 'selected brand'}` : "Select brand first"}
            className="w-10 h-10 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-lg shrink-0"
          >
            +
          </button>
        </div>
      </div>

      {/* Model */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
          <span>Model</span>
          <span className="text-rose-500">*</span>
        </label>
        <div className="flex gap-2">
          <SearchableSelect
            name="model_id"
            value={selectedModel}
            disabled={!selectedBrand || !form.name}
            disabledPlaceholder={
              !selectedBrand
                ? "Select brand first"
                : !form.name
                ? "Select product name first"
                : "Select model"
            }
            onChange={handleModelChange}
            options={filteredModels}
            placeholder={
              filteredModels.length === 0
                ? "No models for this brand (click + to add)"
                : "Select model"
            }
            searchPlaceholder="Search model..."
            required
          />
          <button
            type="button"
            disabled={!selectedBrand || !form.name}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openQuickAddModal("models", { parentName: activeProductName || activeBrand?.name, parentType: "Product Name" });
            }}
            title={
              !selectedBrand
                ? "Select brand first"
                : !form.name
                ? "Select product name first"
                : `Add new model for ${activeProductName || 'selected product'}`
            }
            className="w-10 h-10 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-lg shrink-0"
          >
            +
          </button>
        </div>
      </div>

      {/* Series */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
          <span>Series</span>
          <span className="text-rose-500">*</span>
        </label>
        <div className="flex gap-2">
          <SearchableSelect
            name="series_id"
            value={selectedSeries}
            disabled={!selectedModel}
            disabledPlaceholder="Select model first"
            onChange={handleSeriesChange}
            options={filteredSeries}
            placeholder={
              filteredSeries.length === 0
                ? "No series for this brand (click + to add)"
                : "Select series"
            }
            searchPlaceholder="Search series..."
            required
          />
          <button
            type="button"
            disabled={!selectedModel}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openQuickAddModal("series", { parentName: activeBrand?.name || activeModel?.name, parentType: "Brand" });
            }}
            title={selectedBrand ? `Add new series for ${activeBrand?.name || 'selected brand'}` : "Select brand first"}
            className="w-10 h-10 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-lg shrink-0"
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
