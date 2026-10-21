const { recordAccountTransaction } = require('../../../services/accountLedgerService');

async function processTransferTransaction(client, { party_type, party_id, account_id, to_account_id, numAmount, note }) {
    if (!account_id || !to_account_id) {
        throw { status: 400, message: 'Please select both source and destination accounts.' };
    }
    if (account_id === to_account_id) {
        throw { status: 400, message: 'Source and destination accounts cannot be identical.' };
    }

    const srcRes = await client.query('SELECT id, name, balance FROM payment_accounts WHERE id = $1', [account_id]);
    if (!srcRes.rows.length || parseFloat(srcRes.rows[0].balance) < numAmount) {
        throw { status: 400, message: 'Source account has insufficient balance.' };
    }

    const destRes = await client.query('SELECT id, name, balance FROM payment_accounts WHERE id = $1', [to_account_id]);
    const destName = destRes.rows[0]?.name || `Account #${to_account_id}`;
    const srcName = srcRes.rows[0]?.name || `Account #${account_id}`;

    const partyNote = party_type && party_id ? ` (Party: ${party_type} #${party_id})` : '';

    await recordAccountTransaction(client, {
        accountId: account_id,
        transactionType: 'debit',
        type: 'transfer_out',
        amount: numAmount,
        sourceType: 'transfer',
        sourceId: to_account_id,
        reference: `Transfer to ${destName}${partyNote}`,
        note: note || 'Fund Transfer Out',
    });

    await recordAccountTransaction(client, {
        accountId: to_account_id,
        transactionType: 'credit',
        type: 'transfer_in',
        amount: numAmount,
        sourceType: 'transfer',
        sourceId: account_id,
        reference: `Transfer from ${srcName}${partyNote}`,
        note: note || 'Fund Transfer In',
    });
}

module.exports = {
    processTransferTransaction
};
