import React, { useState, useEffect } from 'react';
import API from '../../../services/api';
import TechWalletOverviewTab from './techWallet/TechWalletOverviewTab';
import TechPayoutForm from './techWallet/TechPayoutForm';
import TechWalletStatementTab from './techWallet/TechWalletStatementTab';
import TechWalletRequestsTab from './techWallet/TechWalletRequestsTab';

export default function TechWalletModal({ isOpen, onClose, onRefreshProjects }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'payout' | 'statement' | 'requests'
  const [wallets, setWallets] = useState([]);
  const [sourceAccounts, setSourceAccounts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
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
        setError('Failed to load wallet data.');
      }
    } catch (err) {
      console.error(err);
      setError('Server error');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const res = await fetch(`${API}/staff/wallet-requests/pending`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPendingRequests(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching pending wallet requests:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadWalletData();
      loadPendingRequests();
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
    setPayoutAmount(
      parseFloat(w.balance || 0) > 0 ? parseFloat(w.balance || 0) : ''
    );
    setPayoutNote('Payment for completed CCTV setup & maintenance');
    setActiveTab('payout');
  };

  // Submit payout
  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    if (
      !selectedTechName ||
      !sourceAccountId ||
      !payoutAmount ||
      Number(payoutAmount) <= 0
    ) {
      alert('Please enter a valid technician, payment account, and amount.');
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
          note: payoutNote,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'Payout completed successfully.');
        setPayoutAmount('');
        setPayoutNote('');
        await loadWalletData();
        if (onRefreshProjects) onRefreshProjects();
        setActiveTab('overview');
      } else {
        alert(data.message || 'Payout failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Server error occurred.');
    } finally {
      setSubmittingPayout(false);
    }
  };

  if (!isOpen) return null;

  const totalUnpaidTechBalance = wallets.reduce(
    (sum, w) => sum + parseFloat(w.balance || 0),
    0
  );

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
        padding: '16px',
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
          border: '1px solid #cbd5e1',
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
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>💼</span>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: '#f8fafc',
                }}
              >
                Technician Wallet & Payout Management
              </h3>
            </div>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '0.8rem',
                color: '#94a3b8',
              }}
            >
              View accumulated earnings and disburse payments directly from cash
              drawer or bank accounts
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.4rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* TABS & TOTAL BAR */}
        <div
          style={{
            background: '#f8fafc',
            padding: '10px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
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
                boxShadow:
                  activeTab === 'overview'
                    ? '0 2px 4px rgba(37,99,235,0.25)'
                    : 'none',
              }}
            >
              📊 Wallet Summary ({wallets.length})
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
                cursor: 'pointer',
              }}
            >
              💵 Disburse Payout
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
                cursor: 'pointer',
              }}
            >
              📜 Transaction History & Voucher
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'requests' ? '#2563eb' : '#ffffff',
                color: activeTab === 'requests' ? '#ffffff' : '#475569',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>📨 Requests</span>
              {pendingRequests.length > 0 && (
                <span
                  style={{
                    background: activeTab === 'requests' ? '#ffffff' : '#ef4444',
                    color: activeTab === 'requests' ? '#2563eb' : '#ffffff',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                  }}
                >
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#475569' }}>
            Total Technician Payable:{' '}
            <strong style={{ color: '#2563eb', fontSize: '0.95rem' }}>
              ৳ {totalUnpaidTechBalance.toLocaleString('en-IN')}
            </strong>
          </div>
        </div>

        {/* MODAL BODY */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fee2e2',
                color: '#b91c1c',
                borderRadius: '8px',
                marginBottom: '14px',
                fontSize: '0.84rem',
              }}
            >
              {error}
            </div>
          )}

          {loading ? (
            <p
              style={{
                textAlign: 'center',
                padding: '40px',
                color: '#64748b',
              }}
            >
              Loading wallet data...
            </p>
          ) : (
            <>
              {activeTab === 'overview' && (
                <TechWalletOverviewTab
                  wallets={wallets}
                  initiatePayout={initiatePayout}
                  loadHistory={loadHistory}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'payout' && (
                <TechPayoutForm
                  wallets={wallets}
                  sourceAccounts={sourceAccounts}
                  selectedTechName={selectedTechName}
                  setSelectedTechName={setSelectedTechName}
                  sourceAccountId={sourceAccountId}
                  setSourceAccountId={setSourceAccountId}
                  payoutAmount={payoutAmount}
                  setPayoutAmount={setPayoutAmount}
                  payoutNote={payoutNote}
                  setPayoutNote={setPayoutNote}
                  submittingPayout={submittingPayout}
                  handlePayoutSubmit={handlePayoutSubmit}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'statement' && (
                <TechWalletStatementTab
                  wallets={wallets}
                  statementWalletId={statementWalletId}
                  statementTechName={statementTechName}
                  historyList={historyList}
                  loadingHistory={loadingHistory}
                  loadHistory={loadHistory}
                />
              )}

              {activeTab === 'requests' && (
                <TechWalletRequestsTab
                  pendingRequests={pendingRequests}
                  sourceAccounts={sourceAccounts}
                  loadPendingRequests={loadPendingRequests}
                  loadWalletData={loadWalletData}
                  onRefreshProjects={onRefreshProjects}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
