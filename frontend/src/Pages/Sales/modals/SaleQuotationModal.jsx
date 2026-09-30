import React, { useState, useEffect, useMemo, useRef } from 'react';
import API from '../../../services/api';
import SalePrintModal from './SalePrintModal';
import { fullCatalogName } from '../../../utils/productUtils';
import QuotationCustomerMeta from './quotation/QuotationCustomerMeta';
import QuotationProductSearch from './quotation/QuotationProductSearch';
import QuotationItemsTable from './quotation/QuotationItemsTable';
import QuotationFinancialSummary from './quotation/QuotationFinancialSummary';

const money = (val) => Number.parseFloat(val || 0) || 0;

export default function SaleQuotationModal({
  isOpen,
  onClose,
  customers = [],
  products = [],
  newlyCreatedCustomer,
  onOpenAddCustomer,
  onQuotationCreated,
  editingQuotation = null,
}) {
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

  // Auto-select newly created customer
  useEffect(() => {
    if (newlyCreatedCustomer && newlyCreatedCustomer.id) {
      setCustomerId(String(newlyCreatedCustomer.id));
      setCustomerName(newlyCreatedCustomer.name || '');
      setCustomerPhone(newlyCreatedCustomer.phone || '');
      setCustomerAddress(newlyCreatedCustomer.address || '');
    }
  }, [newlyCreatedCustomer]);

  // Hydrate form when editing an existing quotation
  useEffect(() => {
    if (isOpen && editingQuotation && editingQuotation.id) {
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
    }
  }, [isOpen, editingQuotation, products]);

  // When customer dropdown changes
  const handleCustomerChange = (idStr) => {
    setCustomerId(idStr);
    const sel = customers.find((c) => String(c.id) === String(idStr));
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

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products for search
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return (products || []).filter((p) => {
      if (Number(p.stock || 0) <= 0) return false;
      const full = fullCatalogName(p).toLowerCase();
      const name = (p.name || '').toLowerCase();
      const brand = (p.brand_name || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const barcode = (p.barcode || '').toLowerCase();
      return full.includes(q) || name.includes(q) || brand.includes(q) || sku.includes(q) || barcode.includes(q);
    }).slice(0, 15);
  }, [searchQuery, products]);

  const handleAddItem = (prod) => {
    const fullName = fullCatalogName(prod);
    const existing = items.find((it) => it.product_id === prod.id);
    if (existing) {
      setItems((prev) =>
        prev.map((it) => {
          if (it.product_id !== prod.id) return it;
          const newQty = it.quantity + 1;
          const price = Number(it.unit_price) || 0;
          const uDisc = Number(it.unit_discount) || 0;
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
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>📋</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                New Sales Quotation
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#c7d2fe' }}>
                Prepare formal pricing quotes for corporate, wholesale, or retail clients
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

        {/* Modal Body */}
        <form onSubmit={handleSaveQuotation} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Customer & Quote Meta Card */}
          <QuotationCustomerMeta
            customerId={customerId}
            customers={customers}
            customerName={customerName}
            validUntil={validUntil}
            onCustomerChange={handleCustomerChange}
            onCustomerNameChange={setCustomerName}
            onValidUntilChange={setValidUntil}
            onOpenAddCustomer={onOpenAddCustomer}
          />

          {/* Product Search & Dropdown */}
          <QuotationProductSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isSearchOpen={isSearchOpen}
            onSearchFocus={() => setIsSearchOpen(true)}
            filteredProducts={filteredProducts}
            onAddItem={handleAddItem}
            searchContainerRef={searchContainerRef}
          />

          {/* Quotation Items Table */}
          <QuotationItemsTable
            items={items}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
          />

          {/* Notes & Financial Breakdown Grid */}
          <QuotationFinancialSummary
            notes={notes}
            onNotesChange={setNotes}
            subtotal={subtotal}
            discount={discount}
            onDiscountChange={setDiscount}
            vat={vat}
            onVatChange={setVat}
            grandTotal={grandTotal}
          />

          {/* Footer Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '22px',
              borderTop: '1px solid #f1f5f9',
              paddingTop: '16px',
            }}
          >
            <button
              type="button"
              onClick={handleOpenPrintPreview}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1.5px solid #4f46e5',
                background: '#eef2ff',
                color: '#4f46e5',
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
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '9px 24px',
                borderRadius: '8px',
                border: 'none',
                background: '#4f46e5',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
              }}
            >
              {saving ? 'Saving...' : editingQuotation && editingQuotation.id ? '✓ Update Quotation' : '✓ Save Quotation'}
            </button>
          </div>
        </form>
      </div>

      {/* Quotation Print Modal */}
      <SalePrintModal
        isOpen={isPrintOpen}
        onClose={() => {
          setIsPrintOpen(false);
          if (printQuotation && printQuotation.id !== 'DRAFT') {
            onClose();
          }
        }}
        sale={printQuotation}
        isQuotation={true}
      />
    </div>
  );
}
