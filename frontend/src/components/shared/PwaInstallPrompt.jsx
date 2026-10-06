import React, { useState } from 'react';
import usePwaInstall from '../../hooks/usePwaInstall';

export default function PwaInstallPrompt() {
  const { canInstall, isInstalled, isDismissed, installApp, dismissPrompt } = usePwaInstall();
  const [showManualModal, setShowManualModal] = useState(false);

  // If already installed or dismissed, do not render floating banner
  if (isInstalled || isDismissed) {
    return null;
  }

  // If canInstall is true, show direct one-click install banner
  // If canInstall is false (e.g. iOS Safari or before beforeinstallprompt fired), we don't force annoying popups, but if user opened it they can view guide
  if (!canInstall && !showManualModal) {
    return null;
  }

  return (
    <>
      {canInstall && (
        <div className="fixed bottom-16 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-slate-900/95 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-sky-500/30 flex items-center justify-between gap-3 animate-bounce-once">
          <div className="flex items-center gap-3">
            <img
              src="/pwa-192x192.png"
              alt="Sheba POS"
              className="w-10 h-10 rounded-xl shadow border border-white/20 flex-shrink-0"
            />
            <div className="text-xs">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>Sheba POS App</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/30 text-sky-300 font-semibold uppercase">
                  PWA
                </span>
              </div>
              <div className="text-slate-300 text-[11px] leading-tight mt-0.5">
                Install as Android app for fast & full-screen POS
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={installApp}
              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-md transition-all whitespace-nowrap"
            >
              Install
            </button>
            <button
              type="button"
              onClick={dismissPrompt}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Close"
              aria-label="Close install prompt"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Manual installation guide modal (if needed) */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <span>📲</span> How to Install Sheba App
              </h3>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 text-xs text-gray-600 space-y-3">
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-sky-900">
                <span className="font-bold">Android (Google Chrome):</span>
                <ol className="list-decimal list-inside mt-1 space-y-1 text-sky-800">
                  <li>Tap the 3 dots <b>(⋮)</b> menu at top right.</li>
                  <li>Select <b>"Install app"</b> or <b>"Add to Home screen"</b>.</li>
                  <li>Click <b>Install</b> to download as standalone app.</li>
                </ol>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800">
                <span className="font-bold">iPhone / iPad (Safari):</span>
                <ol className="list-decimal list-inside mt-1 space-y-1 text-gray-700">
                  <li>Tap the <b>Share</b> button (square with arrow up).</li>
                  <li>Scroll down and tap <b>"Add to Home Screen"</b>.</li>
                </ol>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowManualModal(false)}
              className="mt-5 w-full py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
