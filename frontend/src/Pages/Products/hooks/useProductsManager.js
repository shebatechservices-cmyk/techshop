import { useState, useEffect, useMemo } from "react";
import API_BASE from "../../../services/api";

const API = `${API_BASE}/master`;
const CATEGORY_API = `${API_BASE}/categories`;

export default function useProductsManager({ initialTab = "catalog", initialSearch = "" } = {}) {
  const [activeTab, setActiveTab] = useState(initialTab || "catalog");
  const [productFilterQuery, setProductFilterQuery] = useState(initialSearch || "");
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [productNames, setProductNames] = useState([]);
  const [models, setModels] = useState([]);
  const [series, setSeries] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [openProductAction, setOpenProductAction] = useState(null);
  const productsPerPage = 20;

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedSeries, setSelectedSeries] = useState("");

  const [quickAdd, setQuickAdd] = useState({
    isOpen: false,
    entity: null,
    title: "",
    subtitle: "",
    label: "",
    placeholder: "",
    value: "",
    extraInfo: "",
    error: "",
    loading: false,
  });

  const [quickEdit, setQuickEdit] = useState({
    isOpen: false,
    entity: "",
    id: null,
    title: "",
    subtitle: "",
    label: "Name",
    value: "",
    loading: false,
    error: "",
  });

  const generateAutoSku = () => `SKU-${Math.floor(100000 + Math.random() * 900000)}`;

  const [featureImageFile, setFeatureImageFile] = useState(null);
  const [galleryImageFiles, setGalleryImageFiles] = useState([]);
  const [featureImagePreview, setFeatureImagePreview] = useState(null);
  const [galleryImagePreviews, setGalleryImagePreviews] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [duplicatePopupMessage, setDuplicatePopupMessage] = useState("");

  const [showAttributeAdd, setShowAttributeAdd] = useState({
    categories: false,
    sub_categories: false,
  });
  const [attributeDraft, setAttributeDraft] = useState({
    categories: "",
    sub_categories: "",
    sub_category_parent: "",
  });
  const [attributeError, setAttributeError] = useState("");

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

  const fetchJson = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Request failed");
    return res.json();
  };

  const reloadProducts = async () => {
    const productData = await fetchJson(`${API}/products`);
    setProducts(productData);
  };

  const loadData = async () => {
    try {
      const [
        categoryData,
        subCategoryData,
        brandData,
        modelData,
        seriesData,
        productData,
        productNamesData,
      ] = await Promise.all([
        fetchJson(`${API}/categories`),
        fetchJson(`${API}/sub_categories`),
        fetchJson(`${API}/brands`),
        fetchJson(`${API}/models`),
        fetchJson(`${API}/series`),
        fetchJson(`${API}/products`),
        fetchJson(`${API}/product_names`).catch(() => []),
      ]);

      setCategories(categoryData);
      setSubCategories(subCategoryData);
      setBrands(brandData);
      setModels(modelData);
      setSeries(seriesData);
      setProducts(productData);
      setProductNames(productNamesData || []);
    } catch (error) {
      console.error("Initial products fetch error:", error);
    }
  };

  useEffect(() => {
    loadData();

    const handleOpenAddProductEvent = () => {
      setActiveTab("catalog");
      handleResetForm();
      setIsAddProductOpen(true);
    };
    const handleStockReload = () => {
      reloadProducts();
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

  const catalogSubCategories = useMemo(() => {
    return selectedCategory
      ? subCategories.filter((item) => String(item.category_id) === String(selectedCategory))
      : [];
  }, [subCategories, selectedCategory]);

  const catalogBrands = useMemo(() => {
    return selectedSubCategory
      ? brands.filter(
          (item) =>
            !item.sub_category_id ||
            String(item.sub_category_id) === String(selectedSubCategory)
        )
      : brands;
  }, [brands, selectedSubCategory]);

  useEffect(() => {
    const isBrandValid = selectedBrand && selectedBrand !== "undefined" && selectedBrand !== "null";
    if (!isBrandValid) {
      setProductNames([]);
      return;
    }
    const query = new URLSearchParams();
    query.set("brand_id", selectedBrand);
    if (selectedSubCategory && selectedSubCategory !== "undefined" && selectedSubCategory !== "null") {
      query.set("sub_category_id", selectedSubCategory);
    }
    fetchJson(`${API}/product_names?${query.toString()}`)
      .then((data) => setProductNames(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Product names fetch error:", err));
  }, [selectedBrand, selectedSubCategory]);

  useEffect(() => {
    if (!selectedBrand || selectedBrand === "undefined" || selectedBrand === "null") {
      setModels([]);
      setSelectedModel("");
      return;
    }

    const queryObj = { brand_id: selectedBrand };
    if (selectedCategory && selectedCategory !== "undefined" && selectedCategory !== "null") {
      queryObj.category_id = selectedCategory;
    }
    if (selectedSubCategory && selectedSubCategory !== "undefined" && selectedSubCategory !== "null") {
      queryObj.sub_category_id = selectedSubCategory;
    }
    const query = new URLSearchParams(queryObj).toString();

    fetchJson(`${API}/models?${query}`)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setModels(list);
        setSelectedModel((prev) => (prev && list.some((m) => String(m.id) === String(prev)) ? prev : ""));
      })
      .catch((err) => console.error(err));
  }, [selectedBrand, selectedCategory, selectedSubCategory]);

  useEffect(() => {
    if (!selectedBrand || selectedBrand === "undefined" || selectedBrand === "null") {
      setSeries([]);
      setSelectedSeries("");
      return;
    }

    const seriesQuery = new URLSearchParams({ brand_id: selectedBrand });
    if (selectedModel && selectedModel !== "undefined" && selectedModel !== "null") {
      seriesQuery.set("model_id", selectedModel);
    }

    fetchJson(`${API}/series?${seriesQuery.toString()}`)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setSeries(list);
        setSelectedSeries((prev) => (prev && list.some((s) => String(s.id) === String(prev)) ? prev : ""));
      })
      .catch((err) => console.error(err));
  }, [selectedBrand, selectedModel]);

  useEffect(() => {
    if (!openProductAction) return;
    const handleClickOutside = () => setOpenProductAction(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openProductAction]);

  const persistMasterItem = async (entity, payload) => {
    const name = String(payload.name || "").trim();
    if (!name) throw new Error("Please enter a name");

    let url = `${API}/${entity}`;
    let body = { ...payload, name };

    if (entity === "categories") {
      url = `${CATEGORY_API}/add`;
      body = { name };
    } else if (entity === "sub_categories") {
      if (!payload.category_id) throw new Error("Please select a category");
      url = `${CATEGORY_API}/sub/add`;
      body = { name, category_id: Number(payload.category_id) };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.error || "Add item failed");
    return result.data;
  };

  const mergeCreatedItem = (entity, created, { select = false } = {}) => {
    if (!created) return;
    if (entity === "categories") {
      setCategories((prev) => (prev.some((item) => item.id === created.id) ? prev : [...prev, created]));
      if (select) setSelectedCategory(String(created.id));
      return;
    }
    if (entity === "sub_categories") {
      setSubCategories((prev) => (prev.some((item) => item.id === created.id) ? prev : [...prev, created]));
      if (select) setSelectedSubCategory(String(created.id));
      return;
    }
    if (entity === "brands") {
      setBrands((prev) => (prev.some((item) => item.id === created.id) ? prev : [...prev, created]));
      if (select) setSelectedBrand(String(created.id));
      return;
    }
    if (entity === "product_names" || entity === "product_name") {
      setProductNames((prev) => (prev.some((item) => item.id === created.id || item.name === created.name) ? prev : [...prev, created]));
      if (select) {
        setForm((prev) => ({ ...prev, name: created.name, model_id: "", series_id: "" }));
        setSelectedModel("");
        setSelectedSeries("");
      }
      return;
    }
    if (entity === "models") {
      setModels((prev) => (prev.some((item) => item.id === created.id) ? prev : [...prev, created]));
      if (select) setSelectedModel(String(created.id));
      return;
    }
    if (entity === "series") {
      setSeries((prev) => (prev.some((item) => item.id === created.id) ? prev : [...prev, created]));
      if (select) setSelectedSeries(String(created.id));
      return;
    }
  };

  const openQuickAddModal = (entity) => {
    const configs = {
      categories: {
        title: "Add New Category",
        subtitle: "Create primary category group for products",
        label: "Category Name",
        placeholder: "e.g., Security & Surveillance / Networking / Computers",
        extraInfo: "",
      },
      sub_categories: {
        title: "Add New Sub-Category",
        subtitle: selectedCategory
          ? `Selected Category: "${categories.find((c) => String(c.id) === String(selectedCategory))?.name || ""}"`
          : "Create sub-category group",
        label: "Sub-Category Name",
        placeholder: "e.g., IP Cameras / WiFi Routers / Desktop Accessories",
        extraInfo: !selectedCategory ? "Please select a category first" : "",
      },
      brands: {
        title: "Add New Brand",
        subtitle: selectedSubCategory
          ? `Selected Sub-Category: "${subCategories.find((s) => String(s.id) === String(selectedSubCategory))?.name || ""}"`
          : "Add product manufacturer or brand",
        label: "Brand Name",
        placeholder: "e.g., Dahua, Hikvision, TP-Link, HP, Dell",
        extraInfo: isAddProductOpen && !selectedSubCategory ? "Please select a sub-category first" : "",
      },
      product_name: {
        title: "Add New Product Name",
        subtitle: selectedBrand
          ? `Selected Brand: "${brands.find((b) => String(b.id) === String(selectedBrand))?.name || ""}"`
          : "Define base product name or item type",
        label: "Product Name",
        placeholder: "e.g., HDD, SSD, Bullet Camera, WiFi Router, Gigabit Switch",
        extraInfo: !selectedBrand ? "Please select a brand first" : "",
      },
      product_names: {
        title: "Add New Product Name",
        subtitle: "Define base product name or item type for catalog",
        label: "Product Name",
        placeholder: "e.g., HDD, SSD, Bullet Camera, WiFi Router, Gigabit Switch",
        extraInfo: "",
      },
      models: {
        title: "Add New Model",
        subtitle: form.name
          ? `Selected Product: "${previewBrand} ${form.name}"`
          : "Add specific model name or number",
        label: "Model Name / Number",
        placeholder: "e.g., DH-IPC-HFW1230S / Archer C6 / Pavilion 15",
        extraInfo: !form.name ? "Please select a product name first" : "",
      },
      series: {
        title: "Add New Series",
        subtitle: selectedModel
          ? `Selected Model: "${previewBrand} ${form.name} ${previewModel}"`
          : "Add product series or collection family",
        label: "Series Name",
        placeholder: "e.g., Pro Series / Lite Series / Vostro / ThinkPad",
        extraInfo: !selectedModel ? "Please select a model first" : "",
      },
    };

    const config = configs[entity];
    if (!config) return;
    setQuickAdd({
      isOpen: true,
      entity,
      title: config.title,
      subtitle: config.subtitle,
      label: config.label,
      placeholder: config.placeholder,
      value: "",
      extraInfo: config.extraInfo,
      error: "",
      loading: false,
    });
  };

  const handleQuickAddSave = async (e) => {
    e.preventDefault();
    const val = quickAdd.value.trim();
    if (!val) {
      setQuickAdd((prev) => ({ ...prev, error: "Please enter a name" }));
      return;
    }

    try {
      setQuickAdd((prev) => ({ ...prev, loading: true, error: "" }));
      let payload = { name: val };
      if (quickAdd.entity === "sub_categories") {
        if (!selectedCategory) {
          setQuickAdd((prev) => ({ ...prev, loading: false, error: "Please select a category first" }));
          return;
        }
        payload.category_id = Number(selectedCategory);
      } else if (quickAdd.entity === "brands") {
        if (isAddProductOpen && !selectedSubCategory) {
          setQuickAdd((prev) => ({ ...prev, loading: false, error: "Please select a sub-category first" }));
          return;
        }
        if (selectedSubCategory) payload.sub_category_id = Number(selectedSubCategory);
      } else if (quickAdd.entity === "product_name" || quickAdd.entity === "product_names") {
        if (isAddProductOpen && !selectedBrand) {
          setQuickAdd((prev) => ({ ...prev, loading: false, error: "Please select a brand first" }));
          return;
        }
        if (selectedBrand) payload.brand_id = Number(selectedBrand);
        if (selectedCategory) payload.category_id = Number(selectedCategory);
        if (selectedSubCategory) payload.sub_category_id = Number(selectedSubCategory);
      } else if (quickAdd.entity === "models") {
        if (!selectedBrand) {
          setQuickAdd((prev) => ({ ...prev, loading: false, error: "Please select a brand first" }));
          return;
        }
        if (!form.name) {
          setQuickAdd((prev) => ({ ...prev, loading: false, error: "Please select a product name first" }));
          return;
        }
        payload.brand_id = Number(selectedBrand);
        if (selectedCategory) payload.category_id = Number(selectedCategory);
        if (selectedSubCategory) payload.sub_category_id = Number(selectedSubCategory);
      } else if (quickAdd.entity === "series") {
        if (!selectedBrand) {
          setQuickAdd((prev) => ({ ...prev, loading: false, error: "Please select a brand first" }));
          return;
        }
        if (!selectedModel) {
          setQuickAdd((prev) => ({ ...prev, loading: false, error: "Please select a model first" }));
          return;
        }
        payload.brand_id = Number(selectedBrand);
        payload.model_id = Number(selectedModel);
      }

      const targetEntity =
        quickAdd.entity === "product_name" || quickAdd.entity === "product_names"
          ? "product_names"
          : quickAdd.entity;
      const created = await persistMasterItem(targetEntity, payload);
      mergeCreatedItem(quickAdd.entity, created, { select: true });
      setQuickAdd({
        isOpen: false,
        entity: null,
        title: "",
        subtitle: "",
        label: "",
        placeholder: "",
        value: "",
        extraInfo: "",
        error: "",
        loading: false,
      });
    } catch (err) {
      setQuickAdd((prev) => ({ ...prev, loading: false, error: err.message || "Failed to add item" }));
    }
  };

  const loadDummyProducts = async () => {
    try {
      setSaveSuccess("Loading sample products...");
      const rand = Math.floor(100 + Math.random() * 900);
      const sampleItems = [
        {
          name: "2MP Full Color Bullet Camera",
          sku: `CAM-DH-2MP-${rand}`,
          stock: 25,
          min_stock: 5,
          status: "active",
          condition: "New",
          description: "Dahua 2MP Full Color Night Vision Outdoor CCTV Camera.",
        },
        {
          name: "Archer C6 AC1200 Gigabit Router",
          sku: `RTR-TPL-C6-${rand}`,
          stock: 14,
          min_stock: 3,
          status: "active",
          condition: "New",
          description: "TP-Link Dual Band Gigabit WiFi Router.",
        },
        {
          name: "4 Channel Full HD DVR Recorder",
          sku: `DVR-HIK-4CH-${rand}`,
          stock: 8,
          min_stock: 2,
          status: "active",
          condition: "New",
          description: "Hikvision 4 Channel HD Real-time Recording DVR.",
        },
        {
          name: "2TB SkyHawk Surveillance Hard Disk",
          sku: `HDD-SEA-2TB-${rand}`,
          stock: 12,
          min_stock: 4,
          status: "active",
          condition: "New",
          description: "Seagate SkyHawk Surveillance Internal Hard Drive.",
        },
        {
          name: "16 Port Fast Ethernet Desktop Switch",
          sku: `SW-DLK-16P-${rand}`,
          stock: 6,
          min_stock: 2,
          status: "active",
          condition: "New",
          description: "D-Link 16-Port Fast Ethernet Unmanaged Network Switch.",
        },
      ];

      for (const item of sampleItems) {
        await fetch(`${API}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      }
      await reloadProducts();
      setSaveSuccess("5 sample products loaded successfully. You can delete them anytime.");
    } catch (err) {
      console.error(err);
      setSaveError("Failed to load sample products.");
    }
  };

  const saveAttributeItem = async (entity) => {
    setAttributeError("");
    try {
      const payload =
        entity === "sub_categories"
          ? { name: attributeDraft.sub_categories, category_id: Number(attributeDraft.sub_category_parent) }
          : { name: attributeDraft.categories };
      const created = await persistMasterItem(entity, payload);
      mergeCreatedItem(entity, created);
      setAttributeDraft((prev) => ({
        ...prev,
        [entity]: "",
        ...(entity === "sub_categories" ? { sub_category_parent: "" } : {}),
      }));
      setShowAttributeAdd((prev) => ({ ...prev, [entity]: false }));
    } catch (error) {
      setAttributeError(error.message);
    }
  };

  const refreshAttributeEntity = async (entity) => {
    const data = await fetchJson(`${API}/${entity}`);
    const setters = {
      categories: setCategories,
      sub_categories: setSubCategories,
      brands: setBrands,
      product_names: setProductNames,
      models: setModels,
      series: setSeries,
    };
    if (setters[entity]) setters[entity](data);
  };

  const openQuickEditModal = (entity, item) => {
    const titleMap = {
      categories: "Category",
      sub_categories: "Sub-category",
      brands: "Brand",
      product_names: "Product Name",
      models: "Model",
      series: "Series",
    };
    setQuickEdit({
      isOpen: true,
      entity,
      id: item.id,
      title: `Edit ${titleMap[entity] || entity}`,
      subtitle: `Update name for "${item.name}"`,
      label: "Name",
      value: item.name,
      loading: false,
      error: "",
    });
  };

  const handleQuickEditSave = async (event) => {
    event.preventDefault();
    const trimmed = quickEdit.value.trim();
    if (!trimmed) {
      setQuickEdit((prev) => ({ ...prev, error: "Name cannot be empty" }));
      return;
    }
    setQuickEdit((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const res = await fetch(`${API}/${quickEdit.entity}/${quickEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update attribute");
      await refreshAttributeEntity(quickEdit.entity);
      await reloadProducts();
      setQuickEdit((prev) => ({ ...prev, isOpen: false, loading: false }));
      setSaveSuccess(`${quickEdit.title} updated successfully.`);
    } catch (err) {
      setQuickEdit((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  };

  const deleteAttribute = async (entity, item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    try {
      const response = await fetch(`${API}/${entity}/${item.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        await refreshAttributeEntity(entity);
        await reloadProducts();
        setSaveSuccess(data.message || "Deleted successfully.");
      } else {
        window.alert(data.error || "This attribute cannot be deleted because it is used in the catalog.");
      }
    } catch (err) {
      window.alert("Network error while deleting attribute.");
    }
  };

  const handleFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    const finalVal = type === "checkbox" ? checked : value;
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
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedSeries("");
    setFeatureImageFile(null);
    setGalleryImageFiles([]);
    setFeatureImagePreview(null);
    setGalleryImagePreviews([]);
    setFileInputKey((k) => k + 1);
    setSaveError("");
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product.id);
    setSelectedCategory(product.category_id ? String(product.category_id) : "");
    setSelectedSubCategory(product.sub_category_id ? String(product.sub_category_id) : "");
    setSelectedBrand(product.brand_id ? String(product.brand_id) : "");
    setSelectedModel(product.model_id ? String(product.model_id) : "");
    setSelectedSeries(product.series_id ? String(product.series_id) : "");
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
    setOpenProductAction(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaveError("");
    setSaveSuccess("");
    setDuplicatePopupMessage("");

    if (form.is_bundle) {
      if (!form.name || !form.name.trim()) {
        setSaveError("Please enter a package / bundle kit name.");
        return;
      }
      if (!form.bundle_items || form.bundle_items.length === 0) {
        setSaveError("Please add at least one component to this bundle kit.");
        return;
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
        setSaveError("Please select all cascading fields from Category to Series.");
        return;
      }
    }

    const optionalId = (value) => (value ? Number(value) : null);

    // Check duplicate in catalog before submitting
    if (!editingProductId && !form.is_bundle) {
      const norm = (val) => String(val || "").trim().toLowerCase();
      const inputSku = norm(form.sku);
      const inputBarcode = norm(form.barcode);
      const inputName = norm(form.name);
      const catId = optionalId(selectedCategory || form.category_id);
      const subCatId = optionalId(selectedSubCategory || form.sub_category_id);
      const brandId = optionalId(selectedBrand || form.brand_id);
      const modelId = optionalId(selectedModel || form.model_id);
      const seriesId = optionalId(selectedSeries || form.series_id);

      const isDuplicate = products.some((p) => {
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
        setSaveError(msg);
        setDuplicatePopupMessage(msg);
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

        res = await fetch(url, {
          method,
          body: formData,
        });
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
          setSaveError(msg);
          setDuplicatePopupMessage(msg);
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

      await reloadProducts();
      handleResetForm();
      setIsAddProductOpen(false);
      setSaveSuccess(
        editingProductId ? "Product updated successfully." : "Product saved successfully to catalog."
      );
      setEditingProductId(null);
    } catch (error) {
      setSaveError(error.message || "Failed to save product. Please check all fields.");
      console.error("Submit error:", error);
    }
  };

  const openAddProduct = (options = {}) => {
    handleResetForm();
    if (options && options.is_bundle) {
      setForm((p) => ({ ...p, is_bundle: true }));
    }
    setIsAddProductOpen(true);
  };

  const openAddBundle = () => openAddProduct({ is_bundle: true });

  const productLabel = (product) =>
    [product.brand_name, product.name, product.model_name, product.series_name]
      .filter(Boolean)
      .filter((value, index, values) => values.indexOf(value) === index)
      .join(" ");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!productFilterQuery.trim()) return true;
      const q = productFilterQuery.trim().toLowerCase();
      const label = productLabel(p).toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      const barcode = (p.barcode || "").toLowerCase();
      const cat = (p.category_name || "").toLowerCase();
      const sub = (p.sub_category_name || "").toLowerCase();
      return (
        label.includes(q) ||
        sku.includes(q) ||
        barcode.includes(q) ||
        cat.includes(q) ||
        sub.includes(q)
      );
    });
  }, [products, productFilterQuery]);

  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  const toggleProduct = (id) =>
    setSelectedProductIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );

  const toggleAllProducts = () => {
    const ids = visibleProducts.map((product) => product.id);
    setSelectedProductIds((current) =>
      ids.every((id) => current.includes(id))
        ? current.filter((id) => !ids.includes(id))
        : [...new Set([...current, ...ids])]
    );
  };

  const deleteProduct = async (id) => {
    try {
      const response = await fetch(`${API}/products/${id}`, { method: "DELETE" });
      if (response.ok) {
        setProducts((current) => current.filter((product) => product.id !== id));
        setSelectedProductIds((current) => current.filter((item) => item !== id));
        window.dispatchEvent(new CustomEvent("data_changed"));
      } else {
        const errData = await response.json().catch(() => null);
        alert(
          errData?.error ||
            "Cannot delete this product because it has associated sales or purchase records. You can deactivate it instead."
        );
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to server.");
    }
    setOpenProductAction(null);
  };

  const toggleProductStatus = async (product) => {
    const status = product.status === "active" ? "inactive" : "active";
    const response = await fetch(`${API}/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok)
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? { ...item, status } : item))
      );
    setOpenProductAction(null);
  };

  const previewBrand = brands.find((item) => String(item.id) === String(selectedBrand))?.name || "";
  const previewModel = models.find((item) => String(item.id) === String(selectedModel))?.name || "";
  const previewSeries = series.find((item) => String(item.id) === String(selectedSeries))?.name || "";
  const livePreviewParts = [previewBrand, form.name?.trim(), previewModel, previewSeries].filter(Boolean);
  const livePreviewTitle = livePreviewParts.join(" ");

  const handleCategoryChange = (event) => {
    const value = event.target.value;
    setSelectedCategory(value);
    setSelectedSubCategory("");
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedSeries("");
    setForm((current) => ({
      ...current,
      category_id: value,
      sub_category_id: "",
      brand_id: "",
      model_id: "",
      series_id: "",
      name: "",
    }));
  };

  const handleSubCategoryChange = (event) => {
    const value = event.target.value;
    setSelectedSubCategory(value);
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedSeries("");
    setForm((current) => ({
      ...current,
      sub_category_id: value,
      brand_id: "",
      model_id: "",
      series_id: "",
      name: "",
    }));
  };

  const handleBrandChange = (event) => {
    const value = event.target.value;
    setSelectedBrand(value);
    setSelectedModel("");
    setSelectedSeries("");
    setForm((current) => ({
      ...current,
      brand_id: value,
      model_id: "",
      series_id: "",
      name: "",
    }));
  };

  const handleProductNameChange = (event) => {
    const value = event.target.value;
    setSelectedModel("");
    setSelectedSeries("");
    setForm((current) => ({
      ...current,
      name: value,
      model_id: "",
      series_id: "",
    }));
  };

  const handleModelChange = (event) => {
    const value = event.target.value;
    setSelectedModel(value);
    setSelectedSeries("");
    setForm((current) => ({
      ...current,
      model_id: value,
      series_id: "",
    }));
  };

  const handleSeriesChange = (event) => {
    const value = event.target.value;
    setSelectedSeries(value);
    setForm((current) => ({ ...current, series_id: value }));
  };

  return {
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
    previewBrand,
    previewModel,
    previewSeries,
    livePreviewTitle,
    filteredProducts,
    totalProductPages,
    visibleProducts,
    productLabel,
    generateAutoSku,
    reloadProducts,
    loadData,
    loadDummyProducts,
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
    openAddBundle,
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
  };
}
