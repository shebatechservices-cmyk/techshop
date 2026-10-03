import {
  money as defaultMoney,
  computeFinalSale as defaultComputeFinalSale,
} from './purchaseCartUtils';
import { parseWarrantyMonths } from './purchaseItemMapper';

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
  extraCost,
  extraCostCategory,
  extraCostNotes,
  items = [],
  tenders = [],
  accountLabelToId,
  walletAccounts = [],
  computeFinalSale = defaultComputeFinalSale,
  money = defaultMoney,
}) => {
  const extraVal = hasExtraCost
    ? (typeof extra === 'number' && extra > 0 ? extra : money(extraCost !== undefined && extraCost !== '' ? extraCost : extra))
    : 0;
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
