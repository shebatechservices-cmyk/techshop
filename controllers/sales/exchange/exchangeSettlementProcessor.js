const {
    getDrawerAccountId,
    depositToDrawer,
    reverseCashFromDrawer,
} = require('../salesHelpers');

/**
 * Generate a sequential invoice number for exchange sales.
 *
 * @param {import('pg').PoolClient} client
 * @returns {Promise<string>} e.g. INV-EXC-20261015-0012
 */
async function generateExchangeInvoiceNumber(client) {
    const nextValRes = await client.query("SELECT nextval('sales_invoice_no_seq') AS next_val");
    const seqVal = nextValRes.rows[0].next_val;
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    return `INV-EXC-${dateStr}-${String(seqVal).padStart(4, '0')}`;
}

/**
 * Process customer balances, receivables, wallet credits, and cash drawer ledger movements.
 *
 * @param {import('pg').PoolClient} client
 * @param {Object} params
 * @param {number} params.netDifference
 * @param {number} params.totalPaid
 * @param {number} params.invoiceDue
 * @param {number|string} params.customerId
 * @param {string} params.invoiceNo
 * @returns {Promise<void>}
 */
async function processExchangeSettlement(client, {
    netDifference,
    totalPaid,
    invoiceDue,
    customerId,
    invoiceNo,
}) {
    if (netDifference > 0) {
        if (invoiceDue > 0) {
            await client.query(
                `UPDATE customers SET receivable_balance = COALESCE(receivable_balance, 0) + $1, updated_at = NOW() WHERE id = $2`,
                [invoiceDue, customerId]
            );
        }
    } else if (netDifference < 0) {
        const excessCredit = Math.abs(netDifference);
        if (totalPaid > 0) {
            const drawerId = await getDrawerAccountId(client);
            await reverseCashFromDrawer(client, {
                drawerId,
                amount: totalPaid,
                reference: invoiceNo,
                note: `Exchange refund paid to customer for invoice #${invoiceNo}`
            });
        } else {
            await client.query(
                `UPDATE customers 
                 SET receivable_balance = GREATEST(0, COALESCE(receivable_balance, 0) - $1),
                     wallet_balance = COALESCE(wallet_balance, 0) + CASE WHEN COALESCE(receivable_balance, 0) < $1 THEN $1 - COALESCE(receivable_balance, 0) ELSE 0 END,
                     updated_at = NOW() 
                 WHERE id = $2`,
                [excessCredit, customerId]
            );
        }
    }

    if (totalPaid > 0 && netDifference > 0) {
        const drawerId = await getDrawerAccountId(client);
        await depositToDrawer(client, {
            drawerId,
            amount: totalPaid,
            reference: invoiceNo,
            note: `Exchange price difference payment for invoice #${invoiceNo}`
        });
    }
}

module.exports = {
    generateExchangeInvoiceNumber,
    processExchangeSettlement,
};
