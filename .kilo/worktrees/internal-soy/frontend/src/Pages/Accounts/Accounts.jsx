import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import PartyProfileModal from '../../components/PartyProfileModal';
import DayCloseModal from '../../components/DayCloseModal';
import Expenses from './Expenses';

export default function Accounts({ initialTab }) {
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Daily Cash Closing Modal state
  const [isDayCloseOpen, setIsDayCloseOpen] = useState(false);

  // View switcher: 'wallets' | 'parties' | 'expenses'
  const [activeViewTab, setActiveViewTab] = useState(initialTab === 'expenses' ? 'expenses' : 'wallets');

  useEffect(() => {
    if (initialTab) {
      setActiveViewTab(initialTab);
    }
  }, [initialTab]);

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
    initialTab: 'overview'
  });

  // Transfer modal state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    from_wallet_id: '',
    to_wallet_id: '',
    amount: '',
    note: '',
    transaction_id: ''
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

  // Payment methods and paths state
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isMethodsModalOpen, setIsMethodsModalOpen] = useState(false);
  const [newMethodForm, setNewMethodForm] = useState({
    method_name: '',
    path_type: 'Cash',
    account_details: '',
    account_number: '',
    opening_balance: '',
    create_matching_wallet: true
  });
  const [methodLoading, setMethodLoading] = useState(false);
  const [methodError, setMethodError] = useState('');
  const [methodSuccess, setMethodSuccess] = useState('');

  // Wallet edit / delete state
  const [isEditWalletOpen, setIsEditWalletOpen] = useState(false);
  const [editWalletForm, setEditWalletForm] = useState({ id: '', name: '', account_type: 'drawer', account_number: '' });
  const [editWalletLoading, setEditWalletLoading] = useState(false);

  // Filtering state
  const [selectedWalletFilter, setSelectedWalletFilter] = useState('all');

  // Load accounts and transactions
  const loadAccountsData = async () => {
    try {
      setLoading(true);
      setError('');

      const [walletsRes, txRes] = await Promise.all([
        fetch(`${API}/accounts/wallets`, { headers: { 'role-id': '1' } }),
        fetch(`${API}/accounts/transactions`, { headers: { 'role-id': '1' } }).catch(() => null)
      ]);

      if (walletsRes.ok) {
        const walletsData = await walletsRes.json();
        setWallets(walletsData.data || []);
      } else {
        setError('Failed to load wallet data');
      }

      if (txRes && txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.data || (Array.isArray(txData) ? txData : []));
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Unable to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const res = await fetch(`${API}/accounts/payment-methods`);
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data.data || []);
      }
    } catch (err) {
      console.error('Fetch payment methods error:', err);
    }
  };

  useEffect(() => {
    loadAccountsData();
    loadPaymentMethods();
  }, []);

  // Listen for live expense events to keep wallet balances synchronized
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
      const query = new URLSearchParams({
        type: partyTypeFilter,
        search: partySearch.trim(),
        page: String(partyPage),
        limit: '20'
      }).toString();

      const res = await fetch(`${API}/parties?${query}`);
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
    if (activeViewTab === 'parties') {
      loadPartiesData();
    }
  }, [activeViewTab, partyTypeFilter, partyPage, partySearch]);

  // Submit payment method & path
  const handleAddMethod = async (e) => {
    e.preventDefault();
    setMethodError('');
    setMethodSuccess('');
    if (!newMethodForm.method_name.trim()) {
      setMethodError('Please enter a payment method name');
      return;
    }
    try {
      setMethodLoading(true);
      const rawName = newMethodForm.method_name.trim();
      const finalName = `${rawName} (${newMethodForm.path_type})`;
      const res = await fetch(`${API}/accounts/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'role-id': '1' },
        body: JSON.stringify({
          method_name: finalName,
          account_details: newMethodForm.account_details.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add payment method');

      if (newMethodForm.create_matching_wallet) {
        const accType = newMethodForm.path_type.toLowerCase() === 'bank' ? 'bank' : newMethodForm.path_type.toLowerCase() === 'cash' ? 'cash' : 'wallet';
        await fetch(`${API}/accounts/wallets/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'role-id': '1' },
          body: JSON.stringify({
            name: rawName,
            account_type: accType,
            balance: newMethodForm.opening_balance ? Number(newMethodForm.opening_balance) || 0 : 0,
            account_number: newMethodForm.account_number.trim()
          })
        });
        await loadAccountsData();
      }

      setMethodSuccess('Payment method and path saved successfully!');
      setNewMethodForm({ method_name: '', path_type: 'Cash', account_details: '', account_number: '', opening_balance: '', create_matching_wallet: true });
      await loadPaymentMethods();
    } catch (err) {
      setMethodError(err.message || 'Operation failed');
    } finally {
      setMethodLoading(false);
    }
  };

  const handleToggleMethod = async (id) => {
    try {
      await fetch(`${API}/accounts/payment-methods/${id}/toggle`, {
        method: 'PUT',
        headers: { 'role-id': '1' }
      });
      await loadPaymentMethods();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMethod = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) return;
    try {
      await fetch(`${API}/accounts/payment-methods/${id}`, {
        method: 'DELETE',
        headers: { 'role-id': '1' }
      });
      await loadPaymentMethods();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete a wallet / account (backend guards history & non-zero balance)
  const handleDeleteWallet = async (wallet) => {
    if (!window.confirm(`Are you sure you want to delete account "${wallet.account_name}"?`)) return;
    try {
      const res = await fetch(`${API}/accounts/wallets/${wallet.id}`, {
        method: 'DELETE',
        headers: { 'role-id': '1' }
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
      account_number: wallet.account_number || ''
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
        headers: { 'Content-Type': 'application/json', 'role-id': '1' },
        body: JSON.stringify({
          name: editWalletForm.name.trim(),
          account_type: editWalletForm.account_type,
          account_number: editWalletForm.account_number || ''
        })
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
        headers: { 'Content-Type': 'application/json', 'role-id': '1' },
        body: JSON.stringify({
          account_id: cashFlowAccount.id,
          amount,
          reference: cashFlowMode === 'deposit' ? 'Manual Deposit' : 'Manual Withdraw',
          note: cashFlowForm.note.trim() || '',
          transaction_id: cashFlowForm.transaction_id.trim() || ''
        })
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

    const sourceWallet = wallets.find(w => String(w.id) === String(transferForm.from_wallet_id));
    if (sourceWallet && Number(sourceWallet.balance) < transferAmount) {
      setTransferError(`Insufficient balance! Current balance: ৳ ${Number(sourceWallet.balance).toLocaleString('en-IN')}`);
      return;
    }

    try {
      setTransferLoading(true);
      const res = await fetch(`${API}/accounts/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'role-id': '1'
        },
        body: JSON.stringify({
          from_wallet_id: Number(transferForm.from_wallet_id),
          to_wallet_id: Number(transferForm.to_wallet_id),
          amount: transferAmount,
          note: transferForm.note.trim(),
          transaction_id: transferForm.transaction_id.trim() || ''
        })
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

  // Calculate total balance across all accounts
  const totalBalance = wallets.reduce((acc, curr) => acc + Number(curr.balance || 0), 0);

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    if (selectedWalletFilter === 'all') return true;
    return String(t.wallet_id || t.account_id) === String(selectedWalletFilter);
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Unified Compact Header & Tabs Bar (Single Row) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1.5px solid #e2e8f0'
      }}>
        {/* Left: Compact Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>💳</span>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
              Accounts & Wallets
            </h2>
            <span style={{ color: '#64748b', fontSize: '0.74rem' }}>
              Cash registers, banks & expenses
            </span>
          </div>
        </div>

        {/* Center: Top Level View Switcher Pills */}
        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveViewTab('wallets')}
            style={{
              padding: '6px 12px',
              border: 'none',
              background: activeViewTab === 'wallets' ? '#ffffff' : 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: activeViewTab === 'wallets' ? 700 : 600,
              fontSize: '0.82rem',
              color: activeViewTab === 'wallets' ? '#2563eb' : '#64748b',
              boxShadow: activeViewTab === 'wallets' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>💰 Wallets</span>
            <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '10px', background: activeViewTab === 'wallets' ? '#dbeafe' : '#e2e8f0', color: activeViewTab === 'wallets' ? '#1d4ed8' : '#64748b', fontWeight: 800 }}>
              {wallets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveViewTab('parties');
              setPartyPage(1);
            }}
            style={{
              padding: '6px 12px',
              border: 'none',
              background: activeViewTab === 'parties' ? '#ffffff' : 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: activeViewTab === 'parties' ? 700 : 600,
              fontSize: '0.82rem',
              color: activeViewTab === 'parties' ? '#0284c7' : '#64748b',
              boxShadow: activeViewTab === 'parties' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>👥 Party Ledgers</span>
            <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '10px', background: activeViewTab === 'parties' ? '#e0f2fe' : '#e2e8f0', color: activeViewTab === 'parties' ? '#0369a1' : '#64748b', fontWeight: 800 }}>
              {partyCounts.total || parties.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewTab('expenses')}
            style={{
              padding: '6px 12px',
              border: 'none',
              background: activeViewTab === 'expenses' ? '#ffffff' : 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: activeViewTab === 'expenses' ? 700 : 600,
              fontSize: '0.82rem',
              color: activeViewTab === 'expenses' ? '#dc2626' : '#64748b',
              boxShadow: activeViewTab === 'expenses' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>💸 Expenses & Overheads</span>
          </button>
        </div>

        {/* Right: Action buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => { setIsMethodsModalOpen(true); setMethodError(''); setMethodSuccess(''); }}
            style={{
              padding: '6px 10px',
              backgroundColor: '#0f172a',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            💳 Methods
          </button>
          <button
            type="button"
            onClick={() => { setIsTransferOpen(true); setTransferError(''); }}
            style={{
              padding: '6px 10px',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ⇄ Transfer
          </button>
          <button
            type="button"
            onClick={() => setIsDayCloseOpen(true)}
            style={{
              padding: '6px 10px',
              backgroundColor: '#059669',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 1px 3px rgba(5, 150, 105, 0.2)'
            }}
          >
            🌅 Z-Report
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {error && (
        <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '12px' }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '10px 14px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', marginBottom: '12px' }}>
          {successMsg}
        </div>
      )}

      {activeViewTab === 'wallets' && (
        loading ? (
          <p style={{ color: '#64748b' }}>Loading wallet and ledger data...</p>
        ) : (
          <>
          {/* Wallet Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {/* Total Balance Card */}
            <div style={{ background: '#0f172a', color: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Net Balance</span>
              <h3 style={{ fontSize: '1.8rem', margin: '8px 0 4px 0', color: '#38bdf8' }}>
                ৳ {totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <small style={{ color: '#94a3b8' }}>Combined balance across {wallets.length} accounts</small>
            </div>

            {/* Individual Wallet Cards */}
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                style={{
                  background: '#ffffff',
                  padding: '20px',
                  borderRadius: '10px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  border: '1px solid #e2e8f0',
                  borderLeft: `5px solid ${wallet.account_type === 'cash' ? '#16a34a' : wallet.account_type === 'bank' ? '#2563eb' : '#d97706'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    {wallet.account_type}
                  </span>
                  {wallet.account_number && (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                      {wallet.account_number}
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '1.2rem', margin: '6px 0 10px 0', color: '#1e293b' }}>
                  {wallet.account_name}
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Balance:</span>
                  <strong style={{ fontSize: '1.4rem', color: Number(wallet.balance) < 0 ? '#ef4444' : '#16a34a' }}>
                    ৳ {Number(wallet.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => openEditWallet(wallet)}
                    style={{
                      padding: '5px 10px',
                      background: '#fffbeb',
                      color: '#d97706',
                      border: '1px solid #fde68a',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Edit account name / type"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => openCashFlow(wallet, 'deposit')}
                    style={{
                      padding: '5px 10px',
                      background: '#f0fdf4',
                      color: '#15803d',
                      border: '1px solid #bbf7d0',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Deposit cash into this account"
                  >
                    ⬆️ Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => openCashFlow(wallet, 'withdraw')}
                    style={{
                      padding: '5px 10px',
                      background: '#fff7ed',
                      color: '#c2410c',
                      border: '1px solid #fed7aa',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Withdraw cash out of this account"
                  >
                    ⬇️ Withdraw
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteWallet(wallet)}
                    disabled={wallet.has_history || Math.abs(Number(wallet.balance || 0)) > 0.01}
                    title={
                      wallet.has_history
                        ? 'Cannot delete: this account has payment/transfer history'
                        : Math.abs(Number(wallet.balance || 0)) > 0.01
                        ? 'Cannot delete: account has a non-zero balance'
                        : 'Delete this account'
                    }
                    style={{
                      padding: '5px 10px',
                      background: wallet.has_history || Math.abs(Number(wallet.balance || 0)) > 0.01 ? '#f8fafc' : '#fef2f2',
                      color: wallet.has_history || Math.abs(Number(wallet.balance || 0)) > 0.01 ? '#94a3b8' : '#b91c1c',
                      border: wallet.has_history || Math.abs(Number(wallet.balance || 0)) > 0.01 ? '1px solid #e2e8f0' : '1px solid #fecaca',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: wallet.has_history || Math.abs(Number(wallet.balance || 0)) > 0.01 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Methods & Paths Overview Card */}
          <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                  Payment Methods & Transaction Paths
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '2px 0 0 0' }}>
                  Active payment gateways, bank accounts, and cash channels for sales and purchases
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setIsMethodsModalOpen(true); setMethodError(''); setMethodSuccess(''); }}
                style={{
                  padding: '8px 14px',
                  background: '#f0f9ff',
                  color: '#0284c7',
                  border: '1px solid #bae6fd',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                ⚙️ Manage Methods & Paths
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              {paymentMethods.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No payment methods configured.</p>
              ) : (
                paymentMethods.map(pm => (
                  <div
                    key={pm.id}
                    style={{
                      padding: '12px 14px',
                      background: pm.is_active ? '#f8fafc' : '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      opacity: pm.is_active ? 1 : 0.65
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{pm.method_name}</strong>
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '2px 7px',
                        borderRadius: '10px',
                        background: pm.is_active ? '#dcfce7' : '#fee2e2',
                        color: pm.is_active ? '#15803d' : '#b91c1c',
                        fontWeight: 'bold'
                      }}>
                        {pm.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {pm.account_details || 'Default gateway channel'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Transaction Ledger Table */}
          <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Transaction Ledger</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '2px 0 0 0' }}>Audit log of all deposits, expenses, and fund transfers</p>
              </div>

              {/* Filter dropdown */}
              <select
                value={selectedWalletFilter}
                onChange={(e) => setSelectedWalletFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              >
                <option value="all">All Wallets</option>
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>{w.account_name}</option>
                ))}
              </select>
            </div>

            {filteredTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                <p>No transaction records found.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                      <th style={{ padding: '12px 14px' }}>Date & Time</th>
                      <th style={{ padding: '12px 14px' }}>Wallet / Account</th>
                      <th style={{ padding: '12px 14px' }}>Transaction Type</th>
                      <th style={{ padding: '12px 14px' }}>Description / Note</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx, idx) => {
                      const isCredit = tx.type === 'credit' || tx.type === 'in' || tx.type === 'deposit';
                      const isTransfer = tx.type === 'transfer';
                      return (
                        <tr key={tx.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 14px', color: '#64748b' }}>
                            {new Date(tx.created_at || tx.date || Date.now()).toLocaleString('en-GB', {
                              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: '500', color: '#1e293b' }}>
                            {tx.wallet_name || tx.account_name || '—'}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              background: isTransfer ? '#e0f2fe' : isCredit ? '#dcfce7' : '#fee2e2',
                              color: isTransfer ? '#0369a1' : isCredit ? '#15803d' : '#b91c1c'
                            }}>
                              {isTransfer ? 'Transfer' : isCredit ? 'Credit (+)' : 'Debit (-)'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#475569' }}>
                            {tx.note || tx.description || 'Standard transaction'}
                            {tx.transaction_id && (
                              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                                TrxID: {tx.transaction_id}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold', color: isCredit ? '#16a34a' : '#ef4444' }}>
                            {isCredit ? '+ ' : '- '}৳ {Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ))}

      {/* VIEW TAB 2: PARTY LEDGERS & PROFILES */}
      {activeViewTab === 'parties' && (
        <div>
          {/* Controls & Filter Bar */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Parties', count: partyCounts.total },
                  { id: 'customer', label: 'Customers', count: partyCounts.customer },
                  { id: 'supplier', label: 'Suppliers', count: partyCounts.supplier },
                  { id: 'staff', label: 'Staff & Team', count: partyCounts.staff }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setPartyTypeFilter(f.id);
                      setPartyPage(1);
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: partyTypeFilter === f.id ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      background: partyTypeFilter === f.id ? '#e0f2fe' : '#f8fafc',
                      color: partyTypeFilter === f.id ? '#0369a1' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{f.label}</span>
                    <span style={{
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontSize: '0.72rem',
                      background: partyTypeFilter === f.id ? '#0284c7' : '#e2e8f0',
                      color: partyTypeFilter === f.id ? '#fff' : '#475569'
                    }}>
                      {f.count || 0}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search and Refresh */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: '1', maxWidth: '380px' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search by name, phone, email, role..."
                    value={partySearch}
                    onChange={(e) => {
                      setPartySearch(e.target.value);
                      setPartyPage(1);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {partySearch && (
                    <button
                      type="button"
                      onClick={() => { setPartySearch(''); setPartyPage(1); }}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={loadPartiesData}
                  title="Refresh List"
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.88rem'
                  }}
                >
                  ↻
                </button>
              </div>
            </div>
          </div>

          {/* Party Table */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {loadingParties ? (
              <div style={{ textAlign: 'center', padding: '50px 0', color: '#64748b' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>⏳ Loading party profiles...</div>
                <small>Fetching dynamically from PostgreSQL</small>
              </div>
            ) : parties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👥</div>
                <h4 style={{ margin: '0 0 6px 0', color: '#475569', fontSize: '1.1rem' }}>No profiles found</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  {partySearch ? `No matching party for "${partySearch}"` : 'No party profiles in this category yet.'}
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.03em' }}>
                      <th style={{ padding: '12px 16px' }}>Party Name</th>
                      <th style={{ padding: '12px 14px' }}>Classification</th>
                      <th style={{ padding: '12px 14px' }}>Contact Details</th>
                      <th style={{ padding: '12px 14px' }}>Address</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Current Balance</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Audit Records</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parties.map((p) => {
                      const bal = parseFloat(p.balance || 0);
                      const isCust = p.party_type === 'customer';
                      const isSupp = p.party_type === 'supplier';
                      const isStaff = p.party_type === 'staff';

                      const badgeStyle = isCust
                        ? { bg: '#e0f2fe', color: '#0369a1', label: 'Customer' }
                        : isSupp
                        ? { bg: '#d1fae5', color: '#059669', label: 'Supplier' }
                        : { bg: '#ede9fe', color: '#7c3aed', label: 'Staff' };

                      return (
                        <tr key={`${p.party_type}-${p.id}`} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                          {/* Name & Avatar */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '10px',
                                  background: badgeStyle.bg,
                                  color: badgeStyle.color,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.9rem'
                                }}
                              >
                                {p.name ? p.name.charAt(0).toUpperCase() : 'P'}
                              </div>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedPartyModal({ isOpen: true, partyType: p.party_type, partyId: p.id, initialTab: 'overview' })}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    padding: 0,
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '0.92rem'
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = '#0284c7')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                                >
                                  {p.name}
                                </button>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>#{p.id}</div>
                              </div>
                            </div>
                          </td>

                          {/* Classification */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
                              <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', background: badgeStyle.bg, color: badgeStyle.color, fontWeight: 700, textTransform: 'uppercase' }}>
                                {badgeStyle.label}
                              </span>
                              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                {p.role_or_type || 'Standard'}
                              </span>
                            </div>
                          </td>

                          {/* Contact Details */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.phone || '—'}</div>
                            {p.email && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.email}</div>}
                          </td>

                          {/* Address */}
                          <td style={{ padding: '12px 14px', color: '#475569', fontSize: '0.82rem', maxWidth: '180px' }}>
                            {p.address || '—'}
                          </td>

                          {/* Current Balance */}
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            {isStaff ? (
                              <span style={{ fontSize: '0.78rem', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                Active User
                              </span>
                            ) : (
                              <div>
                                <strong style={{ fontSize: '0.95rem', color: bal > 0 ? (isCust ? '#ef4444' : '#d97706') : '#16a34a' }}>
                                  ৳ {bal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                                </strong>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                  {bal > 0 ? (isCust ? 'Receivable Due' : 'Payable Due') : bal < 0 ? (isCust ? 'Advance (Credit)' : 'Advance Given (Credit)') : 'Cleared'}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Audit Records */}
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: p.activity_count > 0 ? '#f0fdf4' : '#f8fafc',
                                color: p.activity_count > 0 ? '#166534' : '#94a3b8',
                                border: `1px solid ${p.activity_count > 0 ? '#bbf7d0' : '#e2e8f0'}`
                              }}
                            >
                              {p.activity_count > 0 ? `✓ ${p.activity_count} records` : '0 records (New)'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedPartyModal({ isOpen: true, partyType: p.party_type, partyId: p.id, initialTab: 'overview' })}
                                title="View Complete Profile & Ledger"
                                style={{
                                  padding: '5px 10px',
                                  background: '#e0f2fe',
                                  color: '#0369a1',
                                  border: '1px solid #bae6fd',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                👤 Profile
                              </button>
                              {!isStaff && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPartyModal({ isOpen: true, partyType: p.party_type, partyId: p.id, initialTab: 'financial' })}
                                  title={isCust ? 'Receive Due Payment' : 'Pay Due to Supplier'}
                                  style={{
                                    padding: '5px 8px',
                                    background: '#dcfce7',
                                    color: '#15803d',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: '6px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  💳 Pay / Due
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedPartyModal({ isOpen: true, partyType: p.party_type, partyId: p.id, initialTab: 'edit' })}
                                title="Edit Profile Details"
                                style={{
                                  padding: '5px 8px',
                                  background: '#f1f5f9',
                                  color: '#334155',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedPartyModal({ isOpen: true, partyType: p.party_type, partyId: p.id, initialTab: 'activity' })}
                                title="Safe Delete Check"
                                style={{
                                  padding: '5px 8px',
                                  background: '#fee2e2',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  cursor: 'pointer'
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* DYNAMIC 20 PER PAGE PAGINATION CONTROLS */}
            {!loadingParties && parties.length > 0 && (
              <div
                style={{
                  padding: '14px 20px',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Showing <strong>{(partyPage - 1) * 20 + 1}</strong> to <strong>{Math.min(partyPage * 20, partyPagination.total)}</strong> of <strong>{partyPagination.total}</strong> Profiles
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    type="button"
                    disabled={partyPage <= 1}
                    onClick={() => setPartyPage((prev) => Math.max(1, prev - 1))}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: partyPage <= 1 ? '#f1f5f9' : '#ffffff',
                      color: partyPage <= 1 ? '#94a3b8' : '#334155',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      cursor: partyPage <= 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    « Previous
                  </button>

                  {Array.from({ length: partyPagination.totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setPartyPage(pg)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: pg === partyPage ? '1px solid #0284c7' : '1px solid #cbd5e1',
                        background: pg === partyPage ? '#0284c7' : '#ffffff',
                        color: pg === partyPage ? '#ffffff' : '#334155',
                        fontWeight: pg === partyPage ? 700 : 500,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      {pg}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={partyPage >= partyPagination.totalPages}
                    onClick={() => setPartyPage((prev) => Math.min(partyPagination.totalPages, prev + 1))}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: partyPage >= partyPagination.totalPages ? '#f1f5f9' : '#ffffff',
                      color: partyPage >= partyPagination.totalPages ? '#94a3b8' : '#334155',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      cursor: partyPage >= partyPagination.totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next »
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW TAB 3: EXPENSES & OPERATING OVERHEADS */}
      {activeViewTab === 'expenses' && (
        <Expenses />
      )}

      {/* Edit Account Modal */}
      {isEditWalletOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Edit Account</h3>
              <button
                type="button"
                onClick={() => setIsEditWalletOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWalletEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  Account Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={editWalletForm.name}
                  onChange={(e) => setEditWalletForm({ ...editWalletForm, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  Account Type
                </label>
                <select
                  value={editWalletForm.account_type}
                  onChange={(e) => setEditWalletForm({ ...editWalletForm, account_type: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="cash">Cash Drawer</option>
                  <option value="bank">Bank Account</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="mfs">Mobile Financial Service</option>
                  <option value="wallet">Digital Wallet</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  Account / Mobile Banker Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. A/C 1502938471001 or 01711-000000"
                  value={editWalletForm.account_number || ''}
                  onChange={(e) => setEditWalletForm({ ...editWalletForm, account_number: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditWalletOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editWalletLoading}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#0284c7',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: editWalletLoading ? 'not-allowed' : 'pointer',
                    opacity: editWalletLoading ? 0.7 : 1
                  }}
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
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Fund Transfer</h3>
              <button
                type="button"
                onClick={() => setIsTransferOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {transferError && (
              <div style={{ padding: '10px 12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px' }}>
                {transferError}
              </div>
            )}

            <form onSubmit={handleTransferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  From Account / Wallet
                </label>
                <select
                  value={transferForm.from_wallet_id}
                  onChange={(e) => setTransferForm({ ...transferForm, from_wallet_id: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">Select source wallet</option>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.account_name} (Balance: ৳ {Number(w.balance).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  To Account / Wallet
                </label>
                <select
                  value={transferForm.to_wallet_id}
                  onChange={(e) => setTransferForm({ ...transferForm, to_wallet_id: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">Select destination wallet</option>
                  {wallets
                    .filter(w => String(w.id) !== String(transferForm.from_wallet_id))
                    .map(w => (
                      <option key={w.id} value={w.id}>
                        {w.account_name} (Balance: ৳ {Number(w.balance).toLocaleString('en-IN')})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  Transfer Amount (৳)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="e.g. 5000"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  Reference / Description Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cash deposit to bank or cashout"
                  value={transferForm.note}
                  onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  Transaction ID (MFS/Bank Reference)
                </label>
                <input
                  type="text"
                  placeholder="e.g. TrxID 9X7H4Z2M or Bank ref #"
                  value={transferForm.transaction_id}
                  onChange={(e) => setTransferForm({ ...transferForm, transaction_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  style={{ padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferLoading}
                  style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '14px',
            padding: '24px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 'bold' }}>
                  {cashFlowMode === 'deposit' ? '⬆️ Deposit Cash Into Account' : '⬇️ Withdraw Cash From Account'}
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.8rem' }}>
                  {cashFlowAccount ? cashFlowAccount.account_name : ''} (Balance: ৳ {Number(cashFlowAccount ? cashFlowAccount.balance : 0).toLocaleString('en-IN')})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCashFlowOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {cashFlowError && (
              <div style={{ padding: '10px 12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px' }}>
                {cashFlowError}
              </div>
            )}

            <form onSubmit={handleCashFlowSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  Amount (৳) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 5000"
                  value={cashFlowForm.amount}
                  onChange={(e) => setCashFlowForm({ ...cashFlowForm, amount: e.target.value })}
                  required
                  autoFocus
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  Note / Reason
                </label>
                <input
                  type="text"
                  placeholder={cashFlowMode === 'deposit' ? 'e.g. Daily sales cash-in' : 'e.g. Petty cash / owner draw'}
                  value={cashFlowForm.note}
                  onChange={(e) => setCashFlowForm({ ...cashFlowForm, note: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  Transaction ID (MFS/Bank {cashFlowMode === 'deposit' ? 'Deposit' : 'Withdraw'} Reference)
                </label>
                <input
                  type="text"
                  placeholder="e.g. TrxID 9X7H4Z2M or Bank ref #"
                  value={cashFlowForm.transaction_id}
                  onChange={(e) => setCashFlowForm({ ...cashFlowForm, transaction_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsCashFlowOpen(false)}
                  style={{ padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cashFlowLoading}
                  style={{
                    padding: '10px 20px',
                    background: cashFlowMode === 'deposit' ? '#15803d' : '#c2410c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {cashFlowLoading ? 'Processing...' : cashFlowMode === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Methods & Paths Modal */}
      {isMethodsModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '14px',
            padding: '24px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 'bold' }}>
                  Payment Methods & Paths
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.8rem' }}>
                  Configure payment channels, gateway paths, and accounts used across sales and purchases
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMethodsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {methodError && (
              <div style={{ padding: '10px 12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px' }}>
                {methodError}
              </div>
            )}
            {methodSuccess && (
              <div style={{ padding: '10px 12px', background: '#dcfce7', color: '#15803d', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px' }}>
                {methodSuccess}
              </div>
            )}

            {/* Add New Method Form */}
            <form onSubmit={handleAddMethod} style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>+ Add New Payment Method & Path</strong>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                    Method Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. bKash Merchant / City Bank"
                    value={newMethodForm.method_name}
                    onChange={(e) => setNewMethodForm({ ...newMethodForm, method_name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                    Path Type
                  </label>
                  <select
                    value={newMethodForm.path_type}
                    onChange={(e) => setNewMethodForm({ ...newMethodForm, path_type: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="Mobile Banking">Mobile Banking</option>
                    <option value="Card POS">Card POS</option>
                    <option value="Online">Online Gateway</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  Account Details / Gateway Path
                </label>
                <input
                  type="text"
                  placeholder="e.g. A/C 12345678, Branch Motijheel or Merchant No: 017..."
                  value={newMethodForm.account_details}
                  onChange={(e) => setNewMethodForm({ ...newMethodForm, account_details: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  Account Number (for the matching wallet)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 01711-123456 or 1502938471001"
                  value={newMethodForm.account_number}
                  onChange={(e) => setNewMethodForm({ ...newMethodForm, account_number: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  Opening Balance (৳) — for the matching wallet
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 10000"
                  value={newMethodForm.opening_balance}
                  onChange={(e) => setNewMethodForm({ ...newMethodForm, opening_balance: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
                <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                  Set the starting cash/drawer balance when creating this method's wallet.
                </small>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="create_wallet"
                  checked={newMethodForm.create_matching_wallet}
                  onChange={(e) => setNewMethodForm({ ...newMethodForm, create_matching_wallet: e.target.checked })}
                />
                <label htmlFor="create_wallet" style={{ fontSize: '0.8rem', color: '#475569', cursor: 'pointer' }}>
                  Also create a matching digital wallet for this method
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={methodLoading}
                  style={{
                    padding: '8px 16px',
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  {methodLoading ? 'Saving...' : '+ Save Method & Path'}
                </button>
              </div>
            </form>

            {/* Configured Methods List */}
            <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block', marginBottom: '10px' }}>
              Configured Payment Methods
            </strong>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {paymentMethods.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No payment methods found.</p>
              ) : (
                paymentMethods.map(pm => (
                  <div
                    key={pm.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.9rem' }}>{pm.method_name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>
                        {pm.account_details || 'Default transaction path'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleMethod(pm.id)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          background: pm.is_active ? '#dcfce7' : '#fee2e2',
                          color: pm.is_active ? '#15803d' : '#b91c1c'
                        }}
                      >
                        {pm.is_active ? 'Active' : 'Disabled'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMethod(pm.id)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #fee2e2',
                          background: '#fff',
                          color: '#dc2626',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setIsMethodsModalOpen(false)}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#475569', fontWeight: '600' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Party Profile Modal */}
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
      <DayCloseModal
        isOpen={isDayCloseOpen}
        onClose={() => setIsDayCloseOpen(false)}
      />
    </div>
  );
}