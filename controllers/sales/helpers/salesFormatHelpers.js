const pool = require('../../../config/db');

const money = (val) => Number.parseFloat(val || 0) || 0;

let salesMigrated = false;
const ensureSalesColumns = async (dbClient = pool) => {
    if (salesMigrated) return;
    try {
        await dbClient.query(`
            ALTER TABLE sales ADD COLUMN IF NOT EXISTS extra_cost NUMERIC(14,2) DEFAULT 0;
            ALTER TABLE sales ADD COLUMN IF NOT EXISTS extra_cost_category VARCHAR(100);
            ALTER TABLE sales ADD COLUMN IF NOT EXISTS extra_cost_notes TEXT;
            ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type VARCHAR(30) DEFAULT 'retail';
            ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_group VARCHAR(30);
            ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
            ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
            ALTER TABLE products ADD COLUMN IF NOT EXISTS is_serial_tracked BOOLEAN DEFAULT false;
            ALTER TABLE sales_items ADD COLUMN IF NOT EXISTS warranty_months INT DEFAULT 0;
            ALTER TABLE sales_items ADD COLUMN IF NOT EXISTS unit_name VARCHAR(50);
            ALTER TABLE sales_items ADD COLUMN IF NOT EXISTS unit_type VARCHAR(20) DEFAULT 'base_unit';
            ALTER TABLE sales_items ADD COLUMN IF NOT EXISTS conversion_rate NUMERIC(10,2) DEFAULT 1;
            ALTER TABLE sales_items ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) DEFAULT 0;
            ALTER TABLE sales ADD COLUMN IF NOT EXISTS previous_due NUMERIC(14,2) DEFAULT 0;
            ALTER TABLE sales ADD COLUMN IF NOT EXISTS exchange_from_invoice_no VARCHAR(100);
            ALTER TABLE sales ADD COLUMN IF NOT EXISTS original_sale_id INT;
            ALTER TABLE sales ADD COLUMN IF NOT EXISTS exchange_details JSONB;
            CREATE SEQUENCE IF NOT EXISTS sales_invoice_no_seq START 1000;
        `);
        salesMigrated = true;
    } catch (e) {
        console.warn('Sales table column migration notice:', e.message);
    }
};

// Run eagerly so DDL is never executed inside concurrent write transactions
ensureSalesColumns().catch(() => {});

const formatProductFullName = (p) => {
    if (!p) return 'Product';
    const brand = (p.brand_name || p.brand || '').trim();
    const name = (p.product_name || p.name || '').trim();
    const model = (p.model_name || p.model || '').trim();
    const series = (p.series_name || p.series || '').trim();
    const parts = [];
    if (brand) parts.push(brand);
    if (name) {
        if (brand && name.toLowerCase().startsWith(brand.toLowerCase())) {
            const rest = name.slice(brand.length).trim();
            if (rest) parts.push(rest);
        } else {
            parts.push(name);
        }
    }
    if (model && !parts.join(' ').toLowerCase().includes(model.toLowerCase())) {
        parts.push(model);
    }
    if (series && !parts.join(' ').toLowerCase().includes(series.toLowerCase())) {
        parts.push(series);
    }
    return parts.filter(Boolean).join(' ') || name || 'Product';
};

module.exports = {
    money,
    ensureSalesColumns,
    formatProductFullName,
};
