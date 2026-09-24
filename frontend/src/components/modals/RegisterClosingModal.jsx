import React from 'react';
import { useRegisterClosingManager } from '../hooks/useRegisterClosingManager';
import OpenShiftSection from '../shared/register/OpenShiftSection';
import ActiveShiftClosingSection from '../shared/register/ActiveShiftClosingSection';
import ShiftClosedSummarySection from '../shared/register/ShiftClosedSummarySection';
import ShiftHistorySection from '../shared/register/ShiftHistorySection';

export default function RegisterClosingModal({ isOpen, onClose, currentUser, shopInfo }) {
  const manager = useRegisterClosingManager({ isOpen, currentUser });

  if (!isOpen) return null;

  const {
    activeTab,
    setActiveTab,
    loading,
    error,
    successMsg,
    hasActiveShift,
    currentShift,
    lastClosedShift,
    openBalance,
    setOpenBalance,
    openNotes,
    setOpenNotes,
    denominations,
    actualCashCounted,
    setActualCashCounted,
    closingNotes,
    setClosingNotes,
    closedSummary,
    setClosedSummary,
    shiftHistory,
    selectedHistoryShift,
    setSelectedHistoryShift,
    handleDenominationChange,
    handleOpenShift,
    handleCloseShift,
    handlePrintSlip,
    fetchCurrentShift,
    fetchShiftHistory,
  } = manager;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 px-6 flex items-center justify-between border-b border-slate-700 text-white flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 bg-white/10 rounded-xl flex items-center justify-center">
              🔒
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                End-of-Day (EOD) / Register Shift Closing
              </h2>
              <p className="text-xs text-slate-400">
                ক্যাশ রেজিস্টার সমাপনী, ব্লাইন্ড ক্লোজ ও হিসাব মেলানো
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-white/10 rounded-xl p-1">
              <button
                type="button"
                onClick={() => { setActiveTab('closing'); setSelectedHistoryShift(null); }}
                className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'closing' ? 'bg-sky-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                {hasActiveShift ? '⚡ Active Shift Close' : '⚡ Register Shift'}
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('history'); setSelectedHistoryShift(null); }}
                className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'history' ? 'bg-sky-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                📜 Shift History
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xl p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Close Modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-slate-50/70">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 mb-4 text-xs font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 mb-4 text-xs font-medium flex items-center gap-2">
              <span>✅</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: ACTIVE SHIFT & BLIND CLOSE */}
          {activeTab === 'closing' && (
            <>
              {closedSummary ? (
                <ShiftClosedSummarySection
                  closedSummary={closedSummary}
                  handlePrintSlip={handlePrintSlip}
                  setClosedSummary={setClosedSummary}
                  fetchCurrentShift={fetchCurrentShift}
                />
              ) : hasActiveShift && currentShift ? (
                <ActiveShiftClosingSection
                  currentShift={currentShift}
                  denominations={denominations}
                  handleDenominationChange={handleDenominationChange}
                  actualCashCounted={actualCashCounted}
                  setActualCashCounted={setActualCashCounted}
                  closingNotes={closingNotes}
                  setClosingNotes={setClosingNotes}
                  loading={loading}
                  handleCloseShift={handleCloseShift}
                  onClose={onClose}
                />
              ) : (
                <OpenShiftSection
                  lastClosedShift={lastClosedShift}
                  openBalance={openBalance}
                  setOpenBalance={setOpenBalance}
                  openNotes={openNotes}
                  setOpenNotes={setOpenNotes}
                  currentUser={currentUser}
                  loading={loading}
                  handleOpenShift={handleOpenShift}
                  onClose={onClose}
                />
              )}
            </>
          )}

          {/* TAB 2: SHIFT HISTORY & RECONCILIATION AUDIT */}
          {activeTab === 'history' && (
            <ShiftHistorySection
              shiftHistory={shiftHistory}
              selectedHistoryShift={selectedHistoryShift}
              setSelectedHistoryShift={setSelectedHistoryShift}
              fetchShiftHistory={fetchShiftHistory}
              handlePrintSlip={handlePrintSlip}
            />
          )}
        </div>

        {/* Printable Shift Closing Audit Receipt (Visible only during print) */}
        <div className="printable-shift-receipt hidden print:block">
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              .printable-shift-receipt, .printable-shift-receipt * {
                visibility: visible !important;
              }
              .printable-shift-receipt {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 80mm !important;
                padding: 10px !important;
                font-family: monospace, sans-serif !important;
                font-size: 11px !important;
                color: #000 !important;
              }
            }
          `}</style>
          {(() => {
            const slipShift = closedSummary?.shift || selectedHistoryShift || currentShift;
            if (!slipShift) return null;
            return (
              <div className="text-center font-mono">
                <h3 className="m-0 text-sm font-bold">{shopInfo?.shop_name || 'SHEBA TECHNOLOGY BD'}</h3>
                <p className="m-0 text-[10px]">EOD CASH REGISTER CLOSING SLIP</p>
                <div className="border-t border-b border-dashed border-black py-1.5 my-1.5 text-left text-[10px]">
                  <div>Shift #: {slipShift.id}</div>
                  <div>Cashier: {slipShift.closed_by_name || slipShift.opened_by_name || 'Admin'}</div>
                  <div>Opened: {new Date(slipShift.opened_at).toLocaleString()}</div>
                  {slipShift.closed_at && <div>Closed: {new Date(slipShift.closed_at).toLocaleString()}</div>}
                </div>
                <table className="w-full text-[10px] text-left my-2">
                  <tbody>
                    <tr><td>Opening Cash:</td><td className="text-right">৳{Number(slipShift.opening_balance).toFixed(2)}</td></tr>
                    <tr><td>(+) Cash Sales:</td><td className="text-right">৳{Number(slipShift.total_cash_sales).toFixed(2)}</td></tr>
                    <tr><td>(+) Collections:</td><td className="text-right">৳{Number(slipShift.total_due_collections).toFixed(2)}</td></tr>
                    <tr><td>(-) Cash Expenses:</td><td className="text-right">৳{Number(slipShift.total_cash_expenses).toFixed(2)}</td></tr>
                    <tr className="border-t border-black font-bold"><td>Expected Cash:</td><td className="text-right">৳{Number(slipShift.expected_cash_balance).toFixed(2)}</td></tr>
                    <tr className="font-bold"><td>Actual Count:</td><td className="text-right">৳{Number(slipShift.actual_cash_counted).toFixed(2)}</td></tr>
                    <tr className="border-t border-dashed border-black font-bold"><td>Variance:</td><td className="text-right">৳{Number(slipShift.variance_amount).toFixed(2)}</td></tr>
                  </tbody>
                </table>
                <div className="mt-5 flex justify-between text-[9px]">
                  <div>-------------------<br/>Cashier Sign</div>
                  <div>-------------------<br/>Manager Sign</div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
