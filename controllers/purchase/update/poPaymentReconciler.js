const { money } = require('../helpers/purchaseCoreHelpers');
const {
    reversePurchasePayment,
    applyPurchasePayment,
} = require('../helpers/purchasePaymentApplier');

/**
 * Reconciles payments, reversing previous tenders if needed, applying new tenders,
 * and calculating final balances and payment status.
 *
 * ANTI-REVERSAL POLICY GUARD:
 * If supplier is unchanged and tenders match existing payments, skip reversal and re-tender
 * to protect ledger integrity, prevent phantom reversals, and eliminate bank/drawer churn.
 */
const reconcilePurchaseOrderPayments = async (client, { id, po, payments, targetSupplierId, supplierName, totalCost }) => {
    let totalPaid = money(po.total_paid);
    let appliedTenders = [];

    if (payments !== undefined) {
        // Query existing payments on this PO
        const existingPayments = await client.query(
            'SELECT * FROM purchase_order_payments WHERE purchase_order_id = $1 ORDER BY id ASC',
            [id]
        );
        const tenders = Array.isArray(payments) ? payments.filter(p => money(p.amount) > 0) : [];

        // ANTI-REVERSAL POLICY CHECK:
        const isSupplierSame = String(po.supplier_id || '') === String(targetSupplierId || '');
        const isPaymentUnchanged = isSupplierSame &&
            existingPayments.rows.length === tenders.length &&
            existingPayments.rows.every((oldP, idx) => {
                const newP = tenders[idx];
                if (!newP) return false;
                const oldMethod = (oldP.payment_method || '').trim().toLowerCase();
                const newMethod = (newP.payment_method || newP.method || '').trim().toLowerCase();
                const sameMethod = oldMethod === newMethod;
                const sameAmount = Math.abs(money(oldP.amount) - money(newP.amount)) < 0.001;
                const oldAccId = oldP.account_id ? Number(oldP.account_id) : null;
                const newAccId = newP.account_id ? Number(newP.account_id) : null;
                const sameAccount = !newAccId || !oldAccId || oldAccId === newAccId;
                return sameMethod && sameAmount && sameAccount;
            });

        if (isPaymentUnchanged) {
            // SAFEGUARD POLICY:
            // PO items/details were updated but payments were untouched.
            // Bypass payment reversal and re-tendering completely to preserve accounting ledgers,
            // avoid phantom refunds, and maintain immutable audit logs.
            appliedTenders = existingPayments.rows;
            totalPaid = existingPayments.rows.reduce((sum, p) => sum + money(p.amount), 0);
        } else {
            // 1. Reverse all existing payments on this PO
            for (const pay of existingPayments.rows) {
                await reversePurchasePayment(client, {
                    payment: pay,
                    poNumber: po.po_number || id,
                    supplierId: po.supplier_id,
                    ledgerType: 'purchase_payment_reversal',
                    reasonNote: `PO #${po.po_number || id} edit payment reversal`,
                });
            }
            await client.query('DELETE FROM purchase_order_payments WHERE purchase_order_id = $1', [id]);
            await client.query('DELETE FROM payments WHERE purchase_id = $1', [id]).catch(() => null);

            // 2. Validate and apply new payments
            totalPaid = 0;
            for (const tender of tenders) {
                totalPaid += money(tender.amount);
                await applyPurchasePayment(client, {
                    orderId: id,
                    payment: tender,
                    poNumber: po.po_number || id,
                    supplierId: targetSupplierId,
                    supplierName,
                });
            }
            appliedTenders = tenders;
        }
    }

    const newDue = Math.max(0, totalCost - totalPaid);
    const paymentStatus = newDue === 0 ? 'PAID' : (totalPaid > 0 ? 'PARTIAL' : 'approved');

    return { totalPaid, newDue, paymentStatus, appliedTenders };
};

module.exports = {
    reconcilePurchaseOrderPayments,
};
