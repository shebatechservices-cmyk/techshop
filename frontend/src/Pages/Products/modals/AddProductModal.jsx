import React from "react";
import API_BASE from "../../../services/api";

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

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-product-title"
    >
      <div className="bg-white w-full max-w-3xl rounded-2xl p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
        {/* Modal Heading */}
        <div className="flex justify-between items-center pb-4 mb-5 border-b border-slate-200">
          <div>
            <h2 id="add-product-title" className="text-xl font-extrabold text-slate-900">
              {editingProductId ? "Edit Product" : "Add Product"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {editingProductId
                ? "Update product specifications and settings in catalog"
                : "Fill in product specifications to register into catalog"}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Live Preview Bar */}
          <div
            className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl border flex items-center justify-center text-center text-sm font-bold transition-all shadow-xs ${
              livePreviewTitle
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-slate-50 border-slate-200 text-slate-400"
            }`}
            aria-live="polite"
          >
            {livePreviewTitle || "Product title will preview here as you select options below..."}
          </div>

          {/* Cascading Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>Category</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-1.5">
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                  onClick={() => openQuickAddModal("categories")}
                  title="Add new category"
                  className="w-9 h-9 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer text-base"
                >
                  +
                </button>
              </div>
            </div>

            {/* Sub-Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>Sub-category</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-1.5">
                <select
                  value={selectedSubCategory}
                  disabled={!selectedCategory}
                  onChange={handleSubCategoryChange}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:opacity-60"
                  required
                >
                  <option value="">
                    {selectedCategory ? "Select sub-category" : "Select category first"}
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
                  onClick={() => openQuickAddModal("sub_categories")}
                  title={selectedCategory ? "Add new sub-category" : "Select category first"}
                  className="w-9 h-9 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-base"
                >
                  +
                </button>
              </div>
            </div>

            {/* Brand */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>Brand</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-1.5">
                <select
                  value={selectedBrand}
                  disabled={!selectedSubCategory}
                  onChange={handleBrandChange}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:opacity-60"
                  required
                >
                  <option value="">
                    {selectedSubCategory ? "Select brand" : "Select sub-category first"}
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
                  onClick={() => openQuickAddModal("brands")}
                  title={selectedSubCategory ? "Add new brand" : "Select sub-category first"}
                  className="w-9 h-9 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-base"
                >
                  +
                </button>
              </div>
            </div>

            {/* Product Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>Product Name / Item Type</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-1.5">
                <select
                  name="name"
                  value={form.name}
                  disabled={!selectedBrand}
                  onChange={handleProductNameChange}
                  required
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:opacity-60"
                >
                  <option value="">
                    {selectedBrand ? "Select product name" : "Select brand first"}
                  </option>
                  {form.name && !productNames.some((item) => item.name === form.name) && (
                    <option value={form.name}>{form.name}</option>
                  )}
                  {productNames.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedBrand}
                  onClick={() => openQuickAddModal("product_name")}
                  title={selectedBrand ? "Add new product name" : "Select brand first"}
                  className="w-9 h-9 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-base"
                >
                  +
                </button>
              </div>
            </div>

            {/* Model */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>Model</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-1.5">
                <select
                  value={selectedModel}
                  disabled={!form.name}
                  onChange={handleModelChange}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:opacity-60"
                  required
                >
                  <option value="">
                    {form.name ? "Select model" : "Select product name first"}
                  </option>
                  {selectedModel && !models.some((m) => String(m.id) === String(selectedModel)) && (
                    <option value={selectedModel}>Current Model</option>
                  )}
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!form.name}
                  onClick={() => openQuickAddModal("models")}
                  title={form.name ? "Add new model" : "Select product name first"}
                  className="w-9 h-9 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-base"
                >
                  +
                </button>
              </div>
            </div>

            {/* Series */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>Series</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-1.5">
                <select
                  value={selectedSeries}
                  disabled={!selectedModel}
                  onChange={handleSeriesChange}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:opacity-60"
                  required
                >
                  <option value="">
                    {selectedModel ? "Select series" : "Select model first"}
                  </option>
                  {selectedSeries && !series.some((s) => String(s.id) === String(selectedSeries)) && (
                    <option value={selectedSeries}>Current Series</option>
                  )}
                  {series.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedModel}
                  onClick={() => openQuickAddModal("series")}
                  title={selectedModel ? "Add new series" : "Select model first"}
                  className="w-9 h-9 border border-sky-300 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-base"
                >
                  +
                </button>
              </div>
            </div>

            {/* SKU */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">SKU (Auto Generated)</label>
              <div className="flex gap-1.5">
                <input
                  name="sku"
                  value={form.sku}
                  onChange={handleFieldChange}
                  placeholder="e.g. SKU-123456"
                  required
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, sku: generateAutoSku() }))}
                  title="Generate New SKU Code"
                  className="px-3 border border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer text-sm font-bold"
                >
                  🎲
                </button>
              </div>
            </div>

            {/* Min Stock */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Condition */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Condition</label>
              <select
                name="condition"
                value={form.condition}
                onChange={handleFieldChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option>New</option>
                <option>Used</option>
                <option>Refurbished</option>
              </select>
            </div>
          </div>

          {/* Image Uploads */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-200">
            {/* Feature Image */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                📸 Feature Image (Inventory & POS)
              </label>
              <input
                key={`feat-${fileInputKey}`}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={(event) => setFeatureImageFile(event.target.files?.[0] || null)}
                className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
              />
              <small className="text-[11px] text-slate-400">
                Format: JPG, PNG, or WebP | Max 2MB (1:1 square)
              </small>
              {(featureImagePreview || form.image_url) && (
                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1">
                  <img
                    src={
                      featureImagePreview ||
                      (form.image_url.startsWith("http")
                        ? form.image_url
                        : `${API_BASE}${form.image_url}`)
                    }
                    alt="Feature Preview"
                    className="w-12 h-12 object-cover rounded-md border border-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Uploaded</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFeatureImageFile(null);
                        setFeatureImagePreview(null);
                        setForm((p) => ({ ...p, image_url: "" }));
                        setFileInputKey((k) => k + 1);
                      }}
                      className="text-[11px] text-rose-600 hover:underline font-semibold"
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Gallery Images */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                🖼️ Gallery Images (E-Commerce)
              </label>
              <input
                key={`gal-${fileInputKey}`}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                multiple
                onChange={(event) => setGalleryImageFiles(Array.from(event.target.files || []))}
                className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
              />
              <small className="text-[11px] text-slate-400">Multiple product angles for online shop</small>
              {galleryImagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {galleryImagePreviews.map((previewUrl, idx) => (
                    <div key={idx} className="relative w-11 h-11">
                      <img
                        src={previewUrl}
                        alt={`Gallery ${idx + 1}`}
                        className="w-full h-full object-cover rounded border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setGalleryImageFiles((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold shadow-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-xs font-bold text-slate-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleFieldChange}
              rows={2}
              placeholder="Product specifications, key highlights, etc."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          {/* Tracking Options */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            {/* Serial / Barcode Tracking */}
            <label
              className={`flex justify-between items-center p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                form.is_serial_required || form.isSerialRequired || form.tracks_serial
                  ? "bg-emerald-50/70 border-emerald-300"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div>
                <strong
                  className={
                    form.is_serial_required || form.isSerialRequired || form.tracks_serial
                      ? "text-emerald-900"
                      : "text-slate-800"
                  }
                >
                  📦 Requires Serial / Barcode Tracking
                </strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Strictly enforced in Purchase & Sale forms. Auto-calculates quantities from barcode scans.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(
                  form.is_serial_required ||
                    form.isSerialRequired ||
                    form.tracks_serial ||
                    form.is_serial_tracked
                )}
                onChange={(e) => {
                  const val = e.target.checked;
                  setForm((current) => ({
                    ...current,
                    is_serial_required: val,
                    is_serial_tracked: val,
                    isSerialRequired: val,
                    tracks_serial: val,
                  }));
                }}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </label>

            {/* Warranty Tracking */}
            <label
              className={`flex justify-between items-center p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                form.is_warranty_required || form.isWarrantyRequired
                  ? "bg-blue-50/70 border-blue-300"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div>
                <strong
                  className={
                    form.is_warranty_required || form.isWarrantyRequired
                      ? "text-blue-900"
                      : "text-slate-800"
                  }
                >
                  🛡️ Requires Warranty Tracking
                </strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Enforces warranty duration in Purchase and prints warranty policy on Customer Invoices.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(
                  form.is_warranty_required ||
                    form.isWarrantyRequired ||
                    Number(form.warranty_months || 0) > 0
                )}
                onChange={(e) => {
                  const val = e.target.checked;
                  setForm((current) => ({
                    ...current,
                    is_warranty_required: val,
                    isWarrantyRequired: val,
                    warranty_months: val
                      ? Number(current.warranty_months || 0) > 0
                        ? current.warranty_months
                        : "12"
                      : "0",
                  }));
                }}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            {/* Warranty Duration Input */}
            {(form.isWarrantyRequired || Number(form.warranty_months || 0) > 0) && (
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 flex items-center justify-between gap-3 text-xs">
                <span className="font-bold text-blue-900">Default Warranty Duration:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    value={form.warranty_months || ""}
                    onChange={(e) => setForm((c) => ({ ...c, warranty_months: e.target.value }))}
                    placeholder="12"
                    className="w-20 px-2.5 py-1 rounded-md border border-blue-300 bg-white text-center font-bold text-xs"
                  />
                  <span className="font-semibold text-slate-600">Months</span>
                </div>
              </div>
            )}
          </div>

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
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                {editingProductId ? "Save Edit" : "Add Product"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
