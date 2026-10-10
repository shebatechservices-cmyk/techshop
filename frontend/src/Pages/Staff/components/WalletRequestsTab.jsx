import React from 'react';

export default function WalletRequestsTab({
  requests = [],
  loading = false,
  onOpenRequestModal = () => {},
  fetchRequests = () => {},
}) {
  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <span>📨</span>
            <span>টাকা উইথড্র ও ডিপোজিট রিকোয়েস্ট হিস্ট্রি</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100">
              {requests.length} টি
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            টাকা উত্তোলন (Withdraw) বা ক্যাশ ডিপোজিট দিলে রেফারেন্স/TrxID সহ রিকোয়েস্ট পাঠান, অ্যাডমিন ভেরিফাই করে ওয়ালেটে যুক্ত করবেন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchRequests}
            disabled={loading}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            <span>রিফ্রেশ</span>
          </button>
          <button
            type="button"
            onClick={onOpenRequestModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>+ নতুন রিকোয়েস্ট পাঠান</span>
          </button>
        </div>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">
            📬
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1">
            এখনও কোনো রিকোয়েস্ট করা হয়নি
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            টাকা উইথড্র করার প্রয়োজন হলে বা কোনো নগদ টাকা শপ অ্যাকাউন্টে ডিপোজিট দিলে TrxID বা রেফারেন্স দিয়ে রিকোয়েস্ট সাবমিট করুন।
          </p>
          <button
            type="button"
            onClick={onOpenRequestModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md transition cursor-pointer"
          >
            + প্রথম রিকোয়েস্ট দিন
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const isWithdraw = req.type === 'withdraw';
            const isPending = req.status === 'pending';
            const isApproved = req.status === 'approved';
            const isRejected = req.status === 'rejected';

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                        isWithdraw ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {isWithdraw ? '💸' : '📥'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {isWithdraw ? 'উইথড্র রিকোয়েস্ট (Withdraw)' : 'ডিপোজিট রিকোয়েস্ট (Deposit)'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            isPending
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : isApproved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isPending && '🟡 অপেক্ষমাণ (Pending)'}
                          {isApproved && '🟢 অনুমোদিত (Approved)'}
                          {isRejected && '🔴 বাতিল (Rejected)'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        তারিখ: {new Date(req.created_at).toLocaleDateString()} {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • রিকোয়েস্ট আইডি: #{req.id}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-lg font-black ${
                        isWithdraw ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {isWithdraw ? '-' : '+'} ৳ {Number(req.amount || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500">
                      মাধ্যম: <strong className="text-slate-800">{req.channel || 'Cash'}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">
                      ট্রান্সফার / TrxID / রেফারেন্স
                    </span>
                    <strong className="text-slate-800 font-mono text-[11px]">
                      {req.reference_id || 'N/A'}
                    </strong>
                    {req.notes && (
                      <p className="text-slate-600 mt-1 italic text-[11px] bg-slate-50 p-2 rounded-lg">
                        "{req.notes}"
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">
                      শপ অ্যাডমিন প্রতিক্রিয়া ও স্ট্যাটাস
                    </span>
                    {isPending ? (
                      <p className="text-amber-700 text-[11px] mt-1 font-semibold flex items-center gap-1">
                        <span>⏳</span>
                        <span>শপ অ্যাডমিন যাচাই করছেন। অনুমোদন হলে ওয়ালেটে পোস্টিং হবে।</span>
                      </p>
                    ) : (
                      <div className="mt-1 bg-slate-50 p-2 rounded-lg">
                        <div className="text-slate-700 font-bold text-[11px]">
                          {req.admin_name || 'Admin'} {isApproved ? 'অনুমোদন করেছেন' : 'বাতিল করেছেন'}
                        </div>
                        {req.admin_notes && (
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            রিমার্কস: "{req.admin_notes}"
                          </div>
                        )}
                        {req.processed_at && (
                          <div className="text-slate-400 text-[10px] mt-0.5">
                            প্রসেস সময়: {new Date(req.processed_at).toLocaleDateString()} {new Date(req.processed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
