import React from "react";
import useProductsManager from "./hooks/useProductsManager";
import ProductCatalogTab from "./components/ProductCatalogTab";
import CategoriesAttributesTab from "./components/CategoriesAttributesTab";
import AddProductModal from "./modals/AddProductModal";
import QuickAddModal from "./modals/QuickAddModal";
import QuickEditModal from "./modals/QuickEditModal";
import DuplicateProductModal from "./modals/DuplicateProductModal";

export default function Products({ initialTab = "catalog", initialSearch = "" } = {}) {
  const {
    activeTab,
    setActiveTab,
    productFilterQuery,
    setProductFilterQuery,
    isAddProductOpen,
    setIsAddProductOpen,
    editingProductId,
    categories,
    subCategories,
    brands,
    productNames,
    models,
    series,
    products,
    selectedProductIds,
    currentPage,
    setCurrentPage,
    openProductAction,
    setOpenProductAction,
    selectedCategory,
    selectedSubCategory,
    selectedBrand,
    selectedModel,
    selectedSeries,
    quickAdd,
    setQuickAdd,
    quickEdit,
    setQuickEdit,
    featureImageFile,
    setFeatureImageFile,
    galleryImageFiles,
    setGalleryImageFiles,
    featureImagePreview,
    setFeatureImagePreview,
    galleryImagePreviews,
    fileInputKey,
    setFileInputKey,
    saveError,
    saveSuccess,
    duplicatePopupMessage,
    setDuplicatePopupMessage,
    showAttributeAdd,
    setShowAttributeAdd,
    attributeDraft,
    setAttributeDraft,
    attributeError,
    setAttributeError,
    form,
    setForm,
    catalogSubCategories,
    catalogBrands,
    livePreviewTitle,
    filteredProducts,
    totalProductPages,
    visibleProducts,
    productLabel,
    generateAutoSku,
    saveAttributeItem,
    openQuickEditModal,
    handleQuickEditSave,
    deleteAttribute,
    openQuickAddModal,
    handleQuickAddSave,
    handleFieldChange,
    handleResetForm,
    handleEditProduct,
    handleSubmit,
    openAddProduct,
    toggleProduct,
    toggleAllProducts,
    deleteProduct,
    toggleProductStatus,
    handleCategoryChange,
    handleSubCategoryChange,
    handleBrandChange,
    handleProductNameChange,
    handleModelChange,
    handleSeriesChange,
  } = useProductsManager({ initialTab, initialSearch });

  return (
    <div className="space-y-4">
      {/* Header Toolbar */}
      <header className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {activeTab === "attributes" ? "Categories & Attributes" : "Products & Catalog"}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "catalog"
                ? "bg-sky-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            onClick={() => setActiveTab("catalog")}
          >
            📦 Product Catalog
          </button>
          <button
            type="button"
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "attributes"
                ? "bg-sky-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            onClick={() => setActiveTab("attributes")}
          >
            🏷️ Categories & Attributes
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            onClick={openAddProduct}
          >
            <span className="text-sm font-black">+</span>
            <span>Add Product</span>
          </button>
        </div>
      </header>

      {/* Tab Views */}
      {activeTab === "catalog" && (
        <ProductCatalogTab
          products={products}
          filteredProducts={filteredProducts}
          visibleProducts={visibleProducts}
          selectedProductIds={selectedProductIds}
          productFilterQuery={productFilterQuery}
          setProductFilterQuery={setProductFilterQuery}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalProductPages={totalProductPages}
          openProductAction={openProductAction}
          setOpenProductAction={setOpenProductAction}
          toggleProduct={toggleProduct}
          toggleAllProducts={toggleAllProducts}
          deleteProduct={deleteProduct}
          toggleProductStatus={toggleProductStatus}
          handleEditProduct={handleEditProduct}
          productLabel={productLabel}
          saveSuccess={saveSuccess}
        />
      )}

      {activeTab === "attributes" && (
        <CategoriesAttributesTab
          categories={categories}
          subCategories={subCategories}
          brands={brands}
          productNames={productNames}
          models={models}
          series={series}
          showAttributeAdd={showAttributeAdd}
          setShowAttributeAdd={setShowAttributeAdd}
          attributeDraft={attributeDraft}
          setAttributeDraft={setAttributeDraft}
          attributeError={attributeError}
          setAttributeError={setAttributeError}
          saveAttributeItem={saveAttributeItem}
          openQuickEditModal={openQuickEditModal}
          openQuickAddModal={openQuickAddModal}
          deleteAttribute={deleteAttribute}
        />
      )}

      {/* Add / Edit Product Modal */}
      <AddProductModal
        isOpen={isAddProductOpen}
        editingProductId={editingProductId}
        onClose={() => setIsAddProductOpen(false)}
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
        generateAutoSku={generateAutoSku}
        handleCategoryChange={handleCategoryChange}
        handleSubCategoryChange={handleSubCategoryChange}
        handleBrandChange={handleBrandChange}
        handleProductNameChange={handleProductNameChange}
        handleModelChange={handleModelChange}
        handleSeriesChange={handleSeriesChange}
        openQuickAddModal={openQuickAddModal}
        livePreviewTitle={livePreviewTitle}
        featureImageFile={featureImageFile}
        setFeatureImageFile={setFeatureImageFile}
        featureImagePreview={featureImagePreview}
        setFeatureImagePreview={setFeatureImagePreview}
        galleryImageFiles={galleryImageFiles}
        setGalleryImageFiles={setGalleryImageFiles}
        galleryImagePreviews={galleryImagePreviews}
        fileInputKey={fileInputKey}
        setFileInputKey={setFileInputKey}
        saveError={saveError}
        handleResetForm={handleResetForm}
        handleSubmit={handleSubmit}
      />

      {/* Quick Add Modal */}
      <QuickAddModal
        quickAdd={quickAdd}
        onClose={() => setQuickAdd((p) => ({ ...p, isOpen: false }))}
        onChangeValue={(val) => setQuickAdd((p) => ({ ...p, value: val, error: "" }))}
        onSave={handleQuickAddSave}
      />

      {/* Quick Edit Modal */}
      <QuickEditModal
        quickEdit={quickEdit}
        onClose={() => setQuickEdit((p) => ({ ...p, isOpen: false }))}
        onChangeValue={(val) => setQuickEdit((p) => ({ ...p, value: val, error: "" }))}
        onSave={handleQuickEditSave}
      />

      {/* Duplicate Alert Modal */}
      <DuplicateProductModal
        message={duplicatePopupMessage}
        onClose={() => setDuplicatePopupMessage("")}
      />
    </div>
  );
}
