import React from 'react';
import useReportsManager from './hooks/useReportsManager';
import ReportPrintModal from './modals/ReportPrintModal';
import ReportsFilterBar from './components/ReportsFilterBar';
import PnlAnalyticsTab from './components/PnlAnalyticsTab';
import TopProductsTab from './components/TopProductsTab';
import InventoryValuationTab from './components/InventoryValuationTab';
import LedgersSummaryTab from './components/LedgersSummaryTab';
import SalesAuditTrailTab from './components/SalesAuditTrailTab';

export default function Reports() {
  const {
    period,
    setPeriod,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    activeTab,
    setActiveTab,
    analytics,
    auditList,
    loading,
    auditSearch,
    setAuditSearch,
    statusFilter,
    setStatusFilter,
    printModalOpen,
    setPrintModalOpen,
    periodLabel,
    filteredAudit,
    pnl,
    inventory,
    ledgers,
    channels,
    topProducts,
    filterDates,
    exportToCSV,
  } = useReportsManager();

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Header & Filter Bar */}
      <ReportsFilterBar
        period={period}
        setPeriod={setPeriod}
        customFrom={customFrom}
        setCustomFrom={setCustomFrom}
        customTo={customTo}
        setCustomTo={setCustomTo}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPrint={() => setPrintModalOpen(true)}
        onExportCsv={exportToCSV}
      />

      {/* Main Report Body */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3" />
          <p className="text-slate-500 font-medium text-sm">Computing real-time analytics & financial audit records...</p>
        </div>
      ) : (
        <>
          {/* Tab 1: P&L Analytics */}
          {activeTab === 'pnl' && <PnlAnalyticsTab pnl={pnl} channels={channels} />}

          {/* Tab 2: Top Products */}
          {activeTab === 'top_products' && <TopProductsTab topProducts={topProducts} />}

          {/* Tab 3: Inventory Valuation */}
          {activeTab === 'inventory' && <InventoryValuationTab inventory={inventory} />}

          {/* Tab 4: Party Ledgers */}
          {activeTab === 'ledgers' && <LedgersSummaryTab ledgers={ledgers} />}

          {/* Tab 5: Sales Audit Trail */}
          {activeTab === 'sales_audit' && (
            <SalesAuditTrailTab
              filteredAudit={filteredAudit}
              auditSearch={auditSearch}
              setAuditSearch={setAuditSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          )}
        </>
      )}

      {/* Print Preview & Multi-Layout Modal */}
      <ReportPrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        analyticsData={analytics}
        auditData={auditList}
        periodLabel={periodLabel}
        filterDates={filterDates}
      />
    </div>
  );
}
