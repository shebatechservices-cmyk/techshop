const { recordAccountTransaction } = require('../../../services/accountLedgerService');

async function processStaffTransaction(client, { party_id, action_type, account_id, numAmount, note }) {
    const staffCheck = await client.query('SELECT id, name FROM users WHERE id = $1', [party_id]);
    if (!staffCheck.rows.length) {
        throw { status: 404, message: 'Staff member not found.' };
    }
    const staff = staffCheck.rows[0];

    if (action_type === 'salary_payment' || action_type === 'salary' || action_type === 'due_payment') {
        await recordAccountTransaction(client, {
            accountId: account_id,
            transactionType: 'debit',
            type: 'expense',
            amount: numAmount,
            sourceType: 'salary',
            sourceId: party_id,
            reference: `Staff: ${staff.name} (#${party_id})`,
            note: note || 'Staff Remuneration',
        });
    } else {
        throw { status: 400, message: 'Staff members only support Salary or Advance payment.' };
    }
}

module.exports = {
    processStaffTransaction
};
