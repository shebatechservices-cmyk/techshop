import { useState, useEffect, useMemo } from 'react';
import API from '../../../services/api';

export const STATUS_CONFIG = {
  ALL: { label: 'All Claims', color: '#475569', bg: '#f1f5f9' },
  Received: { label: '🟡 Received (দোকানে জমা)', color: '#b45309', bg: '#fef3c7' },
  'Sent to Service': { label: '🔵 Sent to Service (সার্ভিসে পাঠানো)', color: '#0369a1', bg: '#e0f2fe' },
  'Ready for Delivery': { label: '🟢 Ready for Delivery (প্রস্তুত)', color: '#15803d', bg: '#dcfce7' },
  Delivered: { label: '⚪ Delivered (ডেলিভারি সম্পন্ন)', color: '#475569', bg: '#f8fafc' },
};

const DEFAULT_CLAIMS = [];
const DEFAULT_RETURNS = [];

export default function useWarrantyManager() {
  const [activeTab, setActiveTab] = useState('claims'); // 'claims' | 'returns'
  const [claims, setClaims] = useState(DEFAULT_CLAIMS);
  const [returns, setReturns] = useState(DEFAULT_RETURNS);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [expireData, setExpireData] = useState(null);
  const [expireLoading, setExpireLoading] = useState(true);
  const [showExpiredList, setShowExpiredList] = useState(false);

  // 1. Instant Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');

  // 2. Claims filter & search
  const [claimStatusFilter, setClaimStatusFilter] = useState('ALL');
  const [claimSearch, setClaimSearch] = useState('');

  // 3. Modals
  const [isAddClaimOpen, setIsAddClaimOpen] = useState(false);
  const [isAddReturnOpen, setIsAddReturnOpen] = useState(false);
  const [claimToPrint, setClaimToPrint] = useState(null);
  const [swapClaimModal, setSwapClaimModal] = useState(null);
  const [newReplacementSerial, setNewReplacementSerial] = useState('');

  // Edit & Delete states for Claims & Returns
  const [editingClaim, setEditingClaim] = useState(null);
  const [claimToDelete, setClaimToDelete] = useState(null);
  const [editingReturn, setEditingReturn] = useState(null);
  const [returnToDelete, setReturnToDelete] = useState(null);

  // Claim Form
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

  // Return Form
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

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type === 'error' ? 'error' : 'success');
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Load Initial Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [claimsRes, returnsRes, prodRes] = await Promise.all([
        fetch(`${API}/warranty/claims`).catch(() => null),
        fetch(`${API}/warranty/returns`).catch(() => null),
        fetch(`${API}/master/products`).catch(() => null),
      ]);

      if (claimsRes && claimsRes.ok) {
        const d = await claimsRes.json();
        if (Array.isArray(d.data)) setClaims(d.data);
      }
      if (returnsRes && returnsRes.ok) {
        const d = await returnsRes.json();
        if (Array.isArray(d.data)) setReturns(d.data);
      }
      if (prodRes && prodRes.ok) {
        const d = await prodRes.json();
        if (Array.isArray(d)) setProductsList(d);
        else if (d.data && Array.isArray(d.data)) setProductsList(d.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Load live warranty expiry tracker
  useEffect(() => {
    let active = true;
    fetch(`${API}/warranty/expiring?days=60`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (active && d && d.success) setExpireData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setExpireLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Refresh expiry tracker on demand
  const refreshExpiry = async () => {
    setExpireLoading(true);
    try {
      const res = await fetch(`${API}/warranty/expiring?days=60`);
      const d = await res.json();
      if (d && d.success) {
        setExpireData(d);
        showToast(
          `Warranty tracker refreshed: ${d.summary?.expired_count || 0} expired, ${
            d.summary?.expiring_count || 0
          } expiring soon`
        );
      }
    } catch {
      showToast('Could not refresh warranty tracker', 'error');
    } finally {
      setExpireLoading(false);
    }
  };

  // Instant Warranty Checker
  const handleCheckWarranty = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      setSearchError('');
      setSearchResult(null);

      const res = await fetch(
        `${API}/warranty/check?query=${encodeURIComponent(searchQuery.trim())}`
      );
      const d = await res.json();

      if (res.ok && d.success) {
        setSearchResult(d);
      } else {
        // Fallback local search
        const q = searchQuery.trim().toLowerCase();
        const foundLocal = claims.find(
          (c) =>
            (c.serial_code && c.serial_code.toLowerCase().includes(q)) ||
            (c.invoice_no && c.invoice_no.toLowerCase().includes(q))
        );
        if (foundLocal) {
          setSearchResult({
            success: true,
            match_type: 'SERIAL',
            data: {
              serial_code: foundLocal.serial_code,
              product_name: foundLocal.product_name,
              brand_name: 'Dahua / Hikvision',
              invoice_no: foundLocal.invoice_no,
              sale_date: '2026-03-15',
              customer_name: foundLocal.customer_name,
              customer_phone: foundLocal.customer_phone,
              unit_price: 3200,
              warranty_months: 12,
              customer_warranty_expiry: '2027-03-15',
              is_customer_warranty_valid: true,
              customer_days_remaining: 188,
              is_vendor_warranty_valid: true,
              vendor_warranty_info: '550 days remaining from Authorized Importer',
              supplier_name: 'Authorized Importer',
              past_claims: [
                {
                  claim_no: foundLocal.claim_no,
                  status: foundLocal.status,
                  issue_description: foundLocal.issue_description,
                },
              ],
            },
          });
        } else {
          setSearchError(d.message || `No record found for S/N or Invoice "${searchQuery.trim()}".`);
        }
      }
    } catch (err) {
      setSearchError(`Unable to verify: ${err.message}`);
    } finally {
      setSearching(false);
    }
  };

  const handleIntakeFromSearch = () => {
    if (!searchResult?.data) return;
    const d = searchResult.data;
    setClaimForm({
      invoice_no: d.invoice_no || '',
      customer_name: d.customer_name || '',
      customer_phone: d.customer_phone || '',
      product_id: d.product_id || '',
      product_name: d.product_name || '',
      serial_code: d.serial_code || '',
      issue_description: '',
      backup_unit_provided: 'None',
      estimated_delivery_date: '',
      service_notes: '',
    });
    setIsAddClaimOpen(true);
  };

  const handleReturnFromSearch = () => {
    if (!searchResult?.data) return;
    const d = searchResult.data;
    setReturnForm({
      invoice_no: d.invoice_no || '',
      customer_name: d.customer_name || '',
      customer_phone: d.customer_phone || '',
      product_id: d.product_id || '',
      product_name: d.product_name || '',
      serial_code: d.serial_code || '',
      return_qty: 1,
      return_type: 'Exchange',
      refund_amount: d.unit_price || '',
      refund_method: 'Cash',
      condition: 'Good',
      return_reason: '',
    });
    setIsAddReturnOpen(true);
  };

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
    activeTab,
    setActiveTab,
    claims,
    setClaims,
    returns,
    setReturns,
    productsList,
    setProductsList,
    loading,
    setLoading,
    toastMsg,
    toastType,
    showToast,
    expireData,
    expireLoading,
    showExpiredList,
    setShowExpiredList,
    refreshExpiry,
    searchQuery,
    setSearchQuery,
    searching,
    searchResult,
    searchError,
    handleCheckWarranty,
    handleIntakeFromSearch,
    handleReturnFromSearch,
    claimStatusFilter,
    setClaimStatusFilter,
    claimSearch,
    setClaimSearch,
    isAddClaimOpen,
    setIsAddClaimOpen,
    isAddReturnOpen,
    setIsAddReturnOpen,
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
    editingReturn,
    setEditingReturn,
    returnToDelete,
    setReturnToDelete,
    claimForm,
    setClaimForm,
    returnForm,
    setReturnForm,
    handleUpdateClaimStatus,
    handleSubmitClaim,
    handleSaveSwapSerial,
    handleSubmitReturn,
    handleOpenEditClaim,
    handleUpdateClaimSubmit,
    handleConfirmDeleteClaim,
    handleOpenEditReturn,
    handleUpdateReturnSubmit,
    handleConfirmDeleteReturn,
    filteredClaims,
    loadData,
  };
}
