import { useState, useEffect, useMemo } from 'react';

export const money = (val) => Number.parseFloat(val || 0) || 0;

export function useSalesFiltering({
  sales = [],
  initialTab = 'history',
  initialSearch = '',
  navKey = 0,
}) {
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState(
    initialTab === 'history' ? initialSearch : ''
  );
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');

  useEffect(() => {
    if (initialTab === 'history') {
      setInvoiceSearchQuery(initialSearch || '');
      if (initialSearch) setInvoiceStatusFilter('ALL');
    }
  }, [initialTab, initialSearch, navKey]);

  // Filtered Sales (Invoices)
  const filteredSales = useMemo(() => {
    const q = invoiceSearchQuery.trim().toLowerCase();
    return sales.filter((s) => {
      const matchesSearch =
        !q ||
        (s.invoice_no && s.invoice_no.toLowerCase().includes(q)) ||
        (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
        (s.customer_phone && s.customer_phone.toLowerCase().includes(q)) ||
        (s.customer_email && s.customer_email.toLowerCase().includes(q)) ||
        (s.sales_person && s.sales_person.toLowerCase().includes(q)) ||
        (s.destination && s.destination.toLowerCase().includes(q)) ||
        (s.attention && s.attention.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q)) ||
        (s.payment_status && s.payment_status.toLowerCase().includes(q)) ||
        (s.total_amount && String(s.total_amount).includes(q)) ||
        (s.id && String(s.id) === q);

      const isRefund =
        s.payment_status === 'refunded' ||
        Boolean(s.exchange_from_invoice_no && money(s.total_amount) === 0 && money(s.paid_amount) > 0);

      const matchesStatus =
        invoiceStatusFilter === 'ALL' ||
        (invoiceStatusFilter === 'REFUNDED' && (s.payment_status === 'refunded' || isRefund)) ||
        (invoiceStatusFilter === 'PAID' &&
          !isRefund &&
          s.payment_status !== 'exchanged' &&
          (s.payment_status === 'paid' || money(s.due_amount) <= 0)) ||
        (invoiceStatusFilter === 'PARTIAL' && s.payment_status === 'partial') ||
        (invoiceStatusFilter === 'DUE' &&
          (s.payment_status === 'due' ||
            (money(s.due_amount) > 0 && money(s.paid_amount) === 0)));

      return matchesSearch && matchesStatus;
    });
  }, [sales, invoiceSearchQuery, invoiceStatusFilter]);

  // Financial Metrics Calculations
  const totalSalesVolume = useMemo(() => {
    return sales.reduce((sum, s) => sum + money(s.total_amount || s.grand_total), 0);
  }, [sales]);

  const totalCollectedAmount = useMemo(() => {
    return sales.reduce((sum, s) => {
      const isRefund =
        s.payment_status === 'refunded' ||
        Boolean(s.exchange_from_invoice_no && money(s.total_amount) === 0 && money(s.paid_amount) > 0);
      return isRefund ? sum - money(s.paid_amount) : sum + money(s.paid_amount);
    }, 0);
  }, [sales]);

  const totalSalesDue = useMemo(() => {
    return sales.reduce((sum, s) => sum + money(s.due_amount), 0);
  }, [sales]);

  const getPaymentBadgeStyle = (status, due, sale = null) => {
    const s = String(status || '').toLowerCase();
    const isRefund =
      s === 'refunded' ||
      Boolean(sale?.exchange_from_invoice_no && money(sale?.total_amount) === 0 && money(sale?.paid_amount) > 0);

    if (isRefund) {
      return {
        className: 'bg-purple-100 text-purple-700 border border-purple-200',
        label: 'Refunded',
      };
    }
    if (s === 'exchanged') {
      return {
        className: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
        label: 'Exchanged',
      };
    }
    if (s === 'return') {
      return {
        className: 'bg-amber-100 text-amber-700 border border-amber-200',
        label: 'Return',
      };
    }
    if (s === 'paid' || (money(due) <= 0 && s !== 'due' && s !== 'partial')) {
      return {
        className: 'bg-green-100 text-green-700 border border-green-200',
        label: 'Paid',
      };
    }
    if (s === 'partial' || (money(due) > 0 && s !== 'due')) {
      return {
        className: 'bg-amber-100 text-amber-700 border border-amber-200',
        label: 'Partial',
      };
    }
    return {
      className: 'bg-red-100 text-red-700 border border-red-200',
      label: 'Due',
    };
  };

  return {
    invoiceSearchQuery,
    setInvoiceSearchQuery,
    invoiceStatusFilter,
    setInvoiceStatusFilter,
    filteredSales,
    totalSalesVolume,
    totalCollectedAmount,
    totalSalesDue,
    getPaymentBadgeStyle,
  };
}
