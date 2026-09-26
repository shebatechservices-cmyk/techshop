import React, { useState } from "react";
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
  const [componentProductId, setComponentProductId] = useState("");
  const [componentQty, setComponentQty] = useState(1);
  const [componentCustomPrice, setComponentCustomPrice] = useState("");

  if (!isOpen) return null;

  const isBundle = Boolean(form.is_bundle);

  // Available components (exclude self and bundle items)
  const availableComponents = (products || []).filter(
    (p) => !p.is_bundle && (!editingProductId || p.id !== editingProductId)
  );

  const handleAddComponent = () => {
    if (!componentProductId) return;
    const selectedProd = availableComponents.find((p) => String(p.id) === String(componentProductId));
    if (!selectedProd) return;

    const qty = Math.max(1, parseInt(componentQty) || 1);
    const unitPrice = componentCustomPrice !== "" ? Number(componentCustomPrice) : Number(selectedProd.selling_price || selectedProd.sale_price || 0);

    const existingIndex = (form.bundle_items || []).findIndex(
      (bi) => String(bi.product_id) === String(selectedProd.id)
    );

    let updatedList = [...(form.bundle_items || [])];
    if (existingIndex >= 0) {
      updatedList[existingIndex] = {
        ...updatedList[existingIndex],
        quantity: updatedList[existingIndex].quantity + qty,
        unit_price: unitPrice,
      };
    } else {
      updatedList.push({
        product_id: selectedProd.id,
        component_name: selectedProd.name,
        component_sku: selectedProd.sku,
        component_stock: selectedProd.stock || 0,
        quantity: qty,
        unit_price: unitPrice,
      });
    }

    setForm((prev) => {
      // Auto compute bundle selling price if not explicitly set
      const sumPrices = updatedList.reduce((acc, it) => acc + (Number(it.unit_price || 0) * Number(it.quantity || 1)), 0);
      return {
        ...prev,
        bundle_items: updatedList,
        selling_price: prev.selling_price > 0 ? prev.selling_price : sumPrices,
      };
    });

    setComponentProductId("");
    setComponentQty(1);
    setComponentCustomPrice("");
  };

  const handleRemoveComponent = (prodId) => {
    setForm((prev) => ({
      ...prev,
      bundle_items: (prev.bundle_items || []).filter((bi) => String(bi.product_id) !== String(prodId)),
    }));
  };

  const bundleComponentSum = (form.bundle_items || []).reduce(
    (acc, it) => acc + Number(it.unit_price || 0) * Number(it.quantity || 1),
    0
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
        {!editingProductId && (
          <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, is_bundle: false }))}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                !isBundle
                  ? "bg-white text-sky-700 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>📦 Standard Single Product</span>
            </button>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, is_bundle: true }))}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isBundle
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-purple-700"
              }`}
            >
              <span>🎁 Bundle / Kit Package SKU</span>
            </button>
          </div>
        )}

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

          {/* BUNDLE KIT BUILDER SECTION */}
          {isBundle ? (
            <div className="space-y-4 bg-purple-50/40 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                <div>
                  <h3 className="text-sm font-extrabold text-purple-900 flex items-center gap-1.5">
                    <span>🎁 Bundle Kit Package Configuration</span>
                  </h3>
                  <p className="text-[11px] text-purple-700">
                    Group multiple catalog items (e.g. 4x Cameras, DVR, HDD, Cable Box) into a single sellable package.
                  </p>
                </div>
              </div>

              {/* Bundle Package Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <span>Package / Kit Name</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="name"
                    value={form.name || ""}
                    onChange={handleFieldChange}
                    placeholder="e.g. Hikvision 4-Camera Full HD Surveillance Package"
                    required
                    className="w-full px-3 py-2 border border-purple-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <span>Package SKU (Auto Generated)</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      name="sku"
                      value={form.sku || ""}
                      onChange={handleFieldChange}
                      placeholder="e.g. KIT-SURV-4CH"
                      required
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, sku: `KIT-${Math.floor(100000 + Math.random() * 900000)}` }))}
                      title="Generate New Package SKU"
                      className="px-3 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg cursor-pointer text-sm font-bold"
                    >
                      🎲
                    </button>
                  </div>
                </div>
              </div>

              {/* Package Selling Price & Barcode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-purple-900 flex items-center gap-1">
                    <span>Package Selling Price (Tk)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="selling_price"
                    value={form.selling_price || ""}
                    onChange={handleFieldChange}
                    min="0"
                    placeholder={`e.g. ${bundleComponentSum || 16500}`}
                    required
                    className="w-full px-3 py-2 border border-purple-300 rounded-lg text-xs font-bold text-purple-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {bundleComponentSum > 0 && (
                    <span className="text-[10px] text-slate-500">
                      Components sum: ৳{bundleComponentSum.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Package Barcode (Optional)</label>
                  <input
                    name="barcode"
                    value={form.barcode || ""}
                    onChange={handleFieldChange}
                    placeholder="Scan / enter kit barcode"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Category (Optional)</label>
                  <select
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select category for package</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Component Selector Form */}
              <div className="bg-white p-3.5 rounded-xl border border-purple-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  ➕ Add Items into this Package:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_90px_100px_auto] gap-2 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-600">Select Item</label>
                    <select
                      value={componentProductId}
                      onChange={(e) => {
                        const pId = e.target.value;
                        setComponentProductId(pId);
                        const found = availableComponents.find((p) => String(p.id) === String(pId));
                        if (found) {
                          setComponentCustomPrice(found.selling_price || found.sale_price || 0);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Choose inventory item --</option>
                      {availableComponents.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.stock || 0} | ৳{p.selling_price || p.sale_price || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-600">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={componentQty}
                      onChange={(e) => setComponentQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-center font-bold"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-600">Unit Price (Tk)</label>
                    <input
                      type="number"
                      min="0"
                      value={componentCustomPrice}
                      onChange={(e) => setComponentCustomPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-right font-bold"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddComponent}
                    disabled={!componentProductId}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    + Add
                  </button>
                </div>

                {/* Selected Bundle Items Table */}
                {(form.bundle_items || []).length > 0 ? (
                  <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2">Component Item</th>
                          <th className="p-2 text-center">Qty in Kit</th>
                          <th className="p-2 text-right">Unit Price</th>
                          <th className="p-2 text-right">Total</th>
                          <th className="p-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {form.bundle_items.map((bi) => (
                          <tr key={bi.product_id} className="hover:bg-slate-50">
                            <td className="p-2 font-medium text-slate-800">
                              {bi.component_name || `Product #${bi.product_id}`}
                              {bi.component_sku && (
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  SKU: {bi.component_sku}
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-center font-bold text-slate-700">{bi.quantity}</td>
                            <td className="p-2 text-right font-mono">৳{Number(bi.unit_price || 0).toLocaleString()}</td>
                            <td className="p-2 text-right font-bold font-mono text-purple-900">
                              ৳{(Number(bi.unit_price || 0) * Number(bi.quantity || 1)).toLocaleString()}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveComponent(bi.product_id)}
                                className="text-rose-600 hover:text-rose-800 font-bold text-xs cursor-pointer px-1.5 py-0.5 rounded hover:bg-rose-50"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-xs">
                    No components added yet. Select items above to include them in this bundle kit.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* STANDARD PRODUCT CASCADING DROPDOWNS */
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
                    value={form.sku || ""}
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

              {/* Primary Barcode */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Main Barcode (Optional)</label>
                <input
                  name="barcode"
                  value={form.barcode || ""}
                  onChange={handleFieldChange}
                  placeholder="e.g. Box Barcode / Item Barcode"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
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
          )}

          {/* UNIT OF MEASUREMENT (UoM) & CONVERSION SECTION */}
          {!isBundle && (
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>📏 Unit of Measurement (UoM) & Dual-Unit Conversion</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Set primary unit (e.g. Box) and configure sub-unit conversion (e.g. 1 Box = 305 Meters).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
                {/* Base Unit */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-700">Base Unit (Packaging)</label>
                  <input
                    name="unit_name"
                    value={form.unit_name || "Pcs"}
                    onChange={handleFieldChange}
                    placeholder="e.g. Box, Pcs, Roll, Set, Packet"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-sky-500 font-semibold"
                  />
                </div>

                {/* Sub-unit Enable Toggle */}
                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={Boolean(form.enable_sub_unit)}
                    onChange={(e) => setForm((p) => ({ ...p, enable_sub_unit: e.target.checked }))}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                  <span>Enable Dual Sub-Unit (e.g. Loose / Meter sales)</span>
                </label>
              </div>

              {/* Sub-Unit Details when enabled */}
              {form.enable_sub_unit && (
                <div className="p-3 bg-white rounded-lg border border-sky-200 grid grid-cols-1 sm:grid-cols-4 gap-2.5 animate-in fade-in duration-100">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-600">Sub-Unit Name</label>
                    <input
                      name="sub_unit_name"
                      value={form.sub_unit_name || ""}
                      onChange={handleFieldChange}
                      placeholder="e.g. Meter, Pcs, Feet"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-600">
                      1 {form.unit_name || "Box"} =
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        name="conversion_rate"
                        min="1"
                        step="any"
                        value={form.conversion_rate || "305"}
                        onChange={handleFieldChange}
                        placeholder="305"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-bold text-center"
                      />
                      <span className="text-[11px] text-slate-500 font-bold whitespace-nowrap">
                        {form.sub_unit_name || "Sub-Units"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-600">
                      Sub-Unit Selling Price (Tk)
                    </label>
                    <input
                      type="number"
                      name="sub_unit_selling_price"
                      min="0"
                      step="any"
                      value={form.sub_unit_selling_price || ""}
                      onChange={handleFieldChange}
                      placeholder="e.g. 15.00"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-bold text-right"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-600">
                      Sub-Unit Barcode (Optional)
                    </label>
                    <input
                      name="sub_unit_barcode"
                      value={form.sub_unit_barcode || ""}
                      onChange={handleFieldChange}
                      placeholder="e.g. Barcode on loose cable"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

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
                      className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
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
              value={form.description || ""}
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
