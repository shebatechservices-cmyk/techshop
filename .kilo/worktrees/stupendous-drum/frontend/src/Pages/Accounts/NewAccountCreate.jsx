import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';

export default function NewAccountCreate() {
  const [tenders, setTenders] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Active user info
  const activeUser = useMemo(() => {
    try {
      const stored = localStorage.getItem('sheba_auth_user') || sessionStorage.getItem('sheba_auth_user');
      if (stored) {
        const u = JSON.parse(stored);
        return u.name || u.role_title || 'Super Admin';
      }
    } catch {
      // fallback
    }
    return 'Super Admin';
  }, []);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenderFilter, setSelectedTenderFilter] = useState('ALL');

  // Inline Modal States
  const [isTenderModalOpen, setIsTenderModalOpen] = useState(false);
  const [returnToAccountModal, setReturnToAccountModal] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [isManageTendersModalOpen, setIsManageTendersModalOpen] = useState(false);

  const [submittingTender, setSubmittingTender] = useState(false);
  const [submittingAccount, setSubmittingAccount] = useState(false);
  const [submittingEditAccount, setSubmittingEditAccount] = useState(false);

  // Add Tender Form State
  const [newTenderName, setNewTenderName] = useState('');
  const [editingTender, setEditingTender] = useState(null); // { id, name }

  // Add Account Form State (Cascading logic: tenderId must be selected first)
  const [newAccountForm, setNewAccountForm] = useState({
    tenderId: '',
    accountName: '',
    location: '',
    openingBalance: '',
    referenceId: '',
  });

  // Edit Account Form State
  const [editAccountForm, setEditAccountForm] = useState({
    id: null,
    tenderId: '',
    accountName: '',
    location: '',
    openingBalance: '',
    currentBalance: '',
    referenceId: '',
  });

  // Balance edit modal state (quick adjustment)
  const [balanceEditModal, setBalanceEditModal] = useState({ isOpen: false, account: null, newBalance: '' });
  const [updatingBalance, setUpdatingBalance] = useState(false);

  // Fetch initial data directly from PostgreSQL backend
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [tendersRes, accountsRes] = await Promise.all([
        fetch(`${API}/accounts/tenders`),
        fetch(`${API}/accounts/account-records`),
      ]);

      if (tendersRes.ok) {
        const tData = await tendersRes.json();
        setTenders(tData.data || []);
      }
      if (accountsRes.ok) {
        const aData = await accountsRes.json();
        setAccounts(aData.data || []);
      }
    } catch (err) {
      console.error('Error fetching account data:', err);
      setError('Failed to load accounts and tenders. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 1. Create Tender Handler
  const handleCreateTender = async (e) => {
    e.preventDefault();
    if (!newTenderName.trim()) {
      setError('Please enter a tender name.');
      return;
    }

    try {
      setSubmittingTender(true);
      setError('');
      const res = await fetch(`${API}/accounts/tenders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTenderName.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create tender');
      }

      const createdTender = data.data;
      const createdId = createdTender?.id ? String(createdTender.id) : '';

      setSuccessMsg(`Tender "${newTenderName}" created successfully!`);
      setNewTenderName('');
      setIsTenderModalOpen(false);
      
      const updatedTenders = await fetch(`${API}/accounts/tenders`).then((r) => r.json());
      if (updatedTenders.success) {
        setTenders(updatedTenders.data);
      } else if (createdTender) {
        setTenders((prev) => [...prev, createdTender]);
      }

      if (returnToAccountModal) {
        setReturnToAccountModal(false);
        if (createdId) {
          setNewAccountForm((prev) => ({ ...prev, tenderId: createdId }));
        }
        setIsAccountModalOpen(true);
      }
    } catch (err) {
      setError(err.message || 'Error creating tender');
    } finally {
      setSubmittingTender(false);
    }
  };

  // 2. Update / Rename Tender Handler
  const handleUpdateTender = async (id, name) => {
    if (!name || !name.trim()) return;
    try {
      setError('');
      const res = await fetch(`${API}/accounts/tenders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update tender');

      setSuccessMsg('Tender updated successfully!');
      setEditingTender(null);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Error updating tender');
    }
  };

  // 3. Delete Tender Handler
  const handleDeleteTender = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete tender "${name}"?`)) return;
    try {
      setError('');
      const res = await fetch(`${API}/accounts/tenders/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete tender');

      setSuccessMsg(`Tender "${name}" deleted.`);
      setTenders((prev) => prev.filter((t) => t.id !== id));
      if (String(selectedTenderFilter) === String(id)) setSelectedTenderFilter('ALL');
    } catch (err) {
      setError(err.message || 'Error deleting tender');
    }
  };

  // 4. Create Account Handler
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!newAccountForm.tenderId) {
      setError('Please select a parent Tender first.');
      return;
    }
    if (!newAccountForm.accountName.trim()) {
      setError('Please provide an Account Name.');
      return;
    }

    try {
      setSubmittingAccount(true);
      setError('');
      const payload = {
        tenderId: parseInt(newAccountForm.tenderId, 10),
        tender_id: parseInt(newAccountForm.tenderId, 10),
        accountName: newAccountForm.accountName.trim(),
        name: newAccountForm.accountName.trim(),
        location: newAccountForm.location.trim(),
        openingBalance: parseFloat(newAccountForm.openingBalance) || 0,
        referenceId: newAccountForm.referenceId.trim(),
        createdBy: activeUser,
      };

      const res = await fetch(`${API}/accounts/account-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create account record');
      }

      setSuccessMsg(`Account "${newAccountForm.accountName}" created successfully!`);
      setNewAccountForm({
        tenderId: '',
        accountName: '',
        location: '',
        openingBalance: '',
        referenceId: '',
      });
      setIsAccountModalOpen(false);
      
      const updatedAccounts = await fetch(`${API}/accounts/account-records`).then((r) => r.json());
      if (updatedAccounts.success) setAccounts(updatedAccounts.data);
    } catch (err) {
      setError(err.message || 'Error creating account');
    } finally {
      setSubmittingAccount(false);
    }
  };

  // 5. Open Edit Account Modal
  const handleOpenEditAccount = (acc) => {
    setEditAccountForm({
      id: acc.id,
      tenderId: String(acc.tender_id || acc.tenderId || ''),
      accountName: acc.account_name || acc.name || '',
      location: acc.location || '',
      openingBalance: acc.opening_balance || '0.00',
      currentBalance: acc.current_balance || '0.00',
      referenceId: acc.reference_id || '',
    });
    setIsEditAccountModalOpen(true);
  };

  // 6. Submit Edit Account Handler
  const handleSaveEditAccount = async (e) => {
    e.preventDefault();
    if (!editAccountForm.id) return;
    if (!editAccountForm.accountName.trim()) {
      setError('Account name is required.');
      return;
    }

    try {
      setSubmittingEditAccount(true);
      setError('');
      const payload = {
        tenderId: parseInt(editAccountForm.tenderId, 10),
        tender_id: parseInt(editAccountForm.tenderId, 10),
        accountName: editAccountForm.accountName.trim(),
        name: editAccountForm.accountName.trim(),
        location: editAccountForm.location.trim(),
        openingBalance: parseFloat(editAccountForm.openingBalance) || 0,
        currentBalance: parseFloat(editAccountForm.currentBalance) || 0,
        referenceId: editAccountForm.referenceId.trim(),
      };

      const res = await fetch(`${API}/accounts/account-records/${editAccountForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update account');
      }

      setSuccessMsg(`Account "${editAccountForm.accountName}" updated successfully!`);
      setIsEditAccountModalOpen(false);
      
      const updatedAccounts = await fetch(`${API}/accounts/account-records`).then((r) => r.json());
      if (updatedAccounts.success) setAccounts(updatedAccounts.data);
    } catch (err) {
      setError(err.message || 'Error updating account');
    } finally {
      setSubmittingEditAccount(false);
    }
  };

  // 7. Delete Account Handler (with force delete support)
  const handleDeleteAccount = async (id, name, isDeletable = true) => {
    let url = `${API}/accounts/account-records/${id}`;
    if (!isDeletable) {
      if (!window.confirm(`⚠️ Account "${name}" has recorded transactions or balance.\n\nDo you want to FORCE REMOVE this account and its associated test transactions?`)) {
        return;
      }
      url += '?force=true';
    } else {
      if (!window.confirm(`Are you sure you want to delete account "${name}"?`)) return;
    }
    try {
      setError('');
      const res = await fetch(url, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete account');
      }
      setSuccessMsg(`Account "${name}" deleted.`);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err.message || 'Error deleting account');
    }
  };

  // 8. Quick Update Balance Handler
  const handleUpdateBalance = async (e) => {
    e.preventDefault();
    if (!balanceEditModal.account) return;
    try {
      setUpdatingBalance(true);
      setError('');
      const res = await fetch(`${API}/accounts/account-records/${balanceEditModal.account.id}/balance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentBalance: parseFloat(balanceEditModal.newBalance) || 0 }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update balance');

      setSuccessMsg(`Balance updated for "${balanceEditModal.account.account_name}".`);
      setBalanceEditModal({ isOpen: false, account: null, newBalance: '' });
      const updatedAccounts = await fetch(`${API}/accounts/account-records`).then((r) => r.json());
      if (updatedAccounts.success) setAccounts(updatedAccounts.data);
    } catch (err) {
      setError(err.message || 'Error updating balance');
    } finally {
      setUpdatingBalance(false);
    }
  };

  // Format currency helper
  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return `৳ ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateStr);
    }
  };

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesTender =
        selectedTenderFilter === 'ALL' ||
        String(acc.tender_id) === String(selectedTenderFilter) ||
        (acc.tender_name && acc.tender_name.toLowerCase() === selectedTenderFilter.toLowerCase());

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        (acc.account_name && acc.account_name.toLowerCase().includes(query)) ||
        (acc.location && acc.location.toLowerCase().includes(query)) ||
        (acc.reference_id && acc.reference_id.toLowerCase().includes(query)) ||
        (acc.tender_name && acc.tender_name.toLowerCase().includes(query)) ||
        (acc.created_by && acc.created_by.toLowerCase().includes(query));

      return matchesTender && matchesSearch;
    });
  }, [accounts, selectedTenderFilter, searchQuery]);

  // Summary Metrics calculated directly from real database accounts
  const totalOpeningBalance = useMemo(() => {
    return accounts.reduce((acc, curr) => acc + (parseFloat(curr.opening_balance) || 0), 0);
  }, [accounts]);

  const totalCurrentBalance = useMemo(() => {
    return accounts.reduce((acc, curr) => acc + (parseFloat(curr.current_balance) || 0), 0);
  }, [accounts]);

  // Tender color tags
  const getTenderBadge = (tenderName) => {
    const name = (tenderName || '').toLowerCase();
    if (name.includes('cash')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (name.includes('bank')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (name.includes('mfs') || name.includes('mobile')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* Top Notification Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between text-sm shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700 font-bold ml-4 text-xs bg-white px-2 py-1 rounded border border-red-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-sm shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg('')}
            className="text-emerald-600 hover:text-emerald-800 font-bold ml-4 text-xs bg-white px-2 py-1 rounded border border-emerald-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Banner & Title */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-2xl shadow-inner">
              🏦
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                New Account Create
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold tracking-wide">
                  Live Database
                </span>
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                Manage financial payment methods, cash drawers, bank branches, and digital ledgers.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-all"
            title="Refresh Table Data from Database"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Payment Methods</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{tenders.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Payment classifications</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold">
            💳
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Accounts</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{accounts.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Real database records</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">
            💳
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Opening Balance</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totalOpeningBalance)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Initial ledger capital</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">
            💰
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active User</p>
            <p className="text-base font-bold text-indigo-900 mt-1 truncate max-w-[150px]">{activeUser}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Current operator session</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-lg font-bold">
            👤
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">Filter Method:</span>
          <button
            onClick={() => setSelectedTenderFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedTenderFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Methods ({accounts.length})
          </button>
          {tenders.map((t) => {
            const count = accounts.filter((a) => a.tender_id === t.id).length;
            const isSelected = String(selectedTenderFilter) === String(t.id);
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTenderFilter(isSelected ? 'ALL' : String(t.id))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.name} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[240px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 text-xs">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search account, location, ref..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                {/* Column 1: Payment Method */}
                <th className="py-3.5 px-4 whitespace-nowrap">Payment Method</th>

                {/* Column 2: Account Name */}
                <th className="py-3.5 px-4 whitespace-nowrap">Account Name</th>

                {/* Column 3: Location */}
                <th className="py-3.5 px-4 whitespace-nowrap">Location</th>

                {/* Column 4: Opening Balance */}
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Opening Balance</th>

                {/* Column 5: Ref:/Trans. ID */}
                <th className="py-3.5 px-4 whitespace-nowrap">Ref:/Trans. ID</th>

                {/* Action Column */}
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading real accounts from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl mb-2 text-slate-400">
                        📂
                      </div>
                      <p className="font-medium text-slate-600 text-sm">No accounts found</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {searchQuery
                          ? 'Try adjusting your search criteria or clear filters.'
                          : 'Click the (+) buttons above to create your first Tender and Account.'}
                      </p>
                      <button
                        onClick={() => setIsAccountModalOpen(true)}
                        className="mt-3 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium shadow-sm hover:bg-indigo-700"
                      >
                        + Create First Account
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Tender */}
                    <td className="py-3.5 px-4 font-semibold whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${getTenderBadge(
                          acc.tender_name
                        )}`}
                      >
                        {acc.tender_name || 'N/A'}
                      </span>
                    </td>

                    {/* Account Name with meta footer */}
                    <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm">{acc.account_name}</span>
                        {/* Meta display: Date & Created By */}
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-normal">
                          <span className="inline-flex items-center gap-1">
                            <span className="text-slate-400">📅</span>
                            <strong className="text-slate-600">Date:</strong> {formatDate(acc.created_at)}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center gap-1">
                            <span className="text-slate-400">👤</span>
                            <strong className="text-slate-600">Created By:</strong> {acc.created_by || 'Super Admin'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                      {acc.location || '—'}
                    </td>

                    {/* Opening Balance */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-emerald-700 text-sm">{formatCurrency(acc.opening_balance)}</span>
                        {parseFloat(acc.current_balance) !== parseFloat(acc.opening_balance) && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            Current: {formatCurrency(acc.current_balance)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Ref:/Trans. ID */}
                    <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap font-mono text-xs">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                        {acc.reference_id || '—'}
                      </span>
                    </td>

                    {/* Full CRUD Actions (Edit, Quick Balance, Delete) */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditAccount(acc)}
                          className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold transition-colors flex items-center gap-1"
                          title="Edit Account Details"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() =>
                            setBalanceEditModal({
                              isOpen: true,
                              account: acc,
                              newBalance: acc.current_balance || acc.opening_balance,
                            })
                          }
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
                          title="Quick update current ledger balance"
                        >
                          ⚙️ Bal
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(acc.id, acc.account_name, acc.is_deletable)}
                          title={
                            !acc.is_deletable
                              ? `⚠️ Has activity: Click to force remove account and associated test records`
                              : 'Delete Account Permanently'
                          }
                          className="p-1 rounded text-xs transition-colors text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Table Footer Summary */}
            {filteredAccounts.length > 0 && (
              <tfoot className="bg-slate-50 border-t border-slate-200 text-xs text-slate-600 font-semibold">
                <tr>
                  <td colSpan={3} className="py-3 px-4">
                    Showing {filteredAccounts.length} of {accounts.length} Real Database Accounts
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-800 font-bold">
                    {formatCurrency(
                      filteredAccounts.reduce((sum, a) => sum + (parseFloat(a.opening_balance) || 0), 0)
                    )}
                  </td>
                  <td colSpan={2} className="py-3 px-4 text-right text-[11px] text-slate-500">
                    Live PostgreSQL Ledger
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. MODAL: ADD NEW TENDER (+)                              */}
      {/* ========================================================= */}
      {isTenderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-scale-in">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg">📑</span>
                <div>
                  <h3 className="font-bold text-base">Add New Tender</h3>
                  <p className="text-xs text-slate-300">Register a new payment classification</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsTenderModalOpen(false);
                  if (returnToAccountModal) {
                    setReturnToAccountModal(false);
                    setIsAccountModalOpen(true);
                  }
                }}
                className="text-slate-400 hover:text-white text-lg w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTender} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tender Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cash, Bank, Mobile Banking (MFS), Digital Card"
                  value={newTenderName}
                  onChange={(e) => setNewTenderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  autoFocus
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsTenderModalOpen(false);
                    if (returnToAccountModal) {
                      setReturnToAccountModal(false);
                      setIsAccountModalOpen(true);
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTender}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5"
                >
                  {submittingTender ? 'Saving...' : 'Save Tender'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MODAL: MANAGE TENDERS (Edit/Delete)                     */}
      {/* ========================================================= */}
      {isManageTendersModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scale-in">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg">⚙️</span>
                <div>
                  <h3 className="font-bold text-base">Manage Payment Tenders</h3>
                  <p className="text-xs text-slate-300">Edit names or remove unused tenders</p>
                </div>
              </div>
              <button
                onClick={() => setIsManageTendersModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {tenders.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No tenders configured.</p>
              ) : (
                tenders.map((t) => {
                  const isEditing = editingTender && editingTender.id === t.id;
                  const count = accounts.filter((a) => a.tender_id === t.id).length;
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/60"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <input
                            type="text"
                            value={editingTender.name}
                            onChange={(e) => setEditingTender({ ...editingTender, name: e.target.value })}
                            className="px-2 py-1 rounded-lg border border-indigo-300 text-xs flex-1 outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdateTender(t.id, editingTender.name)}
                            className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingTender(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-slate-900">{t.name}</p>
                          <p className="text-[10px] text-slate-500">{count} active account(s)</p>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingTender({ id: t.id, name: t.name })}
                            className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
                          >
                            ✏️ Rename
                          </button>
                          <button
                            onClick={() => handleDeleteTender(t.id, t.name)}
                            disabled={count > 0}
                            title={count > 0 ? 'Cannot delete: accounts are linked to this tender' : 'Delete Tender'}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsManageTendersModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MODAL: ADD NEW ACCOUNT (+)                             */}
      {/* ========================================================= */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scale-in">
            <div className="bg-gradient-to-r from-slate-900 to-emerald-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg">🏦</span>
                <div>
                  <h3 className="font-bold text-base">Add New Account</h3>
                  <p className="text-xs text-slate-300">Create a financial account linked to a Tender</p>
                </div>
              </div>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              {/* Step 1: Parent Tender (Cascading Dropdown) */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1.5">
                  1. Select Parent Tender <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <select
                    required
                    value={newAccountForm.tenderId}
                    onChange={(e) =>
                      setNewAccountForm({ ...newAccountForm, tenderId: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="">-- Choose Parent Tender --</option>
                    {tenders.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnToAccountModal(true);
                      setIsAccountModalOpen(false);
                      setIsTenderModalOpen(true);
                    }}
                    className="px-2.5 py-2.5 rounded-xl bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-300 text-xs font-bold whitespace-nowrap shadow-sm"
                    title="Add new tender if not in list"
                  >
                    + Add Tender
                  </button>
                </div>
                {!newAccountForm.tenderId && (
                  <p className="text-[11px] text-indigo-600 mt-1 font-medium">
                    👉 Please select a Tender category first to configure its account details.
                  </p>
                )}
              </div>

              {/* Step 2: Account Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!newAccountForm.tenderId}
                  placeholder="e.g. Main Drawer, City Bank Principal Branch, Nagad Merchant"
                  value={newAccountForm.accountName}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, accountName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Step 3: Location / Details */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Location / Details
                </label>
                <input
                  type="text"
                  disabled={!newAccountForm.tenderId}
                  placeholder="e.g. Main Counter, A/C: 03254857551, Shop #2"
                  value={newAccountForm.location}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Step 4: Opening Balance & Ref / Trans ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Opening Balance (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={!newAccountForm.tenderId}
                    placeholder="0.00"
                    value={newAccountForm.openingBalance}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, openingBalance: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono font-bold text-emerald-800 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ref:/Trans. ID
                  </label>
                  <input
                    type="text"
                    disabled={!newAccountForm.tenderId}
                    placeholder="e.g. Haolad, rfgr545t"
                    value={newAccountForm.referenceId}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, referenceId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Footer Meta Preview */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                <span>
                  <strong>Date:</strong> {new Date().toLocaleDateString('en-GB')} (Today)
                </span>
                <span>
                  <strong>Created By:</strong> {activeUser}
                </span>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAccount || !newAccountForm.tenderId}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingAccount ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. MODAL: EDIT ACCOUNT (Full Update)                      */}
      {/* ========================================================= */}
      {isEditAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scale-in">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg">✏️</span>
                <div>
                  <h3 className="font-bold text-base">Edit Account Details</h3>
                  <p className="text-xs text-slate-300">Modify financial account configuration</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditAccountModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Parent Tender <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={editAccountForm.tenderId}
                  onChange={(e) => setEditAccountForm({ ...editAccountForm, tenderId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {tenders.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editAccountForm.accountName}
                  onChange={(e) => setEditAccountForm({ ...editAccountForm, accountName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Location / Details
                </label>
                <input
                  type="text"
                  value={editAccountForm.location}
                  onChange={(e) => setEditAccountForm({ ...editAccountForm, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Opening Balance (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editAccountForm.openingBalance}
                    onChange={(e) => setEditAccountForm({ ...editAccountForm, openingBalance: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Current Balance (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editAccountForm.currentBalance}
                    onChange={(e) => setEditAccountForm({ ...editAccountForm, currentBalance: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ref:/Trans. ID
                </label>
                <input
                  type="text"
                  value={editAccountForm.referenceId}
                  onChange={(e) => setEditAccountForm({ ...editAccountForm, referenceId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEditAccount}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-all"
                >
                  {submittingEditAccount ? 'Saving...' : 'Update Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL: QUICK BALANCE ADJUSTMENT                        */}
      {/* ========================================================= */}
      {balanceEditModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-scale-in">
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Quick Ledger Balance</h3>
              <button
                onClick={() => setBalanceEditModal({ isOpen: false, account: null, newBalance: '' })}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateBalance} className="p-5 space-y-3">
              <p className="text-xs text-slate-600">
                Adjust current balance for <strong>{balanceEditModal.account?.account_name}</strong>:
              </p>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Current Balance (৳)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={balanceEditModal.newBalance}
                  onChange={(e) => setBalanceEditModal({ ...balanceEditModal, newBalance: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold font-mono text-emerald-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBalanceEditModal({ isOpen: false, account: null, newBalance: '' })}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingBalance}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  {updatingBalance ? 'Saving...' : 'Update Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
