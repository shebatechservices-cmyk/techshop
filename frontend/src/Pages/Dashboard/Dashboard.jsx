import React from "react";
import LicenseBanner from "../../components/layout/LicenseBanner";
import useDashboardManager from "./hooks/useDashboardManager";
import DashboardHeader from "./components/DashboardHeader";
import PrimaryMetrics from "./components/PrimaryMetrics";
import SecondaryMetrics from "./components/SecondaryMetrics";
import ActionableTables from "./components/ActionableTables";

export default function Dashboard({ onNavigate }) {
  const {
    licenseInfo,
    stats,
    lowStockItems,
    recentPurchases,
    refreshing,
    error,
    countdown,
    fetchDashboardData,
    formatCountdown,
    taka,
  } = useDashboardManager();

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Vendor License Expiration & Update Alert Banner */}
      <LicenseBanner licenseInfo={licenseInfo} onRefresh={() => fetchDashboardData(true)} />

      {/* Header & Live Status Bar */}
      <DashboardHeader
        refreshing={refreshing}
        countdown={countdown}
        formatCountdown={formatCountdown}
        onRefresh={() => fetchDashboardData(true)}
      />

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Row 1: Core Financial ERP Cards */}
      <PrimaryMetrics stats={stats} taka={taka} />

      {/* Row 2: Secondary ERP Health Indicators */}
      <SecondaryMetrics stats={stats} taka={taka} />

      {/* Row 3: Actionable ERP Data Tables */}
      <ActionableTables
        lowStockItems={lowStockItems}
        recentPurchases={recentPurchases}
        taka={taka}
      />
    </div>
  );
}
