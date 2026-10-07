import { useState, useEffect } from "react";
import useProductAttributes from "./useProductAttributes";
import useProductFormState from "./useProductFormState";
import useProductCatalogQueries from "./useProductCatalogQueries";
import useProductCascades from "./useProductCascades";
import useProductSubmit from "./useProductSubmit";

export default function useProductsManager({ initialTab = "catalog", initialSearch = "", onProductCreated } = {}) {
  const [activeTab, setActiveTab] = useState(initialTab || "catalog");

  // 1. Attributes & Cascading Category/Brand/Model/Series
  const attributesState = useProductAttributes({
    onEntityCreated: (entity, item) => cascades.handleEntityCreated(entity, item),
  });

  // 2. Form & Image State
  const formState = useProductFormState({
    brands: attributesState.brands,
    models: attributesState.models,
    series: attributesState.series,
    selectedCategory: attributesState.selectedCategory,
    selectedSubCategory: attributesState.selectedSubCategory,
    selectedBrand: attributesState.selectedBrand,
    selectedModel: attributesState.selectedModel,
    selectedSeries: attributesState.selectedSeries,
    setSelectedCategory: attributesState.setSelectedCategory,
    setSelectedSubCategory: attributesState.setSelectedSubCategory,
    setSelectedBrand: attributesState.setSelectedBrand,
    setSelectedModel: attributesState.setSelectedModel,
    setSelectedSeries: attributesState.setSelectedSeries,
  });

  // 3. Cascading Dropdown / Entity Change Handlers
  const cascades = useProductCascades({
    attributesState,
    setForm: formState.setForm,
  });

  // 4. Catalog Listing, Search, Pagination, Deletions
  const catalogState = useProductCatalogQueries({
    initialSearch,
    onSaveSuccess: formState.setSaveSuccess,
    onSaveError: formState.setSaveError,
  });

  // 5. Submission Lifecycle (Validation, Duplicate check, FormData API submission, Image upload)
  const { handleSubmit } = useProductSubmit({
    formState,
    attributesState,
    catalogState,
    onProductCreated,
  });

  // Initial load and global event synchronization
  useEffect(() => {
    attributesState.loadAttributes();
    catalogState.reloadProducts();

    const handleOpenAddProductEvent = () => {
      setActiveTab("catalog");
      formState.handleResetForm();
      formState.setIsAddProductOpen(true);
    };
    const handleStockReload = () => {
      catalogState.reloadProducts();
    };

    window.addEventListener("open-add-product", handleOpenAddProductEvent);
    window.addEventListener("inventory_stock_changed", handleStockReload);
    window.addEventListener("products_changed", handleStockReload);
    return () => {
      window.removeEventListener("open-add-product", handleOpenAddProductEvent);
      window.removeEventListener("inventory_stock_changed", handleStockReload);
      window.removeEventListener("products_changed", handleStockReload);
    };
  }, []);

  return {
    activeTab,
    setActiveTab,
    productFilterQuery: catalogState.productFilterQuery,
    setProductFilterQuery: catalogState.setProductFilterQuery,
    categoryFilter: catalogState.categoryFilter,
    setCategoryFilter: catalogState.setCategoryFilter,
    statusFilter: catalogState.statusFilter,
    setStatusFilter: catalogState.setStatusFilter,
    categoriesList: catalogState.categoriesList,
    resetFilters: catalogState.resetFilters,
    isAddProductOpen: formState.isAddProductOpen,
    setIsAddProductOpen: formState.setIsAddProductOpen,
    editingProductId: formState.editingProductId,
    categories: attributesState.categories,
    subCategories: attributesState.subCategories,
    brands: attributesState.brands,
    allProductNames: attributesState.allProductNames,
    productNames: attributesState.productNames,
    models: attributesState.models,
    series: attributesState.series,
    products: catalogState.products,
    selectedProductIds: catalogState.selectedProductIds,
    currentPage: catalogState.currentPage,
    setCurrentPage: catalogState.setCurrentPage,
    openProductAction: catalogState.openProductAction,
    setOpenProductAction: catalogState.setOpenProductAction,
    productsPerPage: catalogState.productsPerPage,
    selectedCategory: attributesState.selectedCategory,
    selectedSubCategory: attributesState.selectedSubCategory,
    selectedBrand: attributesState.selectedBrand,
    selectedModel: attributesState.selectedModel,
    selectedSeries: attributesState.selectedSeries,
    quickAdd: attributesState.quickAdd,
    setQuickAdd: attributesState.setQuickAdd,
    quickEdit: attributesState.quickEdit,
    setQuickEdit: attributesState.setQuickEdit,
    featureImageFile: formState.featureImageFile,
    setFeatureImageFile: formState.setFeatureImageFile,
    galleryImageFiles: formState.galleryImageFiles,
    setGalleryImageFiles: formState.setGalleryImageFiles,
    featureImagePreview: formState.featureImagePreview,
    setFeatureImagePreview: formState.setFeatureImagePreview,
    galleryImagePreviews: formState.galleryImagePreviews,
    fileInputKey: formState.fileInputKey,
    setFileInputKey: formState.setFileInputKey,
    saveError: formState.saveError,
    saveSuccess: formState.saveSuccess,
    duplicatePopupMessage: formState.duplicatePopupMessage,
    setDuplicatePopupMessage: formState.setDuplicatePopupMessage,
    showAttributeAdd: attributesState.showAttributeAdd,
    setShowAttributeAdd: attributesState.setShowAttributeAdd,
    attributeDraft: attributesState.attributeDraft,
    setAttributeDraft: attributesState.setAttributeDraft,
    attributeError: attributesState.attributeError,
    setAttributeError: attributesState.setAttributeError,
    form: formState.form,
    setForm: formState.setForm,
    catalogSubCategories: attributesState.catalogSubCategories,
    catalogBrands: attributesState.catalogBrands,
    previewBrand: formState.previewBrand,
    previewModel: formState.previewModel,
    previewSeries: formState.previewSeries,
    livePreviewTitle: formState.livePreviewTitle,
    filteredProducts: catalogState.filteredProducts,
    totalProductPages: catalogState.totalProductPages,
    visibleProducts: catalogState.visibleProducts,
    productLabel: catalogState.productLabel,
    generateAutoSku: formState.generateAutoSku,
    reloadProducts: catalogState.reloadProducts,
    loadData: attributesState.loadAttributes,
    loadDummyProducts: catalogState.loadDummyProducts,
    saveAttributeItem: attributesState.saveAttributeItem,
    openQuickEditModal: attributesState.openQuickEditModal,
    handleQuickEditSave: attributesState.handleQuickEditSave,
    deleteAttribute: attributesState.deleteAttribute,
    openQuickAddModal: attributesState.openQuickAddModal,
    handleQuickAddSave: attributesState.handleQuickAddSave,
    handleFieldChange: formState.handleFieldChange,
    handleResetForm: formState.handleResetForm,
    handleEditProduct: formState.handleEditProduct,
    handleSubmit,
    openAddProduct: formState.openAddProduct,
    openAddBundle: formState.openAddBundle,
    toggleProduct: catalogState.toggleProduct,
    toggleAllProducts: catalogState.toggleAllProducts,
    deleteProduct: catalogState.deleteProduct,
    toggleProductStatus: catalogState.toggleProductStatus,
    handleCategoryChange: cascades.handleCategoryChange,
    handleSubCategoryChange: cascades.handleSubCategoryChange,
    handleBrandChange: cascades.handleBrandChange,
    handleProductNameChange: cascades.handleProductNameChange,
    handleModelChange: cascades.handleModelChange,
    handleSeriesChange: cascades.handleSeriesChange,
  };
}
