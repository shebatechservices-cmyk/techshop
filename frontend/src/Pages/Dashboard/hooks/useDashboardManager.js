import { useState, useEffect, useCallback } from "react";
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

// Formats a Date/timestamp into local YYYY-MM-DD
const getLocalDateString = (dateVal) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

  const fetchDashboardData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);
      setError("");

      const [
        inventoryRes,
        masterProductsRes,
        accountsRes,
        salesRes,
        purchasesRes,
        licenseRes,
      ] = await Promise.all([
        fetch(`${API}/inventory`).catch(() => null),
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

      const invJson = inventoryRes && inventoryRes.ok ? await inventoryRes.json() : null;
      const masterData = masterProductsRes && masterProductsRes.ok ? await masterProductsRes.json() : [];
      const walletsData = accountsRes && accountsRes.ok ? await accountsRes.json() : { data: [] };
      const salesData = salesRes && salesRes.ok ? await salesRes.json() : [];
      const purchasesData = purchasesRes && purchasesRes.ok ? await purchasesRes.json() : [];

      const invList = Array.isArray(invJson?.data) ? invJson.data : [];
      const masterList = Array.isArray(masterData) ? masterData : [];
      const productsList = invList.length > 0 ? invList : masterList;
      const walletsList = walletsData.data || [];
      const salesList = Array.isArray(salesData) ? salesData : salesData.data || [];
      const purchasesList = Array.isArray(purchasesData) ? purchasesData : purchasesData.data || [];

      // 1. Inventory & Stock Valuation Stats
      // Use exact server-side valuation from /inventory when available
      let inventoryCostValue = 0;
      let inventoryRetailValue = 0;
      let lowStockCount = 0;
      let stockOutCount = 0;
      let totalProducts = productsList.length;
      let activeProducts = productsList.filter((p) => p.status === "active").length;

      if (invJson?.summary) {
        inventoryCostValue = Number(invJson.summary.total_cost_valuation || 0);
        inventoryRetailValue = Number(invJson.summary.total_retail_valuation || 0);
        lowStockCount = Number(invJson.summary.low_stock_count || 0);
        stockOutCount = Number(invJson.summary.out_of_stock_count || 0);
        if (invJson.summary.total_products) {
          totalProducts = Number(invJson.summary.total_products);
        }
      } else {
        // Precise fallback accounting for conversion rate and skipping bundle double-counting
        productsList.forEach((p) => {
          if (p.is_bundle) return; // avoid double counting virtual bundle kit products
          const stockQty = Math.max(0, Number(p.stock || 0));
          const convRate = Number(p.conversion_rate || 1) > 1 ? Number(p.conversion_rate) : 1;
          const costPrice = Number(p.cost_price ?? p.purchase_price ?? p.last_purchase_price ?? 0) / convRate;
          const salePrice = Number(p.sale_price ?? p.selling_price ?? p.mrp ?? costPrice) / convRate;
          inventoryCostValue += stockQty * costPrice;
          inventoryRetailValue += stockQty * salePrice;
        });

        const lowStockListFallback = productsList.filter(
          (p) => Number(p.stock) > 0 && Number(p.stock) <= Number(p.min_stock || 5)
        );
        const stockOutListFallback = productsList.filter((p) => Number(p.stock) <= 0);
        lowStockCount = lowStockListFallback.length;
        stockOutCount = stockOutListFallback.length;
      }

      // 2. Wallet & Liquidity
      const totalWalletBalance = walletsList.reduce((sum, w) => sum + Number(w.balance || 0), 0);

      // 3. Local Date Matching (YYYY-MM-DD in local time)
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      // Sales Metrics
      let todaySales = 0;
      let todayOrdersCount = 0;
      let todayCogs = 0;
      let totalDueAmount = 0;
      let totalSales = 0;

      salesList.forEach((order) => {
        const orderDate = getLocalDateString(order.created_at || order.date || order.invoice_date);
        const orderTotal = Number(order.total_amount ?? order.grand_total ?? 0);
        totalSales += orderTotal;

        if (orderDate === todayStr) {
          todaySales += orderTotal;
          todayOrdersCount += 1;
          todayCogs += Number(order.total_cogs || 0);
        }

        const due = Number(order.due_amount || 0);
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
        const orderDate = getLocalDateString(order.created_at || order.date);
        totalPurchases += orderTotal;
        supplierDueAmount += Math.max(Number(order.total_due || 0), 0);

        if (orderDate === todayStr) {
          todayPurchases += orderTotal;
          todayPurchasesCount += 1;
        }
      });

      // Today's True Gross Profit Margin (Revenue - Cost of Goods Sold)
      const todayProfit = todaySales > 0 ? Math.max(0, todaySales - todayCogs) : 0;

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

      // Reorder and low stock alert items
      const alertItems = productsList
        .filter((p) => Number(p.stock || 0) <= Number(p.min_stock || 5))
        .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));

      setRecentProducts(productsList.slice(0, 5));
      setLowStockItems(alertItems.slice(0, 6));
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
  }, []);

  // Initial Load + 5-Minute Periodic Background Refresh + Realtime Listeners
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

    // Instant update on inventory change or tab focus
    const handleStockChanged = () => fetchDashboardData(true);
    const handleFocus = () => fetchDashboardData(true);

    window.addEventListener("inventory_stock_changed", handleStockChanged);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalId);
      clearInterval(countdownId);
      window.removeEventListener("inventory_stock_changed", handleStockChanged);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchDashboardData]);

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
