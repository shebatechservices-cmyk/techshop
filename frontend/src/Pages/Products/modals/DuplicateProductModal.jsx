import React from "react";

export default function DuplicateProductModal({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-center border border-rose-200 animate-in fade-in zoom-in duration-150">
        <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-500 text-2xl flex items-center justify-center mx-auto mb-4">
          ⚠️
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 mb-2">
          Duplicate Product Catalog
        </h3>
        <p className="text-sm text-rose-700 font-bold leading-relaxed bg-rose-50 p-3.5 rounded-xl border border-rose-200 mb-5">
          {message}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          OK · Add a new product for catalog
        </button>
      </div>
    </div>
  );
}
