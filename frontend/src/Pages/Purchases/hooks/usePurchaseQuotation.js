import { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../../../services/api';
import { productLabel } from '../../../utils/productUtils';

const futureDate = (days = 15) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export function usePurchaseQuotation({
  isOpen = false,
  onClose = () => {},
  onQuotationCreated = null,
  suppliers: externalSuppliers = null,
  newlyCreatedSupplier = null,
  editingQuotation = null,
} = {}) {
  const [suppliers, setSuppliers] = useState(Array.isArray(externalSuppliers) ? externalSuppliers : []);
  const [products, setProducts] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [reference, setReference] = useState('');
  const [validUntil, setValidUntil] = useState(futureDate(15));
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);

  // Product Search & Add
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (Array.isArray(externalSuppliers) && externalSuppliers.length > 0) {
      setSuppliers(externalSuppliers);
    }
  }, [externalSuppliers]);

  useEffect(() => {
    if (isOpen && editingQuotation && editingQuotation.id) {
      setSupplierId(editingQuotation.supplier_id ? String(editingQuotation.supplier_id) : '');
      setReference(editingQuotation.reference || '');
      setValidUntil(editingQuotation.valid_until ? String(editingQuotation.valid_until).slice(0, 10) : '');
      setNotes(editingQuotation.notes || '');
      setItems(
        Array.isArray(editingQuotation.items)
          ? editingQuotation.items.map((it, idx) => ({
              localId: `${Date.now()}-${idx}`,
              product_id: it.product_id || null,
              name: it.product_name || 'Product',
              quantity: Number(it.quantity || 1),
              unit_price: Number(it.unit_price || 0) || '',
              notes: it.notes || '',
            }))
          : []
      );
      setError('');
    }
  }, [isOpen, editingQuotation]);

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
    if (!isOpen) return;

    const loadOptions = async () => {
      try {
        const suppRes = await fetch(`${API}/purchase/suppliers`).catch(() => null);
        if (suppRes && suppRes.ok) {
          const sData = await suppRes.json();
          const sList = Array.isArray(sData) ? sData : (sData.data || []);
          setSuppliers(sList);
          if (sList.length > 0 && !supplierId) {
            setSupplierId(String(sList[0].id));
          }
        }

        let pList = [];
        try {
          const prodRes = await fetch(`${API}/master/products`);
          if (prodRes.ok) {
            const pData = await prodRes.json();
            pList = Array.isArray(pData) ? pData : (pData.data || []);
          }
        } catch (_) {}

        if (!pList.length) {
          try {
            const pRes = await fetch(`${API}/products`);
            if (pRes.ok) {
              const pData = await pRes.json();
              pList = Array.isArray(pData) ? pData : (pData.data || []);
            }
          } catch (_) {}
        }
        setProducts(pList);
      } catch (err) {
        console.error(err);
      }
    };

    loadOptions();
  }, [isOpen]);

  const filteredProducts = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return list.filter((p) => {
      const full = productLabel(p).toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const barcode = (p.barcode || '').toLowerCase();
      const cat = (p.category_name || '').toLowerCase();
      const brand = (p.brand_name || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return (
        full.includes(q) ||
        name.includes(q) ||
        sku.includes(q) ||
        barcode.includes(q) ||
        cat.includes(q) ||
        brand.includes(q)
      );
    }).slice(0, 25);
  }, [products, searchQuery]);

  const handleAddItem = useCallback((product) => {
    setItems((prev) => {
      const exists = prev.find((it) => it.product_id === product.id);
      if (exists) {
        return prev.map((it) =>
          it.product_id === product.id
            ? { ...it, quantity: Number(it.quantity || 0) + 1 }
            : it
        );
      }
      return [
        ...prev,
        {
          localId: `${Date.now()}-${product.id}`,
          product_id: product.id,
          name: productLabel(product),
          quantity: 1,
          unit_price: Number(product.purchase_price || 0) || '',
          notes: '',
        },
      ];
    });
    setSearchQuery('');
  }, []);

  const handleUpdateItem = useCallback((localId, field, val) => {
    setItems((prev) =>
      prev.map((it) => (it.localId === localId ? { ...it, [field]: val } : it))
    );
  }, []);

  const handleRemoveItem = useCallback((localId) => {
    setItems((prev) => prev.filter((it) => it.localId !== localId));
  }, []);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, it) => {
      const q = Number(it.quantity) || 0;
      const p = Number(it.unit_price) || 0;
      return sum + q * p;
    }, 0);
  }, [items]);

  const totalUnits = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  }, [items]);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!supplierId) {
      setError('Please select a supplier');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one product item to the quotation');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        supplier_id: Number(supplierId),
        reference: reference.trim() || null,
        valid_until: validUntil || null,
        notes: notes.trim() || null,
        items: items.map((it) => ({
          product_id: it.product_id,
          quantity: Number(it.quantity) || 1,
          unit_price: Number(it.unit_price) || 0,
          notes: it.notes || null,
        })),
      };

      const isEdit = Boolean(editingQuotation && editingQuotation.id);
      const res = await fetch(
        `${API}/purchase/quotations${isEdit ? `/${editingQuotation.id}` : ''}`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save purchase quotation');
      }

      if (onQuotationCreated) {
        onQuotationCreated(data.data || data);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save quotation');
    } finally {
      setLoading(false);
    }
  };

  return {
    suppliers,
    setSuppliers,
    products,
    setProducts,
    supplierId,
    setSupplierId,
    reference,
    setReference,
    validUntil,
    setValidUntil,
    notes,
    setNotes,
    items,
    setItems,
    searchQuery,
    setSearchQuery,
    loading,
    setLoading,
    error,
    setError,
    filteredProducts,
    handleAddItem,
    handleUpdateItem,
    handleRemoveItem,
    totalAmount,
    totalUnits,
    handleSubmit,
  };
}
