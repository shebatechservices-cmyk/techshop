import { useState, useMemo, useEffect } from "react";
import API_BASE, { getAuthHeaders } from "../../../services/api";
import { generateDummyProducts } from "./dummyProductsData";

import { getProductLabel, matchesProductFilter } from "./productFilterUtils";

const API = `${API_BASE}/master`;

export default function useProductCatalogQueries({
  initialSearch = "",
  productsPerPage = 20,
  onSaveSuccess,
  onSaveError,
} = {}) {
  const [products, setProducts] = useState([]);
  const [productFilterQuery, setProductFilterQuery] = useState(initialSearch || "");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [openProductAction, setOpenProductAction] = useState(null);

  // Reset to page 1 whenever search query or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [productFilterQuery, categoryFilter, statusFilter]);

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

  const reloadProducts = async () => {
    try {
      const productData = await fetchJson(`${API}/products`);
      setProducts(productData);
      return productData;
    } catch (err) {
      console.error("Failed to reload products:", err);
      return [];
    }
  };

  const productLabel = getProductLabel;

  const categoriesList = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category_name && p.category_name.trim()) {
        set.add(p.category_name.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const resetFilters = () => {
    setProductFilterQuery("");
    setCategoryFilter("ALL");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      matchesProductFilter(p, {
        query: productFilterQuery,
        status: statusFilter,
        category: categoryFilter,
      })
    );
  }, [products, productFilterQuery, statusFilter, categoryFilter]);

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
        : Array.from(new Set([...current, ...ids]))
    );
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`${API}/products/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete product");
      setProducts((current) => current.filter((item) => item.id !== id));
      setSelectedProductIds((current) => current.filter((item) => item !== id));
      if (onSaveSuccess) onSaveSuccess("Product deleted successfully.");
    } catch (err) {
      if (onSaveError) onSaveError(err.message);
    }
  };

  const toggleProductStatus = async (product) => {
    const nextStatus = product.status === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`${API}/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update product status");
      setProducts((current) =>
        current.map((item) =>
          item.id === product.id ? { ...item, status: nextStatus } : item
        )
      );
    } catch (err) {
      if (onSaveError) onSaveError(err.message);
    }
  };

  const loadDummyProducts = async () => {
    try {
      const sampleItems = generateDummyProducts();
      for (const item of sampleItems) {
        await fetch(`${API}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify(item),
        });
      }
      await reloadProducts();
      if (onSaveSuccess) onSaveSuccess("5 sample products loaded successfully. You can delete them anytime.");
    } catch (err) {
      console.error(err);
      if (onSaveError) onSaveError("Failed to load sample products.");
    }
  };

  return {
    products,
    setProducts,
    productFilterQuery,
    setProductFilterQuery,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    categoriesList,
    resetFilters,
    selectedProductIds,
    setSelectedProductIds,
    currentPage,
    setCurrentPage,
    openProductAction,
    setOpenProductAction,
    productsPerPage,
    reloadProducts,
    productLabel,
    filteredProducts,
    totalProductPages,
    visibleProducts,
    toggleProduct,
    toggleAllProducts,
    deleteProduct,
    toggleProductStatus,
    loadDummyProducts,
  };
}
