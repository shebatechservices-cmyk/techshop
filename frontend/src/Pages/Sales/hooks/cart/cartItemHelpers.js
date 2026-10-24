import {
  fullCatalogName,
  isProductSerialTracked,
  isProductWarrantyRequired,
} from '../../../../utils/productUtils';

export function createCartItem(prod, initialSerial = '', forcedUnit = null, existingItems = []) {
  const isTracked = isProductSerialTracked(prod);
  const isWarrantyReq = isProductWarrantyRequired(prod);
  const fullName = fullCatalogName(prod);

  if (Number((prod && prod.stock) || 0) <= 0) {
    return {
      error: `"${fullName}" has no stock available — cannot add to sale invoice.`,
    };
  }

  const isSubUnitScan =
    forcedUnit === 'sub_unit' ||
    (initialSerial &&
      prod.sub_unit_barcode &&
      prod.sub_unit_barcode.toLowerCase() === initialSerial.toLowerCase());

  const basePrice = Number(
    prod.sale_price !== undefined &&
      prod.sale_price !== null &&
      Number(prod.sale_price) > 0
      ? prod.sale_price
      : prod.salePrice !== undefined &&
        prod.salePrice !== null &&
        Number(prod.salePrice) > 0
      ? prod.salePrice
      : prod.selling_price !== undefined &&
        prod.selling_price !== null &&
        Number(prod.selling_price) > 0
      ? prod.selling_price
      : prod.final_sale_price !== undefined &&
        prod.final_sale_price !== null &&
        Number(prod.final_sale_price) > 0
      ? prod.final_sale_price
      : prod.mrp !== undefined && prod.mrp !== null && Number(prod.mrp) > 0
      ? prod.mrp
      : prod.cost_price || prod.costPrice || prod.purchase_price || 0
  );

  const conversionRate = Number(prod.conversion_rate || 1);
  const subUnitPrice =
    prod.sub_unit_selling_price !== undefined &&
    prod.sub_unit_selling_price !== null &&
    Number(prod.sub_unit_selling_price) > 0
      ? Number(prod.sub_unit_selling_price)
      : conversionRate > 1
      ? Number((basePrice / conversionRate).toFixed(2))
      : basePrice;

  const currentUnitType = isSubUnitScan ? 'sub_unit' : 'base_unit';
  const activePrice = isSubUnitScan ? subUnitPrice : basePrice;
  const activeUnitName = isSubUnitScan
    ? prod.sub_unit_name || 'Meter'
    : prod.unit_name || 'Pcs';

  const existing = (existingItems || []).find(
    (it) => it.product_id === prod.id && it.unit_type === currentUnitType
  );

  if (existing) {
    const newSerials =
      initialSerial && !(existing.serials || []).includes(initialSerial)
        ? [...(existing.serials || []), initialSerial]
        : existing.serials || [];
    const newQty = isTracked
      ? newSerials.length
      : Math.max(existing.quantity + 1, newSerials.length);

    return {
      isExisting: true,
      existingId: existing.localId,
      patch: {
        quantity: newQty,
        serials: newSerials,
        isSerialRequired: isTracked,
        is_serial_required: isTracked,
        is_serial_tracked: isTracked,
        tracks_serial: isTracked,
      },
      expandItem: isTracked && newSerials.length === 0,
    };
  }

  const unitCost = Number(
    prod.cost_price !== undefined && prod.cost_price !== null
      ? prod.cost_price
      : prod.costPrice !== undefined && prod.costPrice !== null
      ? prod.costPrice
      : prod.purchase_price || prod.last_purchase_price || 0
  );
  const startSerials = [];
  if (initialSerial && !isSubUnitScan) {
    startSerials.push(initialSerial);
  }

  const inheritedWarranty =
    prod.batch_warranty_months !== undefined &&
    prod.batch_warranty_months !== null &&
    Number(prod.batch_warranty_months) > 0
      ? Number(prod.batch_warranty_months)
      : prod.warranty_months !== undefined &&
        prod.warranty_months !== null &&
        Number(prod.warranty_months) > 0
      ? Number(prod.warranty_months)
      : isWarrantyReq
      ? ''
      : 0;

  const line = {
    localId: `${Date.now()}-${prod.id}-${currentUnitType}`,
    product_id: prod.id,
    name: fullName,
    full_name: fullName,
    brand_name: prod.brand_name || '',
    stock: Number(prod.stock || 0),
    available_serials: Array.isArray(prod.available_serials) ? prod.available_serials : [],
    quantity: isTracked ? startSerials.length : 1,
    unit_price: activePrice,
    cost_price:
      isSubUnitScan && conversionRate > 1
        ? Number((unitCost / conversionRate).toFixed(2))
        : unitCost,
    base_unit_price: basePrice,
    base_unit_cost: unitCost,
    unit_type: currentUnitType,
    unit_name: activeUnitName,
    base_unit_name: prod.unit_name || 'Pcs',
    sub_unit_name: prod.sub_unit_name || null,
    conversion_rate: conversionRate,
    sub_unit_selling_price: subUnitPrice,
    sub_unit_barcode: prod.sub_unit_barcode || null,
    is_bundle: Boolean(prod.is_bundle),
    bundle_items: Array.isArray(prod.bundle_items) ? prod.bundle_items : [],
    discount: 0,
    warranty_months: inheritedWarranty,
    serials: startSerials,
    isSerialRequired: isTracked,
    is_serial_required: isTracked,
    is_serial_tracked: isTracked,
    tracks_serial: isTracked,
    isWarrantyRequired: isWarrantyReq,
    is_warranty_required: isWarrantyReq,
  };

  return {
    isExisting: false,
    item: line,
    expandItem: isTracked && startSerials.length === 0,
  };
}

export { computeSwitchedUnitItem, applyItemPatch } from './cartUnitHelpers';
