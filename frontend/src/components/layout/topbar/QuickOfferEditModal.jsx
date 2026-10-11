import React, { useState, useEffect } from 'react';
import API, { getAuthHeaders } from '../../../services/api';

export default function QuickOfferEditModal({ isOpen, onClose, onSaved }) {
  const [customerOffer, setCustomerOffer] = useState('');
  const [customerOfferEnabled, setCustomerOfferEnabled] = useState(true);
  const [technicianOffer, setTechnicianOffer] = useState('');
  const [technicianOfferEnabled, setTechnicianOfferEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFetching(true);
      setError('');
      fetch(`${API}/settings`, { headers: getAuthHeaders() })
        .then((res) => res.json())
        .then((json) => {
          if (json && json.data) {
            setCustomerOffer(
              json.data.customer_offer_headline ||
                '🔥 মেগা অফার: ৪টি সিসিটিভি ক্যামেরা প্যাকেজে ফ্রি রাউটার ও ইনস্টলেশন চার্জে ২০% ছাড়!'
            );
            setCustomerOfferEnabled(json.data.customer_offer_enabled !== false);
            setTechnicianOffer(
              json.data.technician_offer_headline ||
                '⚡ টেকনিশিয়ান বোনাস: চলতি সপ্তাহে ৫টি প্রজেক্ট সম্পন্ন করলে ১,০০০ টাকা বিশেষ ইনসেনটিভ!'
            );
            setTechnicianOfferEnabled(json.data.technician_offer_enabled !== false);
          }
        })
        .catch((err) => {
          console.error(err);
          setError('অফারের তথ্য লোড করতে সমস্যা হয়েছে');
        })
        .finally(() => setFetching(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/settings/live-offers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          customer_offer_headline: customerOffer.trim(),
          customer_offer_enabled: customerOfferEnabled,
          technician_offer_headline: technicianOffer.trim(),
          technician_offer_enabled: technicianOfferEnabled,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        alert(json.message || 'অফার সফলভাবে সংরক্ষিত হয়েছে!');
        if (onSaved) onSaved();
        onClose();
      } else {
        setError(json.message || 'অফার সেভ করতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error(err);
      setError('সার্ভার এরর');
    } finally {
      setLoading(false);
    }
  };

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
              {/* 1. Customer Offer */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <label
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>🎁</span>
                    <span>কাস্টমার অফার হেডলাইন (Customer Offer)</span>
                  </label>
                  <label
                    style={{
                      fontSize: '0.74rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      color: customerOfferEnabled ? '#15803d' : '#64748b',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={customerOfferEnabled}
                      onChange={(e) => setCustomerOfferEnabled(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{customerOfferEnabled ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Off)'}</span>
                  </label>
                </div>
                <textarea
                  rows={2}
                  value={customerOffer}
                  onChange={(e) => setCustomerOffer(e.target.value)}
                  placeholder="যেমন: ৪টি সিসিটিভি ক্যামেরা কিনলে ফ্রি রাউটার ও ইনস্টলেশনে ২০% ছাড়!"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* 2. Technician Offer */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <label
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>⚡</span>
                    <span>টেকনিশিয়ান বোনাস অফার (Technician Incentive)</span>
                  </label>
                  <label
                    style={{
                      fontSize: '0.74rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      color: technicianOfferEnabled ? '#15803d' : '#64748b',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={technicianOfferEnabled}
                      onChange={(e) => setTechnicianOfferEnabled(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{technicianOfferEnabled ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Off)'}</span>
                  </label>
                </div>
                <textarea
                  rows={2}
                  value={technicianOffer}
                  onChange={(e) => setTechnicianOffer(e.target.value)}
                  placeholder="যেমন: চলতি সপ্তাহে ৫টি প্রজেক্ট সম্পন্ন করলে ১,০০০ টাকা বিশেষ বোনাস!"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
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
