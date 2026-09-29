/**
 * Pure Utility Helpers for Product Attributes Management
 */

/**
 * Merge newly created/updated entity into existing array maintaining uniqueness by ID
 */
export const getMergedArray = (prevArray = [], newItem) => {
  if (!newItem || newItem.id === undefined) return prevArray;
  return [newItem, ...(prevArray || []).filter((p) => p.id !== newItem.id)];
};

/**
 * Builds the modal configuration object for Quick Add Attribute Modal
 */
export const buildQuickAddConfig = (
  entity,
  context = {},
  selections = {},
  catalogs = {}
) => {
  const map = {
    categories: {
      title: "Quick Add Category",
      label: "Category Name",
      placeholder: "e.g., Network Accessories",
      entityLabel: "Category",
    },
    sub_categories: {
      title: "Quick Add Sub-category",
      label: "Sub-category Name",
      placeholder: "e.g., Cat-6 UTP Cable",
      entityLabel: "Sub-category",
    },
    brands: {
      title: "Quick Add Brand",
      label: "Brand Name",
      placeholder: "e.g., Hikvision",
      entityLabel: "Brand",
    },
    product_names: {
      title: "Quick Add Product Name",
      label: "Product Name",
      placeholder: "e.g., Bullet IP Camera",
      entityLabel: "Product Name",
    },
    models: {
      title: "Quick Add Model",
      label: "Model Number/Name",
      placeholder: "e.g., DS-2CD2043G2-I",
      entityLabel: "Model",
    },
    series: {
      title: "Quick Add Series",
      label: "Series Name",
      placeholder: "e.g., ColorVu Series",
      entityLabel: "Series",
    },
  };

  const config = map[entity] || {
    title: `Add ${entity}`,
    label: "Name",
    placeholder: "Enter name...",
    entityLabel: entity,
  };

  const {
    selectedCategory,
    selectedSubCategory,
    selectedBrand,
    selectedModel,
  } = selections;

  const {
    categories = [],
    catalogSubCategories = [],
    catalogBrands = [],
    models = [],
  } = catalogs;

  let parentName = context?.parentName || "";
  let parentType = context?.parentType || "";

  if (!parentName) {
    if (entity === "sub_categories" && selectedCategory) {
      parentName =
        categories.find((c) => String(c.id) === String(selectedCategory))?.name ||
        "";
      parentType = "Category";
    } else if (entity === "brands" && selectedSubCategory) {
      parentName =
        catalogSubCategories.find((s) => String(s.id) === String(selectedSubCategory))
          ?.name || "";
      parentType = "Sub-category";
    } else if (entity === "product_names" && selectedBrand) {
      parentName =
        catalogBrands.find((b) => String(b.id) === String(selectedBrand))?.name ||
        "";
      parentType = "Brand";
    } else if (entity === "models") {
      parentName =
        context?.productName ||
        catalogBrands.find((b) => String(b.id) === String(selectedBrand))?.name ||
        "";
      parentType = context?.productName ? "Product Name" : "Brand";
    } else if (entity === "series" && selectedModel) {
      parentName =
        models.find((m) => String(m.id) === String(selectedModel))?.name || "";
      parentType = "Model";
    }
  }

  return {
    isOpen: true,
    entity,
    title: config.title,
    subtitle: parentName
      ? `Adding new ${config.entityLabel} under: ${parentName}`
      : `Registering new ${config.entityLabel}`,
    label: config.label,
    placeholder: config.placeholder,
    entityLabel: config.entityLabel,
    parentName,
    parentType,
    value: "",
    extraInfo: "",
    error: "",
    loading: false,
  };
};

/**
 * Builds the API payload for saving a new attribute via Quick Add
 */
export const buildQuickAddPayload = (entity, value, selections = {}) => {
  const val = (typeof value === "string" ? value : "").trim();
  const {
    selectedCategory,
    selectedSubCategory,
    selectedBrand,
    selectedModel,
  } = selections;

  const payload = { name: val };

  if (entity === "sub_categories" && selectedCategory) {
    payload.category_id = Number(selectedCategory);
  }

  if (entity === "brands" && selectedSubCategory) {
    payload.sub_category_id = Number(selectedSubCategory);
  }

  if (entity === "product_names") {
    if (selectedBrand) payload.brand_id = Number(selectedBrand);
    if (selectedCategory) payload.category_id = Number(selectedCategory);
    if (selectedSubCategory) payload.sub_category_id = Number(selectedSubCategory);
  }

  if (entity === "models") {
    if (selectedBrand) payload.brand_id = Number(selectedBrand);
    if (selectedCategory) payload.category_id = Number(selectedCategory);
    if (selectedSubCategory) payload.sub_category_id = Number(selectedSubCategory);
  }

  if (entity === "series") {
    if (selectedModel) payload.model_id = Number(selectedModel);
    if (selectedBrand) payload.brand_id = Number(selectedBrand);
  }

  return payload;
};

/**
 * Builds the modal configuration object for Quick Edit Attribute Modal
 */
export const buildQuickEditConfig = (entity, item = {}) => {
  const titleMap = {
    categories: "Category",
    sub_categories: "Sub-category",
    brands: "Brand",
    product_names: "Product Name",
    models: "Model",
    series: "Series",
  };

  return {
    isOpen: true,
    entity,
    id: item.id,
    title: `Edit ${titleMap[entity] || entity}`,
    subtitle: `Update name for "${item.name || ""}"`,
    label: "Name",
    value: item.name || "",
    loading: false,
    error: "",
  };
};
