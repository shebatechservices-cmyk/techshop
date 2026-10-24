import {
  fullCatalogName,
  isProductSerialTracked,
  isProductWarrantyRequired,
} from '../../../../utils/productUtils';
import { money } from '../useSalePricingAndCharges';

/**
 * Distribute legacy invoice-level discount across items if item-level discounts are zero.
 */
export function distributeLegacyDiscounts(rawSaleItems, invoiceDiscount) {
  if (invoiceDiscount <= 0 || !rawSaleItems.length) return [];
  const rawSubtotal = rawSaleItems.reduce(
    (acc, it) => acc + Number(it.quantity || 1) * Number(it.unit_price || 0),
    0
  );
  let remaining = invoiceDiscount;
  return rawSaleItems.map((it, idx) => {
    if (idx === rawSaleItems.length - 1) return remaining;
    const itemSub = Number(it.quantity || 1) * Number(it.unit_price || 0);
    const share = rawSubtotal > 0 ? Math.round((itemSub / rawSubtotal) * invoiceDiscount) : 0;
    const assigned = Math.min(remaining, share);
    remaining = Math.max(0, remaining - assigned);
    return assigned;
  });
}

/**
 * Maps raw sale items fetched from database/API into cart items, normalizing dual-unit costs.
 */
export function mapRawSaleItemsToCart(rawSaleItems, products, distributedLegacyDiscounts = []) {
  return rawSaleItems.map((it, idx) => {
    const prodInList = (products || []).find((p) => p.id === it.product_id);
    const fullName = fullCatalogName(prodInList || it);
    const isTracked = isProductSerialTracked(prodInList) || isProductSerialTracked(it);
    const isWarrantyReq = isProductWarrantyRequired(prodInList) || isProductWarrantyRequired(it);
    const serialsList = Array.isArray(it.serials) ? it.serials : [];
    const itemDisc = money(it.discount) > 0 ? money(it.discount) : (distributedLegacyDiscounts[idx] || 0);

    const convRate = Number(prodInList?.conversion_rate || it.conversion_rate || 1);
    const isSubUnit =
      it.unit_type === 'sub_unit' ||
      (prodInList?.sub_unit_name &&
        (it.unit_name === prodInList.sub_unit_name || it.unit_name === 'Meter'));

    const baseUnitCost = prodInList
      ? Number(prodInList.purchase_price || it.cost_price || 0)
      : Number(it.cost_price || 0);

    let hydCost = money(it.cost_price);
    if (convRate > 1 && (isSubUnit || hydCost > money(it.unit_price) * 2)) {
      hydCost = money((baseUnitCost || hydCost) / convRate);
    }

    return {
      localId: `${Date.now()}-${idx}`,
      product_id: it.product_id,
      name: fullName,
      full_name: fullName,
      brand_name: it.brand_name || (prodInList && prodInList.brand_name) || '',
      stock: prodInList ? Number(prodInList.stock || 0) : 0,
      quantity: isTracked ? serialsList.length : Number(it.quantity || 1),
      unit_price: money(it.unit_price),
      cost_price: hydCost,
      discount: money(itemDisc),
      warranty_months:
        it.warranty_months !== undefined && it.warranty_months !== null
          ? Number(it.warranty_months)
          : prodInList
          ? Number(prodInList.warranty_months || 0)
          : 0,
      serials: serialsList,
      is_serial_tracked: isTracked,
      is_warranty_required: isWarrantyReq,
      unit_type: isSubUnit ? 'sub_unit' : (it.unit_type || 'base_unit'),
      unit_name: it.unit_name || (isSubUnit ? prodInList?.sub_unit_name : prodInList?.unit_name) || 'Pcs',
      base_unit_name: prodInList?.unit_name || 'Roll',
      sub_unit_name: prodInList?.sub_unit_name || null,
      conversion_rate: convRate,
      sub_unit_selling_price: prodInList?.sub_unit_selling_price ? Number(prodInList.sub_unit_selling_price) : null,
      sub_unit_barcode: prodInList?.sub_unit_barcode || null,
      base_unit_price: prodInList ? Number(prodInList.selling_price || prodInList.sale_price || it.unit_price) : Number(it.unit_price),
      base_unit_cost: baseUnitCost,
    };
  });
}
