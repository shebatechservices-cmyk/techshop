const pool = require("../../config/db");

let tableMigrated = false;

async function ensureEcommerceColumns() {
    if (tableMigrated) return;
    try {
        await pool.query(`
            ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS order_no VARCHAR(50);
            ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC(10,2) DEFAULT 0;
            ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid';
            ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS courier_name VARCHAR(100);
            ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(100);
            ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS customer_notes TEXT;
            ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cod';
        `);
        tableMigrated = true;
    } catch (e) {
        console.warn("Ecommerce columns check/migration:", e.message);
    }
}

module.exports = {
    ensureEcommerceColumns,
};
