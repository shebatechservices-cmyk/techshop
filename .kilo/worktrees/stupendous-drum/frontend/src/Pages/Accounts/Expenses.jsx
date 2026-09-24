import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';

const DEFAULT_EXPENSES = [];

export default function Expenses() {
  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Overview metrics state
  const [overview, setOverview] = useState({
    total_today: 530,
    count_today: 2,
    total_month: 4930,
    count_month: 5,
    category_breakdown: [],
    payment_split: [],
  });

  // Filters
  const [dateFilter, setDateFilter] = useState('this_month'); // 'today' | 'this_week' | 'this_month' | 'all'
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [accountFilter, setAccountFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [savingCatId, setSavingCatId] = useState(null);
  const [deletingCatId, setDeletingCatId] = useState(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [voucherToPrint, setVoucherToPrint] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  // New Expense Form State
  const [newExpense, setNewExpense] = useState({
    category_name: '',
    category_id: null,
    account_id: '',
    account_name: 'Cash in Hand (Counter Drawer)',
    amount: '',
    payee_name: '',
    reference_no: '',
    expense_date: new Date().toISOString().split('T')[0],
    note: '',
  });

  // New Category Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Helper to fetch expense categories dynamically from API
  const fetchExpenseCategories = async () => {
    try {
      setCategoriesLoading(true);
      const res = await fetch(`${API}/expense-categories`);
      if (res.ok) {
        const d = await res.json();
        const list = Array.isArray(d) ? d : (d.data || []);
        if (Array.isArray(list)) {
          setCategories(list);
          return list;
        }
      }
    } catch (err) {
      console.error('Failed to load expense categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
    return [];
  };

  // Load Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [expRes, catRes, accRes, ovRes] = await Promise.all([
        fetch(`${API}/expenses?date_range=${dateFilter}`).catch(() => null),
        fetch(`${API}/expense-categories`).catch(() => null),
        fetch(`${API}/accounts/wallets`).catch(() => null),
        fetch(`${API}/expenses/overview`).catch(() => null),
      ]);

      if (expRes && expRes.ok) {
        const d = await expRes.json();
        if (Array.isArray(d.data)) setExpenses(d.data);
      }

      if (catRes && catRes.ok) {
        const d = await catRes.json();
        const list = Array.isArray(d) ? d : (d.data || []);
        if (Array.isArray(list) && list.length > 0) {
          setCategories(list);
          setNewExpense((prev) => ({
            ...prev,
            category_name: prev.category_name || list[0].name,
            category_id: prev.category_id || list[0].id,
          }));
        }
      }

      if (accRes && accRes.ok) {
        const d = await accRes.json();
        const accList = d.data || (Array.isArray(d) ? d : []);
        setAccounts(accList);
        if (accList.length > 0 && !newExpense.account_id) {
          setNewExpense((prev) => ({
            ...prev,
            account_id: accList[0].id,
            account_name: accList[0].name,
          }));
        }
      }

      if (ovRes && ovRes.ok) {
        const d = await ovRes.json();
        if (d.data) setOverview(d.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  // Handle Create Expense
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.amount || Number(newExpense.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const tempVoucher = 'EXP-2026-' + String(Math.floor(100 + Math.random() * 900));
      const createdItem = {
        id: Date.now(),
        voucher_no: tempVoucher,
        ...newExpense,
        amount: Number(newExpense.amount),
      };

      // Optimistic update
      setExpenses((prev) => [createdItem, ...prev]);
      showToast(`Expense of ৳ ${Number(newExpense.amount).toLocaleString()} recorded! (Voucher #${tempVoucher})`);
      setIsAddExpenseOpen(false);

      // Offer to print voucher immediately
      setVoucherToPrint(createdItem);

      const payload = { ...newExpense };
      setNewExpense({
        category_name: categories[0]?.name || '',
        category_id: categories[0]?.id || null,
        account_id: accounts[0]?.id || '',
        account_name: accounts[0]?.name || 'Cash in Hand (Counter Drawer)',
        amount: '',
        payee_name: '',
        reference_no: '',
        expense_date: new Date().toISOString().split('T')[0],
        note: '',
      });

      await fetch(`${API}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      window.dispatchEvent(new CustomEvent('expense_changed'));

      // Reload overview to update balances
      fetch(`${API}/expenses/overview`)
        .then((r) => r.json())
        .then((d) => d.data && setOverview(d.data))
        .catch(console.error);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (id, voucher_no, amount) => {
    if (!window.confirm(`Delete expense ${voucher_no} of ৳ ${Number(amount).toLocaleString()} and restore account balance?`)) return;

    try {
      setExpenses((prev) => prev.filter((ex) => ex.id !== id));
      showToast(`Expense ${voucher_no} deleted and ৳ ${Number(amount).toLocaleString()} restored.`);
      await fetch(`${API}/expenses/${id}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('expense_changed'));
      fetch(`${API}/expenses/overview`)
        .then((r) => r.json())
        .then((d) => d.data && setOverview(d.data))
        .catch(console.error);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Edit / Update Expense
  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    if (!editingExpense || !editingExpense.amount || Number(editingExpense.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const res = await fetch(`${API}/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingExpense),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        setExpenses((prev) => prev.map((ex) => (ex.id === editingExpense.id ? { ...ex, ...d.data } : ex)));
        showToast(`Expense ${editingExpense.voucher_no || editingExpense.id} updated successfully!`);
        setEditingExpense(null);
        window.dispatchEvent(new CustomEvent('expense_changed'));
        fetch(`${API}/expenses/overview`)
          .then((r) => r.json())
          .then((data) => data.data && setOverview(data.data))
          .catch(console.error);
      } else {
        alert(d.message || 'Failed to update expense');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating expense');
    }
  };

  // Handle Create Category
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const catName = newCategoryName.trim();
    if (!catName) return;

    try {
      setCategorySubmitting(true);
      const res = await fetch(`${API}/expense-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || errData.error || 'Failed to create category');
        return;
      }

      const resData = await res.json();
      const savedCat = resData.data || resData;

      // 1. Close the modal & reset input
      setIsAddCategoryOpen(false);
      setNewCategoryName('');

      // 2. Immediately refresh the dropdown list from API
      const updatedList = await fetchExpenseCategories();

      // 3. Auto-select the newly added category
      const matched = updatedList?.find((c) => c.name.toLowerCase() === catName.toLowerCase());
      const selectedName = matched ? matched.name : (savedCat?.name || catName);
      const selectedId = matched?.id || savedCat?.id || null;

      setNewExpense((prev) => ({
        ...prev,
        category_name: selectedName,
        category_id: selectedId,
      }));

      if (editingExpense) {
        setEditingExpense((prev) => ({
          ...prev,
          category_name: selectedName,
          category_id: selectedId,
        }));
      }

      showToast(`Category "${selectedName}" created and selected!`);
    } catch (err) {
      console.error('Error creating expense category:', err);
      alert('Error creating category');
    } finally {
      setCategorySubmitting(false);
    }
  };

  // Start inline editing of category
  const handleStartEditCategory = (cat) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
  };

  // Cancel inline editing
  const handleCancelEditCategory = () => {
    setEditingCatId(null);
    setEditingCatName('');
  };

  // Save inline edit (PUT /api/expense-categories/:id)
  const handleSaveEditCategory = async (id) => {
    const trimmed = editingCatName.trim();
    if (!trimmed) {
      alert('Category name cannot be empty');
      return;
    }

    try {
      setSavingCatId(id);
      const res = await fetch(`${API}/expense-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(resData.message || resData.error || 'Failed to update category');
        return;
      }

      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c))
      );

      if (newExpense.category_id === id) {
        setNewExpense((prev) => ({ ...prev, category_name: trimmed }));
      }
      if (editingExpense && editingExpense.category_id === id) {
        setEditingExpense((prev) => ({ ...prev, category_name: trimmed }));
      }

      setEditingCatId(null);
      setEditingCatName('');
      showToast(`Category updated to "${trimmed}"!`);

      // Reload overview to reflect renamed category in charts/summaries
      fetch(`${API}/expenses/overview`)
        .then((r) => r.json())
        .then((d) => d.data && setOverview(d.data))
        .catch(console.error);
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Error updating category');
    } finally {
      setSavingCatId(null);
    }
  };

  // Delete category (DELETE /api/expense-categories/:id) with in-use safety check
  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }

    try {
      setDeletingCatId(cat.id);
      const res = await fetch(`${API}/expense-categories/${cat.id}`, {
        method: 'DELETE',
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Critical: handles 400 error if existing expense records are using it
        const errorMsg = resData.message || resData.error || 'Cannot delete category: Existing expense records are using it';
        alert(errorMsg);
        showToast(errorMsg);
        return;
      }

      // Successful deletion
      setCategories((prev) => {
        const nextList = prev.filter((c) => c.id !== cat.id);
        if (newExpense.category_id === cat.id || newExpense.category_name === cat.name) {
          setNewExpense((p) => ({
            ...p,
            category_name: nextList[0]?.name || '',
            category_id: nextList[0]?.id || null,
          }));
        }
        return nextList;
      });

      showToast(`Category "${cat.name}" deleted successfully!`);
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Error deleting category');
    } finally {
      setDeletingCatId(null);
    }
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((ex) => {
      if (categoryFilter !== 'ALL' && ex.category_name !== categoryFilter) return false;
      if (accountFilter !== 'ALL' && String(ex.account_id) !== String(accountFilter)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchVoucher = String(ex.voucher_no || '').toLowerCase().includes(q);
        const matchCat = String(ex.category_name || '').toLowerCase().includes(q);
        const matchPayee = String(ex.payee_name || '').toLowerCase().includes(q);
        const matchRef = String(ex.reference_no || '').toLowerCase().includes(q);
        const matchNote = String(ex.note || '').toLowerCase().includes(q);
        const matchAcc = String(ex.account_name || '').toLowerCase().includes(q);
        if (!matchVoucher && !matchCat && !matchPayee && !matchRef && !matchNote && !matchAcc) return false;
      }
      return true;
    });
  }, [expenses, categoryFilter, accountFilter, searchQuery]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, ex) => sum + Number(ex.amount || 0), 0);
  }, [filteredExpenses]);

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 999999,
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem',
            fontWeight: 600,
            borderLeft: '4px solid #ef4444',
          }}
        >
          <span>💸</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Compact Sub-header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
            Expenses & Operating Overheads
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '999px',
              background: '#fee2e2',
              color: '#b91c1c',
            }}
          >
            CASH OUTFLOW
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setIsManageCategoriesOpen(true)}
            style={{
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span>⚙️</span>
            <span>Categories</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddExpenseOpen(true)}
            style={{
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 2px 6px rgba(220,38,38,0.25)',
            }}
          >
            <span>+</span>
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
        <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '10px 14px' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Today's Expense
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
            ৳ {Number(overview.total_today || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            {overview.count_today || 0} vouchers today
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '10px 14px' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            This Month Total
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
            ৳ {Number(overview.total_month || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            {overview.count_month || 0} expenses this month
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '10px 14px' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Cash Drawer Outflow
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#b45309', marginTop: '2px' }}>
            ৳{' '}
            {Number(
              expenses
                .filter((e) => String(e.account_name).toLowerCase().includes('cash') || String(e.account_name).toLowerCase().includes('drawer'))
                .reduce((s, e) => s + Number(e.amount || 0), 0)
            ).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#92400e' }}>
            Direct cash in hand
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '10px 14px' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Top Category
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {overview.category_breakdown?.[0]?.category_name || 'Rent & Utilities'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            ৳ {Number(overview.category_breakdown?.[0]?.total_amount || 3200).toLocaleString('en-IN')} (Highest)
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '8px 14px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        {/* Date Presets */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { id: 'today', label: 'Today' },
            { id: 'this_week', label: 'This Week' },
            { id: 'this_month', label: 'This Month' },
            { id: 'all', label: 'All History' },
          ].map((dp) => (
            <button
              key={dp.id}
              type="button"
              onClick={() => setDateFilter(dp.id)}
              style={{
                padding: '5px 10px',
                borderRadius: '5px',
                border: '1px solid',
                borderColor: dateFilter === dp.id ? '#0f172a' : '#cbd5e1',
                background: dateFilter === dp.id ? '#0f172a' : '#ffffff',
                color: dateFilter === dp.id ? '#ffffff' : '#475569',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {dp.label}
            </button>
          ))}
        </div>

        {/* Dropdown Filters & Search */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.78rem',
              color: '#334155',
              fontWeight: 600,
            }}
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id || c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Account Filter */}
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.78rem',
              color: '#334155',
              fontWeight: 600,
            }}
          >
            <option value="ALL">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <input
            type="text"
            placeholder="Search voucher, payee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.78rem',
              minWidth: '180px',
            }}
          />
        </div>
      </div>

      {/* Expenses Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#ffffff', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em' }}>
              <th style={{ padding: '12px 14px' }}>DATE & VOUCHER #</th>
              <th style={{ padding: '12px 14px' }}>EXPENSE CATEGORY</th>
              <th style={{ padding: '12px 14px' }}>PAID TO (PAYEE) & NOTE</th>
              <th style={{ padding: '12px 14px' }}>PAYMENT SOURCE (ACCOUNT)</th>
              <th style={{ padding: '12px 14px' }}>REF / MEMO</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>AMOUNT (৳)</th>
              <th style={{ padding: '12px 14px', textAlign: 'center', width: '130px' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                  No expense records found for this filter.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((ex, idx) => (
                <tr
                  key={ex.id || idx}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                  }}
                >
                  {/* Date & Voucher */}
                  <td style={{ padding: '12px 14px' }}>
                    <strong style={{ fontFamily: 'monospace', color: '#0284c7' }}>
                      {ex.voucher_no || `EXP-${ex.id}`}
                    </strong>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                      {new Date(ex.expense_date).toLocaleDateString()}
                    </div>
                  </td>

                  {/* Category */}
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        background: '#f1f5f9',
                        color: '#1e293b',
                      }}
                    >
                      {ex.category_name}
                    </span>
                  </td>

                  {/* Payee & Note */}
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{ex.payee_name || 'General'}</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px', maxWidth: '280px' }}>
                      {ex.note || 'No additional note'}
                    </div>
                  </td>

                  {/* Payment Source */}
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        background:
                          String(ex.account_name).toLowerCase().includes('cash') || String(ex.account_name).toLowerCase().includes('drawer')
                            ? '#fef3c7'
                            : '#e0f2fe',
                        color:
                          String(ex.account_name).toLowerCase().includes('cash') || String(ex.account_name).toLowerCase().includes('drawer')
                            ? '#92400e'
                            : '#0369a1',
                      }}
                    >
                      {String(ex.account_name).toLowerCase().includes('cash') ? '💵' : '💳'} {ex.account_name || 'Cash in Hand'}
                    </span>
                  </td>

                  {/* Reference Memo */}
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.76rem', color: '#64748b' }}>
                    {ex.reference_no || '-'}
                  </td>

                  {/* Amount */}
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#dc2626', fontSize: '0.94rem' }}>
                    ৳ {Number(ex.amount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      onClick={() => setVoucherToPrint(ex)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '5px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#0f172a',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        marginRight: '4px',
                      }}
                      title="Print Official Debit Payment Voucher"
                    >
                      🖨️ Voucher
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingExpense({ ...ex })}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '5px',
                        border: '1px solid #93c5fd',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        marginRight: '4px',
                      }}
                      title="Edit Expense"
                    >
                      ✏️ Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteExpense(ex.id, ex.voucher_no, ex.amount)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '5px',
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        color: '#ef4444',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      title="Delete & Refund to Account"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {filteredExpenses.length > 0 && (
            <tfoot>
              <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1', fontWeight: 800 }}>
                <td colSpan={5} style={{ padding: '12px 14px', textAlign: 'right', color: '#475569', fontSize: '0.88rem' }}>
                  FILTERED EXPENSES TOTAL:
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#dc2626', fontSize: '1.05rem' }}>
                  ৳ {totalFilteredAmount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: RECORD NEW EXPENSE */}
      {/* ========================================================= */}
      {isAddExpenseOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddExpenseOpen(false);
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '14px', width: '100%', maxWidth: '580px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              + Record Expense (দৈনিক খরচ এন্ট্রি)
            </h3>
            <form onSubmit={handleCreateExpense}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Expense Category (খাত) *
                  </label>
                  <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select
                      required
                      value={newExpense.category_name}
                      onChange={(e) => {
                        const sel = categories.find((c) => c.name === e.target.value);
                        setNewExpense({
                          ...newExpense,
                          category_name: e.target.value,
                          category_id: sel?.id || null,
                        });
                      }}
                      style={{ flex: 1, width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box', background: '#ffffff' }}
                    >
                      <option value="">{categoriesLoading ? 'Loading categories...' : '-- Select Expense Category --'}</option>
                      {categories.map((c) => (
                        <option key={c.id || c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsAddCategoryOpen(true)}
                      title="Add New Category"
                      className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold transition active:scale-95 cursor-pointer shadow-sm shrink-0"
                      style={{
                        height: '37px',
                        width: '37px',
                        minWidth: '37px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#2563eb',
                        color: '#ffffff',
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsManageCategoriesOpen(true)}
                      title="Manage Categories"
                      className="flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md font-semibold text-xs transition active:scale-95 cursor-pointer shadow-sm shrink-0"
                      style={{
                        height: '37px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        color: '#334155',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '0 10px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span>⚙️</span>
                      <span>Manage</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Paid From Account (টাকা প্রদান) *
                  </label>
                  <select
                    required
                    value={newExpense.account_id}
                    onChange={(e) => {
                      const acc = accounts.find((a) => String(a.id) === String(e.target.value));
                      setNewExpense({
                        ...newExpense,
                        account_id: e.target.value,
                        account_name: acc ? acc.name : 'Cash in Hand (Counter Drawer)',
                      });
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  >
                    {accounts.length === 0 ? (
                      <option value="1">Cash in Hand (Counter Drawer)</option>
                    ) : (
                      accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} (Bal: ৳{Number(a.balance || 0).toLocaleString()})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Expense Amount (৳) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 350"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #dc2626', fontSize: '0.94rem', fontWeight: 700, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newExpense.expense_date}
                    onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Paid To (প্রাপক / ব্যক্তি / প্রতিষ্ঠান)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Technician Tanvir or Mamun Tea"
                    value={newExpense.payee_name}
                    onChange={(e) => setNewExpense({ ...newExpense, payee_name: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Voucher / Memo Reference No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CASH-MEMO-441"
                    value={newExpense.reference_no}
                    onChange={(e) => setNewExpense({ ...newExpense, reference_no: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Description / Purpose of Expense
                </label>
                <textarea
                  rows={2}
                  placeholder="Detail notes regarding this expense..."
                  value={newExpense.note}
                  onChange={(e) => setNewExpense({ ...newExpense, note: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.84rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 22px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#ffffff', fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Record & Deduct Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADD CATEGORY */}
      {/* ========================================================= */}
      {isAddCategoryOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddCategoryOpen(false);
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📁</span>
                <span>New Expense Category</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer', padding: '4px', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateCategory}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Office Supplies or Generator Fuel"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddCategoryOpen(false);
                    setNewCategoryName('');
                  }}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={categorySubmitting || !newCategoryName.trim()}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: categorySubmitting ? 'not-allowed' : 'pointer',
                    opacity: categorySubmitting ? 0.7 : 1,
                    boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
                  }}
                >
                  {categorySubmitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2.5: MANAGE EXPENSE CATEGORIES (DATA TABLE) */}
      {/* ========================================================= */}
      {isManageCategoriesOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsManageCategoriesOpen(false);
              setEditingCatId(null);
            }
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>⚙️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                    Manage Expense Categories (খরচের খাতসমূহ)
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                    Edit or delete existing categories. Protected against accidental deletion if in use.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(true)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + Add New
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsManageCategoriesOpen(false);
                    setEditingCatId(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.25rem',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Filter / Search Bar */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid #f1f5f9', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search categories..."
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                style={{
                  width: '260px',
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                Total: {categories.length} categories
              </span>
            </div>

            {/* Data Table */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '0 24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 8px', width: '40px' }}>#</th>
                    <th style={{ padding: '12px 8px' }}>Category Name</th>
                    <th style={{ padding: '12px 8px', width: '130px' }}>Created At</th>
                    <th style={{ padding: '12px 8px', width: '150px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                        No categories found. Click "+ Add New" to create one.
                      </td>
                    </tr>
                  ) : (
                    categories
                      .filter((c) => !categorySearchQuery.trim() || c.name.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                      .map((cat, idx) => (
                        <tr key={cat.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 8px', color: '#94a3b8', fontSize: '0.78rem' }}>{idx + 1}</td>
                          <td style={{ padding: '12px 8px' }}>
                            {editingCatId === cat.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingCatName}
                                  onChange={(e) => setEditingCatName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEditCategory(cat.id);
                                    if (e.key === 'Escape') handleCancelEditCategory();
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    border: '1.5px solid #2563eb',
                                    fontSize: '0.84rem',
                                    outline: 'none',
                                  }}
                                />
                              </div>
                            ) : (
                              <span style={{ fontWeight: 600, color: '#0f172a' }}>{cat.name}</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 8px', color: '#64748b', fontSize: '0.76rem' }}>
                            {cat.created_at ? new Date(cat.created_at).toLocaleDateString() : 'System'}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {editingCatId === cat.id ? (
                              <div style={{ display: 'inline-flex', gap: '4px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditCategory(cat.id)}
                                  disabled={savingCatId === cat.id}
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '5px',
                                    border: 'none',
                                    background: '#059669',
                                    color: '#ffffff',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                  title="Save changes"
                                >
                                  {savingCatId === cat.id ? '...' : '✓ Save'}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEditCategory}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '5px',
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    color: '#64748b',
                                    fontSize: '0.74rem',
                                    cursor: 'pointer',
                                  }}
                                  title="Cancel editing"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditCategory(cat)}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '5px',
                                    border: '1px solid #93c5fd',
                                    background: '#eff6ff',
                                    color: '#1d4ed8',
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                  title="Edit category name"
                                >
                                  <span>✏️</span>
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat)}
                                  disabled={deletingCatId === cat.id}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '5px',
                                    border: '1px solid #fecaca',
                                    background: '#fef2f2',
                                    color: '#ef4444',
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    cursor: deletingCatId === cat.id ? 'not-allowed' : 'pointer',
                                    opacity: deletingCatId === cat.id ? 0.6 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                  title="Delete category"
                                >
                                  <span>🗑️</span>
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                background: '#f8fafc',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsManageCategoriesOpen(false);
                  setEditingCatId(null);
                }}
                style={{
                  padding: '7px 18px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: PRINTABLE DEBIT PAYMENT VOUCHER SLIP */}
      {/* ========================================================= */}
      {voucherToPrint && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setVoucherToPrint(null);
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '540px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            {/* Voucher Body for Print */}
            <div
              id="expense-debit-voucher"
              style={{
                border: '2px solid #0f172a',
                padding: '20px',
                borderRadius: '8px',
                background: '#ffffff',
                fontFamily: 'serif',
              }}
            >
              {/* Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.04em' }}>
                  SHEBA TECHNOLOGY
                </h2>
                <div style={{ fontSize: '0.76rem', color: '#475569', fontFamily: 'sans-serif' }}>
                  CCTV, Computer & IT Networking Solutions
                </div>
                <div style={{ fontSize: '0.74rem', color: '#475569', fontFamily: 'sans-serif' }}>
                  Dhaka, Bangladesh · Phone: 01711-000000
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    background: '#0f172a',
                    color: '#ffffff',
                    padding: '3px 12px',
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    marginTop: '8px',
                    fontFamily: 'sans-serif',
                  }}
                >
                  OFFICIAL DEBIT PAYMENT VOUCHER (খরচ ভাউচার)
                </div>
              </div>

              {/* Voucher Meta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '10px', fontFamily: 'sans-serif' }}>
                <span>
                  Voucher #: <strong style={{ fontFamily: 'monospace', color: '#dc2626' }}>{voucherToPrint.voucher_no}</strong>
                </span>
                <span>
                  Date: <strong>{new Date(voucherToPrint.expense_date).toLocaleDateString()}</strong>
                </span>
              </div>

              {/* Payee and Source */}
              <div style={{ borderTop: '1px dotted #cbd5e1', borderBottom: '1px dotted #cbd5e1', padding: '10px 0', marginBottom: '12px', fontSize: '0.84rem', fontFamily: 'sans-serif' }}>
                <div style={{ marginBottom: '4px' }}>
                  Paid To (প্রাপক): <strong>{voucherToPrint.payee_name || 'General'}</strong>
                </div>
                <div style={{ marginBottom: '4px' }}>
                  Expense Head (খাত): <strong>{voucherToPrint.category_name}</strong>
                </div>
                <div style={{ marginBottom: '4px' }}>
                  Disbursed From: <strong>{voucherToPrint.account_name}</strong>
                </div>
                {voucherToPrint.reference_no && (
                  <div>
                    Reference / Memo #: <strong>{voucherToPrint.reference_no}</strong>
                  </div>
                )}
              </div>

              {/* Amount Box */}
              <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', padding: '12px', borderRadius: '6px', marginBottom: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.76rem', color: '#64748b', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
                  Amount Paid
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>
                  ৳ {Number(voucherToPrint.amount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#475569', fontStyle: 'italic', marginTop: '2px' }}>
                  Purpose: {voucherToPrint.note || 'Official shop operational expenditure'}
                </div>
              </div>

              {/* Signatures */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '36px', textAlign: 'center', fontSize: '0.74rem', fontFamily: 'sans-serif' }}>
                <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px' }}>Prepared By</div>
                <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px' }}>Approved By</div>
                <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px' }}>Receiver's Signature</div>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setVoucherToPrint(null)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.84rem', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#0f172a', color: '#ffffff', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}
              >
                🖨️ Print Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: EDIT EXPENSE VOUCHER */}
      {/* ========================================================= */}
      {editingExpense && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingExpense(null);
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '540px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              ✏️ Edit Expense Voucher #{editingExpense.voucher_no}
            </h3>

            <form onSubmit={handleUpdateExpense}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Category *</label>
                  <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select
                      value={editingExpense.category_name || ''}
                      onChange={(e) => {
                        const sel = categories.find((c) => c.name === e.target.value);
                        setEditingExpense({
                          ...editingExpense,
                          category_name: e.target.value,
                          category_id: sel?.id || null,
                        });
                      }}
                      style={{ flex: 1, width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box', background: '#ffffff' }}
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map((c) => (
                        <option key={c.id || c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsAddCategoryOpen(true)}
                      title="Add New Category"
                      className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold transition active:scale-95 cursor-pointer shadow-sm shrink-0"
                      style={{
                        height: '35px',
                        width: '35px',
                        minWidth: '35px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#2563eb',
                        color: '#ffffff',
                        fontSize: '1.15rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsManageCategoriesOpen(true)}
                      title="Manage Categories"
                      className="flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md font-semibold text-xs transition active:scale-95 cursor-pointer shadow-sm shrink-0"
                      style={{
                        height: '35px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        color: '#334155',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '0 8px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span>⚙️</span>
                      <span>Manage</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Payment Account *</label>
                  <select
                    value={editingExpense.account_id || ''}
                    onChange={(e) => {
                      const selAcc = accounts.find((a) => String(a.id) === String(e.target.value));
                      setEditingExpense({
                        ...editingExpense,
                        account_id: e.target.value,
                        account_name: selAcc ? selAcc.name : editingExpense.account_name,
                      });
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} (৳ {Number(a.balance || 0).toLocaleString()})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Amount (৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingExpense.amount || ''}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #0284c7', fontSize: '0.92rem', fontWeight: 700, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={editingExpense.expense_date ? editingExpense.expense_date.substring(0, 10) : ''}
                    onChange={(e) => setEditingExpense({ ...editingExpense, expense_date: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Paid To (Payee)</label>
                  <input
                    type="text"
                    value={editingExpense.payee_name || ''}
                    onChange={(e) => setEditingExpense({ ...editingExpense, payee_name: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Reference / Memo #</label>
                  <input
                    type="text"
                    value={editingExpense.reference_no || ''}
                    onChange={(e) => setEditingExpense({ ...editingExpense, reference_no: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Note / Reason</label>
                <textarea
                  rows={2}
                  value={editingExpense.note || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, note: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.84rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#ffffff', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
