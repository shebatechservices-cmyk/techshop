const db = require('../config/db');

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

// নতুন প্রোডাক্ট যোগ করা
exports.createProduct = async (req, res) => {
  try {
    await ensureProductColumns();
    const {
      name,
      category_id,
      sub_category_id,
      brand_id,
      model_id,
      series_id,
      sku,
      barcode,
      purchase_price,
      selling_price,
      mrp,
      stock,
      min_stock,
      warranty_months,
      isSerialRequired,
      is_serial_required,
      is_serial_tracked,
      tracks_serial,
      isWarrantyRequired,
      is_warranty_required,
      is_bundle,
      isBundle,
      unit_name,
      sub_unit_name,
      conversion_rate,
      sub_unit_selling_price,
      sub_unit_barcode,
      bundle_items,
      bundleItems,
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'পণ্যের নাম দেওয়া বাধ্যতামূলক।' });
    }

    const dupCheck = await db.query(
      `SELECT id FROM products
       WHERE deleted_at IS NULL AND (
         ($1::text IS NOT NULL AND TRIM(sku) = TRIM($1)) OR
         ($2::text IS NOT NULL AND TRIM(barcode) = TRIM($2)) OR
         (LOWER(TRIM(name)) = LOWER(TRIM($3)) AND category_id IS NOT DISTINCT FROM $4 AND brand_id IS NOT DISTINCT FROM $5)
       )
       LIMIT 1`,
      [
        sku ? String(sku).trim() : null,
        barcode ? String(barcode).trim() : null,
        String(name).trim(),
        category_id ? Number(category_id) : null,
        brand_id ? Number(brand_id) : null,
      ]
    );

    if (dupCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Already added this product, add a new product for catalog'
      });
    }

    const isSerialReq = Boolean(
      parseBool(is_serial_required) ??
      parseBool(isSerialRequired) ??
      parseBool(is_serial_tracked) ??
      parseBool(tracks_serial) ??
      false
    );

    const isWarrantyReq = Boolean(
      parseBool(is_warranty_required) ??
      parseBool(isWarrantyRequired) ??
      (Number(warranty_months || 0) > 0)
    );

    const isBundleVal = Boolean(parseBool(is_bundle) ?? parseBool(isBundle) ?? false);

    const query = `
      INSERT INTO products (
        name, category_id, sub_category_id, brand_id, model_id, series_id,
        sku, barcode, purchase_price, selling_price, mrp, stock, min_stock,
        warranty_months, is_serial_tracked, is_serial_required, is_warranty_required,
        is_bundle, unit_name, sub_unit_name, conversion_rate, sub_unit_selling_price, sub_unit_barcode
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING *;
    `;
    const values = [
      String(name).trim(),
      category_id ? Number(category_id) : null,
      sub_category_id ? Number(sub_category_id) : null,
      brand_id ? Number(brand_id) : null,
      model_id ? Number(model_id) : null,
      series_id ? Number(series_id) : null,
      sku ? String(sku).trim() : null,
      barcode ? String(barcode).trim() : null,
      purchase_price ? Number(purchase_price) : 0,
      selling_price ? Number(selling_price) : 0,
      mrp ? Number(mrp) : 0,
      stock ? Number(stock) : 0,
      min_stock ? Number(min_stock) : 0,
      parseInt(warranty_months || 0, 10) || 0,
      isSerialReq,
      isSerialReq,
      isWarrantyReq,
      isBundleVal,
      unit_name || 'Pcs',
      sub_unit_name || null,
      conversion_rate ? Number(conversion_rate) : 1,
      sub_unit_selling_price ? Number(sub_unit_selling_price) : null,
      sub_unit_barcode ? String(sub_unit_barcode).trim() : null,
    ];

    const result = await db.query(query, values);
    const createdProduct = result.rows[0];

    // Save bundle kit components if bundle
    let parsedBundleItems = [];
    const rawItems = bundle_items || bundleItems;
    if (rawItems) {
      parsedBundleItems = typeof rawItems === 'string' ? JSON.parse(rawItems) : rawItems;
    }
    if (isBundleVal && Array.isArray(parsedBundleItems) && parsedBundleItems.length > 0) {
      for (const bi of parsedBundleItems) {
        if (bi.product_id) {
          await db.query(
            `INSERT INTO product_bundle_items (bundle_id, product_id, quantity, unit_price)
             VALUES ($1, $2, $3, $4)`,
            [createdProduct.id, Number(bi.product_id), Number(bi.quantity || 1), Number(bi.unit_price || 0)]
          );
        }
      }
    }

    createdProduct.bundle_items = parsedBundleItems;

    return res.status(201).json({
      success: true,
      message: 'প্রোডাক্ট সফলভাবে যুক্ত হয়েছে।',
      data: formatProductResponse(createdProduct)
    });
  } catch (error) {
    if (error.code === '23505') {
      if (error.constraint && error.constraint.includes('sku')) {
        return res.status(409).json({ success: false, message: 'এই SKU ইতিমধ্যে সিস্টেমে আছে।' });
      }
      if (error.constraint && error.constraint.includes('barcode')) {
        return res.status(409).json({ success: false, message: 'এই বারকোডটি ইতিমধ্যে ব্যবহৃত হয়েছে।' });
      }
    }
    console.error('Product creation error:', error);
    return res.status(500).json({ success: false, message: 'সার্ভার এরর হয়েছে: ' + error.message });
  }
};

