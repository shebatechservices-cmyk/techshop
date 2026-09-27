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

  const handleAddBarcode = (localId, barcodeToAdd = null) => {
    const rawBarcode =
      barcodeToAdd !== null
        ? barcodeToAdd
        : typeof barcodeInput === 'object' && barcodeInput !== null
        ? barcodeInput[localId] || ''
        : barcodeInput || '';
    const code = String(rawBarcode).trim();
    if (!code) return;

    // 1. Check duplicate across other items in current purchase order
    for (const otherItem of items) {
      if (otherItem.localId !== localId) {
        const otherList = Array.isArray(otherItem.barcodes)
          ? otherItem.barcodes
          : Array.isArray(otherItem.serials)
          ? otherItem.serials
          : [];
        if (otherList.some((s) => s.toLowerCase() === code.toLowerCase())) {
          setBarcodeScanErrors((prev) => ({
            ...prev,
            [localId]: `⚠️ Barcode/Serial "${code}" is already assigned to another item in this order.`,
          }));
          return;
        }
      }
    }

    // RULE 2 & 3: Immutable state update & auto-increment quantity
    let duplicateFound = false;
    setItems((current) =>
      current.map((i) => {
        if (i.localId !== localId) return i;

        const currentList = Array.isArray(i.barcodes)
          ? i.barcodes
          : Array.isArray(i.serials)
          ? i.serials
          : [];

        if (currentList.some((s) => s.toLowerCase() === code.toLowerCase())) {
          duplicateFound = true;
          return i;
        }

        const nextBarcodes = [...currentList, code];
        const currentQty = Number(i.quantity) || 0;
        const newQty = i.is_serial_tracked
          ? nextBarcodes.length
          : Math.max(currentQty + 1, nextBarcodes.length);

        return {
          ...i,
          barcodes: nextBarcodes,
          serials: nextBarcodes,
          quantity: newQty,
          barcode: i.barcode || code,
        };
      })
    );

    if (duplicateFound) {
      setBarcodeScanErrors((prev) => ({
        ...prev,
        [localId]: `⚠️ Barcode/Serial "${code}" already added to this product.`,
      }));
      return;
    }

    // Explicitly reset barcode input state and clear errors
    setBarcodeInput((prev) => {
      if (typeof prev === 'object' && prev !== null) {
        return { ...prev, [localId]: '' };
      }
      return '';
    });
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
        const currentList = Array.isArray(i.barcodes)
          ? i.barcodes
          : Array.isArray(i.serials)
          ? i.serials
          : [];
        const filtered = currentList.filter(
          (s) => s.toLowerCase() !== serialCode.toLowerCase()
        );
        const newQty = i.is_serial_tracked
          ? filtered.length
          : Math.max(1, (Number(i.quantity) || 1) - 1);

        return {
          ...i,
          barcodes: filtered,
          serials: filtered,
          quantity: newQty,
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
