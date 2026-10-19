import React from 'react';
import StorefrontView from '../../views/StorefrontView';
import ParcelTrackingView from '../../views/ParcelTrackingView';
import CustomerAccountView from '../../views/CustomerAccountView';

export default function StorefrontViewContainer({
  activeView,
  setActiveView,
  filteredProducts,
  storeSearch,
  setStoreSearch,
  selectedCategory,
  setSelectedCategory,
  categories,
  sortBy,
  setSortBy,
  cart,
  addToCart,
  buyNow,
  updateCartQty,
  taka,
  money,
  trackQuery,
  setTrackQuery,
  handleTrackSearch,
  trackingLoading,
  trackingError,
  trackingOrders,
  customer,
  authName,
  setAuthName,
  authPhone,
  setAuthPhone,
  authAddress,
  setAuthAddress,
  authEmail,
  setAuthEmail,
  authLoading,
  authMsg,
  handleAuthSubmit,
  handleCustomerLogout,
}) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
      {/* VIEW 1: STOREFRONT */}
      {activeView === 'store' && (
        <StorefrontView
          filteredProducts={filteredProducts}
          storeSearch={storeSearch}
          setStoreSearch={setStoreSearch}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          sortBy={sortBy}
          setSortBy={setSortBy}
          cart={cart}
          addToCart={addToCart}
          buyNow={buyNow}
          updateCartQty={updateCartQty}
          setActiveView={setActiveView}
          taka={taka}
        />
      )}

      {/* VIEW 2: PARCEL TRACKING */}
      {activeView === 'track' && (
        <ParcelTrackingView
          trackQuery={trackQuery}
          setTrackQuery={setTrackQuery}
          handleTrackSearch={handleTrackSearch}
          trackingLoading={trackingLoading}
          trackingError={trackingError}
          trackingOrders={trackingOrders}
          taka={taka}
          money={money}
        />
      )}

      {/* VIEW 3: CUSTOMER ACCOUNT / SIGN IN */}
      {activeView === 'account' && (
        <CustomerAccountView
          customer={customer}
          authName={authName}
          setAuthName={setAuthName}
          authPhone={authPhone}
          setAuthPhone={setAuthPhone}
          authAddress={authAddress}
          setAuthAddress={setAuthAddress}
          authEmail={authEmail}
          setAuthEmail={setAuthEmail}
          authLoading={authLoading}
          authMsg={authMsg}
          handleAuthSubmit={handleAuthSubmit}
          handleCustomerLogout={handleCustomerLogout}
          setActiveView={setActiveView}
          setTrackQuery={setTrackQuery}
          handleTrackSearch={handleTrackSearch}
        />
      )}
    </div>
  );
}
