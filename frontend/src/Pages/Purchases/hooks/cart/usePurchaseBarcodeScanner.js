import { useState, useRef, useCallback } from 'react';
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

  const handleAddBarcode = useCallback((localId, barcodeToAdd = null) => {
    const rawBarcode =
      barcodeToAdd !== null
        ? barcodeToAdd
        : typeof barcodeInput === 'object' && barcodeInput !== null
        ? barcodeInput[localId] || ''
        : barcodeInput || '';
    const code = String(rawBarcode).toUpperCase().trim();
    if (!code) return;

    // 1. Check duplicate across other items in current purchase order
    for (const otherItem of items) {
      if (otherItem.localId !== localId) {
        const otherList = Array.isArray(otherItem.barcodes)
          ? otherItem.barcodes
          : Array.isArray(otherItem.serials)
          ? otherItem.serials
          : [];
        if (
          otherList.some(
            (s) => String(s).toUpperCase().trim() === code
          )
        ) {
          setBarcodeScanErrors((prev) => ({
            ...prev,
            [localId]: `⚠️ Barcode/Serial "${code}" is already assigned to another item in this order.`,
          }));
          return;
        }
      }
    }

    // 2. Reject item codes / material part numbers with dots (e.g. Dahua/Hikvision 1.0.01.12.26599)
    if (code.includes('.') || /^(\d+\.)+\d+$/.test(code)) {
      setBarcodeScanErrors((prev) => ({
        ...prev,
        [localId]: `⚠️ "${code}" কোনো সিরিয়াল নম্বর নয়! এটি প্রোডাক্টের পার্ট নম্বর বা আইটেম কোড (Item Code)। অনুগ্রহ করে আসল S/N বারকোড স্ক্যান করুন।`,
      }));
      return;
    }

    // 3. Check pattern / length consistency with first scanned serial (Reference Serial)
    const targetItem = items.find((i) => i.localId === localId);
    if (targetItem) {
      const existingList = Array.isArray(targetItem.barcodes)
        ? targetItem.barcodes
        : Array.isArray(targetItem.serials)
        ? targetItem.serials
        : [];
      if (existingList.length > 0) {
        const refSerial = String(existingList[0]).trim();
        if (code.length !== refSerial.length) {
          setBarcodeScanErrors((prev) => ({
            ...prev,
            [localId]: `⚠️ Invalid length! Expected ${refSerial.length} characters (Ref: "${refSerial}"), but got ${code.length}.`,
          }));
          return;
        }

        const isRefAlphanumeric = /^[A-Z0-9]+$/i.test(refSerial);
        const isCodeAlphanumeric = /^[A-Z0-9]+$/i.test(code);
        if (isRefAlphanumeric && !isCodeAlphanumeric) {
          setBarcodeScanErrors((prev) => ({
            ...prev,
            [localId]: `⚠️ প্যাটার্ন অমিল! ১ম রেফারেন্স সিরিয়াল "${refSerial}" অ্যালফানিউমেরিক, কিন্তু "${code}" এ বিশেষ চিহ্ন রয়েছে।`,
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

        if (
          currentList.some(
            (s) => String(s).toUpperCase().trim() === code
          )
        ) {
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
  }, [barcodeInput, items, setError, setItems, setPopupMsg]);

  const handleRemoveBarcode = useCallback((localId, serialCode) => {
    const targetCode = String(serialCode).toUpperCase().trim();
    setItems((current) =>
      current.map((i) => {
        if (i.localId !== localId) return i;
        const currentList = Array.isArray(i.barcodes)
          ? i.barcodes
          : Array.isArray(i.serials)
          ? i.serials
          : [];
        const filtered = currentList.filter(
          (s) => String(s).toUpperCase().trim() !== targetCode
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
  }, [setItems]);

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
