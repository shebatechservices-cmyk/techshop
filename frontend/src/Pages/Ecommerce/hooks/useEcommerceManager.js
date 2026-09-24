import { useState, useEffect, useMemo } from 'react';
import API from '../../../services/api';

export const money = (val) => Number.parseFloat(val || 0) || 0;
export const taka = (val) =>
  `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const STATUS_CONFIG = {
  all: { label: 'All Orders', color: '#475569', bg: '#f1f5f9' },
  pending: { label: 'Pending', color: '#b45309', bg: '#fef3c7' },
  processing: { label: 'Processing', color: '#0369a1', bg: '#e0f2fe' },
  shipped: { label: 'Shipped', color: '#4338ca', bg: '#e0e7ff' },
  delivered: { label: 'Delivered', color: '#15803d', bg: '#dcfce7' },
  cancelled: { label: 'Cancelled', color: '#b91c1c', bg: '#fee2e2' },
};

export default function useEcommerceManager() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab navigation: 'orders' | 'catalog' | 'couriers' | 'analytics'
  const [activeTab, setActiveTab] = useState('orders');

  // Filters for Orders tab
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [courierFilter, setCourierFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Catalog search & filter
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogStockFilter, setCatalogStockFilter] = useState('all');

  // Modals state
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isStorefrontModalOpen, setIsStorefrontModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [printOrder, setPrintOrder] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [orderRes, prodRes] = await Promise.all([
        fetch(`${API}/ecommerce/orders`).catch(() => null),
        fetch(`${API}/master/products`).catch(() => null),
      ]);

      if (orderRes && orderRes.ok) {
        const oData = await orderRes.json();
        setOrders(oData.data || (Array.isArray(oData) ? oData : []));
      }
      if (prodRes && prodRes.ok) {
        const pData = await prodRes.json();
        setProducts(pData.data || (Array.isArray(pData) ? pData : []));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load e-commerce orders or catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick order status update from table
  const handleQuickStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API}/ecommerce/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert(data.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let pendingCount = 0;
    let processingCount = 0;
    let shippedCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;

    orders.forEach((o) => {
      const status = (o.order_status || 'pending').toLowerCase();
      if (status !== 'cancelled') {
        totalRevenue += money(o.total_amount);
      }
      if (status === 'pending') pendingCount++;
      else if (status === 'processing') processingCount++;
      else if (status === 'shipped') shippedCount++;
      else if (status === 'delivered') deliveredCount++;
      else if (status === 'cancelled') cancelledCount++;
    });

    const activeFulfillment = pendingCount + processingCount;
    const completedOrders = deliveredCount;
    const totalValid = orders.length - cancelledCount;
    const fulfillmentRate = totalValid > 0 ? ((completedOrders / totalValid) * 100).toFixed(0) : '0';

    return {
      totalRevenue,
      totalOrders: orders.length,
      pendingCount,
      processingCount,
      activeFulfillment,
      shippedCount,
      deliveredCount,
      cancelledCount,
      fulfillmentRate,
    };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const status = (o.order_status || 'pending').toLowerCase();
      if (statusFilter !== 'all' && status !== statusFilter) return false;

      if (courierFilter !== 'all') {
        const courier = (o.courier_name || '').toLowerCase();
        if (!courier.includes(courierFilter.toLowerCase())) return false;
      }

      if (paymentFilter !== 'all') {
        const pay = (o.payment_status || 'unpaid').toLowerCase();
        if (paymentFilter === 'paid' && pay !== 'paid') return false;
        if (paymentFilter === 'unpaid' && pay === 'paid') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNo = String(o.order_no || o.order_number || o.id).toLowerCase().includes(q);
        const matchName = String(o.customer_name || '').toLowerCase().includes(q);
        const matchPhone = String(o.customer_phone || '').toLowerCase().includes(q);
        const matchAddr = String(o.shipping_address || '').toLowerCase().includes(q);
        const matchTrack = String(o.tracking_code || '').toLowerCase().includes(q);
        const matchItem = (o.items || []).some((it) =>
          String(it.product_name || '').toLowerCase().includes(q)
        );
        if (!matchNo && !matchName && !matchPhone && !matchAddr && !matchTrack && !matchItem) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, courierFilter, paymentFilter, searchQuery]);

  // Filtered Products for Live Store Catalog
  const filteredCatalog = useMemo(() => {
    return products.filter((p) => {
      const stock = Number(p.stock || 0);
      if (catalogStockFilter === 'instock' && stock <= 0) return false;
      if (catalogStockFilter === 'lowstock' && (stock <= 0 || stock > 5)) return false;
      if (catalogStockFilter === 'outofstock' && stock > 0) return false;

      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase().trim();
        const matchName = String(p.name || '').toLowerCase().includes(q);
        const matchSku = String(p.sku || '').toLowerCase().includes(q);
        const matchBrand = String(p.brand_name || '').toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchBrand) return false;
      }
      return true;
    });
  }, [products, catalogStockFilter, catalogSearch]);

  return {
    // Data state
    orders,
    setOrders,
    products,
    setProducts,
    loading,
    setLoading,
    error,
    setError,

    // Tabs
    activeTab,
    setActiveTab,

    // Orders filters
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    courierFilter,
    setCourierFilter,
    paymentFilter,
    setPaymentFilter,

    // Catalog filters
    catalogSearch,
    setCatalogSearch,
    catalogStockFilter,
    setCatalogStockFilter,

    // Modals
    isNewOrderModalOpen,
    setIsNewOrderModalOpen,
    isStorefrontModalOpen,
    setIsStorefrontModalOpen,
    selectedOrderDetails,
    setSelectedOrderDetails,
    printOrder,
    setPrintOrder,

    // Actions & Handlers
    loadData,
    handleQuickStatusChange,

    // Computed / Memos
    stats,
    filteredOrders,
    filteredCatalog,

    // Constants & Utilities
    STATUS_CONFIG,
    money,
    taka,
  };
}
