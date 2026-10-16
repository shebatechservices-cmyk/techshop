import API_BASE from '../../../../services/api';

/**
 * Fetch barcode / serial details from backend API
 */
export async function fetchBarcodeLookup(code) {
  if (!code) return null;
  const res = await fetch(`${API_BASE}/search/barcode-lookup?code=${encodeURIComponent(code)}`);
  if (!res.ok) return null;
  const json = await res.json();
  if (json.success && json.data) {
    return {
      modalData: json.data,
      modalMatchType: json.match_type || 'SERIAL',
      modalScannedCode: json.scanned_code || code,
    };
  }
  return null;
}

/**
 * Build 4-dimension modal data (Product, Purchase, Inventory, Sale, Warranty) from a product record
 */
export function buildFallbackModalData(targetProd, code = '') {
  if (!targetProd) return null;

  const firstPo = targetProd.purchase_history?.[0] || null;
  const firstSale = targetProd.sales_history?.[0] || null;
  const isUnitSold = targetProd.matched_serial_status === 'Sold' || Boolean(firstSale);
  const unitStatus = targetProd.matched_serial
    ? (isUnitSold ? 'Sold' : 'In Stock')
    : (Number(targetProd.stock) > 0 ? 'In Stock' : 'Out of Stock');

  const modalData = {
    serial_code: targetProd.matched_serial || null,
    status: unitStatus,
    product: {
      id: targetProd.id,
      name: targetProd.name,
      brand_name: targetProd.brand_name,
      category_name: targetProd.category_name,
      sku: targetProd.sku,
      barcode: targetProd.barcode,
      stock: targetProd.stock,
      cost_price: targetProd.cost_price,
      sale_price: targetProd.sale_price,
    },
    purchase: firstPo ? {
      po_id: firstPo.po_id,
      po_number: firstPo.po_number,
      purchase_date: firstPo.purchase_date,
      cost_price: firstPo.cost_price,
      supplier_name: firstPo.supplier_name,
      supplier_phone: firstPo.supplier_phone,
      supplier_warranty_expire_date: firstPo.supplier_warranty_expire_date,
    } : null,
    inventory: {
      stock: targetProd.stock,
      unit_status: targetProd.matched_serial
        ? (isUnitSold ? 'Sold to Customer' : 'Available in Inventory')
        : (Number(targetProd.stock) > 0 ? 'In Stock' : 'Out of Stock'),
      cost_price: targetProd.cost_price,
      sale_price: targetProd.sale_price,
    },
    sale: firstSale ? {
      sale_id: firstSale.sale_id,
      invoice_no: firstSale.invoice_no,
      sale_date: firstSale.sale_date,
      customer_name: firstSale.customer_name,
      customer_phone: firstSale.customer_phone,
      unit_price: firstSale.unit_price,
      payment_status: 'paid',
    } : null,
    warranty: {
      warranty_months: targetProd.warranty_months,
      customer_warranty_info: `${targetProd.warranty_months || 12} Months Policy`,
      claims: targetProd.warranty_claims || [],
      returns: targetProd.returns_refunds || [],
    },
  };

  const modalMatchType = targetProd.matched_serial
    ? (isUnitSold ? 'SERIAL_SOLD' : 'SERIAL_INVENTORY')
    : (targetProd.barcode ? 'PRODUCT_BARCODE' : 'PRODUCT_DETAILS');

  const modalScannedCode = code || targetProd.matched_serial || targetProd.barcode || targetProd.sku;

  return { modalData, modalMatchType, modalScannedCode };
}

/**
 * Orchestrate barcode/serial lookup with fallback synthesis
 */
export async function resolveBarcodeModalPayload(codeToLookup, fallbackProduct = null, query = '', products = []) {
  const code = (codeToLookup || query || '').trim();
  if (!code && !fallbackProduct) return null;

  if (code) {
    const lookup = await fetchBarcodeLookup(code);
    if (lookup) return lookup;
  }

  const targetProd = fallbackProduct || (products && products.length === 1 ? products[0] : null);
  if (targetProd) {
    return buildFallbackModalData(targetProd, code);
  }

  return null;
}
