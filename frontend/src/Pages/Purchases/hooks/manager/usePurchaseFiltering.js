import { useState, useMemo, useEffect } from 'react';

export function usePurchaseFiltering({
  orders = [],
  quotations = [],
  suppliers = [],
  initialSearch = '',
  navKey = 0,
}) {
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch || '');
    }
  }, [initialSearch, navKey]);

  // Filtered lists
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.po_number?.toLowerCase().includes(q) ||
        o.supplier_name?.toLowerCase().includes(q) ||
        o.transaction_reference?.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  const filteredQuotations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return quotations;
    return quotations.filter(
      (item) =>
        item.quotation_no?.toLowerCase().includes(q) ||
        item.supplier_name?.toLowerCase().includes(q) ||
        item.reference?.toLowerCase().includes(q)
    );
  }, [quotations, searchQuery]);

  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.contact_person?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.mobile?.includes(q)
    );
  }, [suppliers, searchQuery]);

  // Aggregated totals
  const totalPurchasesCost = useMemo(
    () => orders.reduce((sum, o) => sum + Number(o.total_cost || 0), 0),
    [orders]
  );
  const totalPurchasesPaid = useMemo(
    () => orders.reduce((sum, o) => sum + Number(o.total_paid || 0), 0),
    [orders]
  );
  const totalPurchasesDue = useMemo(
    () => orders.reduce((sum, o) => sum + Number(o.total_due || 0), 0),
    [orders]
  );

  const totalQuotationAmount = useMemo(
    () => quotations.reduce((sum, q) => sum + Number(q.total_amount || 0), 0),
    [quotations]
  );
  const totalSupplierDue = useMemo(
    () => suppliers.reduce((sum, s) => sum + Number(s.payable_balance || 0), 0),
    [suppliers]
  );

  return {
    searchQuery,
    setSearchQuery,
    filteredOrders,
    filteredQuotations,
    filteredSuppliers,
    totalPurchasesCost,
    totalPurchasesPaid,
    totalPurchasesDue,
    totalQuotationAmount,
    totalSupplierDue,
  };
}
