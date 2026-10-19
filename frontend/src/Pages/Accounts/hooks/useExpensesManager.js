import { useState, useEffect } from 'react';
import API from '../../../services/api';
import useExpenseCategoryActions from './expenses/useExpenseCategoryActions';
import useExpenseFilters from './expenses/useExpenseFilters';
import useExpenseMutations from './expenses/useExpenseMutations';

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

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const mutations = useExpenseMutations({
    categories,
    accounts,
    setExpenses,
    setOverview,
    showToast,
  });

  const categoryOps = useExpenseCategoryActions({
    setCategories,
    setNewExpense: mutations.setNewExpense,
    editingExpense: mutations.editingExpense,
    setEditingExpense: mutations.setEditingExpense,
    setOverview,
    showToast,
  });

  const filterOps = useExpenseFilters(expenses);

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
          mutations.setNewExpense((prev) => ({
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
        if (accList.length > 0 && !mutations.newExpense.account_id) {
          mutations.setNewExpense((prev) => ({
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

  return {
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
    isAddExpenseOpen: mutations.isAddExpenseOpen,
    setIsAddExpenseOpen: mutations.setIsAddExpenseOpen,
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
    voucherToPrint: mutations.voucherToPrint,
    setVoucherToPrint: mutations.setVoucherToPrint,
    editingExpense: mutations.editingExpense,
    setEditingExpense: mutations.setEditingExpense,
    newExpense: mutations.newExpense,
    setNewExpense: mutations.setNewExpense,
    newCategoryName: categoryOps.newCategoryName,
    setNewCategoryName: categoryOps.setNewCategoryName,
    newCategoryDesc: categoryOps.newCategoryDesc,
    setNewCategoryDesc: categoryOps.setNewCategoryDesc,
    filteredExpenses: filterOps.filteredExpenses,
    totalFilteredAmount: filterOps.totalFilteredAmount,
    showToast,
    fetchExpenseCategories: categoryOps.fetchExpenseCategories,
    loadData,
    handleCreateExpense: mutations.handleCreateExpense,
    handleDeleteExpense: mutations.handleDeleteExpense,
    handleUpdateExpense: mutations.handleUpdateExpense,
    handleCreateCategory: categoryOps.handleCreateCategory,
    handleStartEditCategory: categoryOps.handleStartEditCategory,
    handleCancelEditCategory: categoryOps.handleCancelEditCategory,
    handleSaveEditCategory: categoryOps.handleSaveEditCategory,
    handleDeleteCategory: categoryOps.handleDeleteCategory,
  };
}
