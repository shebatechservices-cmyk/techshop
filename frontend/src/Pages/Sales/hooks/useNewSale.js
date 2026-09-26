import { useState, useEffect, useRef } from 'react';
import API from '../../../services/api';
import { EXTRA_COST_CATEGORIES } from '../../Purchases/hooks/usePurchaseCart';
import {
  fullCatalogName,
  isProductSerialTracked,
  isProductWarrantyRequired,
} from '../../../utils/productUtils';
import { POS_DRAFT_KEY, saveDraft, loadDraft, clearDraft } from '../../../utils/draftRecovery';
import useSaleItemCart from './useSaleItemCart';
import useSalePricingAndCharges, { money } from './useSalePricingAndCharges';
import useSaleTendersState, { newTender } from './useSaleTendersState';

export { money };
export { newTender };
export const taka = (val) =>
  `৳${money(val).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

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
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [popupMsg, setPopupMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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

  const [printSale, setPrintSale] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isPrintPreviewOnly, setIsPrintPreviewOnly] = useState(false);
  const [recoveredDraft, setRecoveredDraft] = useState(null);

  const customerSelectRef = useRef(null);

  // 1. Cart Management Sub-hook
  const cart = useSaleItemCart({
    products,
    setError,
  });

  const {
    items,
    setItems,
    expandedId,
    setExpandedId,
    activeCostCardId,
    setActiveCostCardId,
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
    searchContainerRef,
    searchInputRef,
    barcodeInputRef,
    filteredProducts,
    toggleCostCard,
    addProduct,
    switchItemUnit,
    updateItem,
    removeItem,
    handleScanEnter,
    handleAddBarcode,
    handleRemoveBarcode,
  } = cart;

  // 2. Pricing & Financial Computations Sub-hook
  const pricing = useSalePricingAndCharges({
    items,
    customerId,
    customers,
    customerSummary,
  });

  const {
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
    customerTypeRaw,
    isTechnician,
    isReseller,
    isGroupCustomer,
    groupDiscountAmount,
    isGroupDiscountActive,
    handleToggleSetupCharge,
    handleCameraCountChange,
    handleRateChange,
    handleDirectSetupChargeChange,
    handleToggleGroupDiscount,
  } = pricing;

  // 3. Payment Tenders Sub-hook
  const tendersState = useSaleTendersState({
    isOpen,
    totalPayable,
    editSale,
    itemsCount: items.length,
  });

  const {
    tenders,
    setTenders,
    hasUserEditedPaid,
    setHasUserEditedPaid,
    paymentConfirmed,
    setPaymentConfirmed,
    walletAccounts,
    cashAccounts,
    bankAccounts,
    mfsAccounts,
    paid,
    currentDue,
    due,
    updateTender,
    removeTender,
    addTenderRow,
    acceptTender,
    cancelTender,
    setQuickPaid,
  } = tendersState;

  // Autofocus product search input on modal open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchInputRef]);

  // Close customer dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
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

  // Set default customer (when a brand-new customer was just created)
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
  }, [isOpen, editSale, products, setItems, setTenders, setDiscount, setDiscountTouched, setVat, setLoyaltyPointsToUse, setHasSetupCharge, setSetupCharge, setSetupRatePerCamera, setHasExtraCost, setExtraCost, setExtraCostCategory, setExtraCostNotes, setHasUserEditedPaid, setPaymentConfirmed]);

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
    switchItemUnit,
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
