import React, { useState, useEffect } from 'react';
import CustomerTableRow from './customer/CustomerTableRow';
import PaginationControls from '../../../components/ui/PaginationControls';

const PAGE_SIZE = 20;
const money = (val) => Number.parseFloat(val || 0) || 0;
const defaultTaka = (val) =>
  `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CustomerDataTable({
  loading = false,
  filteredCustomers = [],
  customerSearchQuery = '',
  customerTypeFilter = 'ALL',
  setCustomerSearchQuery = () => {},
  setCustomerTypeFilter = () => {},
  setIsCustomerModalOpen = () => {},
  setProfileModalPartyId = () => {},
  setProfileModalTab = () => {},
  onStartSale = null,
  onStartQuote = null,
  handleDeleteCustomer = () => {},
  taka = defaultTaka,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever search query or customer group filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [customerSearchQuery, customerTypeFilter]);

  const totalPages = Math.ceil(filteredCustomers.length / PAGE_SIZE) || 1;
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
  const paginatedCustomers = filteredCustomers.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  return (
    <div>
      <div className="overflow-x-auto">
        {loading ? (
          <p className="text-center py-10 text-slate-500 text-sm">Loading client list...</p>
        ) : filteredCustomers.length === 0 ? (
          customerSearchQuery || customerTypeFilter !== 'ALL' ? (
            <div className="text-center py-12 px-5 text-slate-500">
              <p className="text-base font-semibold text-slate-700 mb-2">
                No clients match your search "{customerSearchQuery || customerTypeFilter}"
              </p>
              <p className="text-sm text-slate-500 mb-4">
                Try searching with another name, phone number, email, or address.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCustomerSearchQuery('');
                  setCustomerTypeFilter('ALL');
                }}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer transition-colors"
              >
                Clear Search & Filter
              </button>
            </div>
          ) : (
            <div className="text-center py-12 px-5 text-slate-400">
              <p className="text-lg font-semibold text-slate-700 mb-2">No clients found</p>
              <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
                Add your retail, wholesale, or corporate clients to track their sales and loyalty points.
              </p>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm cursor-pointer transition-colors border-0"
              >
                + Add First Client
              </button>
            </div>
          )
        ) : (
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                <th className="px-3.5 py-3 font-semibold">Client Name</th>
                <th className="px-3.5 py-3 font-semibold">Type</th>
                <th className="px-3.5 py-3 font-semibold">Contact Info</th>
                <th className="px-3.5 py-3 font-semibold">Address</th>
                <th className="px-3.5 py-3 font-semibold">Loyalty Points</th>
                <th className="px-3.5 py-3 font-semibold">Receivable Due</th>
                <th className="px-3.5 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((cust) => (
                <CustomerTableRow
                  key={cust.id}
                  cust={cust}
                  setProfileModalPartyId={setProfileModalPartyId}
                  setProfileModalTab={setProfileModalTab}
                  onStartSale={onStartSale}
                  onStartQuote={onStartQuote}
                  handleDeleteCustomer={handleDeleteCustomer}
                  taka={taka}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && filteredCustomers.length > 0 && (
        <PaginationControls
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          totalItems={filteredCustomers.length}
          onPageChange={setCurrentPage}
          itemName="clients"
        />
      )}
    </div>
  );
}
