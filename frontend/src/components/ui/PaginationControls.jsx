import React from 'react';

export default function PaginationControls({
  currentPage = 1,
  totalPages = 1,
  pageSize = 20,
  totalItems = 0,
  onPageChange,
  itemName = 'items',
}) {
  if (totalItems <= 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate numeric page buttons with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1) {
        pages.push(p);
      }
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex justify-between items-center py-3.5 px-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex-wrap gap-3 select-none">
      <div className="text-xs text-slate-500">
        Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{' '}
        <strong>{totalItems}</strong> {itemName}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="py-1.5 px-3 rounded-md border border-slate-300 text-xs font-semibold transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          « Previous
        </button>

        {pageNumbers.map((page, idx, arr) => {
          const prevPage = arr[idx - 1];
          const showEllipsis = prevPage && page - prevPage > 1;

          return (
            <React.Fragment key={`page-${page}`}>
              {showEllipsis && <span className="px-1 text-slate-400 text-xs">...</span>}
              <button
                type="button"
                onClick={() => onPageChange(page)}
                className={`py-1 px-2.5 rounded-md text-xs cursor-pointer min-w-[32px] font-semibold transition-colors ${
                  page === currentPage
                    ? 'border-0 bg-sky-600 text-white shadow-sm'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {page}
              </button>
            </React.Fragment>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="py-1.5 px-3 rounded-md border border-slate-300 text-xs font-semibold transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          Next »
        </button>
      </div>
    </div>
  );
}
