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
 * Verify that payment account exists and return its row
 */
const verifyPaymentAccount = async (client, accountId) => {
  const accRes = await client.query(
    'SELECT id, name, account_type, balance FROM payment_accounts WHERE id = $1',
    [accountId]
  );
  if (!accRes.rows.length) {
    const err = new Error('Selected payment account does not exist.');
    err.status = 404;
    throw err;
  }
  return accRes.rows[0];
};

module.exports = {
  money,
  generateReceiptNo,
  verifyPaymentAccount,
};
