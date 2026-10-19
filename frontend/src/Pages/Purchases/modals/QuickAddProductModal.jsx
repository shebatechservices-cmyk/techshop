import React from 'react';
import useQuickAddProduct from '../hooks/useQuickAddProduct';
import QuickAddModalHeader from './quick-add/QuickAddModalHeader';
import QuickAddProductInfoFields from './quick-add/QuickAddProductInfoFields';
import QuickAddPricingTrackingFields from './quick-add/QuickAddPricingTrackingFields';

export default function QuickAddProductModal({
  isOpen,
  initialName = '',
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
  } = useQuickAddProduct({ isOpen, initialName, onClose, onProductCreated });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100030] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl w-full max-w-[680px] shadow-2xl overflow-hidden border border-slate-300 flex flex-col max-h-[94vh]">
        <QuickAddModalHeader
          onClose={onClose}
          duplicateAlert={duplicateAlert}
          setDuplicateAlert={setDuplicateAlert}
        />

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 px-6 overflow-y-auto flex flex-col gap-3.5">
          {error && (
            <div className="p-2.5 px-3.5 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <QuickAddProductInfoFields
            formData={formData}
            categories={categories}
            brands={brands}
            handleChange={handleChange}
          />

          <QuickAddPricingTrackingFields
            formData={formData}
            handleChange={handleChange}
            generateSku={generateSku}
          />

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
