import React from 'react';

export default function LedgerPagination({
  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  startIndex = 0,
  endIndex = 0,
  onPageChange = () => {},
}) {
  if (totalPages <= 1) {
    if (totalRecords === 0) return null;
    return (
      <div className="py-2.5 px-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
        <span>Showing all <strong>{totalRecords}</strong> ledger entries</span>
      </div>
    );
  }

  // Calculate visible page numbers window (up to 5 pages)
  let startPage = Math.max(1, currentPage - 2);
  if (startPage + 4 > totalPages) {
    startPage = Math.max(1, totalPages - 4);
  }
  const pagesToShow = Array.from({ length: Math.min(5, totalPages) }, (_, i) => startPage + i).filter(
    (p) => p <= totalPages
  );

  return (
    <div className="py-2.5 px-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center flex-wrap gap-2 text-xs">
      <span className="text-slate-500 text-xs">
        Showing <strong className="text-slate-900">{startIndex + 1}</strong> to{' '}
        <strong className="text-slate-900">{endIndex}</strong> of{' '}
        <strong className="text-slate-900">{totalRecords}</strong> ledger entries (Page{' '}
        <strong className="text-slate-900">{currentPage}</strong> of{' '}
        <strong className="text-slate-900">{totalPages}</strong>)
      </span>

      <div className="flex gap-1 items-center">
        {/* Previous Button */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className={`py-1 px-2.5 bg-white border rounded text-xs font-semibold transition-colors ${
            currentPage <= 1
              ? 'border-slate-200 text-slate-300 cursor-not-allowed'
              : 'border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer'
          }`}
          aria-label="Previous Page"
        >
          « Prev
        </button>

        {/* Page Number Buttons */}
        {pagesToShow.map((pg) => (
          <button
            key={pg}
            type="button"
            onClick={() => onPageChange(pg)}
            className={`py-1 px-2.5 rounded text-xs font-bold cursor-pointer transition-colors ${
              pg === currentPage
                ? 'bg-sky-600 text-white shadow-xs border border-sky-600'
                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            {pg}
          </button>
        ))}

        {/* Next Button */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className={`py-1 px-2.5 bg-white border rounded text-xs font-semibold transition-colors ${
            currentPage >= totalPages
              ? 'border-slate-200 text-slate-300 cursor-not-allowed'
              : 'border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer'
          }`}
          aria-label="Next Page"
        >
          Next »
        </button>
      </div>
    </div>
  );
}
