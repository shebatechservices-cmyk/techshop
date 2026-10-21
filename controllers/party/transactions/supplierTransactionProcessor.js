const { ensureWalletSchema, writeWalletLedger } = require('../../walletController');
const { recordAccountTransaction } = require('../../../services/accountLedgerService');

async function processSupplierTransaction(client, { party_id, action_type, account_id, numAmount, note }) {
    const supCheck = await client.query('SELECT id, name, payable_balance FROM suppliers WHERE id = $1', [party_id]);
    if (!supCheck.rows.length) {
        throw { status: 404, message: 'Supplier not found.' };
    }
    const supplier = supCheck.rows[0];

    if (action_type === 'due_payment' || action_type === 'due') {
        const currentDue = Number(supplier.payable_balance || 0);
        if (currentDue <= 0) {
            throw { status: 400, message: `সাপ্লায়ার ${supplier.name}-এর কোনো বকেয়া নেই (Zero due).` };
        }
        if (numAmount > currentDue) {
            throw {
                status: 400,
                message: `পেমেন্টের পরিমাণ (৳ ${numAmount}) সাপ্লায়ারের মোট বকেয়া (৳ ${currentDue}) এর চেয়ে বেশি হতে পারবে না।`,
            };
        }

        // Pay supplier due: Outflow from shop account, decreases supplier payable balance
        await client.query('UPDATE suppliers SET payable_balance = payable_balance - $1 WHERE id = $2', [numAmount, party_id]);
        await recordAccountTransaction(client, {
            accountId: account_id,
            transactionType: 'debit',
            type: 'due_payment',
            amount: numAmount,
            sourceType: 'supplier_payment',
            sourceId: party_id,
            reference: `Supplier: ${supplier.name} (#${party_id})`,
            note: note || 'Due Settlement',
        });

        // Settle supplier's pending unpaid/partial purchase orders FIFO
        const accNameRes = await client.query('SELECT name FROM payment_accounts WHERE id = $1', [account_id]);
        const accName = accNameRes.rows[0]?.name || 'Cash';

        const pendingPurchases = await client.query(
            `SELECT id, po_number, total_cost, total_paid, total_due, status
             FROM purchase_orders
             WHERE supplier_id = $1 AND total_due > 0 AND deleted_at IS NULL
             ORDER BY created_at ASC, id ASC
             FOR UPDATE`,
            [party_id]
        );

        let remToAllocate = numAmount;
        for (const po of pendingPurchases.rows) {
            if (remToAllocate <= 0) break;
            const poDue = Number(po.total_due || 0);
            const alloc = Math.min(remToAllocate, poDue);
            const poPaid = Number(po.total_paid || 0) + alloc;
            const poNewDue = Math.max(0, poDue - alloc);
            const poStatus = poNewDue <= 0 ? 'paid' : 'partial';

            await client.query(
                `UPDATE purchase_orders
                 SET total_paid = $1,
                     total_due = $2,
                     status = $3
                 WHERE id = $4`,
                [poPaid, poNewDue, poStatus, po.id]
            );

            await client.query(
                `INSERT INTO purchase_order_payments (purchase_order_id, payment_method, account_id, amount, created_at)
                 VALUES ($1, $2, $3, $4, NOW())`,
                [po.id, accName || 'Cash', account_id, alloc]
            );

            remToAllocate -= alloc;
        }

    } else if (action_type === 'advance_payment' || action_type === 'advance') {
        // Supplier advance = wallet deposit (drawer reservation): money stays in shop
        await ensureWalletSchema();
        const supWalletRes = await client.query('SELECT wallet_balance FROM suppliers WHERE id = $1', [party_id]);
        const supWallet = parseFloat(supWalletRes.rows[0]?.wallet_balance || 0) || 0;
        await client.query('UPDATE suppliers SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2', [numAmount, party_id]);
        await writeWalletLedger(client, {
            party_type: 'supplier', party_id: Number(party_id), party_name: supplier.name,
            type: 'advance_deposit', amount: numAmount, credit: true,
            account_id: null, account_name: null, account_effect: 'none', cash_drawer_effect: 'none',
            reference: null, note: (note && note !== 'Supplier Advance') ? note : 'Supplier advance held in wallet (drawer unchanged)',
            balance_before: supWallet, balance_after: supWallet + numAmount,
        });

    } else {
        throw { status: 400, message: 'Invalid supplier action. Suppliers only support Due Payment or Advance Payment.' };
    }
}

module.exports = {
    processSupplierTransaction
};
