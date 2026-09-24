import React, { useEffect, useState, useRef } from "react";
import API from "../../services/api";

const taka = (val) =>
  `৳${Number(val || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function Dashboard({ onNavigate }) {
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

      const [productsRes, walletsRes, salesRes, purchasesRes] = await Promise.all([
        fetch(`${API}/master/products`).catch(() => null),
        fetch(`${API}/accounts/wallets`, { headers: { "role-id": "1" } }).catch(() => null),
        fetch(`${API}/sales`).catch(() => null),
        fetch(`${API}/purchase`).catch(() => null),
      ]);

      const productsData = productsRes && productsRes.ok ? await productsRes.json() : [];
      const walletsData = walletsRes && walletsRes.ok ? await walletsRes.json() : { data: [] };
      const salesData = salesRes && salesRes.ok ? await salesRes.json() : [];
      const purchasesData = purchasesRes && purchasesRes.ok ? await purchasesRes.json() : [];

      const productsList = Array.isArray(productsData) ? productsData : [];
      const walletsList = walletsData.data || [];
      const salesList = Array.isArray(salesData) ? salesData : (salesData.data || []);
      const purchasesList = Array.isArray(purchasesData) ? purchasesData : (purchasesData.data || []);

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

  const formatCountdown = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1440px", margin: "0 auto" }}>
      {/* Header & Live Status Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            📊 ERP Management Dashboard
          </h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.88rem" }}>
            Real-time business performance, liquidity, and operational metrics
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "20px",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "#166534",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: refreshing ? "#f59e0b" : "#22c55e",
                animation: refreshing ? "pulse 1s infinite" : "none",
              }}
            />
            <span>
              {refreshing ? "Updating live..." : `Live · Next in ${formatCountdown(countdown)}`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: refreshing ? "not-allowed" : "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
            title="Refresh now"
          >
            🔄 {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "#fef2f2",
            border: "1px solid #fee2e2",
            borderRadius: "10px",
            color: "#dc2626",
            marginBottom: "20px",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Row 1: Core Financial ERP Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        {/* Today's Sales */}
        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            borderTop: "4px solid #10b981",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Today's Sales
            </span>
            <span style={{ fontSize: "1.2rem" }}>📈</span>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", marginTop: "8px" }}>
            {taka(stats.todaySales)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#10b981", marginTop: "6px", fontWeight: 600 }}>
            {stats.todayOrdersCount} Orders Today
          </div>
        </div>

        {/* Today's Purchases */}
        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            borderTop: "4px solid #0284c7",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Today's Purchases
            </span>
            <span style={{ fontSize: "1.2rem" }}>📦</span>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", marginTop: "8px" }}>
            {taka(stats.todayPurchases)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#0284c7", marginTop: "6px", fontWeight: 600 }}>
            {stats.todayPurchasesCount} POs Received
          </div>
        </div>

        {/* Total Inventory Asset Value */}
        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            borderTop: "4px solid #8b5cf6",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Stock Asset (Cost Value)
            </span>
            <span style={{ fontSize: "1.2rem" }}>🏷️</span>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", marginTop: "8px" }}>
            {taka(stats.inventoryCostValue)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "6px" }}>
            Retail Value: <strong style={{ color: "#8b5cf6" }}>{taka(stats.inventoryRetailValue)}</strong>
          </div>
        </div>

        {/* Net Available Liquidity */}
        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            borderTop: "4px solid #f59e0b",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Available Liquidity
            </span>
            <span style={{ fontSize: "1.2rem" }}>💰</span>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", marginTop: "8px" }}>
            {taka(stats.totalWalletBalance)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "6px" }}>
            Across {stats.walletCount} Cash & Bank Accounts
          </div>
        </div>
      </div>

      {/* Row 2: Secondary ERP Health Indicators */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {/* Customer Receivables (Due) */}
        <div
          style={{
            background: "#ffffff",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#fee2e2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem",
            }}
          >
            📥
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Customer Receivables (Due)</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#dc2626" }}>{taka(stats.totalDueAmount)}</div>
          </div>
        </div>

        {/* Supplier Payables */}
        <div
          style={{
            background: "#ffffff",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#fef3c7",
              color: "#d97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem",
            }}
          >
            📤
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Supplier Payables (Due)</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#d97706" }}>{taka(stats.supplierDueAmount)}</div>
          </div>
        </div>

        {/* Low & Out-of-Stock Alert */}
        <div
          style={{
            background: "#ffffff",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: stats.lowStockCount + stats.stockOutCount > 0 ? "#fef2f2" : "#f0fdf4",
              color: stats.lowStockCount + stats.stockOutCount > 0 ? "#dc2626" : "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem",
            }}
          >
            ⚠️
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Low & Out-of-Stock</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
              {stats.lowStockCount + stats.stockOutCount} Items
            </div>
          </div>
        </div>

        {/* Estimated Gross Profit Today */}
        <div
          style={{
            background: "#ffffff",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#ecfdf5",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem",
            }}
          >
            💹
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Today's Est. Margin</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#059669" }}>{taka(stats.todayProfit)}</div>
          </div>
        </div>
      </div>

      {/* Row 3: Actionable ERP Data Tables */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Critical Stock Alert Box */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            padding: "20px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              paddingBottom: "12px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
              ⚠️ Critical Stock Reorder Alerts ({lowStockItems.length})
            </h3>
            <span style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: 600 }}>Needs Attention</span>
          </div>

          {lowStockItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px", color: "#16a34a", fontSize: "0.9rem" }}>
              ✓ All products have healthy stock levels!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {lowStockItems.map((prod) => (
                <div
                  key={prod.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: Number(prod.stock) <= 0 ? "#fef2f2" : "#fffbeb",
                    border: `1px solid ${Number(prod.stock) <= 0 ? "#fee2e2" : "#fef3c7"}`,
                    borderRadius: "8px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1e293b" }}>
                      {prod.composite_name || prod.name}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "#64748b" }}>
                      SKU: {prod.sku || `PRD-${prod.id}`} · Min Alert: {prod.min_stock || 5}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        background: Number(prod.stock) <= 0 ? "#ef4444" : "#f59e0b",
                        color: "#ffffff",
                      }}
                    >
                      {Number(prod.stock) <= 0 ? "Out of Stock" : `${prod.stock} Left`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Purchases & Inventory Inflow */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            padding: "20px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              paddingBottom: "12px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
              📦 Recent Inward Purchases
            </h3>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Latest 5 Orders</span>
          </div>

          {recentPurchases.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px", color: "#94a3b8", fontSize: "0.9rem" }}>
              No purchase orders recorded yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentPurchases.map((po) => (
                <div
                  key={po.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>
                      {po.po_number || `PO-${po.id}`}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "#64748b" }}>
                      Supplier: {po.supplier_name || "Supplier"} ·{" "}
                      {new Date(po.created_at || po.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0284c7" }}>
                      {taka(po.total_cost)}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: Number(po.total_due) > 0 ? "#dc2626" : "#16a34a" }}>
                      {Number(po.total_due) > 0 ? `Due: ${taka(po.total_due)}` : "Paid in Full"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
