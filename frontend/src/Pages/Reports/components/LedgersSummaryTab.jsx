import React from 'react';

export default function LedgersSummaryTab({ ledgers = {} }) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 4 Working Capital & Ledger Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Customer Receivables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-t-4 border-t-red-600">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Customer Receivables (Market Due)
          </span>
          <div className="text-2xl font-extrabold text-red-600 mt-2">
            ৳ {ledgers.total_customer_receivables?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 font-medium">
            Outstanding receivables from clients
          </div>
        </div>

        {/* Supplier Payables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-t-4 border-t-amber-500">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Supplier Payables (Vendor Due)
          </span>
          <div className="text-2xl font-extrabold text-amber-600 mt-2">
            ৳ {ledgers.total_supplier_payables?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 font-medium">
            Outstanding bills owed to importers/suppliers
          </div>
        </div>

        {/* Cash in Drawers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-t-4 border-t-teal-600">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Cash in Drawers (Physical)
          </span>
          <div className="text-2xl font-extrabold text-teal-700 mt-2">
            ৳ {ledgers.total_cash_in_drawers?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 font-medium">
            On-hand physical store cash
          </div>
        </div>

        {/* Total Liquid Funds */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-t-4 border-t-slate-900">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Liquid Funds (All Accounts)
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            ৳ {ledgers.total_liquid_funds?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 font-medium">
            Cash, Bank & Mobile Wallets combined
          </div>
        </div>
      </div>

      {/* Net Working Capital Snapshot */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>👥</span> Financial Solvency & Working Capital Summary
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
              Party Ledger Exposure
            </h4>
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500">Market Outstanding Due:</span>
              <strong className="text-red-600 font-mono">
                ৳ {ledgers.total_customer_receivables?.toLocaleString('en-IN') || 0}
              </strong>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500">Vendor Payable Due:</span>
              <strong className="text-amber-600 font-mono">
                ৳ {ledgers.total_supplier_payables?.toLocaleString('en-IN') || 0}
              </strong>
            </div>
            <div className="flex justify-between pt-0.5">
              <span className="text-slate-700 font-bold">Net Party Gap (Receivable - Payable):</span>
              <strong
                className={`font-mono font-bold ${
                  (ledgers.total_customer_receivables || 0) - (ledgers.total_supplier_payables || 0) >= 0
                    ? 'text-emerald-700'
                    : 'text-red-600'
                }`}
              >
                ৳{' '}
                {(
                  (ledgers.total_customer_receivables || 0) -
                  (ledgers.total_supplier_payables || 0)
                ).toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
              Liquid Accounts
            </h4>
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500">Store Cash Registers:</span>
              <strong className="text-teal-700 font-mono">
                ৳ {ledgers.total_cash_in_drawers?.toLocaleString('en-IN') || 0}
              </strong>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500">Bank & Digital Accounts:</span>
              <strong className="text-blue-700 font-mono">
                ৳{' '}
                {Math.max(
                  0,
                  (ledgers.total_liquid_funds || 0) - (ledgers.total_cash_in_drawers || 0)
                ).toLocaleString('en-IN')}
              </strong>
            </div>
            <div className="flex justify-between pt-0.5">
              <span className="text-slate-900 font-bold">Total Liquid Capital:</span>
              <strong className="text-slate-900 font-mono font-bold">
                ৳ {ledgers.total_liquid_funds?.toLocaleString('en-IN') || 0}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
