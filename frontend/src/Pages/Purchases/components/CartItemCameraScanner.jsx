import React from 'react';

export const CameraIcon = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

export default function CartItemCameraScanner({ isOpen, onClose, displayName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">📷</span>
            <h3 className="font-extrabold text-base text-slate-900 m-0">Camera Barcode Scanner</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg border-0 bg-transparent cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        <div className="bg-slate-900 rounded-xl aspect-video flex flex-col items-center justify-center text-slate-400 relative overflow-hidden border border-slate-800">
          <div className="w-48 h-32 border-2 border-dashed border-emerald-400/80 rounded-lg flex items-center justify-center animate-pulse">
            <span className="text-xs text-emerald-300 font-semibold">Align Barcode within Frame</span>
          </div>
          <p className="text-[0.75rem] text-slate-400 mt-3 mb-0">Web / Mobile Camera Preview</p>
        </div>

        <div className="mt-4 flex justify-between items-center text-xs text-slate-500">
          <span>
            Product: <strong className="text-slate-700">{displayName}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer border-0 transition-colors"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
}
