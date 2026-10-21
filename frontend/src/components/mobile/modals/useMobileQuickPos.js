import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../../services/api';

export default function useMobileQuickPos({ isOpen, onClose, onSaleCompleted }) {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]); // [{ product, quantity, unit_price, cost_price, discount }]
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [discount, setDiscount] = useState('');
  const [paidMethod, setPaidMethod] = useState('CASH'); // 'CASH' | 'BKASH' | 'DUE'
  const [paidAmount, setPaidAmount] = useState('');
  const [search, setSearch] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch products and customers
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function loadInitial() {
      try {
        const [prodRes, custRes] = await Promise.all([
          api.get('/products'),
          api.get('/customers').catch(() => ({ data: [] })),
        ]);
        if (!isMounted) return;
        const prodList = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.products || []);
        const custList = Array.isArray(custRes.data) ? custRes.data : (custRes.data?.customers || []);
        setProducts(prodList);
        setCustomers(custList);
      } catch {
        // ignore
      }
    }
    loadInitial();
    return () => { isMounted = false; };
  }, [isOpen]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products.slice(0, 15);
    return products.filter((p) => {
      const name = String(p.name || '').toLowerCase();
      const sku = String(p.sku || '').toLowerCase();
      const barcode = String(p.barcode || '').toLowerCase();
      return name.includes(q) || sku.includes(q) || barcode.includes(q);
    }).slice(0, 20);
  }, [products, search]);

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      const unit_price = Number(product.selling_price || product.sale_price || product.price || 0);
      const cost_price = Number(product.purchase_cost || product.cost_price || 0);
      return [...prev, { product, quantity: 1, unit_price, cost_price, discount: 0 }];
    });
    setSearch('');
  }, []);

  const updateQuantity = useCallback((productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  // Financial calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  }, [cart]);

  const totalCost = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0);
  }, [cart]);

  const numDiscount = Math.max(0, Number(discount || 0));
  const totalPayable = Math.max(0, subtotal - numDiscount);

  // Sync paid amount with payment method
  useEffect(() => {
    if (paidMethod === 'CASH' || paidMethod === 'BKASH') {
      setPaidAmount(String(totalPayable));
    } else if (paidMethod === 'DUE') {
      setPaidAmount('0');
    }
  }, [paidMethod, totalPayable]);

  const numPaid = Math.max(0, Number(paidAmount || 0));
  const dueAmount = Math.max(0, totalPayable - numPaid);

  const handleScanCode = useCallback((code) => {
    const found = products.find((p) => p.barcode === code || p.sku === code);
    if (found) {
      addToCart(found);
    } else {
      setSearch(code);
    }
    setIsScannerOpen(false);
  }, [products, addToCart]);

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      setError('কার্ট খালি! অন্তত একটি পণ্য যোগ করুন।');
      return;
    }
    // Validation: Selling price cannot drop below total cost price
    if (totalCost > 0 && (subtotal - numDiscount) < totalCost) {
      setError(`বিক্রয়মূল্য পণ্যের ক্রয়মূল্যের (৳ ${totalCost.toLocaleString('en-BD')}) চেয়ে কম হতে পারবে না।`);
      return;
    }
    // Validation: Due sale requires customer selection
    if (dueAmount > 0 && !selectedCustomerId) {
      setError('বাকিতে বিক্রয় করতে হলে নির্দিষ্ট গ্রাহক নির্বাচন করতে হবে।');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const salePayload = {
        customer_id: selectedCustomerId || null,
        items: cart.map((i) => ({
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          cost_price: i.cost_price,
          discount: 0,
        })),
        discount: numDiscount,
        discount_type: 'FIXED',
        paid_amount: numPaid,
        payment_method: paidMethod === 'DUE' ? 'DUE' : (paidMethod === 'BKASH' ? 'BKASH' : 'CASH'),
        channel: 'MOBILE_POCKET',
        note: 'Mobile Quick POS',
      };

      const res = await api.post('/sales', salePayload);
      const createdSale = res.data?.sale || res.data;
      if (typeof onSaleCompleted === 'function') {
        onSaleCompleted(createdSale);
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'বিক্রয় সম্পন্ন করা ব্যর্থ হয়েছে।');
    } finally {
      setSaving(false);
    }
  };

  return {
    cart,
    customers,
    filteredProducts,
    selectedCustomerId,
    setSelectedCustomerId,
    discount,
    setDiscount,
    paidMethod,
    setPaidMethod,
    paidAmount,
    setPaidAmount,
    search,
    setSearch,
    isScannerOpen,
    setIsScannerOpen,
    saving,
    error,
    subtotal,
    totalCost,
    totalPayable,
    numPaid,
    dueAmount,
    addToCart,
    updateQuantity,
    removeFromCart,
    handleScanCode,
    handleCompleteSale,
  };
}
