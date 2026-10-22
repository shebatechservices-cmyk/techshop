import React, { useState } from 'react';

export default function CustomerSmartActions({ profile = {}, stats = {}, balance = 0 }) {
  const [copied, setCopied] = useState(false);

  const phone = String(profile.phone || '').trim();
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const bdPhone = cleanPhone.startsWith('880')
    ? cleanPhone
    : cleanPhone.startsWith('0')
    ? `88${cleanPhone}`
    : cleanPhone;

  const dueAmount = balance > 0 ? balance : 0;

  const waReminderMessage = `প্রিয় ${profile.name || 'গ্রাহক'}, সেবা টেকনোলজি থেকে আপনার বর্তমান বকেয়া বিল ৳ ${Number(dueAmount).toLocaleString('en-BD')}. অনুগ্রহ করে বকেয়া পরিশোধ করে সহযোগিতা করুন। ধন্যবাদ।`;

  const waUrl = bdPhone
    ? `https://wa.me/${bdPhone}?text=${encodeURIComponent(waReminderMessage)}`
    : null;

  const handleCopySummary = async () => {
    const text = `📋 গ্রাহক সামারি (Sheba Technology)
নাম: ${profile.name || 'N/A'}
ফোন: ${profile.phone || 'N/A'}
মোট ক্রয়: ৳ ${Number(stats.lifetime_purchases || 0).toLocaleString('en-BD')}
মোট পরিশোধ: ৳ ${Number(stats.lifetime_paid || 0).toLocaleString('en-BD')}
বর্তমান বকেয়া: ৳ ${Number(balance).toLocaleString('en-BD')}`;

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
        {/* WhatsApp Reminder */}
        {waUrl && dueAmount > 0 ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition-all text-[11px]"
          >
            <span>💬</span> WhatsApp Reminder
          </a>
        ) : waUrl ? (
          <a
            href={`https://wa.me/${bdPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold rounded-lg transition-all text-[11px]"
          >
            <span>💬</span> WhatsApp Chat
          </a>
        ) : null}

        {/* Copy Summary */}
        <button
          type="button"
          onClick={handleCopySummary}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-lg shadow-2xs transition-all text-[11px]"
        >
          <span>{copied ? '✅' : '📋'}</span>
          <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
        </button>

        {/* Quick Direct Call */}
        {phone && (
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 font-semibold rounded-lg transition-all text-[11px]"
          >
            <span>📞</span> Call
          </a>
        )}
      </div>

      {dueAmount > 0 && (
        <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
          Due: ৳{Number(dueAmount).toLocaleString()}
        </span>
      )}
    </div>
  );
}
