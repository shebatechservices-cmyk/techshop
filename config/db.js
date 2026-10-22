require('dotenv').config();

const { Pool } = require('pg');

let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl) {
    // Strip channel_binding (node-postgres hangs with SCRAM channel_binding on Neon)
    dbUrl = dbUrl.replace(/([?&])channel_binding=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');
}

const poolConfig = dbUrl
    ? {
        connectionString: dbUrl,
        ssl: (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1'))
            ? false
            : { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        max: 20,
      }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'product_catalog',
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT || 5432),
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        max: 20,
      };

const pool = new Pool(poolConfig);

module.exports = pool;

