import { useState, useEffect, useMemo } from "react";
import API_BASE from "../../../services/api";

const API = `${API_BASE}/master`;
const CATEGORY_API = `${API_BASE}/categories`;

export default function useProductAttributes({ onEntityCreated } = {}) {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [allProductNames, setAllProductNames] = useState([]);
  const [productNames, setProductNames] = useState([]);
  const [models, setModels] = useState([]);
  const [series, setSeries] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedSeries, setSelectedSeries] = useState("");

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

  const fetchJson = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Request failed");
    return res.json();
  };

  const loadAttributes = async () => {
    try {
      const [
        categoryData,
        subCategoryData,
        brandData,
        modelData,
        seriesData,
        productNamesData,
      ] = await Promise.all([
        fetchJson(`${API}/categories`),
        fetchJson(`${API}/sub_categories`),
        fetchJson(`${API}/brands`),
        fetchJson(`${API}/models`),
        fetchJson(`${API}/series`),
        fetchJson(`${API}/product_names`).catch(() => []),
      ]);

      setCategories(Array.isArray(categoryData) ? categoryData : categoryData?.data || []);
      setSubCategories(Array.isArray(subCategoryData) ? subCategoryData : subCategoryData?.data || []);
      setBrands(Array.isArray(brandData) ? brandData : brandData?.data || []);
      setModels(Array.isArray(modelData) ? modelData : modelData?.data || []);
      setSeries(Array.isArray(seriesData) ? seriesData : seriesData?.data || []);
      const allPNames = Array.isArray(productNamesData) ? productNamesData : productNamesData?.data || [];
      setAllProductNames(allPNames);
      setProductNames([]);
    } catch (error) {
      console.error("Attributes fetch error:", error);
    }
  };

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
    if (selectedCategory && selectedCategory !== "undefined" && selectedCategory !== "null") {
      query.set("category_id", selectedCategory);
    }

    fetchJson(`${API}/product_names?${query.toString()}`)
      .then((data) => {
        const items = Array.isArray(data) ? data : (data?.data || []);
        // Strict brand matching: only items associated with this specific brand
        const filtered = items.filter((p) => String(p.brand_id) === String(selectedBrand));
        setProductNames(filtered);
      })
      .catch(() => setProductNames([]));
  }, [selectedBrand, selectedSubCategory, selectedCategory]);

  useEffect(() => {
    const isBrandValid = selectedBrand && selectedBrand !== "undefined" && selectedBrand !== "null";
    if (!isBrandValid) {
      setModels([]);
      return;
    }
    const query = new URLSearchParams();
    query.set("brand_id", selectedBrand);
    if (selectedCategory && selectedCategory !== "undefined" && selectedCategory !== "null") {
      query.set("category_id", selectedCategory);
    }
    if (selectedSubCategory && selectedSubCategory !== "undefined" && selectedSubCategory !== "null") {
      query.set("sub_category_id", selectedSubCategory);
    }

    fetchJson(`${API}/models?${query.toString()}`)
      .then((data) => {
        const items = Array.isArray(data) ? data : (data?.data || []);
        const filtered = items.filter((m) => String(m.brand_id) === String(selectedBrand));
        setModels(filtered);
      })
      .catch(() => setModels([]));
  }, [selectedBrand, selectedCategory, selectedSubCategory]);

  useEffect(() => {
    const isModelValid = selectedModel && selectedModel !== "undefined" && selectedModel !== "null";
    if (!isModelValid) {
      setSeries([]);
      return;
    }
    fetchJson(`${API}/series?model_id=${selectedModel}`)
      .then((data) => {
        const items = Array.isArray(data) ? data : (data?.data || []);
        const filtered = items.filter((s) => String(s.model_id) === String(selectedModel));
        setSeries(filtered);
      })
      .catch(() => setSeries([]));
  }, [selectedModel]);

  const mergeCreatedItem = (entity, item) => {
    const setters = {
      categories: setCategories,
      sub_categories: setSubCategories,
      brands: setBrands,
      product_names: setProductNames,
      models: setModels,
      series: setSeries,
    };
    if (entity === "product_names") {
      setAllProductNames((prev) => [item, ...prev.filter((p) => p.id !== item.id)]);
      setProductNames((prev) => [item, ...prev.filter((p) => p.id !== item.id)]);
    } else if (setters[entity]) {
      setters[entity]((prev) => [item, ...prev.filter((p) => p.id !== item.id)]);
    }
  };

  const persistMasterItem = async (entity, payload) => {
    const res = await fetch(`${API}/${entity}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result?.message || result?.error || `Failed to create ${entity}`);
    return result?.data || result;
  };

  const refreshAttributeEntity = async (entity) => {
    const data = await fetchJson(`${API}/${entity}`);
    const items = Array.isArray(data) ? data : (data?.data || []);
    const setters = {
      categories: setCategories,
      sub_categories: setSubCategories,
      brands: setBrands,
      product_names: setProductNames,
      models: setModels,
      series: setSeries,
    };
    if (setters[entity]) setters[entity](items);
  };

  const saveAttributeItem = async (entity) => {
    setAttributeError("");
    try {
      const payload =
        entity === "sub_categories"
          ? { name: attributeDraft.sub_categories, category_id: Number(attributeDraft.sub_category_parent) }
          : { name: attributeDraft.categories };
      const created = await persistMasterItem(entity, payload);
      const item = created?.data || created;
      mergeCreatedItem(entity, item);
      setAttributeDraft((prev) => ({
        ...prev,
        [entity]: "",
        ...(entity === "sub_categories" ? { sub_category_parent: "" } : {}),
      }));
      setShowAttributeAdd((prev) => ({ ...prev, [entity]: false }));
      await refreshAttributeEntity(entity);
    } catch (error) {
      setAttributeError(error.message);
    }
  };

  const openQuickAddModal = (entity, context = {}) => {
    const map = {
      categories: { title: "Quick Add Category", label: "Category Name", placeholder: "e.g., Network Accessories", entityLabel: "Category" },
      sub_categories: { title: "Quick Add Sub-category", label: "Sub-category Name", placeholder: "e.g., Cat-6 UTP Cable", entityLabel: "Sub-category" },
      brands: { title: "Quick Add Brand", label: "Brand Name", placeholder: "e.g., Hikvision", entityLabel: "Brand" },
      product_names: { title: "Quick Add Product Name", label: "Product Name", placeholder: "e.g., Bullet IP Camera", entityLabel: "Product Name" },
      models: { title: "Quick Add Model", label: "Model Number/Name", placeholder: "e.g., DS-2CD2043G2-I", entityLabel: "Model" },
      series: { title: "Quick Add Series", label: "Series Name", placeholder: "e.g., ColorVu Series", entityLabel: "Series" },
    };
    const config = map[entity] || { title: `Add ${entity}`, label: "Name", placeholder: "Enter name...", entityLabel: entity };

    let parentName = context?.parentName || "";
    let parentType = context?.parentType || "";

    if (!parentName) {
      if (entity === "sub_categories" && selectedCategory) {
        parentName = categories.find((c) => String(c.id) === String(selectedCategory))?.name || "";
        parentType = "Category";
      } else if (entity === "brands" && selectedSubCategory) {
        parentName = catalogSubCategories.find((s) => String(s.id) === String(selectedSubCategory))?.name || "";
        parentType = "Sub-category";
      } else if (entity === "product_names" && selectedBrand) {
        parentName = catalogBrands.find((b) => String(b.id) === String(selectedBrand))?.name || "";
        parentType = "Brand";
      } else if (entity === "models") {
        parentName = context?.productName || catalogBrands.find((b) => String(b.id) === String(selectedBrand))?.name || "";
        parentType = context?.productName ? "Product Name" : "Brand";
      } else if (entity === "series" && selectedModel) {
        parentName = models.find((m) => String(m.id) === String(selectedModel))?.name || "";
        parentType = "Model";
      }
    }

    setQuickAdd({
      isOpen: true,
      entity,
      title: config.title,
      subtitle: parentName ? `Adding new ${config.entityLabel} under: ${parentName}` : `Registering new ${config.entityLabel}`,
      label: config.label,
      placeholder: config.placeholder,
      entityLabel: config.entityLabel,
      parentName,
      parentType,
      value: "",
      extraInfo: "",
      error: "",
      loading: false,
    });
  };

  const handleQuickAddSave = async (customValue) => {
    if (customValue && typeof customValue.preventDefault === "function") {
      customValue.preventDefault();
      customValue = undefined;
    }
    const val = (typeof customValue === "string" ? customValue : (quickAdd.value || "")).trim();
    if (!val) {
      setQuickAdd((prev) => ({ ...prev, error: "Please enter a name." }));
      return null;
    }
    setQuickAdd((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const payload = { name: val };
      if (quickAdd.entity === "sub_categories" && selectedCategory) payload.category_id = Number(selectedCategory);
      if (quickAdd.entity === "brands" && selectedSubCategory) payload.sub_category_id = Number(selectedSubCategory);
      if (quickAdd.entity === "product_names") {
        if (selectedBrand) payload.brand_id = Number(selectedBrand);
        if (selectedCategory) payload.category_id = Number(selectedCategory);
        if (selectedSubCategory) payload.sub_category_id = Number(selectedSubCategory);
      }
      if (quickAdd.entity === "models") {
        if (selectedBrand) payload.brand_id = Number(selectedBrand);
        if (selectedCategory) payload.category_id = Number(selectedCategory);
        if (selectedSubCategory) payload.sub_category_id = Number(selectedSubCategory);
      }
      if (quickAdd.entity === "series") {
        if (selectedModel) payload.model_id = Number(selectedModel);
        if (selectedBrand) payload.brand_id = Number(selectedBrand);
      }

      const created = await persistMasterItem(quickAdd.entity, payload);
      const item = created?.data || created;
      mergeCreatedItem(quickAdd.entity, item);

      if (item && item.id) {
        if (quickAdd.entity === "categories") setSelectedCategory(String(item.id));
        if (quickAdd.entity === "sub_categories") setSelectedSubCategory(String(item.id));
        if (quickAdd.entity === "brands") setSelectedBrand(String(item.id));
        if (quickAdd.entity === "models") setSelectedModel(String(item.id));
        if (quickAdd.entity === "series") setSelectedSeries(String(item.id));
        if (typeof onEntityCreated === "function") {
          onEntityCreated(quickAdd.entity, item);
        }
      }

      setQuickAdd((prev) => ({ ...prev, isOpen: false, loading: false, value: "", error: "" }));
      return item;
    } catch (error) {
      setQuickAdd((prev) => ({ ...prev, loading: false, error: error.message }));
      return null;
    }
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

  const handleQuickEditSave = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    const val = (quickEdit.value || "").trim();
    if (!val) {
      setQuickEdit((prev) => ({ ...prev, error: "Name cannot be empty." }));
      return;
    }
    setQuickEdit((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const res = await fetch(`${API}/${quickEdit.entity}/${quickEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: val }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to update item");

      await refreshAttributeEntity(quickEdit.entity);
      setQuickEdit({ isOpen: false, entity: "", id: null, title: "", subtitle: "", label: "Name", value: "", loading: false, error: "" });
    } catch (err) {
      setQuickEdit((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  };

  const deleteAttribute = async (entity, target) => {
    const id = typeof target === "object" && target !== null ? target.id : target;
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`${API}/${entity}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || "Delete failed");
      }
      await refreshAttributeEntity(entity);
    } catch (err) {
      alert("Error deleting item: " + err.message);
    }
  };

  return {
    categories,
    subCategories,
    brands,
    allProductNames,
    productNames,
    models,
    series,
    selectedCategory,
    setSelectedCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    selectedBrand,
    setSelectedBrand,
    selectedModel,
    setSelectedModel,
    selectedSeries,
    setSelectedSeries,
    catalogSubCategories,
    catalogBrands,
    loadAttributes,
    showAttributeAdd,
    setShowAttributeAdd,
    attributeDraft,
    setAttributeDraft,
    attributeError,
    setAttributeError,
    quickAdd,
    setQuickAdd,
    quickEdit,
    setQuickEdit,
    openQuickAddModal,
    handleQuickAddSave,
    openQuickEditModal,
    handleQuickEditSave,
    deleteAttribute,
    saveAttributeItem,
    refreshAttributeEntity,
  };
}
