import React from 'react';
import CustomerSmartInsights from './smart/CustomerSmartInsights';
import CustomerSmartActions from './smart/CustomerSmartActions';
import SupplierSmartReorder from './smart/SupplierSmartReorder';
import PartyRecentActivityTable from './PartyRecentActivityTable';

export default function PartyOverviewTab({ profileData, partyType }) {
  const profile = profileData?.profile || {};
  const stats = profileData?.stats || {};
  const smart = profileData?.smart || {};
  const sales = profileData?.sales || [];
  const purchaseOrders = profileData?.purchase_orders || [];
  const balance = parseFloat(profile.balance || 0);

  return (
    <div>
      {/* 1. SMART QUICK ACTIONS & REORDER HUB */}
      {partyType === 'customer' && (
        <CustomerSmartActions
          profile={profile}
          stats={stats}
          balance={balance}
        />
      )}

      {partyType === 'supplier' && (
        <SupplierSmartReorder
          smart={smart}
          profile={profile}
          stats={stats}
          balance={balance}
        />
      )}

      {/* 2. SUMMARY METRIC CARDS */}
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

      {/* 3. CUSTOMER SMART INSIGHTS */}
      {partyType === 'customer' && (
        <CustomerSmartInsights smart={smart} profile={profile} />
      )}

      {/* 4. PROFILE CONTACT DETAILS BOX */}
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

      {/* 5. RECENT ACTIVITY TABLE */}
      <PartyRecentActivityTable
        partyType={partyType}
        sales={sales}
        purchaseOrders={purchaseOrders}
      />
    </div>
  );
}
