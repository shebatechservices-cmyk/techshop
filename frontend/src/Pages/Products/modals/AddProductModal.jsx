import React from "react";
import BundleKitBuilder from "../components/modal/BundleKitBuilder";
import ProductCascadingFields from "../components/modal/ProductCascadingFields";
import ProductUomFormSection from "../components/modal/ProductUomFormSection";
import ProductMediaAndTrackingSection from "../components/modal/ProductMediaAndTrackingSection";

export default function AddProductModal({
  isOpen,
  editingProductId,
  onClose,
  categories,
  catalogSubCategories,
  catalogBrands,
  productNames,
  models,
  series,
  selectedCategory,
  selectedSubCategory,
  selectedBrand,
  selectedModel,
  selectedSeries,
  products = [],
  form,
  setForm,
  handleFieldChange,
  generateAutoSku,
  handleCategoryChange,
  handleSubCategoryChange,
  handleBrandChange,
  handleProductNameChange,
  handleModelChange,
  handleSeriesChange,
  openQuickAddModal,
  livePreviewTitle,
  featureImageFile,
  setFeatureImageFile,
  featureImagePreview,
  setFeatureImagePreview,
  galleryImageFiles,
  setGalleryImageFiles,
  galleryImagePreviews,
  fileInputKey,
  setFileInputKey,
  saveError,
  handleResetForm,
  handleSubmit,
}) {
  if (!isOpen) return null;

  const isBundle = Boolean(form.is_bundle);

  // Available components (exclude self and bundle items)
  const availableComponents = (products || []).filter(
    (p) => !p.is_bundle && (!editingProductId || p.id !== editingProductId)
  );

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-product-title"
    >
      <div className="bg-white w-full max-w-5xl rounded-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
        {/* Modal Heading */}
        <div className="flex justify-between items-center pb-4 mb-5 border-b border-slate-200">
          <div>
            <h2 id="add-product-title" className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
              <span>{editingProductId ? "Edit Item" : "Add New Item"}</span>
              {isBundle && (
                <span className="text-xs bg-purple-100 text-purple-700 font-bold px-3 py-1 rounded-full border border-purple-200">
                  🎁 Bundle Kit Package
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {editingProductId
                ? "Update product specifications and settings in catalog"
                : "Fill in product specifications or bundle components to register into catalog"}
            </p>
          </div>
          <button
            type="button"
            className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 flex items-center justify-center font-bold text-base transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Product Type Tabs (Standard vs Bundle Kit) */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl mb-5 text-sm font-bold gap-1.5 border border-slate-200">
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, is_bundle: false }))}
            className={`flex-1 py-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              !isBundle
                ? "bg-white text-sky-700 shadow-sm border border-slate-200 font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold"
            }`}
          >
            <span className="text-base">📦</span>
            <span>Standard Product (Single SKU)</span>
          </button>
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, is_bundle: true }))}
            className={`flex-1 py-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isBundle
                ? "bg-purple-600 text-white shadow-sm font-extrabold"
                : "text-purple-700 hover:text-purple-900 hover:bg-purple-100/60 font-semibold"
            }`}
          >
            <span className="text-base">🎁</span>
            <span>Bundle / Kit Package (Combine Items)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Live Preview Bar */}
          {!isBundle && (
            <div
              className={`w-full min-h-[44px] px-5 py-2.5 rounded-xl border flex items-center justify-center text-center text-sm font-bold transition-all shadow-xs ${
                livePreviewTitle
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-slate-50 border-slate-200 text-slate-400 font-medium"
              }`}
              aria-live="polite"
            >
              {livePreviewTitle || "Product title will preview here as you select options below..."}
            </div>
          )}

          {/* BUNDLE KIT BUILDER OR STANDARD PRODUCT FIELDS */}
          {isBundle ? (
            <BundleKitBuilder
              form={form}
              setForm={setForm}
              handleFieldChange={handleFieldChange}
              categories={categories}
              selectedCategory={selectedCategory}
              handleCategoryChange={handleCategoryChange}
              availableComponents={availableComponents}
            />
          ) : (
            <>
              <ProductCascadingFields
                categories={categories}
                catalogSubCategories={catalogSubCategories}
                catalogBrands={catalogBrands}
                productNames={productNames}
                models={models}
                series={series}
                selectedCategory={selectedCategory}
                selectedSubCategory={selectedSubCategory}
                selectedBrand={selectedBrand}
                selectedModel={selectedModel}
                selectedSeries={selectedSeries}
                form={form}
                setForm={setForm}
                handleFieldChange={handleFieldChange}
                handleCategoryChange={handleCategoryChange}
                handleSubCategoryChange={handleSubCategoryChange}
                handleBrandChange={handleBrandChange}
                handleProductNameChange={handleProductNameChange}
                handleModelChange={handleModelChange}
                handleSeriesChange={handleSeriesChange}
                openQuickAddModal={openQuickAddModal}
                generateAutoSku={generateAutoSku}
              />

              <ProductUomFormSection
                form={form}
                setForm={setForm}
                handleFieldChange={handleFieldChange}
              />
            </>
          )}

          {/* Media, Description & Tracking Options */}
          <ProductMediaAndTrackingSection
            form={form}
            setForm={setForm}
            handleFieldChange={handleFieldChange}
            featureImageFile={featureImageFile}
            setFeatureImageFile={setFeatureImageFile}
            featureImagePreview={featureImagePreview}
            setFeatureImagePreview={setFeatureImagePreview}
            galleryImageFiles={galleryImageFiles}
            setGalleryImageFiles={setGalleryImageFiles}
            galleryImagePreviews={galleryImagePreviews}
            fileInputKey={fileInputKey}
            setFileInputKey={setFileInputKey}
          />

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-5 border-t border-slate-200 flex-wrap gap-3">
            <button
              type="button"
              onClick={handleResetForm}
              title="Reset all form fields"
              className="px-4 py-2 border border-slate-300 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 text-slate-600 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              🧹 Clear Fields
            </button>

            <div className="flex items-center gap-3">
              {saveError && <span className="text-sm text-rose-600 font-bold mr-2">{saveError}</span>}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  handleResetForm();
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-6 py-2.5 text-white rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer ${
                  isBundle ? "bg-purple-600 hover:bg-purple-700" : "bg-sky-600 hover:bg-sky-700"
                }`}
              >
                {editingProductId ? "Save Edit" : isBundle ? "Register Bundle Kit" : "Add Product"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
