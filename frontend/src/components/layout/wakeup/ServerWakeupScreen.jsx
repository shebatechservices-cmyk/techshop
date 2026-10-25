import React from 'react';
import WakeupProgressIndicator from './WakeupProgressIndicator';
import WakeupServerActions from './WakeupServerActions';

export default function ServerWakeupScreen({
  elapsedSeconds,
  progress,
  status,
  serverUrl,
  onRetry,
  onSkip,
  onChangeServer,
}) {
  const isReady = status === 'ready';

  return (
    <div className="fixed inset-0 z-[999999] overflow-y-auto bg-slate-950 flex items-center justify-center p-3 sm:p-6 font-sans">
      {/* Ambient Glowing Background Orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-xl relative z-10 space-y-6 animate-fadeIn">
        {/* Top Header: Brand Icon & Titles */}
        <div className="text-center space-y-3">
          <div className="inline-flex relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-white/20 mx-auto">
              {isReady ? (
                <svg className="w-8 h-8 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )}
            </div>
            {!isReady && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
              </span>
            )}
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight m-0">
              {isReady ? 'সার্ভার সফলভাবে সক্রিয় হয়েছে!' : 'ক্লাউড সার্ভার চালু হচ্ছে...'}
            </h1>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mt-1 mb-0">
              Sheba Technology ERP &amp; Cloud POS
            </p>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto pt-1">
            {isReady ? (
              'সিস্টেম সম্পূর্ণ প্রস্তুত। সরাসরি অ্যাপে প্রবেশ করানো হচ্ছে...'
            ) : (
              'রেন্ডার ফ্রি ক্লাউড সার্ভার স্লিপ মোড থেকে জাগ্রত (Cold Start) হচ্ছে। ডাটাবেজ ও ব্যাকএন্ড প্রস্তুত হতে সাধারণত ৩০-৫০ সেকেন্ড সময় লাগে।'
            )}
          </p>
        </div>

        {/* Progress Section */}
        <WakeupProgressIndicator
          elapsedSeconds={elapsedSeconds}
          progress={progress}
          status={status}
        />

        {/* Action Controls */}
        <WakeupServerActions
          onRetry={onRetry}
          onSkip={onSkip}
          serverUrl={serverUrl}
          onChangeServer={onChangeServer}
          status={status}
        />

        {/* Helpful Pro-Tip Footer */}
        <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-3 flex items-start gap-2.5 text-[11px] text-emerald-200/90 leading-snug">
          <span className="text-sm">💡</span>
          <div>
            <strong className="text-emerald-300 font-semibold">প্রো-টিপ:</strong> বিনামূল্যে{' '}
            <span className="text-white font-mono underline">cron-job.org</span> বা{' '}
            <span className="text-white font-mono underline">UptimeRobot</span> দিয়ে প্রতি ১০ মিনিট পর পর{' '}
            <span className="text-emerald-300 font-mono">/api</span> তে পিং সেট করলে সার্ভার ২৪/৭ সচল থাকবে!
          </div>
        </div>
      </div>
    </div>
  );
}
