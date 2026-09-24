import { useState, useEffect, useMemo } from 'react';
import API from '../../../services/api';

const DEFAULT_EXPENSES = [];

export default function useExpensesManager() {
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

  return {
    // State
    expenses,
    setExpenses,
    categories,
    setCategories,
    categoriesLoading,
    setCategoriesLoading,
    categorySubmitting,
    setCategorySubmitting,
    accounts,
    setAccounts,
    loading,
    setLoading,
    toastMsg,
    setToastMsg,
    overview,
    setOverview,
    dateFilter,
    setDateFilter,
    categoryFilter,
    setCategoryFilter,
    accountFilter,
    setAccountFilter,
    searchQuery,
    setSearchQuery,
    isAddExpenseOpen,
    setIsAddExpenseOpen,
    isAddCategoryOpen,
    setIsAddCategoryOpen,
    isManageCategoriesOpen,
    setIsManageCategoriesOpen,
    editingCatId,
    setEditingCatId,
    editingCatName,
    setEditingCatName,
    savingCatId,
    setSavingCatId,
    deletingCatId,
    setDeletingCatId,
    categorySearchQuery,
    setCategorySearchQuery,
    voucherToPrint,
    setVoucherToPrint,
    editingExpense,
    setEditingExpense,
    newExpense,
    setNewExpense,
    newCategoryName,
    setNewCategoryName,
    newCategoryDesc,
    setNewCategoryDesc,

    // Memos / Computed
    filteredExpenses,
    totalFilteredAmount,

    // Handlers
    showToast,
    fetchExpenseCategories,
    loadData,
    handleCreateExpense,
    handleDeleteExpense,
    handleUpdateExpense,
    handleCreateCategory,
    handleStartEditCategory,
    handleCancelEditCategory,
    handleSaveEditCategory,
    handleDeleteCategory,
  };
}
