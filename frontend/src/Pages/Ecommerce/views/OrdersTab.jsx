import React from 'react';

const STATUS_STYLES = {
  all: {
    active: 'border-slate-600 bg-slate-100 text-slate-700',
    badge: 'border-slate-500 bg-slate-100 text-slate-600',
    select: 'border-slate-400 bg-slate-50 text-slate-700',
  },
  pending: {
    active: 'border-amber-600 bg-amber-100 text-amber-800',
    badge: 'border-amber-600 bg-amber-100 text-amber-700',
    select: 'border-amber-400 bg-amber-50 text-amber-800',
  },
  processing: {
    active: 'border-sky-600 bg-sky-100 text-sky-800',
    badge: 'border-sky-600 bg-sky-100 text-sky-700',
    select: 'border-sky-400 bg-sky-50 text-sky-800',
  },
  shipped: {
    active: 'border-indigo-600 bg-indigo-100 text-indigo-800',
    badge: 'border-indigo-600 bg-indigo-100 text-indigo-700',
    select: 'border-indigo-400 bg-indigo-50 text-indigo-800',
  },
  delivered: {
    active: 'border-emerald-600 bg-emerald-100 text-emerald-800',
    badge: 'border-emerald-600 bg-emerald-100 text-emerald-700',
    select: 'border-emerald-400 bg-emerald-50 text-emerald-800',
  },
  cancelled: {
    active: 'border-red-600 bg-red-100 text-red-800',
    badge: 'border-red-600 bg-red-100 text-red-700',
    select: 'border-red-400 bg-red-50 text-red-800',
  },
};

export default function OrdersTab({
  orders,
  filteredOrders,
  loading,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  courierFilter,
  setCourierFilter,
  paymentFilter,
  setPaymentFilter,
  STATUS_CONFIG,
  handleQuickStatusChange,
  setSelectedOrderDetails,
  setPrintOrder,
  setIsNewOrderModalOpen,
  taka,
}) {
  return (
    <div>
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

      {/* Orders Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-10 px-5 text-center text-slate-500">
            <span className="text-2xl block mb-2">⏳</span>
            Loading e-commerce orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 px-5 text-center text-slate-400">
            <span className="text-4xl block mb-2.5">📦</span>
            <p className="m-0 font-bold text-base text-slate-700">
              No online orders match your filters
            </p>
            <p className="mt-1 mb-4 text-xs">
              Create an online order or adjust your search and status filters above.
            </p>
            <button
              type="button"
              onClick={() => setIsNewOrderModalOpen(true)}
              className="px-4.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-bold text-xs cursor-pointer transition-colors shadow-sm"
            >
              + Create First Online Order
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-extrabold tracking-wider uppercase">
                  <th className="px-3.5 py-3">ORDER # &amp; DATE</th>
                  <th className="px-3.5 py-3">CUSTOMER</th>
                  <th className="px-3.5 py-3">ITEMS</th>
                  <th className="px-3.5 py-3">SHIPPING &amp; COURIER</th>
                  <th className="px-3.5 py-3 text-center">PAYMENT</th>
                  <th className="px-3.5 py-3 text-right">TOTAL</th>
                  <th className="px-3.5 py-3 text-center">STATUS</th>
                  <th className="px-3.5 py-3 text-center w-[130px]">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => {
                  const status = (o.order_status || 'pending').toLowerCase();
                  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.pending;
                  const isPaid = (o.payment_status || '').toLowerCase() === 'paid';
                  const itemsCount = (o.items || []).reduce((acc, it) => acc + Number(it.quantity || 1), 0);

                  // Raw phone for WhatsApp
                  const rawPhone = (o.customer_phone || '').replace(/[^0-9]/g, '');
                  const bdPhone = rawPhone.startsWith('880')
                    ? rawPhone
                    : rawPhone.startsWith('0')
                    ? `88${rawPhone}`
                    : `880${rawPhone}`;
                  const waUrl = `https://wa.me/${bdPhone}?text=Hello%20${encodeURIComponent(
                    o.customer_name || 'Customer'
                  )},%20regarding%20order%20%23${encodeURIComponent(o.order_no || o.id)}`;

                  return (
                    <tr
                      key={o.id}
                      className="border-b border-slate-100 odd:bg-white even:bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      {/* ORDER # & DATE */}
                      <td className="px-3.5 py-3">
                        <div
                          onClick={() => setSelectedOrderDetails(o)}
                          className="font-extrabold text-teal-600 hover:text-teal-700 cursor-pointer"
                        >
                          #{o.order_no || o.order_number || o.id}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {o.created_at
                            ? new Date(o.created_at).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </div>
                      </td>

                      {/* CUSTOMER & CONTACTS */}
                      <td className="px-3.5 py-3">
                        <div className="font-bold text-slate-900">{o.customer_name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-slate-600">{o.customer_phone}</span>
                          <a
                            href={`tel:${o.customer_phone}`}
                            title="Call customer"
                            className="text-xs no-underline px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-sky-600 transition-colors"
                          >
                            📞
                          </a>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Send WhatsApp Message"
                            className="text-xs no-underline px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 rounded text-emerald-600 transition-colors"
                          >
                            💬
                          </a>
                        </div>
                      </td>

                      {/* ITEMS SUMMARY */}
                      <td className="px-3.5 py-3">
                        <div className="font-semibold text-slate-800">
                          {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                        </div>
                        <div className="text-xs text-slate-500 max-w-[180px] truncate">
                          {(o.items || [])
                            .map((it) => `${it.product_name || 'Product'} (x${it.quantity})`)
                            .join(', ') || 'Online package'}
                        </div>
                      </td>

                      {/* SHIPPING & COURIER */}
                      <td className="px-3.5 py-3">
                        <div className="text-xs font-semibold text-slate-700">
                          🚚 {o.courier_name || 'Standard Courier'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate">
                          📍 {o.shipping_address}
                        </div>
                        {o.tracking_code && (
                          <div className="text-xs text-sky-600 font-bold mt-0.5">
                            CN: {o.tracking_code}
                          </div>
                        )}
                      </td>

                      {/* PAYMENT */}
                      <td className="px-3.5 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-extrabold uppercase ${
                            isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {isPaid ? '✓ Paid' : o.payment_method ? `${o.payment_method.toUpperCase()} / COD` : 'COD'}
                        </span>
                      </td>

                      {/* TOTAL */}
                      <td className="px-3.5 py-3 text-right font-extrabold text-slate-900">
                        {taka(o.total_amount)}
                      </td>

                      {/* STATUS DROPDOWN */}
                      <td className="px-3.5 py-3 text-center">
                        <select
                          value={status}
                          onChange={(e) => handleQuickStatusChange(o.id, e.target.value)}
                          className={`px-2 py-1 rounded-md text-xs font-extrabold border cursor-pointer outline-none transition-colors ${statusStyle.select}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-3.5 py-3 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderDetails(o)}
                            title="View full order details"
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-xs font-bold text-slate-700 cursor-pointer transition-colors"
                          >
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() => setPrintOrder(o)}
                            title="Print Packing Slip / Label"
                            className="px-2 py-1 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded text-xs font-bold text-teal-600 cursor-pointer transition-colors"
                          >
                            🖨️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
