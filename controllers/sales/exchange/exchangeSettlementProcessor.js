const {
    money,
    getDrawerAccountId,
    depositToDrawer,
    reverseCashFromDrawer,
} = require('../salesHelpers');
const { writeWalletLedger } = require('../../walletController');

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
 * Automatically synchronizes previous invoice due amounts when an original sale is linked.
 *
 * @param {import('pg').PoolClient} client
 * @param {Object} params
 * @param {number|null} [params.originalSaleId]
 * @param {number} [params.returnSubtotal]
 * @param {number} [params.newSubtotal]
 * @param {number} params.netDifference
 * @param {number} params.totalPaid
 * @param {number} params.invoiceDue
 * @param {number|string} params.customerId
 * @param {string} params.invoiceNo
 * @returns {Promise<void>}
 */
async function processExchangeSettlement(client, {
    originalSaleId = null,
    returnSubtotal = 0,
    newSubtotal = 0,
    netDifference,
    totalPaid,
    invoiceDue,
    customerId,
    invoiceNo,
}) {
    if (originalSaleId) {
        const origSaleRes = await client.query('SELECT * FROM sales WHERE id = $1 FOR UPDATE', [originalSaleId]);
        if (origSaleRes.rows.length) {
            const origSale = origSaleRes.rows[0];
            const origTotal = money(origSale.total_amount);
            const origPaid = money(origSale.paid_amount);
            const origDue = money(origSale.due_amount);

            // Revised bill for items customer actually keeps or exchanged
            const revisedTotal = Math.max(0, origTotal - returnSubtotal + newSubtotal);
            const newOrigDue = Math.max(0, revisedTotal - origPaid);
            const dueCleared = Math.max(0, origDue - newOrigDue);
            const newOrigStatus = newOrigDue <= 0 ? 'paid' : 'partial';

            // 1. Update original sale due & payment status with explicit separate parameters
            await client.query(
                `UPDATE sales
                 SET due_amount = $1::numeric,
                     payment_status = $2
                 WHERE id = $3`,
                [newOrigDue, newOrigStatus, originalSaleId]
            );

            // 2. Adjust customer receivable balance if previous due was cleared
            if (dueCleared > 0 && customerId) {
                await client.query(
                    `UPDATE customers
                     SET receivable_balance = GREATEST(0::numeric, COALESCE(receivable_balance, 0) - $1::numeric),
                         updated_at = NOW()
                     WHERE id = $2`,
                    [dueCleared, customerId]
                );
            }

            // 3. Check if customer's prior payments exceed the revised bill
            const netCustomerRefund = Math.max(0, origPaid - revisedTotal);

            if (totalPaid > 0) {
                if (netCustomerRefund > 0) {
                    const drawerId = await getDrawerAccountId(client);
                    await reverseCashFromDrawer(client, {
                        drawerId,
                        amount: totalPaid,
                        reference: invoiceNo,
                        note: `Exchange refund paid to customer for invoice #${invoiceNo}`
                    });
                } else if (netDifference > 0) {
                    const drawerId = await getDrawerAccountId(client);
                    await depositToDrawer(client, {
                        drawerId,
                        amount: totalPaid,
                        reference: invoiceNo,
                        note: `Exchange price difference payment for invoice #${invoiceNo}`
                    });
                }
            }

            // If there is excess refund credit not collected in cash, credit to customer's wallet
            const unrefundedCredit = Math.max(0, netCustomerRefund - totalPaid);
            if (unrefundedCredit > 0 && customerId) {
                const custWalletRes = await client.query('SELECT wallet_balance, name FROM customers WHERE id = $1', [customerId]);
                const prevWallet = money(custWalletRes.rows[0]?.wallet_balance || 0);
                const newWallet = prevWallet + unrefundedCredit;
                await client.query(
                    `UPDATE customers
                     SET wallet_balance = COALESCE(wallet_balance, 0) + $1::numeric,
                         updated_at = NOW()
                     WHERE id = $2`,
                    [unrefundedCredit, customerId]
                );
                await writeWalletLedger(client, {
                    party_type: 'customer',
                    party_id: Number(customerId),
                    party_name: custWalletRes.rows[0]?.name || null,
                    type: 'sale_exchange_refund',
                    amount: unrefundedCredit,
                    credit: true,
                    account_effect: 'none',
                    cash_drawer_effect: 'none',
                    reference: invoiceNo,
                    note: `Exchange credit refunded to wallet for invoice #${invoiceNo}`,
                    balance_before: prevWallet,
                    balance_after: newWallet,
                });
            }

            // If extra items exceeded previous balance creating new invoice due
            if (netDifference > 0 && invoiceDue > 0 && customerId) {
                await client.query(
                    `UPDATE customers 
                     SET receivable_balance = COALESCE(receivable_balance, 0) + $1::numeric, 
                         updated_at = NOW() 
                     WHERE id = $2`,
                    [invoiceDue, customerId]
                );
            }

            return;
        }
    }

    // Fallback: If no original sale record is linked
    if (netDifference > 0) {
        if (invoiceDue > 0 && customerId) {
            await client.query(
                `UPDATE customers 
                 SET receivable_balance = COALESCE(receivable_balance, 0) + $1::numeric, 
                     updated_at = NOW() 
                 WHERE id = $2`,
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
        }
        const unrefundedCredit = Math.max(0, excessCredit - totalPaid);
        if (unrefundedCredit > 0 && customerId) {
            const custRes = await client.query('SELECT receivable_balance FROM customers WHERE id = $1 FOR UPDATE', [customerId]);
            const currentRec = money(custRes.rows[0]?.receivable_balance);
            const dueToClear = Math.min(currentRec, unrefundedCredit);
            const extraWallet = unrefundedCredit - dueToClear;

            await client.query(
                `UPDATE customers 
                 SET receivable_balance = GREATEST(0::numeric, COALESCE(receivable_balance, 0) - $1::numeric),
                     wallet_balance = COALESCE(wallet_balance, 0) + $2::numeric,
                     updated_at = NOW() 
                 WHERE id = $3`,
                [dueToClear, extraWallet, customerId]
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
