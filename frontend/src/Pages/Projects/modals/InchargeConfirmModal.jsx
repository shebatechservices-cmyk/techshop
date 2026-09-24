import React from 'react';

export default function InchargeConfirmModal({
  project,
  onClose,
  inchargeNote,
  setInchargeNote,
  onConfirm,
}) {
  if (!project) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
        <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
          <span>🛡️</span>
          <span>সেটাপ ইনচার্জ চূড়ান্ত অনুমোদন (In-charge Handover Approval)</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          টেকনিশিয়ান কাজ গ্রহণ করেছেন। ইনচার্জ অনুমোদন দিলে টেকনিশিয়ান সাইটে গিয়ে কাজ শুরু করতে পারবে।
        </p>

        <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-100 mb-4 text-xs space-y-1">
          <div>
            <span className="text-slate-500">প্রজেক্ট:</span>{' '}
            <strong className="text-slate-900">{project.title}</strong> ({project.project_code})
          </div>
          <div>
            <span className="text-slate-500">টেকনিশিয়ান:</span>{' '}
            <strong className="text-slate-900">{project.technician_name}</strong>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            ইনচার্জ অনুমোদন নোট:
          </label>
          <input
            type="text"
            placeholder="যেমন: কাস্টমারকে ইনফর্ম করা হয়েছে, কাজ শুরু অনুমোদন দেওয়া হলো..."
            value={inchargeNote}
            onChange={(e) => setInchargeNote(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition-colors"
          >
            ✓ চূড়ান্ত অনুমোদন দিন (Confirm Handover)
          </button>
        </div>
      </div>
    </div>
  );
}
