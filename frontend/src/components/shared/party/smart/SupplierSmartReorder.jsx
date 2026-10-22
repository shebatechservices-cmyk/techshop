import React, { useState } from 'react';

export default function SupplierSmartReorder({
  smart = {},
  profile = {},
  stats = {},
  balance = 0,
}) {
  const [copied, setCopied] = useState(false);
  const {
    reliability_label = 'Standard Supplier',
    badge_color = 'bg-slate-100 text-slate-800',
  } = smart;

  const phone = String(profile.phone || '').trim();
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const bdPhone = cleanPhone.startsWith('880')
    ? cleanPhone
    : cleanPhone.startsWith('0')
    ? `88${cleanPhone}`
    : cleanPhone;

  const payableAmount = balance > 0 ? balance : 0;

  const waMessage = `আসসালামু আলাইকুম ${profile.name || 'সাপ্লায়ার'}, সেবা টেকনোলজি থেকে যোগাযোগ করা হচ্ছে।`;

  const waUrl = bdPhone
    ? `https://wa.me/${bdPhone}?text=${encodeURIComponent(waMessage)}`
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
    <div className="flex items-center justify-between flex-wrap gap-2 py-1 px-1 mb-2.5">
      <div className="flex items-center gap-1.5 flex-wrap text-xs">
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition-all text-[11px]"
          >
            <span>💬</span> WhatsApp
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

      <div className="flex items-center gap-1.5">
        {payableAmount > 0 && (
          <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
            Payable: ৳{Number(payableAmount).toLocaleString()}
          </span>
        )}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge_color}`}>
          {reliability_label}
        </span>
      </div>
    </div>
  );
}
