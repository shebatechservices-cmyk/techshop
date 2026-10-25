import React from 'react';
import useMobilePocketData from './useMobilePocketData';
import MobilePocketHeader from './MobilePocketHeader';
import MobilePocketMetrics from './MobilePocketMetrics';
import MobilePocketRecentSales from './MobilePocketRecentSales';

export default function MobilePocketHome({
  shopInfo,
  onQuickPos,
  onQuickDue,
  onSelectSale,
  onViewAllSales,
}) {
  const { stats, recentSales, refreshing, refresh } = useMobilePocketData();

  return (
    <div className="min-h-screen bg-slate-100/90 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* 1. Header: শুধুমাত্র শপের নাম */}
      <MobilePocketHeader
        shopName={shopInfo?.shop_name || 'Sheba Technology'}
        shopLogo={shopInfo?.logo_url}
        onRefresh={refresh}
        refreshing={refreshing}
      />

      {/* 2. সংক্ষিপ্ত ড্যাশবোর্ড সামারি (4 Cards) */}
      <MobilePocketMetrics stats={stats} />

      {/* 3. কুইক শর্টকাট বার */}
      <div className="px-4 pt-3.5 flex gap-2">
        <button
          type="button"
          onClick={onQuickPos}
          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <span className="text-sm">⚡</span>
          <span>নতুন বিক্রি</span>
        </button>

        <button
          type="button"
          onClick={onQuickDue}
          className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <span className="text-sm">💵</span>
          <span>বকেয়া আদায়</span>
        </button>
      </div>

      {/* 4. সাম্প্রতিক বিক্রি ও ইনভয়েস তালিকা (১-ট্যাপে প্রিন্ট-শেয়ার) */}
      <MobilePocketRecentSales
        recentSales={recentSales}
        onSelectSale={onSelectSale}
        onViewAllSales={onViewAllSales}
      />
    </div>
  );
}
