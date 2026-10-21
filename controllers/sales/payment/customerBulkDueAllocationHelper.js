const { money } = require('./salesPaymentHelpers');

/**
 * Allocates bulk due payment across customer pending sales invoices FIFO.
 */
async function allocateCustomerBulkDue(client, { pendingSales, numAmount, receiptNo, account, reference_no, note, received_by }) {
  let remainingToAllocate = numAmount;
  const settledInvoices = [];

  for (const sale of pendingSales) {
    if (remainingToAllocate <= 0) break;

    const saleDue = money(sale.due_amount);
    const allocated = Math.min(remainingToAllocate, saleDue);
    const newPaid = money(sale.paid_amount) + allocated;
    const newDue = Math.max(0, saleDue - allocated);
    const newStatus = newDue <= 0 ? 'paid' : 'partial';

    let existingPayments = [];
    try {
      if (Array.isArray(sale.payment_details)) {
        existingPayments = sale.payment_details;
      } else if (typeof sale.payment_details === 'string') {
        existingPayments = JSON.parse(sale.payment_details);
      }
    } catch {
      existingPayments = [];
    }

    const paymentEntry = {
      receipt_no: receiptNo,
      date: new Date().toISOString(),
      amount: allocated,
      account_id: account.id,
      account_name: account.name,
      payment_mode: account.account_type || account.name || 'Cash',
      reference_no: reference_no || null,
      note: note || `Bulk Due Settlement via ${receiptNo}`,
      received_by: received_by || null,
    };

    await client.query(
      `UPDATE sales
       SET paid_amount = $1,
           due_amount = $2,
           payment_status = $3,
           payment_details = $4
       WHERE id = $5`,
      [newPaid, newDue, newStatus, JSON.stringify([...existingPayments, paymentEntry]), sale.id]
    );

    settledInvoices.push({
      id: sale.id,
      invoice_no: sale.invoice_no,
      previous_due: saleDue,
      amount_settled: allocated,
      remaining_due: newDue,
      status: newStatus,
    });

    remainingToAllocate -= allocated;
  }

  return settledInvoices;
}

module.exports = {
  allocateCustomerBulkDue,
};
