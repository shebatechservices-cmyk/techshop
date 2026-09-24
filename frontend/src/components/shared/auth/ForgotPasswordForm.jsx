import React from 'react';

export default function ForgotPasswordForm({
  recoveryId,
  setRecoveryId,
  recoveryRole,
  setRecoveryRole,
  recoveryLoading,
  recoverySuccess,
  recoveryError,
  handleRecovery,
  setMode,
}) {
  return (
    <form onSubmit={handleRecovery}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">
          পাসওয়ার্ড রিকভারি (Password Reset)
        </h3>
        <button
          type="button"
          onClick={() => setMode('login')}
          className="text-xs text-slate-500 hover:text-slate-700 font-medium"
        >
          ← ব্যাক
        </button>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed mb-3.5">
        আপনার রেজিস্টার্ড মোবাইল বা ইমেইল প্রদান করুন। অ্যাডমিন বা ডেভলপার প্যানেল থেকে আপনার পাসওয়ার্ড রিসেট করে দেওয়া হবে।
      </p>

      <div className="mb-3.5">
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          ইউজার ক্যাটাগরি
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRecoveryRole('staff')}
            className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
              recoveryRole === 'staff'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            স্টাফ / টেকনিশিয়ান
          </button>
          <button
            type="button"
            onClick={() => setRecoveryRole('admin')}
            className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
              recoveryRole === 'admin'
                ? 'border-sky-500 bg-sky-50 text-sky-700'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            শপ অ্যাডমিন
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          রেজিস্টার্ড মোবাইল অথবা ইমেইল *
        </label>
        <input
          type="text"
          value={recoveryId}
          onChange={(e) => setRecoveryId(e.target.value)}
          placeholder="017xxxxxxxx or your@email.com"
          required
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
        />
      </div>

      {recoveryError && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-3.5">
          {recoveryError}
        </div>
      )}

      {recoverySuccess && (
        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium mb-3.5">
          {recoverySuccess}
        </div>
      )}

      <button
        type="submit"
        disabled={recoveryLoading}
        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
      >
        {recoveryLoading ? 'অনুরোধ পাঠানো হচ্ছে...' : 'রিসেট অনুরোধ পাঠান'}
      </button>
    </form>
  );
}
