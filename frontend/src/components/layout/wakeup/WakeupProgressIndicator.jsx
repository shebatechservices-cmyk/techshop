import React from 'react';

const STEPS = [
  { id: 0, minSec: 0, title: 'ক্লাউড সিগন্যাল পাঠানো হচ্ছে...', desc: 'Contacting Render Cloud Host' },
  { id: 1, minSec: 8, title: 'ব্যাকএন্ড কন্টেইনার জাগ্রত হচ্ছে...', desc: 'Spinning up container & Node engine' },
  { id: 2, minSec: 25, title: 'ডাটাবেজ ও সিকিউরিটি গেট কানেক্ট হচ্ছে...', desc: 'Connecting PostgreSQL & POS APIs' },
  { id: 3, minSec: 40, title: 'সার্ভার সক্রিয়! লোড হচ্ছে...', desc: 'Cloud warm-up complete' },
];

export default function WakeupProgressIndicator({ elapsedSeconds, progress, status }) {
  const isReady = status === 'ready';

  // Determine current active step based on elapsed time or ready status
  let activeStepIdx = 0;
  if (isReady) {
    activeStepIdx = 3;
  } else {
    for (let i = STEPS.length - 1; i >= 0; i--) {
      if (elapsedSeconds >= STEPS[i].minSec) {
        activeStepIdx = i;
        break;
      }
    }
  }

  return (
    <div className="w-full space-y-5">
      {/* Progress Bar & Percentage */}
      <div>
        <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isReady ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isReady ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </span>
            <span>{isReady ? 'সার্ভার সফলভাবে প্রস্তুত' : 'সার্ভার ওয়েক-আপ স্ট্যাটাস'}</span>
          </span>
          <span className="font-mono text-emerald-400 text-sm font-bold">
            {isReady ? '100%' : `${progress}%`}
          </span>
        </div>

        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isReady
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
            }`}
            style={{ width: `${isReady ? 100 : progress}%` }}
          />
        </div>
      </div>

      {/* Live Seconds Counter Badge */}
      <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>
            সময় অতিবাহিত: <strong className="text-white font-mono text-sm">{elapsedSeconds}</strong> সে.
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          স্বাভাবিক সময়: ৩০-৫০ সেকেন্ড
        </span>
      </div>

      {/* Step Checklist */}
      <div className="space-y-2 pt-1">
        {STEPS.map((step, idx) => {
          const isDone = isReady || activeStepIdx > idx;
          const isCurrent = !isReady && activeStepIdx === idx;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-300 ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
                  : isCurrent
                  ? 'bg-slate-900/90 border-amber-500/40 text-white shadow-sm'
                  : 'bg-slate-950/30 border-slate-900 text-slate-500 opacity-60'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  isDone
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-amber-500 text-slate-950 animate-pulse'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isDone ? '✓' : idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold leading-tight truncate m-0 ${isCurrent ? 'text-amber-300' : ''}`}>
                  {step.title}
                </p>
                <p className="text-[10px] text-slate-400 font-mono leading-tight truncate m-0 mt-0.5">
                  {step.desc}
                </p>
              </div>

              {isCurrent && (
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping mr-1" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
