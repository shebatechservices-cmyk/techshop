import { useEffect, useMemo, useState, useRef } from 'react';
import PurchasePrintModal from './PurchasePrintModal';
import PurchaseLedgerPreviewModal from './PurchaseLedgerPreviewModal';
import QuickAddProductModal from './QuickAddProductModal';
import AddSupplierModal from './AddSupplierModal';
import API_BASE from '../../services/api';

const PURCHASE_API = `${API_BASE}/purchase`;

const money = (value) => Number.parseFloat(value || 0) || 0;

const taka = (value) =>
  `৳${money(value).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const today = () => new Date().toISOString().slice(0, 10);

export const EXTRA_COST_CATEGORIES = [
  'Transportation & Logistics (পরিবহন ও ট্রাক ভাড়া)',
  'Courier & Parcel Charges (কুরিয়ার চার্জ)',
  'Demurrage / Port / Warehouse Fee (ডেমারেজ / পোর্ট ফি)',
  'Loading & Labor (লেবার / লোডিং-আনলোডিং)',
  'Packaging & Handling (প্যাকেজিং খরচ)',
  'Customs & Clearance (কাস্টমস ও শুল্ক)',
  'Other Overhead (অন্যান্য খরচ)',
];

function computeFinalSale(item) {
  if (item.final_sale_manual && money(item.final_sale_price) > 0) return money(item.final_sale_price);
  const cost = money(item.cost_price);
  const margin = money(item.margin_value);
  if (cost <= 0) return 0;
  if (item.margin_type === 'amount') return Number((cost + margin).toFixed(2));
  return Number((cost + (cost * margin) / 100).toFixed(2));
}

export const productLabel = (product) => {
  if (!product) return '';
  const parts = [product.brand_name, product.name, product.model_name, product.series_name]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index);
  return parts.length ? parts.join(' ') : product.name || 'Product';
};

export const fullCatalogName = (product) => {
  if (!product) return '';
  const brand = (product.brand_name || '').trim();
  const name = (product.name || '').trim();
  const model = (product.model_name || '').trim();
  const series = (product.series_name || '').trim();

  const parts = [];
  if (brand) parts.push(brand);
  if (name && !name.toLowerCase().startsWith(brand.toLowerCase())) {
    parts.push(name);
  } else if (name) {
    parts.push(name);
  }
  if (model && !parts.join(' ').toLowerCase().includes(model.toLowerCase())) {
    parts.push(model);
  }
  if (series && !parts.join(' ').toLowerCase().includes(series.toLowerCase())) {
    parts.push(series);
  }
  return parts.filter(Boolean).join(' ') || name || 'Product';
};

export function getItemMissingFields(item) {
  if (!item) return ['Cost Price', 'Sale Price', 'Margin', 'Quantity', 'Warranty'];
  const missing = [];

  const cost = Number(item.cost_price);
  if (item.cost_price === '' || item.cost_price === null || item.cost_price === undefined || isNaN(cost) || cost <= 0) {
    missing.push('Cost Price');
  }

  const sale = Number(item.sale_price !== '' && item.sale_price !== undefined ? item.sale_price : item.final_sale_price);
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
  if (item.margin_value === '' || item.margin_value === null || item.margin_value === undefined || isNaN(margin)) {
    missing.push('Margin');
  }

  const qty = Number(item.quantity);
  if (item.quantity === '' || item.quantity === null || item.quantity === undefined || isNaN(qty) || qty <= 0) {
    missing.push('Quantity');
  }

  return missing;
}

function newLineItem(product) {
  // Automatically populate last purchase price if previously purchased
  const cost = Number(product.last_purchase_price || product.purchase_price || product.cost_price || 0);
  const sale = Number(product.selling_price || product.sale_price || 0);

  // Margin defaults to percentage (%)
  let marginVal = product.last_margin_value !== undefined && product.last_margin_value !== null ? String(product.last_margin_value) : '';

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
    product.warranty_months !== undefined && product.warranty_months !== null && product.warranty_months !== ''
      ? Number(product.warranty_months)
      : 0;

  return {
    localId: `${Date.now()}-${product.id}-${Math.floor(Math.random() * 1000)}`,
    product_id: product.id,
    name: productLabel(product),
    full_name: fullCatalogName(product),
    brand_name: product.brand_name || '',
    category_name: product.category_name || '',
    sku: product.sku || '',
    barcode: product.barcode || '',
    quantity: 1,
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
    serials: [],
  };
}

export default function PurchaseOrderModal({
  isOpen = true,
  products: initialProducts = [],
  suppliers: externalSuppliers,
  orderToEdit = null,
  newlyCreatedSupplier,
  onOpenAddSupplier,
  onOpenAddProduct,
  onClose,
  onSaved,
  onOrderSaved,
}) {
  const [productList, setProductList] = useState(Array.isArray(initialProducts) ? initialProducts : []);
  const [suppliers, setSuppliers] = useState(Array.isArray(externalSuppliers) ? externalSuppliers : []);
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

  // Tenders State:
  // tenders: array of confirmed payments (starts empty [] so skipping 'Add' marks as Due)
  const [tenders, setTenders] = useState([]);
  // paymentConfirmed: mirrors sale-invoice "✓ Payment Added" confirm before save
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  // tenderDraft: current pending payment input row
  const [tenderDraft, setTenderDraft] = useState({
    method: 'Cash',
    sub_option: '',
    receiver_name: '',
    transaction_id: '',
    amount: '',
    isManual: false,
  });
  const [paymentInputError, setPaymentInputError] = useState('');
  const [paymentPlanNotice, setPaymentPlanNotice] = useState('');
  const [barcodeScanErrors, setBarcodeScanErrors] = useState({});
  const [supplierSearch, setSupplierSearch] = useState('');
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const supplierSelectRef = useRef(null);

  const [printOrder, setPrintOrder] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Inline Modal States
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [previewOrderId, setPreviewOrderId] = useState(null);
  const [previewOrderData, setPreviewOrderData] = useState(null);
  const [isLedgerPreviewOpen, setIsLedgerPreviewOpen] = useState(false);

  const [error, setError] = useState('');
  const [popupMsg, setPopupMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (Array.isArray(externalSuppliers) && externalSuppliers.length > 0) {
      setSuppliers(externalSuppliers);
    }
  }, [externalSuppliers]);


  // Prepopulate if editing existing purchase order
  useEffect(() => {
    if (orderToEdit) {
      if (orderToEdit.supplier_id) setSupplierId(String(orderToEdit.supplier_id));
      if (orderToEdit.transaction_reference) setReference(orderToEdit.transaction_reference);
      if (Number(orderToEdit.extra_cost || 0) > 0) setHasExtraCost(true);
      if (orderToEdit.extra_cost) setExtraCost(String(orderToEdit.extra_cost));
      if (orderToEdit.extra_cost_category) setExtraCostCategory(orderToEdit.extra_cost_category);
      if (orderToEdit.extra_cost_notes) setExtraCostNotes(orderToEdit.extra_cost_notes);

      if (Array.isArray(orderToEdit.items)) {
        const loaded = orderToEdit.items.map((it) => {
          const rawWarranty = it.warranty_months;
          let cleanWarranty = 0;
          if (typeof rawWarranty === 'number' && !isNaN(rawWarranty)) {
            cleanWarranty = Math.round(rawWarranty);
          } else if (rawWarranty) {
            cleanWarranty = parseInt(String(rawWarranty).replace(/[^0-9]/g, ''), 10) || 0;
          }
          const serials = Array.isArray(it.serials) ? it.serials : [];
          return {
            id: it.id,
            localId: `edit-${it.id || it.product_id}-${Date.now()}-${Math.random()}`,
            product_id: it.product_id,
            name: it.product_name || `Product #${it.product_id}`,
            full_name: `${it.brand_name ? `${it.brand_name} ` : ''}${it.product_name || ''}${it.model_name ? ` ${it.model_name}` : ''}${it.series_name ? ` ${it.series_name}` : ''}`.trim(),
            brand_name: it.brand_name || '',
            category_name: it.category_name || '',
            sku: it.sku || '',
            barcode: it.barcode || '',
            quantity: Number(it.quantity || 1),
            cost_price: it.cost_price || '',
            sale_price: it.sale_price || '',
            margin_type: it.margin_type || 'percent',
            margin_value: it.margin_value || 10,
            previous_margin: it.margin_value || 10,
            previous_cost: it.cost_price || null,
            final_sale_price: it.final_sale_price || it.sale_price || '',
            expected_date: it.expected_date ? it.expected_date.split('T')[0] : today(),
            warranty_months: cleanWarranty,
            has_serials: serials.length > 0 || Boolean(it.barcode),
            serials,
            has_sales: Boolean(it.has_sales),
          };
        });
        setItems(loaded);
      }

      if (Array.isArray(orderToEdit.payments)) {
        setTenders(
          orderToEdit.payments.map((p, idx) => ({
            id: `edit-pay-${idx}-${Date.now()}`,
            method: p.payment_method || 'Cash',
            sub_option: p.sub_option || '',
            receiver_name: p.receiver_name || '',
            transaction_id: p.transaction_id || '',
            amount: money(p.amount),
          }))
        );
      }
      setPaymentConfirmed(false);
    }
  }, [orderToEdit]);
  useEffect(() => {
    if (newlyCreatedSupplier && newlyCreatedSupplier.id) {
      setSuppliers((prev) => {
        const found = prev.some((s) => s.id === newlyCreatedSupplier.id);
        if (found) return prev;
        return [...prev, newlyCreatedSupplier];
      });
      setSupplierId(String(newlyCreatedSupplier.id));
    }
  }, [newlyCreatedSupplier]);

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
          setProductList(list);
        }
      } catch (_) {}
    };

    if (Array.isArray(initialProducts) && initialProducts.length > 0) {
      setProductList(initialProducts);
    } else {
      fetchMasterProducts();
    }
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

  // Map a displayed sub_option label back to its wallet account (id + balance)
  const accountByLabel = useMemo(() => {
    const m = {};
    (walletAccounts || []).forEach((a) => { m[accountLabel(a)] = a; });
    return m;
  }, [walletAccounts]);

  const accountLabelToId = (label) => (accountByLabel[label] ? Number(accountByLabel[label].id) : 1);
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

  // Fill empty sub_option once accounts load / when method switches
  useEffect(() => {
    if (!tenderDraft.sub_option && tenderDraft.method !== 'Wallet') {
      const list = tenderDraft.method === 'Bank' ? bankAccounts : tenderDraft.method === 'MFS' ? mfsAccounts : cashAccounts;
      const sub = (list && list[0]) || (tenderDraft.method === 'Bank' ? 'Bank' : tenderDraft.method === 'MFS' ? 'MFS' : 'Cash Drawer');
      setTenderDraft((prev) => (prev.sub_option ? prev : { ...prev, sub_option: sub }));
    }
  }, [walletAccounts, cashAccounts, bankAccounts, mfsAccounts, tenderDraft.method]);

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
    if (!term) return [];
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
    if (cost > 0 && item.margin_value !== '' && item.margin_value !== null && item.margin_value !== undefined) {
      const margin = money(item.margin_value);
      const sale = item.margin_type === 'amount' ? cost + margin : cost + (cost * margin) / 100;
      patch.sale_price = Number(sale.toFixed(2));
      patch.final_sale_price = Number(sale.toFixed(2));
      patch.final_sale_manual = false;
    } else if (cost > 0 && money(item.sale_price) > 0) {
      const sale = money(item.sale_price);
      const margin = item.margin_type === 'amount' ? sale - cost : ((sale - cost) / cost) * 100;
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
      const sale = item.margin_type === 'amount' ? cost + margin : cost + (cost * margin) / 100;
      patch.sale_price = Number(sale.toFixed(2));
      patch.final_sale_price = Number(sale.toFixed(2));
      patch.final_sale_manual = false;
    }
    updateItem(item.localId, patch);
  };

  const handleItemSaleChange = (item, newSaleStr) => {
    const sale = money(newSaleStr);
    const cost = money(item.cost_price);
    let patch = { sale_price: newSaleStr, final_sale_price: newSaleStr, final_sale_manual: true };
    if (cost > 0 && sale > 0) {
      const margin = item.margin_type === 'amount' ? sale - cost : ((sale - cost) / cost) * 100;
      patch.margin_value = Number(margin.toFixed(2));
    }
    updateItem(item.localId, patch);
  };

  const addProduct = (product) => {
    const existing = items.find((item) => item.product_id === product.id);
    if (existing) {
      setError(`"${product.name}" is already added to this purchase order. The same item cannot be added twice.`);
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

  const handleAddBarcode = (localId, explicitValue) => {
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
    let lengthMismatch = '';

    // Subsequent barcodes should match the length of the initial one!
    const requiredLength = currentSerials.length > 0 ? currentSerials[0].length : null;

    for (const cand of candidates) {
      if (currentSerials.includes(cand) || validToAdd.includes(cand)) {
        continue;
      }
      if (requiredLength !== null && cand.length !== requiredLength) {
        lengthMismatch = `⚠️ Barcode "${cand}" length (${cand.length}) must match initial barcode length (${requiredLength} chars, e.g. "${currentSerials[0]}"). All subsequent barcodes must match initial length.`;
        break;
      }
      validToAdd.push(cand);
    }

    if (lengthMismatch) {
      setBarcodeScanErrors((prev) => ({ ...prev, [localId]: lengthMismatch }));
      setTimeout(() => {
        setBarcodeScanErrors((prev) => ({ ...prev, [localId]: '' }));
      }, 6000);
      return;
    }

    if (validToAdd.length > 0) {
      const newSerials = [...currentSerials, ...validToAdd];
      updateItem(localId, {
        has_serials: true,
        serials: newSerials,
        // For barcoded items, the quantity will be automatically calculated via barcode scanning; manual entry is not permitted!
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
      quantity: targetItem.has_serials ? newSerials.length : targetItem.quantity,
    });
  };

  const handleRemoveItem = (localId) => {
    const targetItem = items.find((it) => it.localId === localId);
    if (targetItem && targetItem.has_sales) {
      setError(`Cannot delete "${targetItem.name || 'this item'}": this item has already been sold in a sales invoice. Once a sale has occurred, the price and barcode can be edited, but the item cannot be deleted.`);
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
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (supplierSelectRef.current && !supplierSelectRef.current.contains(e.target)) {
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
  const totalCost = Number((totals.cost + extra).toFixed(2));
  const totalSale = totals.sale > 0 ? totals.sale : 0;
  const estimatedProfit = Math.max(0, totalSale - totalCost);

  const selectedSupplierObj = suppliers.find((s) => String(s.id) === String(supplierId)) ||
    (summary && summary.supplier) ||
    null;

  const supplierPayable = Number(selectedSupplierObj?.payable_balance || 0);
  const supplierWallet = Number(
    selectedSupplierObj?.wallet_balance !== undefined
      ? selectedSupplierObj.wallet_balance
      : supplierPayable < 0
      ? Math.abs(supplierPayable)
      : 0
  );

  const paid = Number(tenders.reduce((sum, tender) => sum + money(tender.amount), 0).toFixed(2));
  const remainingDue = Math.max(0, Number((totalCost - paid).toFixed(2)));

  // Auto-sync pending payment draft default according to business rules:
  // 1. If funds exist in supplier's wallet, 'Wallet' appears first by default with Trx ID populated.
  // 2. If wallet balance < purchase amount (or wallet already used), 'Cash' appears next for remaining balance.
  // 3. By default with no wallet, 'Cash' appears displaying the total amount with 'Add' button.
  useEffect(() => {
    if (tenderDraft.isManual) return;
    const hasWalletTender = tenders.some((t) => t.method === 'Wallet');

    if (supplierWallet > 0 && !hasWalletTender && remainingDue > 0) {
      setTenderDraft((prev) => ({
        ...prev,
        method: 'Wallet',
        sub_option: 'Supplier E-Wallet',
        amount: String(Math.min(supplierWallet, remainingDue)),
        transaction_id: summary?.latest_wallet_trx_id || '',
        receiver_name: '',
      }));
      setPaymentInputError('');
    } else if (remainingDue > 0) {
      setTenderDraft((prev) => ({
        ...prev,
        method: 'Cash',
        sub_option: cashAccounts[0] || 'Cash Drawer',
        amount: String(remainingDue),
        transaction_id: '',
        receiver_name: '',
      }));
      setPaymentInputError('');
    } else {
      setTenderDraft((prev) => ({
        ...prev,
        amount: '',
      }));
      setPaymentInputError('');
    }
  }, [supplierWallet, remainingDue, summary?.latest_wallet_trx_id, tenders]);

  // Add Tender Handler (balance-aware: caps cash drawer to its available balance,
  // rolls the shortfall onto a funded Bank/MFS account, otherwise records as cash debt)
  const handleAddPayment = () => {
    const amt = money(tenderDraft.amount);
    if (amt <= 0) {
      setPaymentInputError('Please enter a valid payment amount greater than 0.');
      return;
    }
    if (amt > remainingDue + 0.0001) {
      setPaymentInputError(`⚠️ Payment amount (${taka(amt)}) cannot exceed remaining purchase cost (${taka(remainingDue)}).`);
      return;
    }
    // Disallow duplicate payment method in a single purchase!
    if (tenders.some((t) => t.method === tenderDraft.method)) {
      setPaymentInputError(`⚠️ The same payment method "${tenderDraft.method}" cannot be used twice in a single purchase.`);
      return;
    }
    if (tenderDraft.method === 'Wallet' && amt > supplierWallet) {
      setPaymentInputError(`⚠️ Payment amount (${taka(amt)}) exceeds available wallet balance (${taka(supplierWallet)}).`);
      return;
    }

    // Base tender row built from the current draft
    const baseRow = {
      method: tenderDraft.method,
      sub_option: tenderDraft.sub_option,
      receiver_name: tenderDraft.receiver_name,
      transaction_id: tenderDraft.transaction_id,
    };

    let rowsToAdd = [];
    let noticeText = '';

    if (tenderDraft.method === 'Cash' && accountByLabel[tenderDraft.sub_option]) {
      // Cash drawer balance check — if the drawer is short, we never let the drawer go
      // silently deep-negative: we cap it at available funds and cover the shortfall from
      // a funded Bank/MFS account first, and only keep the remainder as cash debt.
      const drawerAcc = accountByLabel[tenderDraft.sub_option];
      const drawerBal = Number(drawerAcc.balance || 0);
      const usedMethods = new Set(tenders.map((t) => t.method));

      if (amt > drawerBal + 0.0001) {
        const coveredByCash = Math.max(0, Math.min(drawerBal, amt));
        let unpaid = amt - coveredByCash;

        if (coveredByCash > 0) {
          rowsToAdd.push({ ...baseRow, amount: Number(coveredByCash.toFixed(2)) });
        }

        // Roll the shortfall onto funded bank/MFS accounts (best-funded first).
        const fundedAlts = (walletAccounts || [])
          .filter((a) => {
            const t = String(a.account_type || '').toLowerCase();
            const isFund = ['bank', 'bkash', 'nagad', 'mfs', 'card', 'mobile', 'upi'].includes(t);
            if (!isFund) return false;
            if (Number(a.balance || 0) <= 0) return false;
            const m = t === 'bank' ? 'Bank' : 'MFS';
            if (usedMethods.has(m)) return false;
            return true;
          })
          .sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0))
          .slice(0, 2);

        for (const alt of fundedAlts) {
          if (unpaid <= 0.005) break;
          const altBal = Number(alt.balance || 0);
          const altMethod = String(alt.account_type || '').toLowerCase() === 'bank' ? 'Bank' : 'MFS';
          const take = Math.min(altBal, unpaid);
          if (take > 0) {
            rowsToAdd.push({
              method: altMethod,
              sub_option: accountLabel(alt),
              receiver_name: '',
              transaction_id: '',
              amount: Number(take.toFixed(2)),
            });
            unpaid = Number((unpaid - take).toFixed(2));
          }
        }

        if (unpaid > 0.005) {
          rowsToAdd.push({ ...baseRow, amount: Number(unpaid.toFixed(2)) });
          noticeText = `⚠️ Cash drawer had only ${taka(coveredByCash)}. The remaining ${taka(unpaid)} is covered by this cash tender and will show as a debt (drawer balance goes negative).`;
        } else {
          noticeText = `ℹ️ Cash drawer had only ${taka(coveredByCash)} — the remaining ${taka(amt - coveredByCash)} is paid from funded Bank/MFS account(s).`;
        }
      } else {
        rowsToAdd.push({ ...baseRow, amount: amt });
      }
    } else {
      rowsToAdd.push({ ...baseRow, amount: amt });
    }

    const nextTenders = [...tenders, ...rowsToAdd];
    setTenders(nextTenders);
    setPaymentInputError('');
    setPaymentPlanNotice(noticeText);

    const nextPaid = Number(nextTenders.reduce((sum, t) => sum + money(t.amount), 0).toFixed(2));
    const nextDue = Math.max(0, Number((totalCost - nextPaid).toFixed(2)));

    // Pick next unused payment method if balance remains
    const usedMethods = new Set(nextTenders.map((t) => t.method));
    const availableMethods = ['Cash', 'Bank', 'MFS', 'Wallet'].filter((m) => !usedMethods.has(m));
    const nextMethod = availableMethods[0] || 'Cash';

    let nextSub = cashAccounts[0] || 'Cash Drawer';
    if (nextMethod === 'Bank') nextSub = bankAccounts[0] || 'Bank';
    else if (nextMethod === 'MFS') nextSub = mfsAccounts[0] || 'MFS';

    if (nextDue > 0) {
      setTenderDraft({
        method: nextMethod,
        sub_option: nextSub,
        receiver_name: '',
        transaction_id: '',
        amount: String(nextDue),
        isManual: false,
      });
    } else {
      setTenderDraft({
        method: nextMethod,
        sub_option: nextSub,
        receiver_name: '',
        transaction_id: '',
        amount: '',
        isManual: false,
      });
    }
  };

  const removeTender = (index) => {
    setTenders((current) => current.filter((_, i) => i !== index));
    setTenderDraft((prev) => ({ ...prev, isManual: false }));
    setPaymentInputError('');
  };

  // Sale-invoice style quick actions
  const handlePayFull = () => {
    const amt = Number(remainingDue.toFixed(2));
    if (amt <= 0) {
      setPaymentConfirmed(true);
      return;
    }
    // Pay Full pays from whichever funded account has money first, then cash drawer,
    // mirroring handleAddPayment's balance-aware split for a single full tender.
    const drawerLabel = cashAccounts[0] || 'Cash Drawer';
    const drawerBal = accountByLabel[drawerLabel] ? Number(accountByLabel[drawerLabel].balance || 0) : 0;

    const usedMethods = new Set(tenders.map((t) => t.method));
    const fundedAlts = (walletAccounts || [])
      .filter((a) => {
        const t = String(a.account_type || '').toLowerCase();
        const isFund = ['bank', 'bkash', 'nagad', 'mfs', 'card', 'mobile', 'upi'].includes(t);
        if (!isFund) return false;
        if (Number(a.balance || 0) <= 0) return false;
        const m = t === 'bank' ? 'Bank' : 'MFS';
        if (usedMethods.has(m)) return false;
        return true;
      })
      .sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0))
      .slice(0, 2);

    const rows = [];
    let unpaid = amt;

    // Prefer funded bank/MFS first (they pay the purchase), then the cash drawer.
    for (const alt of fundedAlts) {
      if (unpaid <= 0.005) break;
      const take = Math.min(Number(alt.balance || 0), unpaid);
      if (take > 0) {
        rows.push({
          method: String(alt.account_type || '').toLowerCase() === 'bank' ? 'Bank' : 'MFS',
          sub_option: accountLabel(alt),
          receiver_name: '',
          transaction_id: '',
          amount: Number(take.toFixed(2)),
        });
        unpaid = Number((unpaid - take).toFixed(2));
      }
    }

    if (unpaid > 0.005) {
      rows.push({
        method: 'Cash',
        sub_option: drawerLabel,
        receiver_name: '',
        transaction_id: '',
        amount: Number(unpaid.toFixed(2)),
      });
    }

    setTenders(rows);
    setTenderDraft({
      method: 'Cash',
      sub_option: drawerLabel,
      receiver_name: '',
      transaction_id: '',
      amount: '',
      isManual: false,
    });
    setPaymentInputError('');
    setPaymentPlanNotice(drawerBal < amt && rows.some((r) => r.method === 'Cash')
      ? `⚠️ Cash drawer only has ${taka(drawerBal)}. This purchase is settled partly from Bank/MFS; the cash portion (${taka(rows.reduce((s, r) => s + (r.method === 'Cash' ? r.amount : 0), 0))}) will show as debt if it exceeds the drawer.`
      : '');
    setPaymentConfirmed(true);
  };

  const handleFullDue = () => {
    setTenders([]);
    setTenderDraft({ ...tenderDraft, isManual: false });
    setPaymentInputError('');
    setPaymentConfirmed(true);
  };

  // Split remaining purchase cost across the most-funded Bank/MFS accounts first
  // (each Bank/MFS pays a slice of its own available balance), then fold whatever
  // is still left onto Cash - all in ONE click, no repeat-add needed.
  const handleSplitPayment = () => {
    const remaining = money(remainingDue);
    if (remaining <= 0) return;
    if (tenders.length > 0) return; // only start a split from zero added tenders

    const alreadyUsedMethods = new Set(tenders.map((t) => t.method));
    const bankAcct = accountToMethod;
    // Funded Bank/MFS wallets, most-funded first, excluding methods already tendered
    const fundedWallets = (walletAccounts || [])
      .filter((a) => {
        const t = String(a.account_type || '').toLowerCase();
        const isT = ['wallet', 'bank', 'mfs', 'mobile', 'bkash', 'nagad', 'card', 'upi'].includes(t);
        return isT && Number(a.balance || 0) > 0 && !alreadyUsedMethods.has(String(a.name || ''));
      })
      .sort((x, y) => Number(y.balance || 0) - Number(x.balance || 0))
      .slice(0, 3);

    const splits = [];
    let covered = 0;
    fundedWallets.forEach((wallet) => {
      const bal = Number(wallet.balance || 0);
      const slice = Math.min(bal, remaining - covered);
      if (slice > 0) {
        splits.push({
          row: {
            method: wallet.account_type,
            sub_option: wallet.name,
            amount: slice,
            // wallet carried to row later
          },
          wallet,
        });
        covered += slice;
      }
    });

    // Whatever is left after funded Bank/MFS goes onto Cash (drawer-aware handled in handleAddPayment)
    const cashSlice = Math.max(0, remaining - covered);
    const rowsToAdd = splits.map(({ row, wallet }) => ({
      method: row.method,
      sub_option: row.sub_option,
      receiver_name: row.sub_option === 'Wallet' ? wallet.name : '',
      amount: row.amount,
    }));
    if (cashSlice > 0) {
      rowsToAdd.push({ method: 'Cash', sub_option: cashAccounts[0] || 'Cash Drawer', receiver_name: '', amount: cashSlice });
    }

    setTenders((prev) => [...prev, ...rowsToAdd]);
    setTenderDraft((prev) => ({ ...prev, amount: Math.max(0, remaining - covered) }));
    setTenderInputError('');
  };

  // Clear Form Action
  const handleClearForm = () => {
    if (items.length > 0) {
      if (!window.confirm('Are you sure you want to clear the purchase form and reset all entered items?')) {
        return;
      }
    }
    setItems([]);
    setReference('');
    setExtraCost('');
    setExtraCostCategory(EXTRA_COST_CATEGORIES[0]);
    setExtraCostNotes('');
    setTenders([]);
    setPaymentConfirmed(false);
    setTenderDraft({
      method: 'Cash',
      sub_option: cashAccounts[0] || 'Cash Drawer',
      receiver_name: '',
      transaction_id: '',
      amount: '',
      isManual: false,
    });
    setPaymentInputError('');
    setQuery('');
    setBarcodeInput('');
    setError('');
  };

  // Load PO from Preview Popup into Form
  const handleLoadOrderInForm = (po) => {
    if (!po) return;
    if (po.supplier_id) {
      setSupplierId(String(po.supplier_id));
    }
    setReference(po.transaction_reference || po.po_number || '');
    setExtraCost(po.extra_cost ? String(po.extra_cost) : '');
    if (po.extra_cost_category) setExtraCostCategory(po.extra_cost_category);
    if (po.extra_cost_notes) setExtraCostNotes(po.extra_cost_notes);

    if (Array.isArray(po.items) && po.items.length > 0) {
      const loadedItems = po.items.map((it) => {
        const prod = productList.find((p) => p.id === it.product_id) || {};
        return {
          localId: `${Date.now()}-${it.product_id}-${Math.floor(Math.random() * 1000)}`,
          product_id: it.product_id,
          name: it.product_name || productLabel(prod),
          full_name: fullCatalogName(prod) || it.product_name,
          brand_name: it.brand_name || prod.brand_name || '',
          category_name: it.category_name || prod.category_name || '',
          sku: it.sku || prod.sku || '',
          barcode: it.barcode || prod.barcode || '',
          quantity: Number(it.quantity || 1),
          cost_price: Number(it.cost_price || 0),
          sale_price: Number(it.final_sale_price || it.sale_price || 0),
          margin_type: it.margin_type || 'percent',
          margin_value: it.margin_value !== undefined ? String(it.margin_value) : '15',
          previous_margin: it.margin_value !== undefined ? String(it.margin_value) : null,
          previous_cost: Number(it.cost_price || 0),
          final_sale_price: Number(it.final_sale_price || it.sale_price || 0),
          final_sale_manual: false,
          expected_date: it.expected_date ? it.expected_date.split('T')[0] : today(),
          warranty_months: it.warranty_months ? Number(it.warranty_months) : 0,
          serials: Array.isArray(it.serials) ? it.serials : [],
        };
      });
      setItems(loadedItems);
      if (loadedItems.length > 0) setExpandedId(loadedItems[0].localId);
    }

    if (Array.isArray(po.payments) && po.payments.length > 0) {
      const loadedTenders = po.payments.map((p) => ({
        id: `${Date.now()}-${Math.random()}`,
        method: p.payment_method || 'Cash',
        sub_option: p.sub_option || (p.payment_method === 'Bank' ? (bankAccounts[0] || 'Bank') : p.payment_method === 'MFS' ? (mfsAccounts[0] || 'MFS') : (cashAccounts[0] || 'Cash Drawer')),
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
    if (!supplierId && !selectedSupplierObj) return setPopupMsg('⚠️ অবশ্যই সাপ্লায়ার সিলেক্ট করুন — সাপ্লায়ার ছাড়া purchase invoice save হবে না।');
    if (!items.length) return setError('Please add at least one product');

    // Payment must be explicitly confirmed via the "✓ Payment Added" button (like sale invoice)
    if (!paymentConfirmed) {
      return setPopupMsg('⚠️ আগে "✓ Payment Added" বাটন চাপুন — পেমেন্ট কনফার্ম না করলে purchase save হবে না।');
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
      if (it.has_serials && (it.serials || []).length !== qty) {
        setExpandedId(it.localId);
        return setError(`Item #${idx + 1} ("${title}"): Scanned barcodes count (${(it.serials || []).length}) must match quantity (${qty}). Please scan all barcodes.`);
      }
      if (!it.expected_date) {
        setExpandedId(it.localId);
        return setError(`Item #${idx + 1} ("${title}"): Please specify Expected Inward Date.`);
      }
    }

    setSaving(true);
    try {
      const isEditing = Boolean(orderToEdit && orderToEdit.id);
      const url = isEditing ? `${PURCHASE_API}/${orderToEdit.id}` : `${PURCHASE_API}/orders`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: Number(supplierId || selectedSupplierObj.id),
          transaction_reference: reference,
          extra_cost: hasExtraCost ? extra : 0,
          extra_cost_category: hasExtraCost ? extraCostCategory : null,
          extra_cost_notes: hasExtraCost ? extraCostNotes : '',
          items: items.map((item) => {
            const rawWarranty = item.warranty_months;
            let cleanWarranty = 0;
            if (typeof rawWarranty === 'number' && !isNaN(rawWarranty)) {
              cleanWarranty = Math.round(rawWarranty);
            } else if (rawWarranty) {
              const p = parseInt(String(rawWarranty).replace(/[^0-9]/g, ''), 10);
              cleanWarranty = isNaN(p) ? 0 : p;
            }
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
              warranty_months: cleanWarranty,
              serials: Array.isArray(item.serials) ? item.serials : [],
            };
          }),
          payments: tenders
            .filter((t) => money(t.amount) > 0)
            .map((t) => ({
              payment_method: t.method || 'Cash',
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

      if (andPreview) {
        setPrintOrder(createdOrder);
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

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '96vw',
            maxWidth: '1240px',
            maxHeight: '94vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              borderBottom: '1px solid #f1f5f9',
              background: '#ffffff',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>{orderToEdit ? '✏️' : '🛒'}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                    {orderToEdit
                      ? `Edit Purchase Order #${orderToEdit.po_number || orderToEdit.id}`
                      : 'New Purchase Order'}
                  </h2>
                  {orderToEdit?.has_sales && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        background: '#fef3c7',
                        color: '#92400e',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        border: '1px solid #fde68a',
                      }}
                    >
                      ⚠️ Sold Items Locked
                    </span>
                  )}
                  {orderToEdit && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 700,
                      }}
                    >
                      ⏱️ 72h Edit Window
                    </span>
                  )}
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  {orderToEdit
                    ? 'Prices and barcodes can be updated. Deleting or reducing sold quantities is strictly prohibited.'
                    : 'Procurement, Stock Inward, and Supplier Dues Management'}
                </p>
              </div>
            </div>

            {/* Quick Actions / Emergency Contact */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {selectedSupplierObj?.phone && (
                <a
                  href={`tel:${selectedSupplierObj.phone}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    color: '#15803d',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                  title={`Call supplier: ${selectedSupplierObj.phone}`}
                >
                  <span>📞 Call: {selectedSupplierObj.phone}</span>
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.3rem',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Modal Body - 2 Columns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '290px 1fr',
              flex: 1,
              overflowY: 'auto',
              padding: '20px 24px',
              gap: '24px',
            }}
          >
            {/* Left Column: Supplier Profile Card & Recent Purchases */}
            <aside
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '18px',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                height: 'fit-content',
              }}
            >
              {selectedSupplierObj ? (
              <>
              {/* Avatar & Supplier Basic Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    border: '1.5px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#475569',
                    fontSize: '1.3rem',
                    flexShrink: 0,
                  }}
                >
                  👤
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedSupplierObj.name || 'Vendor / Supplier'}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                    Code: {selectedSupplierObj.contact_code || `SUP-${selectedSupplierObj.id || ''}`}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.84rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📞</span>
                <span style={{ fontWeight: 600 }}>{selectedSupplierObj.phone || '-'}</span>
              </div>

              <div style={{ height: '1px', background: '#f1f5f9', margin: '2px 0' }} />

              {/* Account Status: Wallet Balance & Outstanding Dues */}
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Account Status
                </div>

                {/* Wallet Balance */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>👛</span> Wallet Balance:
                  </span>
                  <strong style={{ color: '#7e22ce', fontWeight: 700, background: '#faf5ff', padding: '2px 8px', borderRadius: '6px', border: '1px solid #f3e8ff' }}>
                    {taka(supplierWallet)}
                  </strong>
                </div>

                {/* Outstanding Dues */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>📑</span> Outstanding Dues:
                  </span>
                  {supplierPayable > 0 ? (
                    <strong style={{ color: '#dc2626', fontWeight: 700, background: '#fef2f2', padding: '2px 8px', borderRadius: '6px', border: '1px solid #fee2e2' }}>
                      {taka(supplierPayable)}
                    </strong>
                  ) : (
                    <strong style={{ color: '#16a34a', fontWeight: 700, background: '#f0fdf4', padding: '2px 8px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                      ✓ No Dues
                    </strong>
                  )}
                </div>
              </div>

              <div style={{ height: '1px', background: '#f1f5f9', margin: '2px 0' }} />

              {/* Recent Purchases List with Preview Popup Click */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Recent Purchases
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 600 }}>Click to preview</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                  {summary?.recent_purchases && summary.recent_purchases.length > 0 ? (
                    summary.recent_purchases.map((recent) => (
                      <div
                        key={recent.id}
                        onClick={() => handleOpenRecentPreview(recent)}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: '#f8fafc',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f0fdf4';
                          e.currentTarget.style.borderColor = '#86efac';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f8fafc';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                        title="Click to view voucher ledger, open in purchase form, print, or share"
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                            {recent.po_number}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {new Date(recent.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ fontSize: '0.84rem', color: '#0284c7' }}>{taka(recent.total_cost)}</strong>
                          <div style={{ fontSize: '0.68rem', color: Number(recent.total_due) > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                            {Number(recent.total_due) > 0 ? `Due: ${taka(recent.total_due)}` : 'Paid'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '12px' }}>
                      No recent purchases recorded
                    </div>
                  )}
                </div>
              </div>

              <div style={{ height: '1px', background: '#f1f5f9', margin: '2px 0' }} />

              {/* Recent Payments */}
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Recent Payments
                </div>
                {summary?.recent_payments && summary.recent_payments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {summary.recent_payments.slice(0, 3).map((pmt) => (
                      <div key={pmt.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                        <span style={{ color: '#475569' }}>{pmt.payment_method} ({new Date(pmt.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })})</span>
                        <strong style={{ color: '#16a34a' }}>{taka(pmt.amount)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    No recent payments recorded
                  </div>
                )}
              </div>
              </>) : null}
            </aside>

            {/* Right Column: Main Form */}
            <main style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Supplier Selection Row */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Supplier *
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }} ref={supplierSelectRef}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                    <input
                      type="text"
                      placeholder="🔍 Select Supplier (Search name / phone)"
                      value={selectedSupplierObj ? `${selectedSupplierObj.name}${selectedSupplierObj.phone ? ` (${selectedSupplierObj.phone})` : ''}` : supplierSearch}
                      onFocus={() => setIsSupplierOpen(true)}
                      onChange={(e) => { setSupplierSearch(e.target.value); setIsSupplierOpen(true); }}
                      style={{
                        width: '100%',
                        padding: '9px 36px 9px 36px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.9rem',
                        color: '#0f172a',
                        background: '#ffffff',
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                      <span style={{ fontSize: '0.8rem' }}>⇅</span>
                    </div>
                    {isSupplierOpen && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 8px 20px rgba(0,0,0,0.12)', maxHeight: '230px', overflowY: 'auto' }}>
                        {suppliers
                          .filter((s) => {
                            const q = supplierSearch.trim().toLowerCase();
                            return !q || (s.name || '').toLowerCase().includes(q) || (s.phone || '').toLowerCase().includes(q);
                          })
                          .map((s) => {
                            const pay = Number(s.payable_balance || 0);
                            const wal = Number(s.wallet_balance !== undefined ? s.wallet_balance : pay < 0 ? Math.abs(pay) : 0);
                            const dueTag = pay > 0 ? `Dues: ৳${pay.toLocaleString()}` : '✓ No Dues';
                            const walTag = wal > 0 ? ` · Wallet: ৳${wal.toLocaleString()}` : '';
                            return (
                              <div
                                key={s.id}
                                onMouseDown={() => { setSupplierId(String(s.id)); setSupplierSearch(''); setIsSupplierOpen(false); }}
                                style={{
                                  padding: '9px 12px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #f1f5f9',
                                  fontSize: '0.85rem',
                                  color: '#0f172a',
                                  background: String(s.id) === String(supplierId) ? '#eff6ff' : '#ffffff',
                                }}
                              >
                                {s.name} ({dueTag}{walTag})
                              </div>
                            );
                          })}
                        {suppliers.filter((s) => {
                          const q = supplierSearch.trim().toLowerCase();
                          return !q || (s.name || '').toLowerCase().includes(q) || (s.phone || '').toLowerCase().includes(q);
                        }).length === 0 && (
                          <div style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '0.82rem' }}>No matching supplier</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Inline '+' Button: Triggers popup instead of redirecting */}
                  <button
                    type="button"
                    onClick={() => setIsAddSupplierOpen(true)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#0284c7',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Quick Add Supplier (Popup)"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add Product Search & Inline '+' Popup */}
              <div ref={searchContainerRef} style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Add product to order
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '12px', color: '#94a3b8' }}>🔍</span>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setIsSearchOpen(true);
                      }}
                      onFocus={() => {
                        if (query.trim()) setIsSearchOpen(true);
                      }}
                      placeholder="Search by full catalog name, brand, model, SKU or barcode..."
                      style={{
                        width: '100%',
                        padding: '9px 36px 9px 36px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                    <span style={{ position: 'absolute', right: '12px', color: '#94a3b8', pointerEvents: 'none' }}>
                      ⇅
                    </span>
                  </div>

                  {/* Inline '+' Button: Triggers popup instead of redirecting */}
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(true)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#10b981',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Quick Add Product to Catalog (Popup)"
                  >
                    +
                  </button>

                  <button
                    type="button"
                    onClick={handleAddButtonClick}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '8px',
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    + Add More
                  </button>
                </div>

                {/* Autocomplete dropdown with Full Catalog Name */}
                {isSearchOpen && query.trim().length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      zIndex: 100,
                      background: '#ffffff',
                      borderRadius: '10px',
                      border: '1.5px solid #10b981',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                      maxHeight: '260px',
                      overflowY: 'auto',
                      padding: '6px',
                    }}
                  >
                    {matches.length === 0 ? (
                      <div style={{ padding: '14px', textAlign: 'center', color: '#94a3b8', fontSize: '0.86rem' }}>
                        No matching products found.
                        <div style={{ marginTop: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setIsSearchOpen(false);
                              setIsAddProductOpen(true);
                            }}
                            style={{
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              color: '#166534',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            + Create "{query.trim()}" as new product
                          </button>
                        </div>
                      </div>
                    ) : (
                      matches.map((p) => {
                        const fullDesc = fullCatalogName(p);
                        const costHint = Number(p.last_purchase_price || p.purchase_price || p.cost_price || 0);
                        const isAlreadyAdded = items.some((it) => it.product_id === p.id);

                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              if (isAlreadyAdded) return;
                              addProduct(p);
                              setIsSearchOpen(false);
                            }}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              cursor: isAlreadyAdded ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.86rem',
                              opacity: isAlreadyAdded ? 0.45 : 1,
                              background: isAlreadyAdded ? '#f8fafc' : 'transparent',
                              borderBottom: '1px solid #f1f5f9',
                            }}
                            onMouseEnter={(e) => {
                              if (!isAlreadyAdded) e.currentTarget.style.background = '#f0fdf4';
                            }}
                            onMouseLeave={(e) => {
                              if (!isAlreadyAdded) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 700, color: isAlreadyAdded ? '#64748b' : '#0f172a' }}>{fullDesc}</span>
                                {isAlreadyAdded && (
                                  <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#fee2e2', color: '#b91c1c', padding: '1px 6px', borderRadius: '4px' }}>
                                    ✓ Already in PO
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', gap: '8px', marginTop: '2px' }}>
                                <span>SKU: {p.sku || `PRD-${p.id}`}</span>
                                {p.barcode && <span>Barcode: {p.barcode}</span>}
                                {p.category_name && <span>({p.category_name})</span>}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              {isAlreadyAdded ? (
                                <span style={{ fontSize: '0.76rem', color: '#dc2626', fontWeight: 600 }}>Cannot add twice</span>
                              ) : costHint > 0 ? (
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0284c7' }}>
                                  Last Cost: {taka(costHint)}
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>New Item</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Product Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.length === 0 && (
                  <div style={{ padding: '30px', textAlign: 'center', border: '1.5px dashed #cbd5e1', borderRadius: '10px', color: '#64748b', fontSize: '0.9rem' }}>
                    🛒 No products added yet. Search and add products above or click <strong>+</strong> to add a new catalog item.
                  </div>
                )}

                {items.map((item) => {
                  const isExpanded = expandedId === item.localId;
                  const cost = money(item.cost_price);
                  const qty = Number(item.quantity || 1);
                  const lineTotal = Number((cost * qty).toFixed(2));
                  const finalSale = computeFinalSale(item) || money(item.sale_price);
                  const displayName = item.full_name || item.name;

                  // EXPANDED ITEM VIEW:
                  // Line 1: Full product name at top, with Collapse & Remove buttons.
                  // Line 2: Summary details (Unit, Unit Cost, Total Cost, Margin, Final Selling Price, Prev Margin, Serials).
                  // Line 3+: Editable inputs.
                  if (isExpanded) {
                    return (
                      <div
                        key={item.localId}
                        style={{
                          border: '1.5px solid #10b981',
                          borderRadius: '10px',
                          background: '#ffffff',
                          padding: '16px',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)',
                        }}
                      >
                        {/* Line 1: Full Catalog Name at Top */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#10b981', fontSize: '1.2rem', lineHeight: 1 }}>⬡</span>
                            <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>
                              {displayName}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <button
                              type="button"
                              onClick={() => setExpandedId(null)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#0284c7',
                                fontWeight: 700,
                                fontSize: '0.84rem',
                                cursor: 'pointer',
                                padding: 0,
                              }}
                            >
                              ▲ Collapse
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.localId)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                padding: 0,
                              }}
                              title="Remove product"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Line 2: Summary Details Badge Bar */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
                            padding: '8px 12px',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            marginBottom: '14px',
                            fontSize: '0.78rem',
                          }}
                        >
                          <span style={{ background: '#e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                            📦 {qty} units
                          </span>
                          <span style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                            Unit Cost: {taka(cost)}
                          </span>
                          <span style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                            Total Cost: {taka(lineTotal)}
                          </span>
                          <span style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                            Margin: {item.margin_value || 15}{item.margin_type === 'percent' ? '%' : '৳'}
                          </span>
                          <span style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                            Final Sale: {taka(finalSale)}
                          </span>
                          {item.previous_margin && (
                            <span style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                              🏷️ Prev Margin: {item.previous_margin}% {item.previous_cost ? `· ৳${item.previous_cost}` : ''}
                            </span>
                          )}
                          {item.serials && item.serials.length > 0 && (
                            <span style={{ background: '#fae8ff', border: '1px solid #f5d0fe', color: '#86198f', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                              📷 {item.serials.length} serials
                            </span>
                          )}
                        </div>

                        {/* Editable Form Controls - Row 1: Quantity, Cost Price, Margin, Final Sale */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1.5fr 1.5fr 1.3fr',
                            gap: '12px',
                            marginBottom: '14px',
                            alignItems: 'flex-start',
                          }}
                        >
                          {/* Quantity */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#475569' }}>
                                Quantity *
                              </label>
                              {item.has_serials ? (
                                <span style={{ fontSize: '0.66rem', color: '#059669', fontWeight: 700, background: '#ecfdf5', padding: '1px 5px', borderRadius: '4px' }}>
                                  ⚡ Auto from scans
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.66rem', color: '#64748b' }}>
                                  (Manual)
                                </span>
                              )}
                            </div>
                            <input
                              type="number"
                              min="1"
                              readOnly={Boolean(item.has_serials)}
                              value={item.has_serials ? (item.serials ? item.serials.length : 0) : item.quantity}
                              onChange={(e) => {
                                if (item.has_serials) return;
                                updateItem(item.localId, { quantity: Math.max(1, Number(e.target.value || 1)) });
                              }}
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.88rem',
                                boxSizing: 'border-box',
                                background: item.has_serials ? '#f8fafc' : '#ffffff',
                                color: '#0f172a',
                                fontWeight: item.has_serials ? 700 : 500,
                                cursor: item.has_serials ? 'not-allowed' : 'text',
                              }}
                              title={item.has_serials ? 'Quantity is automatically calculated from scanned barcodes and cannot be manually modified' : 'Enter quantity manually'}
                            />
                          </div>

                          {/* Cost Price */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0284c7' }}>
                                Cost Price ৳ *
                              </label>
                              {item.previous_cost && (
                                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                  (Last: ৳{item.previous_cost})
                                </span>
                              )}
                            </div>
                            <input
                              type="number"
                              step="any"
                              value={item.cost_price}
                              onChange={(e) => handleItemCostChange(item, e.target.value)}
                              placeholder="0.00"
                              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #38bdf8', fontSize: '0.88rem', boxSizing: 'border-box', fontWeight: 600 }}
                            />
                          </div>

                          {/* Sales Margin (%) Default */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                              Sales Margin ({item.margin_type === 'percent' ? '%' : '৳'})
                            </label>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <input
                                type="number"
                                step="any"
                                value={item.margin_value}
                                onChange={(e) => handleItemMarginChange(item, e.target.value)}
                                placeholder="15"
                                style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                              />
                              <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateItem(item.localId, { margin_type: 'percent' });
                                  }}
                                  style={{
                                    padding: '0 8px',
                                    border: 'none',
                                    background: item.margin_type === 'percent' ? '#10b981' : '#f1f5f9',
                                    color: item.margin_type === 'percent' ? '#ffffff' : '#64748b',
                                    cursor: 'pointer',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                  }}
                                  title="Percentage Margin (Default)"
                                >
                                  %
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateItem(item.localId, { margin_type: 'amount' });
                                  }}
                                  style={{
                                    padding: '0 8px',
                                    border: 'none',
                                    background: item.margin_type === 'amount' ? '#10b981' : '#f1f5f9',
                                    color: item.margin_type === 'amount' ? '#ffffff' : '#64748b',
                                    cursor: 'pointer',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                  }}
                                  title="Fixed Taka Margin"
                                >
                                  ৳
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Final Sale Price: Computed automatically, not manually processed */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#16a34a' }}>
                                Final Sale ৳
                              </label>
                              <span style={{ fontSize: '0.66rem', color: '#16a34a', fontWeight: 600 }}>
                                (Calculated)
                              </span>
                            </div>
                            <input
                              type="text"
                              readOnly
                              value={finalSale > 0 ? taka(finalSale) : '৳ 0.00'}
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '6px',
                                border: '1.5px solid #86efac',
                                background: '#f0fdf4',
                                color: '#15803d',
                                fontSize: '0.88rem',
                                fontWeight: 800,
                                boxSizing: 'border-box',
                                cursor: 'default',
                              }}
                              title="Final sale price is strictly calculated from Cost Price + Margin and cannot be manually modified."
                            />
                          </div>
                        </div>

                        {/* Editable Form Controls - Row 2: Expected Date, Warranty Stepper, Barcode Scan Input */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1.2fr 1.2fr 2fr',
                            gap: '12px',
                            alignItems: 'flex-end',
                          }}
                        >
                          {/* Expected Inward Date */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                              Expected Inward Date *
                            </label>
                            <input
                              type="date"
                              value={item.expected_date}
                              onChange={(e) => updateItem(item.localId, { expected_date: e.target.value })}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                            />
                          </div>

                          {/* Warranty (Months) with increment/decrement steppers & greyed placeholder */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                              Warranty (Months)
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', background: '#ffffff' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  const cur = parseInt(item.warranty_months, 10) || 0;
                                  updateItem(item.localId, { warranty_months: Math.max(0, cur - 1) });
                                }}
                                style={{ padding: '8px 10px', background: '#f8fafc', border: 'none', borderRight: '1px solid #cbd5e1', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}
                                title="Decrease warranty months"
                              >
                                ▼
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={item.warranty_months !== undefined && item.warranty_months !== null ? item.warranty_months : ''}
                                onChange={(e) => updateItem(item.localId, { warranty_months: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0) })}
                                placeholder="Months (e.g. 12)"
                                style={{
                                  width: '100%',
                                  padding: '8px 4px',
                                  border: 'none',
                                  outline: 'none',
                                  fontSize: '0.85rem',
                                  textAlign: 'center',
                                  fontWeight: 600,
                                  color: '#0f172a',
                                  boxSizing: 'border-box'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const cur = parseInt(item.warranty_months, 10) || 0;
                                  updateItem(item.localId, { warranty_months: cur + 1 });
                                }}
                                style={{ padding: '8px 10px', background: '#f8fafc', border: 'none', borderLeft: '1px solid #cbd5e1', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}
                                title="Increase warranty months"
                              >
                                ▲
                              </button>
                            </div>
                          </div>

                          {/* Barcode / Serial Scanning or Non-barcoded indicator */}
                          <div>
                            {!item.has_serials ? (
                              <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                                  🚫 No serial/barcode for this item
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateItem(item.localId, { has_serials: true, quantity: (item.serials || []).length })}
                                  style={{
                                    background: '#ecfdf5',
                                    color: '#059669',
                                    border: '1px solid #a7f3d0',
                                    borderRadius: '4px',
                                    padding: '2px 8px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  + Enable Barcode Scan
                                </button>
                              </div>
                            ) : (
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', fontWeight: 700, color: '#0f172a' }}>
                                    <span>📷 Scan Barcode</span>
                                    <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700 }}>({(item.serials || []).length} scanned)</span>
                                  </label>
                                  {item.serials && item.serials.length > 0 && (
                                    <span style={{ fontSize: '0.68rem', color: '#0369a1', fontWeight: 600, background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px' }} title="All subsequent barcodes must match this length">
                                      Ref: {item.serials[0].length} chars (e.g. "{item.serials[0]}")
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => updateItem(item.localId, { has_serials: false, serials: [], quantity: Math.max(1, (item.serials || []).length || 1) })}
                                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.68rem', cursor: 'pointer', padding: 0 }}
                                    title="Switch to manual quantity without barcodes"
                                  >
                                    (Disable Barcode)
                                  </button>
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    border: barcodeScanErrors[item.localId] ? '1.5px solid #ef4444' : '1.5px solid #10b981',
                                    borderRadius: '8px',
                                    padding: '2px 4px 2px 8px',
                                    background: '#ffffff',
                                  }}
                                >
                                  <span style={{ color: barcodeScanErrors[item.localId] ? '#ef4444' : '#10b981', fontSize: '0.9rem' }}>[ ]</span>
                                  <input
                                    ref={barcodeInputRef}
                                    type="text"
                                    value={barcodeInput}
                                    onChange={(e) => setBarcodeInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddBarcode(item.localId);
                                      }
                                    }}
                                    placeholder={item.serials && item.serials.length > 0 ? `Scan ${item.serials[0].length}-digit barcode...` : "|এখানে ক্লিক করে স্ক্যান..."}
                                    style={{
                                      flex: 1,
                                      border: 'none',
                                      outline: 'none',
                                      fontSize: '0.84rem',
                                      padding: '6px 4px',
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAddBarcode(item.localId)}
                                    style={{
                                      padding: '6px 12px',
                                      background: '#10b981',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontWeight: 600,
                                      fontSize: '0.8rem',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Add
                                  </button>
                                </div>
                                {barcodeScanErrors[item.localId] && (
                                  <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: '4px', fontWeight: 600 }}>
                                    {barcodeScanErrors[item.localId]}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Serial Chips */}
                        {item.serials && item.serials.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                            {item.serials.map((sn) => (
                              <span
                                key={sn}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  background: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  borderRadius: '16px',
                                  padding: '3px 10px',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  color: '#166534',
                                }}
                              >
                                <span>{sn}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBarcode(item.localId, sn)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#dc2626',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    padding: 0,
                                  }}
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // COLLAPSED ITEM VIEW:
                  // Full name (as listed in catalog) appears at top alongside unit, unit cost, total cost, margin, and final selling price!
                  return (
                    <div
                      key={item.localId}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        background: '#ffffff',
                        padding: '7px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '320px' }}>
                        <span style={{ color: '#10b981', fontSize: '1.2rem' }}>⬡</span>
                        <div style={{ flex: 1 }}>
                          {/* Top: Full catalog name alongside unit, unit cost, total cost, margin, and final sale price */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                              {displayName}
                            </span>
                            <span style={{ background: '#e2e8f0', color: '#334155', padding: '1px 6px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 600 }}>
                              📦 {qty} units
                            </span>
                            <span style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '1px 6px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 700 }}>
                              Unit Cost: {taka(cost)}
                            </span>
                            <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '1px 6px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 700 }}>
                              Total Cost: {taka(lineTotal)}
                            </span>
                            <span style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '1px 6px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 700 }}>
                              Margin: {item.margin_value || 15}{item.margin_type === 'percent' ? '%' : '৳'}
                            </span>
                            <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '1px 6px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 700 }}>
                              Sale: {taka(finalSale)}
                            </span>
                            {item.serials?.length > 0 && (
                              <span style={{ color: '#0284c7', fontWeight: 600, fontSize: '0.74rem' }}>
                                ({item.serials.length} serials)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setExpandedId(item.localId)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#f8fafc',
                            color: '#0f172a',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.localId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Remove product"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Extra Costs with Categorized Options Recorded as Expenses */}
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: hasExtraCost ? '#9a3412' : '#1e293b',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={hasExtraCost}
                    onChange={(e) => setHasExtraCost(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#f97316' }}
                  />
                  <span>🚚 Logistics & Extra Cost (Recorded as Expense)</span>
                </label>

                {hasExtraCost && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.6fr', gap: '12px' }}>
                  {/* Extra Cost Amount */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Extra Cost ৳
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={extraCost}
                      onChange={(e) => setExtraCost(e.target.value)}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.86rem',
                        boxSizing: 'border-box',
                        background: '#ffffff',
                      }}
                    />
                  </div>

                  {/* Extra Cost Category */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Expense Category
                    </label>
                    <select
                      value={extraCostCategory}
                      onChange={(e) => setExtraCostCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.84rem',
                        background: '#ffffff',
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                      }}
                    >
                      {EXTRA_COST_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Transaction Reference / Memo */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Transaction Reference / Note
                    </label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="e.g. Courier Challan #48291 / Memo"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.86rem',
                        boxSizing: 'border-box',
                        background: '#ffffff',
                      }}
                    />
                  </div>
                </div>
                )}
              </div>

              {/* Net Payable Summary (Logistics & Extra Cost above it) */}
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '10px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#334155' }}>
                  <span>Items Subtotal</span>
                  <span>{taka(totals.cost)}</span>
                </div>
                {extra > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#92400e' }}>
                    <span>🚚 Logistics & Extra Cost{extraCostCategory ? ` (${extraCostCategory})` : ''}</span>
                    <span>+{taka(extra)}</span>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    color: '#0f172a',
                    borderTop: '1px dashed #cbd5e1',
                    paddingTop: '6px',
                    marginTop: '2px',
                  }}
                >
                  <span>NET PAYABLE</span>
                  <span style={{ color: '#0284c7' }}>{taka(totalCost)}</span>
                </div>
              </div>

              {/* Payment Tenders & Dues Section */}
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '16px',
                }}
              >
                {/* Header with status badges */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ color: '#10b981', fontSize: '1.1rem' }}>💳</span>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' }}>
                      Payment & Settlement
                    </span>
                    <span
                      style={{
                        background: paid >= totalCost && totalCost > 0 ? '#dcfce7' : '#e2e8f0',
                        color: paid >= totalCost && totalCost > 0 ? '#15803d' : '#334155',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      Paid: {taka(paid)} / {taka(totalCost)}
                    </span>
                    {remainingDue > 0 ? (
                      <span
                        style={{
                          background: '#fee2e2',
                          color: '#b91c1c',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        Remaining Due: {taka(remainingDue)}
                      </span>
                    ) : totalCost > 0 ? (
                      <span
                        style={{
                          background: '#f0fdf4',
                          color: '#166534',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        ✓ Fully Paid (No Dues)
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* List of Applied / Confirmed Payments */}
                {tenders.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b' }}>
                      Processed Payments ({tenders.length}):
                    </div>
                    {tenders.map((tender, idx) => (
                      <div
                        key={tender.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '8px 12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem' }}>
                          <span>{tender.method === 'Cash' ? '💵' : tender.method === 'Bank' ? '🏦' : tender.method === 'Wallet' ? '👛' : '📱'}</span>
                          <strong>{tender.method}</strong>
                          <span style={{ color: '#475569' }}>({tender.sub_option})</span>
                          {tender.transaction_id && (
                            <span style={{ fontSize: '0.76rem', color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                              Trx: {tender.transaction_id}
                            </span>
                          )}
                          {tender.receiver_name && (
                            <span style={{ fontSize: '0.76rem', color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                              Receiver: {tender.receiver_name}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <strong style={{ color: '#16a34a', fontSize: '0.9rem' }}>{taka(tender.amount)}</strong>
                          <button
                            type="button"
                            onClick={() => removeTender(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              padding: '2px 4px',
                            }}
                            title="Remove payment"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '12px', background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                    ℹ️ No payment added yet. Use <strong>"✓ Add Payment"</strong> above or press <strong>Pay Full / Full Due</strong>, then confirm with the green <strong>"+ Add Payment"</strong> button.
                  </div>
                )}

                {/* Pending Payment Input Box */}
                {remainingDue > 0 ? (
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #38bdf8',
                      borderRadius: '10px',
                      padding: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1' }}>
                        ➕ Payment Method Option (Click 'Add Payment' to confirm, or leave unadded for Due)
                      </span>
                      <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        Remaining to settle: <strong>{taka(remainingDue)}</strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Method Dropdown */}
                      <select
                        value={tenderDraft.method}
                        onChange={(e) => {
                          const m = e.target.value;
                          let sub = cashAccounts[0] || 'Cash Drawer';
                          let trx = '';
                          let amt = remainingDue > 0 ? String(remainingDue) : '';
                          if (m === 'Wallet') {
                            sub = 'Supplier E-Wallet';
                            trx = summary?.latest_wallet_trx_id || '';
                            amt = String(Math.min(supplierWallet, remainingDue));
                          } else if (m === 'Bank') {
                            sub = bankAccounts[0] || 'Bank';
                          } else if (m === 'MFS') {
                            sub = mfsAccounts[0] || 'MFS';
                          }
                          setTenderDraft({
                            method: m,
                            sub_option: sub,
                            receiver_name: '',
                            transaction_id: trx,
                            amount: amt,
                            isManual: true,
                          });
                          setPaymentInputError('');
                        }}
                        style={{
                          width: '130px',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                        }}
                      >
                        {supplierWallet > 0 && (
                          <option value="Wallet" disabled={tenders.some((t) => t.method === 'Wallet')}>
                            👛 E-Wallet {tenders.some((t) => t.method === 'Wallet') ? '(Added)' : ''}
                          </option>
                        )}
                        <option value="Cash" disabled={tenders.some((t) => t.method === 'Cash')}>
                          💵 Cash {tenders.some((t) => t.method === 'Cash') ? '(Added)' : ''}
                        </option>
                        <option value="Bank" disabled={tenders.some((t) => t.method === 'Bank')}>
                          🏦 Bank {tenders.some((t) => t.method === 'Bank') ? '(Added)' : ''}
                        </option>
                        <option value="MFS" disabled={tenders.some((t) => t.method === 'MFS')}>
                          📱 MFS {tenders.some((t) => t.method === 'MFS') ? '(Added)' : ''}
                        </option>
                      </select>

                      {/* Sub-option / Wallet display */}
                      {tenderDraft.method === 'Wallet' ? (
                        <div
                          style={{
                            flex: 1,
                            minWidth: '190px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px dashed #c084fc',
                            background: '#faf5ff',
                            color: '#7e22ce',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                          }}
                        >
                          👛 Supplier Wallet (Available: {taka(supplierWallet)})
                        </div>
                      ) : (
                        <select
                          value={tenderDraft.sub_option}
                          onChange={(e) => setTenderDraft((prev) => ({ ...prev, sub_option: e.target.value }))}
                          style={{
                            flex: 1,
                            minWidth: '180px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            fontSize: '0.85rem',
                          }}
                        >
                          <>
                          {tenderDraft.method === 'Bank' && (
                            bankAccounts.length === 0 ? <option value="Bank">Bank</option>
                              : bankAccounts.map((b) => (
                                  <option key={b} value={b}>{b}</option>
                                ))
                          )}
                          {tenderDraft.method === 'MFS' && (
                            mfsAccounts.length === 0 ? <option value="MFS">MFS</option>
                              : mfsAccounts.map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                ))
                          )}
                          {tenderDraft.method === 'Cash' && (
                            cashAccounts.length === 0 ? <option value="Cash Drawer">Cash Drawer</option>
                              : cashAccounts.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))
                          )}
                        </>
                        </select>
                      )}

                      {/* Cash: Receiver's Name */}
                      {tenderDraft.method === 'Cash' && (
                        <input
                          type="text"
                          value={tenderDraft.receiver_name}
                          onChange={(e) => setTenderDraft((prev) => ({ ...prev, receiver_name: e.target.value }))}
                          placeholder="Receiver's Name (গ্রহীতা)..."
                          style={{
                            width: '170px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.82rem',
                            boxSizing: 'border-box',
                          }}
                        />
                      )}

                      {/* Wallet / Bank / MFS: Transaction ID */}
                      {(tenderDraft.method === 'Wallet' || tenderDraft.method === 'Bank' || tenderDraft.method === 'MFS') && (
                        <input
                          type="text"
                          value={tenderDraft.transaction_id}
                          onChange={(e) => setTenderDraft((prev) => ({ ...prev, transaction_id: e.target.value }))}
                          placeholder={tenderDraft.method === 'Wallet' ? 'Wallet Trx ID (auto)...' : 'Transaction ID / Cheque #...'}
                          style={{
                            width: '180px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: tenderDraft.method === 'Wallet' ? '1.5px solid #c084fc' : '1px solid #cbd5e1',
                            background: tenderDraft.method === 'Wallet' ? '#faf5ff' : '#ffffff',
                            fontSize: '0.82rem',
                            boxSizing: 'border-box',
                          }}
                        />
                      )}

                      {/* Amount Input */}
                      <div style={{ position: 'relative', width: '130px' }}>
                        <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                          ৳
                        </span>
                        <input
                          type="number"
                          step="any"
                          value={tenderDraft.amount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTenderDraft((prev) => ({ ...prev, amount: val, isManual: true }));
                            const num = money(val);
                            if (num > remainingDue) {
                              setPaymentInputError(`⚠️ Input amount (${taka(num)}) exceeds remaining total (${taka(remainingDue)})`);
                            } else if (tenderDraft.method === 'Wallet' && num > supplierWallet) {
                              setPaymentInputError(`⚠️ Amount (${taka(num)}) exceeds wallet balance (${taka(supplierWallet)})`);
                            } else {
                              setPaymentInputError('');
                            }
                          }}
                          placeholder="0.00"
                          style={{
                            width: '100%',
                            padding: '8px 10px 8px 24px',
                            borderRadius: '6px',
                            border: paymentInputError ? '1.5px solid #ef4444' : '1.5px solid #38bdf8',
                            fontSize: '0.86rem',
                            fontWeight: 700,
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      {/* Account balance hint for Cash/Bank/MFS */}
                      {tenderDraft.method !== 'Wallet' && accountByLabel[tenderDraft.sub_option] && (
                        <div
                          style={{
                            width: '100%',
                            flexBasis: '100%',
                            fontSize: '0.72rem',
                            color: accountLabelToBalance(tenderDraft.sub_option) < money(tenderDraft.amount) ? '#dc2626' : '#0f766e',
                            fontWeight: 600,
                          }}
                        >
                          {tenderDraft.method === 'Cash' ? '💵' : '💰'} Available balance in „{tenderDraft.sub_option}": {taka(accountLabelToBalance(tenderDraft.sub_option))}
                          {accountLabelToBalance(tenderDraft.sub_option) < money(tenderDraft.amount)
                            ? ' — insufficient; shortfall will be routed to a funded Bank/MFS account or shown as cash debt.'
                            : ''}
                        </div>
                      )}

                      {/* 'Add' Button */}
                      <button
                        type="button"
                        onClick={handleAddPayment}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          background: '#10b981',
                          color: '#ffffff',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        ✓ Add Payment
                      </button>
                    </div>

                    {/* Inline Payment Error Notice */}
                    {paymentInputError && (
                      <div style={{ marginTop: '8px', color: '#dc2626', fontSize: '0.78rem', fontWeight: 600 }}>
                        {paymentInputError}
                      </div>
                    )}
                    {paymentPlanNotice && (
                      <div style={{ marginTop: '8px', color: '#b45309', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', padding: '8px', fontSize: '0.78rem', fontWeight: 600 }}>
                        {paymentPlanNotice}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px', color: '#166534', fontSize: '0.82rem', fontWeight: 600, textAlign: 'center' }}>
                    ✓ The full purchase cost of {taka(totalCost)} has been settled with added payments.
                  </div>
                )}

                {/* Quick Pay & Split Action (sale-invoice style) */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid #f1f5f9',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handlePayFull}
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
                      Pay Full ({taka(totalCost)})
                    </button>
                    <button
                      type="button"
                      onClick={handleFullDue}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #fecaca',
                        background: '#ffffff',
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
                      onClick={handleSplitPayment}
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
                      onClick={() => { setPaymentConfirmed(true); }}
                      style={{
                        border: '1px solid #16a34a',
                        background: paymentConfirmed ? '#16a34a' : '#ffffff',
                        color: paymentConfirmed ? '#ffffff' : '#16a34a',
                        padding: '7px 16px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
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

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', fontSize: '0.84rem' }}>
                  {error}
                </div>
              )}
            </main>
          </div>

          {/* Footer Summary Bar */}
          <footer
            style={{
              borderTop: '1px solid #f1f5f9',
              padding: '14px 24px',
              background: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            {/* Left White Summary Card */}
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px 16px',
                display: 'flex',
                gap: '16px',
                fontSize: '0.82rem',
                color: '#475569',
                background: '#f8fafc',
                alignItems: 'center',
              }}
            >
              <div>
                Items: <strong style={{ color: '#0f172a' }}>{items.length}</strong>
              </div>
              <div>
                Units: <strong style={{ color: '#0f172a' }}>{totals.units}</strong>
              </div>
              <div>
                Total Cost: <strong style={{ color: '#0284c7' }}>{taka(totalCost)}</strong>
              </div>
              <div>
                Paid: <strong style={{ color: '#16a34a' }}>{taka(paid)}</strong>
              </div>
              <div>
                Due:{' '}
                <strong style={{ color: remainingDue > 0 ? '#dc2626' : '#16a34a' }}>
                  {remainingDue > 0 ? taka(remainingDue) : 'No Due'}
                </strong>
              </div>
              <div>
                Est. Profit: <strong style={{ color: '#059669' }}>{taka(estimatedProfit)}</strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleClearForm}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#dc2626',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Clear Form
              </button>

              <button
                type="button"
                onClick={() => savePurchase(true)}
                disabled={saving}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #0284c7',
                  background: '#f0f9ff',
                  color: '#0284c7',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Save & Preview Voucher
              </button>

              <button
                type="button"
                onClick={() => savePurchase(false)}
                disabled={saving}
                style={{
                  padding: '9px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#10b981',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                }}
              >
                {saving
                  ? 'Saving...'
                  : orderToEdit
                  ? 'Update Purchase Order'
                  : 'Save & Inward Stock'}
              </button>
            </div>
          </footer>
        </div>
      </div>

      {/* Inline Quick Add Supplier Modal */}
      {isAddSupplierOpen && (
        <AddSupplierModal
          isOpen={isAddSupplierOpen}
          onClose={() => setIsAddSupplierOpen(false)}
          onSupplierAdded={(newSup) => {
            if (newSup && newSup.id) {
              setSuppliers((prev) => [newSup, ...prev.filter((s) => s.id !== newSup.id)]);
              setSupplierId(String(newSup.id));
            }
            setIsAddSupplierOpen(false);
          }}
        />
      )}

      {/* Inline Quick Add Product to Catalog Modal with duplicate checking */}
      {isAddProductOpen && (
        <QuickAddProductModal
          isOpen={isAddProductOpen}
          onClose={() => setIsAddProductOpen(false)}
          existingProducts={productList}
          onProductCreated={(createdProd) => {
            if (createdProd && createdProd.id) {
              setProductList((prev) => [createdProd, ...prev]);
              addProduct(createdProd);
            }
            setIsAddProductOpen(false);
          }}
        />
      )}

      {/* Recent PO Ledger Preview Modal with Voucher view, Open in Purchase Form, Print, and Share */}
      {isLedgerPreviewOpen && (
        <PurchaseLedgerPreviewModal
          isOpen={isLedgerPreviewOpen}
          onClose={() => setIsLedgerPreviewOpen(false)}
          purchaseOrderId={previewOrderId}
          purchaseOrderData={previewOrderData}
          onOpenInPurchaseForm={(po) => handleLoadOrderInForm(po)}
        />
      )}

      {/* Print / Voucher Modal */}
      {isPrintOpen && (
        <PurchasePrintModal
          order={printOrder}
          onClose={() => {
            setIsPrintOpen(false);
            onClose();
          }}
        />
      )}

      {/* Save-block popup (supplier / payment) */}
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
    </>
  );
}
