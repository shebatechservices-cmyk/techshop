import React from 'react';

export default function PartyPagination({
  partyPage = 1,
  setPartyPage = () => {},
  partyPagination = { total: 0, page: 1, limit: 20, totalPages: 1 }
}) {
  if (partyPagination.totalPages <= 1) return null;

  return (
    <div className="py-2 px-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center flex-wrap gap-2 text-xs">
      <span className="text-slate-500 text-xs">
        Showing page <strong className="text-slate-900">{partyPage}</strong> of{' '}
        <strong className="text-slate-900">{partyPagination.totalPages}</strong> (
        {partyPagination.total} total parties)
      </span>

      <div className="flex gap-1 items-center">
        <button
          type="button"
          disabled={partyPage <= 1}
          onClick={() => setPartyPage((prev) => Math.max(1, prev - 1))}
          className={`py-1 px-2.5 bg-white border rounded text-xs font-semibold transition-colors ${
            partyPage <= 1
              ? 'border-slate-200 text-slate-300 cursor-not-allowed'
              : 'border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer'
          }`}
        >
          « Prev
        </button>

        {Array.from({ length: Math.min(5, partyPagination.totalPages) }, (_, i) => {
          let startPage = Math.max(1, partyPage - 2);
          if (startPage + 4 > partyPagination.totalPages) {
            startPage = Math.max(1, partyPagination.totalPages - 4);
          }
          const pg = startPage + i;
          if (pg > partyPagination.totalPages) return null;
          return (
            <button
              key={pg}
              type="button"
              onClick={() => setPartyPage(pg)}
              className={`py-1 px-2.5 rounded text-xs font-bold cursor-pointer transition-colors ${
                pg === partyPage
                  ? 'bg-sky-600 text-white shadow-xs border border-sky-600'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              {pg}
            </button>
          );
        })}

        <button
          type="button"
          disabled={partyPage >= partyPagination.totalPages}
          onClick={() =>
            setPartyPage((prev) => Math.min(partyPagination.totalPages, prev + 1))
          }
          className={`py-1 px-2.5 bg-white border rounded text-xs font-semibold transition-colors ${
            partyPage >= partyPagination.totalPages
              ? 'border-slate-200 text-slate-300 cursor-not-allowed'
              : 'border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer'
          }`}
        >
          Next »
        </button>
      </div>
    </div>
  );
}
