import React from 'react';

export default function InventoryPagination({
  currentPageSafe,
  totalPages,
  itemsPerPage,
  filteredProductsCount,
  setCurrentPage,
}) {
  return (
    <div className="flex justify-between items-center py-3 px-5 bg-slate-50 border-t border-slate-200 flex-wrap gap-3">
      <div className="text-xs text-slate-500">
        Showing{' '}
        <strong>
          {filteredProductsCount === 0 ? 0 : (currentPageSafe - 1) * itemsPerPage + 1}
        </strong>{' '}
        to{' '}
        <strong>
          {Math.min(currentPageSafe * itemsPerPage, filteredProductsCount)}
        </strong>{' '}
        of <strong>{filteredProductsCount}</strong> products
      </div>

      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPageSafe <= 1}
          className="py-1.5 px-3 rounded-md border border-slate-300 text-xs font-semibold transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          « Previous
        </button>

        {/* Numeric Page Buttons */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((page) => {
            if (totalPages <= 7) return true;
            return (
              page === 1 ||
              page === totalPages ||
              Math.abs(page - currentPageSafe) <= 1
            );
          })
          .map((page, idx, arr) => {
            const prevPage = arr[idx - 1];
            const showEllipsis = prevPage && page - prevPage > 1;

            return (
              <React.Fragment key={`page-${page}`}>
                {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                <button
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`py-1.5 px-3 rounded-md text-xs cursor-pointer min-w-[32px] transition-colors ${
                    page === currentPageSafe
                      ? 'border-0 bg-sky-600 text-white font-bold'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  {page}
                </button>
              </React.Fragment>
            );
          })}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPageSafe >= totalPages}
          className="py-1.5 px-3 rounded-md border border-slate-300 text-xs font-semibold transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          Next »
        </button>
      </div>
    </div>
  );
}
