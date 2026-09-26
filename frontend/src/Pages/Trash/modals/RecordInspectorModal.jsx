import React from 'react';

export default function RecordInspectorModal({ previewItem, onClose, handleRestore }) {
  if (!previewItem) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black/40 backdrop-blur-xs flex items-center justify-center z-[9999999] p-4">
      <div className="bg-white text-gray-800 w-full max-w-[650px] max-h-[80vh] rounded-2xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-3.5 px-4.5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{previewItem.icon || '📦'}</span>
            <div>
              <h4 className="m-0 text-sm font-bold text-gray-800">
                Record Snapshot: {previewItem.title}
              </h4>
              <div className="text-xs text-gray-500 mt-0.5">
                Module: <strong className="text-gray-700">{previewItem.module_label || previewItem.module}</strong>{' '}
                (Table: <code className="bg-gray-100 text-gray-800 border border-gray-200 px-1.5 py-0.5 rounded font-mono text-[0.7rem]">{previewItem.table_name}</code>)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 rounded-md w-7 h-7 flex items-center justify-center cursor-pointer font-bold transition-colors text-xs"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
          <div className="bg-gray-900 rounded-lg p-3.5 border border-gray-800 font-mono text-xs text-emerald-400 max-h-[400px] overflow-y-auto shadow-inner">
            <pre className="m-0 whitespace-pre-wrap">
              {JSON.stringify(previewItem.raw_data || previewItem, null, 2)}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 px-4.5 bg-gray-50 border-t border-gray-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              handleRestore(previewItem);
              onClose();
            }}
            className="bg-green-600 hover:bg-green-700 text-white border-0 py-1.5 px-4 rounded-md text-xs font-semibold cursor-pointer transition-colors shadow-sm"
          >
            ↩ Restore Record Now
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 py-1.5 px-3.5 rounded-md text-xs font-medium cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
