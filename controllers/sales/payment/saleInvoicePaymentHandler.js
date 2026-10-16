const pool = require('../../../config/db');
const { recordAccountTransaction } = require('../../../services/accountLedgerService');
const { money, generateReceiptNo, verifyPaymentAccount } = require('./salesPaymentHelpers');

/**
 * Collect Due Payment for a Specific Sale Invoice
 */
const collectSaleInvoicePayment = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
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

    // 1. Check payment account
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

    // 2. Fetch sale invoice
    const saleRes = await client.query('SELECT * FROM sales WHERE id = $1 FOR UPDATE', [id]);
    if (!saleRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Sale invoice not found.',
      });
    }
    const sale = saleRes.rows[0];
    const currentDue = money(sale.due_amount);

    if (currentDue <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Sale invoice #${sale.invoice_no || sale.id} already has zero due (fully paid).`,
      });
    }

    if (numAmount > currentDue) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `পেমেন্টের পরিমাণ (৳ ${numAmount}) ইনভয়েসের বকেয়া (৳ ${currentDue}) এর চেয়ে বেশি হতে পারবে না।`,
      });
    }

    // Allow paying up to the invoice due
    const paymentAmount = numAmount;
    const newPaidAmount = money(sale.paid_amount) + paymentAmount;
    const newDueAmount = Math.max(0, currentDue - paymentAmount);
    const newStatus = newDueAmount <= 0 ? 'paid' : 'partial';

    // 3. Generate Receipt Number
    const receiptNo = await generateReceiptNo(client, 'MR');

    // 4. Record account ledger transaction (inflow/credit)
    await recordAccountTransaction(client, {
      accountId: account.id,
      transactionType: 'credit',
      type: 'due_receive',
      amount: paymentAmount,
      sourceType: 'sale_due_collection',
      sourceId: sale.id,
      reference: `Invoice #${sale.invoice_no || sale.id} (Receipt: ${receiptNo}${sale.customer_id ? `, Customer #${sale.customer_id}` : ''})`,
      note: note || `Due collection for invoice #${sale.invoice_no || sale.id}`,
      transactionId: reference_no || null,
      createdBy: received_by || 'Cashier',
    });

    // 5. Update sales payment_details JSON array
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

    const newPaymentEntry = {
      receipt_no: receiptNo,
      date: new Date().toISOString(),
      amount: paymentAmount,
      account_id: account.id,
      account_name: account.name,
      payment_mode: account.account_type || account.name || 'Cash',
      reference_no: reference_no || null,
      note: note || 'Due Payment Settlement',
      received_by: received_by || null,
    };
    const updatedPayments = [...existingPayments, newPaymentEntry];

    // 6. Update sale record
    await client.query(
      `UPDATE sales
       SET paid_amount = $1,
           due_amount = $2,
           payment_status = $3,
           payment_details = $4
       WHERE id = $5
       RETURNING *`,
      [newPaidAmount, newDueAmount, newStatus, JSON.stringify(updatedPayments), sale.id]
    );

    // 7. Adjust customer receivable balance if linked
    let customerInfo = null;
    if (sale.customer_id) {
      const custRes = await client.query(
        `UPDATE customers
         SET receivable_balance = GREATEST(0, COALESCE(receivable_balance, 0) - $1)
         WHERE id = $2
         RETURNING id, name, phone, address, receivable_balance`,
        [paymentAmount, sale.customer_id]
      );
      if (custRes.rows.length) {
        customerInfo = custRes.rows[0];
      }
    }

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: `Due payment of ৳ ${paymentAmount.toLocaleString('en-BD', { minimumFractionDigits: 2 })} collected successfully!`,
      data: {
        receipt_no: receiptNo,
        payment_date: new Date().toISOString(),
        amount_collected: paymentAmount,
        previous_due: currentDue,
        remaining_invoice_due: newDueAmount,
        payment_status: newStatus,
        account: {
          id: account.id,
          name: account.name,
          account_type: account.account_type,
        },
        sale: {
          id: sale.id,
          invoice_no: sale.invoice_no,
          total_amount: sale.total_amount,
          created_at: sale.created_at,
          paid_amount: newPaidAmount,
          due_amount: newDueAmount,
          payment_status: newStatus,
        },
        customer: customerInfo || {
          name: sale.customer_name || 'Walk-in Customer',
          phone: sale.customer_phone || '',
          address: sale.customer_address || '',
          receivable_balance: 0,
        },
        payment_entry: newPaymentEntry,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => null);
    console.error('collectSaleInvoicePayment error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to collect due payment.',
    });
  } finally {
    client.release();
  }
};

module.exports = {
  collectSaleInvoicePayment,
};
