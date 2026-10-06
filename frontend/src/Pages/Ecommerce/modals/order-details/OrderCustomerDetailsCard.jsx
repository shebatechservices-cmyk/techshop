import React from 'react';

export default function OrderCustomerDetailsCard({
  order,
  whatsappUrl,
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
      <div className="text-xs font-extrabold text-teal-600 uppercase tracking-wide mb-2">
        👤 Customer &amp; Recipient
      </div>
      <div className="text-base font-bold text-slate-900">{order.customer_name}</div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-sm text-slate-700">📞 {order.customer_phone}</span>
        {order.customer_phone && (
          <>
            <a
              href={`tel:${order.customer_phone}`}
              className="text-xs px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-sky-600 font-semibold no-underline transition-colors"
            >
              Call
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 rounded text-emerald-700 font-bold no-underline transition-colors"
            >
              WhatsApp
            </a>
          </>
        )}
      </div>
      <div className="mt-2 text-xs text-slate-500 leading-relaxed">
        <strong>Address:</strong> {order.shipping_address || 'N/A'}
      </div>
      {order.customer_notes && (
        <div className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-md">
          <strong>Note:</strong> {order.customer_notes}
        </div>
      )}
    </div>
  );
}
