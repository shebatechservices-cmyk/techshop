import { useState, useRef } from 'react';
import API from '../../../services/api';
import { generateLabelPrintHtml } from '../utils/inventoryUtils';

export default function useInventoryModals({
  products = [],
  warehouses = [],
  selectedWarehouseId = 1,
  showNotification,
  loadInventory,
}) {
  // 1. Details Modal
  const [detailModalProduct, setDetailModalProduct] = useState(null);
  const handleOpenProductDetails = (product) => setDetailModalProduct(product);
  const handleCloseProductDetails = () => setDetailModalProduct(null);

  // 2. Warehouse Manage Modal
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);

  // 3. Warranty & Serials Modal
  const [warrantyModalProduct, setWarrantyModalProduct] = useState(null);
  const [warrantyData, setWarrantyData] = useState({ loading: false, serials: [], product: null });

  const handleOpenWarrantyModal = async (product) => {
    setWarrantyModalProduct(product);
    setWarrantyData({ loading: true, serials: [], product });
    try {
      const res = await fetch(`${API}/inventory/product/${product.id}/warranty`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setWarrantyData({
            loading: false,
            serials: json.serials || [],
            product: json.product || product,
          });
        }
      }
    } catch (err) {
      console.error(err);
      setWarrantyData({ loading: false, serials: [], product });
    }
  };

  // 4. Label Print Modal
  const [labelModalProduct, setLabelModalProduct] = useState(null);
  const [labelQuantity, setLabelQuantity] = useState(4);
  const printLabelRef = useRef(null);

  const handleOpenLabelModal = (product) => {
    setLabelModalProduct(product);
    setLabelQuantity(4);
  };

  const handlePrintLabels = () => {
    if (!printLabelRef.current) return;
    const printContent = printLabelRef.current.innerHTML;
    const html = generateLabelPrintHtml(printContent, labelModalProduct);
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  };

  // 5. Stock Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    product_id: '',
    source_warehouse_id: 1,
    dest_warehouse_id: 2,
    quantity: 1,
    notes: '',
  });
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  const handleOpenTransferModal = (product = null) => {
    const defaultDest = warehouses.find((w) => w.id !== selectedWarehouseId)?.id || 2;
    setTransferForm({
      product_id: product ? product.id : products[0]?.id || '',
      source_warehouse_id: selectedWarehouseId,
      dest_warehouse_id: defaultDest,
      quantity: 1,
      notes: '',
    });
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    if (!transferForm.product_id) {
      if (showNotification) showNotification('Please select a product to transfer', 'error');
      return;
    }
    if (transferForm.source_warehouse_id === transferForm.dest_warehouse_id) {
      if (showNotification) {
        showNotification('Source and destination warehouses cannot be the same', 'error');
      }
      return;
    }
    if (transferForm.quantity <= 0) {
      if (showNotification) showNotification('Quantity must be greater than 0', 'error');
      return;
    }

    try {
      setTransferSubmitting(true);
      const res = await fetch(`${API}/inventory/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferForm),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (showNotification) {
          showNotification(json.message || 'Stock transfer executed successfully!');
        }
        setIsTransferModalOpen(false);
        if (loadInventory) loadInventory();
      } else {
        if (showNotification) {
          showNotification(json.error || 'Failed to transfer stock', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      if (showNotification) showNotification('Network error during transfer', 'error');
    } finally {
      setTransferSubmitting(false);
    }
  };

  return {
    detailModalProduct,
    setDetailModalProduct,
    handleOpenProductDetails,
    handleCloseProductDetails,
    isWarehouseModalOpen,
    setIsWarehouseModalOpen,
    warrantyModalProduct,
    setWarrantyModalProduct,
    warrantyData,
    setWarrantyData,
    handleOpenWarrantyModal,
    labelModalProduct,
    setLabelModalProduct,
    labelQuantity,
    setLabelQuantity,
    printLabelRef,
    handleOpenLabelModal,
    handlePrintLabels,
    isTransferModalOpen,
    setIsTransferModalOpen,
    transferForm,
    setTransferForm,
    transferSubmitting,
    handleOpenTransferModal,
    handleExecuteTransfer,
  };
}
