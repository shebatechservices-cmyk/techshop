import React from 'react';
import useWarrantyManager, { STATUS_CONFIG } from './hooks/useWarrantyManager';
import WarrantyHeader from './components/WarrantyHeader';
import WarrantySearchLookup from './components/WarrantySearchLookup';
import WarrantyExpiringAlerts from './components/WarrantyExpiringAlerts';
import WarrantyClaimsTab from './components/WarrantyClaimsTab';
import WarrantyReturnsTab from './components/WarrantyReturnsTab';
import AddClaimModal from './modals/AddClaimModal';
import EditClaimModal from './modals/EditClaimModal';
import DeleteClaimModal from './modals/DeleteClaimModal';
import AddReturnModal from './modals/AddReturnModal';
import EditReturnModal from './modals/EditReturnModal';
import DeleteReturnModal from './modals/DeleteReturnModal';
import SwapSerialModal from './modals/SwapSerialModal';
import ClaimPrintSlipModal from './modals/ClaimPrintSlipModal';

export default function Warranty() {
  const {
    activeTab,
    setActiveTab,
    claims,
    returns,
    toastMsg,
    toastType,
    expireData,
    expireLoading,
    showExpiredList,
    setShowExpiredList,
    refreshExpiry,
    searchQuery,
    setSearchQuery,
    searching,
    searchResult,
    searchError,
    handleCheckWarranty,
    handleIntakeFromSearch,
    handleReturnFromSearch,
    claimStatusFilter,
    setClaimStatusFilter,
    claimSearch,
    setClaimSearch,
    isAddClaimOpen,
    setIsAddClaimOpen,
    isAddReturnOpen,
    setIsAddReturnOpen,
    claimToPrint,
    setClaimToPrint,
    swapClaimModal,
    setSwapClaimModal,
    newReplacementSerial,
    setNewReplacementSerial,
    editingClaim,
    setEditingClaim,
    claimToDelete,
    setClaimToDelete,
    editingReturn,
    setEditingReturn,
    returnToDelete,
    setReturnToDelete,
    claimForm,
    setClaimForm,
    returnForm,
    setReturnForm,
    handleUpdateClaimStatus,
    handleSubmitClaim,
    handleSaveSwapSerial,
    handleSubmitReturn,
    handleOpenEditClaim,
    handleUpdateClaimSubmit,
    handleConfirmDeleteClaim,
    handleOpenEditReturn,
    handleUpdateReturnSubmit,
    handleConfirmDeleteReturn,
    filteredClaims,
  } = useWarrantyManager();

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-5 right-6 z-[999999] px-4 py-3 rounded-xl shadow-2xl text-white font-bold text-xs flex items-center gap-2.5 animate-fadeIn border-l-4 ${
            toastType === 'error'
              ? 'bg-slate-950 border-red-500'
              : 'bg-slate-950 border-emerald-500'
          }`}
        >
          <span>{toastType === 'error' ? '⚠️' : '✓'}</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Sleek Header & Tabs */}
      <WarrantyHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        claimsCount={claims.length}
        returnsCount={returns.length}
        onOpenAddClaim={() => setIsAddClaimOpen(true)}
        onOpenAddReturn={() => setIsAddReturnOpen(true)}
      />

      {/* 2. Instant Barcode & Serial Search Lookup */}
      <WarrantySearchLookup
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searching={searching}
        searchResult={searchResult}
        searchError={searchError}
        handleCheckWarranty={handleCheckWarranty}
        handleIntakeFromSearch={handleIntakeFromSearch}
        handleReturnFromSearch={handleReturnFromSearch}
      />

      {/* 3. Live Warranty Expiry Radar (+60 day grace) */}
      <WarrantyExpiringAlerts
        expireData={expireData}
        expireLoading={expireLoading}
        showExpiredList={showExpiredList}
        setShowExpiredList={setShowExpiredList}
        refreshExpiry={refreshExpiry}
      />

      {/* 4. Tab 1: Claims & Service Center */}
      {activeTab === 'claims' && (
        <WarrantyClaimsTab
          filteredClaims={filteredClaims}
          claimStatusFilter={claimStatusFilter}
          setClaimStatusFilter={setClaimStatusFilter}
          claimSearch={claimSearch}
          setClaimSearch={setClaimSearch}
          STATUS_CONFIG={STATUS_CONFIG}
          handleUpdateClaimStatus={handleUpdateClaimStatus}
          handleOpenEditClaim={handleOpenEditClaim}
          setClaimToDelete={setClaimToDelete}
          setSwapClaimModal={setSwapClaimModal}
          setClaimToPrint={setClaimToPrint}
        />
      )}

      {/* 5. Tab 2: Returns & Exchanges */}
      {activeTab === 'returns' && (
        <WarrantyReturnsTab
          returns={returns}
          handleOpenEditReturn={handleOpenEditReturn}
          setReturnToDelete={setReturnToDelete}
        />
      )}

      {/* MODAL 1: Receive Warranty Claim Intake */}
      <AddClaimModal
        isOpen={isAddClaimOpen}
        onClose={() => setIsAddClaimOpen(false)}
        claimForm={claimForm}
        setClaimForm={setClaimForm}
        handleSubmitClaim={handleSubmitClaim}
      />

      {/* MODAL 2: Process Product Return / Exchange */}
      <AddReturnModal
        isOpen={isAddReturnOpen}
        onClose={() => setIsAddReturnOpen(false)}
        returnForm={returnForm}
        setReturnForm={setReturnForm}
        handleSubmitReturn={handleSubmitReturn}
      />

      {/* MODAL 3: Printable Claim Token Slip */}
      <ClaimPrintSlipModal
        claimToPrint={claimToPrint}
        setClaimToPrint={setClaimToPrint}
      />

      {/* MODAL 4: Swap Replacement S/N */}
      <SwapSerialModal
        swapClaimModal={swapClaimModal}
        setSwapClaimModal={setSwapClaimModal}
        newReplacementSerial={newReplacementSerial}
        setNewReplacementSerial={setNewReplacementSerial}
        handleSaveSwapSerial={handleSaveSwapSerial}
      />

      {/* MODAL 5: Edit Warranty Claim */}
      <EditClaimModal
        editingClaim={editingClaim}
        setEditingClaim={setEditingClaim}
        handleUpdateClaimSubmit={handleUpdateClaimSubmit}
      />

      {/* MODAL 6: Delete Warranty Claim */}
      <DeleteClaimModal
        claimToDelete={claimToDelete}
        setClaimToDelete={setClaimToDelete}
        handleConfirmDeleteClaim={handleConfirmDeleteClaim}
      />

      {/* MODAL 7: Edit Product Return */}
      <EditReturnModal
        editingReturn={editingReturn}
        setEditingReturn={setEditingReturn}
        handleUpdateReturnSubmit={handleUpdateReturnSubmit}
      />

      {/* MODAL 8: Delete Product Return */}
      <DeleteReturnModal
        returnToDelete={returnToDelete}
        setReturnToDelete={setReturnToDelete}
        handleConfirmDeleteReturn={handleConfirmDeleteReturn}
      />
    </div>
  );
}
