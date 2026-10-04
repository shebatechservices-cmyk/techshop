import { useState, useEffect } from 'react';
import API from '../../../services/api';

export default function useInventoryData({ showNotification }) {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(1);
  const [summary, setSummary] = useState({
    total_products: 0,
    total_units: 0,
    total_cost_valuation: 0,
    total_retail_valuation: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
  });
  const [loading, setLoading] = useState(true);

  // Load Inventory & Warehouses
  const loadInventory = async () => {
    try {
      setLoading(true);
      const whParam = selectedWarehouseId ? `?warehouse_id=${selectedWarehouseId}` : '';
      const [invRes, whRes] = await Promise.all([
        fetch(`${API}/inventory${whParam}`).catch(() => null),
        fetch(`${API}/warehouses?active=true`).catch(() => null),
      ]);

      if (invRes && invRes.ok) {
        const json = await invRes.json();
        if (json.success) {
          setProducts(json.data || []);
          if (json.summary) setSummary(json.summary);
        }
      }

      if (whRes && whRes.ok) {
        const whJson = await whRes.json();
        if (whJson.success && Array.isArray(whJson.data)) {
          setWarehouses(whJson.data);
          const defaultWh = whJson.data.find((w) => w.is_default);
          if (defaultWh && !selectedWarehouseId) {
            setSelectedWarehouseId(defaultWh.id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
      if (showNotification) {
        showNotification('Failed to connect to inventory server', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [selectedWarehouseId]);

  useEffect(() => {
    const handleStockChanged = () => {
      loadInventory();
    };
    window.addEventListener('inventory_stock_changed', handleStockChanged);
    return () => window.removeEventListener('inventory_stock_changed', handleStockChanged);
  }, [selectedWarehouseId]);

  // Toggle E-Commerce Active status
  const handleToggleEcommerce = async (product) => {
    try {
      const newStatus = !product.is_ecommerce_active;
      // Optimistic update
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_ecommerce_active: newStatus } : p))
      );

      const res = await fetch(`${API}/inventory/product/${product.id}/ecommerce`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_ecommerce_active: newStatus }),
      });

      if (res.ok) {
        if (showNotification) {
          showNotification(
            `Product #${product.sku || product.id} is now ${newStatus ? 'active' : 'hidden'} on E-Commerce!`
          );
        }
      } else {
        // Revert on error
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, is_ecommerce_active: !newStatus } : p))
        );
        if (showNotification) {
          showNotification('Failed to update e-commerce status', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      if (showNotification) {
        showNotification('Network error while updating e-commerce', 'error');
      }
    }
  };

  return {
    products,
    setProducts,
    warehouses,
    setWarehouses,
    selectedWarehouseId,
    setSelectedWarehouseId,
    summary,
    setSummary,
    loading,
    setLoading,
    loadInventory,
    handleToggleEcommerce,
  };
}
