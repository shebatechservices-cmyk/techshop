import React from 'react';
import useTechnicianWallet from './hooks/useTechnicianWallet';
import WalletHeroBanner from './components/WalletHeroBanner';
import WalletStatsCards from './components/WalletStatsCards';
import WalletTabSelector from './components/WalletTabSelector';
import WalletProjectsTab from './components/WalletProjectsTab';
import WalletLedgerTab from './components/WalletLedgerTab';

export default function TechnicianWallet({ currentUser }) {
  const {
    loading,
    activeTab,
    setActiveTab,
    toast,
    fetchWallet,
    userId,
    summary,
    projects,
    transactions
  } = useTechnicianWallet(currentUser);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          <span>{toast.type === 'error' ? '❌' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Hero Header Banner */}
      <WalletHeroBanner
        currentUser={currentUser}
        userId={userId}
        loading={loading}
        fetchWallet={fetchWallet}
      />

      {/* KPI Stats Cards */}
      <WalletStatsCards summary={summary} />

      {/* Tabs Selector */}
      <WalletTabSelector
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projectCount={projects.length}
        transactionCount={transactions.length}
      />

      {/* Tab Contents */}
      {activeTab === 'projects' ? (
        <WalletProjectsTab projects={projects} />
      ) : (
        <WalletLedgerTab transactions={transactions} />
      )}
    </div>
  );
}
