import { useState, useEffect } from "react";
import API from "../../../services/api";

export const taka = (val) =>
  `৳${Number(val || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const formatCountdown = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s < 10 ? "0" : ""}${s}s`;
};

export default function useDashboardManager() {
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStockCount: 0,
    stockOutCount: 0,
    inventoryCostValue: 0,
    inventoryRetailValue: 0,
    totalWalletBalance: 0,
    walletCount: 0,
    todaySales: 0,
    todayOrdersCount: 0,
    totalDueAmount: 0,
    totalSales: 0,
    totalPurchases: 0,
    todayPurchases: 0,
    todayPurchasesCount: 0,
    supplierDueAmount: 0,
    todayProfit: 0,
  });

  const [recentProducts, setRecentProducts] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds

  const fetchDashboardData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);
      setError("");

      const [productsRes, walletsRes, salesRes, purchasesRes, licenseRes] = await Promise.all([
        fetch(`${API}/master/products`).catch(() => null),
        fetch(`${API}/accounts/wallets`).catch(() => null),
        fetch(`${API}/sales`).catch(() => null),
        fetch(`${API}/purchase`).catch(() => null),
        fetch(`${API}/license/status`).catch(() => null),
      ]);

      if (licenseRes && licenseRes.ok) {
        const licData = await licenseRes.json();
        setLicenseInfo(licData);
      }

      const productsData = productsRes && productsRes.ok ? await productsRes.json() : [];
      const walletsData = walletsRes && walletsRes.ok ? await walletsRes.json() : { data: [] };
      const salesData = salesRes && salesRes.ok ? await salesRes.json() : [];
      const purchasesData = purchasesRes && purchasesRes.ok ? await purchasesRes.json() : [];

      const productsList = Array.isArray(productsData) ? productsData : [];
      const walletsList = walletsData.data || [];
      const salesList = Array.isArray(salesData) ? salesData : salesData.data || [];
      const purchasesList = Array.isArray(purchasesData) ? purchasesData : purchasesData.data || [];

      // 1. Inventory & Stock Valuation Stats
      const totalProducts = productsList.length;
      const activeProducts = productsList.filter((p) => p.status === "active").length;
      const lowStockList = productsList.filter(
        (p) => Number(p.stock) > 0 && Number(p.stock) <= Number(p.min_stock || 5)
      );
      const stockOutList = productsList.filter((p) => Number(p.stock) <= 0);
      const lowStockCount = lowStockList.length;
      const stockOutCount = stockOutList.length;

      let inventoryCostValue = 0;
      let inventoryRetailValue = 0;
      productsList.forEach((p) => {
        const stockQty = Math.max(0, Number(p.stock || 0));
        inventoryCostValue += stockQty * Number(p.purchase_price || p.cost_price || 0);
        inventoryRetailValue += stockQty * Number(p.selling_price || p.sale_price || 0);
      });

      // 2. Wallet & Liquidity
      const totalWalletBalance = walletsList.reduce((sum, w) => sum + Number(w.balance || 0), 0);

      // 3. Date Matching (YYYY-MM-DD)
      const todayStr = new Date().toISOString().split("T")[0];

      // Sales Metrics
      let todaySales = 0;
      let todayOrdersCount = 0;
      let totalDueAmount = 0;
      let totalSales = 0;

      salesList.forEach((order) => {
        const orderDate = (order.created_at || order.date || "").split("T")[0];
        const orderTotal = Number(order.grand_total || order.total_amount || 0);
        totalSales += orderTotal;

        if (orderDate === todayStr) {
          todaySales += orderTotal;
          todayOrdersCount += 1;
        }

        const due = Number(
          order.due_amount ||
            Number(order.grand_total || order.total_amount || 0) - Number(order.paid_amount || 0)
        );
        if (due > 0) {
          totalDueAmount += due;
        }
      });

      // Purchase Metrics
      let totalPurchases = 0;
      let todayPurchases = 0;
      let todayPurchasesCount = 0;
      let supplierDueAmount = 0;

      purchasesList.forEach((order) => {
        const orderTotal = Number(order.total_cost || 0);
        const orderDate = (order.created_at || order.date || "").split("T")[0];
        totalPurchases += orderTotal;
        supplierDueAmount += Math.max(Number(order.total_due || 0), 0);

        if (orderDate === todayStr) {
          todayPurchases += orderTotal;
          todayPurchasesCount += 1;
        }
      });

      // Today's Gross Profit Estimate
      const todayProfit = Math.max(0, todaySales - todayPurchases);

      setStats({
        totalProducts,
        activeProducts,
        lowStockCount,
        stockOutCount,
        inventoryCostValue,
        inventoryRetailValue,
        totalWalletBalance,
        walletCount: walletsList.length,
        todaySales,
        todayOrdersCount,
        totalDueAmount,
        totalSales,
        totalPurchases,
        todayPurchases,
        todayPurchasesCount,
        supplierDueAmount,
        todayProfit,
      });

      setRecentProducts(productsList.slice(0, 5));
      setLowStockItems([...stockOutList, ...lowStockList].slice(0, 6));
      setRecentSales(salesList.slice(0, 5));
      setRecentPurchases(purchasesList.slice(0, 5));
      setLastUpdated(new Date());
      setCountdown(300); // Reset 5-minute timer
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial Load + 5-Minute Periodic Background Refresh
  useEffect(() => {
    fetchDashboardData(false);

    // 5-minute interval (300,000 ms)
    const intervalId = setInterval(() => {
      fetchDashboardData(true);
    }, 300000);

    // 1-second interval for countdown display
    const countdownId = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 300));
    }, 1000);

    return () => {
      clearInterval(intervalId);
      clearInterval(countdownId);
    };
  }, []);

  return {
    licenseInfo,
    stats,
    recentProducts,
    lowStockItems,
    recentSales,
    recentPurchases,
    loading,
    refreshing,
    error,
    lastUpdated,
    countdown,
    fetchDashboardData,
    formatCountdown,
    taka,
  };
}
