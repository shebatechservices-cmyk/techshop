import { useState, useEffect, useMemo, useRef } from 'react';
import API from '../../../services/api';
import { EXTRA_COST_CATEGORIES } from '../../Purchases/hooks/usePurchaseCart';
import {
  fullCatalogName,
  productLabel,
  isProductSerialTracked,
  isProductWarrantyRequired,
} from '../../../utils/productUtils';
import { POS_DRAFT_KEY, saveDraft, loadDraft, clearDraft } from '../../../utils/draftRecovery';

export const money = (val) => Number.parseFloat(val || 0) || 0;
export const taka = (val) =>
  `৳${money(val).toLocaleString('en-BD', {
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

export function useNewSale({
  isOpen,
  onClose,
  customers = [],
  products = [],
  newlyCreatedCustomer,
  onOpenAddCustomer,
  onSaleCreated,
  editSale = null,
  onSaleUpdated = null,
}) {
  const [customerId, setCustomerId] = useState('');
  const [customerSummary, setCustomerSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeError, setBarcodeError] = useState({});
  const [discount, setDiscount] = useState(0);
  const [discountTouched, setDiscountTouched] = useState(false);
  const [vat, setVat] = useState(0);
  const [hasSetupCharge, setHasSetupCharge] = useState(false);
  const [cameraCount, setCameraCount] = useState(1);
  const [setupRatePerCamera, setSetupRatePerCamera] = useState(500);
  const [setupCharge, setSetupCharge] = useState(500);
  const [hasExtraCost, setHasExtraCost] = useState(false);
  const [extraCost, setExtraCost] = useState(0);
  const [extraCostCategory, setExtraCostCategory] = useState(EXTRA_COST_CATEGORIES[0]);
  const [extraCostNotes, setExtraCostNotes] = useState('');
  const [loyaltyPointsToUse, setLoyaltyPointsToUse] = useState(0);
  const [tenders, setTenders] = useState([newTender(0)]);
  const [hasUserEditedPaid, setHasUserEditedPaid] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [walletAccounts, setWalletAccounts] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [popupMsg, setPopupMsg] = useState('');
  const [salesPerson, setSalesPerson] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [destination, setDestination] = useState('');
  const [attention, setAttention] = useState('');
  const [staffList, setStaffList] = useState([
    'Sheba Admin',
    'Tanvir Hasan',
    'Al-Amin Technician',
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [printSale, setPrintSale] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isPrintPreviewOnly, setIsPrintPreviewOnly] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [recoveredDraft, setRecoveredDraft] = useState(null);
  const [activeCostCardId, setActiveCostCardId] = useState(null);

  const toggleCostCard = (localId) => {
    setActiveCostCardId((prev) => (prev === localId ? null : localId));
  };

  // Close cost popup when clicking anywhere outside
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (activeCostCardId && !e.target.closest('.cost-peek-container')) {
        setActiveCostCardId(null);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [activeCostCardId]);

  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const barcodeInputRef = useRef(null);
  const customerSelectRef = useRef(null);

  // Autofocus product search input on modal open for rapid barcode scanning
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Load user-created payment accounts (cash drawers / banks / MFS) from backend
  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API}/accounts/wallets`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.data)) setWalletAccounts(data.data);
        else setWalletAccounts([]);
      })
      .catch(() => setWalletAccounts([]));
  }, [isOpen]);

  const accountLabel = (a) => a.name + (a.account_number ? ` (${a.account_number})` : '');
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

  // Fill empty sub_option for the primary tender once accounts load
  useEffect(() => {
    setTenders((current) => {
      if (!current || !current.length) return current;
      const first = current[0];
      if (first.sub_option) return current;
      const list =
        first.method === 'Bank'
          ? bankAccounts
          : first.method === 'MFS'
          ? mfsAccounts
          : cashAccounts;
      const sub =
        (list && list[0]) ||
        (first.method === 'Bank'
          ? 'Bank'
          : first.method === 'MFS'
          ? 'MFS'
          : 'Cash Drawer');
      return current.map((t, i) => (i === 0 ? { ...t, sub_option: sub } : t));
    });
  }, [walletAccounts, cashAccounts, bankAccounts, mfsAccounts]);

  // Check for existing saved draft on open
  useEffect(() => {
    if (isOpen && !editSale) {
      const draft = loadDraft(POS_DRAFT_KEY);
      if (draft && draft.data && (draft.itemCount > 0 || draft.data.customerId)) {
        setRecoveredDraft(draft);
      } else {
        setRecoveredDraft(null);
      }
    } else {
      setRecoveredDraft(null);
    }
  }, [isOpen, editSale]);

  // Real-Time Auto-Save Draft with 300ms debounce
  useEffect(() => {
    if (!isOpen || editSale) return;

    // Do not auto-save if we are still displaying the recovered draft prompt and form is blank
    if (recoveredDraft && items.length === 0 && !customerId) return;

    const timer = setTimeout(() => {
      saveDraft(POS_DRAFT_KEY, {
        customerId,
        items,
        discount,
        discountTouched,
        vat,
        hasSetupCharge,
        cameraCount,
        setupRatePerCamera,
        setupCharge,
        hasExtraCost,
        extraCost,
        extraCostCategory,
        extraCostNotes,
        loyaltyPointsToUse,
        tenders,
        salesPerson,
        invoiceDate,
        destination,
        attention,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [
    isOpen,
    editSale,
    recoveredDraft,
    customerId,
    items,
    discount,
    discountTouched,
    vat,
    hasSetupCharge,
    cameraCount,
    setupRatePerCamera,
    setupCharge,
    hasExtraCost,
    extraCost,
    extraCostCategory,
    extraCostNotes,
    loyaltyPointsToUse,
    tenders,
    salesPerson,
    invoiceDate,
    destination,
    attention,
  ]);

  const handleRestoreDraft = () => {
    if (!recoveredDraft || !recoveredDraft.data) return;
    const d = recoveredDraft.data;
    if (d.customerId) setCustomerId(String(d.customerId));
    if (Array.isArray(d.items) && d.items.length > 0) setItems(d.items);
    if (d.discount !== undefined) setDiscount(Number(d.discount));
    if (d.discountTouched !== undefined) setDiscountTouched(Boolean(d.discountTouched));
    if (d.vat !== undefined) setVat(Number(d.vat));
    if (d.hasSetupCharge !== undefined) setHasSetupCharge(Boolean(d.hasSetupCharge));
    if (d.cameraCount !== undefined) setCameraCount(Number(d.cameraCount));
    if (d.setupRatePerCamera !== undefined)
      setSetupRatePerCamera(Number(d.setupRatePerCamera));
    if (d.setupCharge !== undefined) setSetupCharge(Number(d.setupCharge));
    if (d.hasExtraCost !== undefined) setHasExtraCost(Boolean(d.hasExtraCost));
    if (d.extraCost !== undefined) setExtraCost(d.extraCost);
    if (d.extraCostCategory) setExtraCostCategory(d.extraCostCategory);
    if (d.extraCostNotes) setExtraCostNotes(d.extraCostNotes);
    if (d.loyaltyPointsToUse !== undefined)
      setLoyaltyPointsToUse(Number(d.loyaltyPointsToUse));
    if (Array.isArray(d.tenders) && d.tenders.length > 0) setTenders(d.tenders);
    if (d.salesPerson) setSalesPerson(d.salesPerson);
    if (d.invoiceDate) setInvoiceDate(d.invoiceDate);
    if (d.destination) setDestination(d.destination);
    if (d.attention) setAttention(d.attention);

    setRecoveredDraft(null);
  };

  const handleDiscardDraft = () => {
    clearDraft(POS_DRAFT_KEY);
    setRecoveredDraft(null);
  };

  // Set default customer (only when a brand-new customer was just created)
  useEffect(() => {
    if (newlyCreatedCustomer && newlyCreatedCustomer.id) {
      setCustomerId(String(newlyCreatedCustomer.id));
    }
  }, [newlyCreatedCustomer]);

  // Fetch customer ledger summary
  useEffect(() => {
    if (!customerId) {
      setCustomerSummary(null);
      setLoadingSummary(false);
      return;
    }
    let isMounted = true;
    setLoadingSummary(true);
    fetch(`${API}/sales/customers/${customerId}/summary`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted) {
          if (data && data.success) {
            setCustomerSummary(data);
          } else {
            setCustomerSummary(null);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch customer summary:', err);
        if (isMounted) setCustomerSummary(null);
      })
      .finally(() => {
        if (isMounted) setLoadingSummary(false);
      });
    return () => {
      isMounted = false;
    };
  }, [customerId]);

  // Autofocus barcode input when item expanded
  useEffect(() => {
    if (expandedId) {
      setBarcodeInput('');
      const timer = setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [expandedId]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setIsSearchOpen(false);
      }
      if (
        customerSelectRef.current &&
        !customerSelectRef.current.contains(e.target)
      ) {
        setIsCustomerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load staff list
  useEffect(() => {
    fetch(`${API}/parties?type=staff`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const names = data.map((d) => d.name).filter(Boolean);
          if (names.length > 0) {
            setStaffList((prev) => Array.from(new Set([...names, ...prev])));
          }
        }
      })
      .catch(() => {});
    fetch(`${API}/security/users`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const rows = data && Array.isArray(data.data) ? data.data : [];
        const names = rows.map((r) => r.name).filter(Boolean);
        if (names.length > 0) {
          setStaffList((prev) => Array.from(new Set([...prev, ...names])));
        }
      })
      .catch(() => {});
  }, []);

  // Hydrate form when editing an existing sale invoice
  useEffect(() => {
    if (isOpen && editSale && editSale.id) {
      setPaymentConfirmed(false);
      setPopupMsg('');
      setCustomerId(String(editSale.customer_id || ''));
      setError('');
      setItems(
        (editSale.items || []).map((it, idx) => {
          const prodInList = (products || []).find((p) => p.id === it.product_id);
          const fullName = fullCatalogName(prodInList || it);
          const isTracked =
            isProductSerialTracked(prodInList) || isProductSerialTracked(it);
          const isWarrantyReq =
            isProductWarrantyRequired(prodInList) ||
            isProductWarrantyRequired(it);
          const serialsList = Array.isArray(it.serials) ? it.serials : [];
          return {
            localId: `${Date.now()}-${idx}`,
            product_id: it.product_id,
            name: fullName,
            full_name: fullName,
            brand_name: it.brand_name || (prodInList && prodInList.brand_name) || '',
            stock: prodInList ? Number(prodInList.stock || 0) : 0,
            quantity: isTracked ? serialsList.length : Number(it.quantity || 1),
            unit_price: money(it.unit_price),
            cost_price: money(it.cost_price),
            discount: money(it.discount),
            warranty_months:
              it.warranty_months !== undefined && it.warranty_months !== null
                ? Number(it.warranty_months)
                : prodInList
                ? Number(prodInList.warranty_months || 0)
                : 0,
            serials: serialsList,
            is_serial_tracked: isTracked,
            is_warranty_required: isWarrantyReq,
          };
        })
      );
      const loyaltyUsed = Number(editSale.loyalty_points_used || 0);
      setDiscount(money(editSale.discount) - loyaltyUsed);
      setDiscountTouched(true);
      setVat(money(editSale.vat));
      setLoyaltyPointsToUse(loyaltyUsed);
      setHasSetupCharge(money(editSale.setup_charge) > 0);
      setSetupCharge(money(editSale.setup_charge));
      setSetupRatePerCamera(money(editSale.setup_charge));
      setHasExtraCost(money(editSale.extra_cost) > 0);
      setExtraCost(money(editSale.extra_cost));
      setExtraCostCategory(editSale.extra_cost_category || EXTRA_COST_CATEGORIES[0]);
      setExtraCostNotes(editSale.extra_cost_notes || '');
      setSalesPerson(editSale.sales_person || '');
      setDestination(editSale.destination || '');
      setAttention(editSale.attention || '');
      if (editSale.invoice_date) {
        const idate = new Date(editSale.invoice_date);
        if (!isNaN(idate.getTime())) {
          setInvoiceDate(
            `${idate.getFullYear()}-${String(idate.getMonth() + 1).padStart(
              2,
              '0'
            )}-${String(idate.getDate()).padStart(2, '0')}`
          );
        }
      }
      const priorTenders = Array.isArray(editSale.payment_details)
        ? typeof editSale.payment_details === 'string'
          ? JSON.parse(editSale.payment_details)
          : editSale.payment_details
        : [];
      const priorPaid = priorTenders.filter((t) => money(t.amount) > 0);
      setTenders(
        priorPaid.length > 0
          ? priorPaid.map((t, idx) => ({
              id: t.id || `edit-sale-tender-${idx}-${Date.now()}`,
              method: t.method || t.payment_mode || 'Cash',
              sub_option: t.sub_option || t.account_name || '',
              transaction_id: t.transaction_id || t.reference_no || '',
              receiver_name: t.receiver_name || '',
              amount: money(t.amount),
              isAccepted: true,
            }))
          : money(editSale.paid_amount) > 0
          ? [newTender(money(editSale.paid_amount), true)]
          : []
      );
      setHasUserEditedPaid(true);
      setPaymentConfirmed(true);
    }
  }, [isOpen, editSale, products]);

  // Filter products for search dropdown
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return (products || []).filter((p) => {
      const full = fullCatalogName(p).toLowerCase();
      const name = (p.name || '').toLowerCase();
      const brand = (p.brand_name || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const barcode = (p.barcode || '').toLowerCase();
      return (
        full.includes(q) ||
        name.includes(q) ||
        brand.includes(q) ||
        sku.includes(q) ||
        barcode.includes(q)
      );
    });
  }, [searchQuery, products]);

  const addProduct = (prod, initialSerial = '') => {
    const isTracked = isProductSerialTracked(prod);
    const isWarrantyReq = isProductWarrantyRequired(prod);
    const fullName = fullCatalogName(prod);
    if (Number((prod && prod.stock) || 0) <= 0) {
      setError(`"${fullName}" has no stock available — cannot add to sale invoice.`);
      setSearchQuery('');
      setIsSearchOpen(false);
      return;
    }
    const existing = items.find((it) => it.product_id === prod.id);
    if (existing) {
      const newSerials =
        initialSerial && !(existing.serials || []).includes(initialSerial)
          ? [...(existing.serials || []), initialSerial]
          : existing.serials || [];
      const newQty = isTracked
        ? newSerials.length
        : Math.max(existing.quantity + 1, newSerials.length);
      updateItem(existing.localId, {
        quantity: newQty,
        serials: newSerials,
        isSerialRequired: isTracked,
        is_serial_required: isTracked,
        is_serial_tracked: isTracked,
        tracks_serial: isTracked,
      });
      if (isTracked && newSerials.length === 0) {
        setExpandedId(existing.localId);
      }
      setSearchQuery('');
      setIsSearchOpen(false);
      return;
    }

    const price = Number(
      prod.sale_price !== undefined &&
        prod.sale_price !== null &&
        Number(prod.sale_price) > 0
        ? prod.sale_price
        : prod.salePrice !== undefined &&
          prod.salePrice !== null &&
          Number(prod.salePrice) > 0
        ? prod.salePrice
        : prod.selling_price !== undefined &&
          prod.selling_price !== null &&
          Number(prod.selling_price) > 0
        ? prod.selling_price
        : prod.final_sale_price !== undefined &&
          prod.final_sale_price !== null &&
          Number(prod.final_sale_price) > 0
        ? prod.final_sale_price
        : prod.mrp !== undefined && prod.mrp !== null && Number(prod.mrp) > 0
        ? prod.mrp
        : prod.cost_price || prod.costPrice || prod.purchase_price || 0
    );
    const unitCost = Number(
      prod.cost_price !== undefined && prod.cost_price !== null
        ? prod.cost_price
        : prod.costPrice !== undefined && prod.costPrice !== null
        ? prod.costPrice
        : prod.purchase_price || prod.last_purchase_price || 0
    );
    const startSerials = [];
    if (initialSerial) {
      startSerials.push(initialSerial);
    }

    const inheritedWarranty =
      prod.batch_warranty_months !== undefined &&
      prod.batch_warranty_months !== null &&
      Number(prod.batch_warranty_months) > 0
        ? Number(prod.batch_warranty_months)
        : prod.warranty_months !== undefined &&
          prod.warranty_months !== null &&
          Number(prod.warranty_months) > 0
        ? Number(prod.warranty_months)
        : isWarrantyReq
        ? ''
        : 0;

    const line = {
      localId: `${Date.now()}-${prod.id}`,
      product_id: prod.id,
      name: fullName,
      full_name: fullName,
      brand_name: prod.brand_name || '',
      stock: Number(prod.stock || 0),
      quantity: isTracked ? startSerials.length : 1,
      unit_price: price,
      cost_price: unitCost,
      discount: 0,
      warranty_months: inheritedWarranty,
      serials: startSerials,
      isSerialRequired: isTracked,
      is_serial_required: isTracked,
      is_serial_tracked: isTracked,
      tracks_serial: isTracked,
      isWarrantyRequired: isWarrantyReq,
      is_warranty_required: isWarrantyReq,
    };
    setItems((prev) => [...prev, line]);
    if (isTracked && startSerials.length === 0) {
      setExpandedId(line.localId);
    }
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const updateItem = (localId, patch) => {
    setItems((prev) =>
      prev.map((it) => (it.localId === localId ? { ...it, ...patch } : it))
    );
  };

  const removeItem = (localId) => {
    setItems((prev) => prev.filter((it) => it.localId !== localId));
  };

  // Scan/Enter handler for the product search box
  const handleScanEnter = async (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    const lowerQ = q.toLowerCase();

    const exact = (products || []).find(
      (p) =>
        Number(p.stock || 0) > 0 &&
        ((p.barcode && p.barcode.toLowerCase() === lowerQ) ||
          (p.sku && p.sku.toLowerCase() === lowerQ))
    );
    if (exact) {
      addProduct(exact, q);
      setSearchError('');
      return;
    }

    if (filteredProducts.length > 0) {
      addProduct(filteredProducts[0]);
      setSearchError('');
      return;
    }

    try {
      const res = await fetch(`${API}/search/product?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json().catch(() => null);
        const found = data && data.data && data.data[0];
        if (found && Number(found.stock || 0) > 0) {
          addProduct(found, q);
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
  };

  const handleAddBarcode = (localId, explicitValue) => {
    const raw = (explicitValue !== undefined ? explicitValue : barcodeInput).trim();
    if (!raw) return;

    const candidates = raw
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!candidates.length) return;

    const targetItem = items.find((it) => it.localId === localId);
    if (!targetItem) return;

    const existingMap = new Map();
    items.forEach((it) => {
      (it.serials || []).forEach((s) => existingMap.set(s.toLowerCase(), it.name));
    });

    const toAdd = [];
    const duplicates = [];

    candidates.forEach((code) => {
      const lower = code.toLowerCase();
      if (existingMap.has(lower) || toAdd.some((c) => c.toLowerCase() === lower)) {
        duplicates.push(code);
      } else {
        toAdd.push(code);
        existingMap.set(lower, targetItem.name);
      }
    });

    if (duplicates.length > 0) {
      setBarcodeError((prev) => ({
        ...prev,
        [localId]: `Duplicate barcode rejected: ${duplicates.join(', ')}`,
      }));
    } else {
      setBarcodeError((prev) => ({ ...prev, [localId]: '' }));
    }

    if (toAdd.length > 0) {
      const newSerials = [...(targetItem.serials || []), ...toAdd];
      const newQty = targetItem.is_serial_tracked
        ? newSerials.length
        : Math.max(Number(targetItem.quantity || 1), newSerials.length);
      updateItem(localId, {
        serials: newSerials,
        quantity: newQty,
      });
      setBarcodeInput('');
    }
  };

  const handleRemoveBarcode = (localId, code) => {
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
  };

  // Auto-detect camera count from cart items
  const detectedCameraCount = useMemo(() => {
    let count = 0;
    for (const it of items) {
      const name = (it.name || '').toLowerCase();
      if (
        name.includes('cam') ||
        name.includes('camera') ||
        name.includes('dome') ||
        name.includes('bullet') ||
        name.includes('cctv')
      ) {
        count += Number(it.quantity || 1);
      }
    }
    return count > 0 ? count : 1;
  }, [items]);

  const handleToggleSetupCharge = (checked) => {
    setHasSetupCharge(checked);
    if (checked) {
      const count = cameraCount > 1 ? cameraCount : detectedCameraCount;
      setCameraCount(count);
      const rate = setupRatePerCamera > 0 ? setupRatePerCamera : 500;
      setSetupRatePerCamera(rate);
      setSetupCharge(count * rate);
    }
  };

  const handleCameraCountChange = (val) => {
    const num = Math.max(1, parseInt(val) || 1);
    setCameraCount(num);
    setSetupCharge(num * setupRatePerCamera);
  };

  const handleRateChange = (val) => {
    const rate = Math.max(0, parseFloat(val) || 0);
    setSetupRatePerCamera(rate);
    setSetupCharge(cameraCount * rate);
  };

  const handleDirectSetupChargeChange = (val) => {
    const charge = Math.max(0, parseFloat(val) || 0);
    setSetupCharge(charge);
  };

  // Financial Calculations
  const subtotal = items.reduce(
    (sum, it) => sum + Number(it.quantity || 1) * Number(it.unit_price || 0),
    0
  );
  const perItemDiscount = items.reduce((sum, it) => sum + money(it.discount), 0);
  const totalDiscount = money(discount) + money(loyaltyPointsToUse);
  const totalVat = money(vat);
  const totalSetupCharge = hasSetupCharge ? money(setupCharge) : 0;
  const totalExtraCost = hasExtraCost ? money(extraCost) : 0;
  const netAmount = subtotal + totalVat + totalSetupCharge + totalExtraCost;
  const currentSaleTotal = netAmount;

  const payableAmount = Math.max(0, netAmount - totalDiscount);
  const selectedCustomer = customers.find((c) => String(c.id) === String(customerId));
  const previousDue = money(
    customerSummary?.customer?.receivable_balance ??
      selectedCustomer?.receivable_balance ??
      0
  );
  const totalPayable = Math.max(0, payableAmount + previousDue);

  const customerWalletBalance = money(
    customerSummary?.customer?.wallet_balance ??
      customerSummary?.wallet?.balance ??
      selectedCustomer?.wallet_balance ??
      (previousDue < 0 ? Math.abs(previousDue) : 0)
  );
  const customerWalletLabel = selectedCustomer?.name
    ? `Customer Wallet (${selectedCustomer.name})`
    : 'Customer Wallet';

  const acceptedPaid = tenders
    .filter((t) => t.isAccepted)
    .reduce((sum, tender) => sum + money(tender.amount), 0);
  const paid = acceptedPaid;
  const currentDue = Math.max(0, totalPayable - paid);
  const due = currentDue;

  const customerTypeRaw = String(
    selectedCustomer?.customer_type || selectedCustomer?.customer_group || 'Regular'
  );
  const isTechnician =
    customerTypeRaw.toLowerCase().includes('tech');
  const isReseller =
    customerTypeRaw.toLowerCase().includes('resell') ||
    customerTypeRaw.toLowerCase().includes('wholesale') ||
    customerTypeRaw.toLowerCase().includes('corporate');
  const isGroupCustomer = isTechnician || isReseller;
  const groupDiscountAmount = isGroupCustomer ? Math.round(subtotal * 0.05) : 0;
  const isGroupDiscountActive =
    isGroupCustomer &&
    Number(discount) === groupDiscountAmount &&
    groupDiscountAmount > 0;

  useEffect(() => {
    if (!discountTouched)
      setDiscount(
        isGroupCustomer && subtotal > 0 ? groupDiscountAmount : perItemDiscount
      );
  }, [
    discountTouched,
    groupDiscountAmount,
    isGroupCustomer,
    perItemDiscount,
    subtotal,
  ]);

  const handleToggleGroupDiscount = () => {
    setDiscountTouched(true);
    if (isGroupDiscountActive) {
      setDiscount(0);
    } else {
      setDiscount(groupDiscountAmount);
    }
  };

  // Auto-fill tender amount
  useEffect(() => {
    if (!hasUserEditedPaid && items.length > 0 && !editSale) {
      const total = totalPayable;
      const defaultCash = cashAccounts[0] || 'Cash Drawer';
      setTenders((current) => {
        if (!current || current.length === 0)
          return [
            {
              ...newTender(total, false),
              method: 'Cash',
              sub_option: defaultCash,
            },
          ];
        return current.map((t, idx) =>
          idx === 0 && !t.isAccepted
            ? {
                ...t,
                amount: total,
                method: t.method || 'Cash',
                sub_option: t.sub_option || defaultCash,
              }
            : t
        );
      });
    }
  }, [
    currentSaleTotal,
    hasUserEditedPaid,
    items.length,
    totalPayable,
    editSale,
    cashAccounts,
  ]);

  const updateTender = (index, patch) => {
    setTenders((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  };

  const removeTender = (index) => {
    setHasUserEditedPaid(true);
    setTenders((current) => current.filter((_, i) => i !== index));
  };

  const addTenderRow = () => {
    setHasUserEditedPaid(true);
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
    setHasUserEditedPaid(true);
    setPaymentConfirmed(true);
    setTenders((current) =>
      current.map((row, i) => (i === index ? { ...row, isAccepted: true } : row))
    );
  };

  const cancelTender = (index) => {
    removeTender(index);
  };

  const setQuickPaid = (amount) => {
    setHasUserEditedPaid(true);
    setPaymentConfirmed(true);
    if (amount <= 0) {
      setTenders([]);
    } else {
      const defaultAcc = cashAccounts[0] || 'Cash Drawer';
      setTenders([
        {
          ...newTender(amount, true),
          sub_option: defaultAcc,
        },
      ]);
    }
  };

  const handleClearForm = () => {
    if (items.length > 0 || customerId) {
      if (
        !window.confirm(
          'Are you sure you want to clear the sale form and reset all entered items and payment details?'
        )
      ) {
        return;
      }
    }
    setCustomerId('');
    setCustomerSummary(null);
    setItems([]);
    setDiscount(0);
    setDiscountTouched(false);
    setVat(0);
    setHasSetupCharge(false);
    setSetupCharge(500);
    setHasExtraCost(false);
    setExtraCost(0);
    setExtraCostNotes('');
    setLoyaltyPointsToUse(0);
    setDestination('');
    setAttention('');
    setSearchQuery('');
    setBarcodeInput('');
    setError('');
    setPopupMsg('');
    setTenders([newTender(0, false)]);
    setHasUserEditedPaid(false);
    setPaymentConfirmed(false);
  };

  const handleOpenPrintPreview = () => {
    if (!items.length) {
      setError('Please add at least one product to preview invoice');
      setTimeout(() => setError(''), 3000);
      return;
    }
    const previewData = {
      id: 'DRAFT',
      invoice_no: `INV-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '')}-DRAFT`,
      created_at: new Date().toISOString(),
      customer_name: selectedCustomer?.name || 'Walk-in Customer',
      customer_phone: selectedCustomer?.phone || '',
      customer_email: selectedCustomer?.email || '',
      customer_address: selectedCustomer?.address || '',
      sales_person: salesPerson || null,
      destination: destination || null,
      attention: attention || null,
      invoice_date: invoiceDate || null,
      subtotal,
      discount: totalDiscount,
      vat: totalVat,
      setup_charge: totalSetupCharge,
      extra_cost: totalExtraCost,
      extra_cost_category: hasExtraCost ? extraCostCategory : null,
      extra_cost_notes: hasExtraCost ? extraCostNotes : null,
      total_amount: currentSaleTotal,
      paid_amount: paid,
      due_amount: due,
      payment_method: tenders.map((t) => t.method).join(', ') || 'Cash',
      payment_details: tenders.filter((t) => money(t.amount) > 0),
      items: items.map((it) => ({
        ...it,
        line_total:
          Number(it.quantity || 1) * Number(it.unit_price || 0) -
          Number(it.discount || 0),
      })),
    };
    setPrintSale(previewData);
    setIsPrintPreviewOnly(true);
    setIsPrintOpen(true);
  };

  const handlePreviewRecentSale = async (recentSale) => {
    if (!recentSale || !recentSale.id) return;
    try {
      const res = await fetch(`${API}/sales/${recentSale.id}`);
      if (res.ok) {
        const json = await res.json();
        const saleData = json?.data || json;
        setPrintSale(saleData);
        setIsPrintPreviewOnly(true);
        setIsPrintOpen(true);
      }
    } catch (err) {
      console.error('Failed to preview recent sale:', err);
    }
  };

  const handleSaveSale = async (e) => {
    e.preventDefault();
    setError('');
    setPopupMsg('');

    if (!customerId)
      return setPopupMsg(
        '⚠️ Please select a customer — sales invoices cannot be saved without selecting a customer.'
      );
    if (!items.length) return setError('Please add at least one product');

    for (const it of items) {
      if (it.is_serial_tracked) {
        if (!it.serials || it.serials.length === 0) {
          setExpandedId(it.localId);
          return setError(
            `"${
              it.full_name || it.name
            }" is Serial/Barcode-tracked — please scan or add serial numbers before saving.`
          );
        }
        if (Number(it.quantity || 0) !== it.serials.length) {
          return setError(
            `"${it.full_name || it.name}" quantity (${
              it.quantity
            }) must match the number of attached serials (${it.serials.length}).`
          );
        }
      }
      if (it.is_warranty_required) {
        if (
          it.warranty_months === '' ||
          it.warranty_months === null ||
          it.warranty_months === undefined ||
          Number(it.warranty_months) <= 0
        ) {
          return setError(
            `"${
              it.full_name || it.name
            }" requires warranty duration — please specify warranty months.`
          );
        }
      }
      if (Number(it.quantity || 0) <= 0) {
        return setError(
          `Please specify a valid quantity for "${it.full_name || it.name}"`
        );
      }
      if (Number(it.unit_price || 0) <= 0) {
        return setError(
          `Please specify a valid unit selling price for "${it.full_name || it.name}"`
        );
      }
    }

    const unacceptedWithAmount = tenders.filter(
      (t) => !t.isAccepted && money(t.amount) > 0
    );
    if (unacceptedWithAmount.length > 0) {
      return setPopupMsg(
        '⚠️ You have unconfirmed payment rows. Please click "✓ Accept" to confirm each payment entry, or "Cancel" to remove it before saving.'
      );
    }

    try {
      setSaving(true);
      const isEdit = Boolean(editSale && editSale.id);
      const acceptedTenders = tenders.filter(
        (t) => t.isAccepted && money(t.amount) > 0
      );
      const payload = {
        customer_id: Number(customerId),
        subtotal,
        discount: totalDiscount,
        vat: totalVat,
        setup_charge: totalSetupCharge,
        extra_cost: totalExtraCost,
        extra_cost_category: hasExtraCost ? extraCostCategory || null : null,
        extra_cost_notes: hasExtraCost ? extraCostNotes || null : null,
        paid_amount: paid,
        loyalty_points_to_use: Number(loyaltyPointsToUse || 0),
        payment_method_id: acceptedTenders[0]?.payment_method_id || 1,
        payment_method: acceptedTenders.map((t) => t.method).join(', ') || 'Cash',
        payment_details: acceptedTenders,
        sales_person: salesPerson || null,
        destination: destination || null,
        attention: attention || null,
        invoice_date: invoiceDate || null,
        admin_pin: editSale?.admin_pin || editSale?.adminPin || undefined,
        items: items.map((it) => ({
          product_id: it.product_id,
          quantity: Number(it.quantity),
          unit_price: money(it.unit_price),
          cost_price: money(it.cost_price),
          discount: money(it.discount),
          warranty_months: Number(it.warranty_months || 0),
          serials: it.serials || [],
        })),
      };
      const res = await fetch(
        isEdit ? `${API}/sales/${editSale.id}` : `${API}/sales/create`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to complete sale');
        return;
      }

      const fullOrderForPrint = {
        ...data.data,
        customer_name: selectedCustomer?.name,
        customer_phone: selectedCustomer?.phone,
        customer_email: selectedCustomer?.email,
        customer_address: selectedCustomer?.address,
        sales_person: salesPerson || null,
        destination: destination || null,
        attention: attention || null,
        invoice_date: invoiceDate || null,
        extra_cost: totalExtraCost,
        extra_cost_category: hasExtraCost ? extraCostCategory : null,
        extra_cost_notes: hasExtraCost ? extraCostNotes : null,
        payment_details: acceptedTenders,
        items: items.map((it) => ({
          ...it,
          line_total:
            Number(it.quantity || 1) * Number(it.unit_price || 0) -
            Number(it.discount || 0),
        })),
      };

      setPrintSale(fullOrderForPrint);
      setIsPrintPreviewOnly(false);
      setIsPrintOpen(true);

      clearDraft(POS_DRAFT_KEY);
      setRecoveredDraft(null);

      if (isEdit) {
        if (onSaleUpdated) onSaleUpdated(data.data);
      } else if (onSaleCreated) {
        onSaleCreated(data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Server error while completing sale');
    } finally {
      setSaving(false);
    }
  };

  return {
    // States
    customerId,
    setCustomerId,
    customerSummary,
    items,
    setItems,
    expandedId,
    setExpandedId,
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    searchError,
    setSearchError,
    barcodeInput,
    setBarcodeInput,
    barcodeError,
    setBarcodeError,
    discount,
    setDiscount,
    discountTouched,
    setDiscountTouched,
    vat,
    setVat,
    hasSetupCharge,
    setHasSetupCharge,
    cameraCount,
    setCameraCount,
    setupRatePerCamera,
    setSetupRatePerCamera,
    setupCharge,
    setSetupCharge,
    hasExtraCost,
    setHasExtraCost,
    extraCost,
    setExtraCost,
    extraCostCategory,
    setExtraCostCategory,
    extraCostNotes,
    setExtraCostNotes,
    loyaltyPointsToUse,
    setLoyaltyPointsToUse,
    tenders,
    setTenders,
    hasUserEditedPaid,
    setHasUserEditedPaid,
    paymentConfirmed,
    setPaymentConfirmed,
    walletAccounts,
    customerSearch,
    setCustomerSearch,
    isCustomerOpen,
    setIsCustomerOpen,
    popupMsg,
    setPopupMsg,
    salesPerson,
    setSalesPerson,
    invoiceDate,
    setInvoiceDate,
    destination,
    setDestination,
    attention,
    setAttention,
    staffList,
    saving,
    error,
    setError,
    printSale,
    setPrintSale,
    isPrintOpen,
    setIsPrintOpen,
    isPrintPreviewOnly,
    setIsPrintPreviewOnly,
    loadingSummary,
    recoveredDraft,
    activeCostCardId,
    setActiveCostCardId,

    // Refs
    searchContainerRef,
    searchInputRef,
    barcodeInputRef,
    customerSelectRef,

    // Computed / Memos
    cashAccounts,
    bankAccounts,
    mfsAccounts,
    filteredProducts,
    detectedCameraCount,
    subtotal,
    perItemDiscount,
    totalDiscount,
    totalVat,
    totalSetupCharge,
    totalExtraCost,
    netAmount,
    currentSaleTotal,
    payableAmount,
    selectedCustomer,
    previousDue,
    totalPayable,
    customerWalletBalance,
    customerWalletLabel,
    paid,
    currentDue,
    due,
    customerTypeRaw,
    isTechnician,
    isReseller,
    isGroupCustomer,
    groupDiscountAmount,
    isGroupDiscountActive,

    // Handlers
    toggleCostCard,
    handleRestoreDraft,
    handleDiscardDraft,
    addProduct,
    updateItem,
    removeItem,
    handleScanEnter,
    handleAddBarcode,
    handleRemoveBarcode,
    handleToggleSetupCharge,
    handleCameraCountChange,
    handleRateChange,
    handleDirectSetupChargeChange,
    handleToggleGroupDiscount,
    updateTender,
    removeTender,
    addTenderRow,
    acceptTender,
    cancelTender,
    setQuickPaid,
    handleClearForm,
    handleOpenPrintPreview,
    handlePreviewRecentSale,
    handleSaveSale,
  };
}

export default useNewSale;
