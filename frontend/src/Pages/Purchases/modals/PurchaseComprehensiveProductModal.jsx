import React, { useEffect } from "react";
import useProductsManager from "../../Products/hooks/useProductsManager";
import AddProductModal from "../../Products/modals/AddProductModal";
import QuickAddModal from "../../Products/modals/QuickAddModal";
import QuickEditModal from "../../Products/modals/QuickEditModal";
import DuplicateProductModal from "../../Products/modals/DuplicateProductModal";

export default function PurchaseComprehensiveProductModal({
  isOpen,
  initialName = "",
  onClose,
  onProductCreated,
}) {
  const mgr = useProductsManager({
    initialTab: "catalog",
    onProductCreated: (createdProd) => {
      if (onProductCreated) {
        onProductCreated(createdProd);
      }
      if (onClose) {
        onClose();
      }
    },
  });

  useEffect(() => {
    if (isOpen) {
      mgr.handleResetForm();
      if (initialName && initialName.trim()) {
        mgr.setForm((prev) => ({
          ...prev,
          name: initialName.trim(),
        }));
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <AddProductModal
        isOpen={isOpen}
        editingProductId={mgr.editingProductId}
        onClose={onClose}
        categories={mgr.categories}
        catalogSubCategories={mgr.catalogSubCategories}
        catalogBrands={mgr.catalogBrands}
        productNames={mgr.productNames}
        models={mgr.models}
        series={mgr.series}
        selectedCategory={mgr.selectedCategory}
        selectedSubCategory={mgr.selectedSubCategory}
        selectedBrand={mgr.selectedBrand}
        selectedModel={mgr.selectedModel}
        selectedSeries={mgr.selectedSeries}
        products={mgr.products}
        form={mgr.form}
        setForm={mgr.setForm}
        handleFieldChange={mgr.handleFieldChange}
        generateAutoSku={mgr.generateAutoSku}
        handleCategoryChange={mgr.handleCategoryChange}
        handleSubCategoryChange={mgr.handleSubCategoryChange}
        handleBrandChange={mgr.handleBrandChange}
        handleProductNameChange={mgr.handleProductNameChange}
        handleModelChange={mgr.handleModelChange}
        handleSeriesChange={mgr.handleSeriesChange}
        openQuickAddModal={mgr.openQuickAddModal}
        livePreviewTitle={mgr.livePreviewTitle}
        featureImageFile={mgr.featureImageFile}
        setFeatureImageFile={mgr.setFeatureImageFile}
        featureImagePreview={mgr.featureImagePreview}
        setFeatureImagePreview={mgr.setFeatureImagePreview}
        galleryImageFiles={mgr.galleryImageFiles}
        setGalleryImageFiles={mgr.setGalleryImageFiles}
        galleryImagePreviews={mgr.galleryImagePreviews}
        fileInputKey={mgr.fileInputKey}
        setFileInputKey={mgr.setFileInputKey}
        saveError={mgr.saveError}
        handleResetForm={mgr.handleResetForm}
        handleSubmit={mgr.handleSubmit}
        zIndex="z-[100030]"
      />

      {/* Quick Add Modal for inline attribute creation (+ button on category, brand, model, series) */}
      <QuickAddModal
        quickAdd={mgr.quickAdd}
        onClose={() => mgr.setQuickAdd((p) => ({ ...p, isOpen: false }))}
        onChangeValue={(val) => mgr.setQuickAdd((p) => ({ ...p, value: val, error: "" }))}
        onSave={mgr.handleQuickAddSave}
        zIndex="z-[100040]"
      />

      {/* Quick Edit Modal for attributes */}
      <QuickEditModal
        quickEdit={mgr.quickEdit}
        onClose={() => mgr.setQuickEdit((p) => ({ ...p, isOpen: false }))}
        onChangeValue={(val) => mgr.setQuickEdit((p) => ({ ...p, value: val, error: "" }))}
        onSave={mgr.handleQuickEditSave}
        zIndex="z-[100040]"
      />

      {/* Duplicate Alert Modal */}
      <DuplicateProductModal
        message={mgr.duplicatePopupMessage}
        onClose={() => mgr.setDuplicatePopupMessage("")}
        zIndex="z-[100040]"
      />
    </>
  );
}
