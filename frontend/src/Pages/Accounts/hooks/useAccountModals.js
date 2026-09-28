import { useState } from 'react';
import API from '../../../services/api';

export default function useAccountModals({ wallets, loadAccountsData, setError, setSuccessMsg }) {
  // Top Modal States
  const [isDayCloseOpen, setIsDayCloseOpen] = useState(false);
  const [isAddPaymentMethodOpen, setIsAddPaymentMethodOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

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
      const res = await fetch(url, { method: 'DELETE' });
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

  return {
    isDayCloseOpen,
    setIsDayCloseOpen,
    isAddPaymentMethodOpen,
    setIsAddPaymentMethodOpen,
    isAddAccountOpen,
    setIsAddAccountOpen,
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
    handleDeleteWallet,
    openEditWallet,
    handleSaveWalletEdit,
    openCashFlow,
    handleCashFlowSubmit,
    handleTransferSubmit,
    handleReverseTransaction,
  };
}
