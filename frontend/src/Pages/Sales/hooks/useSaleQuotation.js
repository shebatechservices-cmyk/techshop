import { useState, useEffect } from 'react';
import { fullCatalogName } from '../../../utils/productUtils';
import { useQuotationCustomer } from './quotation/useQuotationCustomer';
import { useQuotationItems } from './quotation/useQuotationItems';
import { useQuotationSave } from './quotation/useQuotationSave';

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
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState(
    '1. Prices are valid for 7 days from quotation date.\n2. Standard manufacturer warranty applies where indicated.'
  );
  const [discount, setDiscount] = useState(0);
  const [vat, setVat] = useState(0);

  const customerState = useQuotationCustomer({
    isOpen,
    customers,
    newlyCreatedCustomer,
  });

  const itemsState = useQuotationItems({ products });

  // Hydrate form when editing an existing quotation or when opening with initialProduct
  useEffect(() => {
    if (isOpen) {
      if (editingQuotation && editingQuotation.id) {
        customerState.setCustomerId(
          editingQuotation.customer_id ? String(editingQuotation.customer_id) : ''
        );
        customerState.setCustomerName(editingQuotation.customer_name || '');
        customerState.setCustomerPhone(editingQuotation.customer_phone || '');
        customerState.setCustomerAddress(editingQuotation.customer_address || '');
        setValidUntil(
          editingQuotation.valid_until ? String(editingQuotation.valid_until).slice(0, 10) : ''
        );
        setNotes(editingQuotation.notes || '');
        setDiscount(money(editingQuotation.discount));
        setVat(money(editingQuotation.vat));
        itemsState.setItems(
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
                  warranty_months:
                    it.warranty_months !== undefined && it.warranty_months !== null
                      ? Number(it.warranty_months)
                      : prodInList
                      ? Number(prodInList.warranty_months || 0)
                      : 0,
                };
              })
            : []
        );
      } else if (initialProduct && initialProduct.id) {
        const fullName = fullCatalogName(initialProduct);
        const price = Number(
          initialProduct.sale_price !== undefined &&
            initialProduct.sale_price !== null &&
            Number(initialProduct.sale_price) > 0
            ? initialProduct.sale_price
            : initialProduct.salePrice ||
                initialProduct.selling_price ||
                initialProduct.final_sale_price ||
                initialProduct.mrp ||
                0
        );
        itemsState.setItems([
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
        customerState.setCustomerId('');
        customerState.setCustomerName('');
        customerState.setCustomerPhone('');
        customerState.setCustomerAddress('');
        setDiscount(0);
        setVat(0);
      } else {
        itemsState.setItems([]);
        customerState.setCustomerId('');
        customerState.setCustomerName('');
        customerState.setCustomerPhone('');
        customerState.setCustomerAddress('');
        setDiscount(0);
        setVat(0);
      }
    }
  }, [isOpen, editingQuotation, initialProduct, products]);

  const subtotal = itemsState.items.reduce(
    (sum, it) => sum + (Number(it.line_total) || 0),
    0
  );
  const totalDiscount = money(discount);
  const totalVat = money(vat);
  const grandTotal = Math.max(0, subtotal - totalDiscount + totalVat);

  const saveState = useQuotationSave({
    items: itemsState.items,
    customerId: customerState.customerId,
    customerName: customerState.customerName,
    customerPhone: customerState.customerPhone,
    customerAddress: customerState.customerAddress,
    validUntil,
    notes,
    subtotal,
    totalDiscount,
    totalVat,
    grandTotal,
    editingQuotation,
    onQuotationCreated,
  });

  return {
    ...customerState,
    ...itemsState,
    ...saveState,
    validUntil,
    setValidUntil,
    notes,
    setNotes,
    discount,
    setDiscount,
    vat,
    setVat,
    subtotal,
    grandTotal,
  };
}
