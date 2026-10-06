const db = require('../../config/db');
const {
  ensureProductColumns,
  parseBool,
  formatProductResponse,
} = require('./productHelpers');

// নতুন প্রোডাক্ট যোগ করা
const createProduct = async (req, res) => {
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

module.exports = {
  createProduct,
};
