export const optionalId = (value) => (value ? Number(value) : null);

export const validateProductForm = ({
  form,
  selectedCategory,
  selectedSubCategory,
  selectedBrand,
  selectedModel,
  selectedSeries,
}) => {
  if (form.is_bundle) {
    if (!form.name || !form.name.trim()) {
      return "Please enter a package / bundle kit name.";
    }
    if (!form.bundle_items || form.bundle_items.length === 0) {
      return "Please add at least one component to this bundle kit.";
    }
  } else {
    if (
      !selectedCategory ||
      !selectedSubCategory ||
      !selectedBrand ||
      !form.name ||
      !selectedModel ||
      !selectedSeries
    ) {
      return "Please select all cascading fields from Category to Series.";
    }
  }
  return null;
};

export const checkDuplicateProduct = ({
  form,
  products = [],
  editingProductId = null,
  selectedCategory,
  selectedSubCategory,
  selectedBrand,
  selectedModel,
  selectedSeries,
}) => {
  if (editingProductId || form.is_bundle) return false;

  const norm = (val) => String(val || "").trim().toLowerCase();
  const inputSku = norm(form.sku);
  const inputBarcode = norm(form.barcode);
  const inputName = norm(form.name);
  const catId = optionalId(selectedCategory || form.category_id);
  const subCatId = optionalId(selectedSubCategory || form.sub_category_id);
  const brandId = optionalId(selectedBrand || form.brand_id);
  const modelId = optionalId(selectedModel || form.model_id);
  const seriesId = optionalId(selectedSeries || form.series_id);

  return products.some((p) => {
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
};

export const buildProductPayload = ({
  form,
  selectedCategory,
  selectedSubCategory,
  selectedBrand,
  selectedModel,
  selectedSeries,
}) => {
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

  return {
    ...form,
    is_bundle: Boolean(form.is_bundle),
    bundle_items: form.is_bundle ? form.bundle_items : [],
    unit_name: form.unit_name || "Pcs",
    sub_unit_name: form.enable_sub_unit ? (form.sub_unit_name || null) : null,
    conversion_rate: form.enable_sub_unit ? (Number(form.conversion_rate) || 1) : 1,
    sub_unit_selling_price: form.enable_sub_unit && form.sub_unit_selling_price ? Number(form.sub_unit_selling_price) : null,
    sub_unit_barcode: form.enable_sub_unit && form.sub_unit_barcode ? String(form.sub_unit_barcode).trim() : null,
    category_id: optionalId(selectedCategory || form.category_id),
    sub_category_id: optionalId(selectedSubCategory || form.sub_category_id),
    brand_id: optionalId(selectedBrand || form.brand_id),
    model_id: optionalId(selectedModel || form.model_id),
    series_id: optionalId(selectedSeries || form.series_id),
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
};

export const buildProductFormData = ({ payload, featureImageFile, galleryImageFiles }) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined) {
      if (k === 'bundle_items') {
        formData.append(k, JSON.stringify(v));
      } else if (v === null) {
        formData.append(k, "");
      } else {
        formData.append(k, String(v));
      }
    }
  });

  const isSerialReq = payload.is_serial_required;
  const isWarrantyReq = payload.is_warranty_required;
  formData.append("is_serial_required", isSerialReq ? "true" : "false");
  formData.append("is_warranty_required", isWarrantyReq ? "true" : "false");
  formData.append("isSerialRequired", isSerialReq ? "true" : "false");
  formData.append("isWarrantyRequired", isWarrantyReq ? "true" : "false");

  if (featureImageFile) {
    formData.append("images", featureImageFile);
    formData.append("feature_image", featureImageFile);
  }
  (galleryImageFiles || []).forEach((file) => formData.append("images", file));

  return formData;
};
