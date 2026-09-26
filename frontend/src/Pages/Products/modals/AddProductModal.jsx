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
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-product-title"
    >
      <div className="bg-white w-full max-w-3xl rounded-2xl p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
        {/* Modal Heading */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-200">
          <div>
            <h2 id="add-product-title" className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>{editingProductId ? "Edit Item" : "Add New Item"}</span>
              {isBundle && (
                <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
                  🎁 Bundle Kit Package
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {editingProductId
                ? "Update product specifications and settings in catalog"
                : "Fill in product specifications or bundle components to register into catalog"}
            </p>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Product Type Tabs (Standard vs Bundle Kit) */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl mb-4 text-xs font-bold gap-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, is_bundle: false }))}
            className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              !isBundle
                ? "bg-white text-sky-700 shadow-sm border border-slate-200 font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <span className="text-sm">📦</span>
            <span>Standard Product (Single SKU)</span>
          </button>
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, is_bundle: true }))}
            className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isBundle
                ? "bg-purple-600 text-white shadow-sm font-extrabold"
                : "text-purple-700 hover:text-purple-900 hover:bg-purple-100/60 font-bold"
            }`}
          >
            <span className="text-sm">🎁</span>
            <span>Bundle / Kit Package (Combine Items)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Live Preview Bar */}
          {!isBundle && (
            <div
              className={`w-full min-h-[40px] px-4 py-2 rounded-xl border flex items-center justify-center text-center text-xs font-bold transition-all shadow-xs ${
                livePreviewTitle
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-slate-50 border-slate-200 text-slate-400"
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
          <div className="flex justify-between items-center pt-4 border-t border-slate-200 flex-wrap gap-3">
            <button
              type="button"
              onClick={handleResetForm}
              title="Reset all form fields"
              className="px-3 py-1.5 border border-slate-300 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 text-slate-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              🧹 Clear Fields
            </button>

            <div className="flex items-center gap-2">
              {saveError && <span className="text-xs text-rose-600 font-bold mr-2">{saveError}</span>}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  handleResetForm();
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-5 py-2 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer ${
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
