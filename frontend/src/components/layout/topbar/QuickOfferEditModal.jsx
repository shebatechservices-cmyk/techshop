import React from 'react';
import OfferInputCard from './quick-offer/OfferInputCard';
import { useQuickOffer } from './quick-offer/useQuickOffer';

export default function QuickOfferEditModal({ isOpen, onClose, onSaved }) {
  const {
    customerOffer,
    setCustomerOffer,
    customerOfferEnabled,
    setCustomerOfferEnabled,
    technicianOffer,
    setTechnicianOffer,
    technicianOfferEnabled,
    setTechnicianOfferEnabled,
    loading,
    fetching,
    error,
    handleSubmit,
  } = useQuickOffer({ isOpen, onClose, onSaved });

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '14px 20px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.3rem' }}>🔥</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                লাইভ কোর অফার এডিটর (Live Offers Editor)
              </h3>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>
                টপ ব্যানার ও লাইভ ফিডে কাস্টমার এবং টেকনিশিয়ানদের জন্য সক্রিয় অফার
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.1rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {error && (
            <div
              style={{
                marginBottom: '14px',
                padding: '8px 12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                borderRadius: '8px',
                fontSize: '0.8rem',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {fetching ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
              তথ্য লোড হচ্ছে...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <OfferInputCard
                icon="🎁"
                title="কাস্টমার অফার হেডলাইন (Customer Offer)"
                enabled={customerOfferEnabled}
                onToggle={setCustomerOfferEnabled}
                value={customerOffer}
                onChange={setCustomerOffer}
                placeholder="যেমন: ৪টি সিসিটিভি ক্যামেরা কিনলে ফ্রি রাউটার ও ইনস্টলেশনে ২০% ছাড়!"
              />
              <OfferInputCard
                icon="⚡"
                title="টেকনিশিয়ান বোনাস অফার (Technician Incentive)"
                enabled={technicianOfferEnabled}
                onToggle={setTechnicianOfferEnabled}
                value={technicianOffer}
                onChange={setTechnicianOffer}
                placeholder="যেমন: চলতি সপ্তাহে ৫টি প্রজেক্ট সম্পন্ন করলে ১,০০০ টাকা বিশেষ বোনাস!"
              />
            </div>
          )}

          {/* Footer Actions */}
          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '7px 16px',
                background: '#e2e8f0',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.82rem',
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading || fetching}
              style={{
                padding: '7px 20px',
                background: '#0284c7',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.85rem',
                color: '#ffffff',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.4)',
              }}
            >
              {loading ? 'সংরক্ষণ হচ্ছে...' : '✓ অফার আপডেট করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
