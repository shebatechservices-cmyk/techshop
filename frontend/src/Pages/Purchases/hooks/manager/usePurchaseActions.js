import { useState } from 'react';
import API from '../../../../services/api';

export function usePurchaseActions({
  loadAllData,
  showToast,
  setQuotations,
  navigate,
}) {
  // Modal & Selection States
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState(null);
  const [openActionOrderId, setOpenActionOrderId] = useState(null);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newlyCreatedSupplier, setNewlyCreatedSupplier] = useState(null);
  const [printOrder, setPrintOrder] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [profileModalPartyId, setProfileModalPartyId] = useState(null);
  const [profileModalTab, setProfileModalTab] = useState('overview');
  const [deleteBlockedDialog, setDeleteBlockedDialog] = useState({
    isOpen: false,
    poNumber: '',
    message: '',
    linkedInvoices: [],
  });

  const handleOpenPrintOrder = async (orderId) => {
    try {
      const res = await fetch(`${API}/purchase/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setPrintOrder(data);
        setIsPrintOpen(true);
      } else {
        showToast('Failed to load purchase order details for printing', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading purchase order for printing', 'error');
    }
  };

  const handleOpenAddSupplier = () => {
    if (navigate) navigate('suppliers');
    setIsSupplierModalOpen(true);
  };

  const handleSupplierCreated = (createdSupplier) => {
    setNewlyCreatedSupplier(createdSupplier);
    setIsSupplierModalOpen(false);
    loadAllData();
    showToast('Supplier registered successfully');
  };

  // Edit Order: Permitted within 15 days (360 hours)
  const handleEditOrder = async (order) => {
    const createdAt = new Date(order.created_at || Date.now());
    const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursOld > 360) {
      showToast(
        `⚠️ Editing expired: PO #${order.po_number || order.id} was created ${Math.floor(
          hoursOld / 24
        )} days ago. Edits are only permitted within 15 days (360h).`,
        'error'
      );
      return;
    }

    try {
      const res = await fetch(`${API}/purchase/${order.id}`);
      if (res.ok) {
        const fullData = await res.json();
        setOrderToEdit(fullData);
        setIsOrderModalOpen(true);
      } else {
        showToast('Failed to load order details for editing', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading purchase order for editing', 'error');
    }
  };

  // Delete Order: Permitted within 7 days (168 hours), blocked if sold or subsequent order exists
  const handleDeleteOrder = async (id, order) => {
    const createdAt = new Date(order?.created_at || Date.now());
    const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursOld > 168) {
      showToast(
        'Delete window (7 days) has expired. Please use the Return/Exchange module instead.',
        'error'
      );
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete purchase order #${
          order?.po_number || id
        }? Items will be deducted from inventory.`
      )
    )
      return;

    try {
      const res = await fetch(`${API}/purchase/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('inventory_stock_changed'));
        window.dispatchEvent(new CustomEvent('data_changed'));
        window.dispatchEvent(new CustomEvent('account_balance_changed'));
        window.dispatchEvent(new CustomEvent('cash_drawer_changed'));
        window.dispatchEvent(new CustomEvent('wallet_balance_changed'));
        loadAllData();
        showToast(data.message || 'Purchase order deleted successfully');
      } else {
        const errorMsg = data.error || data.message || 'Failed to delete purchase order';
        if (data.linked_invoices && data.linked_invoices.length > 0) {
          setDeleteBlockedDialog({
            isOpen: true,
            poNumber: order?.po_number || id,
            message: errorMsg,
            linkedInvoices: data.linked_invoices,
          });
        }
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error while deleting order', 'error');
    }
  };

  // Delete Quotation
  const handleDeleteQuotation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase quotation?')) return;
    try {
      const res = await fetch(`${API}/purchase/quotations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('data_changed'));
        loadAllData();
        showToast(data.message || 'Quotation deleted successfully');
      } else {
        showToast(data.error || 'Failed to delete quotation', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error while deleting quotation', 'error');
    }
  };

  // Edit Quotation
  const handleEditQuotation = async (quoteOrId) => {
    const quoteId =
      typeof quoteOrId === 'object' ? quoteOrId.id || quoteOrId.quotation_id : quoteOrId;
    try {
      const res = await fetch(`${API}/purchase/quotations/${quoteId}`);
      if (res.ok) {
        const json = await res.json();
        setEditingQuotation(json.data || json);
        setIsQuotationModalOpen(true);
      } else {
        showToast('Failed to load quotation for editing', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error fetching quotation details', 'error');
    }
  };

  // Update Quotation Status
  const handleUpdateQuotationStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${API}/purchase/quotations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        if (setQuotations) {
          setQuotations((prev) =>
            prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
          );
        }
        showToast(`Quotation status updated to ${newStatus}`);
      } else {
        showToast(data.error || 'Failed to update status', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error updating quotation status', 'error');
    }
  };

  // Delete Supplier
  const handleDeleteSupplier = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      const res = await fetch(`${API}/purchase/suppliers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('data_changed'));
        loadAllData();
        showToast(data.message || 'Supplier deleted successfully');
      } else {
        showToast(data.error || 'Cannot delete supplier', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error deleting supplier', 'error');
    }
  };

  return {
    isOrderModalOpen,
    setIsOrderModalOpen,
    orderToEdit,
    setOrderToEdit,
    openActionOrderId,
    setOpenActionOrderId,
    isQuotationModalOpen,
    setIsQuotationModalOpen,
    editingQuotation,
    setEditingQuotation,
    isSupplierModalOpen,
    setIsSupplierModalOpen,
    newlyCreatedSupplier,
    setNewlyCreatedSupplier,
    printOrder,
    setPrintOrder,
    isPrintOpen,
    setIsPrintOpen,
    profileModalPartyId,
    setProfileModalPartyId,
    profileModalTab,
    setProfileModalTab,
    deleteBlockedDialog,
    setDeleteBlockedDialog,
    handleOpenPrintOrder,
    handleOpenAddSupplier,
    handleSupplierCreated,
    handleEditOrder,
    handleDeleteOrder,
    handleDeleteQuotation,
    handleEditQuotation,
    handleUpdateQuotationStatus,
    handleDeleteSupplier,
  };
}
