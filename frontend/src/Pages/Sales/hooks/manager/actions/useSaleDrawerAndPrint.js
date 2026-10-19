import { useState, useCallback } from 'react';
import API from '../../../../../services/api';

export function useSaleDrawerAndPrint({ showToast }) {
  const [actionLoading, setActionLoading] = useState({});

  // Quick-view Drawer state
  const [selectedSaleForDrawer, setSelectedSaleForDrawer] = useState(null);
  const [isSaleDrawerOpen, setIsSaleDrawerOpen] = useState(false);
  const [isSaleDrawerLoading, setIsSaleDrawerLoading] = useState(false);

  // Print state
  const [printData, setPrintData] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

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
    printData,
    setPrintData,
    isPrintOpen,
    setIsPrintOpen,
    handleOpenPrintSale,
  };
}
