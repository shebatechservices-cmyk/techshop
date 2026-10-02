import {
  money as defaultMoney,
  computeFinalSale as defaultComputeFinalSale,
  today as defaultToday,
  productLabel as defaultProductLabel,
  fullCatalogName as defaultFullCatalogName,
  isProductSerialTracked as defaultIsProductSerialTracked,
  isProductWarrantyRequired as defaultIsProductWarrantyRequired,
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

/**
 * Validates purchase form before saving
 */
export const validatePurchaseOrder = ({
  items = [],
  tenders = [],
  supplierId,
  selectedSupplierObj,
  money = defaultMoney,
}) => {
  if (!supplierId && !selectedSupplierObj) {
    return {
      isValid: false,
      popupMsg:
        '⚠️ Please select a supplier — purchase invoices cannot be saved without selecting a supplier.',
    };
  }

  if (!items.length) {
    return {
      isValid: false,
      errorMsg: 'Please add at least one product',
    };
  }

  const unacceptedWithAmount = tenders.filter(
    (t) => !t.isAccepted && money(t.amount) > 0
  );
  if (unacceptedWithAmount.length > 0) {
    return {
      isValid: false,
      popupMsg:
        '⚠️ You have unconfirmed payment rows. Please click "✓ Accept" to confirm each payment entry, or "Cancel" to remove it before saving.',
    };
  }

  // Complete validation for every line item
  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];
    const title = it.full_name || it.name || `Item #${idx + 1}`;
    if (!it.product_id) {
      return {
        isValid: false,
        errorItemId: it.localId,
        errorMsg: `Item #${idx + 1}: Please select a valid product.`,
      };
    }
    const cost = money(it.cost_price);
    if (cost <= 0) {
      return {
        isValid: false,
        errorItemId: it.localId,
        errorMsg: `Item #${idx + 1} ("${title}"): Cost Price must be greater than 0.`,
      };
    }
    const qty = Number(it.quantity || 0);
    if (qty <= 0) {
      return {
        isValid: false,
        errorItemId: it.localId,
        errorMsg: `Item #${idx + 1} ("${title}"): Quantity must be at least 1.`,
      };
    }
    if (it.is_serial_tracked && (it.serials || []).length === 0) {
      return {
        isValid: false,
        errorItemId: it.localId,
        barcodeScanError: {
          localId: it.localId,
          message: `⚠️ Barcode/Serial is required for "${title}". Please scan or enter at least 1 barcode.`,
        },
        errorMsg: `Item #${idx + 1} ("${title}"): This product requires serial/barcode tracking. Please scan at least 1 barcode.`,
      };
    }
    if (it.is_serial_tracked && (it.serials || []).length !== qty) {
      return {
        isValid: false,
        errorItemId: it.localId,
        errorMsg: `Item #${idx + 1} ("${title}"): Scanned barcodes count (${
          (it.serials || []).length
        }) must match quantity (${qty}). Please scan all barcodes.`,
      };
    }
    if (!it.expected_date) {
      return {
        isValid: false,
        errorItemId: it.localId,
        errorMsg: `Item #${idx + 1} ("${title}"): Please specify Expected Inward Date.`,
      };
    }
    if (
      it.warranty_months === undefined ||
      it.warranty_months === null ||
      it.warranty_months === '' ||
      Number(it.warranty_months) < 0
    ) {
      return {
        isValid: false,
        errorItemId: it.localId,
        errorMsg: `Item #${idx + 1} ("${title}"): Please specify Customer Warranty (minimum 0 months).`,
      };
    }
  }

  return { isValid: true };
};

/**
 * Builds the API payload for saving a purchase order
 */
export const buildPurchaseApiPayload = ({
  supplierId,
  selectedSupplierObj,
  reference,
  discount,
  hasExtraCost,
  extra,
  extraCostCategory,
  extraCostNotes,
  items = [],
  tenders = [],
  accountLabelToId,
  walletAccounts = [],
  computeFinalSale = defaultComputeFinalSale,
  money = defaultMoney,
}) => {
  const extraVal = hasExtraCost ? (typeof extra === 'number' ? extra : money(extra)) : 0;
  const totalGoodsCost = items.reduce(
    (sum, it) => sum + money(it.cost_price) * Math.max(1, parseInt(it.quantity, 10) || 1),
    0
  );
  const overheadRatio = totalGoodsCost > 0 && extraVal > 0 ? extraVal / totalGoodsCost : 0;

  return {
    supplier_id: Number(supplierId || selectedSupplierObj?.id),
    transaction_reference: reference || '',
    discount: money(discount),
    extra_cost: extraVal,
    extra_cost_category: hasExtraCost ? extraCostCategory : null,
    extra_cost_notes: hasExtraCost ? (extraCostNotes || '') : '',
    items: items.map((item) => {
      const costPrice = money(item.cost_price);
      const finalUnitCost = Number((costPrice * (1 + overheadRatio)).toFixed(2));
      const rawCustWarranty =
        item.customer_warranty_months !== undefined
          ? item.customer_warranty_months
          : item.warranty_months;
      const rawSuppWarranty =
        item.supplier_warranty_months !== undefined
          ? item.supplier_warranty_months
          : item.warranty_months;

      const cleanCustWarranty = parseWarrantyMonths(rawCustWarranty);
      const cleanSuppWarranty = parseWarrantyMonths(rawSuppWarranty);

      return {
        id: item.id || undefined,
        product_id: parseInt(item.product_id, 10) || 0,
        quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
        cost_price: costPrice,
        final_cost: finalUnitCost,
        sale_price: money(item.sale_price),
        margin_type: item.margin_type || 'percent',
        margin_value: money(item.margin_value),
        final_sale_price: computeFinalSale
          ? computeFinalSale(item, finalUnitCost)
          : Number(item.final_sale_price || item.sale_price || 0),
        expected_date:
          item.expected_date || new Date().toISOString().split('T')[0],
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
        if (t.sub_option && accountLabelToId && accountLabelToId(t.sub_option)) {
          resolvedAccId = accountLabelToId(t.sub_option);
        }
        if (!resolvedAccId && walletAccounts && walletAccounts.length > 0) {
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
  };
};