// প্রোডাক্ট আপডেট করা (PUT /api/products/:id)
exports.updateProduct = async (req, res) => {
  try {
    await ensureProductColumns();
    const { id } = req.params;
    const {
      name,
      category_id,
      sub_category_id,
      brand_id,
      model_id,
      series_id,
      sku,
      barcode,
      purchase_price,
      selling_price,
      mrp,
      stock,
      min_stock,
      warranty_months,
      isSerialRequired,
      is_serial_required,
      is_serial_tracked,
      tracks_serial,
      isWarrantyRequired,
      is_warranty_required,
      is_bundle,
      isBundle,
      unit_name,
      sub_unit_name,
      conversion_rate,
      sub_unit_selling_price,
      sub_unit_barcode,
      bundle_items,
      bundleItems,
      status,
      description,
    } = req.body;

    const isSerialReq = parseBool(
      is_serial_required !== undefined ? is_serial_required :
      (isSerialRequired !== undefined ? isSerialRequired :
      (is_serial_tracked !== undefined ? is_serial_tracked :
      (tracks_serial !== undefined ? tracks_serial : undefined)))
    );

    const isWarrantyReq = parseBool(
      is_warranty_required !== undefined ? is_warranty_required :
      (isWarrantyRequired !== undefined ? isWarrantyRequired :
      (warranty_months !== undefined ? (Number(warranty_months || 0) > 0) : undefined))
    );

    const isBundleVal = parseBool(
      is_bundle !== undefined ? is_bundle :
      (isBundle !== undefined ? isBundle : undefined)
    );

    const query = `
      UPDATE products SET
        name = COALESCE($1, name),
        category_id = COALESCE($2, category_id),
        sub_category_id = COALESCE($3, sub_category_id),
        brand_id = COALESCE($4, brand_id),
        model_id = COALESCE($5, model_id),
        series_id = COALESCE($6, series_id),
        sku = COALESCE($7, sku),
        barcode = COALESCE($8, barcode),
        purchase_price = COALESCE($9, purchase_price),
        selling_price = COALESCE($10, selling_price),
        mrp = COALESCE($11, mrp),
        stock = COALESCE($12, stock),
        min_stock = COALESCE($13, min_stock),
        warranty_months = COALESCE($14, warranty_months),
        is_serial_tracked = COALESCE($15, is_serial_tracked),
        is_serial_required = COALESCE($15, is_serial_required),
        is_warranty_required = COALESCE($16, is_warranty_required),
        is_bundle = COALESCE($17, is_bundle),
        unit_name = COALESCE($18, unit_name),
        sub_unit_name = COALESCE($19, sub_unit_name),
        conversion_rate = COALESCE($20, conversion_rate),
        sub_unit_selling_price = COALESCE($21, sub_unit_selling_price),
        sub_unit_barcode = COALESCE($22, sub_unit_barcode),
        status = COALESCE($23, status),
        description = COALESCE($24, description),
        updated_at = NOW()
      WHERE id = $25 AND deleted_at IS NULL
      RETURNING *;
    `;

    const values = [
      name ? String(name).trim() : null,
      category_id ? Number(category_id) : null,
      sub_category_id ? Number(sub_category_id) : null,
      brand_id ? Number(brand_id) : null,
      model_id ? Number(model_id) : null,
      series_id ? Number(series_id) : null,
      sku !== undefined ? (sku ? String(sku).trim() : null) : null,
      barcode !== undefined ? (barcode ? String(barcode).trim() : null) : null,
      purchase_price !== undefined ? Number(purchase_price) : null,
      selling_price !== undefined ? Number(selling_price) : null,
      mrp !== undefined ? Number(mrp) : null,
      stock !== undefined ? Number(stock) : null,
      min_stock !== undefined ? Number(min_stock) : null,
      warranty_months !== undefined ? parseInt(warranty_months || 0, 10) : null,
      isSerialReq !== undefined ? isSerialReq : null,
      isWarrantyReq !== undefined ? isWarrantyReq : null,
      isBundleVal !== undefined ? isBundleVal : null,
      unit_name !== undefined ? (unit_name || 'Pcs') : null,
      sub_unit_name !== undefined ? (sub_unit_name || null) : null,
      conversion_rate !== undefined ? Number(conversion_rate) : null,
      sub_unit_selling_price !== undefined ? (sub_unit_selling_price ? Number(sub_unit_selling_price) : null) : null,
      sub_unit_barcode !== undefined ? (sub_unit_barcode ? String(sub_unit_barcode).trim() : null) : null,
      status || null,
      description !== undefined ? description : null,
      Number(id),
    ];

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updatedProduct = result.rows[0];

    // Update bundle items if provided
    const rawItems = bundle_items || bundleItems;
    if (rawItems !== undefined) {
      const parsedBundleItems = typeof rawItems === 'string' ? JSON.parse(rawItems) : (Array.isArray(rawItems) ? rawItems : []);
      await db.query('DELETE FROM product_bundle_items WHERE bundle_id = $1', [Number(id)]);
      for (const bi of parsedBundleItems) {
        if (bi.product_id) {
          await db.query(
            `INSERT INTO product_bundle_items (bundle_id, product_id, quantity, unit_price)
             VALUES ($1, $2, $3, $4)`,
            [Number(id), Number(bi.product_id), Number(bi.quantity || 1), Number(bi.unit_price || 0)]
          );
        }
      }
      updatedProduct.bundle_items = parsedBundleItems;
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: formatProductResponse(updatedProduct)
    });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update product' });
  }
};

