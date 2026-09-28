import { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../../../services/api';
import usePartiesDirectory from './usePartiesDirectory';
import useAccountModals from './useAccountModals';

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

  // Central Ledger Search & Filter state
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [selectedTxTypeFilter, setSelectedTxTypeFilter] = useState('all');
  const [selectedWalletFilter, setSelectedWalletFilter] = useState('all');

  // Load accounts and transactions
  const loadAccountsData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadAccountsData();
  }, [loadAccountsData]);

  // Listen for live expense events to keep balances synchronized
  useEffect(() => {
    const handleExpenseChanged = () => {
      loadAccountsData();
    };
    window.addEventListener('expense_changed', handleExpenseChanged);
    return () => window.removeEventListener('expense_changed', handleExpenseChanged);
  }, [loadAccountsData]);

  // Compose modular hooks
  const partiesHook = usePartiesDirectory(activeSubpage);
  const modalsHook = useAccountModals({
    wallets,
    loadAccountsData,
    setError,
    setSuccessMsg,
  });

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
    // Core State
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
    txSearchQuery,
    setTxSearchQuery,
    selectedTxTypeFilter,
    setSelectedTxTypeFilter,
    selectedWalletFilter,
    setSelectedWalletFilter,

    // Composed Hooks state & handlers
    ...partiesHook,
    ...modalsHook,

    // Calculations & Memos
    totalBalance,
    filteredTransactions,

    // Actions & Handlers
    loadAccountsData,
  };
}
