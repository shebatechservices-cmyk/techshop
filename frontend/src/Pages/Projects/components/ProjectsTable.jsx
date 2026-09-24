import React from 'react';

export default function ProjectsTable({
  projects = [],
  loading = false,
  onTechPrompt,
  onInchargeConfirm,
  onAddProgress,
  onComplete,
  onPrint,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-xs">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3" />
        <p className="text-slate-500 font-medium text-xs">প্রজেক্ট ডাটা লোড হচ্ছে...</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-xs">
        <div className="text-4xl mb-2">📋</div>
        <p className="font-bold text-slate-700 text-sm mb-1">কোনো প্রজেক্ট বা সার্ভিস পাওয়া যায়নি।</p>
        <small className="text-slate-400 text-xs">উপরের "+ নতুন প্রজেক্ট / সার্ভিস" বাটনে ক্লিক করে কাজ তৈরি করুন।</small>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3.5">প্রজেক্ট ও সোর্স</th>
              <th className="py-3 px-3.5">কাস্টমার ও সাইট</th>
              <th className="py-3 px-3.5">অ্যাসাইনড টেকনিশিয়ান</th>
              <th className="py-3 px-3.5">পারিশ্রমিক ব্রেকডাউন</th>
              <th className="py-3 px-3.5">কাস্টমার বিল</th>
              <th className="py-3 px-3.5">স্ট্যাটাস পাইপলাইন</th>
              <th className="py-3 px-3.5 text-right">একশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((p) => {
              const setup = parseFloat(p.setup_charge || 0);
              const conv = parseFloat(p.conveyance_cost || 0);
              const meal = parseFloat(p.meal_allowance || 0);
              const totalTechPayout =
                setup + conv + meal > 0
                  ? setup + conv + meal
                  : parseFloat(p.charges || 0);
              const customerBill = parseFloat(p.customer_billing_amount || 0);

              const isAssigned =
                p.technician_status === 'assigned' || p.status === 'assigned';
              const isAccepted =
                p.technician_status === 'accepted' ||
                p.status === 'awaiting_incharge_confirmation';
              const isInProgress =
                p.technician_status === 'in_progress' ||
                p.status === 'in_progress';
              const isCompleted = p.status === 'completed';

              return (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors bg-white">
                  {/* Project & Source */}
                  <td className="py-3.5 px-3.5 align-top">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                          p.invoice_id
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.invoice_id ? '📦 নতুন সেটাপ' : '🔧 পুরাতন রিপেয়ার'}
                      </span>
                      <strong className="text-slate-900 font-extrabold">{p.project_code}</strong>
                    </div>
                    <div className="font-semibold text-slate-800 text-xs">{p.title}</div>
                    {p.invoice_no && (
                      <div className="text-[11px] text-blue-600 mt-0.5">
                        ইনভয়েস: <strong>{p.invoice_no}</strong>
                      </div>
                    )}
                    {p.equipment_details &&
                      Array.isArray(p.equipment_details) &&
                      p.equipment_details.length > 0 && (
                        <div className="text-[11px] text-slate-500 mt-1 max-w-xs">
                          ডিভাইস:{' '}
                          {p.equipment_details
                            .map((it) => `${it.product_name} (${it.quantity})`)
                            .join(', ')}
                        </div>
                      )}
                  </td>

                  {/* Customer & Site */}
                  <td className="py-3.5 px-3.5 align-top">
                    <strong className="text-slate-900 font-bold block">{p.customer_name}</strong>
                    {p.site_phone && (
                      <div className="mt-0.5">
                        <a
                          href={`tel:${p.site_phone}`}
                          className="text-emerald-700 font-semibold text-xs inline-flex items-center gap-1 hover:underline"
                        >
                          📞 {p.site_phone}
                        </a>
                      </div>
                    )}
                    {p.site_address && (
                      <div className="text-[11px] text-slate-500 mt-0.5 max-w-[200px] leading-tight">
                        📍 {p.site_address}
                      </div>
                    )}
                  </td>

                  {/* Technician */}
                  <td className="py-3.5 px-3.5 align-top">
                    <div className="flex items-center gap-1.5">
                      <span>👷</span>
                      <strong className="text-slate-800 font-bold">{p.technician_name}</strong>
                    </div>
                    {p.technician_contact && (
                      <small className="text-slate-500 text-[11px] block mt-0.5">
                        {p.technician_contact}
                      </small>
                    )}
                    {p.admin_confirmed && (
                      <div className="text-[11px] text-emerald-600 mt-1 font-bold">
                        ✓ ইনচার্জ অনুমোদিত
                      </div>
                    )}
                  </td>

                  {/* Remuneration Breakdown */}
                  <td className="py-3.5 px-3.5 align-top">
                    <div className="font-extrabold text-blue-600 text-sm">
                      ৳ {totalTechPayout.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex flex-col gap-0.5">
                      <span>সেটাপ ফি: ৳{setup}</span>
                      <span>যাতায়াত: ৳{conv}</span>
                      <span>মিল ভাতা: ৳{meal}</span>
                    </div>
                  </td>

                  {/* Customer Bill */}
                  <td className="py-3.5 px-3.5 align-top">
                    <strong className="text-emerald-700 font-extrabold text-sm block">
                      ৳ {customerBill.toLocaleString('en-IN')}
                    </strong>
                    <div className="text-[11px] text-slate-400">ধার্যকৃত সার্ভিস বিল</div>
                  </td>

                  {/* Pipeline Status */}
                  <td className="py-3.5 px-3.5 align-top">
                    {isCompleted ? (
                      <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md text-[11px] font-extrabold inline-flex items-center gap-1">
                        ✓ সম্পন্ন ও পেইড
                      </span>
                    ) : isInProgress ? (
                      <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md text-[11px] font-extrabold inline-flex items-center gap-1">
                        ⏳ কাজ চলমান
                      </span>
                    ) : isAccepted ? (
                      <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md text-[11px] font-extrabold inline-flex items-center gap-1">
                        🔵 টেক একসেপ্ট করেছে
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-extrabold inline-flex items-center gap-1">
                        🟡 একসেপ্টের অপেক্ষায়
                      </span>
                    )}

                    {p.progress_note && (
                      <div className="text-[11px] text-slate-500 mt-1.5 max-w-[220px] whitespace-pre-line bg-slate-50 p-1.5 rounded border border-slate-100">
                        {p.progress_note.slice(-80)}...
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3.5 align-top text-right">
                    <div className="flex flex-col gap-1.5 items-end">
                      {/* 1. If assigned: Technician Accept Prompt */}
                      {isAssigned && (
                        <button
                          type="button"
                          onClick={() => onTechPrompt(p)}
                          className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 rounded-md text-[11px] font-bold cursor-pointer whitespace-nowrap transition-colors"
                        >
                          📲 টেক একসেপ্ট প্রম্পট
                        </button>
                      )}

                      {/* 2. If accepted: In-charge Confirm Handover */}
                      {isAccepted && (
                        <button
                          type="button"
                          onClick={() => onInchargeConfirm(p)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-bold cursor-pointer whitespace-nowrap shadow-xs transition-colors"
                        >
                          🛡️ ইনচার্জ কনফার্মেশন
                        </button>
                      )}

                      {/* 3. If in progress: Add Note & Complete */}
                      {isInProgress && (
                        <>
                          <button
                            type="button"
                            onClick={() => onAddProgress(p)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md text-[11px] font-semibold cursor-pointer transition-colors"
                          >
                            📝 নোট যোগ করুন
                          </button>

                          <button
                            type="button"
                            onClick={() => onComplete(p)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold cursor-pointer whitespace-nowrap shadow-xs transition-colors"
                          >
                            🏁 সম্পন্ন ও ওয়ালেট পে
                          </button>
                        </>
                      )}

                      {/* Print Job Card */}
                      <button
                        type="button"
                        onClick={() => onPrint(p)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-md text-[11px] font-semibold cursor-pointer flex items-center gap-1 whitespace-nowrap transition-colors"
                        title="জব কার্ড ও সার্ভিস স্লিপ প্রিন্ট করুন"
                      >
                        <span>🖨️</span>
                        <span>প্রিন্ট জব কার্ড</span>
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onDelete(p.id)}
                        className="text-slate-400 hover:text-rose-600 text-[11px] font-medium cursor-pointer p-0.5 transition-colors"
                        title="মুছে ফেলুন"
                      >
                        🗑️ ডিলিট
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
