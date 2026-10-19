/**
 * Validates sale submission fields, items, serial tracking, warranty, and tenders.
 */
export function validateSaleSubmission({
  customerId,
  items,
  tenders,
  paid,
  totalPayable,
  money,
  taka,
}) {
  if (!customerId) {
    return {
      isValid: false,
      popupMsg:
        '⚠️ Please select a customer — sales invoices cannot be saved without selecting a customer.',
    };
  }
  if (!items.length) {
    return { isValid: false, error: 'Please add at least one product' };
  }

  for (const it of items) {
    if (it.is_serial_tracked) {
      if (!it.serials || it.serials.length === 0) {
        return {
          isValid: false,
          expandedId: it.localId,
          error: `"${
            it.full_name || it.name
          }" is Serial/Barcode-tracked — please scan or add serial numbers before saving.`,
        };
      }
      if (Number(it.quantity || 0) !== it.serials.length) {
        return {
          isValid: false,
          error: `"${it.full_name || it.name}" quantity (${
            it.quantity
          }) must match the number of attached serials (${it.serials.length}).`,
        };
      }
    }
    if (it.is_warranty_required) {
      if (
        it.warranty_months === '' ||
        it.warranty_months === null ||
        it.warranty_months === undefined ||
        Number(it.warranty_months) <= 0
      ) {
        return {
          isValid: false,
          error: `"${
            it.full_name || it.name
          }" requires warranty duration — please specify warranty months.`,
        };
      }
    }
    if (Number(it.quantity || 0) <= 0) {
      return {
        isValid: false,
        error: `Please specify a valid quantity for "${it.full_name || it.name}"`,
      };
    }
    if (Number(it.unit_price || 0) <= 0) {
      return {
        isValid: false,
        error: `Please specify a valid unit selling price for "${it.full_name || it.name}"`,
      };
    }
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
  if (paid > totalPayable) {
    return {
      isValid: false,
      popupMsg: `⚠️ Total paid amount (${taka(paid)}) exceeds Total Payable (${taka(
        totalPayable
      )}). Please click "Pay Full (${taka(
        totalPayable
      )})" to adjust, or edit the payment amount.`,
    };
  }

  return { isValid: true };
}
