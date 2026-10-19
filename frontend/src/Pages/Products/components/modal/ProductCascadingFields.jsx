import React from "react";
import CategoryBrandFields from "./cascading/CategoryBrandFields";
import ModelSeriesFields from "./cascading/ModelSeriesFields";
import ProductMetaFields from "./cascading/ProductMetaFields";

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
  const activeBrand = catalogBrands.find((b) => String(b.id) === String(selectedBrand));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <CategoryBrandFields
        categories={categories}
        catalogSubCategories={catalogSubCategories}
        catalogBrands={catalogBrands}
        selectedCategory={selectedCategory}
        selectedSubCategory={selectedSubCategory}
        selectedBrand={selectedBrand}
        handleCategoryChange={handleCategoryChange}
        handleSubCategoryChange={handleSubCategoryChange}
        handleBrandChange={handleBrandChange}
        openQuickAddModal={openQuickAddModal}
      />

      <ModelSeriesFields
        productNames={productNames}
        models={models}
        series={series}
        selectedBrand={selectedBrand}
        selectedModel={selectedModel}
        selectedSeries={selectedSeries}
        form={form}
        handleProductNameChange={handleProductNameChange}
        handleModelChange={handleModelChange}
        handleSeriesChange={handleSeriesChange}
        openQuickAddModal={openQuickAddModal}
        activeBrand={activeBrand}
      />

      <ProductMetaFields
        form={form}
        setForm={setForm}
        handleFieldChange={handleFieldChange}
        generateAutoSku={generateAutoSku}
      />
    </div>
  );
}
