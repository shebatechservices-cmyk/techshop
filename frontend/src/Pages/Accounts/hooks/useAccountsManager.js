import { useState, useEffect, useMemo } from 'react';
import API from '../../../services/api';

export default function useAccountsManager({ initialTab } = {}) {
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

  return {
    // State
    wallets,
    setWallets,
    tenders,
    setTenders,
    transactions,
    setTransactions,
    loading,
    setLoading,
    error,
    setError,
    successMsg,
    setSuccessMsg,
    activeSubpage,
    setActiveSubpage,
    handleSubpageChange,
    isDayCloseOpen,
    setIsDayCloseOpen,
    isAddPaymentMethodOpen,
    setIsAddPaymentMethodOpen,
    isAddAccountOpen,
    setIsAddAccountOpen,
    parties,
    setParties,
    partyTypeFilter,
    setPartyTypeFilter,
    partySearch,
    setPartySearch,
    partyPage,
    setPartyPage,
    partyPagination,
    setPartyPagination,
    partyCounts,
    setPartyCounts,
    loadingParties,
    setLoadingParties,
    selectedPartyModal,
    setSelectedPartyModal,
    isTransferOpen,
    setIsTransferOpen,
    transferForm,
    setTransferForm,
    transferLoading,
    setTransferLoading,
    transferError,
    setTransferError,
    isCashFlowOpen,
    setIsCashFlowOpen,
    cashFlowMode,
    setCashFlowMode,
    cashFlowAccount,
    setCashFlowAccount,
    cashFlowForm,
    setCashFlowForm,
    cashFlowLoading,
    setCashFlowLoading,
    cashFlowError,
    setCashFlowError,
    isEditWalletOpen,
    setIsEditWalletOpen,
    editWalletForm,
    setEditWalletForm,
    editWalletLoading,
    setEditWalletLoading,
    selectedTxForDetails,
    setSelectedTxForDetails,
    txSearchQuery,
    setTxSearchQuery,
    selectedTxTypeFilter,
    setSelectedTxTypeFilter,
    selectedWalletFilter,
    setSelectedWalletFilter,

    // Calculations & Memos
    totalBalance,
    filteredTransactions,

    // Actions & Handlers
    loadAccountsData,
    loadPartiesData,
    handleDeleteWallet,
    openEditWallet,
    handleSaveWalletEdit,
    openCashFlow,
    handleCashFlowSubmit,
    handleTransferSubmit,
    handleReverseTransaction,
  };
}
