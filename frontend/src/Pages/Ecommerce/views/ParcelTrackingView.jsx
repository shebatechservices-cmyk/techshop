import React from 'react';
import ParcelTrackingSearchBox from './tracking/ParcelTrackingSearchBox';
import ParcelTrackingOrderCard from './tracking/ParcelTrackingOrderCard';

export default function ParcelTrackingView({
  trackQuery,
  setTrackQuery,
  handleTrackSearch,
  trackingLoading,
  trackingError,
  trackingOrders,
  taka,
  money,
}) {
  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <ParcelTrackingSearchBox
        trackQuery={trackQuery}
        setTrackQuery={setTrackQuery}
        handleTrackSearch={handleTrackSearch}
        trackingLoading={trackingLoading}
        trackingError={trackingError}
      />

      {/* Tracking Results */}
      {trackingOrders.map((ord) => (
        <ParcelTrackingOrderCard
          key={ord.id}
          ord={ord}
          taka={taka}
          money={money}
        />
      ))}
    </div>
  );
}
