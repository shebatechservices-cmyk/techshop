const pool = require('../../config/db');

const WARRANTY_GRACE_DAYS = 60;
let tablesMigrated = false;

async function ensureWarrantyTables() {
    if (tablesMigrated) return;
    try {
        await pool.query(`
            -- Warranty Claims Table
            CREATE TABLE IF NOT EXISTS warranty_claims (
                id SERIAL PRIMARY KEY,
                claim_no VARCHAR(100) UNIQUE NOT NULL,
                order_source VARCHAR(20) DEFAULT 'offline',
                invoice_no VARCHAR(100),
                ecommerce_order_no VARCHAR(100),
                customer_id INT,
                customer_name VARCHAR(150),
                customer_phone VARCHAR(50),
                product_id INT,
                product_name VARCHAR(255),
                serial_code VARCHAR(100),
                barcode VARCHAR(100),
                issue_description TEXT,
                status VARCHAR(50) DEFAULT 'Received',
                service_notes TEXT,
                replacement_serial_code VARCHAR(100),
                backup_unit_provided VARCHAR(255),
                received_date TIMESTAMP DEFAULT NOW(),
                estimated_delivery_date DATE,
                completed_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            );

            -- Ensure columns in warranty_claims
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150);
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS serial_code VARCHAR(100);
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Received';
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS service_notes TEXT;
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS replacement_serial_code VARCHAR(100);
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS backup_unit_provided VARCHAR(255);
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS received_date TIMESTAMP DEFAULT NOW();
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS completed_date TIMESTAMP;

            -- Product Returns Table
            CREATE TABLE IF NOT EXISTS product_returns (
                id SERIAL PRIMARY KEY,
                return_no VARCHAR(100) UNIQUE NOT NULL,
                order_source VARCHAR(20) DEFAULT 'offline',
                invoice_no VARCHAR(100),
                ecommerce_order_no VARCHAR(100),
                customer_id INT,
                customer_name VARCHAR(150),
                customer_phone VARCHAR(50),
                product_id INT,
                product_name VARCHAR(255),
                serial_code VARCHAR(100),
                return_qty INT DEFAULT 1,
                return_type VARCHAR(50) DEFAULT 'Refund',
                refund_amount NUMERIC(12,2) DEFAULT 0,
                refund_method VARCHAR(50) DEFAULT 'Cash',
                condition VARCHAR(50) DEFAULT 'Good',
                return_reason TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );

            -- Ensure columns in product_returns
            ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150);
            ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
            ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
            ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS serial_code VARCHAR(100);
            ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS return_type VARCHAR(50) DEFAULT 'Refund';
            ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS refund_method VARCHAR(50) DEFAULT 'Cash';

            -- Damaged products table
            CREATE TABLE IF NOT EXISTS damaged_products (
                id SERIAL PRIMARY KEY,
                product_id INT,
                quantity INT DEFAULT 1,
                note TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        tablesMigrated = true;
    } catch (err) {
        console.error('Warranty table migration notice:', err.message);
    }
}

module.exports = {
    WARRANTY_GRACE_DAYS,
    ensureWarrantyTables
};
