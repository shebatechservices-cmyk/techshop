import React from 'react';

export default function ProductCatalogPagination({
  currentPage = 1,
  setCurrentPage,
  totalProductPages = 1,
}) {
  return (
    <div className="flex justify-between items-center p-3.5 bg-slate-50 border-t border-slate-200 text-xs">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage?.((p) => Math.max(1, p - 1))}
        className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
      >
        Previous
      </button>
      <span className="font-semibold text-slate-600">
        Page {currentPage} of {totalProductPages}
      </span>
      <button
        type="button"
        disabled={currentPage === totalProductPages}
        onClick={() => setCurrentPage?.((p) => Math.min(totalProductPages, p + 1))}
        className="px-3 py-1.5 bg-sky-600 border border-sky-600 rounded-lg text-white font-bold hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
      >
        Next
      </button>
    </div>
  );
}
