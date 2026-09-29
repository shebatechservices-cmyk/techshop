import React from 'react';
import AddCustomerModal from './modals/AddCustomerModal';
import PartyProfileModal from '../../components/modals/PartyProfileModal';
import CustomerDataTable from './components/CustomerDataTable';
import CustomerMetricsCards from './components/CustomerMetricsCards';
import CustomerSearchToolbar from './components/CustomerSearchToolbar';
import { useCustomerList } from './hooks/useCustomerList';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * CustomerList
 * Standalone Customers subpage component.
 * Converted entirely to Tailwind CSS utilities (zero inline styles).
 * Fully encapsulates Customer state, fetch logic, AddCustomerModal, and PartyProfileModal.
 */
export default function CustomerList({
  initialSearch = '',
  onStartSale,
  onStartQuote,
  onCustomerCreated,
  onCustomersLoaded
}) {
  const {
    customers,
    loading,
    customerSearchQuery,
    setCustomerSearchQuery,
    customerTypeFilter,
    setCustomerTypeFilter,
    isCustomerModalOpen,
    setIsCustomerModalOpen,
    profileModalPartyId,
    setProfileModalPartyId,
    profileModalTab,
    setProfileModalTab,
    notification,
    handleDeleteCustomer,
    handleCustomerCreatedInternal,
    totalCustomerReceivables,
    totalLoyaltyPoints,
    filteredCustomers,
    fetchCustomers
  } = useCustomerList({
    initialSearch,
    onCustomerCreated,
    onCustomersLoaded
  });

  return (
    <div className="w-full space-y-4">
      {/* Toast Notification */}
      {notification.message && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl font-semibold text-sm shadow-xl flex items-center gap-2 text-white transition-all ${
            notification.type === 'error' ? 'bg-rose-500' : 'bg-emerald-600'
          }`}
        >
          <span>{notification.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* KPI Metrics Cards */}
      <CustomerMetricsCards
        customersCount={customers.length}
        totalCustomerReceivables={totalCustomerReceivables}
        totalLoyaltyPoints={totalLoyaltyPoints}
        taka={taka}
      />

      {/* Main Card Container */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        {/* Dedicated Customer Search & Filter Toolbar */}
        <CustomerSearchToolbar
          customerSearchQuery={customerSearchQuery}
          setCustomerSearchQuery={setCustomerSearchQuery}
          customerTypeFilter={customerTypeFilter}
          setCustomerTypeFilter={setCustomerTypeFilter}
          filteredCount={filteredCustomers.length}
          totalCount={customers.length}
          onRefresh={fetchCustomers}
          onAddCustomer={() => setIsCustomerModalOpen(true)}
        />

        {/* Data Table / Content Area */}
        <CustomerDataTable
          loading={loading}
          filteredCustomers={filteredCustomers}
          customerSearchQuery={customerSearchQuery}
          customerTypeFilter={customerTypeFilter}
          setCustomerSearchQuery={setCustomerSearchQuery}
          setCustomerTypeFilter={setCustomerTypeFilter}
          setIsCustomerModalOpen={setIsCustomerModalOpen}
          setProfileModalPartyId={setProfileModalPartyId}
          setProfileModalTab={setProfileModalTab}
          onStartSale={onStartSale}
          onStartQuote={onStartQuote}
          handleDeleteCustomer={handleDeleteCustomer}
          taka={taka}
        />
      </div>

      {/* Relocated Modals */}
      {/* 1. Add Customer Modal */}
      {isCustomerModalOpen && (
        <AddCustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onCustomerCreated={handleCustomerCreatedInternal}
        />
      )}

      {/* 2. Customer Profile Modal */}
      {profileModalPartyId && (
        <PartyProfileModal
          isOpen={Boolean(profileModalPartyId)}
          partyType="customer"
          partyId={profileModalPartyId}
          initialTab={profileModalTab}
          onClose={() => setProfileModalPartyId(null)}
          onPartyUpdated={fetchCustomers}
        />
      )}
    </div>
  );
}
