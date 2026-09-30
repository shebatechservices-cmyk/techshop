const pool = require('../../config/db');

// Allowed table entities for security
const allowedEntities = ['categories', 'sub_categories', 'brands', 'models', 'series', 'products', 'product_names'];

let masterSchemaReady = false;
async function ensureMasterSchema() {
    if (masterSchemaReady) return;
    const tables = ['categories', 'sub_categories', 'brands', 'models', 'series', 'product_names', 'products'];
    for (const table of tables) {
        await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`).catch(() => null);
        await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS deleted_by INTEGER`).catch(() => null);
    }
    await pool.query('ALTER TABLE series ADD COLUMN IF NOT EXISTS model_id INTEGER').catch(() => null);
    await pool.query('ALTER TABLE brands ADD COLUMN IF NOT EXISTS sub_category_id INTEGER').catch(() => null);
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS is_serial_tracked BOOLEAN DEFAULT FALSE').catch(() => null);
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS is_serial_required BOOLEAN DEFAULT FALSE').catch(() => null);
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS is_warranty_required BOOLEAN DEFAULT FALSE').catch(() => null);
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty_months INTEGER DEFAULT 0').catch(() => null);
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_warranty_expire_date DATE').catch(() => null);
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN DEFAULT FALSE').catch(() => null);
    await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_name VARCHAR(50) DEFAULT 'Pcs'").catch(() => null);
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_unit_name VARCHAR(50)').catch(() => null);
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS conversion_rate NUMERIC(10,2) DEFAULT 1').catch(() => null);
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_unit_selling_price NUMERIC(12,2)').catch(() => null);
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_unit_barcode VARCHAR(100)').catch(() => null);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS product_bundle_items (
            id SERIAL PRIMARY KEY,
            bundle_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            quantity INT NOT NULL DEFAULT 1,
            unit_price NUMERIC(12,2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `).catch(() => null);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS trash_records (
            id SERIAL PRIMARY KEY,
            table_name VARCHAR(50) NOT NULL,
            record_id INT NOT NULL,
            record_data JSONB NOT NULL,
            deleted_by INT,
            deleted_at TIMESTAMP DEFAULT NOW(),
            record_title VARCHAR(255)
        )
    `).catch(() => null);
    masterSchemaReady = true;
}

const parseBool = (val) => {
    if (val === undefined || val === null) return undefined;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
        const s = val.trim().toLowerCase();
        if (s === 'true' || s === '1') return true;
        if (s === 'false' || s === '0') return false;
    }
    if (typeof val === 'number') return val === 1;
    return Boolean(val);
};

const formatProductResponse = (row) => {
    if (!row) return row;
    const isSerial = Boolean(
        parseBool(row.is_serial_required) ||
        parseBool(row.is_serial_tracked) ||
        parseBool(row.tracks_serial) ||
        parseBool(row.isSerialRequired)
    );
    const isWarranty = Boolean(
        parseBool(row.is_warranty_required) ||
        parseBool(row.isWarrantyRequired) ||
        (Number(row.warranty_months || 0) > 0)
    );
    const isBundle = Boolean(parseBool(row.is_bundle));
    const costPrice = Number(row.cost_price || row.costPrice || row.last_purchase_price || row.purchase_price || 0);
    const salePrice = Number(row.sale_price || row.salePrice || row.batch_sale_price || row.selling_price || row.mrp || costPrice);
    return {
        ...row,
        cost_price: costPrice,
        costPrice: costPrice,
        sale_price: salePrice,
        salePrice: salePrice,
        selling_price: salePrice,
        purchase_price: costPrice,
        isSerialRequired: isSerial,
        is_serial_required: isSerial,
        is_serial_tracked: isSerial,
        tracks_serial: isSerial,
        isWarrantyRequired: isWarranty,
        is_warranty_required: isWarranty,
        is_bundle: isBundle,
        unit_name: row.unit_name || 'Pcs',
        sub_unit_name: row.sub_unit_name || null,
        conversion_rate: Number(row.conversion_rate || 1),
        sub_unit_selling_price: row.sub_unit_selling_price !== null && row.sub_unit_selling_price !== undefined
            ? Number(row.sub_unit_selling_price)
            : (Number(row.conversion_rate || 1) > 1 ? Number((salePrice / Number(row.conversion_rate)).toFixed(2)) : null),
        sub_unit_barcode: row.sub_unit_barcode || null,
        stock_display: row.sub_unit_name && Number(row.conversion_rate || 1) > 1
            ? `${Number(row.stock || 0)} ${row.sub_unit_name} (${(Number(row.stock || 0) / Number(row.conversion_rate)).toFixed(2)} ${row.unit_name || 'Box'})`
            : `${Number(row.stock || 0)} ${row.unit_name || 'Pcs'}`,
        bundle_items: Array.isArray(row.bundle_items) ? row.bundle_items : [],
    };
};

async function hasActive(sql, params) {
    const result = await pool.query(sql, params).catch(() => ({ rows: [] }));
    return result.rows.length > 0;
}

async function moveRecordToTrash(entity, id, item) {
    const itemName = item.name || `${entity} #${id}`;
    await pool.query(
        `UPDATE ${entity} SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
        [id]
    );
    try {
        await pool.query(
            `INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
             VALUES ($1, $2, $3, $4::jsonb, NOW())`,
            [entity, id, String(itemName).slice(0, 255), JSON.stringify(item)]
        );
    } catch (trashErr) {
        console.error(`trash_records insert failed for ${entity} #${id}:`, trashErr.message);
    }
    return itemName;
}


module.exports = {
    allowedEntities,
    ensureMasterSchema,
    parseBool,
    formatProductResponse,
    hasActive,
    moveRecordToTrash
};
