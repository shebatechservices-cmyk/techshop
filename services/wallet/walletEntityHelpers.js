const money = (val) => Number.parseFloat(val || 0) || 0;

const normalizeEntityType = (type) => {
    const t = String(type || '').trim().toLowerCase();
    if (t === 'customer' || t === 'customers') return 'customer';
    if (t === 'supplier' || t === 'suppliers') return 'supplier';
    if (t === 'staff' || t === 'user' || t === 'users' || t === 'employee') return 'staff';
    return null;
};

const partyInfo = (type) => {
    const t = normalizeEntityType(type);
    if (t === 'customer') return { entityType: 'customer', table: 'customers', idCol: 'id', nameCol: 'name', balanceCol: 'wallet_balance' };
    if (t === 'supplier') return { entityType: 'supplier', table: 'suppliers', idCol: 'id', nameCol: 'name', balanceCol: 'wallet_balance' };
    if (t === 'staff') return { entityType: 'staff', table: 'users', idCol: 'id', nameCol: 'name', balanceCol: 'wallet_balance' };
    return null;
};

// Get or lazily provision centralized wallet for an entity
const getOrCreateWallet = async (client, entityType, entityId) => {
    const info = partyInfo(entityType);
    if (!info) throw new Error(`Invalid entity type "${entityType}". Must be customer, supplier, or staff.`);

    let walletRes = await client.query(
        'SELECT * FROM wallets WHERE entity_type = $1 AND entity_id = $2',
        [info.entityType, Number(entityId)]
    );

    if (walletRes.rows.length > 0) {
        return walletRes.rows[0];
    }

    // Provision from underlying party table
    const partyRes = await client.query(
        `SELECT ${info.idCol} AS id, ${info.nameCol} AS name, COALESCE(${info.balanceCol}, 0) AS balance FROM ${info.table} WHERE ${info.idCol} = $1`,
        [Number(entityId)]
    );
    if (!partyRes.rows.length) {
        throw new Error(`${info.entityType.charAt(0).toUpperCase() + info.entityType.slice(1)} #${entityId} not found.`);
    }

    const party = partyRes.rows[0];
    const initialBal = money(party.balance);

    const insertRes = await client.query(
        `INSERT INTO wallets (entity_type, entity_id, entity_name, balance, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
         ON CONFLICT (entity_type, entity_id) DO UPDATE SET balance = EXCLUDED.balance, entity_name = EXCLUDED.entity_name
         RETURNING *`,
        [info.entityType, Number(entityId), party.name || null, initialBal]
    );

    return insertRes.rows[0];
};

module.exports = {
    money,
    normalizeEntityType,
    partyInfo,
    getOrCreateWallet,
};
