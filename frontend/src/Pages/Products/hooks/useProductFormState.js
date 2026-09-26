import { useState, useEffect, useMemo } from "react";

export default function useProductFormState({
  brands = [],
  models = [],
  series = [],
  selectedCategory,
  selectedSubCategory,
  selectedBrand,
  selectedModel,
  selectedSeries,
  setSelectedCategory,
  setSelectedSubCategory,
  setSelectedBrand,
  setSelectedModel,
  setSelectedSeries,
} = {}) {
  const generateAutoSku = () => `SKU-${Math.floor(100000 + Math.random() * 900000)}`;

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  const [featureImageFile, setFeatureImageFile] = useState(null);
  const [galleryImageFiles, setGalleryImageFiles] = useState([]);
  const [featureImagePreview, setFeatureImagePreview] = useState(null);
  const [galleryImagePreviews, setGalleryImagePreviews] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [duplicatePopupMessage, setDuplicatePopupMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    sku: generateAutoSku(),
    stock: 0,
    status: "active",
    description: "",
    category_id: "",
    sub_category_id: "",
    brand_id: "",
    model_id: "",
    series_id: "",
    min_stock: 5,
    image_url: "",
    condition: "New",
    is_service: false,
    is_bundle: false,
    bundle_items: [],
    unit_name: "Pcs",
    enable_sub_unit: false,
    sub_unit_name: "",
    conversion_rate: "1",
    sub_unit_selling_price: "",
    sub_unit_barcode: "",
    tracks_serial: false,
    is_serial_tracked: false,
    is_serial_required: false,
    isSerialRequired: false,
    is_warranty_required: false,
    isWarrantyRequired: false,
    warranty_months: "0",
  });

  const previewBrand = useMemo(() => {
    return brands.find((b) => String(b.id) === String(selectedBrand))?.name || "";
  }, [brands, selectedBrand]);

  const previewModel = useMemo(() => {
    return models.find((m) => String(m.id) === String(selectedModel))?.name || "";
  }, [models, selectedModel]);

  const previewSeries = useMemo(() => {
    return series.find((s) => String(s.id) === String(selectedSeries))?.name || "";
  }, [series, selectedSeries]);

  const livePreviewTitle = useMemo(() => {
    return [previewBrand, form.name, previewModel, previewSeries]
      .filter(Boolean)
      .join(" ");
  }, [previewBrand, form.name, previewModel, previewSeries]);

  // Image preview effects
  useEffect(() => {
    if (!featureImageFile) {
      setFeatureImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(featureImageFile);
    setFeatureImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [featureImageFile]);

  useEffect(() => {
    if (!galleryImageFiles || galleryImageFiles.length === 0) {
      setGalleryImagePreviews([]);
      return;
    }
    const urls = galleryImageFiles.map((f) => URL.createObjectURL(f));
    setGalleryImagePreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [galleryImageFiles]);

  const handleFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    let finalVal = type === "checkbox" ? checked : value;
    if (name === "warranty_months") {
      finalVal = value.replace(/[^0-9]/g, "");
    }
    setForm((prev) => {
      const next = { ...prev, [name]: finalVal };
      if (
        name === "isSerialRequired" ||
        name === "is_serial_required" ||
        name === "is_serial_tracked" ||
        name === "tracks_serial"
      ) {
        const boolVal = Boolean(finalVal);
        next.isSerialRequired = boolVal;
        next.is_serial_required = boolVal;
        next.is_serial_tracked = boolVal;
        next.tracks_serial = boolVal;
      }
      if (name === "isWarrantyRequired" || name === "is_warranty_required") {
        const boolVal = Boolean(finalVal);
        next.isWarrantyRequired = boolVal;
        next.is_warranty_required = boolVal;
      }
      return next;
    });
  };

  const handleResetForm = () => {
    setForm({
      name: "",
      sku: generateAutoSku(),
      stock: 0,
      status: "active",
      description: "",
      category_id: "",
      sub_category_id: "",
      brand_id: "",
      model_id: "",
      series_id: "",
      min_stock: 5,
      image_url: "",
      condition: "New",
      is_service: false,
      is_bundle: false,
      bundle_items: [],
      unit_name: "Pcs",
      enable_sub_unit: false,
      sub_unit_name: "",
      conversion_rate: "1",
      sub_unit_selling_price: "",
      sub_unit_barcode: "",
      tracks_serial: false,
      is_serial_tracked: false,
      is_serial_required: false,
      isSerialRequired: false,
      is_warranty_required: false,
      isWarrantyRequired: false,
      warranty_months: "0",
    });
    setEditingProductId(null);
    if (setSelectedCategory) setSelectedCategory("");
    if (setSelectedSubCategory) setSelectedSubCategory("");
    if (setSelectedBrand) setSelectedBrand("");
    if (setSelectedModel) setSelectedModel("");
    if (setSelectedSeries) setSelectedSeries("");
    setFeatureImageFile(null);
    setGalleryImageFiles([]);
    setFeatureImagePreview(null);
    setGalleryImagePreviews([]);
    setFileInputKey((k) => k + 1);
    setSaveError("");
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product.id);
    if (setSelectedCategory) setSelectedCategory(product.category_id ? String(product.category_id) : "");
    if (setSelectedSubCategory) setSelectedSubCategory(product.sub_category_id ? String(product.sub_category_id) : "");
    if (setSelectedBrand) setSelectedBrand(product.brand_id ? String(product.brand_id) : "");
    if (setSelectedModel) setSelectedModel(product.model_id ? String(product.model_id) : "");
    if (setSelectedSeries) setSelectedSeries(product.series_id ? String(product.series_id) : "");
    const isSerialReq = Boolean(
      product.isSerialRequired ??
        product.is_serial_required ??
        product.is_serial_tracked ??
        product.tracks_serial ??
        false
    );
    const isWarrantyReq = Boolean(
      product.isWarrantyRequired ??
        product.is_warranty_required ??
        Number(product.warranty_months || 0) > 0
    );
    setForm({
      name: product.name || "",
      sku: product.sku || generateAutoSku(),
      stock: product.stock !== undefined ? product.stock : 0,
      status: product.status || "active",
      description: product.description || "",
      category_id: product.category_id || "",
      sub_category_id: product.sub_category_id || "",
      brand_id: product.brand_id || "",
      model_id: product.model_id || "",
      series_id: product.series_id || "",
      min_stock: product.min_stock !== undefined ? product.min_stock : 5,
      image_url: product.image_url || "",
      condition: product.condition || "New",
      is_service: product.is_service || false,
      is_bundle: Boolean(product.is_bundle),
      bundle_items: Array.isArray(product.bundle_items) ? product.bundle_items : [],
      unit_name: product.unit_name || "Pcs",
      enable_sub_unit: Boolean(product.sub_unit_name),
      sub_unit_name: product.sub_unit_name || "",
      conversion_rate: String(product.conversion_rate || 1),
      sub_unit_selling_price: product.sub_unit_selling_price ? String(product.sub_unit_selling_price) : "",
      sub_unit_barcode: product.sub_unit_barcode || "",
      tracks_serial: isSerialReq,
      is_serial_tracked: isSerialReq,
      is_serial_required: isSerialReq,
      isSerialRequired: isSerialReq,
      is_warranty_required: isWarrantyReq,
      isWarrantyRequired: isWarrantyReq,
      warranty_months: String(
        product.warranty_months !== undefined && product.warranty_months !== null
          ? product.warranty_months
          : 0
      ),
    });
    setFeatureImageFile(null);
    setGalleryImageFiles([]);
    setFeatureImagePreview(null);
    setGalleryImagePreviews([]);
    setFileInputKey((k) => k + 1);
    setSaveError("");
    setSaveSuccess("");
    setIsAddProductOpen(true);
  };

  const openAddProduct = (options = {}) => {
    handleResetForm();
    if (options && options.is_bundle) {
      setForm((p) => ({ ...p, is_bundle: true }));
    }
    setIsAddProductOpen(true);
  };

  const openAddBundle = () => openAddProduct({ is_bundle: true });

  return {
    isAddProductOpen,
    setIsAddProductOpen,
    editingProductId,
    setEditingProductId,
    featureImageFile,
    setFeatureImageFile,
    galleryImageFiles,
    setGalleryImageFiles,
    featureImagePreview,
    setFeatureImagePreview,
    galleryImagePreviews,
    setGalleryImagePreviews,
    fileInputKey,
    setFileInputKey,
    saveError,
    setSaveError,
    saveSuccess,
    setSaveSuccess,
    duplicatePopupMessage,
    setDuplicatePopupMessage,
    form,
    setForm,
    generateAutoSku,
    previewBrand,
    previewModel,
    previewSeries,
    livePreviewTitle,
    handleFieldChange,
    handleResetForm,
    handleEditProduct,
    openAddProduct,
    openAddBundle,
  };
}
