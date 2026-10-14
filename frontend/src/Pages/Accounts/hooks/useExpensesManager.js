import { useState, useEffect } from 'react';
import API from '../../../services/api';
import useExpenseCategoryActions from './expenses/useExpenseCategoryActions';
import useExpenseFilters from './expenses/useExpenseFilters';

const DEFAULT_EXPENSES = [];

export default function useExpensesManager() {
  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES);
  const [categories, setCategories] = useState([]);
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

  // Modals & form state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
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

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Category Actions
  const categoryOps = useExpenseCategoryActions({
    setCategories,
    setNewExpense,
    editingExpense,
    setEditingExpense,
    setOverview,
    showToast,
  });

  // Filters & calculations
  const filterOps = useExpenseFilters(expenses);

  // Load Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [expRes, catRes, accRes, ovRes] = await Promise.all([
        fetch(`${API}/expenses?date_range=${filterOps.dateFilter}`).catch(() => null),
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
        const list = Array.isArray(d) ? d : d.data || [];
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
  }, [filterOps.dateFilter]);

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
      showToast(
        `Expense of ৳ ${Number(newExpense.amount).toLocaleString()} recorded! (Voucher #${tempVoucher})`
      );
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
    if (
      !window.confirm(
        `Delete expense ${voucher_no} of ৳ ${Number(amount).toLocaleString()} and restore account balance?`
      )
    )
      return;

    try {
      setExpenses((prev) => prev.filter((ex) => ex.id !== id));
      showToast(
        `Expense ${voucher_no} deleted and ৳ ${Number(amount).toLocaleString()} restored.`
      );
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
        setExpenses((prev) =>
          prev.map((ex) => (ex.id === editingExpense.id ? { ...ex, ...d.data } : ex))
        );
        showToast(
          `Expense ${editingExpense.voucher_no || editingExpense.id} updated successfully!`
        );
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

  return {
    // State
    expenses,
    setExpenses,
    categories,
    setCategories,
    categoriesLoading: categoryOps.categoriesLoading,
    setCategoriesLoading: categoryOps.setCategoriesLoading,
    categorySubmitting: categoryOps.categorySubmitting,
    setCategorySubmitting: categoryOps.setCategorySubmitting,
    accounts,
    setAccounts,
    loading,
    setLoading,
    toastMsg,
    setToastMsg,
    overview,
    setOverview,
    dateFilter: filterOps.dateFilter,
    setDateFilter: filterOps.setDateFilter,
    categoryFilter: filterOps.categoryFilter,
    setCategoryFilter: filterOps.setCategoryFilter,
    accountFilter: filterOps.accountFilter,
    setAccountFilter: filterOps.setAccountFilter,
    searchQuery: filterOps.searchQuery,
    setSearchQuery: filterOps.setSearchQuery,
    isAddExpenseOpen,
    setIsAddExpenseOpen,
    isAddCategoryOpen: categoryOps.isAddCategoryOpen,
    setIsAddCategoryOpen: categoryOps.setIsAddCategoryOpen,
    isManageCategoriesOpen: categoryOps.isManageCategoriesOpen,
    setIsManageCategoriesOpen: categoryOps.setIsManageCategoriesOpen,
    editingCatId: categoryOps.editingCatId,
    setEditingCatId: categoryOps.setEditingCatId,
    editingCatName: categoryOps.editingCatName,
    setEditingCatName: categoryOps.setEditingCatName,
    savingCatId: categoryOps.savingCatId,
    setSavingCatId: categoryOps.setSavingCatId,
    deletingCatId: categoryOps.deletingCatId,
    setDeletingCatId: categoryOps.setDeletingCatId,
    categorySearchQuery: categoryOps.categorySearchQuery,
    setCategorySearchQuery: categoryOps.setCategorySearchQuery,
    voucherToPrint,
    setVoucherToPrint,
    editingExpense,
    setEditingExpense,
    newExpense,
    setNewExpense,
    newCategoryName: categoryOps.newCategoryName,
    setNewCategoryName: categoryOps.setNewCategoryName,
    newCategoryDesc: categoryOps.newCategoryDesc,
    setNewCategoryDesc: categoryOps.setNewCategoryDesc,

    // Memos / Computed
    filteredExpenses: filterOps.filteredExpenses,
    totalFilteredAmount: filterOps.totalFilteredAmount,

    // Handlers
    showToast,
    fetchExpenseCategories: categoryOps.fetchExpenseCategories,
    loadData,
    handleCreateExpense,
    handleDeleteExpense,
    handleUpdateExpense,
    handleCreateCategory: categoryOps.handleCreateCategory,
    handleStartEditCategory: categoryOps.handleStartEditCategory,
    handleCancelEditCategory: categoryOps.handleCancelEditCategory,
    handleSaveEditCategory: categoryOps.handleSaveEditCategory,
    handleDeleteCategory: categoryOps.handleDeleteCategory,
  };
}
