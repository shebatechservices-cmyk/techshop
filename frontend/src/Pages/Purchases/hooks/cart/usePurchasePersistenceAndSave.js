import { useState, useEffect } from 'react';
import {
  money,
  computeFinalSale,
  today,
  productLabel,
  fullCatalogName,
  isProductSerialTracked,
  isProductWarrantyRequired,
  EXTRA_COST_CATEGORIES,
} from '../../utils/purchaseCartUtils';
import {
  PURCHASE_DRAFT_KEY,
  saveDraft,
  loadDraft,
  clearDraft,
} from '../../../../utils/draftRecovery';
import API from '../../../../services/api';

export function usePurchasePersistenceAndSave({
  props,
  items,
  setItems,
  setExpandedId,
  supplierId,
  setSupplierId,
  selectedSupplierObj,
  setSummary,
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
  extra,
  discount,
  setDiscount,
  tenders,
  setTenders,
  setPaymentConfirmed,
  setBarcodeScanErrors,
  setQuery,
  setBarcodeInput,
  setError,
  setPopupMsg,
  setPrintOrder,
  setIsPrintPreviewOnly,
  setIsPrintOpen,
  walletAccounts,
  cashAccounts,
  bankAccounts,
  mfsAccounts,
  accountLabelToId,
  productList,
  setSuppliers,
  newlyCreatedSupplier,
  orderToEdit,
  isOpen,
  onClose,
  onSaved,
  onOrderSaved,
}) {
  const [saving, setSaving] = useState(false);
  const [recoveredDraft, setRecoveredDraft] = useState(null);
  const [previewOrderId, setPreviewOrderId] = useState(null);
  const [previewOrderData, setPreviewOrderData] = useState(null);
  const [isLedgerPreviewOpen, setIsLedgerPreviewOpen] = useState(false);

  // 1. Recover Draft on mount if not editing
  useEffect(() => {
    if (isOpen && !orderToEdit) {
      const draft = loadDraft(PURCHASE_DRAFT_KEY);
      if (
        draft &&
        ((draft.items && draft.items.length > 0) ||
          draft.supplierId ||
          draft.reference)
      ) {
        setRecoveredDraft(draft);
      }
    }
  }, [isOpen, orderToEdit]);

  // 2. Auto-save Draft periodically
  useEffect(() => {
    if (!isOpen || orderToEdit) return;
    if (items.length === 0 && !supplierId && !reference) {
      clearDraft(PURCHASE_DRAFT_KEY);
      return;
    }

    const payload = {
      supplierId,
      reference,
      hasExtraCost,
      extraCost,
      extraCostCategory,
      extraCostNotes,
      discount,
      items,
      tenders,
    };
    saveDraft(PURCHASE_DRAFT_KEY, payload);
  }, [
    isOpen,
    orderToEdit,
    supplierId,
    reference,
    hasExtraCost,
    extraCost,
    extraCostCategory,
    extraCostNotes,
    discount,
    items,
    tenders,
  ]);

  const handleRestoreDraft = () => {
    if (!recoveredDraft) return;
    if (recoveredDraft.supplierId) setSupplierId(recoveredDraft.supplierId);
    if (recoveredDraft.reference) setReference(recoveredDraft.reference);
    if (recoveredDraft.hasExtraCost !== undefined)
      setHasExtraCost(recoveredDraft.hasExtraCost);
    if (recoveredDraft.extraCost) setExtraCost(recoveredDraft.extraCost);
    if (recoveredDraft.extraCostCategory)
      setExtraCostCategory(recoveredDraft.extraCostCategory);
    if (recoveredDraft.extraCostNotes)
      setExtraCostNotes(recoveredDraft.extraCostNotes);
    if (recoveredDraft.discount) setDiscount(recoveredDraft.discount);
    if (Array.isArray(recoveredDraft.items)) setItems(recoveredDraft.items);
    if (Array.isArray(recoveredDraft.tenders)) setTenders(recoveredDraft.tenders);
    setRecoveredDraft(null);
  };

  const handleDiscardDraft = () => {
    clearDraft(PURCHASE_DRAFT_KEY);
    setRecoveredDraft(null);
  };

  // 3. Initialize state from orderToEdit or newlyCreatedSupplier
  useEffect(() => {
    if (orderToEdit) {
      if (orderToEdit.supplier_id) setSupplierId(String(orderToEdit.supplier_id));
      if (orderToEdit.transaction_reference)
        setReference(orderToEdit.transaction_reference);
      if (Number(orderToEdit.extra_cost || 0) > 0) setHasExtraCost(true);
      if (orderToEdit.extra_cost) setExtraCost(String(orderToEdit.extra_cost));
      if (orderToEdit.extra_cost_category)
        setExtraCostCategory(orderToEdit.extra_cost_category);
      if (orderToEdit.extra_cost_notes)
        setExtraCostNotes(orderToEdit.extra_cost_notes);

      if (Array.isArray(orderToEdit.items)) {
        const loaded = orderToEdit.items.map((it) => {
          const prod = productList.find((p) => p.id === it.product_id) || {};
          const isTracked =
            isProductSerialTracked(prod) || isProductSerialTracked(it);
          const isWarrantyReq =
            isProductWarrantyRequired(prod) || isProductWarrantyRequired(it);
          const serials = Array.isArray(it.serials) ? it.serials : [];
          const cost = Number(it.cost_price || 0);
          const sale = Number(it.final_sale_price || it.sale_price || 0);

          let marginVal =
            it.margin_value !== undefined && it.margin_value !== null
              ? String(it.margin_value)
              : '';
          if (!marginVal && cost > 0 && sale > 0 && sale >= cost) {
            marginVal = (((sale - cost) / cost) * 100).toFixed(2);
            if (marginVal.endsWith('.00')) marginVal = marginVal.slice(0, -3);
          } else if (!marginVal) {
            marginVal = '15';
          }

          const rawWarranty =
            it.customer_warranty_months !== undefined &&
            it.customer_warranty_months !== null
              ? it.customer_warranty_months
              : it.warranty_months;
          let cleanWarranty = 0;
          if (typeof rawWarranty === 'number' && !isNaN(rawWarranty)) {
            cleanWarranty = Math.max(0, Math.round(rawWarranty));
          } else if (rawWarranty) {
            const parsed = parseInt(String(rawWarranty).replace(/[^0-9]/g, ''), 10);
            cleanWarranty = isNaN(parsed) ? 0 : Math.max(0, parsed);
          }

          return {
            id: it.id,
            localId: `${Date.now()}-${it.product_id}-${Math.floor(
              Math.random() * 1000
            )}`,
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
            cost_price: cost > 0 ? cost : '',
            sale_price: sale > 0 ? sale : '',
            margin_type: it.margin_type || 'percent',
            margin_value: marginVal,
            previous_margin: marginVal || null,
            previous_cost: cost > 0 ? cost : null,
            final_sale_price: sale > 0 ? sale : '',
            final_sale_manual: false,
            expected_date: it.expected_date ? it.expected_date.split('T')[0] : today(),
            warranty_months: cleanWarranty,
            customer_warranty_months: cleanWarranty,
            supplier_warranty_months: it.supplier_warranty_months
              ? Number(it.supplier_warranty_months)
              : cleanWarranty,
            is_warranty_required: isWarrantyReq,
            has_serials: isTracked,
            is_serial_tracked: isTracked,
            serials,
          };
        });
        setItems(loaded);
        if (loaded.length > 0) setExpandedId(loaded[0].localId);
      }

      if (orderToEdit.discount !== undefined && orderToEdit.discount !== null) {
        setDiscount(money(orderToEdit.discount));
      }

      if (Array.isArray(orderToEdit.payments) && orderToEdit.payments.length > 0) {
        setTenders(
          orderToEdit.payments.map((p, i) => ({
            id: p.id || `edit-pay-${i}`,
            method: p.payment_method || 'Cash',
            sub_option: p.sub_option || p.account_name || '',
            amount: p.amount || 0,
            receiver_name: p.receiver_name || '',
            transaction_id: p.transaction_id || '',
            payment_method_id: p.payment_method_id || null,
            account_id: p.account_id || null,
            isAccepted: true,
          }))
        );
        setPaymentConfirmed(true);
      } else {
        setTenders([]);
        setPaymentConfirmed(false);
      }
    }

    if (newlyCreatedSupplier && newlyCreatedSupplier.id) {
      if (setSuppliers) {
        setSuppliers((prev) => {
          const found = prev.some((s) => s.id === newlyCreatedSupplier.id);
          if (found) return prev;
          return [...prev, newlyCreatedSupplier];
        });
      }
      setSupplierId(String(newlyCreatedSupplier.id));
    }
  }, [orderToEdit, newlyCreatedSupplier]);

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
    if (setSummary) setSummary(null);
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
    if (setError) setError('');
    if (setPopupMsg) setPopupMsg('');
  };

  const handleLoadOrderInForm = async (po) => {
    if (!po) return;
    let fullPo = po;
    if (!Array.isArray(fullPo.items) || fullPo.items.length === 0) {
      try {
        const res = await fetch(`${API}/purchase/${po.id}`);
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
        isAccepted: true,
      }));
      setTenders(loadedTenders);
    } else {
      setTenders([]);
    }
    setPaymentConfirmed(false);
    setIsLedgerPreviewOpen(false);
  };

  const handleOpenRecentPreview = (recentPo) => {
    setPreviewOrderId(recentPo.id);
    setPreviewOrderData(recentPo);
    setIsLedgerPreviewOpen(true);
  };

  // 4. Save Purchase Action
  const savePurchase = async (andPreview = false) => {
    if (setError) setError('');
    if (setPopupMsg) setPopupMsg('');
    if (!supplierId && !selectedSupplierObj) {
      return setPopupMsg
        ? setPopupMsg(
            '⚠️ Please select a supplier — purchase invoices cannot be saved without selecting a supplier.'
          )
        : null;
    }
    if (!items.length) {
      return setError ? setError('Please add at least one product') : null;
    }

    const unacceptedWithAmount = tenders.filter(
      (t) => !t.isAccepted && money(t.amount) > 0
    );
    if (unacceptedWithAmount.length > 0) {
      return setPopupMsg
        ? setPopupMsg(
            '⚠️ You have unconfirmed payment rows. Please click "✓ Accept" to confirm each payment entry, or "Cancel" to remove it before saving.'
          )
        : null;
    }

    // Complete validation for every line item
    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      const title = it.full_name || it.name || `Item #${idx + 1}`;
      if (!it.product_id) {
        setExpandedId(it.localId);
        return setError ? setError(`Item #${idx + 1}: Please select a valid product.`) : null;
      }
      const cost = money(it.cost_price);
      if (cost <= 0) {
        setExpandedId(it.localId);
        return setError
          ? setError(`Item #${idx + 1} ("${title}"): Cost Price must be greater than 0.`)
          : null;
      }
      const qty = Number(it.quantity || 0);
      if (qty <= 0) {
        setExpandedId(it.localId);
        return setError
          ? setError(`Item #${idx + 1} ("${title}"): Quantity must be at least 1.`)
          : null;
      }
      if (it.is_serial_tracked && (it.serials || []).length === 0) {
        setExpandedId(it.localId);
        if (setBarcodeScanErrors) {
          setBarcodeScanErrors((prev) => ({
            ...prev,
            [it.localId]: `⚠️ Barcode/Serial is required for "${title}". Please scan or enter at least 1 barcode.`,
          }));
        }
        return setError
          ? setError(
              `Item #${idx + 1} ("${title}"): This product requires serial/barcode tracking. Please scan at least 1 barcode.`
            )
          : null;
      }
      if (it.is_serial_tracked && (it.serials || []).length !== qty) {
        setExpandedId(it.localId);
        return setError
          ? setError(
              `Item #${idx + 1} ("${title}"): Scanned barcodes count (${
                (it.serials || []).length
              }) must match quantity (${qty}). Please scan all barcodes.`
            )
          : null;
      }
      if (!it.expected_date) {
        setExpandedId(it.localId);
        return setError
          ? setError(`Item #${idx + 1} ("${title}"): Please specify Expected Inward Date.`)
          : null;
      }
      if (
        it.warranty_months === undefined ||
        it.warranty_months === null ||
        it.warranty_months === '' ||
        Number(it.warranty_months) < 0
      ) {
        setExpandedId(it.localId);
        return setError
          ? setError(
              `Item #${idx + 1} ("${title}"): Please specify Customer Warranty (minimum 0 months).`
            )
          : null;
      }
    }

    setSaving(true);
    try {
      const isEditing = Boolean(orderToEdit && orderToEdit.id);
      const url = isEditing
        ? `${API}/purchase/${orderToEdit.id}`
        : `${API}/purchase/orders`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: Number(supplierId || selectedSupplierObj?.id),
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
            .map((t) => {
              let resolvedAccId = t.account_id;
              if (t.sub_option && accountLabelToId(t.sub_option)) {
                resolvedAccId = accountLabelToId(t.sub_option);
              }
              if (!resolvedAccId && walletAccounts.length > 0) {
                resolvedAccId = walletAccounts[0].id;
              }
              return {
                payment_method: t.method || 'Cash',
                payment_method_id: t.payment_method_id || null,
                account_id: resolvedAccId || 1,
                sub_option: t.sub_option || '',
                receiver_name: t.receiver_name || '',
                transaction_id: t.transaction_id || '',
                amount: money(t.amount),
              };
            }),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save purchase order');
      }

      const createdOrder = payload.data || payload;
      if (props?.onSaved) props.onSaved(createdOrder);
      if (onSaved) onSaved(createdOrder);
      if (onOrderSaved) onOrderSaved(createdOrder);

      // Dispatch global events so Cash Drawer, Accounts, Inventory, and Supplier Dues update immediately
      window.dispatchEvent(new CustomEvent('inventory_stock_changed'));
      window.dispatchEvent(new CustomEvent('data_changed'));
      window.dispatchEvent(new CustomEvent('account_balance_changed'));
      window.dispatchEvent(new CustomEvent('cash_drawer_changed'));
      window.dispatchEvent(new CustomEvent('wallet_balance_changed'));

      clearDraft(PURCHASE_DRAFT_KEY);
      setRecoveredDraft(null);

      if (andPreview) {
        if (setPrintOrder) setPrintOrder(createdOrder);
        if (setIsPrintPreviewOnly) setIsPrintPreviewOnly(false);
        if (setIsPrintOpen) setIsPrintOpen(true);
      } else {
        if (onClose) onClose();
      }
    } catch (saveErr) {
      console.error(saveErr);
      if (setError) setError(saveErr.message || 'Error occurred while saving order');
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    setSaving,
    recoveredDraft,
    setRecoveredDraft,
    previewOrderId,
    setPreviewOrderId,
    previewOrderData,
    setPreviewOrderData,
    isLedgerPreviewOpen,
    setIsLedgerPreviewOpen,
    handleRestoreDraft,
    handleDiscardDraft,
    handleClearForm,
    handleLoadOrderInForm,
    handleOpenRecentPreview,
    savePurchase,
  };
}
