import { useState, useEffect, useCallback } from 'react';
import API from '../../../services/api';

export default function useTechnicianWallet(currentUser) {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'ledger'
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const userId = currentUser?.id || 1;

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  }, []);

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/staff/wallet/${userId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setWalletData(json.data);
        }
      } else {
        showToast('Failed to load wallet data', 'error');
      }
    } catch (err) {
      console.error('Error fetching technician wallet:', err);
      showToast('Server error occurred', 'error');
    } finally {
      setLoading(false);
    }
  }, [userId, showToast]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const summary = walletData?.summary || {
    walletBalance: currentUser?.wallet_balance || 0,
    totalEarnedCommission: 0,
    totalProjects: 0,
    completedProjects: 0,
    ongoingProjects: 0
  };

  const projects = walletData?.projects || [];
  const transactions = walletData?.transactions || [];

  return {
    walletData,
    loading,
    activeTab,
    setActiveTab,
    toast,
    showToast,
    fetchWallet,
    userId,
    summary,
    projects,
    transactions
  };
}
