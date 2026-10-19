import React, { useState, useEffect } from 'react';
import API from '../../../services/api';
import DayCloseHeader from './day-close/DayCloseHeader';
import DayCloseMetricsCards from './day-close/DayCloseMetricsCards';
import DayCloseBreakdownTables from './day-close/DayCloseBreakdownTables';
import DayCloseWalletsSnapshot from './day-close/DayCloseWalletsSnapshot';

export default function DayCloseModal({ isOpen, onClose }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async (date) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/accounts/day-close-summary?date=${date}`);
      if (!res.ok) throw new Error('Failed to load day closing data');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message || 'Error fetching report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSummary(selectedDate);
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  const summary = data?.summary || {};
  const sales = data?.sales || {};
  const purchases = data?.purchases || {};
  const accounts = data?.accounts || [];

  const handlePrint = () => {
    window.print();
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        id="day-close-printable"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <DayCloseHeader
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onClose={onClose}
        />

        {/* BODY */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#64748b' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
                ⏳ Generating register closing report...
              </div>
              <small>Auditing cash flow, sales invoices, collections, and payouts</small>
            </div>
          ) : error ? (
            <div
              style={{
                padding: '16px',
                background: '#fee2e2',
                color: '#b91c1c',
                borderRadius: '10px',
              }}
            >
              ⚠️ {error}
            </div>
          ) : (
            <>
              <DayCloseMetricsCards summary={summary} sales={sales} />
              <DayCloseBreakdownTables summary={summary} sales={sales} purchases={purchases} />
              <DayCloseWalletsSnapshot accounts={accounts} />
            </>
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: '14px 24px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Report generated for: <strong>{selectedDate}</strong>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                padding: '8px 16px',
                background: '#0f172a',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🖨️ Print Z-Report
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
