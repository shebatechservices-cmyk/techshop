import React from 'react';
import useMobilePocketData from './useMobilePocketData';
import MobilePocketHeader from './MobilePocketHeader';
import MobilePocketMetrics from './MobilePocketMetrics';
import MobilePocketActionsGrid from './MobilePocketActionsGrid';
import MobilePocketRecentSales from './MobilePocketRecentSales';

export default function MobilePocketHome({
  currentUser,
  shopInfo,
  onToggleDesktopView,
  onOpenMenu,
  onQuickPos,
  onQuickDue,
  onStockLookup,
  onCameraScan,
  onQuickExpense,
  onDailyRegister,
  onSelectSale,
  onViewAllSales,
}) {
  const { stats, recentSales, loading, refreshing, refresh } = useMobilePocketData();

  return (
    <div className="min-h-screen bg-slate-100/90 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans pb-16">
      {/* 1. Mobile Pocket Header */}
      <MobilePocketHeader
        shopName={shopInfo?.shop_name || 'Sheba Technology'}
        shopLogo={shopInfo?.logo_url}
        userName={currentUser?.name || 'Admin'}
        userRole={currentUser?.role || 'Staff'}
        onToggleDesktopView={onToggleDesktopView}
        onOpenMenu={onOpenMenu}
        onRefresh={refresh}
        refreshing={refreshing}
      />

      {/* 2. Key Metrics Summary (2x2 Cards) */}
      <MobilePocketMetrics stats={stats} />

      {/* 3. Primary Quick Action Buttons (Large Grid) */}
      <MobilePocketActionsGrid
        onQuickPos={onQuickPos}
        onQuickDue={onQuickDue}
        onStockLookup={onStockLookup}
        onCameraScan={onCameraScan}
        onQuickExpense={onQuickExpense}
        onDailyRegister={onDailyRegister}
      />

      {/* 4. Recent Activity & Sales Feed */}
      <MobilePocketRecentSales
        recentSales={recentSales}
        onSelectSale={onSelectSale}
        onViewAllSales={onViewAllSales}
      />
    </div>
  );
}
