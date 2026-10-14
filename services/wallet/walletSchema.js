const pool = require('../../config/db');

let walletMigrated = false;

const ensureWalletSchema = async (dbClient = pool) => {
    if (walletMigrated) return;
    try {
        await dbClient.query(`
            ALTER TABLE customers ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(14,2) DEFAULT 0;
            ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(14,2) DEFAULT 0;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(14,2) DEFAULT 0;

            CREATE TABLE IF NOT EXISTS wallets (
                id SERIAL PRIMARY KEY,
                entity_type VARCHAR(20) NOT NULL,
                entity_id INTEGER NOT NULL,
                entity_name VARCHAR(150),
                balance NUMERIC(14,2) NOT NULL DEFAULT 0,
                status VARCHAR(20) NOT NULL DEFAULT 'active',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                deleted_at TIMESTAMP,
                CONSTRAINT uq_entity_wallet UNIQUE (entity_type, entity_id)
            );

            CREATE TABLE IF NOT EXISTS wallet_transactions (
                id SERIAL PRIMARY KEY,
                wallet_id INTEGER REFERENCES wallets(id) ON DELETE SET NULL,
                entity_type VARCHAR(20),
                entity_id INTEGER,
                entity_name VARCHAR(150),
                party_type VARCHAR(20),
                party_id INTEGER,
                party_name VARCHAR(150),
                type VARCHAR(30) NOT NULL,
                amount NUMERIC(14,2) NOT NULL,
                credit BOOLEAN NOT NULL DEFAULT true,
                balance_before NUMERIC(14,2) DEFAULT 0,
                balance_after NUMERIC(14,2) DEFAULT 0,
                reference_type VARCHAR(50),
                reference_id VARCHAR(120),
                reference VARCHAR(120),
                account_id INTEGER,
                account_name VARCHAR(100),
                account_effect VARCHAR(10) NOT NULL DEFAULT 'none',
                cash_drawer_effect VARCHAR(10) NOT NULL DEFAULT 'none',
                note TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                deleted_at TIMESTAMP
            );

            ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS wallet_id INTEGER;
            ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20);
            ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS entity_id INTEGER;
            ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS entity_name VARCHAR(150);
            ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50);
            ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS reference_id VARCHAR(120);
            ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
        `);

        // Populate / sync wallets table from entity tables safely
        await dbClient.query(`
            INSERT INTO wallets (entity_type, entity_id, entity_name, balance, created_at, updated_at)
            SELECT 'customer', id, name, COALESCE(wallet_balance, 0), NOW(), NOW()
            FROM customers
            ON CONFLICT (entity_type, entity_id) DO UPDATE
            SET balance = EXCLUDED.balance, entity_name = EXCLUDED.entity_name;

            INSERT INTO wallets (entity_type, entity_id, entity_name, balance, created_at, updated_at)
            SELECT 'supplier', id, name, COALESCE(wallet_balance, 0), NOW(), NOW()
            FROM suppliers
            ON CONFLICT (entity_type, entity_id) DO UPDATE
            SET balance = EXCLUDED.balance, entity_name = EXCLUDED.entity_name;

            INSERT INTO wallets (entity_type, entity_id, entity_name, balance, created_at, updated_at)
            SELECT 'staff', id, name, COALESCE(wallet_balance, 0), NOW(), NOW()
            FROM users
            ON CONFLICT (entity_type, entity_id) DO UPDATE
            SET balance = EXCLUDED.balance, entity_name = EXCLUDED.entity_name;
        `).catch(() => null);

        walletMigrated = true;
    } catch (e) {
        console.warn('Wallet schema migration notice:', e.message);
    }
};

module.exports = {
    ensureWalletSchema,
};
