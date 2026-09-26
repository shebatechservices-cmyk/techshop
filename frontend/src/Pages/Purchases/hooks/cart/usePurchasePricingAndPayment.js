import { useState, useMemo, useEffect } from 'react';
import API from '../../../../services/api';
import { money, newTender, computeFinalSale } from '../../utils/purchaseCartUtils';

export function usePurchasePricingAndPayment({
  items = [],
  supplierId,
  suppliers = [],
  summary,
  hasExtraCost = false,
  extraCost = '',
  isOpen = true,
}) {
  const [discount, setDiscount] = useState(0);
  const [tenders, setTenders] = useState([]);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [walletAccounts, setWalletAccounts] = useState([]);

  // Fetch Payment Accounts
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

  const accountLabel = (a) =>
    a.name + (a.account_number ? ` (${a.account_number})` : '');

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

  // Map a displayed sub_option label back to its payment account (id + balance)
  const accountByLabel = useMemo(() => {
    const m = {};
    (walletAccounts || []).forEach((a) => {
      m[accountLabel(a)] = a;
      m[a.name] = a;
      if (a.id) m[String(a.id)] = a;
    });
    return m;
  }, [walletAccounts]);

  const accountLabelToId = (label) =>
    accountByLabel[label] ? Number(accountByLabel[label].id) : 1;

  const accountLabelToBalance = (label) => {
    const acc = accountByLabel[label];
    return acc ? Number(acc.balance || 0) : 0;
  };

  // Line item aggregation
  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const qty = Number(item.quantity || 0);
        const cost = money(item.cost_price);
        const finalSale = computeFinalSale(item);
        acc.units += qty;
        acc.cost += cost * qty;
        acc.sale += finalSale * qty;
        return acc;
      },
      { units: 0, cost: 0, sale: 0 }
    );
  }, [items]);

  const extra = hasExtraCost ? money(extraCost) : 0;
  const netAmount = Number((totals.cost + extra).toFixed(2));
  const payableAmount = Math.max(0, Number((netAmount - money(discount)).toFixed(2)));
  const totalCost = payableAmount;
  const totalSale = totals.sale > 0 ? totals.sale : 0;
  const estimatedProfit = Math.max(0, totalSale - totalCost);

  // Supplier balances
  const selectedSupplierObj = useMemo(() => {
    if (summary && summary.supplier && String(summary.supplier.id) === String(supplierId))
      return summary.supplier;
    return (
      suppliers.find((s) => String(s.id) === String(supplierId)) ||
      (summary && summary.supplier) ||
      null
    );
  }, [summary, suppliers, supplierId]);

  const supplierPayable = Number(selectedSupplierObj?.payable_balance || 0);
  const previousDue = supplierPayable;
  const totalPayable = Math.max(0, Number((payableAmount + previousDue).toFixed(2)));

  const supplierWallet = Number(
    selectedSupplierObj?.wallet_balance !== undefined
      ? selectedSupplierObj.wallet_balance
      : supplierPayable < 0
      ? Math.abs(supplierPayable)
      : 0
  );
  const supplierWalletLabel = selectedSupplierObj?.name
    ? `Supplier Wallet (${selectedSupplierObj.name})`
    : 'Supplier Wallet';

  // Tender payment state calculations
  const acceptedPaid = useMemo(() => {
    return Number(
      tenders
        .filter((t) => t.isAccepted)
        .reduce((sum, t) => sum + money(t.amount), 0)
        .toFixed(2)
    );
  }, [tenders]);

  const paid = acceptedPaid;
  const currentDue = Math.max(0, Number((totalPayable - acceptedPaid).toFixed(2)));
  const remainingDue = Math.max(0, Number((payableAmount - acceptedPaid).toFixed(2)));

  // Tender mutation handlers
  const updateTender = (index, patch) => {
    setTenders((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  };

  const removeTender = (index) => {
    setTenders((current) => current.filter((_, i) => i !== index));
  };

  const addTenderRow = (defaultAmount = 0) => {
    const defaultAcc = cashAccounts[0] || 'Cash Drawer';
    const accObj =
      (walletAccounts || []).find((a) =>
        ['cash', 'drawer'].includes(String(a.account_type || '').toLowerCase())
      ) || (walletAccounts || [])[0];
    const initialAmt = defaultAmount > 0 ? defaultAmount : Math.max(0, currentDue);
    setTenders((current) => [
      ...current,
      {
        ...newTender(initialAmt, false),
        sub_option: defaultAcc,
        account_id: accObj?.id || 1,
      },
    ]);
  };

  const acceptTender = (index) => {
    setTenders((current) =>
      current.map((row, i) => (i === index ? { ...row, isAccepted: true } : row))
    );
  };

  const cancelTender = (index) => {
    removeTender(index);
  };

  const handlePayFull = () => {
    const defaultAcc = cashAccounts[0] || 'Cash Drawer';
    const accObj =
      (walletAccounts || []).find((a) =>
        ['cash', 'drawer'].includes(String(a.account_type || '').toLowerCase())
      ) || (walletAccounts || [])[0];
    const amountToPay = payableAmount > 0 ? payableAmount : totalPayable;
    setTenders([
      {
        ...newTender(amountToPay, true),
        method: 'Cash',
        sub_option: defaultAcc,
        account_id: accObj?.id || 1,
      },
    ]);
    setPaymentConfirmed(true);
  };

  const handleFullDue = () => {
    setTenders([]);
    setPaymentConfirmed(true);
  };

  return {
    discount,
    setDiscount,
    tenders,
    setTenders,
    paymentConfirmed,
    setPaymentConfirmed,
    walletAccounts,
    setWalletAccounts,
    cashAccounts,
    bankAccounts,
    mfsAccounts,
    accountByLabel,
    accountLabelToId,
    accountLabelToBalance,
    totals,
    extra,
    netAmount,
    payableAmount,
    totalCost,
    totalSale,
    estimatedProfit,
    selectedSupplierObj,
    supplierPayable,
    previousDue,
    totalPayable,
    supplierWallet,
    supplierWalletLabel,
    acceptedPaid,
    paid,
    currentDue,
    remainingDue,
    updateTender,
    removeTender,
    addTenderRow,
    acceptTender,
    cancelTender,
    handlePayFull,
    handleFullDue,
  };
}
