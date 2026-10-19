import { useState, useCallback } from 'react';
import API from '../../../../../services/api';

export function useSaleEditAndDelete({
  loadAllData,
  showToast,
  isAdmin,
  getSaleLockStatus,
  setOverrideModal,
  setActiveTab,
  setCustomersCount,
  setModalCustomers,
  handleOpenPrintSale,
  setActionLoading,
}) {
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [newlyCreatedCustomer, setNewlyCreatedCustomer] = useState(null);
  const [exchangeSaleId, setExchangeSaleId] = useState(null);

  // Customer created callback
  const handleCustomerCreated = useCallback(
    (createdCustomer) => {
      setNewlyCreatedCustomer(createdCustomer);
      setCustomersCount?.((c) => c + 1);
      setModalCustomers?.((prev) => [createdCustomer, ...prev]);
      showToast?.(`Customer "${createdCustomer.name}" registered successfully!`);
    },
    [setCustomersCount, setModalCustomers, showToast]
  );

  // Sale created callback
  const handleSaleCreated = useCallback(
    (newSale) => {
      setIsSaleModalOpen(false);
      setEditingSale(null);
      loadAllData?.();
      showToast?.(`Sale Invoice #${newSale.invoice_no || newSale.id} created successfully!`);
      if (newSale && (newSale.items || newSale.id)) {
        handleOpenPrintSale(newSale.id || newSale);
      }
    },
    [loadAllData, showToast, handleOpenPrintSale]
  );

  // Edit Sale callback
  const handleSaleUpdated = useCallback(
    (updatedSale) => {
      setIsSaleModalOpen(false);
      setEditingSale(null);
      loadAllData?.();
      showToast?.(`Sale Invoice #${updatedSale.invoice_no || updatedSale.id} updated successfully!`);
      if (updatedSale && (updatedSale.items || updatedSale.id)) {
        handleOpenPrintSale(updatedSale.id || updatedSale);
      }
    },
    [loadAllData, showToast, handleOpenPrintSale]
  );

  // Open Edit Sale Form with full invoice details
  const executeEditSale = useCallback(
    async (idOrSale, adminPin = null) => {
      const id =
        typeof idOrSale === 'object' && idOrSale !== null
          ? idOrSale.id || idOrSale.invoice_id
          : idOrSale;
      if (!id) return;
      try {
        setActionLoading((prev) => ({ ...prev, [id]: 'edit' }));
        const res = await fetch(`${API}/sales/${id}`);
        const data = await res.json();
        if (!res.ok || !data.success)
          throw new Error(data.message || 'Failed to load sale invoice');
        const saleData = data.data;
        if (adminPin) {
          saleData.admin_pin = adminPin;
        }
        setEditingSale(saleData);
        setIsSaleModalOpen(true);
      } catch (err) {
        showToast?.(`Could not open sale invoice for editing: ${err.message}`, 'error');
      } finally {
        setActionLoading((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [showToast, setActionLoading]
  );

  const handleInitiateEditSale = useCallback(
    (idOrSale, maybeSaleObj) => {
      const saleObj =
        typeof idOrSale === 'object' && idOrSale !== null ? idOrSale : maybeSaleObj;
      const id =
        typeof idOrSale === 'object' && idOrSale !== null
          ? idOrSale.id || idOrSale.invoice_id
          : idOrSale;
      const lockStatus = getSaleLockStatus?.(saleObj) || {};
      if (lockStatus.isEditLocked) {
        if (!isAdmin) {
          showToast?.(lockStatus.editLockReason, 'error');
          return;
        }
        setOverrideModal?.({
          isOpen: true,
          actionType: 'edit',
          sale: saleObj,
          enteredPin: '',
          error: '',
          lockReason: lockStatus.editLockReason,
        });
        return;
      }
      executeEditSale(id);
    },
    [getSaleLockStatus, isAdmin, showToast, setOverrideModal, executeEditSale]
  );

  // Delete Sale with optional Admin PIN override
  const executeDeleteSale = useCallback(
    async (idOrSale, maybeSaleObj, adminPin = null) => {
      const saleObj =
        typeof idOrSale === 'object' && idOrSale !== null ? idOrSale : maybeSaleObj;
      const id =
        typeof idOrSale === 'object' && idOrSale !== null
          ? idOrSale.id || idOrSale.invoice_id
          : idOrSale;
      if (
        !adminPin &&
        !window.confirm(
          `Are you sure you want to delete sale invoice #${
            saleObj?.invoice_no || id
          }? This will restore product stock and reverse ledger entries.`
        )
      )
        return;
      try {
        setActionLoading((prev) => ({ ...prev, [id]: 'delete' }));
        const res = await fetch(`${API}/sales/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(adminPin ? { 'x-admin-pin': adminPin } : {}),
          },
          body: JSON.stringify({ admin_pin: adminPin }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          window.dispatchEvent(new CustomEvent('inventory_stock_changed'));
          window.dispatchEvent(new CustomEvent('data_changed'));
          loadAllData?.();
          showToast?.(
            data.message || `Sale invoice #${saleObj?.invoice_no || id} deleted successfully!`
          );
        } else {
          showToast?.(data.message || 'Failed to delete sale invoice', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast?.('Server error deleting sale record', 'error');
      } finally {
        setActionLoading((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [loadAllData, showToast, setActionLoading]
  );

  const handleInitiateDeleteSale = useCallback(
    (idOrSale, maybeSaleObj) => {
      const saleObj =
        typeof idOrSale === 'object' && idOrSale !== null ? idOrSale : maybeSaleObj;
      const id =
        typeof idOrSale === 'object' && idOrSale !== null
          ? idOrSale.id || idOrSale.invoice_id
          : idOrSale;
      const lockStatus = getSaleLockStatus?.(saleObj) || {};
      if (lockStatus.isDeleteLocked) {
        if (!isAdmin) {
          showToast?.(lockStatus.deleteLockReason, 'error');
          return;
        }
        setOverrideModal?.({
          isOpen: true,
          actionType: 'delete',
          sale: saleObj,
          enteredPin: '',
          error: '',
          lockReason: lockStatus.deleteLockReason,
        });
        return;
      }
      executeDeleteSale(id, saleObj);
    },
    [getSaleLockStatus, isAdmin, showToast, setOverrideModal, executeDeleteSale]
  );

  const handleStartSaleForCustomer = useCallback(
    (cust) => {
      setNewlyCreatedCustomer(cust);
      setEditingSale(null);
      setActiveTab?.('history');
      setIsSaleModalOpen(true);
    },
    [setActiveTab]
  );

  const handleStartQuoteForCustomer = useCallback(
    (cust) => {
      setActiveTab?.('quotations');
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('sales:open_modal', { detail: { type: 'quotation', customer: cust } })
        );
      }, 50);
    },
    [setActiveTab]
  );

  return {
    isSaleModalOpen,
    setIsSaleModalOpen,
    editingSale,
    setEditingSale,
    newlyCreatedCustomer,
    setNewlyCreatedCustomer,
    exchangeSaleId,
    setExchangeSaleId,
    handleCustomerCreated,
    handleSaleCreated,
    handleSaleUpdated,
    executeEditSale,
    handleInitiateEditSale,
    executeDeleteSale,
    handleInitiateDeleteSale,
    handleStartSaleForCustomer,
    handleStartQuoteForCustomer,
  };
}
