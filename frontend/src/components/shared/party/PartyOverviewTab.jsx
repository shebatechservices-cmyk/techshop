import React from 'react';

export default function PartyOverviewTab({ profileData, partyType }) {
  const profile = profileData?.profile || {};
  const stats = profileData?.stats || {};
  const sales = profileData?.sales || [];
  const purchaseOrders = profileData?.purchase_orders || [];
  const balance = parseFloat(profile.balance || 0);

  return (
    <div>
      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Total Records</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {stats.total_invoices || stats.total_pos || stats.total_sales || 0}
          </div>
          <small className="text-slate-400 text-xs">
            {partyType === 'customer' ? 'Sales Invoices' : partyType === 'supplier' ? 'Purchase POs' : 'Created Orders'}
          </small>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Lifetime Volume</span>
          <div className="text-xl font-extrabold text-sky-600 mt-1">
            ৳ {Number(stats.lifetime_purchases || stats.lifetime_orders || stats.total_sales_volume || 0).toLocaleString('en-BD')}
          </div>
          <small className="text-slate-400 text-xs">Cumulative Turnover</small>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Lifetime Paid</span>
          <div className="text-xl font-extrabold text-emerald-600 mt-1">
            ৳ {Number(stats.lifetime_paid || 0).toLocaleString('en-BD')}
          </div>
          <small className="text-slate-400 text-xs">Cleared Payments</small>
        </div>

        <div className={`border rounded-xl p-3.5 ${balance > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <span className={`text-[11px] uppercase font-bold tracking-wider ${balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            {partyType === 'customer'
              ? (balance > 0 ? 'Outstanding Due' : balance < 0 ? 'Advance Credit' : 'Balance')
              : partyType === 'supplier'
              ? (balance > 0 ? 'Payable Due' : balance < 0 ? 'Advance Given' : 'Balance')
              : 'Balance'}
          </span>
          <div className={`text-xl font-extrabold mt-1 ${balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            ৳ {balance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </div>
          <small className={`text-xs ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {balance > 0 ? 'Pending Settlement' : balance < 0 ? (partyType === 'customer' ? 'Advance credit' : 'Advance given') : 'All Cleared'}
          </small>
        </div>
      </div>

      {/* Profile Details Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 shadow-sm">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          📋 Contact & System Details
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div><strong className="text-slate-500">Full Name:</strong> <span className="text-slate-800 font-semibold">{profile.name}</span></div>
          <div><strong className="text-slate-500">Phone:</strong> <span className="text-slate-800 font-semibold">{profile.phone || '—'}</span></div>
          <div><strong className="text-slate-500">Email:</strong> <span className="text-slate-800">{profile.email || '—'}</span></div>
          <div><strong className="text-slate-500">Address:</strong> <span className="text-slate-800">{profile.address || '—'}</span></div>
          <div><strong className="text-slate-500">Classification:</strong> <span className="text-slate-800 font-semibold">{profile.customer_type || profile.contact_person || profile.role_name || 'Standard'}</span></div>
          <div><strong className="text-slate-500">Registered On:</strong> <span className="text-slate-800">{new Date(profile.created_at).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
          {profile.loyalty_points !== undefined && (
            <div><strong className="text-slate-500">Loyalty Points:</strong> <span className="text-amber-600 font-bold">★ {profile.loyalty_points} pts</span></div>
          )}
        </div>
      </div>

      {/* Recent Invoices / Activity Table */}
      <div>
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
          {partyType === 'customer' ? '🧾 Recent Sales Invoices' : partyType === 'supplier' ? '📦 Recent Purchase Orders' : '📋 Recent Activity'}
        </h4>
        {partyType === 'customer' && (
          sales.length === 0 ? (
            <p className="text-slate-400 text-xs">No sales invoices recorded for this customer yet.</p>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="p-2.5">Invoice #</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5 text-right">Total</th>
                    <th className="p-2.5 text-right">Paid</th>
                    <th className="p-2.5 text-right">Due</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {sales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="p-2.5 font-bold text-sky-600">{s.invoice_no}</td>
                      <td className="p-2.5 text-slate-500">{new Date(s.created_at).toLocaleDateString()}</td>
                      <td className="p-2.5 text-right font-semibold">৳ {Number(s.total_amount).toLocaleString()}</td>
                      <td className="p-2.5 text-right text-emerald-600">৳ {Number(s.paid_amount).toLocaleString()}</td>
                      <td className={`p-2.5 text-right font-bold ${Number(s.due_amount) > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                        ৳ {Number(s.due_amount).toLocaleString()}
                      </td>
                      <td className="p-2.5 text-center">
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
    </div>
  );
}
