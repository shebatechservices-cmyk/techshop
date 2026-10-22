import React, { useState } from 'react';

export default function SupplierSmartReorder({ smart = {}, profile = {}, stats = {}, balance = 0 }) {
  const [copied, setCopied] = useState(false);
  const {
    reliability_label = 'Standard Supplier',
    badge_color = 'bg-slate-100 text-slate-800',
    top_products = [],
    low_stock_reorders = [],
  } = smart;

  const phone = String(profile.phone || '').trim();
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const bdPhone = cleanPhone.startsWith('880')
    ? cleanPhone
    : cleanPhone.startsWith('0')
    ? `88${cleanPhone}`
    : cleanPhone;

  // Construct WhatsApp reorder text
  const reorderListText = low_stock_reorders
    .map((item, idx) => `${idx + 1}. ${item.name} - স্টক: ${item.stock} (দরকার: ${Math.max(5, item.min_stock * 2)} পিস)`)
    .join('\n');

  const waReorderMessage = `আসসালামু আলাইকুম ${profile.name || 'সাপ্লায়ার'}, সেবা টেকনোলজি থেকে বলছি। আমাদের নিচের পণ্যগুলো জরুরি রি-অর্ডার করা প্রয়োজন:\n\n${reorderListText}\n\nঅনুগ্রহ করে পণ্যের প্রাপ্যতা ও ডেলিভারির সময় কনফার্ম করুন। ধন্যবাদ।`;

  const waReorderUrl = bdPhone && low_stock_reorders.length > 0
    ? `https://wa.me/${bdPhone}?text=${encodeURIComponent(waReorderMessage)}`
    : bdPhone
    ? `https://wa.me/${bdPhone}`
    : null;

  const handleCopySummary = async () => {
    const text = `📦 সাপ্লায়ার সামারি (Sheba Technology)
নাম: ${profile.name || 'N/A'}
ফোন: ${profile.phone || 'N/A'}
মোট পিও (POs): ${stats.total_pos || 0}
লাইফটাইম অর্ডার: ৳ ${Number(stats.lifetime_orders || 0).toLocaleString('en-BD')}
মোট পরিশোধ: ৳ ${Number(stats.lifetime_paid || 0).toLocaleString('en-BD')}
বকেয়া (Payable): ৳ ${Number(balance).toLocaleString('en-BD')}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-4 mb-5">
      {/* Quick Actions & Reliability Bar */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 shadow-sm flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm">⚡</span>
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
            Smart Supplier Actions
          </span>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badge_color}`}>
            {reliability_label}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {waReorderUrl && (
            <a
              href={waReorderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-all"
            >
              <span>💬</span> {low_stock_reorders.length > 0 ? 'WhatsApp Reorder' : 'WhatsApp'}
            </a>
          )}
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-xl shadow-sm transition-all"
          >
            <span>{copied ? '✅' : '📋'}</span>
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>
          {phone && (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 font-semibold rounded-xl transition-all"
            >
              <span>📞</span> Call
            </a>
          )}
        </div>
      </div>

      {/* Low Stock Re-order Alert Banner */}
      {low_stock_reorders.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚠️</span> Low Stock Items from this Supplier ({low_stock_reorders.length})
            </span>
            <span className="text-[10px] text-amber-700 font-semibold">Immediate re-order recommended</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {low_stock_reorders.map((item) => (
              <div key={item.id} className="bg-white border border-amber-100 rounded-xl p-2.5 text-xs flex justify-between items-center shadow-2xs">
                <div className="truncate mr-2">
                  <span className="font-bold text-slate-800 block truncate">{item.name}</span>
                  <span className="text-[10px] text-slate-400">Min: {item.min_stock} units</span>
                </div>
                <span className="bg-rose-100 text-rose-800 font-extrabold text-[11px] px-2 py-0.5 rounded-lg flex-shrink-0">
                  Stock: {item.stock}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Supplied Products */}
      {top_products.length > 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-sm">
          <span className="text-[11px] text-slate-600 font-black uppercase tracking-wider block mb-2">
            📦 Frequently Supplied Products
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {top_products.map((item) => (
              <div key={item.id} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex justify-between items-center">
                <div className="truncate mr-2">
                  <span className="font-semibold text-slate-800 block truncate">{item.name}</span>
                  <span className="text-[10px] text-slate-400">Avg Cost: ৳ {Number(item.avg_cost_price).toLocaleString('en-BD')}</span>
                </div>
                <span className="bg-sky-50 text-sky-700 font-bold text-[11px] px-2 py-0.5 rounded-md flex-shrink-0">
                  {item.total_qty_supplied} supplied
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
