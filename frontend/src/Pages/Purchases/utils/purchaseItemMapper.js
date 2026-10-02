import {
  productLabel as defaultProductLabel,
  fullCatalogName as defaultFullCatalogName,
  isProductSerialTracked as defaultIsProductSerialTracked,
  isProductWarrantyRequired as defaultIsProductWarrantyRequired,
  today as defaultToday,
} from './purchaseCartUtils';

/**
 * Parse warranty months value into a non-negative integer
 */
export const parseWarrantyMonths = (val) => {
  if (typeof val === 'number' && !isNaN(val)) {
    return Math.max(0, Math.round(val));
  }
  if (val !== undefined && val !== null && val !== '') {
    const parsed = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  }
  return 0;
};

/**
 * Map order line items into purchase form items state
 */
export const mapOrderToFormItems = (
  items = [],
  productList = [],
  isProductSerialTracked = defaultIsProductSerialTracked,
  isProductWarrantyRequired = defaultIsProductWarrantyRequired,
  productLabel = defaultProductLabel,
  fullCatalogName = defaultFullCatalogName,
  today = defaultToday
) => {
  if (!Array.isArray(items)) return [];

  return items.map((it) => {
    const prod = productList.find((p) => p.id === it.product_id) || {};
    const isTracked = Boolean(
      (isProductSerialTracked && isProductSerialTracked(prod)) ||
      (isProductSerialTracked && isProductSerialTracked(it))
    );
    const isWarrantyReq = Boolean(
      (isProductWarrantyRequired && isProductWarrantyRequired(prod)) ||
      (isProductWarrantyRequired && isProductWarrantyRequired(it))
    );
    const serials = Array.isArray(it.serials) ? it.serials : [];
    const cost = Number(it.cost_price || 0);
    const rawFinalSale = Number(it.final_sale_price || 0);
    const rawSalePrice = Number(it.sale_price || 0);
    const prodSalePrice = Number(prod.selling_price || prod.sale_price || 0);
    let sale = Math.max(rawFinalSale, rawSalePrice, prodSalePrice);

    let marginType = it.margin_type || 'percent';
    let marginVal = '';
    const rawMargin = it.margin_value;
    const numMargin =
      rawMargin !== undefined && rawMargin !== null && String(rawMargin).trim() !== ''
        ? Number(rawMargin)
        : null;

    if (numMargin !== null && !isNaN(numMargin) && numMargin > 0) {
      marginVal = String(numMargin);
      if (marginVal.endsWith('.00')) marginVal = marginVal.slice(0, -3);
    } else if (cost > 0 && sale > cost) {
      if (marginType === 'amount') {
        marginVal = String(Number((sale - cost).toFixed(2)));
      } else {
        marginVal = (((sale - cost) / cost) * 100).toFixed(2);
        if (marginVal.endsWith('.00')) marginVal = marginVal.slice(0, -3);
      }
    } else if (cost > 0 && (!sale || sale <= cost)) {
      marginVal = '15';
      sale = Number((cost + (cost * 15) / 100).toFixed(2));
    } else if (numMargin !== null && !isNaN(numMargin)) {
      marginVal = String(numMargin);
    } else {
      marginVal = '15';
    }

    if (!sale && cost > 0) {
      const m = Number(marginVal) || 15;
      sale = marginType === 'amount' ? cost + m : Number((cost + (cost * m) / 100).toFixed(2));
    }

    const rawWarranty =
      it.customer_warranty_months !== undefined &&
      it.customer_warranty_months !== null
        ? it.customer_warranty_months
        : it.warranty_months;
    const cleanWarranty = parseWarrantyMonths(rawWarranty);

    return {
      ...it,
      id: it.id,
      localId: `${Date.now()}-${it.product_id}-${Math.floor(
        Math.random() * 1000
      )}`,
      product_id: it.product_id,
      product_name: it.product_name || prod.name || prod.product_name || '',
      name: (prod && prod.id && productLabel ? productLabel(prod) : '') || it.full_name || it.name || it.product_name || prod.name || '',
      full_name: (prod && prod.id && fullCatalogName ? fullCatalogName(prod) : '') || it.full_name || it.name || it.product_name || prod.name || '',
      brand_name: it.brand_name || prod.brand_name || '',
      category_name: it.category_name || prod.category_name || '',
      model_name: it.model_name || prod.model_name || '',
      series_name: it.series_name || prod.series_name || '',
      sku: it.sku || prod.sku || '',
      barcode: it.barcode || prod.barcode || '',
      quantity: isTracked
        ? serials.length > 0
          ? serials.length
          : Number(it.quantity || 0)
        : Number(it.quantity || 1),
      cost_price: cost > 0 ? cost : '',
      sale_price: sale > 0 ? sale : '',
      margin_type: marginType,
      margin_value: marginVal,
      previous_margin: marginVal || null,
      previous_cost: cost > 0 ? cost : null,
      final_sale_price: sale > 0 ? sale : '',
      final_sale_manual: Boolean(sale > 0 && sale > cost),
      expected_date: it.expected_date
        ? it.expected_date.split('T')[0]
        : (today ? today() : new Date().toISOString().split('T')[0]),
      warranty_months: cleanWarranty,
      customer_warranty_months: cleanWarranty,
      supplier_warranty_months:
        it.supplier_warranty_months !== undefined && it.supplier_warranty_months !== null
          ? Number(it.supplier_warranty_months)
          : cleanWarranty,
      is_warranty_required: isWarrantyReq,
      has_serials: isTracked,
      is_serial_tracked: isTracked,
      serials,
    };
  });
};
