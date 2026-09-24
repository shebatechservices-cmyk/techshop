import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';

const STATUS_CONFIG = {
  ALL: { label: 'All Claims', color: '#475569', bg: '#f1f5f9' },
  Received: { label: '🟡 Received (দোকানে জমা)', color: '#b45309', bg: '#fef3c7' },
  'Sent to Service': { label: '🔵 Sent to Service (সার্ভিসে পাঠানো)', color: '#0369a1', bg: '#e0f2fe' },
  'Ready for Delivery': { label: '🟢 Ready for Delivery (প্রস্তুত)', color: '#15803d', bg: '#dcfce7' },
  Delivered: { label: '⚪ Delivered (ডেলিভারি সম্পন্ন)', color: '#475569', bg: '#f8fafc' },
};

const DEFAULT_CLAIMS = [];
const DEFAULT_RETURNS = [];

export default function Warranty() {
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

  const showToast = (msg, type) => {
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
        showToast(`Warranty tracker refreshed: ${d.summary.expired_count} expired, ${d.summary.expiring_count} expiring soon`);
      }
    } catch {
      showToast('Could not refresh warranty tracker', 'error');
    } finally {
      setExpireLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Instant Warranty Checker
  // -------------------------------------------------------------
  const handleCheckWarranty = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      setSearchError('');
      setSearchResult(null);

      const res = await fetch(`${API}/warranty/check?query=${encodeURIComponent(searchQuery.trim())}`);
      const d = await res.json();

      if (res.ok && d.success) {
        setSearchResult(d);
      } else {
        // Fallback local search if backend DB has no connection
        const q = searchQuery.trim().toLowerCase();
        const foundLocal = DEFAULT_CLAIMS.find(
          (c) => c.serial_code.toLowerCase().includes(q) || c.invoice_no.toLowerCase().includes(q)
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

  // Pre-fill Intake Modal from Search Result
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

  // Pre-fill Return Modal from Search Result
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

  // -------------------------------------------------------------
  // Claims Management Handlers
  // -------------------------------------------------------------
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

  // Submit New Warranty Intake
  const handleSubmitClaim = async (e) => {
    e.preventDefault();
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

  // Submit Swap Replacement S/N
  const handleSaveSwapSerial = async (e) => {
    e.preventDefault();
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

  // -------------------------------------------------------------
  // Product Return Handlers
  // -------------------------------------------------------------
  const handleSubmitReturn = async (e) => {
    e.preventDefault();
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

  // Edit & Delete handlers for Claims & Returns
  const handleOpenEditClaim = (c) => {
    setEditingClaim({ ...c });
  };

  const handleUpdateClaimSubmit = async (e) => {
    e.preventDefault();
    if (!editingClaim) return;
    try {
      const res = await fetch(`${API}/warranty/claims/${editingClaim.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingClaim),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClaims((prev) => prev.map((c) => (c.id === editingClaim.id ? { ...c, ...editingClaim } : c)));
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
      alert('Error deleting claim');
    }
  };

  const handleOpenEditReturn = (r) => {
    setEditingReturn({ ...r });
  };

  const handleUpdateReturnSubmit = async (e) => {
    e.preventDefault();
    if (!editingReturn) return;
    try {
      const res = await fetch(`${API}/warranty/returns/${editingReturn.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingReturn),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReturns((prev) => prev.map((r) => (r.id === editingReturn.id ? { ...r, ...editingReturn } : r)));
        showToast('Return record updated successfully!');
        setEditingReturn(null);
      } else {
        alert(data.message || 'Failed to update return record');
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
        showToast('Return moved to Trash');
        setReturnToDelete(null);
      } else {
        alert(data.message || 'Failed to delete return');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting return');
    }
  };


  // Filtered Claims
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
        if (!matchNo && !matchSn && !matchRep && !matchCust && !matchPhone && !matchProd && !matchInv)
          return false;
      }
      return true;
    });
  }, [claims, claimStatusFilter, claimSearch]);

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 999999,
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem',
            fontWeight: 600,
            borderLeft: '4px solid #10b981',
          }}
        >
          <span>✓</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Consolidated Sleek Header & Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '10px',
          paddingBottom: '8px',
          borderBottom: '1.5px solid #e2e8f0',
        }}
      >
        {/* Left: Compact Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.3rem' }}>🛡️</span>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Warranty & Returns
            </h1>
          </div>
        </div>

        {/* Center: Inline Tabs */}
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: '3px',
            borderRadius: '8px',
            gap: '3px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('claims')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'claims' ? '#0284c7' : 'transparent',
              color: activeTab === 'claims' ? '#ffffff' : '#64748b',
              fontWeight: activeTab === 'claims' ? 700 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Claims & Service</span>
            <span
              style={{
                background: activeTab === 'claims' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                color: activeTab === 'claims' ? '#ffffff' : '#475569',
                padding: '1px 6px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {claims.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('returns')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'returns' ? '#0284c7' : 'transparent',
              color: activeTab === 'returns' ? '#ffffff' : '#64748b',
              fontWeight: activeTab === 'returns' ? 700 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Returns & Exchanges</span>
            <span
              style={{
                background: activeTab === 'returns' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                color: activeTab === 'returns' ? '#ffffff' : '#475569',
                padding: '1px 6px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {returns.length}
            </span>
          </button>
        </div>

        {/* Right: Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsAddClaimOpen(true)}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 1px 3px rgba(2,132,199,0.25)',
            }}
          >
            <span>+</span>
            <span>Receive Item</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddReturnOpen(true)}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '5px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>🔄</span>
            <span>Return / Exchange</span>
          </button>
        </div>
      </div>

      {/* 3. Live Warranty Expiry Tracker (+60 day grace) */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '10px 14px',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>📈</span>
          <div>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.86rem' }}>
              Warranty Expiry Tracker
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
              Live best-warranty expiry = warranty period + 60 days grace
            </div>
          </div>
        </div>

        {expireData ? (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: expireData.summary.expired_count > 0 ? '#fef2f2' : '#f8fafc',
                border: `1px solid ${expireData.summary.expired_count > 0 ? '#fecaca' : '#e2e8f0'}`,
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
              }}
              onClick={() => setShowExpiredList(!showExpiredList)}
              title="Click to view expired warranties"
            >
              <span style={{ fontSize: '1rem' }}>⚠️</span>
              <span>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#7f1d1d', textTransform: 'uppercase' }}>Expired</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#dc2626' }}>{expireData.summary.expired_count}</div>
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: expireData.summary.expiring_count > 0 ? '#fff7ed' : '#f8fafc',
                border: `1px solid ${expireData.summary.expiring_count > 0 ? '#fed7aa' : '#e2e8f0'}`,
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
              }}
              onClick={() => setShowExpiredList(false)}
              title="Warranties expiring within 60 days"
            >
              <span style={{ fontSize: '1rem' }}>⏳</span>
              <span>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9a3412', textTransform: 'uppercase' }}>Expiring Soon</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ea580c' }}>{expireData.summary.expiring_count}</div>
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '6px 12px',
              }}
            >
              <span style={{ fontSize: '1rem' }}>✅</span>
              <span>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Valid</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#16a34a' }}>{expireData.summary.valid_count}</div>
              </span>
            </div>
            <button
              type="button"
              onClick={refreshExpiry}
              style={{
                marginLeft: 'auto',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
              }}
              disabled={expireLoading}
            >
              {expireLoading ? '⟳ Refreshing…' : '⟳ Refresh'}
            </button>
          </>
        ) : expireLoading ? (
          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Loading warranty expiry data…</span>
        ) : (
          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Tracker unavailable</span>
        )}
      </div>

      {/* 3b. Expired / expiring warranty detail list */}
      {expireData && showExpiredList && (expireData.expired.length > 0 || expireData.expiring.length > 0) && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            padding: '10px 14px',
            marginBottom: '10px',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#7f1d1d', marginBottom: '8px' }}>
            {showExpiredList && expireData.expired.length > 0
              ? `⚠️ ${expireData.expired.length} warranty expired, ${expireData.expiring.length} expiring within 60 days`
              : `⏳ ${expireData.expiring.length} warranties expiring within 60 days`}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ color: '#475569', textTransform: 'uppercase', fontSize: '0.68rem', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Invoice</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Product</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Customer</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Serial</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>Expiry (incl. +60 days)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...expireData.expired, ...expireData.expiring].map((e, i) => (
                  <tr key={`${e.serial_code}-${i}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 700, color: '#0284c7' }}>{e.invoice_no}</td>
                    <td style={{ padding: '5px 8px' }}>{e.product_name}</td>
                    <td style={{ padding: '5px 8px' }}>
                      {e.customer_name}
                      {e.customer_phone && e.customer_phone !== 'N/A' && (
                        <span style={{ color: '#94a3b8' }}> ({e.customer_phone})</span>
                      )}
                    </td>
                    <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontSize: '0.72rem' }}>{e.serial_code}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'center' }}>{e.warranty_expiry}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                      {e.days_remaining < 0 ? (
                        <span style={{ color: '#dc2626', fontWeight: 800 }}>
                          Expired {Math.abs(e.days_remaining)}d ago
                        </span>
                      ) : (
                        <span style={{ color: '#ea580c', fontWeight: 800 }}>
                          {e.days_remaining}d left
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Compact KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '10px' }}>
        <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '8px 12px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Active In-Service
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b45309', marginTop: '2px' }}>
            {claims.filter((c) => c.status === 'Received' || c.status === 'Sent to Service').length}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Under repair</div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '8px 12px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Ready for Delivery
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
            {claims.filter((c) => c.status === 'Ready for Delivery').length}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#16a34a' }}>Waiting pickup</div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '8px 12px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Claims Closed
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
            {claims.filter((c) => c.status === 'Delivered').length}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Delivered</div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '8px 12px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Returns & Exchanges
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7c3aed', marginTop: '2px' }}>
            {returns.length}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Processed returns</div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🔍 INSTANT SERIAL & INVOICE WARRANTY CHECKER */}
      {/* ========================================================= */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          padding: '8px 12px',
          marginBottom: '10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <form onSubmit={handleCheckWarranty} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '0.95rem' }}>🔍</span>
            <strong style={{ fontSize: '0.8rem', color: '#0f172a' }}>Check Warranty:</strong>
          </div>
          <input
            type="text"
            placeholder="Scan Barcode / S/N / Invoice (e.g. DH-CAM-99281-A, INV-2026-0042)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '220px',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #0284c7',
              fontSize: '0.82rem',
              outline: 'none',
              fontFamily: 'monospace',
            }}
          />
          <button
            type="submit"
            disabled={searching}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            {searching ? 'Checking...' : 'Check'}
          </button>
          {searchResult && (
            <button
              type="button"
              onClick={() => {
                setSearchResult(null);
                setSearchQuery('');
              }}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '6px 10px',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '0.78rem',
              }}
            >
              Clear
            </button>
          )}

          {/* Quick chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#64748b' }}>
            <span>Try:</span>
            {['DH-CAM-99281-A', 'HK-DVR-44102-X'].map((chip) => (
              <span
                key={chip}
                onClick={() => {
                  setSearchQuery(chip);
                  setTimeout(() => {
                    fetch(`${API}/warranty/check?query=${encodeURIComponent(chip)}`)
                      .then((r) => r.json())
                      .then((d) => {
                        if (d.success) setSearchResult(d);
                      })
                      .catch(console.error);
                  }, 50);
                }}
                style={{
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  background: '#f1f5f9',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                  color: '#0284c7',
                  fontWeight: 600,
                }}
              >
                {chip}
              </span>
            ))}
          </div>
        </form>

        {/* Search Error */}
        {searchError && (
          <div
            style={{
              marginTop: '14px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.84rem',
              fontWeight: 600,
            }}
          >
            ⚠️ {searchError}
          </div>
        )}

        {/* Search Result Card */}
        {searchResult?.data && (
          <div
            style={{
              marginTop: '16px',
              padding: '18px',
              borderRadius: '10px',
              background: searchResult.data.is_customer_warranty_valid ? '#f0fdf4' : '#fff1f2',
              border: searchResult.data.is_customer_warranty_valid ? '1.5px solid #86efac' : '1.5px solid #fda4af',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: '#0f172a',
                      color: '#ffffff',
                      fontFamily: 'monospace',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                    }}
                  >
                    S/N: {searchResult.data.serial_code || 'INVOICE SEARCH'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                    Invoice: <strong style={{ color: '#0f172a' }}>{searchResult.data.invoice_no}</strong>
                  </span>
                  {searchResult.data.sale_date && (
                    <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                      Sold Date: <strong>{new Date(searchResult.data.sale_date).toLocaleDateString()}</strong>
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                  {searchResult.data.product_name}
                </div>

                <div style={{ fontSize: '0.82rem', color: '#334155', display: 'flex', gap: '14px', alignItems: 'center', marginTop: '4px' }}>
                  <span>
                    Customer: <strong>{searchResult.data.customer_name}</strong>
                  </span>
                  <span>
                    Mobile:{' '}
                    <strong style={{ color: '#0284c7' }}>{searchResult.data.customer_phone}</strong>
                  </span>
                  {searchResult.data.customer_phone && searchResult.data.customer_phone !== 'N/A' && (
                    <a
                      href={`https://wa.me/88${searchResult.data.customer_phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        textDecoration: 'none',
                        color: '#16a34a',
                        fontWeight: 700,
                        fontSize: '0.76rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      💬 WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* Warranty Expiry Status */}
              <div style={{ textAlign: 'right' }}>
                {searchResult.data.is_customer_warranty_valid ? (
                  <div
                    style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      display: 'inline-block',
                    }}
                  >
                    ✓ CUSTOMER WARRANTY ACTIVE
                    <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#166534', marginTop: '2px' }}>
                      {searchResult.data.customer_days_remaining} Days Remaining (Valid till{' '}
                      {searchResult.data.customer_warranty_expiry})
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: '#fee2e2',
                      color: '#b91c1c',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      display: 'inline-block',
                    }}
                  >
                    🚫 CUSTOMER WARRANTY EXPIRED
                    <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#991b1b', marginTop: '2px' }}>
                      Expired on {searchResult.data.customer_warranty_expiry || 'N/A'}
                    </div>
                  </div>
                )}

                {/* Vendor Warranty Info */}
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                  🏢 Vendor Warranty:{' '}
                  <strong style={{ color: '#0f172a' }}>
                    {searchResult.data.vendor_warranty_info || 'Standard Warranty'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Quick Actions from Search */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '14px',
                paddingTop: '12px',
                borderTop: '1px dashed #cbd5e1',
              }}
            >
              <button
                type="button"
                onClick={handleIntakeFromSearch}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + Receive this item for Warranty
              </button>
              <button
                type="button"
                onClick={handleReturnFromSearch}
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '7px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🔄 Process Return / Exchange
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: WARRANTY CLAIMS & REPAIR PIPELINE */}
      {/* ========================================================= */}
      {activeTab === 'claims' && (
        <div>
          {/* Filter and Search Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '10px',
            }}
          >
            {/* Status Pills */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {Object.keys(STATUS_CONFIG).map((key) => {
                const isSelected = claimStatusFilter === key;
                const count =
                  key === 'ALL'
                    ? claims.length
                    : claims.filter((c) => c.status === key).length;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setClaimStatusFilter(key)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      border: '1px solid',
                      borderColor: isSelected ? '#0284c7' : '#cbd5e1',
                      background: isSelected ? '#0284c7' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#475569',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {STATUS_CONFIG[key].label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by Token, S/N, Phone, Customer..."
              value={claimSearch}
              onChange={(e) => setClaimSearch(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                minWidth: '220px',
              }}
            />
          </div>

          {/* Claims Table */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#ffffff', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 14px' }}>TOKEN #</th>
                  <th style={{ padding: '12px 14px' }}>PRODUCT & SERIAL</th>
                  <th style={{ padding: '12px 14px' }}>CUSTOMER & PHONE</th>
                  <th style={{ padding: '12px 14px' }}>ISSUE & BACKUP UNIT</th>
                  <th style={{ padding: '12px 14px' }}>STATUS (CHANGE)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                      No warranty claims found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((c, idx) => {
                    const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.Received;
                    return (
                      <tr
                        key={c.id || idx}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        }}
                      >
                        {/* Token # */}
                        <td style={{ padding: '12px 14px' }}>
                          <strong style={{ fontFamily: 'monospace', color: '#0284c7' }}>{c.claim_no}</strong>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {c.received_date || 'Recent'}
                          </div>
                          {c.invoice_no && (
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              Inv: {c.invoice_no}
                            </div>
                          )}
                        </td>

                        {/* Product & S/N */}
                        <td style={{ padding: '12px 14px' }}>
                          <strong style={{ color: '#0f172a', display: 'block', maxWidth: '280px' }}>
                            {c.product_name}
                          </strong>
                          <span
                            style={{
                              display: 'inline-block',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.74rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: '#f1f5f9',
                              color: '#0f172a',
                              marginTop: '3px',
                            }}
                          >
                            S/N: {c.serial_code}
                          </span>
                          {c.replacement_serial_code && (
                            <div
                              style={{
                                fontSize: '0.72rem',
                                color: '#15803d',
                                fontWeight: 700,
                                marginTop: '2px',
                              }}
                            >
                              New S/N: {c.replacement_serial_code}
                            </div>
                          )}
                        </td>

                        {/* Customer */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{c.customer_name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#0284c7' }}>{c.customer_phone}</div>
                        </td>

                        {/* Issue */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ color: '#334155', maxWidth: '260px' }}>{c.issue_description}</div>
                          {c.backup_unit_provided && c.backup_unit_provided !== 'None' && (
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: '#fef3c7',
                                color: '#b45309',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                marginTop: '3px',
                              }}
                            >
                              🏷️ {c.backup_unit_provided}
                            </span>
                          )}
                        </td>

                        {/* Interactive Status Dropdown */}
                        <td style={{ padding: '12px 14px' }}>
                          <select
                            value={c.status}
                            onChange={(e) => handleUpdateClaimStatus(c.id, e.target.value)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              border: '1px solid #cbd5e1',
                              background: cfg.bg,
                              color: cfg.color,
                              cursor: 'pointer',
                            }}
                          >
                            <option value="Received">🟡 Received (দোকানে জমা)</option>
                            <option value="Sent to Service">🔵 Sent to Service (সার্ভিসে পাঠানো)</option>
                            <option value="Ready for Delivery">🟢 Ready for Delivery (প্রস্তুত)</option>
                            <option value="Delivered">⚪ Delivered (ডেলিভারি সম্পন্ন)</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={() => setClaimToPrint(c)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '5px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#0f172a',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              marginRight: '4px',
                            }}
                            title="Print Customer Claim Receipt Slip"
                          >
                            🖨️ Token
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSwapClaimModal(c);
                              setNewReplacementSerial(c.replacement_serial_code || '');
                            }}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '5px',
                              border: '1px solid #86efac',
                              background: '#f0fdf4',
                              color: '#15803d',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              marginRight: '4px',
                            }}
                            title="Record New Replacement S/N from Supplier"
                          >
                            🔄 Swap
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditClaim(c)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '5px',
                              border: '1px solid #93c5fd',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              marginRight: '4px',
                            }}
                            title="Edit Warranty Claim"
                          >
                            ✏️ Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => setClaimToDelete(c)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '5px',
                              border: '1px solid #fca5a5',
                              background: '#fef2f2',
                              color: '#b91c1c',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                            title="Delete Warranty Claim"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PRODUCT RETURNS & EXCHANGES */}
      {/* ========================================================= */}
      {activeTab === 'returns' && (
        <div>
          <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#ffffff', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 14px' }}>RETURN #</th>
                  <th style={{ padding: '12px 14px' }}>INVOICE</th>
                  <th style={{ padding: '12px 14px' }}>PRODUCT & SERIAL</th>
                  <th style={{ padding: '12px 14px' }}>CUSTOMER</th>
                  <th style={{ padding: '12px 14px' }}>TYPE</th>
                  <th style={{ padding: '12px 14px' }}>CONDITION / RESTOCK</th>
                  <th style={{ padding: '12px 14px' }}>REFUND AMOUNT</th>
                  <th style={{ padding: '12px 14px' }}>REASON</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {returns.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                      No product returns recorded yet.
                    </td>
                  </tr>
                ) : (
                  returns.map((r, idx) => (
                    <tr
                      key={r.id || idx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                      }}
                    >
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#7c3aed' }}>
                        {r.return_no}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#475569' }}>
                        {r.invoice_no || 'N/A'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <strong style={{ color: '#0f172a' }}>{r.product_name}</strong>
                        {r.serial_code && (
                          <div style={{ fontFamily: 'monospace', fontSize: '0.74rem', color: '#64748b' }}>
                            S/N: {r.serial_code}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div>{r.customer_name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{r.customer_phone}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            background: r.return_type === 'Exchange' ? '#e0f2fe' : '#fee2e2',
                            color: r.return_type === 'Exchange' ? '#0369a1' : '#b91c1c',
                          }}
                        >
                          {r.return_type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {r.condition === 'Good' ? (
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#15803d' }}>
                            ✓ Good (Restocked)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#dc2626' }}>
                            ⚠️ Damaged (Quarantine)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                        {r.refund_amount > 0 ? `৳ ${r.refund_amount}` : '৳ 0 (Exchange)'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#475569', maxWidth: '240px' }}>
                        {r.return_reason}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditReturn(r)}
                          style={{
                            padding: '5px 8px',
                            borderRadius: '5px',
                            border: '1px solid #93c5fd',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            marginRight: '4px',
                          }}
                          title="Edit Return Record"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setReturnToDelete(r)}
                          style={{
                            padding: '5px 8px',
                            borderRadius: '5px',
                            border: '1px solid #fca5a5',
                            background: '#fef2f2',
                            color: '#b91c1c',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          title="Delete Return Record"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: RECEIVE WARRANTY CLAIM (INTAKE) */}
      {/* ========================================================= */}
      {isAddClaimOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddClaimOpen(false);
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '600px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              + Receive Warranty Item (সার্ভিস ক্লেইম জমা গ্রহণ)
            </h3>
            <form onSubmit={handleSubmitClaim}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Serial Number (S/N) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DH-CAM-99281-A"
                    value={claimForm.serial_code}
                    onChange={(e) => setClaimForm({ ...claimForm, serial_code: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Invoice Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-0042"
                    value={claimForm.invoice_no}
                    onChange={(e) => setClaimForm({ ...claimForm, invoice_no: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Product Name / Model *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dahua 2MP Full-Color Bullet Camera"
                  value={claimForm.product_name}
                  onChange={(e) => setClaimForm({ ...claimForm, product_name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Ahmed"
                    value={claimForm.customer_name}
                    onChange={(e) => setClaimForm({ ...claimForm, customer_name: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Customer Phone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="017XXXXXXXX"
                    value={claimForm.customer_phone}
                    onChange={(e) => setClaimForm({ ...claimForm, customer_phone: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Reported Issue / Defect Description *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="What is wrong with the device? e.g. Night vision LED not working, BNC loose..."
                  value={claimForm.issue_description}
                  onChange={(e) => setClaimForm({ ...claimForm, issue_description: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Temporary Backup Unit Provided?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Backup 2MP Cam or None"
                    value={claimForm.backup_unit_provided}
                    onChange={(e) => setClaimForm({ ...claimForm, backup_unit_provided: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Estimated Ready Date
                  </label>
                  <input
                    type="date"
                    value={claimForm.estimated_delivery_date}
                    onChange={(e) => setClaimForm({ ...claimForm, estimated_delivery_date: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddClaimOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.84rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#ffffff', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Accept & Generate Token Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: PROCESS PRODUCT RETURN / EXCHANGE */}
      {/* ========================================================= */}
      {isAddReturnOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddReturnOpen(false);
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '580px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              🔄 Process Product Return / Exchange (পণ্য ফেরত বা বদল)
            </h3>
            <form onSubmit={handleSubmitReturn}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-0062"
                    value={returnForm.invoice_no}
                    onChange={(e) => setReturnForm({ ...returnForm, invoice_no: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Serial Number (S/N)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TPL-AC1200-5512"
                    value={returnForm.serial_code}
                    onChange={(e) => setReturnForm({ ...returnForm, serial_code: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TP-Link Archer C6 Router"
                  value={returnForm.product_name}
                  onChange={(e) => setReturnForm({ ...returnForm, product_name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Customer Name
                  </label>
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={returnForm.customer_name}
                    onChange={(e) => setReturnForm({ ...returnForm, customer_name: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Return Action *
                  </label>
                  <select
                    value={returnForm.return_type}
                    onChange={(e) => setReturnForm({ ...returnForm, return_type: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  >
                    <option value="Exchange">Exchange (অন্য পণ্য দিয়ে বদল)</option>
                    <option value="Refund">Cash / Digital Refund (টাকা ফেরত)</option>
                    <option value="Store Credit">Store Credit (কাস্টমার লেজারে জমা)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Physical Condition (Stock Impact) *
                  </label>
                  <select
                    value={returnForm.condition}
                    onChange={(e) => setReturnForm({ ...returnForm, condition: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  >
                    <option value="Good">✓ Good / Intact (দোকানের স্টকে যোগ হবে)</option>
                    <option value="Damaged">⚠️ Damaged / Burnt (ড্যামেজ বিনে যাবে)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Refund Amount (৳)
                  </label>
                  <input
                    type="number"
                    placeholder="0 if Exchange"
                    value={returnForm.refund_amount}
                    onChange={(e) => setReturnForm({ ...returnForm, refund_amount: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Return Reason
                </label>
                <textarea
                  rows={2}
                  placeholder="Reason for return or exchange..."
                  value={returnForm.return_reason}
                  onChange={(e) => setReturnForm({ ...returnForm, return_reason: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddReturnOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.84rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#7c3aed', color: '#ffffff', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Confirm Return & Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: PRINTABLE CLAIM TOKEN SLIP */}
      {/* ========================================================= */}
      {claimToPrint && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setClaimToPrint(null);
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            {/* Printable Container */}
            <div id="warranty-token-slip" style={{ border: '2px solid #0f172a', padding: '16px', borderRadius: '8px', background: '#ffffff' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #0f172a', paddingBottom: '10px', marginBottom: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.04em' }}>
                  SHEBA TECHNOLOGY
                </h2>
                <div style={{ fontSize: '0.74rem', color: '#475569' }}>
                  CCTV, IT Security & Computer Solutions
                </div>
                <div style={{ fontSize: '0.72rem', color: '#475569' }}>
                  Mobile: 01711-000000 · Dhaka, Bangladesh
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    background: '#0f172a',
                    color: '#ffffff',
                    padding: '2px 10px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    marginTop: '6px',
                  }}
                >
                  WARRANTY SERVICE TOKEN (গ্রাহক কপি)
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '8px' }}>
                <span>
                  Token #: <strong style={{ fontFamily: 'monospace', color: '#0284c7' }}>{claimToPrint.claim_no}</strong>
                </span>
                <span>
                  Date: <strong>{claimToPrint.received_date || 'Today'}</strong>
                </span>
              </div>

              <div style={{ fontSize: '0.8rem', marginBottom: '8px', borderBottom: '1px dotted #cbd5e1', paddingBottom: '6px' }}>
                <div>
                  Customer: <strong>{claimToPrint.customer_name}</strong>
                </div>
                <div>
                  Phone: <strong>{claimToPrint.customer_phone}</strong>
                </div>
                {claimToPrint.invoice_no && (
                  <div>
                    Invoice Ref: <strong>{claimToPrint.invoice_no}</strong>
                  </div>
                )}
              </div>

              <div style={{ fontSize: '0.8rem', marginBottom: '8px' }}>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{claimToPrint.product_name}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#334155' }}>
                  Serial (S/N): <strong>{claimToPrint.serial_code}</strong>
                </div>
                {claimToPrint.replacement_serial_code && (
                  <div style={{ color: '#15803d', fontWeight: 700, fontSize: '0.74rem' }}>
                    Replaced with New S/N: {claimToPrint.replacement_serial_code}
                  </div>
                )}
              </div>

              <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '0.76rem', marginBottom: '10px' }}>
                <div>
                  <strong>Reported Problem:</strong> {claimToPrint.issue_description}
                </div>
                {claimToPrint.backup_unit_provided && claimToPrint.backup_unit_provided !== 'None' && (
                  <div style={{ color: '#b45309', marginTop: '2px' }}>
                    <strong>Backup Unit:</strong> {claimToPrint.backup_unit_provided}
                  </div>
                )}
                {claimToPrint.estimated_delivery_date && (
                  <div style={{ color: '#0284c7', marginTop: '2px' }}>
                    <strong>Expected Delivery:</strong> {claimToPrint.estimated_delivery_date}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#64748b', borderTop: '1px dashed #0f172a', paddingTop: '8px' }}>
                * পণ্য ডেলিভারি নেওয়ার সময় অবশ্যই এই টোকেন স্লিপটি কাউন্টারে সাথে নিয়ে আসবেন।
              </div>
            </div>

            {/* Print & Close Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setClaimToPrint(null)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.84rem', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#ffffff', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}
              >
                🖨️ Print Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: SWAP REPLACEMENT S/N */}
      {/* ========================================================= */}
      {swapClaimModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSwapClaimModal(null);
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '22px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              🔄 Record New Replacement S/N
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 14px 0' }}>
              কোম্পানি বা ভেন্ডর যদি নষ্ট মালটির বদলে সম্পূর্ণ নতুন ইউনিট রিপ্লেস করে থাকে, তবে নতুন সিরিয়ালটি বসান:
            </p>

            <form onSubmit={handleSaveSwapSerial}>
              <div style={{ marginBottom: '10px', fontSize: '0.82rem' }}>
                Old Serial (S/N):{' '}
                <strong style={{ fontFamily: 'monospace', color: '#ef4444' }}>
                  {swapClaimModal.serial_code}
                </strong>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  New Replacement Serial (S/N) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Scan or type new unit S/N..."
                  value={newReplacementSerial}
                  onChange={(e) => setNewReplacementSerial(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #16a34a', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSwapClaimModal(null)}
                  style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '7px 18px', borderRadius: '6px', border: 'none', background: '#16a34a', color: '#ffffff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save & Mark Ready
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: EDIT WARRANTY CLAIM */}
      {/* ========================================================= */}
      {editingClaim && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingClaim(null);
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              ✏️ Edit Warranty Claim #{editingClaim.claim_no}
            </h3>
            <form onSubmit={handleUpdateClaimSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={editingClaim.customer_name || ''}
                    onChange={(e) => setEditingClaim({ ...editingClaim, customer_name: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Customer Phone *</label>
                  <input
                    type="text"
                    required
                    value={editingClaim.customer_phone || ''}
                    onChange={(e) => setEditingClaim({ ...editingClaim, customer_phone: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Product Name</label>
                <input
                  type="text"
                  value={editingClaim.product_name || ''}
                  onChange={(e) => setEditingClaim({ ...editingClaim, product_name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Serial (S/N)</label>
                  <input
                    type="text"
                    value={editingClaim.serial_code || ''}
                    onChange={(e) => setEditingClaim({ ...editingClaim, serial_code: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Status</label>
                  <select
                    value={editingClaim.status || 'Received'}
                    onChange={(e) => setEditingClaim({ ...editingClaim, status: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="Received">Received</option>
                    <option value="Sent to Service">Sent to Service</option>
                    <option value="Ready for Delivery">Ready for Delivery</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Issue Description</label>
                <textarea
                  rows={2}
                  value={editingClaim.issue_description || ''}
                  onChange={(e) => setEditingClaim({ ...editingClaim, issue_description: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Backup Unit Provided</label>
                  <input
                    type="text"
                    value={editingClaim.backup_unit_provided || ''}
                    onChange={(e) => setEditingClaim({ ...editingClaim, backup_unit_provided: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Est. Delivery Date</label>
                  <input
                    type="date"
                    value={editingClaim.estimated_delivery_date ? editingClaim.estimated_delivery_date.substring(0, 10) : ''}
                    onChange={(e) => setEditingClaim({ ...editingClaim, estimated_delivery_date: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Service Notes</label>
                <textarea
                  rows={2}
                  value={editingClaim.service_notes || ''}
                  onChange={(e) => setEditingClaim({ ...editingClaim, service_notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingClaim(null)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.84rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#ffffff', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: DELETE CLAIM CONFIRMATION */}
      {/* ========================================================= */}
      {claimToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setClaimToDelete(null);
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              Delete Warranty Claim?
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Are you sure you want to delete claim <strong>{claimToDelete.claim_no}</strong> for{' '}
              <strong>{claimToDelete.customer_name}</strong>? It will be moved to the Trash bin.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setClaimToDelete(null)}
                style={{ padding: '9px 18px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteClaim}
                style={{ padding: '9px 20px', borderRadius: '6px', border: 'none', background: '#ef4444', color: '#ffffff', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Delete Claim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: EDIT PRODUCT RETURN */}
      {/* ========================================================= */}
      {editingReturn && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingReturn(null);
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              ✏️ Edit Return Record #{editingReturn.return_no}
            </h3>
            <form onSubmit={handleUpdateReturnSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={editingReturn.customer_name || ''}
                    onChange={(e) => setEditingReturn({ ...editingReturn, customer_name: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Customer Phone *</label>
                  <input
                    type="text"
                    required
                    value={editingReturn.customer_phone || ''}
                    onChange={(e) => setEditingReturn({ ...editingReturn, customer_phone: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Product Name</label>
                <input
                  type="text"
                  value={editingReturn.product_name || ''}
                  onChange={(e) => setEditingReturn({ ...editingReturn, product_name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Serial (S/N)</label>
                  <input
                    type="text"
                    value={editingReturn.serial_code || ''}
                    onChange={(e) => setEditingReturn({ ...editingReturn, serial_code: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Invoice No</label>
                  <input
                    type="text"
                    value={editingReturn.invoice_no || ''}
                    onChange={(e) => setEditingReturn({ ...editingReturn, invoice_no: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Return Type</label>
                  <select
                    value={editingReturn.return_type || 'Refund'}
                    onChange={(e) => setEditingReturn({ ...editingReturn, return_type: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="Refund">Refund</option>
                    <option value="Exchange">Exchange</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Condition</label>
                  <select
                    value={editingReturn.condition || 'Good'}
                    onChange={(e) => setEditingReturn({ ...editingReturn, condition: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="Good">Good (Restocked)</option>
                    <option value="Damaged">Damaged (Quarantine)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Refund Amount (৳)</label>
                <input
                  type="number"
                  value={editingReturn.refund_amount !== undefined ? editingReturn.refund_amount : ''}
                  onChange={(e) => setEditingReturn({ ...editingReturn, refund_amount: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Return Reason</label>
                <textarea
                  rows={2}
                  value={editingReturn.return_reason || ''}
                  onChange={(e) => setEditingReturn({ ...editingReturn, return_reason: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingReturn(null)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.84rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#ffffff', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 8: DELETE RETURN CONFIRMATION */}
      {/* ========================================================= */}
      {returnToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setReturnToDelete(null);
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              Delete Return Record?
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Are you sure you want to delete return <strong>{returnToDelete.return_no}</strong> for{' '}
              <strong>{returnToDelete.customer_name}</strong>? It will be moved to the Trash bin.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setReturnToDelete(null)}
                style={{ padding: '9px 18px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteReturn}
                style={{ padding: '9px 20px', borderRadius: '6px', border: 'none', background: '#ef4444', color: '#ffffff', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Delete Return
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
