import React from 'react';

export default function NewSaleSaveBlockPopup({ popupMsg, setPopupMsg }) {
  if (!popupMsg) return null;

  return (
    <div
      className="fixed inset-0 z-[100001] bg-slate-900/55 backdrop-blur-[2px] flex items-center justify-center p-5"
      onClick={() => setPopupMsg('')}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-3xl mb-1.5">⚠️</div>
        <div className="font-extrabold text-base text-slate-900 mb-1.5">
          Unable to Save
        </div>
        <div className="text-sm text-slate-600 mb-4">{popupMsg}</div>
        <button
          type="button"
          onClick={() => setPopupMsg('')}
          className="py-2 px-6 rounded-lg border-0 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm cursor-pointer transition-colors"
        >
          OK, Got It
        </button>
      </div>
    </div>
  );
}
