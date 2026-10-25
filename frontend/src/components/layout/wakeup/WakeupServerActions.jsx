import React, { useState } from 'react';
import { LOCAL_LAN_SERVER_URL, CLOUD_SERVER_URL } from '../../../services/apiConfig';

export default function WakeupServerActions({
  onRetry,
  onSkip,
  serverUrl,
  onChangeServer,
  status,
}) {
  const [showConfig, setShowConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(serverUrl || '');

  const isReady = status === 'ready';

  const handleApplyCustomUrl = (urlToSet) => {
    const clean = (urlToSet || customUrl).trim();
    if (clean) {
      onChangeServer(clean);
      setShowConfig(false);
      onRetry();
    }
  };

  return (
    <div className="w-full pt-4 border-t border-slate-800/80 space-y-3">
      {/* Primary Actions: Retry & Skip */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onRetry}
          disabled={isReady}
          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          পুনরায় পিং করুন
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs border border-slate-700/60 transition-all active:scale-95"
          title="সার্ভার ওয়েক-আপ স্ক্রিন বন্ধ করে অ্যাপে প্রবেশ করুন"
        >
          সরাসরি প্রবেশ করুন
        </button>

        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className={`p-2.5 rounded-xl border transition-all text-xs ${
            showConfig
              ? 'bg-slate-700 text-white border-slate-600'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
          }`}
          title="সার্ভার ঠিকানা বা লোকাল LAN কনফিগারেশন"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Expandable Server Config Panel */}
      {showConfig && (
        <div className="p-3 bg-slate-900/95 border border-slate-700/80 rounded-2xl space-y-2.5 animate-fadeIn">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            বিকল্প সার্ভার নির্বাচন
          </div>

          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => handleApplyCustomUrl(LOCAL_LAN_SERVER_URL)}
              className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium rounded-lg border border-slate-700 truncate"
            >
              🏢 শপ লোকাল LAN
            </button>
            <button
              type="button"
              onClick={() => handleApplyCustomUrl(CLOUD_SERVER_URL)}
              className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium rounded-lg border border-slate-700 truncate"
            >
              ☁️ রেন্ডার ক্লাউড
            </button>
          </div>

          <div className="flex gap-1.5">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="http://192.168.1.x:3000/api"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="button"
              onClick={() => handleApplyCustomUrl()}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg"
            >
              সংরক্ষণ
            </button>
          </div>
        </div>
      )}

      {/* Current Hostname Display */}
      <div className="text-center">
        <p className="text-[10px] text-slate-500 font-mono truncate m-0">
          সার্ভার হোস্ট: {serverUrl || 'sheba-technology.onrender.com'}
        </p>
      </div>
    </div>
  );
}
