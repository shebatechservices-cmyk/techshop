import { useState, useEffect, useMemo } from 'react';
import API from '../../../services/api';

export const money = (val) => Number.parseFloat(val || 0) || 0;

export const newTender = (defaultAmount = 0, isAccepted = false) => ({
  id: `${Date.now()}-${Math.random()}`,
  method: 'Cash',
  sub_option: '',
  transaction_id: '',
  receiver_name: '',
  amount: defaultAmount,
  isAccepted,
});

export default function useSaleTendersState({
  isOpen = false,
  totalPayable = 0,
  editSale = null,
  itemsCount = 0,
}) {
  const [tenders, setTenders] = useState([newTender(0)]);
  const [hasUserEditedPaid, setHasUserEditedPaid] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [walletAccounts, setWalletAccounts] = useState([]);

  // Load user-created payment accounts (cash drawers / banks / MFS) from backend
  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API}/accounts/wallets`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.data)) setWalletAccounts(data.data);
        else setWalletAccounts([]);
      })
      .catch(() => setWalletAccounts([]));
  }, [isOpen]);

  const accountLabel = (a) => a.name + (a.account_number ? ` (${a.account_number})` : '');
  const cashAccounts = useMemo(
    () =>
      (walletAccounts || [])
        .filter((a) =>
          ['cash', 'drawer'].includes(String(a.account_type || '').toLowerCase())
        )
        .map(accountLabel),
    [walletAccounts]
  );
  const bankAccounts = useMemo(
    () =>
      (walletAccounts || [])
        .filter((a) => String(a.account_type || '').toLowerCase() === 'bank')
        .map(accountLabel),
    [walletAccounts]
  );
  const mfsAccounts = useMemo(
    () =>
      (walletAccounts || [])
        .filter(
          (a) =>
            !['cash', 'drawer', 'bank', 'wallet'].includes(
              String(a.account_type || '').toLowerCase()
            )
        )
        .map(accountLabel),
    [walletAccounts]
  );

  // Fill empty sub_option for the primary tender once accounts load
  useEffect(() => {
    setTenders((current) => {
      if (!current || !current.length) return current;
      const first = current[0];
      if (first.sub_option) return current;
      const list =
        first.method === 'Bank'
          ? bankAccounts
          : first.method === 'MFS'
          ? mfsAccounts
          : cashAccounts;
      const sub =
        (list && list[0]) ||
        (first.method === 'Bank'
          ? 'Bank'
          : first.method === 'MFS'
          ? 'MFS'
          : 'Cash Drawer');
      return current.map((t, i) => (i === 0 ? { ...t, sub_option: sub } : t));
    });
  }, [walletAccounts, cashAccounts, bankAccounts, mfsAccounts]);

  const acceptedPaid = useMemo(
    () =>
      tenders
        .filter((t) => t.isAccepted)
        .reduce((sum, tender) => sum + money(tender.amount), 0),
    [tenders]
  );
  const paid = acceptedPaid;
  const currentDue = Math.max(0, totalPayable - paid);
  const due = currentDue;

  // Auto-fill tender amount
  useEffect(() => {
    if (!hasUserEditedPaid && itemsCount > 0 && !editSale) {
      const total = totalPayable;
      const defaultCash = cashAccounts[0] || 'Cash Drawer';
      setTenders((current) => {
        if (!current || current.length === 0)
          return [
            {
              ...newTender(total, false),
              method: 'Cash',
              sub_option: defaultCash,
            },
          ];
        return current.map((t, idx) =>
          idx === 0 && !t.isAccepted
            ? {
                ...t,
                amount: total,
                method: t.method || 'Cash',
                sub_option: t.sub_option || defaultCash,
              }
            : t
        );
      });
    }
  }, [
    totalPayable,
    hasUserEditedPaid,
    itemsCount,
    editSale,
    cashAccounts,
  ]);

  const updateTender = (index, patch) => {
    setTenders((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  };

  const removeTender = (index) => {
    setHasUserEditedPaid(true);
    setTenders((current) => current.filter((_, i) => i !== index));
  };

  const addTenderRow = () => {
    setHasUserEditedPaid(true);
    const unpaidRemaining = Math.max(0, totalPayable - paid);
    const defaultAcc = cashAccounts[0] || 'Cash Drawer';
    setTenders((current) => [
      ...current,
      {
        ...newTender(unpaidRemaining > 0 ? unpaidRemaining : '', false),
        sub_option: defaultAcc,
      },
    ]);
  };

  const acceptTender = (index) => {
    setHasUserEditedPaid(true);
    setPaymentConfirmed(true);
    setTenders((current) =>
      current.map((row, i) => (i === index ? { ...row, isAccepted: true } : row))
    );
  };

  const cancelTender = (index) => {
    removeTender(index);
  };

  const setQuickPaid = (amount) => {
    setHasUserEditedPaid(true);
    setPaymentConfirmed(true);
    if (amount <= 0) {
      setTenders([]);
    } else {
      const defaultAcc = cashAccounts[0] || 'Cash Drawer';
      setTenders([
        {
          ...newTender(amount, true),
          sub_option: defaultAcc,
        },
      ]);
    }
  };

  return {
    tenders,
    setTenders,
    hasUserEditedPaid,
    setHasUserEditedPaid,
    paymentConfirmed,
    setPaymentConfirmed,
    walletAccounts,
    cashAccounts,
    bankAccounts,
    mfsAccounts,
    paid,
    currentDue,
    due,
    updateTender,
    removeTender,
    addTenderRow,
    acceptTender,
    cancelTender,
    setQuickPaid,
  };
}
