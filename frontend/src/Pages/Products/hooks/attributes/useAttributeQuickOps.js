import { useState } from "react";
import API_BASE, { getAuthHeaders } from "../../../../services/api";
import {
  buildQuickAddConfig,
  buildQuickAddPayload,
  buildQuickEditConfig,
} from "../attributeUtils";
import { useAttributeInlineAdd } from "./useAttributeInlineAdd";

const API = `${API_BASE}/master`;

export function useAttributeQuickOps({ cascading, onEntityCreated }) {
  const inlineAdd = useAttributeInlineAdd({ cascading });

  const {
    categories,
    subCategories,
    brands,
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
    models,
    series,
  } = cascading;

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

  const openQuickAddModal = (entity, context = {}) => {
    const config = buildQuickAddConfig(
      entity,
      context,
      {
        selectedCategory,
        selectedSubCategory,
        selectedBrand,
        selectedModel,
        selectedSeries,
      },
      {
        categories,
        subCategories,
        catalogSubCategories,
        brands,
        catalogBrands,
        models,
        series,
      }
    );
    setQuickAdd(config);
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
      const payload = buildQuickAddPayload(quickAdd.entity, val, {
        selectedCategory,
        selectedSubCategory,
        selectedBrand,
        selectedModel,
        selectedSeries,
      });

      const created = await inlineAdd.persistMasterItem(quickAdd.entity, payload);
      const item = created?.data || created;
      inlineAdd.mergeCreatedItem(quickAdd.entity, item);

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
    setQuickEdit(buildQuickEditConfig(entity, item));
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
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ name: val }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to update item");

      await inlineAdd.refreshAttributeEntity(quickEdit.entity);
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
      const res = await fetch(`${API}/${entity}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || "Delete failed");
      }
      await inlineAdd.refreshAttributeEntity(entity);
    } catch (err) {
      alert("Error deleting item: " + err.message);
    }
  };

  return {
    ...inlineAdd,
    quickAdd,
    setQuickAdd,
    quickEdit,
    setQuickEdit,
    openQuickAddModal,
    handleQuickAddSave,
    openQuickEditModal,
    handleQuickEditSave,
    deleteAttribute,
  };
}
