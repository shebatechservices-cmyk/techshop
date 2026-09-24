import { useState, useEffect } from 'react';
import API_BASE from '../../../services/api';

export const generateSku = (brand, name) => {
  const b = (brand || 'PRD').slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'P');
  const n = (name || 'ITM').slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${b}-${n}-${rand}`;
};

export default function useQuickAddProduct({ isOpen, onClose, onProductCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    category_name: '',
    brand_id: '',
    brand_name: '',
    model_name: '',
    series_name: '',
    purchase_price: '',
    selling_price: '',
    sku: '',
    barcode: '',
    warranty_months: '12',
    isSerialRequired: true,
    isWarrantyRequired: true,
  });

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateAlert, setDuplicateAlert] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Load categories & brands for dropdowns
    const loadLookups = async () => {
      try {
        const [catRes, brRes] = await Promise.all([
          fetch(`${API_BASE}/categories`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
          fetch(`${API_BASE}/master/brands`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
        ]);
        setCategories(Array.isArray(catRes) ? catRes : catRes.data || []);
        setBrands(Array.isArray(brRes) ? brRes : brRes.data || []);
      } catch (_) {}
    };
    loadLookups();

    // Auto-generate a fresh SKU
    setFormData({
      name: '',
      category_id: '',
      category_name: '',
      brand_id: '',
      brand_name: '',
      model_name: '',
      series_name: '',
      purchase_price: '',
      selling_price: '',
      sku: generateSku('', ''),
      barcode: '',
      warranty_months: '12',
      isSerialRequired: true,
      isWarrantyRequired: true,
    });
    setError('');
    setDuplicateAlert(false);
  }, [isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'brand_name' || field === 'name') {
        const b = field === 'brand_name' ? value : prev.brand_name;
        const n = field === 'name' ? value : prev.name;
        if (!prev.sku || prev.sku.startsWith('PRD-') || prev.sku.startsWith('ITM-')) {
          next.sku = generateSku(b, n);
        }
      }
      return next;
    });
    if (error) setError('');
    if (duplicateAlert) setDuplicateAlert(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setError('Product name is required');
      return;
    }

    setLoading(true);
    setError('');
    setDuplicateAlert(false);

    try {
      const isSerialReq = Boolean(formData.isSerialRequired);
      const isWarrantyReq = Boolean(formData.isWarrantyRequired || Number(formData.warranty_months || 0) > 0);

      const payload = {
        name: trimmedName,
        category_name: formData.category_name || (categories.find((c) => String(c.id) === String(formData.category_id))?.name || ''),
        category_id: formData.category_id ? Number(formData.category_id) : null,
        brand_name: formData.brand_name || (brands.find((b) => String(b.id) === String(formData.brand_id))?.name || ''),
        brand_id: formData.brand_id ? Number(formData.brand_id) : null,
        model_name: formData.model_name.trim(),
        series_name: formData.series_name.trim(),
        purchase_price: Number(formData.purchase_price || 0),
        selling_price: Number(formData.selling_price || 0),
        sku: formData.sku.trim(),
        barcode: formData.barcode.trim(),
        warranty_months: isWarrantyReq ? Number(formData.warranty_months || 0) : 0,
        isSerialRequired: isSerialReq,
        is_serial_required: isSerialReq,
        is_serial_tracked: isSerialReq,
        tracks_serial: isSerialReq,
        isWarrantyRequired: isWarrantyReq,
        is_warranty_required: isWarrantyReq,
      };

      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (res.status === 409 || !res.ok) {
        if (res.status === 409 || (resData.message && resData.message.includes('Already added'))) {
          setDuplicateAlert(true);
          return;
        }
        throw new Error(resData.message || resData.error || 'Failed to create product');
      }

      const created = resData.data || {
        ...payload,
        id: resData.id || Date.now(),
      };

      if (onProductCreated) {
        onProductCreated(created);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error creating product');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    categories,
    brands,
    loading,
    error,
    duplicateAlert,
    setDuplicateAlert,
    handleChange,
    handleSubmit,
    generateSku,
  };
}
