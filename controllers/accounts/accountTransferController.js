const pool = require('../../config/db');
const { recordAccountTransaction } = require('../../services/accountLedgerService');

// Deposit funds to payment account
exports.depositToAccount = async (req, res) => {
    const client = await pool.connect();
    try {
        const { account_id, amount, reference, note, transaction_id } = req.body;
        if (!account_id || !amount || Number(amount) <= 0) {
            return res.status(400).json({ success: false, message: 'Valid account and amount are required.' });
        }

        await client.query('BEGIN');

        const result = await recordAccountTransaction(client, {
            accountId: account_id,
            transactionType: 'credit',
            type: 'deposit',
            amount,
            sourceType: 'manual_deposit',
            reference: reference || 'Cash Deposit',
            note: note || 'Manual account deposit',
            transactionId: transaction_id || null,
            createdBy: req.user?.name || null,
        });

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: 'Funds deposited successfully.',
            data: result
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Deposit error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Server error occurred.' });
    } finally {
        client.release();
    }
};

// Withdraw funds from payment account
exports.withdrawFromAccount = async (req, res) => {
    const client = await pool.connect();
    try {
        const { account_id, amount, reference, note, transaction_id } = req.body;
        if (!account_id || !amount || Number(amount) <= 0) {
            return res.status(400).json({ success: false, message: 'Valid account and amount are required.' });
        }

        await client.query('BEGIN');

        const accCheck = await client.query('SELECT balance FROM payment_accounts WHERE id = $1 FOR UPDATE', [account_id]);
        if (accCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Account not found.' });
        }

        const currentBalance = Number(accCheck.rows[0].balance);
        if (currentBalance < Number(amount)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Insufficient account balance.' });
        }

        const result = await recordAccountTransaction(client, {
            accountId: account_id,
            transactionType: 'debit',
            type: 'withdraw',
            amount,
            sourceType: 'manual_withdraw',
            reference: reference || 'Cash Withdraw',
            note: note || 'Manual account withdrawal',
            transactionId: transaction_id || null,
            createdBy: req.user?.name || null,
        });

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: 'Funds withdrawn successfully.',
            data: result
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Withdraw error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Server error occurred.' });
    } finally {
        client.release();
    }
};

// Customer or Supplier due settlement via payment account
exports.payDueViaWallet = async (req, res) => {
    const client = await pool.connect();
    try {
        const { account_id, party_type, party_id, amount, note } = req.body;
        // party_type can be 'customer' or 'supplier'
        if (!account_id || !party_type || !party_id || !amount || Number(amount) <= 0) {
            return res.status(400).json({ success: false, message: 'Please provide all required details.' });
        }

        await client.query('BEGIN');

        const accCheck = await client.query('SELECT balance FROM payment_accounts WHERE id = $1 FOR UPDATE', [account_id]);
        if (accCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Payment account not found.' });
        }

        const currentBalance = Number(accCheck.rows[0].balance);
        if (party_type === 'supplier' && currentBalance < Number(amount)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Insufficient account balance.' });
        }

        if (party_type === 'supplier') {
            await client.query('UPDATE suppliers SET payable_balance = payable_balance - $1 WHERE id = $2', [amount, party_id]);
            await recordAccountTransaction(client, {
                accountId: account_id,
                transactionType: 'debit',
                type: 'due_payment',
                amount,
                sourceType: 'supplier_payment',
                sourceId: party_id,
                reference: `Supplier ID: #${party_id}`,
                note: note || 'Due Payment to Supplier',
            });

        } else if (party_type === 'customer') {
            await client.query('UPDATE customers SET receivable_balance = receivable_balance - $1 WHERE id = $2', [amount, party_id]);
            await recordAccountTransaction(client, {
                accountId: account_id,
                transactionType: 'credit',
                type: 'due_receive',
                amount,
                sourceType: 'due_collection',
                sourceId: party_id,
                reference: `Customer ID: #${party_id}`,
                note: note || 'Due Received from Customer',
            });
        }

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: 'Due payment processed successfully.'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Due payment error:', error);
        return res.status(500).json({ success: false, message: 'Server error occurred.' });
    } finally {
        client.release();
    }
};

// Inter-account Fund Transfer
exports.transferFunds = async (req, res) => {
    const client = await pool.connect();
    try {
        const { from_wallet_id, to_wallet_id, amount, note, transaction_id } = req.body;
        const numAmount = Number(amount);
        if (!from_wallet_id || !to_wallet_id || !numAmount || numAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid accounts and amount are required.' });
        }
        if (String(from_wallet_id) === String(to_wallet_id)) {
            return res.status(400).json({ success: false, message: 'Source and destination accounts cannot be identical.' });
        }

        await client.query('BEGIN');

        const sourceCheck = await client.query('SELECT balance, name FROM payment_accounts WHERE id = $1 FOR UPDATE', [from_wallet_id]);
        if (sourceCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Source account not found.' });
        }
        if (Number(sourceCheck.rows[0].balance) < numAmount) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Insufficient balance in source account.' });
        }

        const destCheck = await client.query('SELECT balance, name FROM payment_accounts WHERE id = $1 FOR UPDATE', [to_wallet_id]);
        if (destCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Destination account not found.' });
        }

        const fromName = sourceCheck.rows[0].name;
        const toName = destCheck.rows[0].name;

        await recordAccountTransaction(client, {
            accountId: from_wallet_id,
            transactionType: 'debit',
            type: 'transfer_out',
            amount: numAmount,
            sourceType: 'transfer',
            sourceId: to_wallet_id,
            reference: `Transfer to ${toName} (#${to_wallet_id})`,
            note: note || '',
            transactionId: transaction_id || null,
            createdBy: req.user?.name || null,
        });

        await recordAccountTransaction(client, {
            accountId: to_wallet_id,
            transactionType: 'credit',
            type: 'transfer_in',
            amount: numAmount,
            sourceType: 'transfer',
            sourceId: from_wallet_id,
            reference: `Transfer from ${fromName} (#${from_wallet_id})`,
            note: note || '',
            transactionId: transaction_id || null,
            createdBy: req.user?.name || null,
        });

        await client.query('COMMIT');
        return res.status(200).json({ success: true, message: 'Funds transferred successfully.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Transfer error:', error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};
