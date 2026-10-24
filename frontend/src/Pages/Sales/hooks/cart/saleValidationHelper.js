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
  editSale,
  totalDiscount = 0,
  subtotal = 0,
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

    const unitPrice = money(it.unit_price);
    let costPrice = money(it.cost_price);
    const convRate = Number(it.conversion_rate || 1);
    const isSubUnit = it.unit_type === 'sub_unit' || (it.sub_unit_name && it.unit_name === it.sub_unit_name);
    if (convRate > 1 && (isSubUnit || costPrice > unitPrice * 2)) {
      costPrice = money(costPrice / convRate);
    }
    const qty = Number(it.quantity || 1);
    const itemDiscount = money(it.discount);
    const lineTotal = unitPrice * qty - itemDiscount;
    const lineCost = costPrice * qty;

    if (costPrice > 0 && lineTotal < lineCost) {
      return {
        isValid: false,
        expandedId: it.localId,
        error: `⚠️ "${it.full_name || it.name}"-এ ডিসকাউন্ট দেয়ার পর বিক্রয়মূল্য (${taka(lineTotal)}) পারচেজ কস্ট (${taka(lineCost)}) এর চেয়ে কম হতে পারবে না।`,
      };
    }
  }

  const totalCogs = items.reduce(
    (sum, it) => {
      let itemCost = money(it.cost_price);
      const convRate = Number(it.conversion_rate || 1);
      const isSubUnit = it.unit_type === 'sub_unit' || (it.sub_unit_name && it.unit_name === it.sub_unit_name);
      if (convRate > 1 && (isSubUnit || itemCost > money(it.unit_price) * 2)) {
        itemCost = money(itemCost / convRate);
      }
      return sum + (itemCost * Number(it.quantity || 1));
    },
    0
  );
  const netInvoiceAfterDiscount = money(subtotal) - money(totalDiscount);
  if (totalCogs > 0 && netInvoiceAfterDiscount < totalCogs) {
    return {
      isValid: false,
      error: `⚠️ মোট ডিসকাউন্ট দেয়ার পর ইনভয়েস বিক্রয়মূল্য (${taka(netInvoiceAfterDiscount)}) মোট পারচেজ কস্ট (${taka(totalCogs)}) এর চেয়ে কম হতে পারবে না।`,
    };
  }

  if (editSale && money(editSale.paid_amount) > 0) {
    const priorPaid = money(editSale.paid_amount);
    if (money(totalDiscount) > priorPaid) {
      return {
        isValid: false,
        error: `⚠️ মোট ডিসকাউন্টের পরিমাণ (${taka(totalDiscount)}) ইনভয়েসের পরিশোধিত পরিমাণ (${taka(priorPaid)}) এর চেয়ে বেশি হতে পারবে না।`,
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
