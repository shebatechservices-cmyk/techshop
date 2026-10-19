import { useState, useEffect, useMemo, useRef } from 'react';
import API from '../../../services/api';
import { fullCatalogName } from '../../../utils/productUtils';

export const money = (val) => Number.parseFloat(val || 0) || 0;

export default function useSaleQuotation({
  isOpen,
  customers = [],
  products = [],
  newlyCreatedCustomer,
  editingQuotation = null,
  initialProduct = null,
  onQuotationCreated,
}) {
  const [localCustomers, setLocalCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState('1. Prices are valid for 7 days from quotation date.\n2. Standard manufacturer warranty applies where indicated.');
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [vat, setVat] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [printQuotation, setPrintQuotation] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const searchContainerRef = useRef(null);

  // Auto-fetch customers if none passed
  useEffect(() => {
    if (isOpen && (!customers || customers.length === 0)) {
      fetch(`${API}/sales/customers`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          const list = Array.isArray(json) ? json : (json?.data || []);
          setLocalCustomers(list);
        })
        .catch(() => {});
    }
  }, [isOpen, customers]);

  // Real-time synchronization when a customer is created
  useEffect(() => {
    const handleCustomerCreated = (e) => {
      const newCust = e.detail;
      if (newCust && newCust.id) {
        setLocalCustomers((prev) => [newCust, ...prev.filter((c) => c.id !== newCust.id)]);
        setCustomerId(String(newCust.id));
        setCustomerName(newCust.name || '');
        setCustomerPhone(newCust.phone || '');
        setCustomerAddress(newCust.address || '');
      }
    };
    window.addEventListener('customer_created', handleCustomerCreated);
    return () => window.removeEventListener('customer_created', handleCustomerCreated);
  }, []);

  const customerList = useMemo(() => {
    const base = customers && customers.length > 0 ? customers : localCustomers;
    if (newlyCreatedCustomer && !base.some((c) => c.id === newlyCreatedCustomer.id)) {
      return [newlyCreatedCustomer, ...base];
    }
    return base;
  }, [customers, localCustomers, newlyCreatedCustomer]);

  // Auto-select newly created customer
  useEffect(() => {
    if (newlyCreatedCustomer && newlyCreatedCustomer.id) {
      setLocalCustomers((prev) => [newlyCreatedCustomer, ...prev.filter((c) => c.id !== newlyCreatedCustomer.id)]);
      setCustomerId(String(newlyCreatedCustomer.id));
      setCustomerName(newlyCreatedCustomer.name || '');
      setCustomerPhone(newlyCreatedCustomer.phone || '');
      setCustomerAddress(newlyCreatedCustomer.address || '');
    }
  }, [newlyCreatedCustomer]);

  // Hydrate form when editing an existing quotation or when opening with initialProduct
  useEffect(() => {
    if (isOpen) {
      if (editingQuotation && editingQuotation.id) {
        setCustomerId(editingQuotation.customer_id ? String(editingQuotation.customer_id) : '');
        setCustomerName(editingQuotation.customer_name || '');
        setCustomerPhone(editingQuotation.customer_phone || '');
        setCustomerAddress(editingQuotation.customer_address || '');
        setValidUntil(editingQuotation.valid_until ? String(editingQuotation.valid_until).slice(0, 10) : '');
        setNotes(editingQuotation.notes || '');
        setDiscount(money(editingQuotation.discount));
        setVat(money(editingQuotation.vat));
        setItems(
          Array.isArray(editingQuotation.items)
            ? editingQuotation.items.map((it, idx) => {
                const prodInList = (products || []).find((p) => p.id === it.product_id);
                const fullName = fullCatalogName(prodInList || it);
                const qty = Number(it.quantity || 1);
                const uPrice = money(it.unit_price);
                const uDisc = money(it.unit_discount || it.discount_amount || 0);
                return {
                  localId: `${Date.now()}-${idx}`,
                  product_id: it.product_id,
                  product_name: fullName,
                  full_name: fullName,
                  brand_name: it.brand_name || (prodInList && prodInList.brand_name) || '',
                  quantity: qty,
                  unit_price: uPrice,
                  unit_discount: uDisc,
                  line_total: money(it.line_total) || Math.max(0, qty * (uPrice - uDisc)),
                  warranty_months: it.warranty_months !== undefined && it.warranty_months !== null ? Number(it.warranty_months) : (prodInList ? Number(prodInList.warranty_months || 0) : 0),
                };
              })
            : []
        );
        setError('');
      } else if (initialProduct && initialProduct.id) {
        const fullName = fullCatalogName(initialProduct);
        const price = Number(
          initialProduct.sale_price !== undefined && initialProduct.sale_price !== null && Number(initialProduct.sale_price) > 0
            ? initialProduct.sale_price
            : (initialProduct.salePrice || initialProduct.selling_price || initialProduct.final_sale_price || initialProduct.mrp || 0)
        );
        setItems([
          {
            localId: `${Date.now()}-${initialProduct.id}`,
            product_id: initialProduct.id,
            product_name: fullName,
            full_name: fullName,
            brand_name: initialProduct.brand_name || '',
            quantity: 1,
            unit_price: price,
            unit_discount: 0,
            line_total: price,
            warranty_months: Number(initialProduct.warranty_months || 0),
          },
        ]);
        setCustomerId('');
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setDiscount(0);
        setVat(0);
        setError('');
      } else {
        setItems([]);
        setCustomerId('');
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setDiscount(0);
        setVat(0);
        setError('');
      }
    }
  }, [isOpen, editingQuotation, initialProduct, products]);

  // When customer dropdown changes
  const handleCustomerChange = (idStr) => {
    setCustomerId(idStr);
    const sel = customerList.find((c) => String(c.id) === String(idStr));
    if (sel) {
      setCustomerName(sel.name || '');
      setCustomerPhone(sel.phone || '');
      setCustomerAddress(sel.address || '');
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
    }
  };

  // Close search popup if clicked outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return (products || []).filter((p) => {
      const name = (p.name || p.product_name || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const brand = (p.brand_name || '').toLowerCase();
      return name.includes(q) || sku.includes(q) || brand.includes(q);
    }).slice(0, 10);
  }, [searchQuery, products]);

  const handleAddItem = (prod) => {
    const existing = items.find((it) => it.product_id === prod.id);
    const fullName = fullCatalogName(prod);
    if (existing) {
      setItems((prev) =>
        prev.map((it) => {
          if (it.product_id !== prod.id) return it;
          const newQty = it.quantity + 1;
          const price = Number(it.unit_price || 0);
          const uDisc = Number(it.unit_discount || 0);
          return {
            ...it,
            quantity: newQty,
            line_total: Math.max(0, newQty * (price - uDisc)),
          };
        })
      );
    } else {
      const price = Number(
        prod.sale_price !== undefined && prod.sale_price !== null && Number(prod.sale_price) > 0
          ? prod.sale_price
          : (prod.salePrice !== undefined && prod.salePrice !== null && Number(prod.salePrice) > 0
            ? prod.salePrice
            : (prod.selling_price !== undefined && prod.selling_price !== null && Number(prod.selling_price) > 0
              ? prod.selling_price
              : (prod.final_sale_price !== undefined && prod.final_sale_price !== null && Number(prod.final_sale_price) > 0
                ? prod.final_sale_price
                : (prod.mrp !== undefined && prod.mrp !== null && Number(prod.mrp) > 0
                  ? prod.mrp
                  : (prod.cost_price || prod.costPrice || prod.purchase_price || 0)))))
      );
      setItems((prev) => [
        ...prev,
        {
          localId: `${Date.now()}-${prod.id}`,
          product_id: prod.id,
          product_name: fullName,
          full_name: fullName,
          brand_name: prod.brand_name || '',
          quantity: 1,
          unit_price: price,
          unit_discount: 0,
          line_total: price,
          warranty_months: prod.warranty_months !== undefined && prod.warranty_months !== null ? Number(prod.warranty_months) : 0,
        },
      ]);
    }
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleUpdateItem = (localId, field, val) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.localId !== localId) return it;
        const updated = { ...it, [field]: val };
        const qty = Number(field === 'quantity' ? val : it.quantity) || 1;
        const price = Number(field === 'unit_price' ? val : it.unit_price) || 0;
        const uDisc = Number(field === 'unit_discount' ? val : (it.unit_discount || 0)) || 0;
        updated.line_total = Math.max(0, qty * (price - uDisc));
        return updated;
      })
    );
  };

  const handleRemoveItem = (localId) => {
    setItems((prev) => prev.filter((it) => it.localId !== localId));
  };

  const subtotal = items.reduce((sum, it) => sum + (Number(it.line_total) || 0), 0);
  const totalDiscount = money(discount);
  const totalVat = money(vat);
  const grandTotal = Math.max(0, subtotal - totalDiscount + totalVat);

  const handleOpenPrintPreview = () => {
    if (!items.length) {
      setError('Please add at least one product to preview quotation');
      setTimeout(() => setError(''), 3000);
      return;
    }
    const previewData = {
      id: 'DRAFT',
      quotation_no: `QTN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-DRAFT`,
      created_at: new Date().toISOString(),
      customer_name: customerName || 'Valued Customer',
      customer_phone: customerPhone,
      customer_address: customerAddress,
      valid_until: validUntil,
      notes,
      subtotal,
      discount: totalDiscount,
      vat: totalVat,
      total_amount: grandTotal,
      items: items.map((it) => ({
        ...it,
        unit_discount: money(it.unit_discount || 0),
        line_total: Math.max(0, (money(it.unit_price) - money(it.unit_discount || 0)) * Number(it.quantity || 1)),
      })),
    };
    setPrintQuotation(previewData);
    setIsPrintOpen(true);
  };

  const handleSaveQuotation = async (e) => {
    e.preventDefault();
    setError('');

    if (!items.length) {
      setError('Please add at least one product to the quotation');
      return;
    }

    try {
      setSaving(true);
      const isEdit = Boolean(editingQuotation && editingQuotation.id);
      const res = await fetch(`${API}/sales/quotations${isEdit ? `/${editingQuotation.id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId ? Number(customerId) : null,
          customer_name: customerName || 'Valued Customer',
          customer_phone: customerPhone,
          customer_address: customerAddress,
          valid_until: validUntil,
          notes,
          subtotal,
          discount: totalDiscount,
          vat: totalVat,
          items: items.map((it) => ({
            product_id: it.product_id,
            product_name: it.product_name,
            quantity: Number(it.quantity || 1),
            unit_price: money(it.unit_price),
            unit_discount: money(it.unit_discount || 0),
            line_total: money(it.line_total),
            warranty_months: Number(it.warranty_months || 0),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to save quotation');
        return;
      }

      setPrintQuotation(data.data);
      setIsPrintOpen(true);

      if (onQuotationCreated) {
        onQuotationCreated(data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Server error while saving quotation');
    } finally {
      setSaving(false);
    }
  };

  return {
    customerId,
    setCustomerId,
    customerName,
    setCustomerName,
    customerPhone,
    customerAddress,
    validUntil,
    setValidUntil,
    notes,
    setNotes,
    items,
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    discount,
    setDiscount,
    vat,
    setVat,
    saving,
    error,
    setError,
    printQuotation,
    isPrintOpen,
    setIsPrintOpen,
    searchContainerRef,
    customerList,
    filteredProducts,
    subtotal,
    grandTotal,
    handleCustomerChange,
    handleAddItem,
    handleUpdateItem,
    handleRemoveItem,
    handleOpenPrintPreview,
    handleSaveQuotation,
  };
}
