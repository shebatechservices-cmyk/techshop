import { useState, useEffect } from 'react';

export default function useInventorySelection({ paginatedProducts = [] }) {
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [revealedCostIds, setRevealedCostIds] = useState(new Set());
  const [showCostValuation, setShowCostValuation] = useState(false);
  const [openActionId, setOpenActionId] = useState(null);

  const toggleCostVisibility = (id) => {
    setRevealedCostIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Click outside to close action menu
  useEffect(() => {
    const handleDocClick = () => setOpenActionId(null);
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  // Checkbox selection
  const isAllSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedProductIds.includes(p.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = paginatedProducts.map((p) => p.id);
      setSelectedProductIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedProducts.map((p) => p.id);
      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return {
    selectedProductIds,
    setSelectedProductIds,
    revealedCostIds,
    setRevealedCostIds,
    showCostValuation,
    setShowCostValuation,
    openActionId,
    setOpenActionId,
    toggleCostVisibility,
    isAllSelected,
    toggleSelectAll,
    toggleSelectRow,
  };
}
