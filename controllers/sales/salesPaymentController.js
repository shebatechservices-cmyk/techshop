const pool = require('../../config/db');
const { recordAccountTransaction } = require('../../services/accountLedgerService');

const money = (val) => Number.parseFloat(val || 0) || 0;

/**
 * Generate a sequential or timestamp-based Money Receipt (MR) number
 */
const generateReceiptNo = async (client, prefix = 'MR') => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${rand}`;
};

/**
 * 1. Collect Due Payment for a Specific Sale Invoice
 */
exports.collectSaleInvoicePayment = async (req, res) => {
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
    const accRes = await client.query(
      'SELECT id, name, account_type, balance FROM payment_accounts WHERE id = $1',
      [account_id]
    );
    if (!accRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Selected payment account does not exist.',
      });
    }
    const account = accRes.rows[0];

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

    // Allow paying up to the invoice due
    const paymentAmount = Math.min(numAmount, currentDue);
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
      reference: `Invoice #${sale.invoice_no || sale.id} (Receipt: ${receiptNo})`,
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
    const updatedSaleRes = await client.query(
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
    await client.query('ROLLBACK');
    console.error('collectSaleInvoicePayment error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to collect due payment.',
    });
  } finally {
    client.release();
  }
};

/**
 * 2. Collect Bulk Due Payment for a Customer Across All Pending Invoices (FIFO)
 */
exports.collectCustomerBulkDuePayment = async (req, res) => {
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
    const accRes = await client.query(
      'SELECT id, name, account_type, balance FROM payment_accounts WHERE id = $1',
      [account_id]
    );
    if (!accRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Selected payment account does not exist.',
      });
    }
    const account = accRes.rows[0];

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

    let remainingToAllocate = numAmount;
    const settledInvoices = [];

    for (const sale of pendingSalesRes.rows) {
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
    await client.query('ROLLBACK');
    console.error('collectCustomerBulkDuePayment error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to collect bulk due payment.',
    });
  } finally {
    client.release();
  }
};
