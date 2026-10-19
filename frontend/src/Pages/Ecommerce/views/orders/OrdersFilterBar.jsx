import React from 'react';
import { STATUS_STYLES } from './ordersTabConstants';

export default function OrdersFilterBar({
  orders,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  courierFilter,
  setCourierFilter,
  paymentFilter,
  setPaymentFilter,
  STATUS_CONFIG,
}) {
  return (
    <>
      {/* Status Filter Badges / Pills */}
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {Object.keys(STATUS_CONFIG).map((st) => {
          const cfg = STATUS_CONFIG[st];
          const count =
            st === 'all'
              ? orders.length
              : orders.filter((o) => (o.order_status || 'pending').toLowerCase() === st).length;
          const isActive = statusFilter === st;
          const stStyle = STATUS_STYLES[st] || STATUS_STYLES.all;

          return (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all ${
                isActive
                  ? `border-2 ${stStyle.active}`
                  : 'border border-slate-300 bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              <span>{cfg.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                  isActive ? 'bg-white shadow-xs' : 'bg-slate-100'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Secondary Filters Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-2 flex items-center gap-2 mb-2.5 flex-wrap shadow-xs">
        <div className="flex-1 min-w-[220px] relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search Order #, Customer, Phone, Tracking..."
            className="w-full px-2.5 py-1.5 pr-7 rounded-md border border-slate-300 text-xs outline-none focus:border-teal-500 box-border bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-0.5"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <select
            value={courierFilter}
            onChange={(e) => setCourierFilter(e.target.value)}
            className="px-2 py-1.5 rounded-md border border-slate-300 text-xs bg-white outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="all">All Couriers</option>
            <option value="Steadfast">Steadfast Courier</option>
            <option value="Pathao">Pathao Courier</option>
            <option value="RedX">RedX Delivery</option>
            <option value="Sundarban">Sundarban Courier</option>
            <option value="Paperfly">Paperfly</option>
            <option value="In-house">In-house / Merchant</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-2 py-1.5 rounded-md border border-slate-300 text-xs bg-white outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid / COD</option>
          </select>
        </div>
      </div>
    </>
  );
}
