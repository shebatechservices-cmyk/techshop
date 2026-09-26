import { useState, useRef } from 'react';
import API from '../../../../services/api';

export function usePurchaseBarcodeScanner({
  items = [],
  setItems,
  orderToEdit = null,
  setError,
  setPopupMsg,
}) {
  const [barcodeInput, setBarcodeInput] = useState({});
  const [barcodeScanErrors, setBarcodeScanErrors] = useState({});

  const barcodeInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  const handleAddBarcode = async (localId, barcodeToAdd = null) => {
    const item = items.find((i) => i.localId === localId);
    if (!item) return;

    const rawBarcode =
      barcodeToAdd !== null ? barcodeToAdd : barcodeInput[localId] || '';
    const code = String(rawBarcode).trim();
    if (!code) return;

    // 1. Check duplicate within current item
    const currentSerials = item.serials || [];
    if (currentSerials.some((s) => s.toLowerCase() === code.toLowerCase())) {
      setBarcodeScanErrors((prev) => ({
        ...prev,
        [localId]: `⚠️ Barcode/Serial "${code}" already added to this product.`,
      }));
      return;
    }

    // 2. Check duplicate across other items in current purchase order
    for (const otherItem of items) {
      if (otherItem.localId !== localId && Array.isArray(otherItem.serials)) {
        if (
          otherItem.serials.some((s) => s.toLowerCase() === code.toLowerCase())
        ) {
          setBarcodeScanErrors((prev) => ({
            ...prev,
            [localId]: `⚠️ Barcode/Serial "${code}" is already assigned to another item in this order.`,
          }));
          return;
        }
      }
    }

    // 3. Check database serial availability
    try {
      const excludePoId = orderToEdit?.id ? `&exclude_po_id=${orderToEdit.id}` : '';
      const checkRes = await fetch(
        `${API}/purchase/check-serial?serial=${encodeURIComponent(code)}${excludePoId}`
      );
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists) {
          const detailMsg =
            checkData.message ||
            `⚠️ Serial/Barcode "${code}" already exists in Inventory.`;
          setBarcodeScanErrors((prev) => ({
            ...prev,
            [localId]: detailMsg,
          }));
          return;
        }
      }
    } catch (err) {
      console.warn('Serial availability verification warning:', err.message);
    }

    // Add barcode and update quantity to match serial count
    const updatedSerials = [...currentSerials, code];
    setItems((current) =>
      current.map((i) => {
        if (i.localId !== localId) return i;
        return {
          ...i,
          serials: updatedSerials,
          quantity: updatedSerials.length,
          barcode: i.barcode || code,
        };
      })
    );

    setBarcodeInput((prev) => ({ ...prev, [localId]: '' }));
    setBarcodeScanErrors((prev) => {
      const next = { ...prev };
      delete next[localId];
      return next;
    });

    if (setError) setError('');
    if (setPopupMsg) setPopupMsg('');
  };

  const handleRemoveBarcode = (localId, serialCode) => {
    setItems((current) =>
      current.map((i) => {
        if (i.localId !== localId) return i;
        const filtered = (i.serials || []).filter(
          (s) => s.toLowerCase() !== serialCode.toLowerCase()
        );
        return {
          ...i,
          serials: filtered,
          quantity: Math.max(1, filtered.length),
        };
      })
    );
  };

  return {
    barcodeInput,
    setBarcodeInput,
    barcodeScanErrors,
    setBarcodeScanErrors,
    barcodeInputRef,
    searchInputRef,
    searchContainerRef,
    handleAddBarcode,
    handleRemoveBarcode,
  };
}
