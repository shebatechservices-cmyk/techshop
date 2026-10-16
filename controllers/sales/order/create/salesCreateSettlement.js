const { money, applySaleTender } = require('../../salesHelpers');
const { drawerLedgerOnly } = require('../../../walletController');

/**
 * Handles customer due receivable balance updates, loyalty points accrual,
 * tender processing, and financial ledger journalizing.
 */
async function settleSalePaymentsAndBalances(client, {
    customer_id,
    saleId,
    invoiceNo,
    tenders,
    totalPaid,
    totalDue,
    pointsEarned,
}) {
    // 1. Update customer balances: add due to receivable balance and award loyalty points
    if (totalDue > 0) {
        await client.query(
            'UPDATE customers SET receivable_balance = COALESCE(receivable_balance, 0) + $1 WHERE id = $2',
            [totalDue, Number(customer_id)]
        );
    }
    if (pointsEarned > 0) {
        await client.query(
            'UPDATE customers SET loyalty_points = COALESCE(loyalty_points, 0) + $1 WHERE id = $2',
            [pointsEarned, Number(customer_id)]
        );
    }

    // 2. Process payment tenders & apply ledger effects
    let walletUsed = 0;
    if (tenders.length > 0) {
        for (const tender of tenders) {
            const tenderAmount = money(tender.amount || tender.quantity || 0);
            if (tenderAmount <= 0) continue;
            await client.query(
                `INSERT INTO payments (sale_id, payment_mode, account_name, reference_no, amount, created_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                [
                    saleId,
                    tender.payment_mode || tender.method || 'Cash',
                    tender.account_name || null,
                    tender.reference_no || null,
                    tenderAmount,
                ]
            );
            const res = await applySaleTender(client, {
                customerId: Number(customer_id),
                invoiceNo,
                tender,
                ledgerType: 'sale_payment',
            });
            if (res.type === 'wallet') {
                walletUsed += res.amount;
            }
        }
    } else if (totalPaid > 0) {
        await applySaleTender(client, {
            customerId: Number(customer_id),
            invoiceNo,
            tender: { amount: totalPaid, payment_mode: 'Cash' },
            ledgerType: 'sale_payment',
        });
        await client.query(
            `INSERT INTO payments (sale_id, payment_mode, account_name, reference_no, amount, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [saleId, 'Cash', null, null, totalPaid]
        );
    }

    if (walletUsed > 0) {
        await drawerLedgerOnly(client, 'wallet_settlement', walletUsed, invoiceNo, `Customer wallet payment for sale #${invoiceNo} (drawer unchanged)`);
    }
}

module.exports = {
    settleSalePaymentsAndBalances,
};
