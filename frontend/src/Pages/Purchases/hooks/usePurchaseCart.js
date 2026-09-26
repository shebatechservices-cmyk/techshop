import { useEffect, useMemo, useState, useRef } from 'react';
import API_BASE from '../../../services/api';
import {
  fullCatalogName,
  productLabel,
  isProductSerialTracked,
  isProductWarrantyRequired,
} from '../../../utils/productUtils';
import {
  PURCHASE_DRAFT_KEY,
  saveDraft,
  loadDraft,
  clearDraft,
} from '../../../utils/draftRecovery';

export {
  fullCatalogName,
  productLabel,
  isProductSerialTracked,
  isProductWarrantyRequired,
};

export const PURCHASE_API = `${API_BASE}/purchase`;

export const money = (value) => Number.parseFloat(value || 0) || 0;

export const taka = (value) =>
  `৳${money(value).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const newTender = (defaultAmount = 0, isAccepted = false) => ({
  id: `${Date.now()}-${Math.random()}`,
  method: 'Cash',
  sub_option: '',
  transaction_id: '',
  receiver_name: '',
  amount: defaultAmount,
  isAccepted,
});

export const today = () => new Date().toISOString().slice(0, 10);

export const EXTRA_COST_CATEGORIES = [
  'Transportation & Logistics',
  'Courier & Parcel Charges',
  'Demurrage / Port / Warehouse Fee',
  'Loading & Labor',
  'Packaging & Handling',
  'Customs & Clearance',
  'Other Overhead',
];

export function computeFinalSale(item) {
  if (item.final_sale_manual && money(item.final_sale_price) > 0)
    return money(item.final_sale_price);
  const cost = money(item.cost_price);
  const margin = money(item.margin_value);
  if (cost <= 0) return 0;
  if (item.margin_type === 'amount') return Number((cost + margin).toFixed(2));
  return Number((cost + (cost * margin) / 100).toFixed(2));
}

export function getItemMissingFields(item) {
  if (!item) return ['Cost Price', 'Sale Price', 'Margin', 'Quantity', 'Warranty'];
  const missing = [];

  const cost = Number(item.cost_price);
  if (
    item.cost_price === '' ||
    item.cost_price === null ||
    item.cost_price === undefined ||
    isNaN(cost) ||
    cost <= 0
  ) {
    missing.push('Cost Price');
  }

  const sale = Number(
    item.sale_price !== '' && item.sale_price !== undefined
      ? item.sale_price
      : item.final_sale_price
  );
  if (
    (item.sale_price === '' && item.final_sale_price === '') ||
    item.sale_price === null ||
    item.sale_price === undefined ||
    isNaN(sale) ||
    sale <= 0
  ) {
    missing.push('Sale Price');
  }

  const margin = Number(item.margin_value);
  if (
    item.margin_value === '' ||
    item.margin_value === null ||
    item.margin_value === undefined ||
    isNaN(margin)
  ) {
    missing.push('Margin');
  }

  const qty = Number(item.quantity);
  if (
    item.quantity === '' ||
    item.quantity === null ||
    item.quantity === undefined ||
    isNaN(qty) ||
    qty <= 0
  ) {
    missing.push('Quantity');
  }

  return missing;
}

export function newLineItem(product) {
  // Automatically populate last purchase price if previously purchased
  const cost = Number(
    product.last_purchase_price || product.purchase_price || product.cost_price || 0
  );
  const sale = Number(product.selling_price || product.sale_price || 0);

  // Margin defaults to percentage (%)
  let marginVal =
    product.last_margin_value !== undefined && product.last_margin_value !== null
      ? String(product.last_margin_value)
      : '';

  if (!marginVal && cost > 0 && sale > 0 && sale >= cost) {
    marginVal = (((sale - cost) / cost) * 100).toFixed(2);
    if (marginVal.endsWith('.00')) marginVal = marginVal.slice(0, -3);
  } else if (!marginVal) {
    marginVal = '15'; // default 15% margin
  }

  let finalSale = sale;
  if (cost > 0 && Number(marginVal) >= 0) {
    const m = Number(marginVal);
    finalSale = Number((cost + (cost * m) / 100).toFixed(2));
  }

  const warranty =
    product.warranty_months !== undefined &&
    product.warranty_months !== null &&
    product.warranty_months !== ''
      ? Number(product.warranty_months)
      : 0;

  const supplierWarranty =
    product.supplier_warranty_months !== undefined &&
    product.supplier_warranty_months !== null &&
    product.supplier_warranty_months !== ''
      ? Number(product.supplier_warranty_months)
      : warranty || 0;

  const isTracked = isProductSerialTracked(product);
  const isWarrantyReq = isProductWarrantyRequired(product);
  const fullName = fullCatalogName(product);

  return {
    localId: `${Date.now()}-${product.id}-${Math.floor(Math.random() * 1000)}`,
    product_id: product.id,
    name: fullName,
    full_name: fullName,
    brand_name: product.brand_name || '',
    category_name: product.category_name || '',
    sku: product.sku || '',
    barcode: product.barcode || '',
    quantity: isTracked ? 0 : 1,
    cost_price: cost > 0 ? cost : '',
    sale_price: finalSale > 0 ? finalSale : '',
    margin_type: 'percent', // Defaults strictly to percentage!
    margin_value: marginVal,
    previous_margin: marginVal,
    previous_cost: cost > 0 ? cost : null,
    final_sale_price: finalSale > 0 ? finalSale : '',
    final_sale_manual: false,
    expected_date: today(),
    warranty_months: warranty ? warranty : 0,
    customer_warranty_months: warranty ? warranty : 0,
    supplier_warranty_months: supplierWarranty ? supplierWarranty : warranty || 0,
    is_warranty_required: isWarrantyReq,
    isWarrantyRequired: isWarrantyReq,
    has_serials: isTracked,
    is_serial_tracked: isTracked,
    isSerialRequired: isTracked,
    is_serial_required: isTracked,
    tracks_serial: isTracked,
    serials: [],
  };
}

export function usePurchaseCart(options = {}) {
  const {
    isOpen = true,
    products = [],
    initialProducts = products,
    suppliers: externalSuppliers,
    orderToEdit = null,
    newlyCreatedSupplier = null,
    onClose = () => {},
    onSaved = () => {},
    onOrderSaved = () => {},
  } = options;

  const [productList, setProductList] = useState(
    Array.isArray(initialProducts) ? initialProducts : []
  );
  const [suppliers, setSuppliers] = useState(
    Array.isArray(externalSuppliers) ? externalSuppliers : []
  );
  const [accounts, setAccounts] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [summary, setSummary] = useState(null);
  const [query, setQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const [reference, setReference] = useState('');
  const [hasExtraCost, setHasExtraCost] = useState(false);
  const [extraCost, setExtraCost] = useState('');
  const [extraCostCategory, setExtraCostCategory] = useState(EXTRA_COST_CATEGORIES[0]);
  const [extraCostNotes, setExtraCostNotes] = useState('');
  const [discount, setDiscount] = useState(0);

  // Tenders State:
  // tenders: array of confirmed payments (starts empty [] so skipping 'Add' marks as Due)
  const [tenders, setTenders] = useState([]);
  // paymentConfirmed: mirrors sale-invoice "✓ Payment Added" confirm before save
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const [barcodeScanErrors, setBarcodeScanErrors] = useState({});
  const [supplierSearch, setSupplierSearch] = useState('');
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const supplierSelectRef = useRef(null);

  const [printOrder, setPrintOrder] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isPrintPreviewOnly, setIsPrintPreviewOnly] = useState(false);
  const [recoveredDraft, setRecoveredDraft] = useState(null);

  // Inline Modal States
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [previewOrderId, setPreviewOrderId] = useState(null);
  const [previewOrderData, setPreviewOrderData] = useState(null);
  const [isLedgerPreviewOpen, setIsLedgerPreviewOpen] = useState(false);

  const [error, setError] = useState('');
  const [popupMsg, setPopupMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Check for existing saved draft on open
  useEffect(() => {
    if (isOpen && !orderToEdit) {
      const draft = loadDraft(PURCHASE_DRAFT_KEY);
      if (draft && draft.data && (draft.itemCount > 0 || draft.data.supplierId)) {
        setRecoveredDraft(draft);
      } else {
        setRecoveredDraft(null);
      }
    } else {
      setRecoveredDraft(null);
    }
  }, [isOpen, orderToEdit]);

  // Real-Time Auto-Save Purchase Draft with 300ms debounce
  useEffect(() => {
    if (!isOpen || orderToEdit) return;

    if (recoveredDraft && items.length === 0 && !supplierId) return;

    const timer = setTimeout(() => {
      saveDraft(PURCHASE_DRAFT_KEY, {
        supplierId,
        reference,
        hasExtraCost,
        extraCost,
        extraCostCategory,
        extraCostNotes,
        discount,
        tenders,
        items,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [
    isOpen,
    orderToEdit,
    recoveredDraft,
    supplierId,
    reference,
    hasExtraCost,
    extraCost,
    extraCostCategory,
    extraCostNotes,
    discount,
    tenders,
    items,
  ]);

  const handleRestoreDraft = () => {
    if (!recoveredDraft || !recoveredDraft.data) return;
    const d = recoveredDraft.data;
    if (d.supplierId) setSupplierId(String(d.supplierId));
    if (d.reference) setReference(d.reference);
    if (d.hasExtraCost !== undefined) setHasExtraCost(Boolean(d.hasExtraCost));
    if (d.extraCost) setExtraCost(String(d.extraCost));
    if (d.extraCostCategory) setExtraCostCategory(d.extraCostCategory);
    if (d.extraCostNotes) setExtraCostNotes(d.extraCostNotes);
    if (d.discount !== undefined) setDiscount(Number(d.discount));
    if (Array.isArray(d.tenders) && d.tenders.length > 0) setTenders(d.tenders);
    if (Array.isArray(d.items) && d.items.length > 0) {
      setItems(d.items);
      setExpandedId(d.items[0]?.localId || null);
    }

    setRecoveredDraft(null);
  };

  const handleDiscardDraft = () => {
    clearDraft(PURCHASE_DRAFT_KEY);
    setRecoveredDraft(null);
  };

  useEffect(() => {
    if (Array.isArray(externalSuppliers) && externalSuppliers.length > 0) {
      setSuppliers(externalSuppliers);
    }
  }, [externalSuppliers]);

  // Prepopulate if editing existing purchase order
  useEffect(() => {
    if (orderToEdit) {
      if (orderToEdit.supplier_id) setSupplierId(String(orderToEdit.supplier_id));
      if (orderToEdit.transaction_reference)
        setReference(orderToEdit.transaction_reference);
      if (Number(orderToEdit.extra_cost || 0) > 0) setHasExtraCost(true);
      if (orderToEdit.extra_cost) setExtraCost(String(orderToEdit.extra_cost));
      if (orderToEdit.extra_cost_category)
        setExtraCostCategory(orderToEdit.extra_cost_category);
      if (orderToEdit.extra_cost_notes) setExtraCostNotes(orderToEdit.extra_cost_notes);

      if (Array.isArray(orderToEdit.items)) {
        const loaded = orderToEdit.items.map((it) => {
          const rawWarranty = it.warranty_months;
          let cleanWarranty = 0;
          if (typeof rawWarranty === 'number' && !isNaN(rawWarranty)) {
            cleanWarranty = Math.round(rawWarranty);
          } else if (rawWarranty) {
            cleanWarranty =
              parseInt(String(rawWarranty).replace(/[^0-9]/g, ''), 10) || 0;
          }
          const serials = Array.isArray(it.serials) ? it.serials : [];
          const prodInList = (productList || []).find((p) => p.id === it.product_id);
          const isTracked =
            isProductSerialTracked(prodInList) || isProductSerialTracked(it);
          const isWarrantyReq =
            isProductWarrantyRequired(prodInList) || isProductWarrantyRequired(it);
          const fullName = fullCatalogName(prodInList || it);
          return {
            id: it.id,
            localId: `edit-${it.id || it.product_id}-${Date.now()}-${Math.random()}`,
            product_id: it.product_id,
            name: fullName,
            full_name: fullName,
            brand_name: it.brand_name || (prodInList && prodInList.brand_name) || '',
            category_name:
              it.category_name || (prodInList && prodInList.category_name) || '',
            sku: it.sku || (prodInList && prodInList.sku) || '',
            barcode: it.barcode || (prodInList && prodInList.barcode) || '',
            quantity: isTracked
              ? serials.length > 0
                ? serials.length
                : Number(it.quantity || 0)
              : Number(it.quantity || 1),
            cost_price: it.cost_price || '',
            sale_price: it.sale_price || '',
            margin_type: it.margin_type || 'percent',
            margin_value: it.margin_value || 10,
            previous_margin: it.margin_value || 10,
            previous_cost: it.cost_price || null,
            final_sale_price: it.final_sale_price || it.sale_price || '',
            expected_date: it.expected_date ? it.expected_date.split('T')[0] : today(),
            warranty_months: cleanWarranty,
            customer_warranty_months: cleanWarranty,
            supplier_warranty_months: it.supplier_warranty_months
              ? Number(it.supplier_warranty_months)
              : cleanWarranty,
            is_warranty_required: isWarrantyReq,
            isWarrantyRequired: isWarrantyReq,
            has_serials: isTracked,
            is_serial_tracked: isTracked,
            isSerialRequired: isTracked,
            is_serial_required: isTracked,
            tracks_serial: isTracked,
            serials,
            has_sales: Boolean(it.has_sales),
          };
        });
        setItems(loaded);
      }

      if (orderToEdit.discount !== undefined && orderToEdit.discount !== null) {
        setDiscount(money(orderToEdit.discount));
      }

      if (Array.isArray(orderToEdit.payments)) {
        setTenders(
          orderToEdit.payments.map((p, i) => ({
            id: p.id || `edit-pay-${i}`,
            method: p.payment_method || 'Cash',
            sub_option: p.sub_option || '',
            amount: p.amount || 0,
            receiver_name: p.receiver_name || '',
            transaction_id: p.transaction_id || '',
            isAccepted: true,
          }))
        );
        setPaymentConfirmed(true);
      } else {
        setPaymentConfirmed(false);
      }
    }
    if (newlyCreatedSupplier && newlyCreatedSupplier.id) {
      setSuppliers((prev) => {
        const found = prev.some((s) => s.id === newlyCreatedSupplier.id);
        if (found) return prev;
        return [...prev, newlyCreatedSupplier];
      });
      setSupplierId(String(newlyCreatedSupplier.id));
    }
  }, [orderToEdit, newlyCreatedSupplier]);

  useEffect(() => {
    const fetchMasterProducts = async () => {
      try {
        const res = await fetch(`${API_BASE}/master/products`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setProductList(list);
            return;
          }
        }
      } catch (_) {}
      try {
        const res = await fetch(`${API_BASE}/products`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.data || [];
          if (Array.isArray(list) && list.length > 0) {
            setProductList(list);
          }
        }
      } catch (_) {}
    };

    if (Array.isArray(initialProducts) && initialProducts.length > 0) {
      setProductList(initialProducts);
    }
    fetchMasterProducts();
  }, [initialProducts]);

  useEffect(() => {
    const load = async () => {
      const [supplierData, accountData] = await Promise.all([
        fetch(`${PURCHASE_API}/suppliers`).then((res) => res.json()).catch(() => []),
        fetch(`${PURCHASE_API}/accounts`).then((res) => res.json()).catch(() => []),
      ]);
      const supList = Array.isArray(supplierData) ? supplierData : [];
      setSuppliers(supList);
      setAccounts(Array.isArray(accountData) ? accountData : []);
    };
    load().catch(() => setError('Failed to load purchase data'));
  }, []);

  // Load user-created payment accounts (cash drawers / banks / MFS) from backend
  const [walletAccounts, setWalletAccounts] = useState([]);
  const accountLabel = (a) =>
    a.name + (a.account_number ? ` (${a.account_number})` : '');
  const cashAccounts = useMemo(
    () =>
      (walletAccounts || [])
        .filter((a) =>
          ['cash', 'drawer'].includes(String(a.account_type || '').toLowerCase())
        )
        .map(accountLabel),
    [walletAccounts]
  );
  const bankAccounts = useMemo(
    () =>
      (walletAccounts || [])
        .filter((a) => String(a.account_type || '').toLowerCase() === 'bank')
        .map(accountLabel),
    [walletAccounts]
  );
  const mfsAccounts = useMemo(
    () =>
      (walletAccounts || [])
        .filter(
          (a) =>
            !['cash', 'drawer', 'bank', 'wallet'].includes(
              String(a.account_type || '').toLowerCase()
            )
        )
        .map(accountLabel),
    [walletAccounts]
  );

  // Map a displayed sub_option label back to its payment account (id + balance)
  const accountByLabel = useMemo(() => {
    const m = {};
    (walletAccounts || []).forEach((a) => {
      m[accountLabel(a)] = a;
      m[a.name] = a;
    });
    return m;
  }, [walletAccounts]);

  const accountLabelToId = (label) =>
    accountByLabel[label] ? Number(accountByLabel[label].id) : 1;
  const accountLabelToBalance = (label) => {
    const acc = accountByLabel[label];
    return acc ? Number(acc.balance || 0) : 0;
  };

  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API_BASE}/accounts/wallets`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.data)) setWalletAccounts(data.data);
        else setWalletAccounts([]);
      })
      .catch(() => setWalletAccounts([]));
  }, [isOpen]);

  useEffect(() => {
    if (!supplierId) {
      setSummary(null);
      return;
    }
    fetch(`${PURCHASE_API}/suppliers/${supplierId}/summary`)
      .then((res) => res.json())
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [supplierId]);

  // Matches for autocomplete search
  const matches = useMemo(() => {
    const list = Array.isArray(productList) ? productList : [];
    const term = query.trim().toLowerCase();
    if (!term) return list.slice(0, 30);
    return list
      .filter((product) => {
        const full = fullCatalogName(product).toLowerCase();
        const sku = (product.sku || '').toLowerCase();
        const barcode = (product.barcode || '').toLowerCase();
        const cat = (product.category_name || '').toLowerCase();
        const brand = (product.brand_name || '').toLowerCase();
        const name = (product.name || '').toLowerCase();
        return (
          full.includes(term) ||
          name.includes(term) ||
          sku.includes(term) ||
          barcode.includes(term) ||
          cat.includes(term) ||
          brand.includes(term)
        );
      })
      .slice(0, 30);
  }, [productList, query]);

  const updateItem = (localId, patch) => {
    setItems((current) =>
      current.map((item) => {
        if (item.localId !== localId) return item;
        const next = { ...item, ...patch };
        if (!next.final_sale_manual) next.final_sale_price = computeFinalSale(next);
        return next;
      })
    );
  };

  const handleItemCostChange = (item, newCostStr) => {
    const cost = money(newCostStr);
    let patch = { cost_price: newCostStr };
    if (
      cost > 0 &&
      item.margin_value !== '' &&
      item.margin_value !== null &&
      item.margin_value !== undefined
    ) {
      const margin = money(item.margin_value);
      const sale =
        item.margin_type === 'amount' ? cost + margin : cost + (cost * margin) / 100;
      patch.sale_price = Number(sale.toFixed(2));
      patch.final_sale_price = Number(sale.toFixed(2));
      patch.final_sale_manual = false;
    } else if (cost > 0 && money(item.sale_price) > 0) {
      const sale = money(item.sale_price);
      const margin =
        item.margin_type === 'amount' ? sale - cost : ((sale - cost) / cost) * 100;
      patch.margin_value = Number(margin.toFixed(2));
      patch.final_sale_price = sale;
    }
    updateItem(item.localId, patch);
  };

  const handleItemMarginChange = (item, newMarginStr) => {
    const margin = money(newMarginStr);
    const cost = money(item.cost_price);
    let patch = { margin_value: newMarginStr };
    if (cost > 0) {
      const sale =
        item.margin_type === 'amount' ? cost + margin : cost + (cost * margin) / 100;
      patch.sale_price = Number(sale.toFixed(2));
      patch.final_sale_price = Number(sale.toFixed(2));
      patch.final_sale_manual = false;
    }
    updateItem(item.localId, patch);
  };

  const handleItemSaleChange = (item, newSaleStr) => {
    const sale = money(newSaleStr);
    const cost = money(item.cost_price);
    let patch = {
      sale_price: newSaleStr,
      final_sale_price: newSaleStr,
      final_sale_manual: true,
    };
    if (cost > 0 && sale > 0) {
      const margin =
        item.margin_type === 'amount' ? sale - cost : ((sale - cost) / cost) * 100;
      patch.margin_value = Number(margin.toFixed(2));
    }
    updateItem(item.localId, patch);
  };

  const addProduct = (product) => {
    console.log('[PurchaseOrderModal] Product selected from API/catalog:', {
      id: product?.id,
      name: product?.name,
      isSerialRequired: product?.isSerialRequired,
      is_serial_required: product?.is_serial_required,
      is_serial_tracked: product?.is_serial_tracked,
      is_warranty_required: product?.is_warranty_required,
      warranty_months: product?.warranty_months,
      product,
    });
    const existing = items.find((item) => item.product_id === product.id);
    if (existing) {
      setError(
        `"${product.name}" is already added to this purchase order. The same item cannot be added twice.`
      );
      setExpandedId(existing.localId);
      setQuery('');
      return;
    }
    const line = newLineItem(product);
    setItems((current) => [...current, line]);
    setExpandedId(line.localId);
    setQuery('');
    setBarcodeInput('');
    setError('');
  };

  const handleAddBarcode = async (localId, explicitValue) => {
    const targetItem = items.find((row) => row.localId === localId);
    if (!targetItem) return;

    const raw = (explicitValue !== undefined ? explicitValue : barcodeInput).trim();
    if (!raw) return;

    const candidates = raw
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!candidates.length) return;

    const currentSerials = targetItem.serials || [];
    const validToAdd = [];
    let errorMessage = '';

    // Subsequent barcodes should match the length of the initial one!
    const requiredLength = currentSerials.length > 0 ? currentSerials[0].length : null;

    for (const cand of candidates) {
      // 1. Local duplicate check within target item
      if (
        currentSerials.some((s) => s.toLowerCase() === cand.toLowerCase()) ||
        validToAdd.some((s) => s.toLowerCase() === cand.toLowerCase())
      ) {
        errorMessage = `⚠️ Duplicate Serial! Barcode "${cand}" is already added to this item.`;
        break;
      }

      // 2. Local duplicate check across other items in the modal
      const otherItemDuplicate = items.find(
        (row) =>
          row.localId !== localId &&
          Array.isArray(row.serials) &&
          row.serials.some((s) => s.toLowerCase() === cand.toLowerCase())
      );
      if (otherItemDuplicate) {
        errorMessage = `⚠️ Duplicate Serial! Barcode "${cand}" is already added under "${
          otherItemDuplicate.name || 'another item'
        }".`;
        break;
      }

      // 3. Length match check
      if (requiredLength !== null && cand.length !== requiredLength) {
        errorMessage = `⚠️ Barcode "${cand}" length (${cand.length}) must match initial barcode length (${requiredLength} chars, e.g. "${currentSerials[0]}"). All subsequent barcodes must match initial length.`;
        break;
      }

      // 4. Global database uniqueness check
      try {
        const excludePoId = orderToEdit?.id ? `&exclude_po_id=${orderToEdit.id}` : '';
        const res = await fetch(
          `${PURCHASE_API}/check-serial?serial=${encodeURIComponent(cand)}${excludePoId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.exists) {
            errorMessage = `⚠️ Duplicate Serial! ${
              data.message || `Barcode "${cand}" already exists in Inventory.`
            }`;
            break;
          }
        }
      } catch (err) {
        console.warn('Serial uniqueness check notice:', err);
      }

      validToAdd.push(cand);
    }

    if (errorMessage) {
      setBarcodeScanErrors((prev) => ({ ...prev, [localId]: errorMessage }));
      setTimeout(() => {
        setBarcodeInput('');
        setBarcodeScanErrors((prev) => ({ ...prev, [localId]: '' }));
      }, 1500);
      return;
    }

    if (validToAdd.length > 0) {
      const newSerials = [...currentSerials, ...validToAdd];
      updateItem(localId, {
        has_serials: true,
        serials: newSerials,
        quantity: newSerials.length,
      });
      setBarcodeInput('');
      setBarcodeScanErrors((prev) => ({ ...prev, [localId]: '' }));
    }
  };

  const handleRemoveBarcode = (localId, codeToRemove) => {
    const targetItem = items.find((row) => row.localId === localId);
    if (!targetItem) return;
    const newSerials = (targetItem.serials || []).filter((s) => s !== codeToRemove);
    updateItem(localId, {
      serials: newSerials,
      quantity: targetItem.is_serial_tracked ? newSerials.length : targetItem.quantity,
    });
  };

  const handleRemoveItem = (localId) => {
    const targetItem = items.find((it) => it.localId === localId);
    if (targetItem && targetItem.has_sales) {
      setError(
        `Cannot delete "${
          targetItem.name || 'this item'
        }": this item has already been sold in a sales invoice. Once a sale has occurred, the price and barcode can be edited, but the item cannot be deleted.`
      );
      return;
    }
    setItems((current) => current.filter((it) => it.localId !== localId));
  };

  const handleAddButtonClick = () => {
    if (matches.length > 0) {
      const unadded = matches.find((m) => !items.some((it) => it.product_id === m.id));
      addProduct(unadded || matches[0]);
    } else {
      if (searchInputRef.current) searchInputRef.current.focus();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setIsSearchOpen(false);
      }
      if (
        supplierSelectRef.current &&
        !supplierSelectRef.current.contains(e.target)
      ) {
        setIsSupplierOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form Calculations
  const totals = items.reduce(
    (acc, item) => {
      const qty = Number(item.quantity || 0);
      const cost = money(item.cost_price);
      const finalSale = computeFinalSale(item) || money(item.sale_price);
      acc.units += qty;
      acc.cost += cost * qty;
      acc.sale += finalSale * qty;
      return acc;
    },
    { units: 0, cost: 0, sale: 0 }
  );

  const extra = hasExtraCost ? money(extraCost) : 0;
  const netAmount = Number((totals.cost + extra).toFixed(2));
  const payableAmount = Math.max(0, Number((netAmount - money(discount)).toFixed(2)));
  const totalCost = payableAmount;
  const totalSale = totals.sale > 0 ? totals.sale : 0;
  const estimatedProfit = Math.max(0, totalSale - totalCost);

  const selectedSupplierObj =
    summary && summary.supplier && String(summary.supplier.id) === String(supplierId)
      ? summary.supplier
      : suppliers.find((s) => String(s.id) === String(supplierId)) ||
        (summary && summary.supplier) ||
        null;

  const supplierPayable = Number(selectedSupplierObj?.payable_balance || 0);
  const previousDue = supplierPayable;
  const totalPayable = Math.max(0, Number((payableAmount + previousDue).toFixed(2)));

  const supplierWallet = Number(
    selectedSupplierObj?.wallet_balance !== undefined
      ? selectedSupplierObj.wallet_balance
      : supplierPayable < 0
      ? Math.abs(supplierPayable)
      : 0
  );
  const supplierWalletLabel = selectedSupplierObj?.name
    ? `Supplier Wallet (${selectedSupplierObj.name})`
    : 'Supplier Wallet';

  const acceptedPaid = Number(
    tenders
      .filter((t) => t.isAccepted)
      .reduce((sum, tender) => sum + money(tender.amount), 0)
      .toFixed(2)
  );
  const paid = acceptedPaid;
  const currentDue = Math.max(0, Number((totalPayable - paid).toFixed(2)));
  const remainingDue = currentDue;

  const updateTender = (index, patch) => {
    setTenders((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  };

  const removeTender = (index) => {
    setTenders((current) => current.filter((_, i) => i !== index));
  };

  const addTenderRow = () => {
    const unpaidRemaining = Math.max(0, totalPayable - paid);
    const defaultAcc = cashAccounts[0] || 'Cash Drawer';
    setTenders((current) => [
      ...current,
      {
        ...newTender(unpaidRemaining > 0 ? unpaidRemaining : '', false),
        sub_option: defaultAcc,
      },
    ]);
  };

  const acceptTender = (index) => {
    setPaymentConfirmed(true);
    setTenders((current) =>
      current.map((row, i) => (i === index ? { ...row, isAccepted: true } : row))
    );
  };

  const cancelTender = (index) => {
    removeTender(index);
  };

  const handlePayFull = () => {
    const defaultAcc = cashAccounts[0] || 'Cash Drawer';
    setTenders([
      {
        ...newTender(totalPayable, true),
        sub_option: defaultAcc,
      },
    ]);
    setPaymentConfirmed(true);
  };

  const handleFullDue = () => {
    setTenders([]);
    setPaymentConfirmed(true);
  };

  // Clear Form Action
  const handleClearForm = () => {
    if (items.length > 0 || supplierId) {
      if (
        !window.confirm(
          'Are you sure you want to clear the purchase form and reset all entered items and payment details?'
        )
      ) {
        return;
      }
    }
    setSupplierId('');
    setSummary(null);
    setItems([]);
    setReference('');
    setDiscount(0);
    setHasExtraCost(false);
    setExtraCost('');
    setExtraCostCategory(EXTRA_COST_CATEGORIES[0]);
    setExtraCostNotes('');
    setTenders([]);
    setPaymentConfirmed(false);
    setQuery('');
    setBarcodeInput('');
    setError('');
    setPopupMsg('');
  };

  // Load PO from Preview Popup into Form
  const handleLoadOrderInForm = async (po) => {
    if (!po) return;
    let fullPo = po;
    if (!Array.isArray(fullPo.items) || fullPo.items.length === 0) {
      try {
        const res = await fetch(`${PURCHASE_API}/${po.id}`);
        if (res.ok) {
          fullPo = await res.json();
        }
      } catch (err) {
        console.error('Failed to fetch full PO details in handleLoadOrderInForm:', err);
      }
    }

    if (fullPo.supplier_id) {
      setSupplierId(String(fullPo.supplier_id));
    }
    setReference(fullPo.transaction_reference || fullPo.po_number || '');
    setExtraCost(fullPo.extra_cost ? String(fullPo.extra_cost) : '');
    if (fullPo.extra_cost_category) setExtraCostCategory(fullPo.extra_cost_category);
    if (fullPo.extra_cost_notes) setExtraCostNotes(fullPo.extra_cost_notes);

    if (Array.isArray(fullPo.items) && fullPo.items.length > 0) {
      const loadedItems = fullPo.items.map((it) => {
        const prod = productList.find((p) => p.id === it.product_id) || {};
        const isTracked =
          isProductSerialTracked(prod) || isProductSerialTracked(it);
        const isWarrantyReq =
          isProductWarrantyRequired(prod) || isProductWarrantyRequired(it);
        const serials = Array.isArray(it.serials) ? it.serials : [];
        return {
          localId: `${Date.now()}-${it.product_id}-${Math.floor(Math.random() * 1000)}`,
          product_id: it.product_id,
          name: it.product_name || productLabel(prod),
          full_name: fullCatalogName(prod) || it.product_name,
          brand_name: it.brand_name || prod.brand_name || '',
          category_name: it.category_name || prod.category_name || '',
          sku: it.sku || prod.sku || '',
          barcode: it.barcode || prod.barcode || '',
          quantity: isTracked
            ? serials.length > 0
              ? serials.length
              : Number(it.quantity || 0)
            : Number(it.quantity || 1),
          cost_price: Number(it.cost_price || 0),
          sale_price: Number(it.final_sale_price || it.sale_price || 0),
          margin_type: it.margin_type || 'percent',
          margin_value:
            it.margin_value !== undefined ? String(it.margin_value) : '15',
          previous_margin:
            it.margin_value !== undefined ? String(it.margin_value) : null,
          previous_cost: Number(it.cost_price || 0),
          final_sale_price: Number(it.final_sale_price || it.sale_price || 0),
          final_sale_manual: false,
          expected_date: it.expected_date ? it.expected_date.split('T')[0] : today(),
          warranty_months: it.warranty_months ? Number(it.warranty_months) : 0,
          customer_warranty_months: it.warranty_months ? Number(it.warranty_months) : 0,
          supplier_warranty_months: it.supplier_warranty_months
            ? Number(it.supplier_warranty_months)
            : Number(it.warranty_months || 0),
          is_warranty_required: isWarrantyReq,
          has_serials: isTracked,
          is_serial_tracked: isTracked,
          serials,
        };
      });
      setItems(loadedItems);
      if (loadedItems.length > 0) setExpandedId(loadedItems[0].localId);
    }

    if (Array.isArray(po.payments) && po.payments.length > 0) {
      const loadedTenders = po.payments.map((p) => ({
        id: `${Date.now()}-${Math.random()}`,
        method: p.payment_method || 'Cash',
        sub_option:
          p.sub_option ||
          (p.payment_method === 'Bank'
            ? bankAccounts[0] || 'Bank'
            : p.payment_method === 'MFS'
            ? mfsAccounts[0] || 'MFS'
            : cashAccounts[0] || 'Cash Drawer'),
        receiver_name: p.receiver_name || '',
        transaction_id: p.transaction_id || '',
        amount: Number(p.amount || 0),
      }));
      setTenders(loadedTenders);
    } else {
      setTenders([]);
    }
    setPaymentConfirmed(false);

    setIsLedgerPreviewOpen(false);
  };

  // Open Preview Popup for recent order
  const handleOpenRecentPreview = (recentPo) => {
    setPreviewOrderId(recentPo.id);
    setPreviewOrderData(recentPo);
    setIsLedgerPreviewOpen(true);
  };

  // Save Purchase Action
  const savePurchase = async (andPreview = false) => {
    setError('');
    setPopupMsg('');
    if (!supplierId && !selectedSupplierObj)
      return setPopupMsg(
        '⚠️ Please select a supplier — purchase invoices cannot be saved without selecting a supplier.'
      );
    if (!items.length) return setError('Please add at least one product');

    const unacceptedWithAmount = tenders.filter(
      (t) => !t.isAccepted && money(t.amount) > 0
    );
    if (unacceptedWithAmount.length > 0) {
      return setPopupMsg(
        '⚠️ You have unconfirmed payment rows. Please click "✓ Accept" to confirm each payment entry, or "Cancel" to remove it before saving.'
      );
    }

    // Complete validation for every line item
    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      const title = it.full_name || it.name || `Item #${idx + 1}`;
      if (!it.product_id) {
        setExpandedId(it.localId);
        return setError(`Item #${idx + 1}: Please select a valid product.`);
      }
      const cost = money(it.cost_price);
      if (cost <= 0) {
        setExpandedId(it.localId);
        return setError(`Item #${idx + 1} ("${title}"): Cost Price must be greater than 0.`);
      }
      const qty = Number(it.quantity || 0);
      if (qty <= 0) {
        setExpandedId(it.localId);
        return setError(`Item #${idx + 1} ("${title}"): Quantity must be at least 1.`);
      }
      if (it.is_serial_tracked && (it.serials || []).length === 0) {
        setExpandedId(it.localId);
        setBarcodeScanErrors((prev) => ({
          ...prev,
          [it.localId]: `⚠️ Barcode/Serial is required for "${title}". Please scan or enter at least 1 barcode.`,
        }));
        return setError(
          `Item #${idx + 1} ("${title}"): This product requires serial/barcode tracking. Please scan at least 1 barcode.`
        );
      }
      if (it.is_serial_tracked && (it.serials || []).length !== qty) {
        setExpandedId(it.localId);
        return setError(
          `Item #${idx + 1} ("${title}"): Scanned barcodes count (${
            (it.serials || []).length
          }) must match quantity (${qty}). Please scan all barcodes.`
        );
      }
      if (!it.expected_date) {
        setExpandedId(it.localId);
        return setError(`Item #${idx + 1} ("${title}"): Please specify Expected Inward Date.`);
      }
      if (
        it.warranty_months === undefined ||
        it.warranty_months === null ||
        it.warranty_months === '' ||
        Number(it.warranty_months) < 0
      ) {
        setExpandedId(it.localId);
        return setError(
          `Item #${idx + 1} ("${title}"): Please specify Customer Warranty (minimum 0 months).`
        );
      }
    }

    setSaving(true);
    try {
      const isEditing = Boolean(orderToEdit && orderToEdit.id);
      const url = isEditing
        ? `${PURCHASE_API}/${orderToEdit.id}`
        : `${PURCHASE_API}/orders`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: Number(supplierId || selectedSupplierObj.id),
          transaction_reference: reference,
          discount: money(discount),
          extra_cost: hasExtraCost ? extra : 0,
          extra_cost_category: hasExtraCost ? extraCostCategory : null,
          extra_cost_notes: hasExtraCost ? extraCostNotes : '',
          items: items.map((item) => {
            const rawCustWarranty =
              item.customer_warranty_months !== undefined
                ? item.customer_warranty_months
                : item.warranty_months;
            const rawSuppWarranty =
              item.supplier_warranty_months !== undefined
                ? item.supplier_warranty_months
                : item.warranty_months;

            const parseMonths = (val) => {
              if (typeof val === 'number' && !isNaN(val))
                return Math.max(0, Math.round(val));
              if (val) {
                const p = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
                return isNaN(p) ? 0 : Math.max(0, p);
              }
              return 0;
            };

            const cleanCustWarranty = parseMonths(rawCustWarranty);
            const cleanSuppWarranty = parseMonths(rawSuppWarranty);

            return {
              id: item.id || undefined,
              product_id: parseInt(item.product_id, 10) || 0,
              quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
              cost_price: money(item.cost_price),
              sale_price: money(item.sale_price),
              margin_type: item.margin_type || 'percent',
              margin_value: money(item.margin_value),
              final_sale_price: computeFinalSale(item),
              expected_date: item.expected_date || new Date().toISOString().split('T')[0],
              warranty_months: cleanCustWarranty,
              customer_warranty_months: cleanCustWarranty,
              supplier_warranty_months: cleanSuppWarranty,
              serials: Array.isArray(item.serials) ? item.serials : [],
            };
          }),
          payments: tenders
            .filter((t) => t.isAccepted && money(t.amount) > 0)
            .map((t) => ({
              payment_method: t.method || 'Cash',
              payment_method_id: t.payment_method_id || null,
              account_id: t.sub_option ? accountLabelToId(t.sub_option) : 1,
              sub_option: t.sub_option || '',
              receiver_name: t.receiver_name || '',
              transaction_id: t.transaction_id || '',
              amount: money(t.amount),
            })),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save purchase order');
      }

      const createdOrder = payload.data || payload;
      if (onSaved) onSaved(createdOrder);
      if (onOrderSaved) onOrderSaved(createdOrder);

      clearDraft(PURCHASE_DRAFT_KEY);
      setRecoveredDraft(null);

      if (andPreview) {
        setPrintOrder(createdOrder);
        setIsPrintPreviewOnly(false);
        setIsPrintOpen(true);
      } else {
        onClose();
      }
    } catch (saveErr) {
      console.error(saveErr);
      setError(saveErr.message || 'Error occurred while saving order');
    } finally {
      setSaving(false);
    }
  };

  return {
    // State variables
    productList,
    setProductList,
    suppliers,
    setSuppliers,
    accounts,
    setAccounts,
    supplierId,
    setSupplierId,
    summary,
    setSummary,
    query,
    setQuery,
    isSearchOpen,
    setIsSearchOpen,
    items,
    setItems,
    expandedId,
    setExpandedId,
    barcodeInput,
    setBarcodeInput,
    reference,
    setReference,
    hasExtraCost,
    setHasExtraCost,
    extraCost,
    setExtraCost,
    extraCostCategory,
    setExtraCostCategory,
    extraCostNotes,
    setExtraCostNotes,
    discount,
    setDiscount,
    tenders,
    setTenders,
    paymentConfirmed,
    setPaymentConfirmed,
    barcodeScanErrors,
    setBarcodeScanErrors,
    supplierSearch,
    setSupplierSearch,
    isSupplierOpen,
    setIsSupplierOpen,
    printOrder,
    setPrintOrder,
    isPrintOpen,
    setIsPrintOpen,
    isPrintPreviewOnly,
    setIsPrintPreviewOnly,
    recoveredDraft,
    setRecoveredDraft,
    isAddSupplierOpen,
    setIsAddSupplierOpen,
    isAddProductOpen,
    setIsAddProductOpen,
    previewOrderId,
    setPreviewOrderId,
    previewOrderData,
    setPreviewOrderData,
    isLedgerPreviewOpen,
    setIsLedgerPreviewOpen,
    error,
    setError,
    popupMsg,
    setPopupMsg,
    saving,
    setSaving,
    walletAccounts,
    setWalletAccounts,

    // Refs
    barcodeInputRef,
    searchInputRef,
    searchContainerRef,
    supplierSelectRef,

    // Computed / Accounts
    accountLabel,
    cashAccounts,
    bankAccounts,
    mfsAccounts,
    accountByLabel,
    accountLabelToId,
    accountLabelToBalance,

    // Autocomplete & Calculations
    matches,
    totals,
    extra,
    netAmount,
    payableAmount,
    totalCost,
    totalSale,
    estimatedProfit,
    selectedSupplierObj,
    supplierPayable,
    previousDue,
    totalPayable,
    supplierWallet,
    supplierWalletLabel,
    acceptedPaid,
    paid,
    currentDue,
    remainingDue,

    // Handlers & Business Logic
    handleRestoreDraft,
    handleDiscardDraft,
    updateItem,
    handleItemCostChange,
    handleItemMarginChange,
    handleItemSaleChange,
    addProduct,
    handleAddBarcode,
    handleRemoveBarcode,
    handleRemoveItem,
    handleAddButtonClick,
    updateTender,
    removeTender,
    addTenderRow,
    acceptTender,
    cancelTender,
    handlePayFull,
    handleFullDue,
    handleClearForm,
    handleLoadOrderInForm,
    handleOpenRecentPreview,
    savePurchase,

    // Helpers
    taka,
    money,
    computeFinalSale,
    getItemMissingFields,
    newLineItem,
    newTender,
    today,
    EXTRA_COST_CATEGORIES,
  };
}

export default usePurchaseCart;
