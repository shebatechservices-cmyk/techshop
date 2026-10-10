import { useState, useEffect } from 'react';
import API from '../../../services/api';
import { useWarrantyExpiry } from './useWarrantyExpiry';
import { useWarrantySearch } from './useWarrantySearch';
import { useWarrantyClaims } from './useWarrantyClaims';
import { useWarrantyReturns } from './useWarrantyReturns';

export const STATUS_CONFIG = {
  ALL: { label: 'All Claims', color: '#475569', bg: '#f1f5f9' },
  Received: { label: '🟡 Received (In Store)', color: '#b45309', bg: '#fef3c7' },
  'Sent to Service': { label: '🔵 Sent to Service Center', color: '#0369a1', bg: '#e0f2fe' },
  'Ready for Delivery': { label: '🟢 Ready for Delivery', color: '#15803d', bg: '#dcfce7' },
  Delivered: { label: '⚪ Delivered to Customer', color: '#475569', bg: '#f8fafc' },
};

export default function useWarrantyManager() {
  const [activeTab, setActiveTab] = useState('claims'); // 'claims' | 'returns'
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type === 'error' ? 'error' : 'success');
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Sub-hooks
  const expiry = useWarrantyExpiry({ showToast });
  const claimsOps = useWarrantyClaims({ showToast });
  const returnsOps = useWarrantyReturns({ showToast });
  const searchOps = useWarrantySearch({
    claims: claimsOps.claims,
    setClaimForm: claimsOps.setClaimForm,
    setIsAddClaimOpen: claimsOps.setIsAddClaimOpen,
    setReturnForm: returnsOps.setReturnForm,
    setIsAddReturnOpen: returnsOps.setIsAddReturnOpen,
  });

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
        if (Array.isArray(d.data)) claimsOps.setClaims(d.data);
      }
      if (returnsRes && returnsRes.ok) {
        const d = await returnsRes.json();
        if (Array.isArray(d.data)) returnsOps.setReturns(d.data);
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

  return {
    activeTab,
    setActiveTab,
    productsList,
    setProductsList,
    loading,
    setLoading,
    toastMsg,
    toastType,
    showToast,
    loadData,

    // Expiry Hook
    expireData: expiry.expireData,
    setExpireData: expiry.setExpireData,
    expireLoading: expiry.expireLoading,
    showExpiredList: expiry.showExpiredList,
    setShowExpiredList: expiry.setShowExpiredList,
    refreshExpiry: expiry.refreshExpiry,

    // Search Hook
    searchQuery: searchOps.searchQuery,
    setSearchQuery: searchOps.setSearchQuery,
    searching: searchOps.searching,
    searchResult: searchOps.searchResult,
    searchError: searchOps.searchError,
    handleCheckWarranty: searchOps.handleCheckWarranty,
    handleIntakeFromSearch: searchOps.handleIntakeFromSearch,
    handleReturnFromSearch: searchOps.handleReturnFromSearch,

    // Claims Hook
    claims: claimsOps.claims,
    setClaims: claimsOps.setClaims,
    claimStatusFilter: claimsOps.claimStatusFilter,
    setClaimStatusFilter: claimsOps.setClaimStatusFilter,
    claimSearch: claimsOps.claimSearch,
    setClaimSearch: claimsOps.setClaimSearch,
    isAddClaimOpen: claimsOps.isAddClaimOpen,
    setIsAddClaimOpen: claimsOps.setIsAddClaimOpen,
    claimToPrint: claimsOps.claimToPrint,
    setClaimToPrint: claimsOps.setClaimToPrint,
    swapClaimModal: claimsOps.swapClaimModal,
    setSwapClaimModal: claimsOps.setSwapClaimModal,
    newReplacementSerial: claimsOps.newReplacementSerial,
    setNewReplacementSerial: claimsOps.setNewReplacementSerial,
    editingClaim: claimsOps.editingClaim,
    setEditingClaim: claimsOps.setEditingClaim,
    claimToDelete: claimsOps.claimToDelete,
    setClaimToDelete: claimsOps.setClaimToDelete,
    claimForm: claimsOps.claimForm,
    setClaimForm: claimsOps.setClaimForm,
    handleUpdateClaimStatus: claimsOps.handleUpdateClaimStatus,
    handleSubmitClaim: claimsOps.handleSubmitClaim,
    handleSaveSwapSerial: claimsOps.handleSaveSwapSerial,
    handleOpenEditClaim: claimsOps.handleOpenEditClaim,
    handleUpdateClaimSubmit: claimsOps.handleUpdateClaimSubmit,
    handleConfirmDeleteClaim: claimsOps.handleConfirmDeleteClaim,
    filteredClaims: claimsOps.filteredClaims,

    // Returns Hook
    returns: returnsOps.returns,
    setReturns: returnsOps.setReturns,
    isAddReturnOpen: returnsOps.isAddReturnOpen,
    setIsAddReturnOpen: returnsOps.setIsAddReturnOpen,
    editingReturn: returnsOps.editingReturn,
    setEditingReturn: returnsOps.setEditingReturn,
    returnToDelete: returnsOps.returnToDelete,
    setReturnToDelete: returnsOps.setReturnToDelete,
    returnForm: returnsOps.returnForm,
    setReturnForm: returnsOps.setReturnForm,
    handleSubmitReturn: returnsOps.handleSubmitReturn,
    handleOpenEditReturn: returnsOps.handleOpenEditReturn,
    handleUpdateReturnSubmit: returnsOps.handleUpdateReturnSubmit,
    handleConfirmDeleteReturn: returnsOps.handleConfirmDeleteReturn,
  };
}
