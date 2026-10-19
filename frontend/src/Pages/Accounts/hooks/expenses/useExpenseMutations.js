import { useState } from 'react';
import API from '../../../../services/api';

export default function useExpenseMutations({
  categories,
  accounts,
  setExpenses,
  setOverview,
  showToast,
}) {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [voucherToPrint, setVoucherToPrint] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

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

      setExpenses((prev) => [createdItem, ...prev]);
      showToast(
        `Expense of ৳ ${Number(newExpense.amount).toLocaleString()} recorded! (Voucher #${tempVoucher})`
      );
      setIsAddExpenseOpen(false);
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
    isAddExpenseOpen,
    setIsAddExpenseOpen,
    voucherToPrint,
    setVoucherToPrint,
    editingExpense,
    setEditingExpense,
    newExpense,
    setNewExpense,
    handleCreateExpense,
    handleDeleteExpense,
    handleUpdateExpense,
  };
}
