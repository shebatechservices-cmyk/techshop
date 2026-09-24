import React from 'react';

export default function WarrantySearchLookup({
  searchQuery,
  setSearchQuery,
  searching,
  searchResult,
  searchError,
  handleCheckWarranty,
  handleIntakeFromSearch,
  handleReturnFromSearch,
}) {
  const resultData = searchResult?.data;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs mb-4">
      {/* Search Input Bar */}
      <form onSubmit={handleCheckWarranty} className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder="Scan Barcode Serial Number (S/N) or type Invoice # to check warranty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={searching || !searchQuery.trim()}
          className={`px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
            searching || !searchQuery.trim() ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <span>{searching ? 'Checking...' : 'Check Warranty'}</span>
        </button>
      </form>

      {/* Search Error */}
      {searchError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{searchError}</span>
        </div>
      )}

      {/* Search Result Card */}
      {resultData && (
        <div className="mt-3.5 p-4 rounded-xl border border-sky-200 bg-sky-50/50 space-y-3">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                Found Record: {searchResult.match_type || 'SERIAL'}
              </span>
              <h4 className="text-sm font-extrabold text-slate-900 mt-1">
                {resultData.product_name}
              </h4>
              <p className="text-xs text-slate-500 font-mono">
                S/N: <strong>{resultData.serial_code}</strong> · Invoice: <strong>{resultData.invoice_no || 'N/A'}</strong>
              </p>
            </div>

            <div className="text-right">
              <span
                className={`inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                  resultData.is_customer_warranty_valid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {resultData.is_customer_warranty_valid ? '✓ Warranty Valid' : '⚠️ Warranty Expired'}
              </span>
              <div className="text-[11px] text-slate-500 mt-1">
                Expiry Date: <strong>{resultData.customer_warranty_expiry || 'N/A'}</strong> (
                {resultData.customer_days_remaining ?? 0} days remaining)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer</span>
              <strong className="text-slate-800">{resultData.customer_name || 'N/A'}</strong>
              <div className="text-slate-500 text-[11px]">{resultData.customer_phone}</div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Sale Info</span>
              <strong className="text-slate-800">৳ {Number(resultData.unit_price || 0).toLocaleString()}</strong>
              <div className="text-slate-500 text-[11px]">Sold on: {resultData.sale_date || 'N/A'}</div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Vendor Warranty</span>
              <strong className={resultData.is_vendor_warranty_valid ? 'text-emerald-700' : 'text-slate-600'}>
                {resultData.vendor_warranty_info || '12 Months Supplier Warranty'}
              </strong>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleIntakeFromSearch}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
            >
              + Create Service Claim
            </button>
            <button
              type="button"
              onClick={handleReturnFromSearch}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
            >
              🔄 Process Return / Refund
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
