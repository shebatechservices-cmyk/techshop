import { useState, useMemo } from 'react';

export default function useExpenseFilters(expenses = []) {
  const [dateFilter, setDateFilter] = useState('this_month');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [accountFilter, setAccountFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExpenses = useMemo(() => {
    return expenses.filter((ex) => {
      if (categoryFilter !== 'ALL' && ex.category_name !== categoryFilter) return false;
      if (accountFilter !== 'ALL' && String(ex.account_id) !== String(accountFilter))
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchVoucher = String(ex.voucher_no || '').toLowerCase().includes(q);
        const matchCat = String(ex.category_name || '').toLowerCase().includes(q);
        const matchPayee = String(ex.payee_name || '').toLowerCase().includes(q);
        const matchRef = String(ex.reference_no || '').toLowerCase().includes(q);
        const matchNote = String(ex.note || '').toLowerCase().includes(q);
        const matchAcc = String(ex.account_name || '').toLowerCase().includes(q);
        if (
          !matchVoucher &&
          !matchCat &&
          !matchPayee &&
          !matchRef &&
          !matchNote &&
          !matchAcc
        )
          return false;
      }
      return true;
    });
  }, [expenses, categoryFilter, accountFilter, searchQuery]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, ex) => sum + Number(ex.amount || 0), 0);
  }, [filteredExpenses]);

  return {
    dateFilter,
    setDateFilter,
    categoryFilter,
    setCategoryFilter,
    accountFilter,
    setAccountFilter,
    searchQuery,
    setSearchQuery,
    filteredExpenses,
    totalFilteredAmount,
  };
}
