import { useState } from "react";
import API_BASE, { getAuthHeaders } from "../../../../services/api";
import { getMergedArray, sortAlphabetically } from "../attributeUtils";

const API = `${API_BASE}/master`;

export function useAttributeInlineAdd({ cascading }) {
  const {
    setCategories,
    setSubCategories,
    setBrands,
    setAllProductNames,
    setProductNames,
    setModels,
    setSeries,
    fetchJson,
  } = cascading;

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
      setAllProductNames((prev) => getMergedArray(prev, item));
      setProductNames((prev) => getMergedArray(prev, item));
    } else if (setters[entity]) {
      setters[entity]((prev) => getMergedArray(prev, item));
    }
  };

  const persistMasterItem = async (entity, payload) => {
    const res = await fetch(`${API}/${entity}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
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
    if (setters[entity]) setters[entity](sortAlphabetically(items));
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

  return {
    showAttributeAdd,
    setShowAttributeAdd,
    attributeDraft,
    setAttributeDraft,
    attributeError,
    setAttributeError,
    mergeCreatedItem,
    persistMasterItem,
    refreshAttributeEntity,
    saveAttributeItem,
  };
}
