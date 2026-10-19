const pool = require('../../config/db');
const { processSupplierTransaction } = require('./transactions/supplierTransactionProcessor');
const { processCustomerTransaction } = require('./transactions/customerTransactionProcessor');
const { processStaffTransaction } = require('./transactions/staffTransactionProcessor');
const { processTransferTransaction } = require('./transactions/transferTransactionProcessor');

// 5. UNIFIED FINANCIAL TRANSACTIONS (Supplier Payments, Customer Receipts, Staff Disbursals, Fund Transfers)
exports.handlePartyTransaction = async (req, res) => {
    const client = await pool.connect();
    try {
        const { party_type, party_id, action_type, account_id, amount, note, to_account_id } = req.body;
        const numAmount = parseFloat(amount);

        if (!action_type || !numAmount || numAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid action type and positive amount are required.' });
        }

        await client.query('BEGIN');

        if (action_type !== 'transfer') {
            if (!account_id) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Please select a payment wallet/account.' });
            }
            const accCheck = await client.query('SELECT id, name, balance FROM payment_accounts WHERE id = $1', [account_id]);
            if (!accCheck.rows.length) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Selected payment account does not exist.' });
            }

            if (party_type === 'supplier') {
                await processSupplierTransaction(client, { party_id, action_type, account_id, numAmount, note });
            } else if (party_type === 'customer') {
                await processCustomerTransaction(client, { party_id, action_type, account_id, numAmount, note });
            } else if (party_type === 'staff') {
                await processStaffTransaction(client, { party_id, action_type, account_id, numAmount, note });
            } else {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Unknown party type.' });
            }
        } else {
            await processTransferTransaction(client, { party_type, party_id, account_id, to_account_id, numAmount, note });
        }

        await client.query('COMMIT');
        return res.status(200).json({
            success: true,
            message: 'Transaction completed successfully.'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('handlePartyTransaction error:', error);
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Transaction failed.'
        });
    } finally {
        client.release();
    }
};
