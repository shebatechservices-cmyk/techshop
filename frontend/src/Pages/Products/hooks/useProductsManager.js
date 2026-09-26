import { useState, useEffect } from "react";
import API_BASE from "../../../services/api";
import useProductAttributes from "./useProductAttributes";
import useProductFormState from "./useProductFormState";
import useProductCatalogQueries from "./useProductCatalogQueries";

const API = `${API_BASE}/master`;
const CATEGORY_API = `${API_BASE}/categories`;

export default function useProductsManager({ initialTab = "catalog", initialSearch = "" } = {}) {
  const [activeTab, setActiveTab] = useState(initialTab || "catalog");

  // Callback when a new attribute (e.g. Brand, Category, Model) is created via inline quick add
  const handleEntityCreated = (entity, item) => {
    if (!item) return;
    if (entity === "categories") {
      formState.setForm((prev) => ({
        ...prev,
        category_id: String(item.id),
        sub_category_id: "",
        brand_id: "",
        model_id: "",
        series_id: "",
      }));
    } else if (entity === "sub_categories") {
      formState.setForm((prev) => ({
        ...prev,
        sub_category_id: String(item.id),
        brand_id: "",
        model_id: "",
        series_id: "",
      }));
    } else if (entity === "brands") {
      formState.setForm((prev) => ({
        ...prev,
        brand_id: String(item.id),
        model_id: "",
        series_id: "",
      }));
    } else if (entity === "product_names") {
      formState.setForm((prev) => ({
        ...prev,
        name: item.name,
      }));
    } else if (entity === "models") {
      formState.setForm((prev) => ({
        ...prev,
        model_id: String(item.id),
        series_id: "",
      }));
    } else if (entity === "series") {
      formState.setForm((prev) => ({
        ...prev,
        series_id: String(item.id),
      }));
    }
  };

  // 1. Attributes & Cascading Category/Brand/Model/Series
  const attributesState = useProductAttributes({ onEntityCreated: handleEntityCreated });

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

  // 3. Catalog Listing, Search, Pagination, Deletions
  const catalogState = useProductCatalogQueries({
    initialSearch,
    onSaveSuccess: formState.setSaveSuccess,
    onSaveError: formState.setSaveError,
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

  // Cascading Selection Handlers
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    attributesState.setSelectedCategory(value);
    attributesState.setSelectedSubCategory("");
    attributesState.setSelectedBrand("");
    attributesState.setSelectedModel("");
    attributesState.setSelectedSeries("");
    formState.setForm((prev) => ({
      ...prev,
      name: "",
      category_id: value,
      sub_category_id: "",
      brand_id: "",
      model_id: "",
      series_id: "",
    }));
  };

  const handleSubCategoryChange = (e) => {
    const value = e.target.value;
    attributesState.setSelectedSubCategory(value);
    attributesState.setSelectedBrand("");
    attributesState.setSelectedModel("");
    attributesState.setSelectedSeries("");
    formState.setForm((prev) => ({
      ...prev,
      name: "",
      sub_category_id: value,
      brand_id: "",
      model_id: "",
      series_id: "",
    }));
  };

  const handleBrandChange = (e) => {
    const value = e.target.value;
    attributesState.setSelectedBrand(value);
    attributesState.setSelectedModel("");
    attributesState.setSelectedSeries("");
    formState.setForm((prev) => ({
      ...prev,
      name: "",
      brand_id: value,
      model_id: "",
      series_id: "",
    }));
  };

  const handleProductNameChange = (e) => {
    const value = e.target.value;
    attributesState.setSelectedModel("");
    attributesState.setSelectedSeries("");
    formState.setForm((prev) => ({
      ...prev,
      name: value,
      model_id: "",
      series_id: "",
    }));
  };

  const handleModelChange = (e) => {
    const value = e.target.value;
    attributesState.setSelectedModel(value);
    attributesState.setSelectedSeries("");
    formState.setForm((prev) => ({ ...prev, model_id: value, series_id: "" }));
  };

  const handleSeriesChange = (e) => {
    const value = e.target.value;
    attributesState.setSelectedSeries(value);
    formState.setForm((prev) => ({ ...prev, series_id: value }));
  };

  // Product Form Submit
  const handleSubmit = async (event) => {
    event.preventDefault();
    formState.setSaveError("");
    formState.setSaveSuccess("");
    formState.setDuplicatePopupMessage("");

    const { form, editingProductId, featureImageFile, galleryImageFiles } = formState;

    if (form.is_bundle) {
      if (!form.name || !form.name.trim()) {
        formState.setSaveError("Please enter a package / bundle kit name.");
        return;
      }
      if (!form.bundle_items || form.bundle_items.length === 0) {
        formState.setSaveError("Please add at least one component to this bundle kit.");
        return;
      }
    } else {
      if (
        !attributesState.selectedCategory ||
        !attributesState.selectedSubCategory ||
        !attributesState.selectedBrand ||
        !form.name ||
        !attributesState.selectedModel ||
        !attributesState.selectedSeries
      ) {
        formState.setSaveError("Please select all cascading fields from Category to Series.");
        return;
      }
    }

    const optionalId = (value) => (value ? Number(value) : null);

    // Duplicate Check
    if (!editingProductId && !form.is_bundle) {
      const norm = (val) => String(val || "").trim().toLowerCase();
      const inputSku = norm(form.sku);
      const inputBarcode = norm(form.barcode);
      const inputName = norm(form.name);
      const catId = optionalId(attributesState.selectedCategory || form.category_id);
      const subCatId = optionalId(attributesState.selectedSubCategory || form.sub_category_id);
      const brandId = optionalId(attributesState.selectedBrand || form.brand_id);
      const modelId = optionalId(attributesState.selectedModel || form.model_id);
      const seriesId = optionalId(attributesState.selectedSeries || form.series_id);

      const isDuplicate = catalogState.products.some((p) => {
        if (inputSku && norm(p.sku) === inputSku) return true;
        if (inputBarcode && norm(p.barcode) === inputBarcode) return true;
        const sameName = norm(p.name) === inputName;
        const sameCat = !catId || Number(p.category_id) === catId;
        const sameSub = !subCatId || Number(p.sub_category_id) === subCatId;
        const sameBrand = !brandId || Number(p.brand_id) === brandId;
        const sameModel = !modelId || Number(p.model_id) === modelId;
        const sameSeries = !seriesId || Number(p.series_id) === seriesId;
        return sameName && sameCat && sameSub && sameBrand && sameModel && sameSeries;
      });

      if (isDuplicate) {
        const msg = "Already added this product, add a new product for catalog";
        formState.setSaveError(msg);
        formState.setDuplicatePopupMessage(msg);
        return;
      }
    }

    const isSerialReq = Boolean(
      form.isSerialRequired ??
        form.is_serial_required ??
        form.is_serial_tracked ??
        form.tracks_serial ??
        false
    );
    const isWarrantyReq = Boolean(
      form.isWarrantyRequired ??
        form.is_warranty_required ??
        Number(form.warranty_months || 0) > 0
    );

    const payload = {
      ...form,
      is_bundle: Boolean(form.is_bundle),
      bundle_items: form.is_bundle ? form.bundle_items : [],
      unit_name: form.unit_name || "Pcs",
      sub_unit_name: form.enable_sub_unit ? (form.sub_unit_name || null) : null,
      conversion_rate: form.enable_sub_unit ? (Number(form.conversion_rate) || 1) : 1,
      sub_unit_selling_price: form.enable_sub_unit && form.sub_unit_selling_price ? Number(form.sub_unit_selling_price) : null,
      sub_unit_barcode: form.enable_sub_unit && form.sub_unit_barcode ? String(form.sub_unit_barcode).trim() : null,
      category_id: optionalId(attributesState.selectedCategory || form.category_id),
      sub_category_id: optionalId(attributesState.selectedSubCategory || form.sub_category_id),
      brand_id: optionalId(attributesState.selectedBrand || form.brand_id),
      model_id: optionalId(attributesState.selectedModel || form.model_id),
      series_id: optionalId(attributesState.selectedSeries || form.series_id),
      stock: Number(form.stock || 0),
      min_stock: Number(form.min_stock || 0),
      warranty_months: isWarrantyReq ? Number(form.warranty_months || 0) : 0,
      is_serial_required: isSerialReq,
      is_warranty_required: isWarrantyReq,
      is_serial_tracked: isSerialReq,
      isSerialRequired: isSerialReq,
      isWarrantyRequired: isWarrantyReq,
      tracks_serial: isSerialReq,
    };

    try {
      const url = editingProductId ? `${API}/products/${editingProductId}` : `${API}/products`;
      const method = editingProductId ? "PUT" : "POST";

      let res;
      if (featureImageFile || (galleryImageFiles && galleryImageFiles.length > 0)) {
        const formData = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== null && v !== undefined) {
            if (k === 'bundle_items') {
              formData.append(k, JSON.stringify(v));
            } else {
              formData.append(k, String(v));
            }
          }
        });
        formData.append("is_serial_required", isSerialReq ? "true" : "false");
        formData.append("is_warranty_required", isWarrantyReq ? "true" : "false");
        formData.append("isSerialRequired", isSerialReq ? "true" : "false");
        formData.append("isWarrantyRequired", isWarrantyReq ? "true" : "false");
        if (featureImageFile) {
          formData.append("images", featureImageFile);
          formData.append("feature_image", featureImageFile);
        }
        galleryImageFiles.forEach((file) => formData.append("images", file));

        res = await fetch(url, { method, body: formData });
      } else {
        res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error || errJson?.message || "Failed to save product";
        if (errMsg.includes("Already added") || res.status === 409) {
          const msg = "Already added this product, add a new product for catalog";
          formState.setSaveError(msg);
          formState.setDuplicatePopupMessage(msg);
          return;
        }
        throw new Error(errMsg);
      }

      const resData = await res.json();
      const targetId = editingProductId || resData.data?.id;

      if (targetId && (featureImageFile || galleryImageFiles.length)) {
        const imageData = new FormData();
        if (featureImageFile) {
          imageData.append("images", featureImageFile);
          imageData.append("type", "feature");
        }
        galleryImageFiles.forEach((file) => imageData.append("images", file));
        await fetch(`${API.replace("/master", "")}/images/products/${targetId}`, {
          method: "POST",
          body: imageData,
        }).catch(() => {});
      }

      await catalogState.reloadProducts();
      formState.handleResetForm();
      formState.setIsAddProductOpen(false);
      formState.setSaveSuccess(
        editingProductId
          ? "Product specifications updated successfully."
          : "Product added to catalog successfully."
      );
      setTimeout(() => formState.setSaveSuccess(""), 4000);
    } catch (error) {
      formState.setSaveError(error.message || "Failed to save product. Please check all fields.");
      console.error("Submit error:", error);
    }
  };

  return {
    activeTab,
    setActiveTab,
    productFilterQuery: catalogState.productFilterQuery,
    setProductFilterQuery: catalogState.setProductFilterQuery,
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
    handleCategoryChange,
    handleSubCategoryChange,
    handleBrandChange,
    handleProductNameChange,
    handleModelChange,
    handleSeriesChange,
  };
}
