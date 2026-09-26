import API_BASE from '../../../services/api';
import {
  fullCatalogName,
  productLabel,
  isProductSerialTracked,
  isProductWarrantyRequired,
} from '../../../utils/productUtils';

export {
  fullCatalogName,
  productLabel,
  isProductSerialTracked,
  isProductWarrantyRequired,
};

export const PURCHASE_API = `${API_BASE}/purchase`;

export const money = (value) => Number.parseFloat(value || 0) || 0;

export const taka = (value) =>
  `৳${money(value).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const newTender = (defaultAmount = 0, isAccepted = false) => ({
  id: `${Date.now()}-${Math.random()}`,
  method: 'Cash',
  sub_option: '',
  transaction_id: '',
  receiver_name: '',
  amount: defaultAmount,
  isAccepted,
});

export const today = () => new Date().toISOString().slice(0, 10);

export const EXTRA_COST_CATEGORIES = [
  'Transportation & Logistics',
  'Courier & Parcel Charges',
  'Demurrage / Port / Warehouse Fee',
  'Loading & Labor',
  'Packaging & Handling',
  'Customs & Clearance',
  'Other Overhead',
];

export function computeFinalSale(item) {
  if (item.final_sale_manual && money(item.final_sale_price) > 0)
    return money(item.final_sale_price);
  const cost = money(item.cost_price);
  const margin = money(item.margin_value);
  if (cost <= 0) return 0;
  if (item.margin_type === 'amount') return Number((cost + margin).toFixed(2));
  return Number((cost + (cost * margin) / 100).toFixed(2));
}

export function getItemMissingFields(item) {
  if (!item) return ['Cost Price', 'Sale Price', 'Margin', 'Quantity', 'Warranty'];
  const missing = [];

  const cost = Number(item.cost_price);
  if (
    item.cost_price === '' ||
    item.cost_price === null ||
    item.cost_price === undefined ||
    isNaN(cost) ||
    cost <= 0
  ) {
    missing.push('Cost Price');
  }

  const sale = Number(
    item.sale_price !== '' && item.sale_price !== undefined
      ? item.sale_price
      : item.final_sale_price
  );
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
  if (
    item.margin_value === '' ||
    item.margin_value === null ||
    item.margin_value === undefined ||
    isNaN(margin)
  ) {
    missing.push('Margin');
  }

  const qty = Number(item.quantity);
  if (
    item.quantity === '' ||
    item.quantity === null ||
    item.quantity === undefined ||
    isNaN(qty) ||
    qty <= 0
  ) {
    missing.push('Quantity');
  }

  return missing;
}

export function newLineItem(product) {
  // Automatically populate last purchase price if previously purchased
  const cost = Number(
    product.last_purchase_price || product.purchase_price || product.cost_price || 0
  );
  const sale = Number(product.selling_price || product.sale_price || 0);

  // Margin defaults to percentage (%)
  let marginVal =
    product.last_margin_value !== undefined && product.last_margin_value !== null
      ? String(product.last_margin_value)
      : '';

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
    product.warranty_months !== undefined &&
    product.warranty_months !== null &&
    product.warranty_months !== ''
      ? Number(product.warranty_months)
      : 0;

  const isTracked = isProductSerialTracked(product);
  const isWarrantyReq = isProductWarrantyRequired(product);

  return {
    localId: `${Date.now()}-${product.id}-${Math.floor(Math.random() * 1000)}`,
    product_id: product.id,
    name: product.name || productLabel(product),
    full_name: fullCatalogName(product),
    brand_name: product.brand_name || product.brand || '',
    category_name: product.category_name || product.category || '',
    sku: product.sku || '',
    barcode: product.barcode || '',
    quantity: 1,
    cost_price: cost > 0 ? cost : '',
    sale_price: sale > 0 ? sale : '',
    margin_type: 'percent',
    margin_value: marginVal,
    previous_margin: marginVal || null,
    previous_cost: cost > 0 ? cost : null,
    final_sale_price: finalSale > 0 ? finalSale : '',
    final_sale_manual: false,
    expected_date: today(),
    warranty_months: warranty,
    customer_warranty_months: warranty,
    supplier_warranty_months: product.supplier_warranty_months ? Number(product.supplier_warranty_months) : warranty,
    is_warranty_required: isWarrantyReq,
    has_serials: isTracked,
    is_serial_tracked: isTracked,
    serials: [],
  };
}
