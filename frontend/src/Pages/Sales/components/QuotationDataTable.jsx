import React from 'react';

/**
 * Helper to generate Tailwind CSS classes for quotation status badges
 */
const getQuotationStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'accepted':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'sent':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'rejected':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'expired':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'draft':
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200';
  }
};

export default function QuotationDataTable({
  loading = false,
  filteredQuotations = [],
  quotationsCount = 0,
  quotationSearchQuery = '',
  quotationStatusFilter = 'ALL',
  setQuotationSearchQuery = () => {},
  setQuotationStatusFilter = () => {},
  setIsQuotationModalOpen = () => {},
  setEditingQuotation = () => {},
  setNewlyCreatedCustomer = () => {},
  handleUpdateQuotationStatus = () => {},
  handleOpenPrintQuotation = () => {},
  handleEditQuotation = () => {},
  handleDeleteQuotation = () => {},
  taka = (val) => val
}) {
  return (
    <div className="overflow-x-auto">
      {loading ? (
        <p className="text-center py-10 text-slate-500 text-sm">Loading quotation records...</p>
      ) : filteredQuotations.length === 0 ? (
        quotationSearchQuery || quotationStatusFilter !== 'ALL' ? (
          <div className="text-center py-12 px-5 text-slate-500">
            <p className="text-base font-semibold text-slate-700 mb-2">
              No quotations match your search "{quotationSearchQuery || quotationStatusFilter}"
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Try searching with another quotation number, client name, or phone number.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuotationSearchQuery('');
                setQuotationStatusFilter('ALL');
              }}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer transition-colors"
            >
              Clear Search & Filter
            </button>
          </div>
        ) : (
          <div className="text-center py-12 px-5 text-slate-400">
            <p className="text-lg font-semibold text-slate-700 mb-2">No quotation records found</p>
            <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
              Generate professional price estimates and quotation proposals for clients.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingQuotation(null);
                setNewlyCreatedCustomer(null);
                setIsQuotationModalOpen(true);
              }}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer transition-colors border-0"
            >
              + Create First Quotation
            </button>
          </div>
        )
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
              <th className="px-3.5 py-3 font-semibold">Quotation No</th>
              <th className="px-3.5 py-3 font-semibold">Client / Customer</th>
              <th className="px-3.5 py-3 font-semibold">Status</th>
              <th className="px-3.5 py-3 font-semibold">Total Amount</th>
              <th className="px-3.5 py-3 font-semibold">Valid Until</th>
              <th className="px-3.5 py-3 font-semibold">Created Date</th>
              <th className="px-3.5 py-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotations.map((quote) => {
              const badgeClass = getQuotationStatusBadgeClass(quote.status);
              return (
                <tr
                  key={quote.id}
                  className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                >
                  <td className="px-3.5 py-3 font-bold text-indigo-600">
                    <button
                      type="button"
                      onClick={() => handleOpenPrintQuotation(quote.id)}
                      title="Click to view & print quotation"
                      className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer text-left bg-transparent border-0 p-0 underline underline-offset-2 transition-colors"
                    >
                      {quote.quotation_no || `QTN-${quote.id}`}
                    </button>
                  </td>
                  <td className="px-3.5 py-3">
                    <div className="font-semibold text-slate-800">{quote.customer_name || 'Client'}</div>
                    {quote.customer_phone && (
                      <div className="text-xs text-slate-500">{quote.customer_phone}</div>
                    )}
                  </td>
                  <td className="px-3.5 py-3">
                    <select
                      value={quote.status || 'sent'}
                      onChange={(e) => handleUpdateQuotationStatus(quote.id, e.target.value)}
                      className={`px-2 py-1 rounded-md text-xs font-bold uppercase cursor-pointer outline-none border transition-colors ${badgeClass}`}
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                      <option value="expired">Expired</option>
                    </select>
                  </td>
                  <td className="px-3.5 py-3 font-bold text-slate-900">
                    {taka(quote.total_amount)}
                  </td>
                  <td className="px-3.5 py-3 text-slate-500 text-xs">
                    {quote.valid_until
                      ? new Date(quote.valid_until).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '7 Days'}
                  </td>
                  <td className="px-3.5 py-3 text-slate-500 text-xs">
                    {quote.created_at
                      ? new Date(quote.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '-'}
                  </td>
                  <td className="px-3.5 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenPrintQuotation(quote.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                        title="Print / View Quotation"
                      >
                        <span>🖨️</span> Print
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditQuotation(quote.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                        title="Edit quotation"
                      >
                        <span>✏️</span> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuotation(quote.id)}
                        className="inline-flex items-center justify-center p-1.5 rounded-md text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                        title="Delete quotation"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
