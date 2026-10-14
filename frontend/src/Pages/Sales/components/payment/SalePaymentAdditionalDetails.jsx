import React from 'react';

/**
 * Left Column: Additional Details form inputs (Sales Person, Invoice Date, Destination, Attention).
 */
export default function SalePaymentAdditionalDetails({
  salesPerson,
  setSalesPerson,
  staffList,
  invoiceDate,
  setInvoiceDate,
  destination,
  setDestination,
  attention,
  setAttention,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-md p-2 sm:px-3 sm:py-2">
      <div className="text-[0.72rem] font-extrabold text-slate-700 uppercase tracking-wide mb-2">
        ADDITIONAL DETAILS
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* SALES PERSON */}
        <div>
          <label className="block text-[0.66rem] font-bold text-slate-500 uppercase mb-0.5">
            SALES PERSON
          </label>
          <select
            value={salesPerson}
            onChange={(e) => setSalesPerson(e.target.value)}
            className="w-full h-7 py-0.5 px-1.5 rounded border border-slate-300 text-xs text-slate-800 bg-white outline-none box-border"
          >
            <option value="">-- Select --</option>
            {staffList.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* INVOICE DATE */}
        <div>
          <label className="block text-[0.66rem] font-bold text-slate-500 uppercase mb-0.5">
            INVOICE DATE
          </label>
          <input
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            className="w-full h-7 py-0.5 px-1.5 rounded border border-slate-300 text-xs text-slate-800 bg-white outline-none box-border"
          />
        </div>

        {/* DESTINATION */}
        <div>
          <label className="block text-[0.66rem] font-bold text-slate-500 uppercase mb-0.5">
            DESTINATION
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Destination..."
            className="w-full h-7 py-0.5 px-1.5 rounded border border-slate-300 text-xs text-slate-800 bg-white outline-none box-border"
          />
        </div>

        {/* ATTENTION */}
        <div>
          <label className="block text-[0.66rem] font-bold text-slate-500 uppercase mb-0.5">
            ATTENTION
          </label>
          <input
            type="text"
            value={attention}
            onChange={(e) => setAttention(e.target.value)}
            placeholder="Attention..."
            className="w-full h-7 py-0.5 px-1.5 rounded border border-slate-300 text-xs text-slate-800 bg-white outline-none box-border"
          />
        </div>
      </div>
    </div>
  );
}
