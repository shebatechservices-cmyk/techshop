import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Consolidated Header, Tabs & Action Buttons for Purchases & Procurement
 */
export default function PurchasesHeaderNav({
  activeTab,
  ordersCount,
  quotationsCount,
  suppliersCount,
  setSearchQuery,
  navigate,
  setIsOrderModalOpen,
  setIsQuotationModalOpen,
  setIsSupplierModalOpen,
  purchaseDraftInfo,
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1.5px solid #e2e8f0',
      }}
    >
      {/* Left: Compact Title & Icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.3rem' }}>🚚</span>
        <div>
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#0f172a',
              margin: 0,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Purchases &amp; Procurement
          </h1>
        </div>
      </div>

      {/* Center: Inline Tab Navigation */}
      <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
        <Link
          to="/history"
          onClick={() => setSearchQuery('')}
          className={`no-underline px-3 py-1.5 rounded-md font-semibold text-xs sm:text-sm cursor-pointer flex items-center gap-1.5 transition-colors ${
            activeTab === 'history'
              ? 'bg-sky-600 text-white font-bold'
              : 'bg-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Orders</span>
          <span
            className={`px-1.5 py-0.25 rounded-full text-[0.72rem] font-bold ${
              activeTab === 'history' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {ordersCount}
          </span>
        </Link>

        <Link
          to="/quotations"
          onClick={() => setSearchQuery('')}
          className={`no-underline px-3 py-1.5 rounded-md font-semibold text-xs sm:text-sm cursor-pointer flex items-center gap-1.5 transition-colors ${
            activeTab === 'quotations'
              ? 'bg-indigo-600 text-white font-bold'
              : 'bg-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Quotations</span>
          <span
            className={`px-1.5 py-0.25 rounded-full text-[0.72rem] font-bold ${
              activeTab === 'quotations' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {quotationsCount}
          </span>
        </Link>

        <Link
          to="/suppliers"
          onClick={() => setSearchQuery('')}
          className={`no-underline px-3 py-1.5 rounded-md font-semibold text-xs sm:text-sm cursor-pointer flex items-center gap-1.5 transition-colors ${
            activeTab === 'suppliers'
              ? 'bg-emerald-600 text-white font-bold'
              : 'bg-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Suppliers</span>
          <span
            className={`px-1.5 py-0.25 rounded-full text-[0.72rem] font-bold ${
              activeTab === 'suppliers' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {suppliersCount}
          </span>
        </Link>
      </div>

      {/* Right: 3 Action Buttons */}
      <div className="flex gap-2 items-center flex-wrap">
        <button
          type="button"
          onClick={() => {
            navigate('/history');
            setIsOrderModalOpen(true);
          }}
          className="bg-sky-600 hover:bg-sky-700 text-white border-0 px-3.5 py-1.5 rounded-md font-bold text-xs sm:text-sm cursor-pointer flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <span>+</span>
          <span>Order</span>
          {purchaseDraftInfo && (
            <span
              className="bg-amber-400 text-amber-950 text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse"
              title={`Unsaved draft found with ${purchaseDraftInfo.itemCount || 0} items`}
            >
              ⚡ Draft ({purchaseDraftInfo.itemCount || 0})
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            navigate('/quotations');
            setIsQuotationModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 px-3.5 py-1.5 rounded-md font-bold text-xs sm:text-sm cursor-pointer flex items-center gap-1 shadow-sm transition-colors"
        >
          <span>+</span> Quotation
        </button>

        <button
          type="button"
          onClick={() => {
            navigate('/suppliers');
            setIsSupplierModalOpen(true);
          }}
          className="bg-white text-emerald-600 border border-emerald-500 hover:bg-emerald-50 px-3 py-1.5 rounded-md font-bold text-xs sm:text-sm cursor-pointer flex items-center gap-1 transition-colors"
        >
          <span>+</span> Supplier
        </button>
      </div>
    </div>
  );
}
