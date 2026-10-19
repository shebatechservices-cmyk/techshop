import React from 'react';
import { STATUS_STYLES } from './ordersTabConstants';

export default function OrderTableRow({
  order: o,
  taka,
  isTechnician,
  handleQuickStatusChange,
  setSelectedOrderDetails,
  setPrintOrder,
}) {
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

      {/* STATUS DISPLAY / DROPDOWN */}
      <td className="px-3.5 py-3 text-center">
        {isTechnician ? (
          <span
            className={`inline-block px-2.5 py-1 rounded-md text-xs font-extrabold uppercase border ${statusStyle.badge}`}
          >
            {status}
          </span>
        ) : (
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
        )}
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
}
