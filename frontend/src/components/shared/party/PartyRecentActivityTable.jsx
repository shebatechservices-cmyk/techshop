import React from 'react';

export default function PartyRecentActivityTable({ partyType, sales = [], purchaseOrders = [] }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
        {partyType === 'customer'
          ? '🧾 Recent Sales Invoices'
          : partyType === 'supplier'
          ? '📦 Recent Purchase Orders'
          : '📋 Recent Activity'}
      </h4>

      {partyType === 'customer' && (
        sales.length === 0 ? (
          <p className="text-slate-400 text-xs">No sales invoices recorded for this customer yet.</p>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="p-2 px-2.5">Invoice #</th>
                  <th className="p-2 px-2.5">Date</th>
                  <th className="p-2 px-2.5 text-right">Total</th>
                  <th className="p-2 px-2.5 text-right">Paid</th>
                  <th className="p-2 px-2.5 text-right">Due</th>
                  <th className="p-2 px-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="p-2 px-2.5 font-bold text-sky-600">{s.invoice_no}</td>
                    <td className="p-2 px-2.5 text-slate-500">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="p-2 px-2.5 text-right font-semibold">৳ {Number(s.total_amount).toLocaleString()}</td>
                    <td className="p-2 px-2.5 text-right text-emerald-600">৳ {Number(s.paid_amount).toLocaleString()}</td>
                    <td className={`p-2 px-2.5 text-right font-bold ${Number(s.due_amount) > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                      ৳ {Number(s.due_amount).toLocaleString()}
                    </td>
                    <td className="p-2 px-2.5 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${s.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {s.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {partyType === 'supplier' && (
        purchaseOrders.length === 0 ? (
          <p className="text-slate-400 text-xs">No purchase orders recorded for this supplier yet.</p>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="p-2.5">PO Number</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5 text-right">Total Cost</th>
                  <th className="p-2.5 text-right">Paid</th>
                  <th className="p-2.5 text-right">Due</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/70">
                    <td className="p-2.5 font-bold text-emerald-600">{po.po_number}</td>
                    <td className="p-2.5 text-slate-500">{new Date(po.created_at).toLocaleDateString()}</td>
                    <td className="p-2.5 text-right font-semibold">৳ {Number(po.total_cost).toLocaleString()}</td>
                    <td className="p-2.5 text-right text-emerald-600">৳ {Number(po.total_paid || 0).toLocaleString()}</td>
                    <td className={`p-2.5 text-right font-bold ${Number(po.total_due) > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                      ৳ {Number(po.total_due || 0).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800">
                        {po.status || 'Received'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {partyType === 'staff' && (
        sales.length === 0 ? (
          <p className="text-slate-400 text-xs">No sales logged under this staff member yet.</p>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="p-2.5">Invoice #</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5 text-right">Amount</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="p-2.5 font-bold text-purple-600">{s.invoice_no}</td>
                    <td className="p-2.5 text-slate-500">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="p-2.5 text-right font-semibold">৳ {Number(s.total_amount).toLocaleString()}</td>
                    <td className="p-2.5 text-center">{s.payment_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
