const { money } = require('./salesFormatHelpers');
const { writeWalletLedger } = require('../../walletController');
const { recordAccountTransaction } = require('../../../services/accountLedgerService');

const getDrawerAccountId = async (client) => {
    const drawerRes = await client.query("SELECT id FROM payment_accounts WHERE account_type = 'drawer' OR id = 1 LIMIT 1");
    return drawerRes.rows.length ? drawerRes.rows[0].id : null;
};

// Resolve target payment account (checks ID, name/sub_option/payment_mode, or defaults to active Cash Drawer)
const resolvePaymentAccount = async (client, tender) => {
    let targetAccount = null;
    const accountId = tender.account_id ? parseInt(tender.account_id, 10) : null;
    const subOption = String(tender.sub_option || tender.account_name || tender.payment_mode || tender.method || '').trim();

    if (accountId && !isNaN(accountId)) {
        const accRes = await client.query('SELECT * FROM payment_accounts WHERE id = $1', [accountId]);
        if (accRes.rows.length) targetAccount = accRes.rows[0];
    }
    if (!targetAccount && subOption) {
        const accRes = await client.query(
            'SELECT * FROM payment_accounts WHERE LOWER(name) = LOWER($1) OR LOWER(account_number) = LOWER($1) LIMIT 1',
            [subOption]
        );
        if (accRes.rows.length) targetAccount = accRes.rows[0];
    }
    if (!targetAccount && (tender.payment_mode || tender.method)) {
        const mode = tender.payment_mode || tender.method;
        const accRes = await client.query(
            'SELECT * FROM payment_accounts WHERE LOWER(name) ILIKE LOWER($1) OR LOWER(account_type) = LOWER($1) LIMIT 1',
            [`%${mode}%`]
        );
        if (accRes.rows.length) targetAccount = accRes.rows[0];
    }
    if (!targetAccount) {
        // Fallback: primary Cash Drawer
        const drawerRes = await client.query(
            "SELECT * FROM payment_accounts WHERE account_type = 'drawer' OR LOWER(name) LIKE '%drawer%' OR id = 1 ORDER BY (account_type = 'drawer') DESC, id ASC LIMIT 1"
        );
        if (drawerRes.rows.length) targetAccount = drawerRes.rows[0];
    }
    return targetAccount;
};

// Apply a single sale tender: debits customer wallet or credits the resolved payment account (double-entry audit trail)
const applySaleTender = async (client, { customerId, invoiceNo, tender, ledgerType = 'sale_payment' }) => {
    const amt = money(tender.amount || tender.quantity || 0);
    if (amt <= 0) return { type: 'none', amount: 0, account: null };

    const method = String(tender.payment_mode || tender.method || '').toLowerCase();
    if (method === 'wallet') {
        const custWalletRes = await client.query('SELECT wallet_balance FROM customers WHERE id = $1', [customerId]);
        const walletBal = money(custWalletRes.rows[0]?.wallet_balance || 0);
        if (walletBal < amt) {
            throw new Error(`Customer wallet has insufficient balance (৳ ${walletBal}) for this wallet payment of ৳ ${amt}. Add a cash tender for the remaining amount.`);
        }
        await client.query('UPDATE customers SET wallet_balance = wallet_balance - $1 WHERE id = $2', [amt, customerId]);
        await writeWalletLedger(client, {
            party_type: 'customer', party_id: Number(customerId), party_name: null,
            type: ledgerType, amount: amt, credit: false,
            account_effect: 'none', cash_drawer_effect: 'none',
            reference: invoiceNo, note: `Product purchase paid from wallet (invoice ${invoiceNo})`,
            balance_before: walletBal, balance_after: walletBal - amt,
        });
        return { type: 'wallet', amount: amt, account: null };
    }

    const targetAccount = await resolvePaymentAccount(client, tender);
    if (targetAccount) {
        await recordAccountTransaction(client, {
            accountId: targetAccount.id,
            transactionType: 'credit',
            type: 'deposit',
            amount: amt,
            sourceType: 'pos_sale',
            sourceId: invoiceNo,
            reference: invoiceNo,
            note: `Sale revenue received via ${targetAccount.name || tender.payment_mode || 'Cash'} (Invoice #${invoiceNo})`,
            transactionId: tender.transaction_id || tender.ref_no || null,
        });
    }
    return { type: 'account', amount: amt, account: targetAccount };
};

// Reverse a single sale tender (on sale delete or sale edit)
const reverseSaleTender = async (client, { customerId, invoiceNo, tender, ledgerType = 'sale_refund', reasonNote }) => {
    const amt = money(tender.amount || tender.quantity || 0);
    if (amt <= 0) return;

    const method = String(tender.payment_mode || tender.method || '').toLowerCase();
    if (method === 'wallet') {
        if (customerId) {
            const custWalletRes = await client.query('SELECT wallet_balance FROM customers WHERE id = $1', [customerId]);
            const walletBal = money(custWalletRes.rows[0]?.wallet_balance || 0);
            await client.query('UPDATE customers SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2', [amt, customerId]);
            await writeWalletLedger(client, {
                party_type: 'customer', party_id: Number(customerId), party_name: null,
                type: ledgerType, amount: amt, credit: true,
                account_effect: 'none', cash_drawer_effect: 'none',
                reference: invoiceNo, note: `Wallet refunded from invoice #${invoiceNo} (${reasonNote || 'reversal'})`,
                balance_before: walletBal, balance_after: walletBal + amt,
            });
        }
        return;
    }

    const targetAccount = await resolvePaymentAccount(client, tender);
    if (targetAccount) {
        await recordAccountTransaction(client, {
            accountId: targetAccount.id,
            transactionType: 'debit',
            type: 'refund',
            amount: amt,
            sourceType: 'sale_refund',
            sourceId: invoiceNo,
            reference: invoiceNo,
            note: `Sale invoice #${invoiceNo} ${reasonNote || 'reversal'} — refunded from ${targetAccount.name}`,
            transactionId: tender.transaction_id || tender.ref_no || null,
        });
    }
};

// Apply sale tenders (shared helper)
const applyTenders = async (client, { customerId, invoiceNo, tenders, ledgerType = 'sale_payment' }) => {
    let cashPaid = 0;
    let walletUsed = 0;
    for (const tender of tenders || []) {
        const res = await applySaleTender(client, { customerId, invoiceNo, tender, ledgerType });
        if (res.type === 'wallet') {
            walletUsed += res.amount;
        } else if (res.type === 'account') {
            cashPaid += res.amount;
        }
    }
    return { cashPaid, walletUsed };
};

// Deposit cash into the drawer account and record the account transaction.
const depositToDrawer = async (client, { drawerId, amount, reference, note, type = 'deposit' }) => {
    if (!drawerId || !(amount > 0)) return;
    await recordAccountTransaction(client, {
        accountId: drawerId,
        transactionType: 'credit',
        type,
        amount,
        sourceType: 'pos_sale',
        sourceId: reference,
        reference,
        note,
    });
};

// Reverse cash out of the drawer account (sale delete/edit rollback).
const reverseCashFromDrawer = async (client, { drawerId, amount, reference, note }) => {
    if (!drawerId || !(amount > 0)) return;
    await recordAccountTransaction(client, {
        accountId: drawerId,
        transactionType: 'debit',
        type: 'refund',
        amount,
        sourceType: 'sale_refund',
        sourceId: reference,
        reference,
        note,
    });
};

module.exports = {
    getDrawerAccountId,
    resolvePaymentAccount,
    applySaleTender,
    reverseSaleTender,
    applyTenders,
    depositToDrawer,
    reverseCashFromDrawer,
};
