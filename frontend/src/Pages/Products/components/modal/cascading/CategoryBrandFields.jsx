import React from "react";
import SearchableSelect from "../../../../../components/shared/SearchableSelect";

export default function CategoryBrandFields({
  categories = [],
  catalogSubCategories = [],
  catalogBrands = [],
  selectedCategory,
  selectedSubCategory,
  selectedBrand,
  handleCategoryChange,
  handleSubCategoryChange,
  handleBrandChange,
  openQuickAddModal,
}) {
  const activeCategory = categories.find((c) => String(c.id) === String(selectedCategory));
  const activeSubCategory = catalogSubCategories.find((s) => String(s.id) === String(selectedSubCategory));

  return (
    <>
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
    </>
  );
}
