import { useState } from 'react';

export function usePurchaseSerials() {
  const [barcodeScanErrors, setBarcodeScanErrors] = useState({});

  const setItemBarcodeError = (localId, errorMsg) => {
    setBarcodeScanErrors((prev) => ({ ...prev, [localId]: errorMsg }));
  };

  const clearItemBarcodeError = (localId) => {
    setBarcodeScanErrors((prev) => {
      const next = { ...prev };
      delete next[localId];
      return next;
    });
  };

  return {
    barcodeScanErrors,
    setBarcodeScanErrors,
    setItemBarcodeError,
    clearItemBarcodeError,
  };
}
