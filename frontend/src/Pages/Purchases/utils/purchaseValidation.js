import { money as defaultMoney } from './purchaseCartUtils';

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
