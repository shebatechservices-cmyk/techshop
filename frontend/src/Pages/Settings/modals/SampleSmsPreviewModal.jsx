import React from 'react';

export default function SampleSmsPreviewModal({
  samplePreviewModal,
  setSamplePreviewModal,
  copyText,
}) {
  if (!samplePreviewModal?.open) return null;

  const handleClose = () => {
    setSamplePreviewModal({ open: false, title: '', text: '' });
  };

  const textLength = samplePreviewModal.text ? samplePreviewModal.text.length : 0;
  const smsParts = Math.ceil(textLength / 160) || 1;

  return (
    <div
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4 text-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>👁️</span> Sample SMS Preview
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {samplePreviewModal.title || 'Live message template render'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition flex items-center justify-center text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 leading-relaxed mb-3 whitespace-pre-wrap font-sans">
            {samplePreviewModal.text}
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
            <span>
              Total Chars: <strong className="text-slate-900">{textLength}</strong>
            </span>
            <span>
              Billing: <strong className="text-blue-600">{smsParts} SMS Parts</strong>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => copyText && copyText(samplePreviewModal.text, 'Message text copied to clipboard!')}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            📋 Copy Message
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
