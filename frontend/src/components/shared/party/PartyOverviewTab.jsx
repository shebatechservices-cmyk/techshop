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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2 sm:p-2.5">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Records</span>
          <div className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-0.5">
            {stats.total_invoices || stats.total_pos || stats.total_sales || 0}
          </div>
          <span className="text-slate-400 text-[10px] block truncate">
            {partyType === 'customer' ? 'Sales Invoices' : partyType === 'supplier' ? 'Purchase POs' : 'Created Orders'}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2 sm:p-2.5">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Lifetime Volume</span>
          <div className="text-base sm:text-lg font-black text-sky-600 leading-tight mt-0.5">
            ৳ {Number(stats.lifetime_purchases || stats.lifetime_orders || stats.total_sales_volume || 0).toLocaleString('en-BD')}
          </div>
          <span className="text-slate-400 text-[10px] block truncate">Turnover</span>
        </div>

        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2 sm:p-2.5">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Lifetime Paid</span>
          <div className="text-base sm:text-lg font-black text-emerald-600 leading-tight mt-0.5">
            ৳ {Number(stats.lifetime_paid || 0).toLocaleString('en-BD')}
          </div>
          <span className="text-slate-400 text-[10px] block truncate">Cleared</span>
        </div>

        <div className={`border rounded-xl p-2 sm:p-2.5 ${balance > 0 ? 'bg-rose-50/80 border-rose-200' : 'bg-emerald-50/80 border-emerald-200'}`}>
          <span className={`text-[10px] uppercase font-bold tracking-wider ${balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            {partyType === 'customer'
              ? (balance > 0 ? 'Outstanding Due' : balance < 0 ? 'Advance Credit' : 'Balance')
              : partyType === 'supplier'
              ? (balance > 0 ? 'Payable Due' : balance < 0 ? 'Advance Given' : 'Balance')
              : 'Balance'}
          </span>
          <div className={`text-base sm:text-lg font-black leading-tight mt-0.5 ${balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            ৳ {balance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </div>
          <span className={`text-[10px] block truncate ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {balance > 0 ? 'Pending Settlement' : 'All Cleared'}
          </span>
        </div>
      </div>

      {/* 3. INSIGHTS & PROFILE DETAILS (2-Column Compact Hub) */}
      <div className={`grid grid-cols-1 ${partyType === 'customer' ? 'md:grid-cols-2' : ''} gap-2.5 mb-2.5`}>
        {partyType === 'customer' && (
          <CustomerSmartInsights smart={smart} profile={profile} />
        )}

        {/* Profile Contact & System Card */}
        <div className="bg-slate-50/60 border border-slate-200/90 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide flex items-center gap-1">
              <span>📋</span> Details & Status
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {profile.customer_type || profile.contact_person || profile.role_name || 'Regular'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="bg-white border border-slate-100 p-1.5 px-2 rounded-lg">
              <span className="text-[9px] text-slate-400 font-bold uppercase block">Classification</span>
              <span className="font-bold text-slate-800 truncate block">
                {profile.customer_type || profile.contact_person || profile.role_name || 'Regular'}
              </span>
            </div>
            <div className="bg-white border border-slate-100 p-1.5 px-2 rounded-lg">
              <span className="text-[9px] text-slate-400 font-bold uppercase block">Registered</span>
              <span className="font-bold text-slate-800 truncate block">
                {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
              </span>
            </div>
            <div className="bg-white border border-slate-100 p-1.5 px-2 rounded-lg">
              <span className="text-[9px] text-slate-400 font-bold uppercase block">Address</span>
              <span className="font-semibold text-slate-700 truncate block" title={profile.address || '—'}>
                {profile.address || '—'}
              </span>
            </div>
            <div className="bg-white border border-slate-100 p-1.5 px-2 rounded-lg">
              <span className="text-[9px] text-slate-400 font-bold uppercase block">Loyalty Points</span>
              <span className="font-bold text-amber-600 block">
                ★ {profile.loyalty_points || 0} pts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. RECENT ACTIVITY TABLE */}
      <PartyRecentActivityTable
        partyType={partyType}
        sales={sales}
        purchaseOrders={purchaseOrders}
      />
    </div>
  );
}
