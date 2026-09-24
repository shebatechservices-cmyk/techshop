import React, { useState, useEffect, useRef } from 'react';
import API_BASE from '../../services/api';

const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

export default function RegisterClosingModal({ isOpen, onClose, currentUser, shopInfo }) {
  const [activeTab, setActiveTab] = useState('closing'); // 'closing' | 'history'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Shift Data State
  const [hasActiveShift, setHasActiveShift] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [lastClosedShift, setLastClosedShift] = useState(null);

  // Open Shift Form State
  const [openBalance, setOpenBalance] = useState('');
  const [openNotes, setOpenNotes] = useState('');

  // Close Shift Form State (Blind Close)
  const [denominations, setDenominations] = useState({});
  const [actualCashCounted, setActualCashCounted] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [closedSummary, setClosedSummary] = useState(null);

  // History State
  const [shiftHistory, setShiftHistory] = useState([]);
  const [selectedHistoryShift, setSelectedHistoryShift] = useState(null);

  const printRef = useRef(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch Current Shift Status
  const fetchCurrentShift = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/register/current-shift`, {
        headers: { ...getAuthHeader() }
      });
      const data = await res.json();
      if (data.success) {
        setHasActiveShift(data.has_active_shift);
        setCurrentShift(data.shift);
        setLastClosedShift(data.last_closed_shift);
        if (!data.has_active_shift && data.last_closed_shift) {
          // Default opening balance to last shift's actual counted cash if available
          setOpenBalance(data.last_closed_shift.actual_cash_counted || '0');
        }
      } else {
        setError(data.message || 'Failed to fetch register shift status');
      }
    } catch (err) {
      setError(err.message || 'Network error fetching shift status');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Shift History
  const fetchShiftHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/register/shifts?limit=25`, {
        headers: { ...getAuthHeader() }
      });
      const data = await res.json();
      if (data.success) {
        setShiftHistory(data.shifts || []);
      }
    } catch (err) {
      console.warn('Failed to fetch shift history:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMsg('');
      setClosedSummary(null);
      setDenominations({});
      setActualCashCounted('');
      setClosingNotes('');
      fetchCurrentShift();
      fetchShiftHistory();
    }
  }, [isOpen]);

  // Handle Denomination change and auto-sum
  const handleDenominationChange = (val, countStr) => {
    const count = parseInt(countStr, 10) || 0;
    const nextDenom = { ...denominations, [val]: count };
    if (count <= 0) {
      delete nextDenom[val];
    }
    setDenominations(nextDenom);

    // Calculate sum
    let total = 0;
    for (const [dVal, dCount] of Object.entries(nextDenom)) {
      total += Number(dVal) * Number(dCount);
    }
    setActualCashCounted(total > 0 ? String(total) : '');
  };

  // Open Shift Submit
  const handleOpenShift = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/register/open`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          opening_balance: Number(openBalance) || 0,
          notes: openNotes,
          opened_by: currentUser?.id,
          opened_by_name: currentUser?.name || 'Cashier'
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Register Shift Opened Successfully!');
        await fetchCurrentShift();
      } else {
        setError(data.message || 'Failed to open shift');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  // Close Shift (Blind Close Submit)
  const handleCloseShift = async (e) => {
    e.preventDefault();
    if (!actualCashCounted && actualCashCounted !== 0) {
      setError('দয়া করে ক্যাশ কাউন্ট প্রবেশ করান (Please enter physical cash counted)');
      return;
    }

    if (!window.confirm('আপনি কি নিশ্চিত যে ক্যাশ রেজিস্টার শিফট সমাপ্ত ও লক করতে চান? (Are you sure you want to finalize & close this shift?)')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/register/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          actual_cash_counted: Number(actualCashCounted) || 0,
          denominations,
          notes: closingNotes,
          closed_by: currentUser?.id,
          closed_by_name: currentUser?.name || 'Cashier'
        })
      });
      const data = await res.json();
      if (data.success) {
        setClosedSummary(data);
        setHasActiveShift(false);
        setCurrentShift(null);
        fetchShiftHistory();
      } else {
        setError(data.message || 'Failed to close register shift');
      }
    } catch (err) {
      setError(err.message || 'Network error during shift closing');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div 
        className="modal-container"
        style={{
          width: '94%',
          maxWidth: '850px',
          maxHeight: '92vh',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Modal Top Header */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #334155',
            color: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.6rem', padding: '6px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
              🔒
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                End-of-Day (EOD) / Register Shift Closing
              </h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                ক্যাশ রেজিস্টার সমাপনী, ব্লাইন্ড ক্লোজ ও হিসাব মেলানো
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '3px' }}>
              <button
                type="button"
                onClick={() => { setActiveTab('closing'); setSelectedHistoryShift(null); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTab === 'closing' ? '#0284c7' : 'transparent',
                  color: '#ffffff',
                  transition: 'all 0.2s'
                }}
              >
                {hasActiveShift ? '⚡ Active Shift Close' : '⚡ Register Shift'}
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('history'); setSelectedHistoryShift(null); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTab === 'history' ? '#0284c7' : 'transparent',
                  color: '#ffffff',
                  transition: 'all 0.2s'
                }}
              >
                📜 Shift History
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '1.4rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px'
              }}
              title="Close Modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
          {error && (
            <div style={{ padding: '12px 16px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', marginBottom: '16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '12px 16px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#166534', marginBottom: '16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✅</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: ACTIVE SHIFT & BLIND CLOSE */}
          {activeTab === 'closing' && (
            <>
              {/* CASE 1: JUST CLOSED SHIFT SUMMARY / AUDIT SLIP */}
              {closedSummary ? (
                <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: '14px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.8rem' }}>🎉</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                          Shift Closed & Locked Successfully
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                          Shift #{closedSummary.shift.id} • Closed by {closedSummary.shift.closed_by_name}
                        </p>
                      </div>
                    </div>

                    {/* Variance Badge */}
                    <div>
                      {Number(closedSummary.shift.variance_amount) === 0 ? (
                        <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem' }}>
                          ✓ Balanced (৳0.00)
                        </span>
                      ) : Number(closedSummary.shift.variance_amount) > 0 ? (
                        <span style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem' }}>
                          ▲ Overage (+৳{Number(closedSummary.shift.variance_amount).toFixed(2)})
                        </span>
                      ) : (
                        <span style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem' }}>
                          ▼ Shortage (৳{Number(closedSummary.shift.variance_amount).toFixed(2)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SMS Alert Status Box */}
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.3rem' }}>📱</span>
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: '#166534' }}>Automated SMS Alert Status:</strong>
                        <div style={{ fontSize: '0.82rem', color: '#15803d' }}>
                          {closedSummary.sms_recipient 
                            ? `SMS notification dispatched to Store Owner/Admin (${closedSummary.sms_recipient})`
                            : 'Owner phone not configured in Settings.'}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.78rem', background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>
                      SENT
                    </span>
                  </div>

                  {/* Shift Audit Table */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Opening Cash</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#334155' }}>৳{Number(closedSummary.shift.opening_balance).toFixed(2)}</div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Cash Sales</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0284c7' }}>৳{Number(closedSummary.shift.total_cash_sales).toFixed(2)}</div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Due Collections</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>৳{Number(closedSummary.shift.total_due_collections).toFixed(2)}</div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Cash Expenses / Refunds</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#dc2626' }}>৳{Number(closedSummary.shift.total_cash_expenses).toFixed(2)}</div>
                    </div>

                    <div style={{ background: '#f1f5f9', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <span style={{ fontSize: '0.78rem', color: '#475569', textTransform: 'uppercase', fontWeight: 700 }}>Expected Drawer Cash</span>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b' }}>৳{Number(closedSummary.shift.expected_cash_balance).toFixed(2)}</div>
                    </div>

                    <div style={{ background: '#f1f5f9', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <span style={{ fontSize: '0.78rem', color: '#475569', textTransform: 'uppercase', fontWeight: 700 }}>Actual Cash Counted</span>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>৳{Number(closedSummary.shift.actual_cash_counted).toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                    <button
                      type="button"
                      onClick={handlePrintSlip}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#334155',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>🖨️</span>
                      <span>Print Shift Receipt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setClosedSummary(null);
                        fetchCurrentShift();
                      }}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#0284c7',
                        color: '#ffffff',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ➕ Open Next Shift
                    </button>
                  </div>
                </div>
              ) : hasActiveShift ? (
                /* CASE 2: ACTIVE SHIFT EXISTS -> BLIND CLOSE FORM */
                <div>
                  {/* Shift Information Pill */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                          🟢 ACTIVE SHIFT #{currentShift.id}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          Opened at: {new Date(currentShift.opened_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ({new Date(currentShift.opened_at).toLocaleDateString()})
                        </span>
                      </div>
                      <div style={{ marginTop: '6px', fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
                        Cashier: {currentShift.opened_by_name || 'Admin'} • Opening Drawer: ৳{Number(currentShift.opening_balance).toFixed(2)}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>PROTOCOL</div>
                      <div style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 700 }}>Blind Close Enforced</div>
                    </div>
                  </div>

                  {/* Blind Close Banner */}
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.4rem' }}>🛡️</span>
                    <div style={{ fontSize: '0.85rem', color: '#1e40af', lineHeight: 1.4 }}>
                      <strong>Blind Close Mode Active:</strong> কাউন্ট করার সময় সিস্টেম প্রত্যাশিত ব্যালেন্স প্রকাশ করে না। আপনার ক্যাশ ড্রয়ারের প্রকৃত টাকা গুণে এন্ট্রি করুন। সমাপ্ত করার পর স্বয়ংক্রিয়ভাবে অডিট রিপোর্ট ও এসএমএস প্রেরিত হবে।
                    </div>
                  </div>

                  <form onSubmit={handleCloseShift}>
                    {/* Denomination Counter Grid */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                          💵 Currency Denomination Counter (নোট ও কয়েন কাউন্টার)
                        </h4>
                        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Bangladeshi Taka (৳)</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                        {DENOMINATIONS.map((denom) => {
                          const count = denominations[denom] || '';
                          const lineTotal = (Number(denom) * (parseInt(count, 10) || 0));
                          return (
                            <div 
                              key={denom}
                              style={{
                                background: count ? '#f0f9ff' : '#f8fafc',
                                border: count ? '1px solid #38bdf8' : '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '8px 10px',
                                transition: 'all 0.15s'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>৳{denom}</span>
                                {lineTotal > 0 && (
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>৳{lineTotal.toLocaleString()}</span>
                                )}
                              </div>
                              <input
                                type="number"
                                min="0"
                                placeholder="Qty"
                                value={count}
                                onChange={(e) => handleDenominationChange(denom, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '0.88rem',
                                  fontWeight: 600,
                                  textAlign: 'right',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Total Cash Input & Notes */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                          🎯 Total Actual Cash Counted (মোট গণনা করা ক্যাশ) <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#64748b' }}>৳</span>
                          <input
                            type="number"
                            step="any"
                            required
                            value={actualCashCounted}
                            onChange={(e) => setActualCashCounted(e.target.value)}
                            placeholder="0.00"
                            style={{
                              width: '100%',
                              padding: '10px 12px 10px 28px',
                              fontSize: '1.25rem',
                              fontWeight: 800,
                              borderRadius: '8px',
                              border: '2px solid #0284c7',
                              boxSizing: 'border-box',
                              color: '#0f172a',
                              background: '#f8fafc'
                            }}
                          />
                        </div>
                        <p style={{ margin: '6px 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                          Auto-filled by denomination counter or entered directly.
                        </p>
                      </div>

                      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                          📝 Shift Closing Notes / Remarks (মন্তব্য)
                        </label>
                        <textarea
                          rows="3"
                          value={closingNotes}
                          onChange={(e) => setClosingNotes(e.target.value)}
                          placeholder="e.g., Cash handed over to Manager, petty cash retained..."
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            fontSize: '0.85rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    {/* Submit Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={onClose}
                        style={{
                          padding: '10px 18px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#475569',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          padding: '11px 24px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {loading ? 'Reconciling & Closing...' : '🔒 Finalize & Close Register'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* CASE 3: NO ACTIVE SHIFT -> OPEN SHIFT FORM */
                <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                    <span style={{ fontSize: '2rem' }}>☀️</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>
                        Start / Open Cash Register Shift (নতুন শিফট শুরু করুন)
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                        Set the opening cash drawer balance to begin tracking sales, collections, and expenses.
                      </p>
                    </div>
                  </div>

                  {lastClosedShift && (
                    <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>PREVIOUS SHIFT CLOSING</span>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
                          Shift #{lastClosedShift.id} ended with ৳{Number(lastClosedShift.actual_cash_counted).toFixed(2)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpenBalance(lastClosedShift.actual_cash_counted || '0')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #0284c7',
                          background: '#f0f9ff',
                          color: '#0284c7',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Use Previous Closing Balance
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleOpenShift}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                          💵 Opening Cash in Drawer (প্রারম্ভিক ক্যাশ) <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#64748b' }}>৳</span>
                          <input
                            type="number"
                            step="any"
                            required
                            value={openBalance}
                            onChange={(e) => setOpenBalance(e.target.value)}
                            placeholder="0.00"
                            style={{
                              width: '100%',
                              padding: '10px 12px 10px 28px',
                              fontSize: '1.15rem',
                              fontWeight: 700,
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                          👤 Active Cashier Name
                        </label>
                        <input
                          type="text"
                          disabled
                          value={currentUser?.name || 'Super Admin'}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            fontSize: '0.95rem',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: '#f8fafc',
                            color: '#475569',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                        Opening Shift Remarks (ঐচ্ছিক)
                      </label>
                      <input
                        type="text"
                        value={openNotes}
                        onChange={(e) => setOpenNotes(e.target.value)}
                        placeholder="e.g., Morning Shift, Drawer float verified..."
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          fontSize: '0.88rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={onClose}
                        style={{
                          padding: '10px 18px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#475569',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          padding: '11px 24px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#16a34a',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                        }}
                      >
                        {loading ? 'Opening Shift...' : '🟢 Start Register Shift'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}

          {/* TAB 2: SHIFT HISTORY & RECONCILIATION AUDIT */}
          {activeTab === 'history' && (
            <div>
              {selectedHistoryShift ? (
                <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedHistoryShift(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284c7',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '0 0 14px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    ← Back to Shift History List
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>
                        Shift #{selectedHistoryShift.id} Audit Report
                      </h3>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        Opened: {new Date(selectedHistoryShift.opened_at).toLocaleString()} | Closed: {selectedHistoryShift.closed_at ? new Date(selectedHistoryShift.closed_at).toLocaleString() : 'Open'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handlePrintSlip}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      🖨️ Print Slip
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Opening Balance</span>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>৳{Number(selectedHistoryShift.opening_balance).toFixed(2)}</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Cash Sales</span>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0284c7' }}>৳{Number(selectedHistoryShift.total_cash_sales).toFixed(2)}</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Due Collections</span>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#16a34a' }}>৳{Number(selectedHistoryShift.total_due_collections).toFixed(2)}</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Cash Expenses</span>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#dc2626' }}>৳{Number(selectedHistoryShift.total_cash_expenses).toFixed(2)}</div>
                    </div>
                    <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <span style={{ fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase', fontWeight: 700 }}>Expected Drawer</span>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>৳{Number(selectedHistoryShift.expected_cash_balance).toFixed(2)}</div>
                    </div>
                    <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <span style={{ fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase', fontWeight: 700 }}>Actual Counted</span>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>৳{Number(selectedHistoryShift.actual_cash_counted).toFixed(2)}</div>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.88rem' }}>Reconciliation Variance: </strong>
                      <span style={{ 
                        fontWeight: 700, 
                        color: Number(selectedHistoryShift.variance_amount) === 0 ? '#15803d' : Number(selectedHistoryShift.variance_amount) > 0 ? '#1d4ed8' : '#b91c1c' 
                      }}>
                        ৳{Number(selectedHistoryShift.variance_amount).toFixed(2)} ({Number(selectedHistoryShift.variance_amount) === 0 ? 'Balanced' : Number(selectedHistoryShift.variance_amount) > 0 ? 'Overage' : 'Shortage'})
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      SMS Alert Sent: {selectedHistoryShift.sms_alert_sent ? '✅ Yes' : '❌ No'}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                      Past Register Shift Closings ({shiftHistory.length})
                    </h4>
                    <button
                      type="button"
                      onClick={fetchShiftHistory}
                      style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      🔄 Refresh
                    </button>
                  </div>

                  {shiftHistory.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                      No shift records found.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                            <th style={{ padding: '10px 14px' }}>Shift #</th>
                            <th style={{ padding: '10px 14px' }}>Opened</th>
                            <th style={{ padding: '10px 14px' }}>Cashier</th>
                            <th style={{ padding: '10px 14px', textAlign: 'right' }}>Opening</th>
                            <th style={{ padding: '10px 14px', textAlign: 'right' }}>Sales</th>
                            <th style={{ padding: '10px 14px', textAlign: 'right' }}>Counted</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center' }}>Variance</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status</th>
                            <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shiftHistory.map((s) => {
                            const variance = Number(s.variance_amount || 0);
                            return (
                              <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '10px 14px', fontWeight: 700 }}>#{s.id}</td>
                                <td style={{ padding: '10px 14px', color: '#64748b' }}>
                                  {new Date(s.opened_at).toLocaleDateString()} {new Date(s.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td style={{ padding: '10px 14px' }}>{s.closed_by_name || s.opened_by_name || 'Admin'}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'right' }}>৳{Number(s.opening_balance).toFixed(2)}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'right', color: '#0284c7', fontWeight: 600 }}>৳{Number(s.total_cash_sales).toFixed(2)}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>৳{Number(s.actual_cash_counted).toFixed(2)}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                  {variance === 0 ? (
                                    <span style={{ color: '#15803d', fontWeight: 600 }}>৳0.00</span>
                                  ) : variance > 0 ? (
                                    <span style={{ color: '#1d4ed8', fontWeight: 600 }}>+৳{variance.toFixed(2)}</span>
                                  ) : (
                                    <span style={{ color: '#b91c1c', fontWeight: 600 }}>৳{variance.toFixed(2)}</span>
                                  )}
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                  {s.status === 'open' ? (
                                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Open</span>
                                  ) : s.status === 'closed' ? (
                                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Closed</span>
                                  ) : (
                                    <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Discrepancy</span>
                                  )}
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedHistoryShift(s)}
                                    style={{
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      border: '1px solid #cbd5e1',
                                      background: '#ffffff',
                                      fontSize: '0.78rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Printable Shift Closing Audit Receipt (Visible only during print) */}
        <div className="printable-shift-receipt" style={{ display: 'none' }}>
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              .printable-shift-receipt, .printable-shift-receipt * {
                visibility: visible !important;
              }
              .printable-shift-receipt {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 80mm !important;
                padding: 10px !important;
                font-family: monospace, sans-serif !important;
                font-size: 11px !important;
                color: #000 !important;
              }
            }
          `}</style>
          {(() => {
            const slipShift = closedSummary?.shift || selectedHistoryShift || currentShift;
            if (!slipShift) return null;
            return (
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>{shopInfo?.shop_name || 'SHEBA TECHNOLOGY BD'}</h3>
                <p style={{ margin: '0 0 8px 0', fontSize: '10px' }}>EOD CASH REGISTER CLOSING SLIP</p>
                <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', margin: '6px 0', textAlign: 'left', fontSize: '10px' }}>
                  <div>Shift #: {slipShift.id}</div>
                  <div>Cashier: {slipShift.closed_by_name || slipShift.opened_by_name || 'Admin'}</div>
                  <div>Opened: {new Date(slipShift.opened_at).toLocaleString()}</div>
                  {slipShift.closed_at && <div>Closed: {new Date(slipShift.closed_at).toLocaleString()}</div>}
                </div>
                <table style={{ width: '100%', fontSize: '10px', textAlign: 'left', margin: '8px 0' }}>
                  <tbody>
                    <tr><td>Opening Cash:</td><td style={{ textAlign: 'right' }}>৳{Number(slipShift.opening_balance).toFixed(2)}</td></tr>
                    <tr><td>(+) Cash Sales:</td><td style={{ textAlign: 'right' }}>৳{Number(slipShift.total_cash_sales).toFixed(2)}</td></tr>
                    <tr><td>(+) Collections:</td><td style={{ textAlign: 'right' }}>৳{Number(slipShift.total_due_collections).toFixed(2)}</td></tr>
                    <tr><td>(-) Cash Expenses:</td><td style={{ textAlign: 'right' }}>৳{Number(slipShift.total_cash_expenses).toFixed(2)}</td></tr>
                    <tr style={{ borderTop: '1px solid #000' }}><strong><td>Expected Cash:</td><td style={{ textAlign: 'right' }}>৳{Number(slipShift.expected_cash_balance).toFixed(2)}</td></strong></tr>
                    <tr><strong><td>Actual Count:</td><td style={{ textAlign: 'right' }}>৳{Number(slipShift.actual_cash_counted).toFixed(2)}</td></strong></tr>
                    <tr style={{ borderTop: '1px dashed #000' }}><strong><td>Variance:</td><td style={{ textAlign: 'right' }}>৳{Number(slipShift.variance_amount).toFixed(2)}</td></strong></tr>
                  </tbody>
                </table>
                <div style={{ margin: '20px 0 0 0', display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                  <div>-------------------<br/>Cashier Sign</div>
                  <div>-------------------<br/>Manager Sign</div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
