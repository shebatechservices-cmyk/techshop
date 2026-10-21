import React from 'react';
import useMobileCameraScanner from './useMobileCameraScanner';

export default function MobileCameraScannerModal({ isOpen, onScan, onClose, title = 'বারকোড স্ক্যানার' }) {
  const {
    videoRef,
    cameraError,
    manualBarcode,
    setManualBarcode,
    hasTorch,
    isTorchOn,
    toggleTorch,
    handleManualSubmit,
  } = useMobileCameraScanner({ isOpen, onScan, onClose });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex flex-col justify-between p-4"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="flex items-center justify-between text-white py-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">📷</span>
          <span className="font-extrabold text-sm tracking-tight">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-2 rounded-full border border-white/20 transition-colors ${
                isTorchOn ? 'bg-amber-400 text-slate-900' : 'bg-white/10 text-white'
              }`}
              title="Flashlight"
            >
              🔦
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-sm hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Video Viewport & Scanning Reticle */}
      <div
        className="flex-1 flex flex-col items-center justify-center relative my-2 overflow-hidden rounded-3xl bg-black border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Reticle / Target Area */}
        <div className="relative z-10 w-64 h-48 border-2 border-dashed border-emerald-400 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.3)] pointer-events-none">
          <div className="w-full h-0.5 bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold text-emerald-300 mt-2 bg-black/60 px-2 py-0.5 rounded-full">
            বারকোড ফ্রেমের মাঝে রাখুন
          </span>
        </div>

        {cameraError && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-20">
            <span className="text-3xl mb-2">⚠️</span>
            <p className="text-xs text-rose-300 font-semibold mb-4">{cameraError}</p>
          </div>
        )}
      </div>

      {/* Manual Input Fallback */}
      <div
        className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="বারকোড বা SKU কোড লিখুন..."
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl bg-white/20 text-white placeholder-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 border border-white/20"
          />
          <button
            type="submit"
            disabled={!manualBarcode.trim()}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            সার্চ
          </button>
        </form>
      </div>
    </div>
  );
}
