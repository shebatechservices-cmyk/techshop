import React from 'react';

export default function RecordInspectorModal({ previewItem, onClose, handleRestore }) {
  if (!previewItem) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-[9999999] p-4">
      <div className="bg-slate-900 text-slate-100 w-full max-w-[650px] max-h-[80vh] rounded-2xl border border-sky-400 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-3.5 px-4.5 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">{previewItem.icon || '📦'}</span>
            <div>
              <h4 className="m-0 text-sm font-bold text-white">
                Record Snapshot: {previewItem.title}
              </h4>
              <div className="text-xs text-slate-400">
                Module: <strong className="text-slate-200">{previewItem.module_label || previewItem.module}</strong>{' '}
                (Table: <code className="text-sky-300 font-mono">{previewItem.table_name}</code>)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-white border-0 rounded-md w-7 h-7 flex items-center justify-center cursor-pointer font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-slate-950 rounded-lg p-3 border border-slate-700 font-mono text-xs text-emerald-400 max-h-[400px] overflow-y-auto">
            <pre className="m-0 whitespace-pre-wrap">
              {JSON.stringify(previewItem.raw_data || previewItem, null, 2)}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 px-4.5 bg-slate-800 border-t border-slate-700 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              handleRestore(previewItem);
              onClose();
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 py-1.5 px-4 rounded-md text-xs font-bold cursor-pointer transition-colors shadow-sm"
          >
            ↩ Restore Record Now
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 border-0 py-1.5 px-3.5 rounded-md text-xs cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
