import { useState, useEffect, useMemo } from "react";
import API_BASE, { getAuthHeaders } from "../../../../services/api";
import { sortAlphabetically } from "../attributeUtils";

const API = `${API_BASE}/master`;

export function useAttributeCascading() {
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

  const fetchJson = async (url) => {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...getAuthHeaders(),
      },
    });
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

      setCategories(sortAlphabetically(Array.isArray(categoryData) ? categoryData : categoryData?.data || []));
      setSubCategories(sortAlphabetically(Array.isArray(subCategoryData) ? subCategoryData : subCategoryData?.data || []));
      setBrands(sortAlphabetically(Array.isArray(brandData) ? brandData : brandData?.data || []));
      setModels(sortAlphabetically(Array.isArray(modelData) ? modelData : modelData?.data || []));
      setSeries(sortAlphabetically(Array.isArray(seriesData) ? seriesData : seriesData?.data || []));
      const allPNames = sortAlphabetically(Array.isArray(productNamesData) ? productNamesData : productNamesData?.data || []);
      setAllProductNames(allPNames);
      setProductNames([]);
    } catch (error) {
      console.error("Attributes fetch error:", error);
    }
  };

  useEffect(() => {
    loadAttributes();
  }, []);

  const catalogSubCategories = useMemo(() => {
    return selectedCategory
      ? sortAlphabetically(subCategories.filter((item) => String(item.category_id) === String(selectedCategory)))
      : [];
  }, [subCategories, selectedCategory]);

  const catalogBrands = useMemo(() => {
    return sortAlphabetically(Array.isArray(brands) ? brands : []);
  }, [brands]);

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
        const filtered = items.filter((p) => String(p.brand_id) === String(selectedBrand));
        setProductNames(sortAlphabetically(filtered));
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
        setModels(sortAlphabetically(filtered));
      })
      .catch(() => setModels([]));
  }, [selectedBrand, selectedCategory, selectedSubCategory]);

  useEffect(() => {
    const isBrandValid = selectedBrand && selectedBrand !== "undefined" && selectedBrand !== "null";
    if (!isBrandValid) {
      setSeries([]);
      return;
    }
    fetchJson(`${API}/series?brand_id=${selectedBrand}`)
      .then((data) => {
        const items = Array.isArray(data) ? data : (data?.data || []);
        const filtered = items.filter((s) => String(s.brand_id) === String(selectedBrand));
        setSeries(sortAlphabetically(filtered));
      })
      .catch(() => setSeries([]));
  }, [selectedBrand]);

  return {
    categories,
    setCategories,
    subCategories,
    setSubCategories,
    brands,
    setBrands,
    allProductNames,
    setAllProductNames,
    productNames,
    setProductNames,
    models,
    setModels,
    series,
    setSeries,
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
    fetchJson,
  };
}
