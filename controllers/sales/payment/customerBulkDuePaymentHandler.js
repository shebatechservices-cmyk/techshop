const pool = require('../../../config/db');
const { recordAccountTransaction } = require('../../../services/accountLedgerService');
const { money, generateReceiptNo, verifyPaymentAccount } = require('./salesPaymentHelpers');
const { allocateCustomerBulkDue } = require('./customerBulkDueAllocationHelper');

/**
 * Collect Bulk Due Payment for a Customer Across All Pending Invoices (FIFO)
 */
const collectCustomerBulkDuePayment = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params; // customer_id
    const { amount, account_id, note, reference_no, received_by } = req.body;
    const numAmount = money(amount);

    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid positive payment amount is required.',
      });
    }

    if (!account_id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a payment wallet or account.',
      });
    }

    await client.query('BEGIN');

    // 1. Verify account
    let account = null;
    try {
      account = await verifyPaymentAccount(client, account_id);
    } catch (accErr) {
      await client.query('ROLLBACK');
      return res.status(accErr.status || 404).json({
        success: false,
        message: accErr.message || 'Selected payment account does not exist.',
      });
    }

    // 2. Fetch customer
    const custRes = await client.query(
      'SELECT id, name, phone, address, receivable_balance FROM customers WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (!custRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }
    const customer = custRes.rows[0];
    const prevCustomerBalance = money(customer.receivable_balance);

    // 3. Generate Bulk Receipt Number
    const receiptNo = await generateReceiptNo(client, 'BMR');

    // 4. Fetch unpaid / partial invoices of customer in FIFO order
    const pendingSalesRes = await client.query(
      `SELECT id, invoice_no, total_amount, paid_amount, due_amount, payment_status, payment_details, created_at
       FROM sales
       WHERE customer_id = $1 AND due_amount > 0 AND deleted_at IS NULL
       ORDER BY created_at ASC, id ASC
       FOR UPDATE`,
      [id]
    );

    if (prevCustomerBalance <= 0 && pendingSalesRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `কাস্টমার ${customer.name}-এর কোনো বকেয়া নেই (Zero outstanding due)।`,
      });
    }

    const totalInvoicesDue = pendingSalesRes.rows.reduce((sum, s) => sum + money(s.due_amount), 0);
    const maxPayable = prevCustomerBalance > 0 ? prevCustomerBalance : totalInvoicesDue;

    if (numAmount > maxPayable && maxPayable > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `পেমেন্টের পরিমাণ (৳ ${numAmount}) কাস্টমারের মোট বকেয়া (৳ ${maxPayable}) এর চেয়ে বেশি হতে পারবে না।`,
      });
    }

    const settledInvoices = await allocateCustomerBulkDue(client, {
      pendingSales: pendingSalesRes.rows,
      numAmount,
      receiptNo,
      account,
      reference_no,
      note,
      received_by,
    });

    // 5. Record single account transaction in accounts ledger for the total amount
    await recordAccountTransaction(client, {
      accountId: account.id,
      transactionType: 'credit',
      type: 'due_receive',
      amount: numAmount,
      sourceType: 'customer_bulk_due_collection',
      sourceId: customer.id,
      reference: `Customer: ${customer.name} (#${customer.id}) (Receipt: ${receiptNo})`,
      note: note || `Bulk due settlement for ${customer.name} (Receipt #${receiptNo})`,
      transactionId: reference_no || null,
      createdBy: received_by || 'Cashier',
    });

    // 6. Update customer receivable balance
    const updatedCustRes = await client.query(
      `UPDATE customers
       SET receivable_balance = GREATEST(0, COALESCE(receivable_balance, 0) - $1)
       WHERE id = $2
       RETURNING id, name, phone, address, receivable_balance`,
      [numAmount, id]
    );
    const updatedCustomer = updatedCustRes.rows[0];

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: `Bulk due payment of ৳ ${numAmount.toLocaleString('en-BD', { minimumFractionDigits: 2 })} received successfully!`,
      data: {
        receipt_no: receiptNo,
        is_bulk: true,
        payment_date: new Date().toISOString(),
        amount_collected: numAmount,
        previous_customer_due: prevCustomerBalance,
        current_customer_due: money(updatedCustomer.receivable_balance),
        account: {
          id: account.id,
          name: account.name,
          account_type: account.account_type,
        },
        customer: updatedCustomer,
        settled_invoices: settledInvoices,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => null);
    console.error('collectCustomerBulkDuePayment error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to collect bulk due payment.',
    });
  } finally {
    client.release();
  }
};

module.exports = {
  collectCustomerBulkDuePayment,
};
