import React from 'react';

export default function StorefrontHeroBanner({ setActiveView }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
      <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-12 top-6 opacity-10 text-8xl pointer-events-none hidden md:block">
        📹
      </div>

      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-3">
          <span>✨</span>
          <span>Official Store &amp; Genuine Products</span>
        </div>

        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-snug mb-2 text-white">
          অরিজিনাল সিসিটিভি ক্যামেরা, রাউটার ও সিকিউরিটি সল্যুশন
        </h1>

        <p className="text-slate-300 text-xs sm:text-sm mb-5 leading-relaxed">
          সেরা পাইকারি ও খুচরা মূল্যে Dahua, Hikvision, TP-Link ও অন্যান্য ব্র্যান্ডের অফিসিয়াল পণ্য কিনুন। ৬৪ জেলায় ক্যাশ অন ডেলিভারি সুবিধা।
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('store-product-catalog');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2.5 rounded-xl bg-brand text-white font-bold text-xs sm:text-sm hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span>🛍️ পণ্যসমূহ দেখুন</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView && setActiveView('track')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>📦 পার্সেল ট্র্যাক করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
}
