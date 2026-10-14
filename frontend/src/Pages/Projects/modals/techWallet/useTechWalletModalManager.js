import { useState, useEffect } from 'react';
import { smartFetch } from '../../../../services/api';

export default function useTechWalletModalManager({ isOpen, onRefreshProjects }) {
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
      const res = await smartFetch('/projects/tech-wallets');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setWallets(data.wallets || []);
          setSourceAccounts(data.source_accounts || []);
          if (data.source_accounts?.length > 0 && !sourceAccountId) {
            setSourceAccountId(data.source_accounts[0].id);
          }
        } else {
          setError(data.message || 'Failed to load wallet data.');
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.message || 'Failed to load wallet data.');
      }
    } catch (err) {
      console.error(err);
      setError('Server error connecting to wallet');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const res = await smartFetch('/staff/wallet-requests/pending');
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
      const res = await smartFetch(`/projects/tech-wallet-history/${walletId}`);
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
      const res = await smartFetch('/projects/tech-payout', {
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

  return {
    activeTab,
    setActiveTab,
    wallets,
    sourceAccounts,
    pendingRequests,
    loading,
    error,
    selectedTechName,
    setSelectedTechName,
    sourceAccountId,
    setSourceAccountId,
    payoutAmount,
    setPayoutAmount,
    payoutNote,
    setPayoutNote,
    submittingPayout,
    statementWalletId,
    statementTechName,
    historyList,
    loadingHistory,
    loadWalletData,
    loadPendingRequests,
    loadHistory,
    initiatePayout,
    handlePayoutSubmit,
  };
}
