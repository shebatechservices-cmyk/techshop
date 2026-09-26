import { useState, useMemo } from "react";
import API_BASE from "../../../services/api";

const API = `${API_BASE}/master`;

export default function useProductCatalogQueries({
  initialSearch = "",
  productsPerPage = 20,
  onSaveSuccess,
  onSaveError,
} = {}) {
  const [products, setProducts] = useState([]);
  const [productFilterQuery, setProductFilterQuery] = useState(initialSearch || "");
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [openProductAction, setOpenProductAction] = useState(null);

  const fetchJson = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Request failed");
    return res.json();
  };

  const reloadProducts = async () => {
    try {
      const productData = await fetchJson(`${API}/products`);
      setProducts(productData);
    } catch (err) {
      console.error("Failed to reload products:", err);
    }
  };

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
        : Array.from(new Set([...current, ...ids]))
    );
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`${API}/products/${id}`, { method: "DELETE" });
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
        headers: { "Content-Type": "application/json" },
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
      const rand = Math.floor(1000 + Math.random() * 9000);
      const sampleItems = [
        {
          name: "2MP Full HD Bullet Outdoor Camera",
          sku: `CAM-HIK-2MP-${rand}`,
          stock: 25,
          min_stock: 5,
          status: "active",
          condition: "New",
          description: "Hikvision 2MP High Performance Bullet Camera with night vision.",
        },
        {
          name: "Archer C6 Gigabit Wireless Router",
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
