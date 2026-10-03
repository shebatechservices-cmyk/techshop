import { useState, useCallback } from 'react';
import API from '../../../../services/api';

export function useSalesActions({
  loadAllData,
  showToast,
  isAdmin,
  getSaleLockStatus,
  setOverrideModal,
  setActiveTab,
  setCustomersCount,
  setModalCustomers,
}) {
  const [actionLoading, setActionLoading] = useState({});

  // Quick-view Drawer state
  const [selectedSaleForDrawer, setSelectedSaleForDrawer] = useState(null);
  const [isSaleDrawerOpen, setIsSaleDrawerOpen] = useState(false);
  const [isSaleDrawerLoading, setIsSaleDrawerLoading] = useState(false);

  // Modals state
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [newlyCreatedCustomer, setNewlyCreatedCustomer] = useState(null);
  const [exchangeSaleId, setExchangeSaleId] = useState(null);

  // Print state
  const [printData, setPrintData] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Due Payment Modal & Slip States
  const [duePaymentModal, setDuePaymentModal] = useState({
    isOpen: false,
    sale: null,
    customer: null,
  });
  const [paymentSlipModal, setPaymentSlipModal] = useState({
    isOpen: false,
    receiptData: null,
  });

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

  // Open Print for Sale
  const handleOpenPrintSale = useCallback(
    async (saleOrId) => {
      const saleId =
        typeof saleOrId === 'object' ? saleOrId?.id || saleOrId?.invoice_id : saleOrId;
      if (
        typeof saleOrId === 'object' &&
        saleOrId !== null &&
        Array.isArray(saleOrId.items) &&
        saleOrId.items.length > 0
      ) {
        setPrintData(saleOrId);
        setIsPrintOpen(true);
        return;
      }

      try {
        if (saleId) {
          setActionLoading((prev) => ({ ...prev, [saleId]: 'print' }));
        }
        const res = await fetch(`${API}/sales/${saleId}`);
        if (res.ok) {
          const json = await res.json();
          setPrintData(json.data || json);
          setIsPrintOpen(true);
        } else {
          const json = await res.json().catch(() => ({}));
          showToast?.(json.message || 'Failed to load invoice details for printing', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast?.('Error fetching invoice details', 'error');
      } finally {
        if (saleId) {
          setActionLoading((prev) => {
            const next = { ...prev };
            delete next[saleId];
            return next;
          });
        }
      }
    },
    [showToast]
  );

  // Open Quick-View Drawer for Sale
  const handleOpenSaleDrawer = useCallback(async (saleOrId) => {
    const saleId = typeof saleOrId === 'object' ? saleOrId?.id : saleOrId;
    if (typeof saleOrId === 'object' && saleOrId !== null) {
      setSelectedSaleForDrawer(saleOrId);
      setIsSaleDrawerOpen(true);
      if (Array.isArray(saleOrId.items) && saleOrId.items.length > 0) {
        return;
      }
    } else {
      setIsSaleDrawerOpen(true);
    }

    try {
      setIsSaleDrawerLoading(true);
      const res = await fetch(`${API}/sales/${saleId}`);
      if (res.ok) {
        const json = await res.json();
        setSelectedSaleForDrawer(json.data || json);
      }
    } catch (err) {
      console.error('Error fetching sale details for drawer:', err);
    } finally {
      setIsSaleDrawerLoading(false);
    }
  }, []);

  const handleCloseSaleDrawer = useCallback(() => {
    setIsSaleDrawerOpen(false);
    setSelectedSaleForDrawer(null);
  }, []);

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
    [showToast]
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
        // If Admin, prompt for Admin Security PIN override
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
    [loadAllData, showToast]
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
        // If Admin, prompt for Admin Security PIN override
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

  // Quick Action: New Sale for a specific customer
  const handleStartSaleForCustomer = useCallback(
    (cust) => {
      setNewlyCreatedCustomer(cust);
      setEditingSale(null);
      setActiveTab?.('history');
      setIsSaleModalOpen(true);
    },
    [setActiveTab]
  );

  // Quick Action: New Quote for a specific customer
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

  // Due Payment Handlers
  const handleOpenDuePayment = useCallback((sale, customer = null) => {
    setDuePaymentModal({
      isOpen: true,
      sale: sale || null,
      customer: customer || null,
    });
  }, []);

  const handleCloseDuePayment = useCallback(() => {
    setDuePaymentModal({
      isOpen: false,
      sale: null,
      customer: null,
    });
  }, []);

  const handlePaymentSuccess = useCallback(
    (receiptData) => {
      loadAllData?.();
      if (selectedSaleForDrawer && receiptData?.sale?.id === selectedSaleForDrawer.id) {
        handleOpenSaleDrawer(selectedSaleForDrawer.id);
      }
      setPaymentSlipModal({
        isOpen: true,
        receiptData,
      });
      showToast?.('Payment recorded and receipt generated!');
    },
    [loadAllData, selectedSaleForDrawer, handleOpenSaleDrawer, showToast]
  );

  const handleClosePaymentSlip = useCallback(() => {
    setPaymentSlipModal({
      isOpen: false,
      receiptData: null,
    });
  }, []);

  return {
    actionLoading,
    setActionLoading,
    selectedSaleForDrawer,
    setSelectedSaleForDrawer,
    isSaleDrawerOpen,
    setIsSaleDrawerOpen,
    isSaleDrawerLoading,
    handleOpenSaleDrawer,
    handleCloseSaleDrawer,
    isSaleModalOpen,
    setIsSaleModalOpen,
    editingSale,
    setEditingSale,
    newlyCreatedCustomer,
    setNewlyCreatedCustomer,
    exchangeSaleId,
    setExchangeSaleId,
    printData,
    setPrintData,
    isPrintOpen,
    setIsPrintOpen,
    duePaymentModal,
    setDuePaymentModal,
    paymentSlipModal,
    setPaymentSlipModal,
    handleOpenDuePayment,
    handleCloseDuePayment,
    handlePaymentSuccess,
    handleClosePaymentSlip,
    handleCustomerCreated,
    handleOpenPrintSale,
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
