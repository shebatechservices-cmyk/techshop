import React from 'react';
import useQuickAddProduct from '../hooks/useQuickAddProduct';

export default function QuickAddProductModal({
  isOpen,
  onClose,
  onProductCreated,
}) {
  const {
    formData,
    categories,
    brands,
    loading,
    error,
    duplicateAlert,
    setDuplicateAlert,
    handleChange,
    handleSubmit,
    generateSku,
  } = useQuickAddProduct({ isOpen, onClose, onProductCreated });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100030] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl w-full max-w-[680px] shadow-2xl overflow-hidden border border-slate-300 flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📦</span>
            <div>
              <h2 className="m-0 text-lg font-extrabold text-slate-900">
                Add New Catalog Product
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Create product directly into catalog and append to this purchase order
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-transparent border-0 text-xl text-slate-400 hover:text-slate-600 cursor-pointer p-1 leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Duplicate Notification Alert */}
        {duplicateAlert && (
          <div className="mx-6 mt-4 p-3.5 px-4.5 rounded-lg bg-red-50 border-[1.5px] border-red-500 flex items-center justify-between shadow-md shadow-red-500/15">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">⚠️</span>
              <div>
                <strong className="text-red-900 text-sm font-bold block">
                  Already added this product, add a new product for catalog
                </strong>
                <span className="text-xs text-red-700">
                  A product with the same name, model, SKU, or barcode already exists in the catalog.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDuplicateAlert(false)}
              className="bg-red-500 hover:bg-red-600 text-white border-0 py-1.5 px-3 rounded-md font-semibold text-xs cursor-pointer transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 px-6 overflow-y-auto flex flex-col gap-3.5">
          {error && (
            <div className="p-2.5 px-3.5 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

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

          {/* Pricing: Purchase Cost & Selling Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-sky-700 mb-1">
                Purchase Cost Price ৳ *
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.purchase_price}
                onChange={(e) => handleChange('purchase_price', e.target.value)}
                placeholder="0.00"
                className="w-full py-2 px-3 rounded-lg border-[1.5px] border-sky-400 focus:border-sky-600 focus:outline-none text-sm box-border bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-600 mb-1">
                Selling Retail Price ৳
              </label>
              <input
                type="number"
                step="any"
                value={formData.selling_price}
                onChange={(e) => handleChange('selling_price', e.target.value)}
                placeholder="0.00"
                className="w-full py-2 px-3 rounded-lg border-[1.5px] border-emerald-400 focus:border-emerald-600 focus:outline-none text-sm box-border bg-white"
              />
            </div>
          </div>

          {/* SKU & Barcode */}
          <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr] gap-3.5">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Auto SKU Code
                </label>
                <button
                  type="button"
                  onClick={() => handleChange('sku', generateSku(formData.brand_name || 'PRD', formData.name || 'ITM'))}
                  className="bg-transparent border-0 text-blue-600 hover:text-blue-700 text-xs font-semibold cursor-pointer p-0"
                >
                  ⚡ Regenerate
                </button>
              </div>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                placeholder="e.g. NET-ROU-4821"
                className="w-full py-2 px-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:outline-none text-sm box-border font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Barcode
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => handleChange('barcode', e.target.value)}
                placeholder="e.g. 890123456789"
                className="w-full py-2 px-3 rounded-lg border border-slate-300 focus:border-sky-500 focus:outline-none text-sm box-border"
              />
            </div>
          </div>

          {/* Serial / Barcode & Warranty Tracking Options */}
          <div className="flex flex-col gap-2 bg-slate-50 p-2.5 px-3.5 rounded-lg border border-slate-200">
            <label className="flex items-center justify-between cursor-pointer text-sm">
              <span>
                <strong className={formData.isSerialRequired ? "text-emerald-800 font-bold" : "text-slate-800 font-bold"}>
                  📦 Requires Serial / Barcode Tracking
                </strong>
                <br />
                <small className="text-slate-500 text-xs">Enforces barcode scanning on purchase and sale rows</small>
              </span>
              <input
                type="checkbox"
                checked={Boolean(formData.isSerialRequired)}
                onChange={(e) => handleChange('isSerialRequired', e.target.checked)}
                className="w-4.5 h-4.5 accent-emerald-600 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-sm border-t border-dashed border-slate-200 pt-2">
              <span>
                <strong className={formData.isWarrantyRequired ? "text-blue-800 font-bold" : "text-slate-800 font-bold"}>
                  🛡️ Requires Warranty Tracking
                </strong>
                <br />
                <small className="text-slate-500 text-xs">Enforces batch warranty on purchase and customer invoice</small>
              </span>
              <input
                type="checkbox"
                checked={Boolean(formData.isWarrantyRequired)}
                onChange={(e) => handleChange('isWarrantyRequired', e.target.checked)}
                className="w-4.5 h-4.5 accent-blue-600 cursor-pointer"
              />
            </label>

            {formData.isWarrantyRequired && (
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs font-semibold text-blue-800">
                  Default Warranty (Months):
                </span>
                <input
                  type="number"
                  min="0"
                  value={formData.warranty_months}
                  onChange={(e) => handleChange('warranty_months', e.target.value)}
                  placeholder="12"
                  className="w-20 py-1.5 px-2 rounded-md border border-blue-300 focus:border-blue-500 focus:outline-none text-sm text-center font-bold box-border"
                />
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-2.5 mt-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-sm cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2 px-5.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white border-0 font-bold text-sm cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Creating...' : '✓ Add Product to PO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
