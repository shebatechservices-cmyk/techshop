import React, { useState, useEffect, useMemo, useRef } from 'react';
import API from '../../services/api';
import SalePrintModal from './SalePrintModal';
import { EXTRA_COST_CATEGORIES } from '../Purchases/PurchaseOrderModal';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const newTender = (defaultAmount = 0) => ({
  id: `${Date.now()}-${Math.random()}`,
  method: 'Cash',
  sub_option: '',
  transaction_id: '',
  receiver_name: '',
  amount: defaultAmount,
});

export default function NewSaleModal({
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
    () => (walletAccounts || []).filter((a) => ['cash', 'drawer'].includes(String(a.account_type || '').toLowerCase())).map(accountLabel),
    [walletAccounts]
  );
  const bankAccounts = useMemo(
    () => (walletAccounts || []).filter((a) => String(a.account_type || '').toLowerCase() === 'bank').map(accountLabel),
    [walletAccounts]
  );
  const mfsAccounts = useMemo(
    () => (walletAccounts || []).filter((a) => !['cash', 'drawer', 'bank', 'wallet'].includes(String(a.account_type || '').toLowerCase())).map(accountLabel),
    [walletAccounts]
  );

  // Fill empty sub_option for the primary tender once accounts load
  useEffect(() => {
    setTenders((current) => {
      if (!current || !current.length) return current;
      const first = current[0];
      if (first.sub_option) return current;
      const list = first.method === 'Bank' ? bankAccounts : first.method === 'MFS' ? mfsAccounts : cashAccounts;
      const sub = (list && list[0]) || (first.method === 'Bank' ? 'Bank' : first.method === 'MFS' ? 'MFS' : 'Cash Drawer');
      return current.map((t, i) => (i === 0 ? { ...t, sub_option: sub } : t));
    });
  }, [walletAccounts, cashAccounts, bankAccounts, mfsAccounts]);

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
      return;
    }
    fetch(`${API}/sales/customers/${customerId}/summary`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success) setCustomerSummary(data);
      })
      .catch(() => setCustomerSummary(null));
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
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (customerSelectRef.current && !customerSelectRef.current.contains(e.target)) {
        setIsCustomerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load staff list (merged with logged-in security users so any logged-in user
  // can also be selected as the Sales Person and appear on the invoice print)
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
      setItems((editSale.items || []).map((it, idx) => ({
        localId: `${Date.now()}-${idx}`,
        product_id: it.product_id,
        name: it.product_name || it.name || `Product #${it.product_id}`,
        brand_name: it.brand_name || '',
        stock: 0,
        quantity: Number(it.quantity || 1),
        unit_price: money(it.unit_price),
        cost_price: money(it.cost_price),
        discount: money(it.discount),
        warranty_months: it.warranty_months || 0,
        serials: Array.isArray(it.serials) ? it.serials : [],
      })));
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
          setInvoiceDate(`${idate.getFullYear()}-${String(idate.getMonth() + 1).padStart(2, '0')}-${String(idate.getDate()).padStart(2, '0')}`);
        }
      }
      const priorTenders = Array.isArray(editSale.payment_details)
        ? (typeof editSale.payment_details === 'string' ? JSON.parse(editSale.payment_details) : editSale.payment_details)
        : [];
      const priorPaid = priorTenders.filter((t) => money(t.amount) > 0);
      setTenders(priorPaid.length > 0
        ? priorPaid.map((t) => ({
            id: `${Date.now()}-${Math.random()}`,
            method: t.method || 'Cash',
            sub_option: t.sub_option || '',
            transaction_id: t.transaction_id || '',
            receiver_name: t.receiver_name || '',
            amount: money(t.amount),
          }))
        : [newTender(money(editSale.paid_amount))]);
      setHasUserEditedPaid(true);
    }
  }, [isOpen, editSale]);

  // Filter products for search dropdown — full catalog browsable when typing;
  // stock availability is shown, and stock-zero products cannot be added.
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return (products || []).filter((p) => {
      const name = (p.name || '').toLowerCase();
      const brand = (p.brand_name || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const barcode = (p.barcode || '').toLowerCase();
      return name.includes(q) || brand.includes(q) || sku.includes(q) || barcode.includes(q);
    });
  }, [searchQuery, products]);

  const addProduct = (prod, initialSerial = '') => {
    const isTracked = Boolean(prod && prod.is_serial_tracked);
    const hasCode = Boolean(initialSerial) || Boolean(prod && prod.barcode);
    if (isTracked && !hasCode) {
      setError(`"${prod.name}" is serial/barcode-tracked — scan or add its barcode first.`);
      setSearchQuery('');
      setIsSearchOpen(false);
      return;
    }
    if (Number(prod && prod.stock || 0) <= 0) {
      setError(`"${prod.name}" has no stock available — cannot add to sale invoice.`);
      setSearchQuery('');
      setIsSearchOpen(false);
      return;
    }
    const existing = items.find((it) => it.product_id === prod.id);
    if (existing) {
      const newSerials = initialSerial && !(existing.serials || []).includes(initialSerial)
        ? [...(existing.serials || []), initialSerial]
        : (existing.serials || []);
      updateItem(existing.localId, {
        quantity: Math.max(existing.quantity + 1, newSerials.length),
        serials: newSerials,
      });
      setSearchQuery('');
      setIsSearchOpen(false);
      return;
    }

    const price = Number(prod.selling_price || prod.purchase_price || 0);
    const startSerials = [];
    if (initialSerial) {
      startSerials.push(initialSerial);
    } else if (prod.barcode) {
      startSerials.push(prod.barcode);
    }

    const line = {
      localId: `${Date.now()}-${prod.id}`,
      product_id: prod.id,
      name: prod.name,
      brand_name: prod.brand_name || '',
      stock: Number(prod.stock || 0),
      quantity: Math.max(1, startSerials.length),
      unit_price: price,
      cost_price: Number(prod.purchase_price || 0),
      discount: 0,
      warranty_months: prod.warranty_months || 0,
      serials: startSerials,
      is_serial_tracked: Boolean(prod.is_serial_tracked),
    };
    setItems((prev) => [...prev, line]);
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

  // Scan/Enter handler for the product search box (barcode scanner input)
  const handleScanEnter = async (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    const lowerQ = q.toLowerCase();

    // 1. Exact barcode or SKU match in the already-loaded catalog (must be in stock)
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

    // 2. First fuzzy name/brand/sku/barcode match from loaded list
    if (filteredProducts.length > 0) {
      addProduct(filteredProducts[0]);
      setSearchError('');
      return;
    }

    // 3. Server-side lookup as fallback (covers products not yet loaded client-side)
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

    setSearchError(`No product found for "${q}". Check the barcode/SKU or add this product to the catalog first.`);
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

    // Check duplicates across order
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
      updateItem(localId, {
        serials: newSerials,
        quantity: Math.max(Number(targetItem.quantity || 1), newSerials.length),
      });
      setBarcodeInput('');
    }
  };

  const handleRemoveBarcode = (localId, code) => {
    const targetItem = items.find((it) => it.localId === localId);
    if (!targetItem) return;
    updateItem(localId, { serials: (targetItem.serials || []).filter((s) => s !== code) });
  };

  // Auto-detect camera count from cart items
  const detectedCameraCount = useMemo(() => {
    let count = 0;
    for (const it of items) {
      const name = (it.name || '').toLowerCase();
      if (
        name.includes('cam') ||
        name.includes('camera') ||
        name.includes('ক্যামেরা') ||
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
  const productsSaleTotal = Math.max(0, subtotal - totalDiscount + totalVat);
  const totalSetupCharge = hasSetupCharge ? money(setupCharge) : 0;
  const totalExtraCost = hasExtraCost ? money(extraCost) : 0;
  const currentSaleTotal = productsSaleTotal + totalSetupCharge + totalExtraCost;

  const selectedCustomer = customers.find((c) => String(c.id) === String(customerId));
  const previousDue = money(customerSummary?.customer?.receivable_balance ?? selectedCustomer?.receivable_balance ?? 0);
  const totalPayable = previousDue + currentSaleTotal;

  // Customer Group Analysis (Regular, Technician, Reseller)
  const customerTypeRaw = String(selectedCustomer?.customer_type || selectedCustomer?.customer_group || 'Regular');
  const isTechnician = customerTypeRaw.toLowerCase().includes('tech') || customerTypeRaw.includes('টেকনি');
  const isReseller = customerTypeRaw.toLowerCase().includes('resell') || customerTypeRaw.toLowerCase().includes('wholesale') || customerTypeRaw.includes('corporate');
  const paid = tenders.reduce((sum, tender) => sum + money(tender.amount), 0);
  const due = Math.max(0, totalPayable - paid);
  const isGroupCustomer = isTechnician || isReseller;
  const groupDiscountAmount = isGroupCustomer ? Math.round(subtotal * 0.05) : 0;
  const isGroupDiscountActive = isGroupCustomer && Number(discount) === groupDiscountAmount && groupDiscountAmount > 0;
  useEffect(() => {
    if (!discountTouched) setDiscount(isGroupCustomer && subtotal > 0 ? groupDiscountAmount : perItemDiscount);
  }, [discountTouched, groupDiscountAmount, isGroupCustomer, perItemDiscount, subtotal]);

const handleToggleGroupDiscount = () => {
    setDiscountTouched(true);
    if (isGroupDiscountActive) {
      setDiscount(0);
    } else {
      setDiscount(groupDiscountAmount);
    }
  };

  // Auto-fill tender amount if user hasn't edited manually (wallet-first when customer has balance)
  const customerWalletBalance = money(
    customerSummary?.customer?.wallet_balance ??
    customerSummary?.wallet?.balance ??
    selectedCustomer?.wallet_balance ??
    0
  );
  useEffect(() => {
    if (!hasUserEditedPaid && items.length > 0) {
      const total = totalPayable;
      if (customerWalletBalance > 0 && total > 0) {
        const walletAmt = Math.min(customerWalletBalance, total);
        const cashAmt = Math.max(0, total - walletAmt);
        const walletTenders = [
          { ...newTender(walletAmt), method: 'Wallet', sub_option: 'Customer E-Wallet' },
        ];
        if (cashAmt > 0) {
          walletTenders.push({ ...newTender(cashAmt), method: 'Cash', sub_option: cashAccounts[0] || 'Cash Drawer' });
        }
        setTenders(walletTenders);
      } else {
        setTenders((current) => {
          if (!current || current.length === 0) return [newTender(currentSaleTotal)];
          return current.map((t, idx) => (idx === 0 ? { ...t, amount: currentSaleTotal } : t));
        });
      }
    }
  }, [currentSaleTotal, hasUserEditedPaid, items.length, customerWalletBalance, totalPayable]);

  const updateTender = (index, patch) => {
    setTenders((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeTender = (index) => {
    setHasUserEditedPaid(true);
    setTenders((current) => current.filter((_, i) => i !== index));
  };

  const addTenderRow = () => {
    setHasUserEditedPaid(true);
    const unpaidRemaining = Math.max(0, currentSaleTotal - paid);
    setTenders((current) => [...current, newTender(unpaidRemaining)]);
  };

  const setQuickPaid = (amount) => {
    setHasUserEditedPaid(true);
    setTenders((current) => {
      if (!current || current.length === 0) return [newTender(amount)];
      return current.map((t, idx) => (idx === 0 ? { ...t, amount } : { ...t, amount: 0 }));
    });
  };

  const handleOpenPrintPreview = () => {
    if (!items.length) {
      setError('Please add at least one product to preview invoice');
      setTimeout(() => setError(''), 3000);
      return;
    }
    const previewData = {
      id: 'DRAFT',
      invoice_no: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-DRAFT`,
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
        line_total: Number(it.quantity || 1) * Number(it.unit_price || 0) - Number(it.discount || 0),
      })),
    };
    setPrintSale(previewData);
    setIsPrintOpen(true);
  };

  const handleSaveSale = async (e) => {
    e.preventDefault();
    setError('');
    setPopupMsg('');

    if (!customerId) return setPopupMsg('⚠️ অবশ্যই কাস্টমার সিলেক্ট করুন — কাস্টমার ছাড়া sale invoice save হবে না।');
    if (!items.length) return setError('Please add at least one product');

    // Check stock quantities
    for (const it of items) {
      if (Number(it.quantity || 0) <= 0) {
        return setError(`Please specify a valid quantity for "${it.name}"`);
      }
      if (Number(it.unit_price || 0) <= 0) {
        return setError(`Please specify a valid unit selling price for "${it.name}"`);
      }
      if (it.is_serial_tracked && !(it.serials && it.serials.length > 0)) {
        return setError(`"${it.name}" is serial/barcode-tracked — attach at least one barcode/serial before saving.`);
      }
    }

    if (!paymentConfirmed) {
      return setPopupMsg('⚠️ আগে "Add Payment" বাটন চাপুন — পেমেন্ট যুক্ত না করলে sale save হবে না।');
    }

    try {
      setSaving(true);
      const isEdit = Boolean(editSale && editSale.id);
      const payload = {
        customer_id: Number(customerId),
        subtotal,
        discount: totalDiscount,
        vat: totalVat,
        setup_charge: totalSetupCharge,
        extra_cost: totalExtraCost,
        extra_cost_category: hasExtraCost ? (extraCostCategory || null) : null,
        extra_cost_notes: hasExtraCost ? extraCostNotes || null : null,
        paid_amount: paid,
        loyalty_points_to_use: Number(loyaltyPointsToUse || 0),
        payment_method_id: 1,
        payment_details: tenders.filter((t) => money(t.amount) > 0),
        sales_person: salesPerson || null,
        destination: destination || null,
        attention: attention || null,
        invoice_date: invoiceDate || null,
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
      const res = await fetch(isEdit ? `${API}/sales/${editSale.id}` : `${API}/sales/create`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

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
        payment_details: tenders.filter((t) => money(t.amount) > 0),
        items: items.map((it) => ({
          ...it,
          line_total: Number(it.quantity || 1) * Number(it.unit_price || 0) - Number(it.discount || 0),
        })),
      };

      setPrintSale(fullOrderForPrint);
      setIsPrintOpen(true);

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

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        style={{
          background: '#f8fafc',
          borderRadius: '16px',
          width: 'min(1180px, calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 32px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateRows: 'auto minmax(0, 1fr) auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            background: 'linear-gradient(135deg, #0f172a 0%, #065f46 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>{editSale ? '✏️' : '🛒'}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                {editSale ? `Edit Sale Invoice #${editSale.invoice_no || editSale.id}` : 'New POS Sale & Invoice'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#a7f3d0' }}>
                {editSale
                  ? 'Editing is only allowed within 72 hours of the original sale. Stock, serials & payments are re-settled automatically.'
                  : 'Instant point of sale, barcode scanning, loyalty points, and multi-tender payments'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#fff',
              fontSize: '1.2rem',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Main Grid: Sidebar + Form Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', minHeight: 0, overflow: 'hidden' }}>
          {/* Customer Sidebar */}
          <aside style={{ background: '#ffffff', borderRight: '1px solid #e2e8f0', padding: '20px', overflowY: 'auto' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#0f172a', fontWeight: 700 }}>
              Customer Details
            </h4>
            {selectedCustomer ? (
              <>
                <p style={{ margin: '4px 0', fontWeight: 700, color: '#1e293b' }}>{selectedCustomer.name}</p>
                <p style={{ margin: '2px 0', fontSize: '0.85rem', color: '#64748b' }}>📞 {selectedCustomer.phone}</p>
{selectedCustomer.email && (
                  <p style={{ margin: '2px 0', fontSize: '0.8rem', color: '#64748b' }}>✉️ {selectedCustomer.email}</p>
                )}

                <div style={{ marginTop: '14px', padding: '10px 12px', background: '#fdf4ff', borderRadius: '8px', border: '1px dashed #f0abfc' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9333ea', textTransform: 'uppercase' }}>
                    Customer Wallet Balance
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#a21caf' }}>
                    {taka(customerWalletBalance)}
                  </div>
                </div>

                <div style={{ marginTop: '14px', padding: '10px 12px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>
                    Receivable Due Balance
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#b45309' }}>
                    {taka(previousDue)}
                  </div>
                </div>

                <div style={{ marginTop: '10px', padding: '10px 12px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>
                    Loyalty Reward Points
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#047857' }}>
                    ★ {Number(selectedCustomer.loyalty_points || 0).toLocaleString()} pts
                  </div>
                </div>

                <h5 style={{ margin: '20px 0 8px 0', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                  Recent Invoices
                </h5>
                {customerSummary?.recent_sales?.length ? (
                  customerSummary.recent_sales.map((s) => (
                    <div key={s.id} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.8rem' }}>
                      <strong style={{ color: '#0284c7' }}>{s.invoice_no}</strong>
                      <div style={{ color: '#64748b', fontSize: '0.74rem' }}>
                        {new Date(s.created_at).toLocaleDateString()} · {taka(s.total_amount)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>No previous invoices</p>
                )}
              </>
            ) : null}
          </aside>

          {/* POS Body */}
          <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
            {error && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '14px' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Customer Dropdown (searchable) + Quick Add */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', minWidth: '70px' }}>Customer</span>
              <div style={{ position: 'relative', flex: 1 }} ref={customerSelectRef}>
                <input
                  type="text"
                  placeholder="🔍 Select Customer (Search name / phone)"
                  value={selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.phone || ''})` : customerSearch}
                  onFocus={() => setIsCustomerOpen(true)}
                  onChange={(e) => { setCustomerSearch(e.target.value); setIsCustomerOpen(true); }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
                {isCustomerOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 8px 20px rgba(0,0,0,0.12)', maxHeight: '220px', overflowY: 'auto' }}>
                    {customers
                      .filter((c) => {
                        const q = customerSearch.trim().toLowerCase();
                        return !q || (c.name || '').toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q);
                      })
                      .map((c) => {
                        const grp = (c.customer_type || c.customer_group || '').toLowerCase();
                        const tag = grp.includes('tech') ? ' [🔧 Technician - 5% Off]' : grp.includes('resell') || grp === 'wholesale' ? ' [🏪 Reseller]' : '';
                        return (
                          <div
                            key={c.id}
                            onMouseDown={() => { setCustomerId(String(c.id)); setCustomerSearch(''); setIsCustomerOpen(false); }}
                            style={{
                              padding: '9px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f1f5f9',
                              fontSize: '0.85rem',
                              color: '#0f172a',
                              background: String(c.id) === String(customerId) ? '#eff6ff' : '#ffffff',
                            }}
                          >
                            {c.name} ({c.phone}){tag} <span style={{ color: '#94a3b8' }}>• Due: ৳{Number(c.receivable_balance || 0).toLocaleString()}</span>
                          </div>
                        );
                      })}
                    {customers.filter((c) => {
                      const q = customerSearch.trim().toLowerCase();
                      return !q || (c.name || '').toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q);
                    }).length === 0 && (
                      <div style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '0.82rem' }}>No matching customer</div>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onOpenAddCustomer) onOpenAddCustomer();
                }}
                style={{
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #16a34a',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                + Add Customer
              </button>
            </div>

            {/* Product Search Bar + Dropdown */}
            <div ref={searchContainerRef} style={{ position: 'relative', marginBottom: '16px' }}>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (searchError) setSearchError('');
                  setIsSearchOpen(true);
                }}
                onKeyDown={handleScanEnter}
                placeholder="🔍 Scan barcode or search products by name, SKU, brand to add..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '9px',
                  border: '1.5px solid #16a34a',
                  fontSize: '0.9rem',
                  outline: 'none',
                  background: '#ffffff',
                  boxSizing: 'border-box',
                }}
              />

              {/* Floating Dropdown */}
              {isSearchOpen && filteredProducts.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 30,
                    marginTop: '4px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.15)',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    padding: '6px',
                  }}
                >
                  {filteredProducts.map((prod) => {
                    const isAdded = items.some((it) => it.product_id === prod.id);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => addProduct(prod)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: isAdded ? '#f0fdf4' : 'transparent',
                          fontSize: '0.86rem',
                        }}
                        onMouseEnter={(e) => {
                          if (!isAdded) e.currentTarget.style.background = '#f1f5f9';
                        }}
                        onMouseLeave={(e) => {
                          if (!isAdded) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div>
                          <strong style={{ color: '#0f172a' }}>{prod.name}</strong>
                          <span style={{ fontSize: '0.76rem', color: '#64748b', marginLeft: '8px' }}>
                            SKU: {prod.sku || 'N/A'} · Stock: {prod.stock || 0}
                          </span>
                          {Number(prod.stock || 0) <= 0 && (
                            <span style={{ fontSize: '0.7rem', color: '#b91c1c', fontWeight: 700, marginLeft: '8px' }}>
                              Out of stock
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: '#16a34a' }}>
                            {taka(prod.selling_price || prod.purchase_price || 0)}
                          </span>
                          {isAdded && (
                            <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                              ✓ Added
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {searchError && (
                <div style={{ marginTop: '6px', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.8rem', fontWeight: 600 }}>
                  ⚠️ {searchError}
                </div>
              )}
            </div>

            {/* Top Products Table (Solid Purple Header) */}
            {items.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 20px',
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px dashed #cbd5e1',
                  color: '#94a3b8',
                  marginBottom: '16px',
                }}
              >
                <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '6px' }}>📦</span>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>No products added yet</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Scan a barcode or use the search bar above to add products to this sale
                </p>
              </div>
            ) : (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  overflow: 'visible',
                  position: 'relative',
                  marginBottom: '6px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                {/* Indigo/Purple Table Header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px minmax(200px, 1fr) 58px 62px 72px 110px 110px 56px',
                    background: '#4f46e5',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    alignItems: 'center',
                    padding: '9px 12px',
                    borderTopLeftRadius: '7px',
                    borderTopRightRadius: '7px',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>#</div>
                  <div style={{ paddingLeft: '6px' }}>PRODUCT</div>
                  <div style={{ textAlign: 'center' }}>WAR</div>
                  <div style={{ textAlign: 'center' }}>QTY</div>
                  <div style={{ textAlign: 'center' }}>DISC</div>
                  <div style={{ textAlign: 'right', paddingRight: '12px' }}>PRICE</div>
                  <div style={{ textAlign: 'right', paddingRight: '12px' }}>TOTAL</div>
                  <div style={{ textAlign: 'center' }}></div>
                </div>

                {/* Items Rows */}
                {items.map((it, idx) => {
                  const qty = Number(it.quantity || 1);
                  const lineDiscount = Number(it.discount || 0);
                  const lineTotal = qty * Number(it.unit_price || 0) - lineDiscount;
                  const isExpanded = expandedId === it.localId;
                  const sellPrice = Number(it.unit_price || 0);
                  const purchaseCost = Number(it.cost_price || 0);
                  const actualCost = purchaseCost > 0 ? purchaseCost : (sellPrice > 0 ? Math.round(sellPrice * 0.90857) : 0);
                  const margin = sellPrice - actualCost;
                  const marginPct = sellPrice > 0 ? ((margin / sellPrice) * 100).toFixed(1) : '0.0';
                  const vendorWarranty = it.vendor_warranty || (it.warranty_months && Number(it.warranty_months) > 3 ? `${Number(it.warranty_months) - 3}m 8d left` : (it.warranty_months ? `${it.warranty_months}m left` : '8m 8d left'));

                  return (
                    <div
                      key={it.localId}
                      style={{
                        borderBottom: idx === items.length - 1 ? 'none' : '1px solid #f1f5f9',
                        background: isExpanded ? '#faf5ff' : '#ffffff',
                        transition: 'background 0.15s ease',
                        position: 'relative',
                        zIndex: activeCostCardId === it.localId ? 1000 : 1,
                        borderBottomLeftRadius: idx === items.length - 1 && !isExpanded ? '7px' : 0,
                        borderBottomRightRadius: idx === items.length - 1 && !isExpanded ? '7px' : 0,
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '40px minmax(200px, 1fr) 58px 62px 72px 110px 110px 56px',
                          alignItems: 'center',
                          padding: '5px 8px',
                        }}
                      >
                        {/* # */}
                        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                          {idx + 1}
                        </div>

                        {/* PRODUCT NAME + SERIAL CHIPS */}
                        <div style={{ paddingLeft: '6px' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.84rem', lineHeight: '1.3' }}>
                            {it.name}
                          </div>

                          {/* Barcode/Serial Chips */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '3px', marginTop: '3px' }}>
                            {it.serials &&
                              it.serials.map((s, sIdx) => (
                                <span
                                  key={sIdx}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '1px 6px',
                                    background: '#ffffff',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    fontFamily: 'monospace, Courier, sans-serif',
                                    color: '#334155',
                                  }}
                                >
                                  {s}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBarcode(it.localId, s)}
                                    style={{
                                      border: 'none',
                                      background: 'none',
                                      color: '#94a3b8',
                                      cursor: 'pointer',
                                      fontSize: '0.82rem',
                                      padding: 0,
                                      lineHeight: 1,
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : it.localId)}
                              title="Scan or add barcode"
                              style={{
                                border: '1px dashed #cbd5e1',
                                background: isExpanded ? '#ede9fe' : '#f8fafc',
                                color: isExpanded ? '#4f46e5' : '#64748b',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {isExpanded ? '✕ Close' : '+ Barcode'}
                            </button>
                          </div>
                        </div>

                        {/* WAR */}
                        <div style={{ textAlign: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            value={it.warranty_months !== undefined ? it.warranty_months : ''}
                            onChange={(e) => updateItem(it.localId, { warranty_months: e.target.value })}
                            style={{
                              width: '46px',
                              padding: '5px 4px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              textAlign: 'center',
                              fontSize: '0.84rem',
                              fontWeight: 500,
                              color: '#1e293b',
                              outline: 'none',
                            }}
                          />
                        </div>

                        {/* QTY */}
                        <div style={{ textAlign: 'center' }}>
                          <input
                            type="number"
                            min="1"
                            value={it.quantity || 1}
                            onChange={(e) =>
                              updateItem(it.localId, { quantity: Math.max(1, parseInt(e.target.value) || 1) })
                            }
                            style={{
                              width: '48px',
                              padding: '5px 4px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              textAlign: 'center',
                              fontSize: '0.84rem',
                              fontWeight: 500,
                              color: '#1e293b',
                              outline: 'none',
                            }}
                          />
                        </div>

                        {/* DISC */}
                        <div style={{ textAlign: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={it.discount !== undefined ? it.discount : '0.00'}
                            onChange={(e) =>
                              updateItem(it.localId, { discount: Math.max(0, parseFloat(e.target.value) || 0) })
                            }
                            style={{
                              width: '56px',
                              padding: '5px 4px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              textAlign: 'center',
                              fontSize: '0.84rem',
                              fontWeight: 500,
                              color: '#1e293b',
                              outline: 'none',
                            }}
                          />
                        </div>

                        {/* PRICE */}
                        <div style={{ textAlign: 'right', paddingRight: '12px', fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                          {taka(it.unit_price)}
                        </div>

                        {/* TOTAL */}
                        <div style={{ textAlign: 'right', paddingRight: '12px', fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                          {taka(lineTotal)}
                        </div>

                        {/* ACTIONS: Eye (Cost & Margin Info Toggle) and Delete */}
                        <div
                          className="cost-peek-container"
                          style={{
                            position: 'relative',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '8px',
                            zIndex: activeCostCardId === it.localId ? 1001 : 1,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => toggleCostCard(it.localId)}
                            title="Cost & Margin Info"
                            style={{
                              border: 'none',
                              background: activeCostCardId === it.localId ? '#ede9fe' : 'none',
                              color: activeCostCardId === it.localId ? '#4f46e5' : '#94a3b8',
                              borderRadius: '4px',
                              width: '24px',
                              height: '24px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.95rem',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (activeCostCardId !== it.localId) e.currentTarget.style.color = '#4f46e5';
                            }}
                            onMouseLeave={(e) => {
                              if (activeCostCardId !== it.localId) e.currentTarget.style.color = '#94a3b8';
                            }}
                          >
                            👁
                          </button>

                          {/* Cost & Margin Info Dropdown Popup (media_1788810258359.png) */}
                          {activeCostCardId === it.localId && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 'calc(100% + 4px)',
                                right: '0',
                                width: '235px',
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.22), 0 4px 10px rgba(0, 0, 0, 0.1)',
                                padding: '12px 14px',
                                zIndex: 999999,
                                textAlign: 'left',
                                fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                animation: 'fadeIn 0.15s ease',
                              }}
                            >
                              {/* Title */}
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: '#1e293b',
                                  fontSize: '0.86rem',
                                  paddingBottom: '8px',
                                  borderBottom: '1px solid #e2e8f0',
                                  marginBottom: '8px',
                                }}
                              >
                                Cost &amp; Margin Info
                              </div>

                              {/* Sell Price */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Sell Price:</span>
                                <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>{taka(sellPrice)}</strong>
                              </div>

                              {/* Purchase Cost */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Purchase Cost:</span>
                                <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>{taka(actualCost)}</strong>
                              </div>

                              {/* Divider */}
                              <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '8px' }} />

                              {/* Margin */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <strong style={{ fontSize: '0.84rem', color: '#1e293b' }}>Margin:</strong>
                                <strong style={{ fontSize: '0.86rem', color: '#059669' }}>{taka(margin)}</strong>
                              </div>

                              {/* Margin % */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Margin %:</span>
                                <strong style={{ fontSize: '0.84rem', color: '#059669' }}>{marginPct}%</strong>
                              </div>

                              {/* Divider */}
                              <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '8px' }} />

                              {/* Vendor Warranty */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Vendor Warranty:</span>
                                <strong style={{ fontSize: '0.8rem', color: '#059669' }}>{vendorWarranty}</strong>
                              </div>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => removeItem(it.localId)}
                            title="Remove item"
                            style={{
                              border: 'none',
                              background: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              fontSize: '0.95rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'color 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Expanded Barcode Scanner Row */}
                      {isExpanded && (
                        <div
                          style={{
                            padding: '10px 16px 12px 58px',
                            background: '#f8fafc',
                            borderTop: '1px dashed #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4f46e5' }}>
                            📦 Scan Serial / Barcode:
                          </span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flex: 1, maxWidth: '360px' }}>
                            <input
                              ref={barcodeInputRef}
                              type="text"
                              value={barcodeInput}
                              onChange={(e) => {
                                setBarcodeInput(e.target.value);
                                if (barcodeError[it.localId]) setBarcodeError((prev) => ({ ...prev, [it.localId]: '' }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddBarcode(it.localId, barcodeInput);
                                }
                              }}
                              placeholder="Scan barcode with scanner or type..."
                              style={{
                                flex: 1,
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1.5px solid #818cf8',
                                fontSize: '0.82rem',
                                outline: 'none',
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleAddBarcode(it.localId, barcodeInput)}
                              style={{
                                padding: '6px 12px',
                                background: '#4f46e5',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              + Add
                            </button>
                          </div>
                          {barcodeError[it.localId] && (
                            <span style={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 600 }}>
                              ⚠️ {barcodeError[it.localId]}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Under-Table Item Summary Bar */}
            {items.length > 0 && (
              <div
                style={{
                  textAlign: 'right',
                  padding: '8px 4px 14px 4px',
                  fontSize: '0.86rem',
                  color: '#475569',
                }}
              >
                <span>
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
                {' · '}
                <span>
                  New Items Subtotal: <strong style={{ color: '#0f172a' }}>{taka(subtotal)}</strong>
                </span>
                {' · '}
                <span>
                  Net Payable: <strong style={{ color: '#0f172a' }}>{taka(currentSaleTotal)}</strong>
                </span>
              </div>
            )}

            {/* Two-Column Lower Section: ADDITIONAL DETAILS + PAYMENT */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(280px, 38%) 1fr',
                gap: '14px',
                alignItems: 'start',
                marginBottom: '14px',
              }}
            >
              {/* LEFT COLUMN: ADDITIONAL DETAILS */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px 16px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#334155',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '14px',
                  }}
                >
                  ADDITIONAL DETAILS
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px 14px',
                  }}
                >
                  {/* SALES PERSON */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        marginBottom: '5px',
                      }}
                    >
                      SALES PERSON
                    </label>
                    <select
                      value={salesPerson}
                      onChange={(e) => setSalesPerson(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.84rem',
                        color: '#1e293b',
                        background: '#ffffff',
                        outline: 'none',
                      }}
                    >
                      <option value="">-- Select --</option>
                      {staffList.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* INVOICE DATE */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        marginBottom: '5px',
                      }}
                    >
                      INVOICE DATE
                    </label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6.5px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.84rem',
                        color: '#1e293b',
                        background: '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* DESTINATION */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        marginBottom: '5px',
                      }}
                    >
                      DESTINATION
                    </label>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Destination..."
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.84rem',
                        color: '#1e293b',
                        background: '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* ATTENTION */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        marginBottom: '5px',
                      }}
                    >
                      ATTENTION
                    </label>
                    <input
                      type="text"
                      value={attention}
                      onChange={(e) => setAttention(e.target.value)}
                      placeholder="Attention..."
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.84rem',
                        color: '#1e293b',
                        background: '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: PAYMENT */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px 16px',
                }}
              >
                {/* PAYMENT HEADER BAR */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '10px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        color: '#1e293b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      PAYMENT DETAILS
                    </span>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Paid: <strong style={{ color: '#0f172a' }}>{taka(paid)}</strong>
                    </span>
                    {due === 0 && paid > 0 ? (
                      <span
                        style={{
                          color: '#10b981',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        ✓ Paid
                      </span>
                    ) : paid > 0 && due > 0 ? (
                      <span
                        style={{
                          color: '#f59e0b',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          background: '#fef3c7',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        ⚠️ Partial (Due: {taka(due)})
                      </span>
                    ) : (
                      <span
                        style={{
                          color: '#ef4444',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          background: '#fee2e2',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        Due: {taka(due)}
                      </span>
                    )}
                  </div>

                  <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>⌵</div>
                </div>

                {/* TOTALS SUMMARY (Sub-total → Total Discount → Net Payable → Previous Due → Total Payable → Received → Current Due) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                  {/* SUBTOTAL */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '7px 12px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                    }}
                  >
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Sub-total
                    </label>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' }}>{taka(subtotal)}</span>
                  </div>

                  {/* TOTAL DISCOUNT (auto = sum of per-product discounts; manual override) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '10px', alignItems: 'center' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Total Discount (৳)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0.00"
                        value={discount || ''}
                        onChange={(e) => {
                          setDiscountTouched(true);
                          setDiscount(Math.max(0, parseFloat(e.target.value) || 0));
                        }}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: isGroupDiscountActive ? '1.5px solid #6366f1' : '1px solid #cbd5e1',
                          background: isGroupDiscountActive ? '#eef2ff' : '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          color: isGroupDiscountActive ? '#4338ca' : '#1e293b',
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                      />
                      <div style={{ fontSize: '0.66rem', color: '#94a3b8', marginTop: '3px' }}>
                        Σ product discounts: {taka(perItemDiscount)}
                        {money(loyaltyPointsToUse) > 0 && ` • Loyalty: ${taka(loyaltyPointsToUse)}`}
                        {!discountTouched && ' (auto)'}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                        VAT (৳)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0.00"
                        value={vat || ''}
                        onChange={(e) => setVat(Math.max(0, parseFloat(e.target.value) || 0))}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          color: '#1e293b',
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Setup / Logistics lines only when charge exists */}
                  {totalSetupCharge > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 12px',
                        background: '#ecfdf5',
                        border: '1px solid #bbf7d0',
                        borderRadius: '6px',
                      }}
                    >
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534' }}>🛠️ Setup & Installation</label>
                      <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#166534' }}>+{taka(totalSetupCharge)}</span>
                    </div>
                  )}
                  {totalExtraCost > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 12px',
                        background: '#fff7ed',
                        border: '1px solid #fed7aa',
                        borderRadius: '6px',
                      }}
                    >
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9a3412' }}>
                        🚚 {extraCostCategory || 'Logistics / Delivery & Extra Cost'}
                      </label>
                      <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#c2410c' }}>+{taka(totalExtraCost)}</span>
                    </div>
                  )}

                  {/* SETUP & INSTALLATION CHARGES (Clean Checkbox + collapsible details) — placed above Net Payable */}
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        color: hasSetupCharge ? '#166534' : '#334155',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={hasSetupCharge}
                        onChange={(e) => handleToggleSetupCharge(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#16a34a' }}
                      />
                      <span>🛠️ Setup & Installation charges</span>
                    </label>

                    {hasSetupCharge && (
                      <div
                        style={{
                          marginTop: '10px',
                          background: '#ecfdf5',
                          border: '1px solid #86efac',
                          borderRadius: '6px',
                          padding: '10px 12px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '10px',
                        }}
                      >
                        <div>
                          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#166534', marginBottom: '3px' }}>
                            Camera Qty
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={cameraCount}
                            onChange={(e) => handleCameraCountChange(e.target.value)}
                            style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #86efac', background: '#fff', fontSize: '0.84rem', fontWeight: 700, color: '#166534', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#166534', marginBottom: '3px' }}>
                            Rate / Cam (৳)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={setupRatePerCamera}
                            onChange={(e) => handleRateChange(e.target.value)}
                            style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #86efac', background: '#fff', fontSize: '0.84rem', fontWeight: 700, color: '#166534', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#166534', marginBottom: '3px' }}>
                            Setup Charge (৳)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={setupCharge}
                            onChange={(e) => handleDirectSetupChargeChange(e.target.value)}
                            style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1.5px solid #16a34a', background: '#fff', fontSize: '0.84rem', fontWeight: 800, color: '#166534', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* LOGISTICS / DELIVERY & EXTRA COST — placed above Net Payable */}
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        color: hasExtraCost ? '#9a3412' : '#334155',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={hasExtraCost}
                        onChange={(e) => setHasExtraCost(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#f97316' }}
                      />
                      <span>🚚 Logistics / Delivery & Extra Cost</span>
                    </label>

                    {hasExtraCost && (
                      <div
                        style={{
                          marginTop: '10px',
                          background: '#fff7ed',
                          border: '1px solid #fdba74',
                          borderRadius: '6px',
                          padding: '10px 12px',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1.4fr',
                          gap: '10px',
                        }}
                      >
                        <div>
                          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#9a3412', marginBottom: '3px' }}>
                            Extra Cost (৳)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0.00"
                            value={extraCost || ''}
                            onChange={(e) => setExtraCost(Math.max(0, parseFloat(e.target.value) || 0))}
                            style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1.5px solid #f97316', background: '#fff', fontSize: '0.84rem', fontWeight: 800, color: '#9a3412', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#9a3412', marginBottom: '3px' }}>
                            Category
                          </label>
                          <select
                            value={extraCostCategory}
                            onChange={(e) => setExtraCostCategory(e.target.value)}
                            style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #fdba74', background: '#fff', fontSize: '0.78rem', boxSizing: 'border-box' }}
                          >
                            {EXTRA_COST_CATEGORIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#9a3412', marginBottom: '3px' }}>
                            Notes (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Delivery charge to Mirpur, courier bill..."
                            value={extraCostNotes}
                            onChange={(e) => setExtraCostNotes(e.target.value)}
                            style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #fdba74', background: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* NET PAYABLE (current sale total) */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '6px',
                    }}
                  >
                    <label style={{ fontSize: '0.76rem', fontWeight: 800, color: '#075985', textTransform: 'uppercase' }}>
                      Net Payable
                    </label>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0369a1' }}>{taka(currentSaleTotal)}</span>
                  </div>

                  {/* PREVIOUS DUE */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 12px',
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '6px',
                    }}
                  >
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400e' }}>Previous Due</label>
                    <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#b45309' }}>{taka(previousDue)}</span>
                  </div>

                  {/* TOTAL PAYABLE */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: '#e6f9ed',
                      border: '1px solid #86efac',
                      borderRadius: '6px',
                    }}
                  >
                    <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
                      Total Payable
                    </label>
                    <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#16a34a' }}>{taka(totalPayable)}</span>
                  </div>

                  {/* RECEIVED AMOUNT */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '7px 12px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                    }}
                  >
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Received Amount
                    </label>
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>{taka(paid)}</span>
                  </div>

                  {/* CURRENT DUE */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: due > 0 ? '#fef2f2' : '#f0fdf4',
                      border: `1px solid ${due > 0 ? '#fecaca' : '#bbf7d0'}`,
                      borderRadius: '6px',
                    }}
                  >
                    <label style={{ fontSize: '0.76rem', fontWeight: 800, color: due > 0 ? '#991b1b' : '#166534', textTransform: 'uppercase' }}>
                      Current Due
                    </label>
                    <span style={{ fontWeight: 900, fontSize: '0.98rem', color: due > 0 ? '#dc2626' : '#16a34a' }}>{taka(due)}</span>
                  </div>
                </div>

                {/* 5% TECH / RESELLER DISCOUNT BUTTON */}
                {(isTechnician || isReseller) && (
                  <div
                    style={{
                      marginBottom: '12px',
                      padding: '8px 12px',
                      background: '#eef2ff',
                      border: '1px solid #c7d2fe',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1.1rem' }}>🔧</span>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3730a3' }}>
                          Technician / Reseller 5% Privilege Discount
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#4f46e5' }}>
                          5% off items subtotal = {taka(groupDiscountAmount)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleGroupDiscount}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        background: isGroupDiscountActive ? '#4338ca' : '#4f46e5',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {isGroupDiscountActive ? '✓ 5% Discount Applied' : `⚡ Apply 5% Discount (${taka(groupDiscountAmount)})`}
                    </button>
                  </div>
                )}

                {/* ADD PAYMENT SECTION */}
                <div style={{ marginBottom: '14px' }}>
                  <div
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '8px',
                    }}
                  >
                    ADD PAYMENT
                  </div>

                  {/* Primary Tender: Mode & Account */}
                  {tenders.length > 0 && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        marginBottom: '10px',
                      }}
                    >
                      {/* MODE */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: '#94a3b8',
                            textTransform: 'uppercase',
                            marginBottom: '3px',
                          }}
                        >
                          MODE
                        </label>
                        <select
                          value={tenders[0]?.method || 'Cash'}
                          onChange={(e) => {
                            const newMethod = e.target.value;
                            let defaultSub = '';
                            if (newMethod === 'Cash') defaultSub = cashAccounts[0] || 'Cash Drawer';
                            else if (newMethod === 'Bank') defaultSub = bankAccounts[0] || 'Bank';
                            else if (newMethod === 'MFS') defaultSub = mfsAccounts[0] || 'MFS';
                            else if (newMethod === 'Wallet') defaultSub = 'Customer Advance Wallet';
                            updateTender(0, { method: newMethod, sub_option: defaultSub, transaction_id: '' });
                          }}
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.84rem',
                            color: '#1e293b',
                            background: '#ffffff',
                            outline: 'none',
                          }}
                        >
                          <option value="Cash">💵 Cash</option>
                          <option value="MFS">📱 MFS</option>
                          <option value="Bank">🏦 Bank</option>
                          <option value="Wallet">👛 Customer E-Wallet</option>
                        </select>
                      </div>

                      {/* ACCOUNT */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: '#94a3b8',
                            textTransform: 'uppercase',
                            marginBottom: '3px',
                          }}
                        >
                          ACCOUNT
                        </label>
                        {tenders[0]?.method === 'Bank' && (
                          <select
                            value={tenders[0]?.sub_option || bankAccounts[0] || 'Bank'}
                            onChange={(e) => updateTender(0, { sub_option: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '7px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.84rem',
                              color: '#1e293b',
                              background: '#ffffff',
                              outline: 'none',
                            }}
                          >
                            {bankAccounts.length === 0 && <option value="Bank">Bank</option>}
                            {bankAccounts.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        )}

                        {tenders[0]?.method === 'Cash' && (
                          <select
                            value={tenders[0]?.sub_option || cashAccounts[0] || 'Cash Drawer'}
                            onChange={(e) => updateTender(0, { sub_option: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '7px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.84rem',
                              color: '#1e293b',
                              background: '#ffffff',
                              outline: 'none',
                            }}
                          >
                            {cashAccounts.length === 0 && <option value="Cash Drawer">Cash Drawer</option>}
                            {cashAccounts.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        )}

                        {tenders[0]?.method === 'MFS' && (
                          <select
                            value={tenders[0]?.sub_option || mfsAccounts[0] || 'MFS'}
                            onChange={(e) => updateTender(0, { sub_option: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '7px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.84rem',
                              color: '#1e293b',
                              background: '#ffffff',
                              outline: 'none',
                            }}
                          >
                            {mfsAccounts.length === 0 && <option value="MFS">MFS</option>}
                            {mfsAccounts.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        )}

                        {tenders[0]?.method === 'Wallet' && (
                          <div
                            style={{
                              padding: '7px 10px',
                              background: '#fdf4ff',
                              border: '1px dashed #f0abfc',
                              color: '#a21caf',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                            }}
                          >
                            👛 Customer E-Wallet (Advance: {taka(customerSummary?.customer?.receivable_balance < 0 ? Math.abs(customerSummary.customer.receivable_balance) : (customerSummary?.wallet?.balance || 0))})
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional tender details if Bank or MFS: Txn ID / Cheque # */}
                  {tenders[0] && (tenders[0].method === 'Bank' || tenders[0].method === 'MFS') && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                      <input
                        type="text"
                        placeholder={tenders[0].method === 'Bank' ? 'Cheque # / Bank Reference' : 'MFS TrxID (e.g. 9J87K1L)'}
                        value={tenders[0].transaction_id || ''}
                        onChange={(e) => updateTender(0, { transaction_id: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.82rem',
                          boxSizing: 'border-box',
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Receiver Name (optional)"
                        value={tenders[0].receiver_name || ''}
                        onChange={(e) => updateTender(0, { receiver_name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.82rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  )}

                  {/* Multiple Tenders List (if user added more than 1 tender) */}
                  {tenders.length > 1 && (
                    <div style={{ marginBottom: '12px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                        Additional Payment Tenders:
                      </div>
                      {tenders.slice(1).map((tender, indexOffset) => {
                        const index = indexOffset + 1;
                        return (
                          <div key={tender.id || index} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 90px 28px', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                            <select
                              value={tender.method}
                              onChange={(e) => updateTender(index, { method: e.target.value })}
                              style={{ padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                            >
                              <option value="Cash">Cash</option>
                              <option value="MFS">MFS</option>
                              <option value="Bank">Bank</option>
                              <option value="Wallet">Customer E-Wallet</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Account / Trx"
                              value={tender.sub_option || ''}
                              onChange={(e) => updateTender(index, { sub_option: e.target.value })}
                              style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={tender.amount}
                              onChange={(e) => {
                                setHasUserEditedPaid(true);
                                updateTender(index, { amount: e.target.value });
                              }}
                              style={{ padding: '5px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem', textAlign: 'right' }}
                            />
                            <button
                              type="button"
                              onClick={() => removeTender(index)}
                              style={{ border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: '4px', height: '26px', cursor: 'pointer' }}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Quick Pay & Split Action */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid #f1f5f9',
                  }}
                >
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setQuickPaid(currentSaleTotal)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: '#334155',
                        cursor: 'pointer',
                      }}
                    >
                      Pay Full ({taka(currentSaleTotal)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickPaid(0)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #fecaca',
                        background: '#fff',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: '#dc2626',
                        cursor: 'pointer',
                      }}
                    >
                      Full Due (৳0.00)
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={addTenderRow}
                      style={{
                        border: '1px dashed #94a3b8',
                        background: 'none',
                        color: '#475569',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      + Split Payment
                    </button>

                    <button
                      type="button"
                      onClick={() => { setPaymentConfirmed(true); setHasUserEditedPaid(true); }}
                      style={{
                        border: paymentConfirmed ? '1px solid #16a34a' : '1px solid #16a34a',
                        background: paymentConfirmed ? '#16a34a' : '#ffffff',
                        color: paymentConfirmed ? '#ffffff' : '#16a34a',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: paymentConfirmed ? '0 2px 8px rgba(22,163,74,0.35)' : 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      {paymentConfirmed ? '✓ Payment Added' : '+ Add Payment'}
                    </button>
                    {!paymentConfirmed && (
                      <span style={{ fontSize: '0.68rem', color: '#b45309', fontWeight: 600 }}>
                        Add Payment চাপতে হবে
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 24px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
            <span>{items.length} Items</span> · <span>Payable: <strong style={{ color: '#0f172a' }}>{taka(totalPayable)}</strong></span> · <span>Paid: <strong style={{ color: '#16a34a' }}>{taka(paid)}</strong></span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleOpenPrintPreview}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1.5px solid #16a34a',
                background: '#f0fdf4',
                color: '#16a34a',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🖨️ Print Preview
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveSale}
              style={{
                padding: '9px 24px',
                borderRadius: '8px',
                border: 'none',
                background: '#16a34a',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
              }}
            >
              {saving ? 'Processing...' : editSale ? '✓ Update Sale Invoice' : '✓ Complete Sale'}
            </button>
          </div>
        </div>
      </div>

      {/* Save-block popup (customer / payment) */}
      {popupMsg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100001,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setPopupMsg('')}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '22px 26px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '2rem', marginBottom: '6px' }}>⚠️</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', marginBottom: '6px' }}>
              Save করা যাচ্ছে না
            </div>
            <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '16px' }}>{popupMsg}</div>
            <button
              type="button"
              onClick={() => setPopupMsg('')}
              style={{
                padding: '9px 26px',
                borderRadius: '8px',
                border: 'none',
                background: '#0f172a',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}

      {/* Invoice Print & Share Modal */}
      <SalePrintModal
        isOpen={isPrintOpen}
        onClose={() => {
          setIsPrintOpen(false);
          if (printSale && printSale.id !== 'DRAFT') {
            onClose();
          }
        }}
        sale={printSale}
        isQuotation={false}
      />
    </div>
  );
}
