const pool = require('../../config/db');
const { ensureAccountLedgerSchema, recordAccountTransaction } = require('../../services/accountLedgerService');

// Get transaction list with filters and search
exports.getTransactions = async (req, res) => {
    try {
        await ensureAccountLedgerSchema();
        const { account_id, type, transaction_type, source_type, start_date, end_date, search, limit = 200 } = req.query;
        const params = [];
        const conditions = [];

        if (account_id && account_id !== 'all') {
            params.push(parseInt(account_id, 10));
            conditions.push(`t.account_id = $${params.length}`);
        }

        if (type && type !== 'all') {
            params.push(type);
            conditions.push(`t.type = $${params.length}`);
        }

        if (transaction_type && transaction_type !== 'all') {
            params.push(transaction_type);
            conditions.push(`t.transaction_type = $${params.length}`);
        }

        if (source_type && source_type !== 'all') {
            params.push(source_type);
            conditions.push(`t.source_type = $${params.length}`);
        }

        if (start_date) {
            params.push(start_date);
            conditions.push(`t.created_at >= $${params.length}`);
        }

        if (end_date) {
            params.push(end_date + ' 23:59:59.999');
            conditions.push(`t.created_at <= $${params.length}`);
        }

        if (search && search.trim()) {
            params.push(`%${search.trim()}%`);
            conditions.push(`(t.reference ILIKE $${params.length} OR t.note ILIKE $${params.length} OR t.transaction_id ILIKE $${params.length} OR p.name ILIKE $${params.length})`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const limitNum = Math.min(1000, Math.max(1, parseInt(limit, 10) || 200));

        const result = await pool.query(`
            SELECT t.*, p.name AS account_name, p.account_type
            FROM account_transactions t
            LEFT JOIN payment_accounts p ON t.account_id = p.id
            ${whereClause}
            ORDER BY t.created_at DESC, t.id DESC
            LIMIT ${limitNum};
        `, params);

        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('getTransactions error:', error);
        return res.status(200).json({ success: true, data: [] });
    }
};

// Edit Transaction — Strictly Prohibited for Immutable Audit Trail
exports.updateTransaction = async (req, res) => {
    return res.status(403).json({
        success: false,
        message: 'Direct modification of ledger transactions is strictly prohibited to preserve accounting audit trail integrity and prevent balance discrepancies. Please post an offsetting adjustment transaction.'
    });
};

// Delete Transaction — Strictly Prohibited for Immutable Audit Trail
exports.deleteTransaction = async (req, res) => {
    return res.status(403).json({
        success: false,
        message: 'Direct deletion of ledger transactions is strictly prohibited to preserve financial compliance and immutable audit records. Post a reversing adjustment entry instead.'
    });
};

// Post Reversing / Offsetting adjustment entry
exports.reverseTransaction = async (req, res) => {
    const client = await pool.connect();
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid transaction ID.' });

        const { reason, note, transaction_id } = req.body;

        await client.query('BEGIN');
        await ensureAccountLedgerSchema(client);

        const oldTxRes = await client.query('SELECT * FROM account_transactions WHERE id = $1', [id]);
        if (oldTxRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Transaction record not found.' });
        }

        const oldTx = oldTxRes.rows[0];
        const oldAccId = oldTx.account_id;
        const oldAmt = parseFloat(oldTx.amount || 0);
        const isCredit = oldTx.transaction_type === 'credit' || ['deposit', 'credit', 'in', 'transfer_in', 'due_receive', 'advance_receive', 'sale_payment', 'sale_revenue'].includes(oldTx.type);

        if (oldAmt <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Cannot reverse transaction with zero amount.' });
        }

        // Determine opposite offsetting transaction
        const revTxType = isCredit ? 'debit' : 'credit';
        const revType = isCredit ? 'debit_reverse' : 'credit_reverse';
        const revReference = oldTx.reference ? `REV-${oldTx.reference}` : `REV-TX-${id}`;
        const revNote = note || (reason ? `Reversal: ${reason}` : `Offsetting cancellation adjustment for Transaction #${id} (${oldTx.type || oldTx.source_type || 'manual'})`);

        // Record offsetting ledger entry without mutating original record
        const result = await recordAccountTransaction(client, {
            accountId: oldAccId,
            transactionType: revTxType,
            type: revType,
            amount: oldAmt,
            sourceType: 'cancellation_adjustment',
            sourceId: String(id),
            reference: revReference,
            note: revNote,
            transactionId: transaction_id || oldTx.transaction_id || null,
            createdBy: req.user?.name || req.body.created_by || 'System Admin',
        });

        await client.query('COMMIT');
        return res.status(200).json({
            success: true,
            message: `Offsetting reversal transaction created successfully for Transaction #${id}.`,
            data: result
        });
    } catch (error) {
        await client.query('ROLLBACK').catch(() => null);
        console.error('reverseTransaction error:', error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};
