import { useState } from 'react';
import API from '../../../services/api';

export function useWarrantyReturns({ showToast }) {
  const [returns, setReturns] = useState([]);
  const [isAddReturnOpen, setIsAddReturnOpen] = useState(false);

  const [editingReturn, setEditingReturn] = useState(null);
  const [returnToDelete, setReturnToDelete] = useState(null);

  const [returnForm, setReturnForm] = useState({
    invoice_no: '',
    customer_name: '',
    customer_phone: '',
    product_id: '',
    product_name: '',
    serial_code: '',
    return_qty: 1,
    return_type: 'Refund',
    refund_amount: '',
    refund_method: 'Cash',
    condition: 'Good',
    return_reason: '',
  });

  const handleSubmitReturn = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const tempId = Date.now();
      const generatedRetNo = 'RET-2026-' + String(Math.floor(100 + Math.random() * 900));
      const newEntry = {
        id: tempId,
        return_no: generatedRetNo,
        order_source: 'offline',
        ...returnForm,
        created_at: 'Just now',
      };

      setReturns((prev) => [newEntry, ...prev]);
      showToast(
        `Return ${generatedRetNo} processed! ${
          returnForm.condition === 'Good'
            ? '✓ 1 unit restocked into shop inventory'
            : '⚠️ Unit marked as damaged'
        }`
      );
      setIsAddReturnOpen(false);

      const payload = { ...returnForm };
      setReturnForm({
        invoice_no: '',
        customer_name: '',
        customer_phone: '',
        product_id: '',
        product_name: '',
        serial_code: '',
        return_qty: 1,
        return_type: 'Refund',
        refund_amount: '',
        refund_method: 'Cash',
        condition: 'Good',
        return_reason: '',
      });

      await fetch(`${API}/warranty/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditReturn = (r) => {
    setEditingReturn({ ...r });
  };

  const handleUpdateReturnSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingReturn) return;
    try {
      const res = await fetch(`${API}/warranty/returns/${editingReturn.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingReturn),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReturns((prev) =>
          prev.map((r) => (r.id === editingReturn.id ? { ...r, ...editingReturn } : r))
        );
        showToast('Return record updated successfully!');
        setEditingReturn(null);
      } else {
        alert(data.message || 'Failed to update return');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating return record');
    }
  };

  const handleConfirmDeleteReturn = async () => {
    if (!returnToDelete) return;
    try {
      const res = await fetch(`${API}/warranty/returns/${returnToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReturns((prev) => prev.filter((r) => r.id !== returnToDelete.id));
        showToast('Return record moved to Trash');
        setReturnToDelete(null);
      } else {
        alert(data.message || 'Failed to delete return');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return {
    returns,
    setReturns,
    isAddReturnOpen,
    setIsAddReturnOpen,
    editingReturn,
    setEditingReturn,
    returnToDelete,
    setReturnToDelete,
    returnForm,
    setReturnForm,
    handleSubmitReturn,
    handleOpenEditReturn,
    handleUpdateReturnSubmit,
    handleConfirmDeleteReturn,
  };
}
