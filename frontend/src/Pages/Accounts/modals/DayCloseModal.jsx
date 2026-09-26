import React, { useState, useEffect } from 'react';
import API from '../../../services/api';

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
  const transactions = data?.transactions || [];

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
        padding: '16px'
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
          border: '1px solid #e2e8f0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>🌅</span>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                Daily Cash Closing & Register Report (Z-Report)
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              Comprehensive end-of-day cash drawer, sales, and expense reconciliation report
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #475569',
                background: '#1e293b',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#64748b' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>⏳ Generating register closing report...</div>
              <small>Auditing cash flow, sales invoices, collections, and payouts</small>
            </div>
          ) : error ? (
            <div style={{ padding: '16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '10px' }}>
              ⚠️ {error}
            </div>
          ) : (
            <>
              {/* PRIMARY METRICS CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                {/* Expected Cash in Drawer */}
                <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '12px', padding: '16px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
                    Expected Cash in Hand / Drawer
                  </span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
                    ৳ {Number(summary.current_cash_in_drawer || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                  </div>
                  <small style={{ color: '#16a34a', fontWeight: 600 }}>Calculated physical drawer cash</small>
                </div>

                {/* Today's Gross Sales */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Today's Gross Sales ({sales.total_invoices || 0} Invoices)
                  </span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    ৳ {Number(sales.gross_sales || 0).toLocaleString('en-BD')}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                    Paid: <strong style={{ color: '#16a34a' }}>৳ {Number(sales.total_collected || 0).toLocaleString()}</strong> | Due: <strong style={{ color: '#ef4444' }}>৳ {Number(sales.total_due_given || 0).toLocaleString()}</strong>
                  </div>
                </div>

                {/* Net Cash Movement */}
                <div style={{ background: summary.net_cash_flow >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${summary.net_cash_flow >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: '12px', padding: '16px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: summary.net_cash_flow >= 0 ? '#15803d' : '#b91c1c', textTransform: 'uppercase' }}>
                    Today's Net Cash Movement
                  </span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: summary.net_cash_flow >= 0 ? '#16a34a' : '#dc2626', marginTop: '4px' }}>
                    {summary.net_cash_flow >= 0 ? '+' : ''}৳ {Number(summary.net_cash_flow || 0).toLocaleString('en-BD')}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                    Inflow: +৳{Number(summary.cash_inflow || 0).toLocaleString()} | Outflow: -৳{Number(summary.cash_outflow || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* DETAILED CASH & REVENUE BREAKDOWN */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                {/* Cash & Inflow Sources */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.92rem', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📥 Inflow Receipts
                  </h4>
                  <table style={{ width: '100%', fontSize: '0.84rem', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 0', color: '#64748b' }}>Cash Sales Collection:</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                          ৳ {Number(sales.total_collected || 0).toLocaleString()}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 0', color: '#64748b' }}>Customer Due Collections:</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                          ৳ {Number(summary.total_dues_collected || 0).toLocaleString()}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 0', color: '#64748b' }}>Bank & MFS (bKash/Nagad) Inflow:</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#0284c7' }}>
                          ৳ {Number(summary.bank_mfs_inflow || 0).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 0', fontWeight: 700, color: '#0f172a' }}>Total Today's Cash Inflow:</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 800, color: '#15803d', fontSize: '0.95rem' }}>
                          ৳ {Number(summary.cash_inflow || 0).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Cash Outflow Sources */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.92rem', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📤 Outflow Disbursements
                  </h4>
                  <table style={{ width: '100%', fontSize: '0.84rem', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 0', color: '#64748b' }}>Supplier Payouts (Due & Advance):</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                          ৳ {Number(summary.total_supplier_paid || 0).toLocaleString()}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 0', color: '#64748b' }}>Today's Purchase Orders ({purchases.total_pos || 0} POs):</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#475569' }}>
                          ৳ {Number(purchases.total_purchased || 0).toLocaleString()}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 0', color: '#64748b' }}>Operating Expenses & Allowances:</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                          ৳ {Number(summary.total_expenses || 0).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 0', fontWeight: 700, color: '#0f172a' }}>Total Today's Cash Outflow:</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 800, color: '#b91c1c', fontSize: '0.95rem' }}>
                          ৳ {Number(summary.cash_outflow || 0).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CURRENT WALLETS SNAPSHOT */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#0f172a', fontWeight: 700 }}>
                  💼 End-of-Day Wallet Balances
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                  {accounts.map((acc) => (
                    <div key={acc.id} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{acc.name}</span>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                        ৳ {Number(acc.balance || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
            alignItems: 'center'
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
                gap: '6px'
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
                cursor: 'pointer'
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
