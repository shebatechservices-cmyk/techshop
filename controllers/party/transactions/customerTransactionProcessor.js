const { ensureWalletSchema, writeWalletLedger } = require('../walletController');
const { recordAccountTransaction } = require('../../services/accountLedgerService');

async function processCustomerTransaction(client, { party_id, action_type, account_id, numAmount, note }) {
    const custCheck = await client.query('SELECT id, name, receivable_balance FROM customers WHERE id = $1', [party_id]);
    if (!custCheck.rows.length) {
        throw { status: 404, message: 'Customer not found.' };
    }
    const customer = custCheck.rows[0];

    if (action_type === 'due_payment' || action_type === 'due' || action_type === 'due_receive') {
        // Customer pays due: Inflow to shop account, decreases customer receivable balance
        await client.query('UPDATE customers SET receivable_balance = receivable_balance - $1 WHERE id = $2', [numAmount, party_id]);
        await recordAccountTransaction(client, {
            accountId: account_id,
            transactionType: 'credit',
            type: 'due_receive',
            amount: numAmount,
            sourceType: 'due_collection',
            sourceId: party_id,
            reference: `Customer: ${customer.name} (#${party_id})`,
            note: note || 'Due Collection',
        });

        // Settle customer's pending unpaid/partial sales invoices FIFO
        const accNameRes = await client.query('SELECT name FROM payment_accounts WHERE id = $1', [account_id]);
        const accName = accNameRes.rows[0]?.name || 'Cash';

        const pendingSales = await client.query(
            `SELECT id, invoice_no, total_amount, paid_amount, due_amount, payment_status, payment_details
             FROM sales
             WHERE customer_id = $1 AND due_amount > 0 AND deleted_at IS NULL
             ORDER BY created_at ASC, id ASC
             FOR UPDATE`,
            [party_id]
        );

        let remToAllocate = numAmount;
        for (const s of pendingSales.rows) {
            if (remToAllocate <= 0) break;
            const sDue = Number(s.due_amount || 0);
            const alloc = Math.min(remToAllocate, sDue);
            const sPaid = Number(s.paid_amount || 0) + alloc;
            const sNewDue = Math.max(0, sDue - alloc);
            const sStatus = sNewDue <= 0 ? 'paid' : 'partial';

            let pDetails = [];
            try {
                if (Array.isArray(s.payment_details)) pDetails = s.payment_details;
                else if (typeof s.payment_details === 'string') pDetails = JSON.parse(s.payment_details);
            } catch {
                pDetails = [];
            }

            pDetails.push({
                date: new Date().toISOString(),
                amount: alloc,
                account_id: account_id,
                account_name: accName,
                payment_mode: accName,
                note: note || 'Due Received via Profile Modal',
            });

            await client.query(
                `UPDATE sales
                 SET paid_amount = $1,
                     due_amount = $2,
                     payment_status = $3,
                     payment_details = $4
                 WHERE id = $5`,
                [sPaid, sNewDue, sStatus, JSON.stringify(pDetails), s.id]
            );

            await client.query(
                `INSERT INTO payments (sale_id, payment_mode, account_name, amount, created_at)
                 VALUES ($1, $2, $3, $4, NOW())`,
                [s.id, accName, accName, alloc]
            ).catch(() => {});

            remToAllocate -= alloc;
        }

    } else if (action_type === 'advance_receive' || action_type === 'advance' || action_type === 'deposit') {
        // Customer advance = wallet deposit: Inflow to shop account, customer wallet credited.
        await recordAccountTransaction(client, {
            accountId: account_id,
            transactionType: 'credit',
            type: 'advance_receive',
            amount: numAmount,
            sourceType: 'wallet_deposit',
            sourceId: party_id,
            reference: `Customer: ${customer.name} (#${party_id})`,
            note: note || 'Customer Advance',
        });

        // Credit the customer's spendable wallet balance
        await ensureWalletSchema();
        const custWalletRes = await client.query('SELECT wallet_balance FROM customers WHERE id = $1', [party_id]);
        const custWallet = parseFloat(custWalletRes.rows[0]?.wallet_balance || 0) || 0;
        await client.query('UPDATE customers SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2', [numAmount, party_id]);
        await writeWalletLedger(client, {
            party_type: 'customer', party_id: Number(party_id), party_name: customer.name,
            type: 'advance_deposit', amount: numAmount, credit: true,
            account_id, account_name: null, account_effect: 'in', cash_drawer_effect: 'in',
            reference: null, note: (note && note !== 'Customer Advance') ? note : 'Customer advance deposit into wallet',
            balance_before: custWallet, balance_after: custWallet + numAmount,
        });

    } else if (action_type === 'refund' || action_type === 'withdraw') {
        // Refund to customer: Outflow from shop account; wallet credit settles the payout.
        await recordAccountTransaction(client, {
            accountId: account_id,
            transactionType: 'debit',
            type: 'refund',
            amount: numAmount,
            sourceType: 'wallet_withdrawal',
            sourceId: party_id,
            reference: `Customer: ${customer.name} (#${party_id})`,
            note: note || 'Customer Refund',
        });

        // Debit the customer's wallet credit (refund settled against spendable balance)
        await ensureWalletSchema();
        const refundWalletRes = await client.query('SELECT wallet_balance FROM customers WHERE id = $1', [party_id]);
        const refundWallet = parseFloat(refundWalletRes.rows[0]?.wallet_balance || 0) || 0;
        const refundFromWallet = Math.min(numAmount, refundWallet);
        if (refundFromWallet > 0) {
            await client.query(
                'UPDATE customers SET wallet_balance = GREATEST(0, COALESCE(wallet_balance, 0) - $1) WHERE id = $2',
                [refundFromWallet, party_id]
            );
            await writeWalletLedger(client, {
                party_type: 'customer', party_id: Number(party_id), party_name: customer.name,
                type: 'refund_payout', amount: refundFromWallet, credit: false,
                account_id, account_name: null, account_effect: 'out', cash_drawer_effect: 'out',
                reference: null, note: note || 'Refund payout against wallet credit',
                balance_before: refundWallet, balance_after: refundWallet - refundFromWallet,
            });
        }

    } else {
        throw { status: 400, message: 'Invalid customer action.' };
    }
}

module.exports = {
    processCustomerTransaction
};