// সব প্রোডাক্ট ফেচ করা
exports.getAllProducts = async (req, res) => {
  try {
    await ensureProductColumns();
    const query = `
      SELECT p.*,
             CASE WHEN (p.is_serial_required IS TRUE OR p.is_serial_tracked IS TRUE) THEN true ELSE false END AS "isSerialRequired",
             CASE WHEN (p.is_serial_required IS TRUE OR p.is_serial_tracked IS TRUE) THEN true ELSE false END AS is_serial_required,
             CASE WHEN (p.is_serial_required IS TRUE OR p.is_serial_tracked IS TRUE) THEN true ELSE false END AS is_serial_tracked,
             CASE WHEN (p.is_serial_required IS TRUE OR p.is_serial_tracked IS TRUE) THEN true ELSE false END AS tracks_serial,
             CASE WHEN (p.is_warranty_required IS TRUE OR COALESCE(p.warranty_months, 0) > 0) THEN true ELSE false END AS "isWarrantyRequired",
             CASE WHEN (p.is_warranty_required IS TRUE OR COALESCE(p.warranty_months, 0) > 0) THEN true ELSE false END AS is_warranty_required,
             c.name AS category_name,
             sc.name AS sub_category_name,
             b.name AS brand_name,
             m.name AS model_name,
             s.name AS series_name,
             COALESCE((
                 SELECT poi.cost_price 
                 FROM purchase_order_items poi 
                 WHERE poi.product_id = p.id 
                 ORDER BY poi.id DESC 
                 LIMIT 1
             ), p.purchase_price, 0) AS last_purchase_price,
             (
                 SELECT poi.margin_value 
                 FROM purchase_order_items poi 
                 WHERE poi.product_id = p.id 
                 ORDER BY poi.id DESC 
                 LIMIT 1
             ) AS last_margin_value,
             COALESCE((
                 SELECT poi.margin_type 
                 FROM purchase_order_items poi 
                 WHERE poi.product_id = p.id 
                 ORDER BY poi.id DESC 
                 LIMIT 1
             ), 'percent') AS last_margin_type,
             COALESCE((
                 SELECT poi.warranty_months 
                 FROM purchase_order_items poi 
                 WHERE poi.product_id = p.id 
                 ORDER BY poi.id DESC 
                 LIMIT 1
             ), p.warranty_months, 0) AS batch_warranty_months
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN models m ON m.id = p.model_id
      LEFT JOIN series s ON s.id = p.series_id
      WHERE p.deleted_at IS NULL
      ORDER BY p.id DESC;
    `;
    const result = await db.query(query);

    // Fetch bundle items
    const bundleItemsRes = await db.query(`
      SELECT bi.*, p.name AS component_name, p.sku AS component_sku, p.stock AS component_stock, p.selling_price AS component_selling_price
      FROM product_bundle_items bi
      JOIN products p ON p.id = bi.product_id
      WHERE p.deleted_at IS NULL
    `).catch(() => ({ rows: [] }));

    const bundleMap = {};
    for (const row of bundleItemsRes.rows) {
      if (!bundleMap[row.bundle_id]) bundleMap[row.bundle_id] = [];
      bundleMap[row.bundle_id].push(row);
    }

    const products = result.rows.map((row) => {
      const p = formatProductResponse(row);
      p.bundle_items = bundleMap[row.id] || [];
      if (p.is_bundle) {
        if (p.bundle_items.length > 0) {
          const maxKits = Math.min(
            ...p.bundle_items.map((bi) => Math.floor(Number(bi.component_stock || 0) / Math.max(1, Number(bi.quantity || 1))))
          );
          p.stock = isFinite(maxKits) ? Math.max(0, maxKits) : 0;
        } else {
          p.stock = 0;
        }
      }
      return p;
    });

    return res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    return res.status(500).json({ success: false, message: 'ডাটা ফেচ করতে সমস্যা হয়েছে।' });
  }
};
