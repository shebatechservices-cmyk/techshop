const pool = require('../../config/db');
const walletService = require('../../services/walletService');

const {
    executeWalletTransaction,
    money,
} = walletService;

// POST /api/wallets/transaction  → Universal Transaction Handler
exports.postWalletTransaction = async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            party_type, entity_type = party_type,
            party_id, entity_id = party_id,
            action, amount: rawAmount,
            account_id, note, reference, reference_type,
            transaction_id,
            allow_overdraft = false,
        } = req.body;

        const amount = money(rawAmount);
        if (!entity_type || !entity_id || !action || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Entity type, entity ID, action, and a positive amount are required.',
            });
        }

        await client.query('BEGIN');
        const result = await executeWalletTransaction(client, {
            entityType: entity_type,
            entityId: Number(entity_id),
            action,
            amount,
            accountId: account_id ? Number(account_id) : null,
            referenceType: reference_type || null,
            referenceId: reference || null,
            reference: reference || null,
            transactionId: transaction_id || null,
            note: note || null,
            allowOverdraft: allow_overdraft,
        });

        await client.query('COMMIT');
        return res.status(200).json({
            success: true,
            message: 'Wallet transaction completed successfully.',
            data: result,
        });
    } catch (error) {
        await client.query('ROLLBACK').catch(() => null);
        console.error('postWalletTransaction error:', error);
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

// Shorthand top-up route
exports.postTopup = async (req, res) => {
    req.body.action = 'topup';
    return exports.postWalletTransaction(req, res);
};

// Shorthand withdraw / payout route
exports.postWithdraw = async (req, res) => {
    req.body.action = 'withdraw';
    return exports.postWalletTransaction(req, res);
};

// Shorthand settle route
exports.postSettle = async (req, res) => {
    req.body.action = req.body.action || 'due_settle';
    return exports.postWalletTransaction(req, res);
};
