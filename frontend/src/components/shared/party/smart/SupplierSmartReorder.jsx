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

  const waReorderMessage = `আসসালামু আলাইকুম ${profile.name || 'সাপ্লায়ার'}, সেবা টেকনোলজি থেকে বলছি। আমাদের নিচের পণ্যগুলো জরুরি রি-অর্ডার করা প্রয়োজন:\n\n${reorderListText}\n\nঅনুগ্রহ করে প্রাপ্যতা কনফার্ম করুন। ধন্যবাদ।`;

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
মোট অর্ডার: ৳ ${Number(stats.lifetime_orders || 0).toLocaleString('en-BD')}
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
    <div className="space-y-2 mb-3">
      {/* 1. Compact Action Bar (No redundant title banner) */}
      <div className="flex items-center justify-between flex-wrap gap-2 py-1 px-1">
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          {waReorderUrl && (
            <a
              href={waReorderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition-all text-[11px]"
            >
              <span>💬</span> {low_stock_reorders.length > 0 ? 'WhatsApp Reorder' : 'WhatsApp'}
            </a>
          )}
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-lg shadow-2xs transition-all text-[11px]"
          >
            <span>{copied ? '✅' : '📋'}</span>
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>
          {phone && (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 font-semibold rounded-lg transition-all text-[11px]"
            >
              <span>📞</span> Call
            </a>
          )}
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge_color}`}>
          {reliability_label}
        </span>
      </div>

      {/* 2. Compact Low Stock Items Card */}
      {low_stock_reorders.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-black text-amber-900 uppercase tracking-wide flex items-center gap-1">
              <span>⚠️</span> Low Stock Items ({low_stock_reorders.length})
            </span>
            <span className="text-[10px] text-amber-700 font-medium">Re-order recommended</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
            {low_stock_reorders.map((item) => (
              <div key={item.id} className="bg-white border border-amber-100 rounded-lg p-1.5 px-2 text-[11px] flex justify-between items-center shadow-2xs">
                <span className="font-semibold text-slate-800 truncate mr-1.5" title={item.name}>{item.name}</span>
                <span className="bg-rose-100 text-rose-800 font-black text-[10px] px-1.5 py-0.5 rounded flex-shrink-0">
                  Stock: {item.stock}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Compact Frequently Supplied Products Card */}
      {top_products.length > 0 && (
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 shadow-2xs">
          <span className="text-[11px] text-slate-700 font-black uppercase tracking-wide block mb-1.5">
            📦 Frequently Supplied Products
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 text-[11px]">
            {top_products.map((item) => (
              <div key={item.name} className="bg-white border border-slate-200/80 rounded-lg p-1.5 px-2 flex justify-between items-center">
                <div className="truncate mr-1.5">
                  <span className="font-semibold text-slate-800 block truncate" title={item.name}>{item.name}</span>
                  <span className="text-[9px] text-slate-400 block">৳{Number(item.avg_cost_price).toLocaleString('en-BD')}</span>
                </div>
                <span className="bg-sky-50 text-sky-700 font-bold text-[10px] px-1.5 py-0.5 rounded flex-shrink-0">
                  {item.total_qty_supplied} pcs
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
