import { smartFetch } from '../../../../services/api';
import { isProductSerialTracked } from '../../../../utils/productUtils';

export async function performScanLookup({
  event,
  searchQuery,
  products = [],
  filteredProducts = [],
  addProduct,
  setSearchError,
  setSearchQuery,
  setIsSearchOpen,
}) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  const q = searchQuery.trim();
  if (!q) return;
  const lowerQ = q.toLowerCase();

  // 1. Check for exact sub-unit barcode match
  const exactSubUnit = (products || []).find(
    (p) =>
      Number(p.stock || 0) > 0 &&
      p.sub_unit_barcode &&
      p.sub_unit_barcode.toLowerCase() === lowerQ
  );
  if (exactSubUnit) {
    addProduct(exactSubUnit, q, 'sub_unit');
    setSearchError('');
    return;
  }

  // 2. Check for exact primary barcode, SKU, or serial number match
  const exact = (products || []).find(
    (p) =>
      Number(p.stock || 0) > 0 &&
      ((p.barcode && p.barcode.toLowerCase() === lowerQ) ||
        (p.sku && p.sku.toLowerCase() === lowerQ) ||
        (Array.isArray(p.available_serials) &&
          p.available_serials.some((s) => String(s).trim().toLowerCase() === lowerQ)))
  );
  if (exact) {
    addProduct(exact, q, 'base_unit');
    setSearchError('');
    return;
  }

  if (filteredProducts.length > 0) {
    addProduct(filteredProducts[0]);
    setSearchError('');
    return;
  }

  try {
    const res = await smartFetch(`/search/product?q=${encodeURIComponent(q)}`);
    if (res && res.ok) {
      const data = await res.json().catch(() => null);
      const found = data && data.data && data.data[0];
      if (found && Number(found.stock || 0) > 0) {
        const isSub =
          found.sub_unit_barcode &&
          found.sub_unit_barcode.toLowerCase() === lowerQ;
        addProduct(found, q, isSub ? 'sub_unit' : 'base_unit');
        setSearchError('');
        setSearchQuery('');
        setIsSearchOpen(false);
        return;
      }
    }
  } catch (err) {
    console.error('Barcode server lookup failed:', err);
  }

  setSearchError(
    `No product found for "${q}". Check the barcode/SKU or add this product to the catalog first.`
  );
}

export function addBarcodeCandidates({
  localId,
  explicitValue,
  barcodeInput,
  items,
  updateItem,
  setBarcodeInput,
  setBarcodeError,
  setError,
}) {
  const raw = (explicitValue !== undefined ? explicitValue : barcodeInput).trim();
  if (!raw) return;

  const candidates = raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (!candidates.length) return;

  const targetItem = items.find((it) => it.localId === localId);
  if (!targetItem) return;

  const isTracked = isProductSerialTracked(targetItem);
  const availableStock = Number(targetItem.stock || 0);
  const currentSerials = targetItem.serials || [];

  const availableSerialsList = Array.isArray(targetItem.available_serials)
    ? targetItem.available_serials.map((s) => String(s).trim().toLowerCase())
    : null;

  const existingMap = new Map();
  items.forEach((it) => {
    (it.serials || []).forEach((s) => existingMap.set(s.toLowerCase(), it.name));
  });

  const toAdd = [];
  const duplicates = [];
  const notFoundSerials = [];

  candidates.forEach((code) => {
    const lower = code.toLowerCase();

    // RULE 2: Validate against available serials in inventory if serial-tracked
    if (isTracked && availableSerialsList && !availableSerialsList.includes(lower)) {
      notFoundSerials.push(code);
      return;
    }

    if (existingMap.has(lower) || toAdd.some((c) => c.toLowerCase() === lower)) {
      duplicates.push(code);
    } else {
      toAdd.push(code);
      existingMap.set(lower, targetItem.name);
    }
  });

  // If phantom / invalid serial scanned:
  if (notFoundSerials.length > 0) {
    setBarcodeInput('');
    const msg = `Error: Serial "${notFoundSerials.join(', ')}" not found in inventory`;
    setBarcodeError((prev) => ({ ...prev, [localId]: msg }));
    if (setError) setError(msg);
    return;
  }

  if (duplicates.length > 0) {
    setBarcodeInput('');
    const msg = `Duplicate barcode rejected: ${duplicates.join(', ')}`;
    setBarcodeError((prev) => ({ ...prev, [localId]: msg }));
    if (setError) setError(msg);
    return;
  }

  // RULE 3: Ensure total QTY cannot exceed available stock count
  if (currentSerials.length + toAdd.length > availableStock) {
    setBarcodeInput('');
    const msg = `Cannot exceed available stock (${availableStock}) for "${targetItem.name}".`;
    setBarcodeError((prev) => ({ ...prev, [localId]: msg }));
    if (setError) setError(msg);
    return;
  }

  if (toAdd.length > 0) {
    const newSerials = [...currentSerials, ...toAdd];
    const newQty = isTracked
      ? newSerials.length
      : Math.min(availableStock, Math.max(Number(targetItem.quantity || 1), newSerials.length));
    updateItem(localId, {
      serials: newSerials,
      quantity: newQty,
    });
    setBarcodeInput('');
    setBarcodeError((prev) => ({ ...prev, [localId]: '' }));
  }
}

export function removeBarcodeFromItem({ localId, code, items, updateItem }) {
  const targetItem = items.find((it) => it.localId === localId);
  if (!targetItem) return;
  const newSerials = (targetItem.serials || []).filter((s) => s !== code);
  const newQty = targetItem.is_serial_tracked
    ? newSerials.length
    : Math.max(
        1,
        (targetItem.serials || []).length > 1
          ? Number(targetItem.quantity || 1)
          : 1
      );
  updateItem(localId, {
    serials: newSerials,
    quantity: newQty,
  });
}
