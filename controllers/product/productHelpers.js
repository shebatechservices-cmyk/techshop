const db = require('../../config/db');

let productSchemaReady = false;
async function ensureProductColumns() {
  if (productSchemaReady) return;
  try {
    await db.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN DEFAULT FALSE;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_name VARCHAR(50) DEFAULT 'Pcs';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_unit_name VARCHAR(50);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS conversion_rate NUMERIC(10,2) DEFAULT 1;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_unit_selling_price NUMERIC(12,2);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_unit_barcode VARCHAR(100);

      CREATE TABLE IF NOT EXISTS product_bundle_items (
        id SERIAL PRIMARY KEY,
        bundle_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INT NOT NULL DEFAULT 1,
        unit_price NUMERIC(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    productSchemaReady = true;
  } catch (err) {
    console.warn('Product schema ensure notice:', err.message);
  }
}

ensureProductColumns().catch(() => {});

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

// Helper to format product full catalog name
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

module.exports = {
  ensureProductColumns,
  parseBool,
  formatProductResponse,
};
