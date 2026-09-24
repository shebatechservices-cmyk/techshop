import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';
import PartyProfileModal from '../../components/modals/PartyProfileModal';
import DayCloseModal from '../../components/modals/DayCloseModal';
import AddAccountModal from '../../components/modals/AddAccountModal';
import AddPaymentMethodModal from '../../components/modals/AddPaymentMethodModal';
import AccountLedgersSubpage from './subpages/AccountLedgersSubpage';
import PartiesLedgerSubpage from './subpages/PartiesLedgerSubpage';

export default function Accounts({ initialTab, onNavigateToExpenses }) {
  const [wallets, setWallets] = useState([]);
  const [tenders, setTenders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sub-page Routing: 'ledgers' | 'parties'
  const [activeSubpage, setActiveSubpage] = useState(
    initialTab === 'parties' || initialTab === 'parties_ledger' ? 'parties' : 'ledgers'
  );

  useEffect(() => {
    if (initialTab) {
      if (initialTab === 'parties' || initialTab === 'parties_ledger') {
        setActiveSubpage('parties');
      } else {
        setActiveSubpage('ledgers');
      }
    }
  }, [initialTab]);

  const handleSubpageChange = (subpage) => {
    setActiveSubpage(subpage);
    try {
      window.location.hash = subpage === 'parties' ? 'accounts/parties' : 'accounts/ledgers';
    } catch (_) {}
  };

  // Top Modal States
  const [isDayCloseOpen, setIsDayCloseOpen] = useState(false);
  const [isAddPaymentMethodOpen, setIsAddPaymentMethodOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

  // Party Directory State
  const [parties, setParties] = useState([]);
  const [partyTypeFilter, setPartyTypeFilter] = useState('all');
  const [partySearch, setPartySearch] = useState('');
  const [partyPage, setPartyPage] = useState(1);
  const [partyPagination, setPartyPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [partyCounts, setPartyCounts] = useState({ total: 0, customer: 0, supplier: 0, staff: 0 });
  const [loadingParties, setLoadingParties] = useState(false);

  // Party Profile Modal State
  const [selectedPartyModal, setSelectedPartyModal] = useState({
    isOpen: false,
    partyType: 'customer',
    partyId: null,
    initialTab: 'overview',
  });

  // Transfer modal state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    from_wallet_id: '',
    to_wallet_id: '',
    amount: '',
    note: '',
    transaction_id: '',
  });
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');

  // Deposit / Withdraw modal state
  const [isCashFlowOpen, setIsCashFlowOpen] = useState(false);
  const [cashFlowMode, setCashFlowMode] = useState('deposit'); // 'deposit' | 'withdraw'
  const [cashFlowAccount, setCashFlowAccount] = useState(null);
  const [cashFlowForm, setCashFlowForm] = useState({ amount: '', note: '', transaction_id: '' });
  const [cashFlowLoading, setCashFlowLoading] = useState(false);
  const [cashFlowError, setCashFlowError] = useState('');

  // Account edit / delete state
  const [isEditWalletOpen, setIsEditWalletOpen] = useState(false);
  const [editWalletForm, setEditWalletForm] = useState({
    id: '',
    name: '',
    account_type: 'drawer',
    account_number: '',
    tender_id: '',
  });
  const [editWalletLoading, setEditWalletLoading] = useState(false);

  // Transaction Audit / Details Modal state
  const [selectedTxForDetails, setSelectedTxForDetails] = useState(null);

  // Central Ledger Search & Filter state
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [selectedTxTypeFilter, setSelectedTxTypeFilter] = useState('all');
  const [selectedWalletFilter, setSelectedWalletFilter] = useState('all');

  // Load accounts and transactions
  const loadAccountsData = async () => {
    try {
      setLoading(true);
      setError('');

      const [walletsRes, txRes, tendersRes] = await Promise.all([
        fetch(`${API}/accounts/wallets`),
        fetch(`${API}/accounts/transactions`).catch(() => null),
        fetch(`${API}/accounts/tenders`).catch(() => null),
      ]);

      if (walletsRes.ok) {
        const walletsData = await walletsRes.json();
        setWallets(walletsData.data || []);
      } else {
        setError('Failed to load account data');
      }

      if (txRes && txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.data || (Array.isArray(txData) ? txData : []));
      }

      if (tendersRes && tendersRes.ok) {
        const tendersData = await tendersRes.json();
        setTenders(tendersData.data || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Unable to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountsData();
  }, []);

  // Listen for live expense events to keep balances synchronized
  useEffect(() => {
    const handleExpenseChanged = () => {
      loadAccountsData();
    };
    window.addEventListener('expense_changed', handleExpenseChanged);
    return () => window.removeEventListener('expense_changed', handleExpenseChanged);
  }, []);

  const loadPartiesData = async () => {
    try {
      setLoadingParties(true);
      const queryParams = new URLSearchParams();
      if (partyTypeFilter !== 'all') queryParams.append('type', partyTypeFilter);
      if (partySearch.trim()) queryParams.append('search', partySearch.trim());
      queryParams.append('page', partyPage);
      queryParams.append('limit', 20);

      const res = await fetch(`${API}/parties?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setParties(data.data || []);
        setPartyPagination(data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
        if (data.counts) setPartyCounts(data.counts);
      }
    } catch (err) {
      console.error('loadPartiesData error:', err);
    } finally {
      setLoadingParties(false);
    }
  };

  useEffect(() => {
    if (activeSubpage === 'parties') {
      loadPartiesData();
    }
  }, [activeSubpage, partyTypeFilter, partyPage, partySearch]);

  // Delete an account (supports force deletion)
  const handleDeleteWallet = async (wallet) => {
    let url = `${API}/accounts/wallets/${wallet.id}`;
    if (!wallet.is_deletable) {
      if (
        !window.confirm(
          `⚠️ Account "${wallet.account_name}" has recorded transactions or balance.\n\nDo you want to FORCE REMOVE this account and its associated records?`
        )
      ) {
        return;
      }
      url += '?force=true';
    } else {
      if (!window.confirm(`Are you sure you want to delete account "${wallet.account_name}"?`)) return;
    }
    try {
      const res = await fetch(url, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || 'Failed to delete account');
        return;
      }
      setSuccessMsg(data.message || 'Account deleted successfully');
      await loadAccountsData();
    } catch (err) {
      console.error(err);
      setError('Server error while deleting account');
    }
  };

  // Open edit modal for a wallet / account
  const openEditWallet = (wallet) => {
    setEditWalletForm({
      id: String(wallet.id),
      name: wallet.account_name || wallet.name || '',
      account_type: (wallet.account_type || 'drawer').toLowerCase(),
      account_number: wallet.account_number || '',
      tender_id: wallet.tender_id ? String(wallet.tender_id) : '',
    });
    setIsEditWalletOpen(true);
    setError('');
    setSuccessMsg('');
  };

  // Save wallet / account edit
  const handleSaveWalletEdit = async (e) => {
    e.preventDefault();
    if (!editWalletForm.name.trim()) {
      setError('Please enter an account name');
      return;
    }
    try {
      setEditWalletLoading(true);
      setError('');
      const res = await fetch(`${API}/accounts/wallets/${editWalletForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editWalletForm.name.trim(),
          account_type: editWalletForm.account_type,
          account_number: editWalletForm.account_number || '',
          tender_id: editWalletForm.tender_id ? parseInt(editWalletForm.tender_id, 10) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to update account');
      }
      setIsEditWalletOpen(false);
      setSuccessMsg(data.message || 'Account updated successfully');
      await loadAccountsData();
    } catch (err) {
      setError(err.message || 'Failed to update account');
    } finally {
      setEditWalletLoading(false);
    }
  };

  // Open deposit/withdraw modal for a wallet
  const openCashFlow = (wallet, mode) => {
    setCashFlowMode(mode);
    setCashFlowAccount(wallet);
    setCashFlowForm({ amount: '', note: '', transaction_id: '' });
    setCashFlowError('');
    setIsCashFlowOpen(true);
  };

  // Submit deposit / withdraw
  const handleCashFlowSubmit = async (e) => {
    e.preventDefault();
    setCashFlowError('');
    setSuccessMsg('');
    const amount = Number(cashFlowForm.amount);
    if (!cashFlowAccount || !amount || amount <= 0) {
      setCashFlowError('Please enter a valid amount.');
      return;
    }
    try {
      setCashFlowLoading(true);
      const res = await fetch(`${API}/accounts/${cashFlowMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: cashFlowAccount.id,
          amount,
          reference: cashFlowMode === 'deposit' ? 'Manual Deposit' : 'Manual Withdraw',
          note: cashFlowForm.note.trim() || '',
          transaction_id: cashFlowForm.transaction_id.trim() || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Operation failed');
      setIsCashFlowOpen(false);
      setSuccessMsg(data.message || `Cash ${cashFlowMode} successful`);
      await loadAccountsData();
    } catch (err) {
      setCashFlowError(err.message || `Failed to ${cashFlowMode}`);
    } finally {
      setCashFlowLoading(false);
    }
  };

  // Submit fund transfer
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setTransferError('');
    setSuccessMsg('');

    if (!transferForm.from_wallet_id || !transferForm.to_wallet_id) {
      setTransferError('Please select both source and destination accounts');
      return;
    }

    if (transferForm.from_wallet_id === transferForm.to_wallet_id) {
      setTransferError('Cannot transfer funds between the same wallet');
      return;
    }

    const transferAmount = Number(transferForm.amount);
    if (!transferAmount || transferAmount <= 0) {
      setTransferError('Please enter a valid transfer amount');
      return;
    }

    const sourceWallet = wallets.find((w) => String(w.id) === String(transferForm.from_wallet_id));
    if (sourceWallet && Number(sourceWallet.balance) < transferAmount) {
      setTransferError(
        `Insufficient balance! Current balance: ৳ ${Number(sourceWallet.balance).toLocaleString('en-IN')}`
      );
      return;
    }

    try {
      setTransferLoading(true);
      const res = await fetch(`${API}/accounts/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_wallet_id: Number(transferForm.from_wallet_id),
          to_wallet_id: Number(transferForm.to_wallet_id),
          amount: transferAmount,
          note: transferForm.note.trim(),
          transaction_id: transferForm.transaction_id.trim() || '',
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Transfer failed');
      }

      setSuccessMsg('Funds transferred successfully!');
      setIsTransferOpen(false);
      setTransferForm({ from_wallet_id: '', to_wallet_id: '', amount: '', note: '', transaction_id: '' });
      await loadAccountsData();
    } catch (err) {
      setTransferError(err.message || 'Failed to transfer funds');
    } finally {
      setTransferLoading(false);
    }
  };

  // Reversal handler for transactions
  const handleReverseTransaction = async (tx) => {
    const reason = window.prompt(`Provide an audit note for reversing Transaction #${tx.id}:`);
    if (reason === null) return;
    try {
      const res = await fetch(`${API}/accounts/transactions/${tx.id}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || 'Manual Reversal' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Transaction #${tx.id} reversed successfully.`);
        await loadAccountsData();
      } else {
        setError(data.message || 'Failed to reverse transaction');
      }
    } catch (err) {
      setError(err.message || 'Error reversing transaction');
    }
  };

  // Calculate total balance across all accounts
  const totalBalance = wallets.reduce((acc, curr) => acc + Number(curr.balance || 0), 0);

  // Ledger Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedTxTypeFilter !== 'all') {
        const isCredit =
          tx.transaction_type === 'credit' ||
          ['credit', 'in', 'deposit', 'due_receive', 'advance_receive', 'sale_revenue'].includes(tx.type);
        const isDebit =
          tx.transaction_type === 'debit' ||
          ['debit', 'out', 'withdraw', 'due_payment', 'expense', 'purchase_cost'].includes(tx.type);
        const isTransfer =
          tx.source_type === 'transfer' || ['transfer', 'transfer_in', 'transfer_out'].includes(tx.type);

        if (selectedTxTypeFilter === 'credit' && !isCredit) return false;
        if (selectedTxTypeFilter === 'debit' && !isDebit) return false;
        if (selectedTxTypeFilter === 'transfer' && !isTransfer) return false;
      }
      if (selectedWalletFilter !== 'all') {
        const wId = Number(selectedWalletFilter);
        if (tx.wallet_id !== wId && tx.account_id !== wId) return false;
      }
      if (txSearchQuery.trim()) {
        const q = txSearchQuery.toLowerCase();
        const ref = (tx.reference || '').toLowerCase();
        const note = (tx.note || tx.description || '').toLowerCase();
        const wName = (tx.wallet_name || tx.account_name || '').toLowerCase();
        const trxId = (tx.transaction_id || '').toLowerCase();
        return ref.includes(q) || note.includes(q) || wName.includes(q) || trxId.includes(q);
      }
      return true;
    });
  }, [transactions, selectedTxTypeFilter, selectedWalletFilter, txSearchQuery]);

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'inherit' }}>
      {/* 1. Unified Compact Header & Tab Bar (Single Row) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1.5px solid #e2e8f0',
        }}
      >
        {/* Left: Compact Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>🏦</span>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
              Accounts & Ledgers
            </h2>
            <span style={{ color: '#64748b', fontSize: '0.74rem' }}>
              Manage cash drawers, banks, ledgers and party accounts
            </span>
          </div>
        </div>

        {/* Center: Integrated Tab Navigation Pills */}
        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
          <button
            type="button"
            onClick={() => handleSubpageChange('ledgers')}
            style={{
              padding: '6px 12px',
              background: activeSubpage === 'ledgers' ? '#ffffff' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: activeSubpage === 'ledgers' ? '#0284c7' : '#64748b',
              fontWeight: activeSubpage === 'ledgers' ? 700 : 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeSubpage === 'ledgers' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span>📂 Account Ledgers</span>
            <span
              style={{
                background: activeSubpage === 'ledgers' ? '#e0f2fe' : '#e2e8f0',
                color: activeSubpage === 'ledgers' ? '#0284c7' : '#64748b',
                padding: '1px 6px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {wallets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSubpageChange('parties')}
            style={{
              padding: '6px 12px',
              background: activeSubpage === 'parties' ? '#ffffff' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: activeSubpage === 'parties' ? '#0284c7' : '#64748b',
              fontWeight: activeSubpage === 'parties' ? 700 : 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeSubpage === 'parties' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span>👥 Parties Ledger</span>
            <span
              style={{
                background: activeSubpage === 'parties' ? '#e0f2fe' : '#e2e8f0',
                color: activeSubpage === 'parties' ? '#0284c7' : '#64748b',
                padding: '1px 6px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {partyCounts.total || parties.length}
            </span>
          </button>
        </div>

        {/* Right: Action Buttons */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsAddAccountOpen(true)}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '7px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)',
            }}
          >
            <span>+</span> New Account
          </button>

          <button
            type="button"
            onClick={() => setIsAddPaymentMethodOpen(true)}
            style={{
              background: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '7px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)',
            }}
          >
            <span>💳</span> Payment Method
          </button>

          <button
            type="button"
            onClick={() => {
              setIsTransferOpen(true);
              setTransferError('');
            }}
            style={{
              background: '#0891b2',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '7px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 4px rgba(8, 145, 178, 0.2)',
            }}
          >
            <span>⇄</span> Transfer
          </button>

          <button
            type="button"
            onClick={() => setIsDayCloseOpen(true)}
            style={{
              background: '#d97706',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '7px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)',
            }}
          >
            <span>🌅</span> Z-Report
          </button>

          {onNavigateToExpenses && (
            <button
              type="button"
              onClick={onNavigateToExpenses}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                color: '#334155',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>📊</span> Expenses »
            </button>
          )}

          <button
            type="button"
            onClick={loadAccountsData}
            disabled={loading}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              color: '#475569',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Refresh Ledger"
          >
            <span>🔄</span>
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {error && (
        <div style={{ padding: '10px 14px', marginBottom: '12px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            style={{ padding: '2px 8px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.75rem', color: '#dc2626', cursor: 'pointer' }}
          >
            Dismiss
          </button>
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '10px 14px', marginBottom: '12px', borderRadius: '8px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg('')}
            style={{ padding: '2px 8px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.75rem', color: '#059669', cursor: 'pointer' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Sub-page Content Rendering */}
      {activeSubpage === 'ledgers' && (
        loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p style={{ fontWeight: 700, color: '#0f172a', margin: 0, fontSize: '0.95rem' }}>Loading accounts and ledger data...</p>
            <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '4px 0 0 0' }}>Synchronizing balances with database</p>
          </div>
        ) : (
          <div>
            {/* 3. Stats Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Total Net Balance
                </span>
                <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#059669', fontWeight: 800, fontFamily: 'monospace' }}>
                  ৳ {totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Across all active financial accounts</span>
              </div>

              <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Active Accounts
                </span>
                <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#0284c7', fontWeight: 800 }}>
                  {wallets.length} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>Configured</span>
                </h3>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {wallets.filter((w) => w.account_type === 'cash' || w.account_type === 'drawer').length} Cash · {wallets.filter((w) => w.account_type === 'bank').length} Bank · {wallets.filter((w) => !['cash', 'drawer', 'bank'].includes(w.account_type)).length} MFS
                </span>
              </div>

              <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Audit & Movements
                </span>
                <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#0f172a', fontWeight: 800 }}>
                  {transactions.length} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>Records</span>
                </h3>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {transactions.filter(t => t.transaction_type === 'credit' || ['credit','in','deposit','due_receive','advance_receive','sale_revenue'].includes(t.type)).length} Inflow · {transactions.filter(t => t.source_type === 'transfer' || ['transfer','transfer_in','transfer_out'].includes(t.type)).length} Transfers
                </span>
              </div>
            </div>

            {/* Section Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Payment Accounts & Drawers
                </h3>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: '#e0f2fe', color: '#0369a1' }}>
                  {wallets.length} ACCOUNTS
                </span>
              </div>
            </div>

            {/* 4. Account Cards Grid */}
            {wallets.length === 0 ? (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '40px 20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', marginBottom: '14px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🏦</div>
                <h4 style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0', fontSize: '0.95rem' }}>No Accounts Configured</h4>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 auto 12px auto', maxWidth: '360px' }}>
                  You have not registered any cash drawers, bank branches, or digital wallets yet.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddAccountOpen(true)}
                  style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>+</span> Create First Account
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                {wallets.map((wallet) => {
                  const isCash = wallet.account_type === 'cash' || wallet.account_type === 'drawer';
                  const isBank = wallet.account_type === 'bank';
                  const balNum = Number(wallet.balance || 0);

                  const iconConfig = isCash
                    ? { icon: '💵', bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', badgeBg: '#dcfce7', badgeText: '#15803d', typeLabel: 'Cash Drawer' }
                    : isBank
                    ? { icon: '🏦', bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', badgeBg: '#dbeafe', badgeText: '#1d4ed8', typeLabel: 'Bank Account' }
                    : {
                        icon: '📱',
                        bg: '#f5f3ff',
                        text: '#7c3aed',
                        border: '#ddd6fe',
                        badgeBg: '#f3e8ff',
                        badgeText: '#6b21a8',
                        typeLabel: wallet.account_type ? wallet.account_type.toUpperCase() : 'MFS / Wallet',
                      };

                  return (
                    <div
                      key={wallet.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '8px',
                        transition: 'box-shadow 0.15s ease',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '8px',
                                background: iconConfig.bg,
                                color: iconConfig.text,
                                border: `1px solid ${iconConfig.border}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.1rem',
                                flexShrink: 0,
                              }}
                            >
                              {iconConfig.icon}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <h4
                                style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                title={wallet.account_name}
                              >
                                {wallet.account_name}
                              </h4>
                              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                {wallet.account_number ? `#${wallet.account_number}` : wallet.location ? `📍 ${wallet.location}` : iconConfig.typeLabel}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: iconConfig.badgeBg,
                                color: iconConfig.badgeText,
                                textTransform: 'uppercase',
                              }}
                            >
                              {iconConfig.typeLabel}
                            </span>
                            {wallet.tender_name && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 600,
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  background: '#e0f2fe',
                                  color: '#0369a1',
                                }}
                              >
                                💳 {wallet.tender_name}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Balance display */}
                        <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                            Available Balance
                          </div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: balNum < 0 ? '#dc2626' : '#0f172a', fontFamily: 'monospace' }}>
                            ৳ {balNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>

                      {/* Card bottom actions */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '4px', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => openCashFlow(wallet, 'deposit')}
                          style={{
                            background: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                          }}
                          title="Deposit cash"
                        >
                          <span>⬆️</span> Deposit
                        </button>
                        <button
                          type="button"
                          onClick={() => openCashFlow(wallet, 'withdraw')}
                          style={{
                            background: '#f59e0b',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                          }}
                          title="Withdraw cash"
                        >
                          <span>⬇️</span> Withdraw
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditWallet(wallet)}
                          style={{
                            background: '#ffffff',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                          }}
                          title="Edit Account Details"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWallet(wallet)}
                          style={{
                            background: '#ffffff',
                            color: '#dc2626',
                            border: '1px solid #fca5a5',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                          }}
                          title="Delete Account"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Central Transaction Ledger Table */}
            <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Central Account Ledger
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Complete audit trail of all cash, bank, and digital ledger movements
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Search ledger..."
                    value={txSearchQuery}
                    onChange={(e) => setTxSearchQuery(e.target.value)}
                    style={{
                      width: '180px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      outline: 'none',
                      background: '#ffffff',
                    }}
                  />

                  {/* Filter Pills */}
                  <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '6px', gap: '2px' }}>
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'credit', label: '🟢 Inflow' },
                      { id: 'debit', label: '🔴 Outflow' },
                      { id: 'transfer', label: '🔵 Transfer' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedTxTypeFilter(tab.id)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '5px',
                          border: 'none',
                          background: selectedTxTypeFilter === tab.id ? '#0284c7' : 'transparent',
                          color: selectedTxTypeFilter === tab.id ? '#ffffff' : '#64748b',
                          fontWeight: selectedTxTypeFilter === tab.id ? 700 : 600,
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <select
                    value={selectedWalletFilter}
                    onChange={(e) => setSelectedWalletFilter(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.78rem',
                      background: '#ffffff',
                      color: '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="all">All Accounts</option>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.account_name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={loadAccountsData}
                    disabled={loading}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      color: '#475569',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                    title="Refresh Ledger"
                  >
                    🔄
                  </button>
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '0.85rem' }}>
                  No transaction records found matching the filter criteria.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700 }}>
                        <th style={{ padding: '8px 12px' }}>Date & Time</th>
                        <th style={{ padding: '8px 12px' }}>Account / Drawer</th>
                        <th style={{ padding: '8px 12px' }}>Type</th>
                        <th style={{ padding: '8px 12px' }}>Reference</th>
                        <th style={{ padding: '8px 12px' }}>Note / Description</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Amount</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Running Balance</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((tx) => {
                        const isCredit =
                          tx.transaction_type === 'credit' ||
                          ['credit', 'in', 'deposit', 'due_receive', 'advance_receive', 'sale_revenue'].includes(
                            tx.type
                          );
                        return (
                          <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 12px', color: '#64748b', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>
                              {new Date(tx.created_at || tx.timestamp || tx.date).toLocaleString('en-GB', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>
                              {tx.account_name || tx.wallet_name || `A/C #${tx.account_id || tx.wallet_id}`}
                            </td>
                            <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: isCredit ? '#dcfce7' : '#fee2e2',
                                  color: isCredit ? '#15803d' : '#b91c1c',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {isCredit ? 'Inflow' : 'Outflow'}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ fontWeight: 600, color: '#0369a1', fontSize: '0.8rem' }}>
                                {tx.reference || '—'}
                              </div>
                              {tx.transaction_id && (
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                                  TrxID: {tx.transaction_id}
                                </div>
                              )}
                            </td>
                            <td
                              style={{ padding: '8px 12px', color: '#475569', fontSize: '0.78rem', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                              title={tx.note || tx.description || '—'}
                            >
                              {tx.note || tx.description || '—'}
                            </td>
                            <td
                              style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'monospace', color: isCredit ? '#16a34a' : '#dc2626' }}
                            >
                              {isCredit ? '+ ' : '- '}৳{' '}
                              {Number(tx.amount || 0).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                              {tx.balance_after !== null && tx.balance_after !== undefined
                                ? `৳ ${Number(tx.balance_after || 0).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}`
                                : '—'}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedTxForDetails(tx)}
                                  style={{
                                    padding: '3px 8px',
                                    background: '#ffffff',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '5px',
                                    color: '#334155',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                  title="View Details"
                                >
                                  📄 Details
                                </button>
                                {tx.is_reversible && (
                                  <button
                                    type="button"
                                    onClick={() => handleReverseTransaction(tx)}
                                    style={{
                                      padding: '3px 8px',
                                      background: '#fff1f2',
                                      border: '1px solid #fecdd3',
                                      borderRadius: '5px',
                                      color: '#e11d48',
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                    }}
                                    title="Reverse Transaction"
                                  >
                                    ↩️ Reverse
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {activeSubpage === 'parties' && (
        <PartiesLedgerSubpage
          parties={parties}
          partyCounts={partyCounts}
          partyTypeFilter={partyTypeFilter}
          setPartyTypeFilter={setPartyTypeFilter}
          partySearch={partySearch}
          setPartySearch={setPartySearch}
          partyPage={partyPage}
          setPartyPage={setPartyPage}
          partyPagination={partyPagination}
          loadingParties={loadingParties}
          onOpenPartyModal={(partyType, partyId, initialTab) =>
            setSelectedPartyModal({ isOpen: true, partyType, partyId, initialTab })
          }
          onRefresh={loadPartiesData}
        />
      )}

      {/* 4. Central Modals with high zIndex: 10000 */}

      {/* Add Payment Method Modal */}
      <AddPaymentMethodModal
        isOpen={isAddPaymentMethodOpen}
        onClose={() => setIsAddPaymentMethodOpen(false)}
        onSuccess={() => {
          setSuccessMsg('Payment method saved successfully!');
          loadAccountsData();
        }}
      />

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onSuccess={() => {
          setSuccessMsg('New account created successfully!');
          loadAccountsData();
        }}
      />

      {/* Edit Account Modal */}
      {isEditWalletOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
            boxSizing: 'border-box',
          }}
          onClick={() => setIsEditWalletOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200"
            style={{ position: 'relative', zIndex: 10001 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 m-0">Edit Account</h3>
              <button
                type="button"
                onClick={() => setIsEditWalletOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWalletEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editWalletForm.name}
                  onChange={(e) => setEditWalletForm({ ...editWalletForm, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={editWalletForm.tender_id || ''}
                  onChange={(e) => setEditWalletForm({ ...editWalletForm, tender_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="">-- Select Payment Method --</option>
                  {tenders.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Classification
                </label>
                <select
                  value={editWalletForm.account_type}
                  onChange={(e) => setEditWalletForm({ ...editWalletForm, account_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="drawer">💵 Cash Drawer</option>
                  <option value="cash">💵 Cash In Hand</option>
                  <option value="bank">🏦 Bank Account</option>
                  <option value="bkash">📱 bKash Merchant</option>
                  <option value="nagad">📱 Nagad Merchant</option>
                  <option value="rocket">📱 DBBL Rocket</option>
                  <option value="wallet">👛 Digital Wallet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account / Mobile / Branch Number
                </label>
                <input
                  type="text"
                  value={editWalletForm.account_number}
                  onChange={(e) => setEditWalletForm({ ...editWalletForm, account_number: e.target.value })}
                  placeholder="e.g. 01700-000000 or A/C 205.120.450"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditWalletOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editWalletLoading}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition disabled:opacity-60 cursor-pointer shadow-xs"
                >
                  {editWalletLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fund Transfer Modal */}
      {isTransferOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
            boxSizing: 'border-box',
          }}
          onClick={() => setIsTransferOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200"
            style={{ position: 'relative', zIndex: 10001 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 m-0">Fund Transfer</h3>
              <button
                type="button"
                onClick={() => setIsTransferOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {transferError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs mb-4">
                {transferError}
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  From Account / Wallet <span className="text-red-500">*</span>
                </label>
                <select
                  value={transferForm.from_wallet_id}
                  onChange={(e) => setTransferForm({ ...transferForm, from_wallet_id: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Select source wallet</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.account_name} (Balance: ৳ {Number(w.balance).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  To Account / Wallet <span className="text-red-500">*</span>
                </label>
                <select
                  value={transferForm.to_wallet_id}
                  onChange={(e) => setTransferForm({ ...transferForm, to_wallet_id: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Select destination wallet</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.account_name} (Balance: ৳ {Number(w.balance).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transfer Amount (৳) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transfer Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Daily cash deposit to Bank, Cash to Petty Cash"
                  value={transferForm.note}
                  onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transaction ID (MFS/Bank Reference)
                </label>
                <input
                  type="text"
                  placeholder="e.g. TrxID 9X7H4Z2M or Bank ref #"
                  value={transferForm.transaction_id}
                  onChange={(e) => setTransferForm({ ...transferForm, transaction_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferLoading}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed shadow-xs cursor-pointer"
                >
                  {transferLoading ? 'Processing...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit / Withdraw Modal */}
      {isCashFlowOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
            boxSizing: 'border-box',
          }}
          onClick={() => setIsCashFlowOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200"
            style={{ position: 'relative', zIndex: 10001 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 m-0">
                  {cashFlowMode === 'deposit' ? '⬆️ Deposit Cash Into Account' : '⬇️ Withdraw Cash From Account'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-0 font-medium">
                  {cashFlowAccount ? cashFlowAccount.account_name : ''} (Balance: ৳{' '}
                  {Number(cashFlowAccount ? cashFlowAccount.balance : 0).toLocaleString('en-IN')})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCashFlowOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {cashFlowError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs mb-4">
                {cashFlowError}
              </div>
            )}

            <form onSubmit={handleCashFlowSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount (৳) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={cashFlowForm.amount}
                  onChange={(e) => setCashFlowForm({ ...cashFlowForm, amount: e.target.value })}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note / Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Owner capital deposit, Cash withdrawal for emergency"
                  value={cashFlowForm.note}
                  onChange={(e) => setCashFlowForm({ ...cashFlowForm, note: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference / Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bank Voucher #, TrxID"
                  value={cashFlowForm.transaction_id}
                  onChange={(e) => setCashFlowForm({ ...cashFlowForm, transaction_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCashFlowOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cashFlowLoading}
                  className={`px-5 py-2 rounded-lg text-white font-semibold text-sm transition disabled:opacity-60 cursor-pointer shadow-xs ${
                    cashFlowMode === 'deposit'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {cashFlowLoading
                    ? 'Processing...'
                    : cashFlowMode === 'deposit'
                    ? 'Confirm Deposit'
                    : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Party Profile & Ledgers Modal */}
      {selectedPartyModal.isOpen && (
        <PartyProfileModal
          isOpen={selectedPartyModal.isOpen}
          partyType={selectedPartyModal.partyType}
          partyId={selectedPartyModal.partyId}
          initialTab={selectedPartyModal.initialTab}
          onClose={() => setSelectedPartyModal((prev) => ({ ...prev, isOpen: false }))}
          onPartyUpdated={() => {
            loadPartiesData();
            loadAccountsData();
          }}
        />
      )}

      {/* Daily Cash Closing (Z-Report) Modal */}
      <DayCloseModal isOpen={isDayCloseOpen} onClose={() => setIsDayCloseOpen(false)} />

      {/* View-Only Audit Record & Receipt Details Modal */}
      {selectedTxForDetails && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
            boxSizing: 'border-box',
          }}
          onClick={() => setSelectedTxForDetails(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden"
            style={{ position: 'relative', zIndex: 10001 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900 m-0">
                  📄 Transaction Audit Record #{selectedTxForDetails.id}
                </h3>
                <small className="text-xs text-slate-500">Immutable Central Ledger Entry</small>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxForDetails(null)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              {/* Compliance & Immutability Badge */}
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl mb-4 flex items-center gap-2.5 text-xs text-emerald-800 font-semibold">
                <span className="text-base">🔒</span>
                <span>
                  Immutable Audit Trail: Direct edits and deletions are disabled to ensure financial compliance and
                  prevent running balance discrepancies.
                </span>
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <small className="text-slate-400 block text-[11px] uppercase font-bold">Account / Drawer</small>
                  <strong className="text-slate-800 text-sm">
                    {selectedTxForDetails.wallet_name ||
                      selectedTxForDetails.account_name ||
                      `Account #${selectedTxForDetails.account_id}`}
                  </strong>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <small className="text-slate-400 block text-[11px] uppercase font-bold">Classification</small>
                  <span
                    className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-xs font-bold ${
                      selectedTxForDetails.transaction_type === 'credit'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedTxForDetails.transaction_type === 'credit'
                      ? '🟢 Inflow / Credit (+)'
                      : '🔴 Outflow / Debit (-)'}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <small className="text-slate-400 block text-[11px] uppercase font-bold">Transaction Amount</small>
                  <strong
                    className={`text-base font-bold font-mono ${
                      selectedTxForDetails.transaction_type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    ৳ {Number(selectedTxForDetails.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <small className="text-slate-400 block text-[11px] uppercase font-bold">
                    Running Balance After
                  </small>
                  <strong className="text-base font-bold text-slate-800 font-mono">
                    {selectedTxForDetails.balance_after !== null && selectedTxForDetails.balance_after !== undefined
                      ? `৳ ${Number(selectedTxForDetails.balance_after || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}`
                      : '—'}
                  </strong>
                </div>
              </div>

              {/* Secondary Details */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 mb-4 text-xs space-y-1.5">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Date & Time:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(
                      selectedTxForDetails.created_at || selectedTxForDetails.date || Date.now()
                    ).toLocaleString('en-GB', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Source Module:</span>
                  <span className="font-semibold text-sky-600 uppercase">
                    {(selectedTxForDetails.source_type || selectedTxForDetails.type || 'manual').replace(/_/g, ' ')}
                  </span>
                </div>
                {selectedTxForDetails.reference && (
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Reference / Voucher:</span>
                    <span className="font-bold text-sky-700">{selectedTxForDetails.reference}</span>
                  </div>
                )}
                {selectedTxForDetails.transaction_id && (
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Bank / MFS TrxID:</span>
                    <span className="font-semibold text-slate-700 font-mono">
                      {selectedTxForDetails.transaction_id}
                    </span>
                  </div>
                )}
                {selectedTxForDetails.created_by && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Recorded By:</span>
                    <span className="font-semibold text-slate-700">{selectedTxForDetails.created_by}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="mb-4">
                <small className="text-slate-500 block text-[11px] font-bold uppercase mb-1">
                  TRANSACTION DESCRIPTION / NOTE
                </small>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700">
                  {selectedTxForDetails.note || selectedTxForDetails.description || 'No additional note provided.'}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedTxForDetails(null)}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs sm:text-sm transition shadow-xs cursor-pointer"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}