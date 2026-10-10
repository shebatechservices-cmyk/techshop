import { useState, useEffect, useCallback } from 'react';
import API from '../../../services/api';

export default function useTechnicianWallet(currentUser) {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'ledger' | 'requests'
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

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

  const fetchRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      const res = await fetch(`${API}/staff/wallet/${userId}/requests`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setRequests(json.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching wallet requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWallet();
    fetchRequests();
  }, [fetchWallet, fetchRequests]);

  const submitWalletRequest = async ({ type, amount, channel, reference_id, notes }) => {
    try {
      const res = await fetch(`${API}/staff/wallet/${userId}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, amount, channel, reference_id, notes }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message || 'রিকোয়েস্ট সফলভাবে জমা হয়েছে!', 'success');
        await fetchRequests();
        setIsRequestModalOpen(false);
        return { success: true };
      } else {
        showToast(json.message || 'রিকোয়েস্ট জমা দিতে ব্যর্থ হয়েছে', 'error');
        return { success: false, message: json.message };
      }
    } catch (err) {
      console.error('Error submitting wallet request:', err);
      showToast('সার্ভার এরর হয়েছে', 'error');
      return { success: false, message: 'Server error' };
    }
  };

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
    transactions,
    requests,
    loadingRequests,
    fetchRequests,
    submitWalletRequest,
    isRequestModalOpen,
    setIsRequestModalOpen,
  };
}
