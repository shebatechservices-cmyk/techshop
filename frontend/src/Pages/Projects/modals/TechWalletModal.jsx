import React, { useState, useEffect } from 'react';
import API from '../../../services/api';

export default function TechWalletModal({ isOpen, onClose, onRefreshProjects }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'payout' | 'statement'
  const [wallets, setWallets] = useState([]);
  const [sourceAccounts, setSourceAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payout form states
  const [selectedTechName, setSelectedTechName] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Statement states
  const [statementWalletId, setStatementWalletId] = useState(null);
  const [statementTechName, setStatementTechName] = useState('');
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load wallet balances and source accounts
  const loadWalletData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/projects/tech-wallets`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setWallets(data.wallets || []);
          setSourceAccounts(data.source_accounts || []);
          if (data.source_accounts?.length > 0 && !sourceAccountId) {
            setSourceAccountId(data.source_accounts[0].id);
          }
        }
      } else {
        setError('ওয়ালেট ডাটা লোড করা যায়নি।');
      }
    } catch (err) {
      console.error(err);
      setError('সার্ভার এরর');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadWalletData();
    }
  }, [isOpen]);

  // Load transaction history for statement tab
  const loadHistory = async (walletId, techName) => {
    if (!walletId || walletId === 0) {
      setHistoryList([]);
      setStatementWalletId(walletId);
      setStatementTechName(techName);
      return;
    }
    try {
      setLoadingHistory(true);
      setStatementWalletId(walletId);
      setStatementTechName(techName);
      const res = await fetch(`${API}/projects/tech-wallet-history/${walletId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setHistoryList(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Switch to payout tab for a specific technician
  const initiatePayout = (w) => {
    setSelectedTechName(w.tech_name);
    setPayoutAmount(parseFloat(w.balance || 0) > 0 ? parseFloat(w.balance || 0) : '');
    setPayoutNote(`Payment for completed CCTV setup & maintenance`);
    setActiveTab('payout');
  };

  // Submit payout
  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTechName || !sourceAccountId || !payoutAmount || Number(payoutAmount) <= 0) {
      alert('সঠিক তথ্য ও টাকার পরিমাণ দিন।');
      return;
    }

    try {
      setSubmittingPayout(true);
      const res = await fetch(`${API}/projects/tech-payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tech_name: selectedTechName,
          source_account_id: Number(sourceAccountId),
          amount: Number(payoutAmount),
          note: payoutNote
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setPayoutAmount('');
        setPayoutNote('');
        await loadWalletData();
        if (onRefreshProjects) onRefreshProjects();
        setActiveTab('overview');
      } else {
        alert(data.message || 'পরিশোধ ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error(err);
      alert('সার্ভার এরর');
    } finally {
      setSubmittingPayout(false);
    }
  };

  if (!isOpen) return null;

  const totalUnpaidTechBalance = wallets.reduce((sum, w) => sum + parseFloat(w.balance || 0), 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      {/* Print Styles for Voucher */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #payout-voucher-sheet, #payout-voucher-sheet * {
            visibility: visible !important;
          }
          #payout-voucher-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 12mm !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>💼</span>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                টেকনিশিয়ান ওয়ালেট ও পারিশ্রমিক পে-আউট প্যানেল
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              কাজের জমা হওয়া পারিশ্রমিক ব্যালেন্স দেখুন এবং ক্যাশ ড্রয়ার বা ব্যাংক থেকে সরাসরি পরিশোধ করুন
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* TABS & TOTAL BAR */}
        <div style={{ background: '#f8fafc', padding: '10px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'overview' ? '#2563eb' : '#ffffff',
                color: activeTab === 'overview' ? '#ffffff' : '#475569',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'overview' ? '0 2px 4px rgba(37,99,235,0.25)' : 'none'
              }}
            >
              📊 ওয়ালেট সামারি ({wallets.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payout')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'payout' ? '#2563eb' : '#ffffff',
                color: activeTab === 'payout' ? '#ffffff' : '#475569',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              💵 পারিশ্রমিক পরিশোধ (Pay Out)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('statement')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'statement' ? '#2563eb' : '#ffffff',
                color: activeTab === 'statement' ? '#ffffff' : '#475569',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              📜 লেনদেন হিস্ট্রি ও ভাউচার
            </button>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#475569' }}>
            টেকনিশিয়ানদের মোট পাওনা: <strong style={{ color: '#2563eb', fontSize: '0.95rem' }}>৳ {totalUnpaidTechBalance.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* MODAL BODY */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '14px', fontSize: '0.84rem' }}>
              {error}
            </div>
          )}

          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>ওয়ালেট ডাটা লোড হচ্ছে...</p>
          ) : (
            <>
              {/* =========================================================
                  TAB 1: OVERVIEW & WALLET CARDS
                 ========================================================= */}
              {activeTab === 'overview' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                    {wallets.map((w, idx) => {
                      const balance = parseFloat(w.balance || 0);
                      const earned = parseFloat(w.total_earned || 0);
                      const withdrawn = parseFloat(w.total_withdrawn || 0);

                      return (
                        <div
                          key={idx}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '16px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <div>
                                <h4 style={{ margin: '0 0 2px', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                                  {w.tech_name}
                                </h4>
                                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                                  {w.contact || w.tech_source}
                                </span>
                              </div>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                background: w.tech_source === 'user' ? '#eff6ff' : '#f0fdf4',
                                color: w.tech_source === 'user' ? '#1e40af' : '#166534'
                              }}>
                                {w.tech_source === 'user' ? 'Staff' : 'Vendor'}
                              </span>
                            </div>

                            {/* Balance Display */}
                            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 12px', margin: '10px 0', border: '1px solid #f1f5f9' }}>
                              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>বর্তমান ওয়ালেট ব্যালেন্স:</span>
                              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: balance > 0 ? '#2563eb' : '#64748b', marginTop: '2px' }}>
                                ৳ {balance.toLocaleString('en-IN')}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginTop: '4px', borderTop: '1px dashed #cbd5e1', paddingTop: '4px' }}>
                                <span>মোট আয়: <strong>৳ {earned.toLocaleString('en-IN')}</strong></span>
                                <span>উইথড্র: <strong>৳ {withdrawn.toLocaleString('en-IN')}</strong></span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <button
                              type="button"
                              onClick={() => initiatePayout(w)}
                              style={{
                                flex: 1,
                                padding: '8px 10px',
                                background: '#16a34a',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                              }}
                            >
                              💵 টাকা পে করুন
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                loadHistory(w.wallet_id, w.tech_name);
                                setActiveTab('statement');
                              }}
                              style={{
                                padding: '8px 12px',
                                background: '#f1f5f9',
                                color: '#334155',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              title="লেনদেন স্টেটমেন্ট দেখুন"
                            >
                              📜 স্টেটমেন্ট
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* =========================================================
                  TAB 2: PAYOUT / CASHOUT FORM
                 ========================================================= */}
              {activeTab === 'payout' && (
                <div style={{ maxWidth: '540px', margin: '0 auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <h4 style={{ margin: '0 0 14px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    💵 টেকনিশিয়ান পারিশ্রমিক পরিশোধ (Cash Payout)
                  </h4>

                  <form onSubmit={handlePayoutSubmit}>
                    {/* Tech selection */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                        টেকনিশিয়ান নির্বাচন করুন *
                      </label>
                      <select
                        value={selectedTechName}
                        onChange={(e) => {
                          setSelectedTechName(e.target.value);
                          const w = wallets.find(x => x.tech_name === e.target.value);
                          if (w && parseFloat(w.balance || 0) > 0) {
                            setPayoutAmount(parseFloat(w.balance || 0));
                          }
                        }}
                        required
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                      >
                        <option value="">-- নির্বাচন করুন --</option>
                        {wallets.map((w, i) => (
                          <option key={i} value={w.tech_name}>
                            {w.tech_name} (ওয়ালেট ব্যালেন্স: ৳ {parseFloat(w.balance || 0).toLocaleString('en-IN')})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Amount */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                        পরিশোধের পরিমাণ (টাকা ৳) *
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="যেমন: ২০০০"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700, color: '#16a34a', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Source Payment Account */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                        কোথা থেকে টাকা পরিশোধ করবেন (Source Account) *
                      </label>
                      <select
                        value={sourceAccountId}
                        onChange={(e) => setSourceAccountId(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                      >
                        {sourceAccounts.map(sa => (
                          <option key={sa.id} value={sa.id}>
                            {sa.name} ({sa.account_type}) — বর্তমান ফান্ড: ৳ {parseFloat(sa.balance || 0).toLocaleString('en-IN')}
                          </option>
                        ))}
                      </select>
                      <small style={{ color: '#64748b', fontSize: '0.74rem', marginTop: '2px', display: 'block' }}>
                        * নির্বাচিত অ্যাকাউন্ট (যেমন ক্যাশ ড্রয়ার) থেকে স্বয়ংক্রিয়ভাবে টাকা মাইনাস হবে।
                      </small>
                    </div>

                    {/* Note */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                        রেফারেন্স বা পেমেন্ট নোট
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: ক্যামেরা সেটাপ ও কনভেন্স পারিশ্রমিক পরিশোধ"
                        value={payoutNote}
                        onChange={(e) => setPayoutNote(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        disabled={submittingPayout}
                        style={{
                          padding: '8px 20px',
                          borderRadius: '6px',
                          border: 'none',
                          background: submittingPayout ? '#94a3b8' : '#16a34a',
                          color: '#fff',
                          fontWeight: 700,
                          cursor: submittingPayout ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {submittingPayout ? 'পরিশোধ হচ্ছে...' : '✓ পরিশোধ সম্পন্ন করুন'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* =========================================================
                  TAB 3: STATEMENT & VOUCHER PRINT
                 ========================================================= */}
              {activeTab === 'statement' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>টেকনিশিয়ান বাছাই করুন:</span>
                      <select
                        value={statementWalletId || ''}
                        onChange={(e) => {
                          const wId = Number(e.target.value);
                          const w = wallets.find(x => x.wallet_id === wId);
                          loadHistory(wId, w?.tech_name || '');
                        }}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                      >
                        {wallets.map((w, i) => (
                          <option key={i} value={w.wallet_id}>
                            {w.tech_name} (ব্যালেন্স: ৳{parseFloat(w.balance || 0).toLocaleString('en-IN')})
                          </option>
                        ))}
                      </select>
                    </div>

                    {historyList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => window.print()}
                        style={{
                          padding: '6px 14px',
                          background: '#0f172a',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        🖨️ পেমেন্ট ভাউচার প্রিন্ট
                      </button>
                    )}
                  </div>

                  {/* Printable Statement Sheet */}
                  <div
                    id="payout-voucher-sheet"
                    style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
                  >
                    <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>টেকনিশিয়ান লেজার স্টেটমেন্ট ও পারিশ্রমিক ভাউচার</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                          টেকনিশিয়ান: <strong>{statementTechName || 'Selected Technician'}</strong>
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#64748b' }}>
                        তারিখ: {new Date().toLocaleDateString('en-GB')}
                      </div>
                    </div>

                    {loadingHistory ? (
                      <p style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>হিস্ট্রি লোড হচ্ছে...</p>
                    ) : historyList.length === 0 ? (
                      <p style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>এই টেকনিশিয়ানের কোনো লেনদেন রেকর্ড নেই।</p>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                            <th style={{ padding: '8px 10px', textAlign: 'left' }}>তারিখ ও সময়</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left' }}>ধরন (Type)</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left' }}>রেফারেন্স ও কাজের বিবরণ</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>জমা / আয় (৳)</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>উইথড্র / পে (৳)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyList.map((row, idx) => {
                            const isDeposit = row.type === 'deposit';
                            const amt = parseFloat(row.amount || 0);

                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '8px 10px', color: '#64748b', whiteSpace: 'nowrap' }}>
                                  {new Date(row.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td style={{ padding: '8px 10px' }}>
                                  <span style={{
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    background: isDeposit ? '#dcfce7' : '#fee2e2',
                                    color: isDeposit ? '#15803d' : '#991b1b'
                                  }}>
                                    {isDeposit ? 'ইনকাম (আয়)' : 'ক্যাশ পে'}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 10px' }}>
                                  <strong>{row.reference}</strong>
                                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{row.note}</div>
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                                  {isDeposit ? `+ ৳${amt.toLocaleString('en-IN')}` : '-'}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                                  {!isDeposit ? `- ৳${amt.toLocaleString('en-IN')}` : '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}

                    {/* Voucher Signature Line */}
                    <div style={{ marginTop: '36px', display: 'flex', justifyContent: 'space-between', paddingTop: '10px' }}>
                      <div style={{ textAlign: 'center', width: '150px' }}>
                        <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                          টেকনিশিয়ান সই
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', width: '150px' }}>
                        <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                          ক্যাশিয়ার / ইনচার্জ সই
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
