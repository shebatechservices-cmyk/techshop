const pool = require('../../config/db');
const walletService = require('../../services/walletService');

const {
    ensureWalletSchema,
    normalizeEntityType,
    partyInfo,
    getOrCreateWallet,
} = walletService;

// GET /api/wallets  → List centralized wallets
exports.getWallets = async (req, res) => {
    try {
        await ensureWalletSchema();
        const { entity_type = 'all', search = '', page = 1, limit = 50 } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, parseInt(limit, 10) || 50);
        const offset = (pageNum - 1) * limitNum;

        const params = [];
        let whereClause = 'WHERE w.deleted_at IS NULL';
        let paramIdx = 1;

        const normType = normalizeEntityType(entity_type);
        if (normType) {
            whereClause += ` AND w.entity_type = $${paramIdx++}`;
            params.push(normType);
        }

        if (search && search.trim()) {
            whereClause += ` AND (w.entity_name ILIKE $${paramIdx} OR CAST(w.entity_id AS TEXT) ILIKE $${paramIdx})`;
            params.push(`%${search.trim()}%`);
            paramIdx++;
        }

        const countRes = await pool.query(`SELECT COUNT(*) FROM wallets w ${whereClause}`, params);
        const total = parseInt(countRes.rows[0]?.count || 0, 10);

        const listSql = `
            SELECT w.*,
                   (SELECT COUNT(*) FROM wallet_transactions wt WHERE wt.wallet_id = w.id AND wt.deleted_at IS NULL)::INT AS transaction_count,
                   (SELECT MAX(created_at) FROM wallet_transactions wt WHERE wt.wallet_id = w.id AND wt.deleted_at IS NULL) AS last_transaction_at
            FROM wallets w
            ${whereClause}
            ORDER BY w.updated_at DESC, w.id DESC
            LIMIT $${paramIdx++} OFFSET $${paramIdx++}
        `;
        const listRes = await pool.query(listSql, [...params, limitNum, offset]);

        // Aggregate statistics
        const statsRes = await pool.query(`
            SELECT
                COUNT(*)::INT AS total_wallets,
                COALESCE(SUM(balance), 0)::NUMERIC AS total_wallet_balance,
                COALESCE(SUM(CASE WHEN entity_type = 'customer' THEN balance ELSE 0 END), 0)::NUMERIC AS customer_balance,
                COALESCE(SUM(CASE WHEN entity_type = 'supplier' THEN balance ELSE 0 END), 0)::NUMERIC AS supplier_balance,
                COALESCE(SUM(CASE WHEN entity_type = 'staff' THEN balance ELSE 0 END), 0)::NUMERIC AS staff_balance
            FROM wallets
            WHERE deleted_at IS NULL
        `);

        return res.status(200).json({
            success: true,
            data: listRes.rows,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.max(1, Math.ceil(total / limitNum)),
            },
            stats: statsRes.rows[0],
        });
    } catch (error) {
        console.error('getWallets error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/wallets/:type/:id  → Get party wallet + ledger
exports.getPartyWallet = async (req, res) => {
    const client = await pool.connect();
    try {
        const { type, id } = req.params;
        const partyId = Number(id);
        const normType = normalizeEntityType(type);
        const info = partyInfo(normType);
        if (!info || !partyId) {
            return res.status(400).json({ success: false, message: 'Invalid party type or ID.' });
        }

        await ensureWalletSchema(client);
        const wallet = await getOrCreateWallet(client, normType, partyId);

        const partyRes = await client.query(
            `SELECT ${info.idCol} AS id, ${info.nameCol} AS name, ${info.balanceCol} AS wallet_balance FROM ${info.table} WHERE ${info.idCol} = $1`,
            [partyId]
        );
        const party = partyRes.rows[0] || { id: partyId, name: wallet.entity_name, wallet_balance: wallet.balance };

        const ledgerRes = await client.query(
            `SELECT * FROM wallet_transactions
             WHERE ((wallet_id = $1) OR (party_type = $2 AND party_id = $3))
               AND deleted_at IS NULL
             ORDER BY id DESC LIMIT 200`,
            [wallet.id, normType, partyId]
        );

        return res.status(200).json({
            success: true,
            wallet,
            party,
            transactions: ledgerRes.rows,
        });
    } catch (error) {
        console.error('getPartyWallet error:', error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};
