/**
 * Builds backend sale payload and print invoice dataset
 */
export function buildSalePayload({
  customerId,
  subtotal,
  totalDiscount,
  totalVat,
  totalSetupCharge,
  totalExtraCost,
  hasExtraCost,
  extraCostCategory,
  extraCostNotes,
  paid,
  loyaltyPointsToUse,
  acceptedTenders,
  salesPerson,
  destination,
  attention,
  invoiceDate,
  editSale,
  items,
  money,
}) {
  return {
    customer_id: Number(customerId),
    subtotal,
    discount: totalDiscount,
    vat: totalVat,
    setup_charge: totalSetupCharge,
    extra_cost: totalExtraCost,
    extra_cost_category: hasExtraCost ? extraCostCategory || null : null,
    extra_cost_notes: hasExtraCost ? extraCostNotes || null : null,
    paid_amount: paid,
    loyalty_points_to_use: Number(loyaltyPointsToUse || 0),
    payment_method_id: acceptedTenders[0]?.payment_method_id || 1,
    payment_method: acceptedTenders.map((t) => t.method).join(', ') || 'Cash',
    payment_details: acceptedTenders,
    sales_person: salesPerson || null,
    destination: destination || null,
    attention: attention || null,
    invoice_date: invoiceDate || null,
    admin_pin: editSale?.admin_pin || editSale?.adminPin || undefined,
    items: items.map((it) => ({
      product_id: it.product_id,
      quantity: Number(it.quantity),
      unit_price: money(it.unit_price),
      cost_price: money(it.cost_price),
      discount: money(it.discount),
      warranty_months: Number(it.warranty_months || 0),
      serials: it.serials || [],
    })),
  };
}

export function buildSalePrintData({
  baseData,
  selectedCustomer,
  salesPerson,
  destination,
  attention,
  invoiceDate,
  totalExtraCost,
  hasExtraCost,
  extraCostCategory,
  extraCostNotes,
  paymentDetails,
  items,
}) {
  return {
    ...baseData,
    customer_name: selectedCustomer?.name,
    customer_phone: selectedCustomer?.phone,
    customer_email: selectedCustomer?.email,
    customer_address: selectedCustomer?.address,
    sales_person: salesPerson || null,
    destination: destination || null,
    attention: attention || null,
    invoice_date: invoiceDate || null,
    extra_cost: totalExtraCost,
    extra_cost_category: hasExtraCost ? extraCostCategory : null,
    extra_cost_notes: hasExtraCost ? extraCostNotes : null,
    payment_details: paymentDetails,
    items: items.map((it) => ({
      ...it,
      line_total:
        Number(it.quantity || 1) * Number(it.unit_price || 0) -
        Number(it.discount || 0),
    })),
  };
}
