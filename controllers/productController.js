const db = require('../config/db');

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
  };
};

// নতুন প্রোডাক্ট যোগ করা
exports.createProduct = async (req, res) => {
  try {
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

    const query = `
      INSERT INTO products (
        name, category_id, sub_category_id, brand_id, model_id, series_id,
        sku, barcode, purchase_price, selling_price, mrp, stock, min_stock,
        warranty_months, is_serial_tracked, is_serial_required, is_warranty_required
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
    ];

    const result = await db.query(query, values);

    return res.status(201).json({
      success: true,
      message: 'প্রোডাক্ট সফলভাবে যুক্ত হয়েছে।',
      data: formatProductResponse(result.rows[0])
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
        status = COALESCE($17, status),
        description = COALESCE($18, description),
        updated_at = NOW()
      WHERE id = $19 AND deleted_at IS NULL
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
      status || null,
      description !== undefined ? description : null,
      Number(id),
    ];

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: formatProductResponse(result.rows[0])
    });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update product' });
  }
};

// সব প্রোডাক্ট ফেচ করা
exports.getAllProducts = async (req, res) => {
  try {
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
    return res.status(200).json({
      success: true,
      data: result.rows.map(formatProductResponse)
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    return res.status(500).json({ success: false, message: 'ডাটা ফেচ করতে সমস্যা হয়েছে।' });
  }
};
