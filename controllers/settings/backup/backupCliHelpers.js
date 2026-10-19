const { execFileSync } = require('child_process');
const fs = require('fs');

function getDbCliConfig() {
    if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL);
        return {
            user: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            host: url.hostname,
            port: url.port || '5432',
            name: url.pathname.replace(/^\//, ''),
        };
    }
    return {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '5432',
        name: process.env.DB_NAME || 'product_catalog',
    };
}

function pgEnv(cfg) {
    return Object.assign({}, process.env, { PGPASSWORD: cfg.password || '' });
}

function pgDumpToFile(cfg, outputPath) {
    const fd = fs.openSync(outputPath, 'w');
    try {
        execFileSync('pg_dump', ['-U', cfg.user, '-h', cfg.host, '-p', cfg.port, '-d', cfg.name], {
            env: pgEnv(cfg),
            stdio: ['ignore', fd, 'inherit']
        });
    } finally {
        fs.closeSync(fd);
    }
}

function pgRestoreFromFile(cfg, inputPath) {
    const fd = fs.openSync(inputPath, 'r');
    try {
        execFileSync('psql', ['-U', cfg.user, '-h', cfg.host, '-p', cfg.port, '-d', cfg.name], {
            env: pgEnv(cfg),
            stdio: [fd, 'inherit', 'inherit']
        });
    } finally {
        fs.closeSync(fd);
    }
}

function pgResetSchema(cfg) {
    const sql = `DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO ${cfg.user}; GRANT ALL ON SCHEMA public TO public;`;
    execFileSync('psql', ['-U', cfg.user, '-h', cfg.host, '-p', cfg.port, '-d', cfg.name, '-v', 'ON_ERROR_STOP=1', '-c', sql], {
        env: pgEnv(cfg),
        stdio: 'inherit'
    });
}

module.exports = {
    getDbCliConfig,
    pgEnv,
    pgDumpToFile,
    pgRestoreFromFile,
    pgResetSchema
};
