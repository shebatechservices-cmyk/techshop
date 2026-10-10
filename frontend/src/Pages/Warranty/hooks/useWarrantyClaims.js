import { useState, useMemo } from 'react';
import API from '../../../services/api';

export function useWarrantyClaims({ showToast }) {
  const [claims, setClaims] = useState([]);
  const [claimStatusFilter, setClaimStatusFilter] = useState('ALL');
  const [claimSearch, setClaimSearch] = useState('');

  // Modals & form state
  const [isAddClaimOpen, setIsAddClaimOpen] = useState(false);
  const [claimToPrint, setClaimToPrint] = useState(null);
  const [swapClaimModal, setSwapClaimModal] = useState(null);
  const [newReplacementSerial, setNewReplacementSerial] = useState('');

  const [editingClaim, setEditingClaim] = useState(null);
  const [claimToDelete, setClaimToDelete] = useState(null);

  const [claimForm, setClaimForm] = useState({
    invoice_no: '',
    customer_name: '',
    customer_phone: '',
    product_id: '',
    product_name: '',
    serial_code: '',
    issue_description: '',
    backup_unit_provided: 'None',
    estimated_delivery_date: '',
    service_notes: '',
  });

  const handleUpdateClaimStatus = async (claimId, newStatus) => {
    try {
      setClaims((prev) =>
        prev.map((c) => (c.id === claimId ? { ...c, status: newStatus } : c))
      );
      showToast(`Claim status updated to "${newStatus}"`);
      await fetch(`${API}/warranty/claims/${claimId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitClaim = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const tempId = Date.now();
      const generatedClaimNo = 'CLM-2026-' + String(Math.floor(100 + Math.random() * 900));
      const newEntry = {
        id: tempId,
        claim_no: generatedClaimNo,
        order_source: 'offline',
        ...claimForm,
        status: 'Received',
        received_date: new Date().toISOString().split('T')[0],
      };

      setClaims((prev) => [newEntry, ...prev]);
      showToast(`Warranty claim received! Token Slip #${generatedClaimNo}`);
      setIsAddClaimOpen(false);

      const payload = { ...claimForm };
      setClaimForm({
        invoice_no: '',
        customer_name: '',
        customer_phone: '',
        product_id: '',
        product_name: '',
        serial_code: '',
        issue_description: '',
        backup_unit_provided: 'None',
        estimated_delivery_date: '',
        service_notes: '',
      });

      // Prompt to print slip immediately
      setClaimToPrint(newEntry);

      await fetch(`${API}/warranty/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSwapSerial = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!swapClaimModal || !newReplacementSerial.trim()) return;

    try {
      const claimId = swapClaimModal.id;
      const s = newReplacementSerial.trim();
      setClaims((prev) =>
        prev.map((c) =>
          c.id === claimId
            ? { ...c, replacement_serial_code: s, status: 'Ready for Delivery' }
            : c
        )
      );
      showToast(`Replacement Serial "${s}" recorded! Status set to Ready.`);
      setSwapClaimModal(null);
      setNewReplacementSerial('');

      await fetch(`${API}/warranty/claims/${claimId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replacement_serial_code: s,
          status: 'Ready for Delivery',
          service_notes: `Supplier replaced with new unit (New S/N: ${s})`,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditClaim = (c) => {
    setEditingClaim({ ...c });
  };

  const handleUpdateClaimSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingClaim) return;
    try {
      const res = await fetch(`${API}/warranty/claims/${editingClaim.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingClaim),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClaims((prev) =>
          prev.map((c) => (c.id === editingClaim.id ? { ...c, ...editingClaim } : c))
        );
        showToast('Claim updated successfully!');
        setEditingClaim(null);
      } else {
        alert(data.message || 'Failed to update claim');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating claim');
    }
  };

  const handleConfirmDeleteClaim = async () => {
    if (!claimToDelete) return;
    try {
      const res = await fetch(`${API}/warranty/claims/${claimToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClaims((prev) => prev.filter((c) => c.id !== claimToDelete.id));
        showToast('Claim moved to Trash');
        setClaimToDelete(null);
      } else {
        alert(data.message || 'Failed to delete claim');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      if (claimStatusFilter !== 'ALL' && c.status !== claimStatusFilter) return false;
      if (claimSearch.trim()) {
        const q = claimSearch.toLowerCase();
        const matchNo = String(c.claim_no || '').toLowerCase().includes(q);
        const matchSn = String(c.serial_code || '').toLowerCase().includes(q);
        const matchRep = String(c.replacement_serial_code || '').toLowerCase().includes(q);
        const matchCust = String(c.customer_name || '').toLowerCase().includes(q);
        const matchPhone = String(c.customer_phone || '').toLowerCase().includes(q);
        const matchProd = String(c.product_name || '').toLowerCase().includes(q);
        const matchInv = String(c.invoice_no || '').toLowerCase().includes(q);
        if (
          !matchNo &&
          !matchSn &&
          !matchRep &&
          !matchCust &&
          !matchPhone &&
          !matchProd &&
          !matchInv
        )
          return false;
      }
      return true;
    });
  }, [claims, claimStatusFilter, claimSearch]);

  return {
    claims,
    setClaims,
    claimStatusFilter,
    setClaimStatusFilter,
    claimSearch,
    setClaimSearch,
    isAddClaimOpen,
    setIsAddClaimOpen,
    claimToPrint,
    setClaimToPrint,
    swapClaimModal,
    setSwapClaimModal,
    newReplacementSerial,
    setNewReplacementSerial,
    editingClaim,
    setEditingClaim,
    claimToDelete,
    setClaimToDelete,
    claimForm,
    setClaimForm,
    handleUpdateClaimStatus,
    handleSubmitClaim,
    handleSaveSwapSerial,
    handleOpenEditClaim,
    handleUpdateClaimSubmit,
    handleConfirmDeleteClaim,
    filteredClaims,
  };
}
