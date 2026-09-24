import React, { useState, useEffect } from 'react';
import API from '../services/api';

export default function PartyProfileModal({
  isOpen,
  onClose,
  partyType = 'customer',
  partyId,
  onPartyUpdated,
  initialTab = 'overview'
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    role_or_type: '',
    role_id: 3
  });
  const [editLoading, setEditLoading] = useState(false);

  // Financial action form state
  const [finAction, setFinAction] = useState(partyType === 'staff' ? 'salary' : 'due');
  const [finForm, setFinForm] = useState({
    account_id: '',
    amount: '',
    note: ''
  });
  const [finLoading, setFinLoading] = useState(false);
  const [finError, setFinError] = useState('');
  const [finSuccess, setFinSuccess] = useState('');

  // Wallet state
  const [walletData, setWalletData] = useState(null);
  const [walletAction, setWalletAction] = useState('deposit');
  const [walletForm, setWalletForm] = useState({ account_id: '', amount: '', note: '', reference: '' });
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState('');
  const [walletSuccess, setWalletSuccess] = useState('');
  const [editingTxId, setEditingTxId] = useState(null);
  const [editingAmount, setEditingAmount] = useState('');
  const [wTxBusy, setWTxBusy] = useState(false);

  // Wallet types created by sale/purchase flows — cannot be deleted/edited individually
  const SYSTEM_WALLET_TYPES = ['sale_payment', 'sale_edit_refund', 'sale_delete_refund', 'purchase_payment', 'purchase_delete_refund', 'wallet_settlement'];
  const isManualWalletTx = (tx) => !SYSTEM_WALLET_TYPES.includes(tx.type);

  // Delete state
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Fetch party profile data and wallets
  const fetchPartyData = async () => {
    if (!partyId || !partyType) return;
    try {
      setLoading(true);
      setError('');

      const [partyRes, walletsRes, walletLedgerRes] = await Promise.all([
        fetch(`${API}/parties/${partyType}/${partyId}`),
        fetch(`${API}/accounts/wallets`),
        fetch(`${API}/wallets/${partyType}/${partyId}`)
      ]);

      if (!partyRes.ok) {
        const errJson = await partyRes.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to load profile details');
      }

      const pData = await partyRes.json();
      setProfileData(pData);

      // Pre-fill edit form
      const prof = pData.profile || {};
      setEditForm({
        name: prof.name || '',
        phone: prof.phone || '',
        email: prof.email || '',
        address: prof.address || '',
        role_or_type: prof.customer_type || prof.contact_person || prof.role_name || '',
        role_id: prof.role_id || 3
      });

      // Pre-fill financial form with current due if available and action is 'due'
      const currentDue = Math.abs(parseFloat(prof.balance || 0));
      if (finAction === 'due' && currentDue > 0) {
        setFinForm((prev) => ({
          ...prev,
          amount: String(currentDue)
        }));
      }

      if (walletsRes.ok) {
        const wData = await walletsRes.json();
        const wList = wData.data || [];
        setWallets(wList);
        if (wList.length > 0 && !finForm.account_id) {
          setFinForm((prev) => ({ ...prev, account_id: String(wList[0].id) }));
        }
        if (wList.length > 0 && !walletForm.account_id) {
          setWalletForm((prev) => ({ ...prev, account_id: String(wList.find((w) => (w.account_type || '').toLowerCase() === 'drawer')?.id || wList[0].id) }));
        }
      }
      if (walletLedgerRes.ok) {
        const wData = await walletLedgerRes.json();
        setWalletData(wData);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Network error loading profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && partyId) {
      setActiveTab(initialTab || 'overview');
      setFinAction(partyType === 'staff' ? 'salary' : 'due');
      setFinError('');
      setFinSuccess('');
      setError('');
      setSuccessMsg('');
      setDeleteError('');
      setWalletAction(partyType === 'staff' ? 'salary' : 'deposit');
      setWalletError('');
      setWalletSuccess('');
      setWalletForm({ account_id: '', amount: '', note: '', reference: '' });
      fetchPartyData();
    }
  }, [isOpen, partyId, partyType, initialTab]);

  if (!isOpen) return null;

  const profile = profileData?.profile || {};
  const stats = profileData?.stats || {};
  const sales = profileData?.sales || [];
  const purchaseOrders = profileData?.purchase_orders || [];
  const transactions = profileData?.transactions || [];
  const activityCount = profile.activity_count || 0;
  const balance = parseFloat(profile.balance || 0);
  const walletBalance = parseFloat(walletData?.party?.wallet_balance || profile.wallet_balance || 0);
  const walletTransactions = walletData?.transactions || [];

  // Type badge styling
  const typeBadgeColors = {
    customer: { bg: '#e0f2fe', text: '#0369a1', label: 'Customer' },
    supplier: { bg: '#d1fae5', text: '#059669', label: 'Supplier' },
    staff: { bg: '#ede9fe', text: '#7c3aed', label: 'Staff' }
  }[partyType] || { bg: '#f1f5f9', text: '#475569', label: partyType };

  // Handle Edit Profile Save
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      setError('Name is required');
      return;
    }
    try {
      setEditLoading(true);
      setError('');
      setSuccessMsg('');

      const res = await fetch(`${API}/parties/${partyType}/${partyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile');

      setSuccessMsg('Profile updated successfully!');
      await fetchPartyData();
      if (onPartyUpdated) onPartyUpdated();
    } catch (err) {
      setError(err.message || 'Error updating profile');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Financial Action Submit
  const handleFinSubmit = async (e) => {
    e.preventDefault();
    setFinError('');
    setFinSuccess('');

    const numAmount = parseFloat(finForm.amount);
    if (!numAmount || numAmount <= 0) {
      setFinError('Please enter a valid positive amount.');
      return;
    }

    if (!finForm.account_id) {
      setFinError('Please select a payment wallet/account.');
      return;
    }

    try {
      setFinLoading(true);

      let actionTypeToSend = finAction;
      if (partyType === 'supplier') {
        actionTypeToSend = finAction === 'due' ? 'due_payment' : 'advance_payment';
      } else if (partyType === 'customer') {
        actionTypeToSend = finAction === 'due' ? 'due_receive' : finAction === 'advance' ? 'advance_receive' : 'refund';
      } else if (partyType === 'staff') {
        actionTypeToSend = 'salary_payment';
      }

      const res = await fetch(`${API}/parties/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          party_type: partyType,
          party_id: Number(partyId),
          action_type: actionTypeToSend,
          account_id: Number(finForm.account_id),
          amount: numAmount,
          note: finForm.note.trim() || `${actionTypeToSend.toUpperCase()} via Profile Modal`
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Transaction failed');

      setFinSuccess(data.message || 'Transaction completed successfully!');
      setFinForm((prev) => ({ ...prev, note: '' }));
      await fetchPartyData();
      if (onPartyUpdated) onPartyUpdated();
    } catch (err) {
      setFinError(err.message || 'Error processing transaction');
    } finally {
      setFinLoading(false);
    }
  };

  // Handle Wallet Action Submit
  // Customer due_payment is an internal wallet settlement (drawer unchanged) so no account is needed.
  // Supplier deposit/withdraw are purely wallet tag changes (drawer reservation) — no account needed.
  // Only actions that move real money in/out of a shop account require account selection.
  const walletNeedsAccount = () => {
    if (partyType === 'supplier' && (walletAction === 'deposit' || walletAction === 'withdraw')) return false;
    if (walletAction === 'due_payment' && partyType === 'customer') return false;
    if (partyType === 'staff' && (walletAction === 'salary' || walletAction === 'bonus')) return false;
    return true;
  };
  const handleWalletSubmit = async (e) => {
    e.preventDefault();
    setWalletError('');
    setWalletSuccess('');
    const numAmount = parseFloat(walletForm.amount);
    if (!numAmount || numAmount <= 0) {
      setWalletError('Please enter a valid positive amount.');
      return;
    }
    const needsAccount = walletNeedsAccount();
    if (needsAccount && !walletForm.account_id) {
      setWalletError('Please select a shop account (Cash / Bank / MFS).');
      return;
    }
    try {
      setWalletLoading(true);
      const res = await fetch(`${API}/wallets/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          party_type: partyType,
          party_id: Number(partyId),
          action: walletAction,
          account_id: needsAccount ? Number(walletForm.account_id) : null,
          amount: numAmount,
          note: walletForm.note.trim() || `${walletAction.toUpperCase()} via Wallet`,
          reference: walletForm.reference.trim() || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Wallet transaction failed');
      setWalletSuccess(data.message || 'Wallet transaction completed successfully!');
      setWalletForm((prev) => ({ ...prev, note: '', reference: '' }));
      await fetchPartyData();
      if (onPartyUpdated) onPartyUpdated();
    } catch (err) {
      setWalletError(err.message || 'Error processing wallet transaction');
    } finally {
      setWalletLoading(false);
    }
  };

  // Revert a wallet transaction (full rollback via backend)
  const handleDeleteWalletTx = async (tx) => {
    if (!window.confirm(`Revert wallet transaction #${tx.id} (${tx.type}, ৳ ${Number(tx.amount).toLocaleString()})?\n\nWallet balance, receivable/payable and the shop account will be fully rolled back. A reversal entry stays in the history ledger.`)) return;
    try {
      setWTxBusy(true);
      setWalletError('');
      setWalletSuccess('');
      const res = await fetch(`${API}/wallets/transaction/${tx.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reversal failed');
      setWalletSuccess(data.message || 'Wallet transaction reversed successfully.');
      setEditingTxId(null);
      await fetchPartyData();
      if (onPartyUpdated) onPartyUpdated();
    } catch (err) {
      setWalletError(err.message || 'Could not reverse wallet transaction.');
    } finally {
      setWTxBusy(false);
    }
  };

  // Edit a wallet transaction amount (delta rollback & reapply via backend)
  const handleEditWalletTx = async (tx) => {
    const numAmount = parseFloat(editingAmount);
    if (!numAmount || numAmount <= 0) {
      setWalletError('Please enter a valid positive amount for the new value.');
      return;
    }
    try {
      setWTxBusy(true);
      setWalletError('');
      setWalletSuccess('');
      const res = await fetch(`${API}/wallets/transaction/${tx.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Edit failed');
      setWalletSuccess(data.message || 'Wallet transaction updated successfully.');
      setEditingTxId(null);
      setEditingAmount('');
      await fetchPartyData();
      if (onPartyUpdated) onPartyUpdated();
    } catch (err) {
      setWalletError(err.message || 'Could not edit wallet transaction.');
    } finally {
      setWTxBusy(false);
    }
  };

  // Handle Safe Deletion
  const handleDeleteParty = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete "${profile.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setDeleteLoading(true);
      setDeleteError('');

      const res = await fetch(`${API}/parties/${partyType}/${partyId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete party');

      alert(data.message || 'Party deleted successfully.');
      if (onPartyUpdated) onPartyUpdated();
      onClose();
    } catch (err) {
      setDeleteError(err.message || 'Could not delete party.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: typeBadgeColors.bg,
                color: typeBadgeColors.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 800,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
              }}
            >
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                  {profile.name || 'Loading Profile...'}
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: typeBadgeColors.bg,
                    color: typeBadgeColors.text,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {typeBadgeColors.label}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>#{profile.id}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '0.82rem', color: '#cbd5e1' }}>
                {profile.phone && <span>📞 {profile.phone}</span>}
                {profile.email && <span>✉️ {profile.email}</span>}
                {profile.role_or_type && (
                  <span style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                    🏷️ {profile.role_or_type}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Balance & Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
<div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                {partyType === 'customer' ? (balance > 0 ? 'Receivable Due (পাওনা)' : balance < 0 ? 'Advance Credit (অগ্রিম)' : 'Balance')
                  : partyType === 'supplier' ? (balance > 0 ? 'Payable Due (সাপ্লায়ারের পাওনা)' : balance < 0 ? 'Advance Given (অগ্রিম প্রদান)' : 'Balance')
                  : 'Account Balance'}
              </div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: balance > 0 ? (partyType === 'customer' ? '#ef4444' : '#f59e0b') : '#10b981'
                }}
              >
                ৳ {balance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
            >
              ✕
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div
          style={{
            display: 'flex',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 16px'
          }}
        >
          {[
            { id: 'overview', label: '📊 Overview & Ledger' },
            { id: 'financial', label: '💳 Financial Actions' },
            { id: 'wallet', label: `👛 Wallet (৳ ${walletBalance.toLocaleString('en-BD', { minimumFractionDigits: 2 })})` },
            { id: 'edit', label: '✏️ Edit Profile' },
            { id: 'activity', label: '🛡️ Activity & Delete' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setError('');
                setSuccessMsg('');
                setFinError('');
                setFinSuccess('');
              }}
              style={{
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #0284c7' : '3px solid transparent',
                color: activeTab === tab.id ? '#0284c7' : '#64748b',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* MODAL BODY */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>⏳ Loading profile details...</div>
              <small>Querying database for party ledgers and audit records</small>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & LEDGER */}
              {activeTab === 'overview' && (
                <div>
                  {/* Summary Metric Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Records</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                        {stats.total_invoices || stats.total_pos || stats.total_sales || 0}
                      </div>
                      <small style={{ color: '#94a3b8' }}>
                        {partyType === 'customer' ? 'Sales Invoices' : partyType === 'supplier' ? 'Purchase POs' : 'Created Orders'}
                      </small>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Lifetime Volume</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
                        ৳ {Number(stats.lifetime_purchases || stats.lifetime_orders || stats.total_sales_volume || 0).toLocaleString('en-BD')}
                      </div>
                      <small style={{ color: '#94a3b8' }}>Cumulative Turnover</small>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Lifetime Paid</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
                        ৳ {Number(stats.lifetime_paid || 0).toLocaleString('en-BD')}
                      </div>
                      <small style={{ color: '#94a3b8' }}>Cleared Payments</small>
                    </div>

                    <div style={{ background: balance > 0 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${balance > 0 ? '#fecaca' : '#bbf7d0'}`, borderRadius: '10px', padding: '14px' }}>
                      <span style={{ fontSize: '0.75rem', color: balance > 0 ? '#b91c1c' : '#15803d', textTransform: 'uppercase', fontWeight: 600 }}>
                        {partyType === 'customer' ? (balance > 0 ? 'Outstanding Due' : balance < 0 ? 'Advance Credit' : 'Balance') : partyType === 'supplier' ? (balance > 0 ? 'Payable Due' : balance < 0 ? 'Advance Given' : 'Balance') : 'Balance'}
                      </span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: balance > 0 ? '#dc2626' : '#16a34a', marginTop: '4px' }}>
                        ৳ {balance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </div>
                      <small style={{ color: balance > 0 ? '#ef4444' : '#16a34a' }}>
                        {balance > 0 ? 'Pending Settlement' : balance < 0 ? (partyType === 'customer' ? 'Advance credit balance' : 'Advance given balance') : 'All Cleared'}
                      </small>
                    </div>
                  </div>

                  {/* Profile Details Box */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#0f172a', fontWeight: 700 }}>
                      📋 Contact & System Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                      <div><strong style={{ color: '#64748b' }}>Full Name:</strong> <span style={{ color: '#0f172a', fontWeight: 600 }}>{profile.name}</span></div>
                      <div><strong style={{ color: '#64748b' }}>Phone:</strong> <span style={{ color: '#0f172a', fontWeight: 600 }}>{profile.phone || '—'}</span></div>
                      <div><strong style={{ color: '#64748b' }}>Email:</strong> <span style={{ color: '#0f172a' }}>{profile.email || '—'}</span></div>
                      <div><strong style={{ color: '#64748b' }}>Address:</strong> <span style={{ color: '#0f172a' }}>{profile.address || '—'}</span></div>
                      <div><strong style={{ color: '#64748b' }}>Classification:</strong> <span style={{ color: '#0f172a', fontWeight: 600 }}>{profile.customer_type || profile.contact_person || profile.role_name || 'Standard'}</span></div>
                      <div><strong style={{ color: '#64748b' }}>Registered On:</strong> <span style={{ color: '#0f172a' }}>{new Date(profile.created_at).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
                      {profile.loyalty_points !== undefined && (
                        <div><strong style={{ color: '#64748b' }}>Loyalty Points:</strong> <span style={{ color: '#d97706', fontWeight: 700 }}>★ {profile.loyalty_points} pts</span></div>
                      )}
                    </div>
                  </div>

                  {/* Recent Invoices / Activity Table */}
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#0f172a', fontWeight: 700 }}>
                      {partyType === 'customer' ? '🧾 Recent Sales Invoices' : partyType === 'supplier' ? '📦 Recent Purchase Orders' : '📋 Recent Activity'}
                    </h4>
                    {partyType === 'customer' && (
                      sales.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No sales invoices recorded for this customer yet.</p>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                              <th style={{ padding: '8px 10px' }}>Invoice #</th>
                              <th style={{ padding: '8px 10px' }}>Date</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Paid</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Due</th>
                              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sales.map((s) => (
                              <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0284c7' }}>{s.invoice_no}</td>
                                <td style={{ padding: '8px 10px', color: '#64748b' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>৳ {Number(s.total_amount).toLocaleString()}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#16a34a' }}>৳ {Number(s.paid_amount).toLocaleString()}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', color: Number(s.due_amount) > 0 ? '#ef4444' : '#64748b', fontWeight: 700 }}>
                                  ৳ {Number(s.due_amount).toLocaleString()}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                  <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: s.payment_status === 'paid' ? '#dcfce7' : '#fee2e2', color: s.payment_status === 'paid' ? '#15803d' : '#b91c1c', fontWeight: 700, textTransform: 'uppercase' }}>
                                    {s.payment_status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )
                    )}

                    {partyType === 'supplier' && (
                      purchaseOrders.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No purchase orders recorded for this supplier yet.</p>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                              <th style={{ padding: '8px 10px' }}>PO Number</th>
                              <th style={{ padding: '8px 10px' }}>Date</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total Cost</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Paid</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Due</th>
                              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {purchaseOrders.map((po) => (
                              <tr key={po.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '8px 10px', fontWeight: 700, color: '#059669' }}>{po.po_number}</td>
                                <td style={{ padding: '8px 10px', color: '#64748b' }}>{new Date(po.created_at).toLocaleDateString()}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>৳ {Number(po.total_cost).toLocaleString()}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#16a34a' }}>৳ {Number(po.total_paid || 0).toLocaleString()}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', color: Number(po.total_due) > 0 ? '#ef4444' : '#64748b', fontWeight: 700 }}>
                                  ৳ {Number(po.total_due || 0).toLocaleString()}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                  <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
                                    {po.status || 'Received'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )
                    )}

                    {partyType === 'staff' && (
                      sales.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No sales logged under this staff member yet.</p>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                              <th style={{ padding: '8px 10px' }}>Invoice #</th>
                              <th style={{ padding: '8px 10px' }}>Date</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount</th>
                              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sales.map((s) => (
                              <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '8px 10px', fontWeight: 700, color: '#7c3aed' }}>{s.invoice_no}</td>
                                <td style={{ padding: '8px 10px', color: '#64748b' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>৳ {Number(s.total_amount).toLocaleString()}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>{s.payment_status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: FINANCIAL ACTIONS (Dynamic per partyType) */}
              {activeTab === 'financial' && (
                <div>
                  {/* Party-Specific Sub Action Buttons */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
{partyType === 'supplier' && [
                      { id: 'due', label: '💸 Pay Due (বকেয়া পরিশোধ)' },
                    ].map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => {
                          setFinAction(act.id);
                          setFinError('');
                          setFinSuccess('');
                          if (act.id === 'due' && balance > 0) {
                            setFinForm((prev) => ({ ...prev, amount: String(balance) }));
                          } else {
                            setFinForm((prev) => ({ ...prev, amount: '' }));
                          }
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: finAction === act.id ? '2px solid #059669' : '1px solid #cbd5e1',
                          background: finAction === act.id ? '#ecfdf5' : '#ffffff',
                          color: finAction === act.id ? '#047857' : '#475569',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          cursor: 'pointer'
                        }}
                      >
                        {act.label}
                      </button>
                    ))}

{partyType === 'customer' && [
                      { id: 'due', label: '💵 Collect Due (বকেয়া আদায়)' },
                      { id: 'refund', label: '📤 Refund / Return Payout (রিফান্ড প্রদান)' }
                    ].map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => {
                          setFinAction(act.id);
                          setFinError('');
                          setFinSuccess('');
                          if (act.id === 'due' && balance > 0) {
                            setFinForm((prev) => ({ ...prev, amount: String(balance) }));
                          } else {
                            setFinForm((prev) => ({ ...prev, amount: '' }));
                          }
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: finAction === act.id ? '2px solid #0284c7' : '1px solid #cbd5e1',
                          background: finAction === act.id ? '#e0f2fe' : '#ffffff',
                          color: finAction === act.id ? '#0369a1' : '#475569',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          cursor: 'pointer'
                        }}
                      >
                        {act.label}
                      </button>
                    ))}

                    {partyType === 'staff' && [
                      { id: 'salary', label: '💼 Pay Salary / Advance (বেতন বা অগ্রিম প্রদান)' }
                    ].map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => {
                          setFinAction(act.id);
                          setFinError('');
                          setFinSuccess('');
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: '2px solid #7c3aed',
                          background: '#f5f3ff',
                          color: '#6d28d9',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          cursor: 'pointer'
                        }}
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>

                  {/* Informational Guidance Banner explaining accounting reality */}
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      fontSize: '0.84rem',
                      lineHeight: '1.4',
                      background: partyType === 'supplier' ? '#f0fdf4' : partyType === 'customer' ? '#f0f9ff' : '#faf5ff',
                      border: `1px solid ${partyType === 'supplier' ? '#bbf7d0' : partyType === 'customer' ? '#bae6fd' : '#e9d5ff'}`,
                      color: partyType === 'supplier' ? '#166534' : partyType === 'customer' ? '#0369a1' : '#6b21a8'
                    }}
                  >
{partyType === 'supplier' && (
                        '💡 সাপ্লায়ারের কোনো ওয়ালেট নেই। এই পেমেন্ট আপনার নির্বাচিত শপ অ্যাকাউন্ট (ক্যাশ ড্রয়ার / ব্যাংক / এমএফএস) থেকে সরাসরি পরিশোধ হবে এবং সাপ্লায়ারের বাকি (Payable Due) সমন্বয় হয়ে কমবে।'
                    )}
{partyType === 'customer' && (
                      finAction === 'due'
                        ? '💡 কাস্টমার থেকে প্রাপ্ত বকেয়া টাকা আপনার দোকানের নির্বাচিত অ্যাকাউন্ট (ক্যাশ/ব্যাংক/এমএফএস)-এ জমা হবে এবং কাস্টমারের বাকি (Receivable Due) কমে যাবে।'
                        : '💡 পণ্য ফেরত বা অতিরিক্ত অর্থ কাস্টমারকে ফেরত প্রদান। এই টাকা আপনার নির্বাচিত শপ অ্যাকাউন্ট থেকে কাস্টমারকে পরিশোধ করা হবে।'
                    )}
                    {partyType === 'staff' && (
                      '💡 স্টাফের মাসিক বেতন, কমিশন বা কনভেয়েন্স অগ্রিম প্রদান। এটি আপনার নির্বাচিত শপ অ্যাকাউন্ট (ক্যাশ ড্রয়ার/ব্যাংক/এমএফএস) থেকে খরচ হিসেবে কর্তন হবে।'
                    )}
                  </div>

                  {finError && (
                    <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '14px', fontSize: '0.88rem' }}>
                      ⚠️ {finError}
                    </div>
                  )}

                  {finSuccess && (
                    <div style={{ padding: '10px 14px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', marginBottom: '14px', fontSize: '0.88rem' }}>
                      ✓ {finSuccess}
                    </div>
                  )}

                  <form onSubmit={handleFinSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                      {/* Shop Payment Account (Cash / Bank / MFS) */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          {partyType === 'customer' && finAction !== 'refund'
                            ? '📥 Deposit Into Shop Account (জমার অ্যাকাউন্ট) *'
                            : '💸 Pay From Shop Account (পরিশোধের অ্যাকাউন্ট) *'}
                        </label>
                        <select
                          value={finForm.account_id}
                          onChange={(e) => setFinForm({ ...finForm, account_id: e.target.value })}
                          required
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '0.88rem',
                            outline: 'none',
                            background: '#fff'
                          }}
                        >
                          <option value="">Select Shop Account (Cash / Bank / MFS)...</option>
                          {wallets.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.account_name || w.name} (৳ {Number(w.balance || 0).toLocaleString()})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Amount */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          Amount (BDT ৳) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          placeholder={finAction === 'due' && balance > 0 ? String(balance) : 'e.g. 500'}
                          value={finForm.amount}
                          onChange={(e) => setFinForm({ ...finForm, amount: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    {/* Note / Reference */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Reference / Note (লেনদেনের নোট বা ভাউচার নম্বর)
                      </label>
                      <input
                        type="text"
                        placeholder={
                          partyType === 'supplier'
                            ? 'e.g. Paid via bKash / Bank Cheque for PO'
                            : partyType === 'customer'
                            ? (finAction === 'due' ? 'e.g. Cash received for sales invoice' : 'e.g. Return payout for damaged unit')
                            : 'e.g. Monthly salary / Travel conveyance advance'
                        }
                        value={finForm.note}
                        onChange={(e) => setFinForm({ ...finForm, note: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontSize: '0.88rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={finLoading}
                      style={{
                        padding: '10px 22px',
                        background:
                          partyType === 'supplier'
                            ? '#059669'
                            : partyType === 'staff'
                            ? '#7c3aed'
                            : finAction === 'refund'
                            ? '#dc2626'
                            : '#0284c7',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        opacity: finLoading ? 0.7 : 1,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      {finLoading
                        ? 'Processing Transaction...'
                        : partyType === 'supplier'
                        ? `💸 Confirm Due Payment to Supplier (${finForm.amount ? `৳ ${Number(finForm.amount).toLocaleString()}` : ''})`
                        : partyType === 'customer'
                        ? finAction === 'due'
                          ? `💵 Confirm Due Collection (${finForm.amount ? `৳ ${Number(finForm.amount).toLocaleString()}` : ''})`
                          : `📤 Confirm Refund Payout (${finForm.amount ? `৳ ${Number(finForm.amount).toLocaleString()}` : ''})`
                        : `💼 Confirm Staff Payment (${finForm.amount ? `৳ ${Number(finForm.amount).toLocaleString()}` : ''})`}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: WALLET & LEDGER */}
              {activeTab === 'wallet' && (
                <div>
                  {/* Wallet Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '18px' }}>
                    <div style={{ background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '16px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#7c3aed', textTransform: 'uppercase', fontWeight: 700 }}>👛 Wallet Balance</span>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#6d28d9', marginTop: '4px' }}>
                        ৳ {walletBalance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </div>
                      <small style={{ color: '#a78bfa' }}>
                        {partyType === 'staff' ? 'Credit wallet — drawer unchanged until withdrawal' : 'Available credit in wallet'}
                      </small>
                    </div>
                    <div style={{ background: balance > 0 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${balance > 0 ? '#fecaca' : '#bbf7d0'}`, borderRadius: '10px', padding: '16px' }}>
                      <span style={{ fontSize: '0.75rem', color: balance > 0 ? '#b91c1c' : '#15803d', textTransform: 'uppercase', fontWeight: 700 }}>
                        {partyType === 'customer' ? (balance > 0 ? 'Outstanding Due' : balance < 0 ? 'Advance Credit' : 'Net Position') : partyType === 'supplier' ? (balance > 0 ? 'Payable Due' : balance < 0 ? 'Advance Given' : 'Net Position') : 'Net Position'}
                      </span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: balance > 0 ? '#dc2626' : '#16a34a', marginTop: '4px' }}>
                        ৳ {balance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </div>
                      <small style={{ color: balance > 0 ? '#ef4444' : '#16a34a' }}>
                        {partyType === 'staff' ? 'Linked sales/ledger position' : balance > 0 ? 'Pending settlement' : balance < 0 ? (partyType === 'customer' ? 'Advance credit balance' : 'Advance given balance') : 'All cleared'}
                      </small>
                    </div>
                  </div>

                  {/* Wallet Actions */}
                  <div style={{ marginBottom: '14px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#0f172a', fontWeight: 700 }}>🪙 Wallet Operations</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {partyType === 'customer' && [
                        { id: 'deposit', label: '📥 Deposit (ওয়ালেটে জমা)' },
                        { id: 'withdraw', label: '📤 Withdraw / Refund (উত্তোলন)' },
                        { id: 'due_payment', label: '💵 Pay Due From Wallet (দেনা পরিশোধ)' }
                      ].map((act) => (
                        <button
                          key={act.id}
                          type="button"
                          onClick={() => {
                            setWalletAction(act.id);
                            setWalletError('');
                            setWalletSuccess('');
                            setWalletForm((prev) => ({ ...prev, amount: '', note: '', reference: '' }));
                          }}
                          style={{
                            padding: '8px 14px', borderRadius: '8px',
                            border: walletAction === act.id ? '2px solid #6d28d9' : '1px solid #cbd5e1',
                            background: walletAction === act.id ? '#fdf4ff' : '#ffffff',
                            color: walletAction === act.id ? '#6d28d9' : '#475569',
                            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                          }}
                        >
                          {act.label}
                        </button>
                      ))}
                      {partyType === 'supplier' && [
                        { id: 'deposit', label: '📥 Deposit Into Wallet (ওয়ালেটে জমা)' },
                        { id: 'withdraw', label: '📤 Cash Back (ওয়ালেট থেকে ফেরত)' },
                        { id: 'due_payment', label: '💵 Pay Due From Wallet (দেনা পরিশোধ)' }
                      ].map((act) => (
                        <button
                          key={act.id}
                          type="button"
                          onClick={() => {
                            setWalletAction(act.id);
                            setWalletError('');
                            setWalletSuccess('');
                            setWalletForm((prev) => ({ ...prev, amount: '', note: '', reference: '' }));
                          }}
                          style={{
                            padding: '8px 14px', borderRadius: '8px',
                            border: walletAction === act.id ? '2px solid #059669' : '1px solid #cbd5e1',
                            background: walletAction === act.id ? '#ecfdf5' : '#ffffff',
                            color: walletAction === act.id ? '#047857' : '#475569',
                            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                          }}
                        >
                          {act.label}
                        </button>
                      ))}
                      {partyType === 'staff' && [
                        { id: 'salary', label: '💼 Salary (বেতন → ওয়ালেট)' },
                        { id: 'bonus', label: '🎁 Bonus (বোনাস → ওয়ালেট)' },
                        { id: 'withdraw', label: '📤 Withdraw (উত্তোলন)' }
                      ].map((act) => (
                        <button
                          key={act.id}
                          type="button"
                          onClick={() => {
                            setWalletAction(act.id);
                            setWalletError('');
                            setWalletSuccess('');
                            setWalletForm((prev) => ({ ...prev, amount: '', note: '', reference: '' }));
                          }}
                          style={{
                            padding: '8px 14px', borderRadius: '8px',
                            border: walletAction === act.id ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                            background: walletAction === act.id ? '#f5f3ff' : '#ffffff',
                            color: walletAction === act.id ? '#6d28d9' : '#475569',
                            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                          }}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wallet guidance */}
                  <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.84rem', lineHeight: '1.5', background: '#fdf4ff', border: '1px solid #e9d5ff', color: '#6b21a8' }}>
                    {partyType === 'customer' && (
                      walletAction === 'deposit'
                        ? '💡 কাস্টমারের ওয়ালেটে জমা হলে টাকা আপনার নির্বাচিত অ্যাকাউন্টে (ক্যাশ ড্রয়ার/ব্যাংক/এমএফএস) জমা হবে। পরে কোনো সেল বা বকেয়া পরিশোধে ওয়ালেট আগে ব্যবহার হবে — তখন ক্যাশ ড্রয়ার অপরিবর্তিত থাকবে, শুধু লেজারে যুক্ত হবে।'
                        : walletAction === 'withdraw'
                        ? '💡 কাস্টমার ওয়ালেট থেকে টাকা তুললে তা আপনার নির্বাচিত অ্যাকাউন্ট (ক্যাশ ড্রয়ার/ব্যাংক/এমএফএস) থেকে পরিশোধ হবে এবং ওয়ালেট কমবে।'
                        : '💡 কাস্টমারের বাকি (Receivable Due) তার ওয়ালেট থেকে পরিশোধ হবে। এতে ক্যাশ ড্রয়ার অপরিবর্তিত থাকবে — শুধু ভেতরের ট্রান্সফার ও লেজার হবে।'
                    )}
                    {partyType === 'supplier' && (
                      walletAction === 'deposit'
                        ? '💡 সাপ্লায়ারের ওয়ালেটে জমা দিলে ক্যাশ ড্রয়ার অপরিবর্তিত থাকবে — শুধু দোকানের মালিকের টাকাকে সাপ্লায়ারের হিসেবে ট্যাগ করা হচ্ছে। কোনো অ্যাকাউন্ট কর্তন হবে না।'
                        : walletAction === 'withdraw'
                        ? '💡 সাপ্লায়ার ওয়ালেট থেকে টাকা ফেরত নিলেও ক্যাশ ড্রয়ার অপরিবর্তিত থাকবে — শুধু ওয়ালেট ব্যালেন্স কমবে।'
                        : '💡 সাপ্লায়ারের বকেয়া (Payable Due) তার ওয়ালেট থেকে পরিশোধ হবে — এক্সট্র্যাক্ট অ্যাকাউন্ট (ক্যাশ ড্রয়ার/ব্যাংক/এমএফএস) থেকে সত্যিকারের টাকা কমবে।'
                    )}
                    {partyType === 'staff' && (
                      walletAction === 'salary' || walletAction === 'bonus'
                        ? '💡 বেতন/বোনাস ওয়ালেটে জমা হবে — মেইন ক্যাশ ড্রয়ার আপাতত অপরিবর্তিত থাকবে, শুধু লেজার তৈরি হবে। Bank/MFS অ্যাকাউন্ট বাছাই করলে শুধু সেই অ্যাকাউন্ট থেকে কমবে। স্টাফ ওয়ালেট থেকে উত্তোলন করলেই টাকা ক্যাশ ড্রয়ার/অ্যাকাউন্টে আসবে।'
                        : '💡 স্টাফ ওয়ালেট থেকে উত্তোলন করলে টাকা আপনার নির্বাচিত অ্যাকাউন্টে (ক্যাশ ড্রয়ার/ব্যাংক/এমএফএস) জমা হবে এবং ওয়ালেট কমবে।'
                    )}
                  </div>

                  {walletError && (
                    <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '14px', fontSize: '0.88rem' }}>⚠️ {walletError}</div>
                  )}
                  {walletSuccess && (
                    <div style={{ padding: '10px 14px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', marginBottom: '14px', fontSize: '0.88rem' }}>✓ {walletSuccess}</div>
                  )}

                  <form onSubmit={handleWalletSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                      {walletNeedsAccount() && (
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                            {partyType === 'customer'
                              ? (walletAction === 'deposit' ? '📥 Receive Into Shop Account *' : '💸 Pay From Shop Account *')
                              : partyType === 'supplier'
                              ? (walletAction === 'deposit' ? '💸 Pay From Shop Account *' : '📥 Receive Into Shop Account *')
                              : '💸 Pay Out (Withdraw) From Shop Account *'}
                          </label>
                          <select
                            value={walletForm.account_id}
                            onChange={(e) => setWalletForm({ ...walletForm, account_id: e.target.value })}
                            required
                            style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem', outline: 'none', background: '#fff' }}
                          >
                            <option value="">Select Shop Account...</option>
                            {wallets.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.account_name || w.name} (৳ {Number(w.balance || 0).toLocaleString()})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Amount (BDT ৳) *</label>
                        <input
                          type="number" step="0.01" min="0.01" required
                          placeholder="e.g. 1000"
                          value={walletForm.amount}
                          onChange={(e) => setWalletForm({ ...walletForm, amount: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Reference / Voucher (ভাউচার নম্বর)</label>
                        <input
                          type="text"
                          placeholder="e.g. DEP-2026-001"
                          value={walletForm.reference}
                          onChange={(e) => setWalletForm({ ...walletForm, reference: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Note (নোট)</label>
                        <input
                          type="text"
                          placeholder="e.g. Monthly credit deposit"
                          value={walletForm.note}
                          onChange={(e) => setWalletForm({ ...walletForm, note: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={walletLoading}
                      style={{
                        padding: '10px 22px', background: '#6d28d9', color: '#fff', border: 'none',
                        borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                        opacity: walletLoading ? 0.7 : 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      {walletLoading ? 'Processing Wallet Transaction...' : `🪙 Confirm ${walletAction.toUpperCase()} (${walletForm.amount ? `৳ ${Number(walletForm.amount).toLocaleString()}` : ''})`}
                    </button>
                  </form>

                  {/* Wallet Ledger */}
                  <div style={{ marginTop: '22px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#0f172a', fontWeight: 700 }}>
                      📒 Wallet Transaction Ledger {walletTransactions.length > 0 && <span style={{ color: '#94a3b8', fontWeight: 500 }}>({walletTransactions.length})</span>}
                    </h4>
                    {walletTransactions.length === 0 ? (
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No wallet transactions recorded yet.</p>
                    ) : (
                      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                              <th style={{ padding: '8px 10px' }}>#</th>
                              <th style={{ padding: '8px 10px' }}>Type</th>
                              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Dr/Cr</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Balance</th>
                              <th style={{ padding: '8px 10px' }}>Account</th>
                              <th style={{ padding: '8px 10px' }}>Effect</th>
                              <th style={{ padding: '8px 10px' }}>Reference</th>
                              <th style={{ padding: '8px 10px' }}>Note</th>
                              <th style={{ padding: '8px 10px' }}>Date</th>
                              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {walletTransactions.map((tx) => (
                              <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '8px 10px', color: '#94a3b8' }}>#{tx.id}</td>
                                <td style={{ padding: '8px 10px' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase',
                                    background: (tx.type.includes('deposit') || tx.type.includes('salary') || tx.type.includes('bonus')) ? '#dcfce7' : '#fee2e2',
                                    color: (tx.type.includes('deposit') || tx.type.includes('salary') || tx.type.includes('bonus')) ? '#15803d' : '#b91c1c' }}>
                                    {tx.type}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800, color: tx.credit ? '#16a34a' : '#dc2626' }}>
                                  {tx.credit ? 'Cr +' : 'Dr −'}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>৳ {Number(tx.amount).toLocaleString('en-BD')}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b' }}>৳ {Number(tx.balance_after).toLocaleString('en-BD')}</td>
                                <td style={{ padding: '8px 10px', color: '#475569' }}>{tx.account_name || (tx.account_effect === 'none' ? '—' : '#') + (tx.account_id || '')}</td>
                                <td style={{ padding: '8px 10px', color: '#64748b' }}>
                                  {tx.cash_drawer_effect === 'in' ? 'Drawer +' : tx.cash_drawer_effect === 'out' ? 'Drawer −' : tx.account_effect === 'none' ? 'No movement' : `${tx.account_effect === 'in' ? 'Acct +' : 'Acct −'}`}
                                </td>
                                <td style={{ padding: '8px 10px', color: '#0284c7', fontWeight: 600 }}>{tx.reference || '—'}</td>
                                <td style={{ padding: '8px 10px', color: '#64748b', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={tx.note}>{tx.note || '—'}</td>
                                <td style={{ padding: '8px 10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{new Date(tx.created_at).toLocaleString('en-BD')}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                  {editingTxId === tx.id ? (
                                    <>
                                      <input
                                        type="number" step="0.01" min="0.01"
                                        value={editingAmount}
                                        onChange={(e) => setEditingAmount(e.target.value)}
                                        style={{ width: '90px', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', marginRight: '4px' }}
                                      />
                                      <button
                                        type="button"
                                        disabled={wTxBusy}
                                        onClick={() => handleEditWalletTx(tx)}
                                        style={{ padding: '4px 8px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', marginRight: '4px' }}
                                      >✓</button>
                                      <button
                                        type="button"
                                        onClick={() => { setEditingTxId(null); setEditingAmount(''); }}
                                        style={{ padding: '4px 8px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                                      >✕</button>
                                    </>
                                  ) : isManualWalletTx(tx) ? (
                                    <>
                                      <button
                                        type="button"
                                        disabled={wTxBusy}
                                        onClick={() => { setEditingTxId(tx.id); setEditingAmount(String(tx.amount)); setWalletError(''); setWalletSuccess(''); }}
                                        title="Edit amount (delta rollback & reapply)"
                                        style={{ padding: '4px 8px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', marginRight: '4px' }}
                                      >✏️</button>
                                      <button
                                        type="button"
                                        disabled={wTxBusy}
                                        onClick={() => handleDeleteWalletTx(tx)}
                                        title="Revert with full rollback"
                                        style={{ padding: '4px 8px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                                      >🗑️</button>
                                    </>
                                  ) : (
                                    <small style={{ color: '#94a3b8' }} title="Created by sale/purchase flow — delete the source invoice instead">🔒</small>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: EDIT PROFILE */}
              {activeTab === 'edit' && (
                <div>
                  {error && (
                    <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '14px', fontSize: '0.88rem' }}>
                      ⚠️ {error}
                    </div>
                  )}
                  {successMsg && (
                    <div style={{ padding: '10px 14px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', marginBottom: '14px', fontSize: '0.88rem' }}>
                      ✓ {successMsg}
                    </div>
                  )}

                  <form onSubmit={handleEditSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Full Name *</label>
                        <input
                          type="text"
                          required
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Phone Number</label>
                        <input
                          type="text"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Email Address</label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          {partyType === 'customer' ? 'Customer Type' : partyType === 'supplier' ? 'Contact Person / Designation' : 'Staff Role'}
                        </label>
                        {partyType === 'customer' ? (
                          <select
                            value={editForm.role_or_type}
                            onChange={(e) => setEditForm({ ...editForm, role_or_type: e.target.value })}
                            style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem', background: '#fff', boxSizing: 'border-box' }}
                          >
                            <option value="retail">Retail</option>
                            <option value="wholesale">Wholesale</option>
                            <option value="corporate">Corporate</option>
                          </select>
                        ) : partyType === 'staff' ? (
                          <select
                            value={editForm.role_id}
                            onChange={(e) => setEditForm({ ...editForm, role_id: Number(e.target.value) })}
                            style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem', background: '#fff', boxSizing: 'border-box' }}
                          >
                            <option value={1}>Super Admin</option>
                            <option value={2}>Admin</option>
                            <option value={3}>Staff</option>
                            <option value={4}>Online Technician</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={editForm.role_or_type}
                            onChange={(e) => setEditForm({ ...editForm, role_or_type: e.target.value })}
                            style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                          />
                        )}
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Physical Address</label>
                      <textarea
                        rows={2}
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={editLoading}
                      style={{
                        padding: '10px 20px',
                        background: '#0f172a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        opacity: editLoading ? 0.7 : 1
                      }}
                    >
                      {editLoading ? 'Saving Changes...' : 'Save Profile Changes'}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 4: ACTIVITY & SAFE DELETION */}
              {activeTab === 'activity' && (
                <div>
                  <div
                    style={{
                      background: activityCount > 0 || Math.abs(balance) > 0 ? '#fffbeb' : '#f0fdf4',
                      border: `1px solid ${activityCount > 0 || Math.abs(balance) > 0 ? '#fde68a' : '#bbf7d0'}`,
                      borderRadius: '10px',
                      padding: '16px',
                      marginBottom: '20px'
                    }}
                  >
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: activityCount > 0 || Math.abs(balance) > 0 ? '#92400e' : '#166534', fontWeight: 700 }}>
                      {activityCount > 0 || Math.abs(balance) > 0 ? '⚠️ Account Audit Protection Active' : '✓ Safe for Deletion'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: activityCount > 0 || Math.abs(balance) > 0 ? '#b45309' : '#15803d' }}>
                      {activityCount > 0 || Math.abs(balance) > 0
                        ? `This party has ${activityCount} linked financial records and an active balance of ৳ ${balance.toLocaleString('en-BD')}. To preserve financial ledger audit integrity, deletion is disabled.`
                        : 'This party has 0 linked sales, purchases, or ledger transactions. It can be safely removed.'}
                    </p>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                    <h5 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', color: '#0f172a' }}>Audit Checklist</h5>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#475569', lineHeight: 1.8 }}>
                      <li>Linked Sales / Purchase Orders: <strong>{stats.total_invoices || stats.total_pos || stats.total_sales || 0} records</strong></li>
                      <li>Linked Quotations: <strong>{profileData?.quotations?.length || 0} records</strong></li>
                      <li>Direct Ledger Transactions: <strong>{transactions.length} records</strong></li>
                      <li>Current Ledger Balance: <strong>৳ {balance.toLocaleString('en-BD')}</strong></li>
                    </ul>
                  </div>

                  {deleteError && (
                    <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '14px', fontSize: '0.88rem' }}>
                      ⚠️ {deleteError}
                    </div>
                  )}

                  {activityCount === 0 && Math.abs(balance) === 0 ? (
                    <button
                      type="button"
                      onClick={handleDeleteParty}
                      disabled={deleteLoading}
                      style={{
                        padding: '10px 18px',
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      🗑️ {deleteLoading ? 'Deleting...' : 'Delete Party Permanently'}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.85rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>🔒</span>
                      <span>Deletion locked due to existing activity. You can modify or deactivate this profile in the <strong>Edit Profile</strong> tab.</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            padding: '14px 24px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
