import React from 'react';

const COURIER_OPTIONS = [
  'Steadfast Courier',
  'Pathao Courier',
  'RedX Delivery',
  'Sundarban Courier',
  'Paperfly',
  'eCourier',
  'In-house / Merchant Delivery',
];

export default function OrderLogisticsForm({
  courierName,
  setCourierName,
  trackingCode,
  setTrackingCode,
  paymentStatus,
  setPaymentStatus,
  savingDetails,
  onSubmit,
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
      <div className="text-xs font-extrabold text-teal-600 uppercase tracking-wide mb-2">
        🚚 Logistics &amp; Payment Status
      </div>
      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              COURIER PARTNER
            </label>
            <select
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs bg-white outline-none focus:border-teal-500"
            >
              <option value="">-- Choose Courier --</option>
              {COURIER_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              PAYMENT STATUS
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs bg-white outline-none focus:border-teal-500"
            >
              <option value="unpaid">Unpaid / COD</option>
              <option value="paid">Paid</option>
              <option value="partial">Partially Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        <div className="mb-2">
          <label className="block text-xs font-bold text-slate-500 mb-1">
            TRACKING / CONSIGNMENT ID
          </label>
          <input
            type="text"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            placeholder="e.g. STDF-124982 or Pathao CN"
            className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs bg-white outline-none focus:border-teal-500 box-border"
          />
        </div>

        <button
          type="submit"
          disabled={savingDetails}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold cursor-pointer transition-colors disabled:opacity-60"
        >
          {savingDetails ? 'Saving...' : 'Save Logistics Info'}
        </button>
      </form>
    </div>
  );
}
