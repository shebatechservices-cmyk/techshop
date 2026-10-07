const db = require('../../config/db');
const {
  ensureProductColumns,
  parseBool,
  formatProductResponse,
} = require('./productHelpers');

// প্রোডাক্ট আপডেট করা (PUT /api/products/:id)
const updateProduct = async (req, res) => {
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

    const hasUnitName = unit_name !== undefined;
    const hasSubUnitName = sub_unit_name !== undefined;
    const hasConversionRate = conversion_rate !== undefined;
    const hasSubUnitSellingPrice = sub_unit_selling_price !== undefined;
    const hasSubUnitBarcode = sub_unit_barcode !== undefined;

    let finalImageUrl = req.body.image_url;
    if (req.files && req.files.length > 0) {
      const featureFile = req.files.find(f => f.fieldname === 'feature_image' || f.fieldname === 'image' || f.fieldname === 'images') || req.files[0];
      if (featureFile && featureFile.filename) {
        finalImageUrl = `/uploads/products/${featureFile.filename}`;
      }
    }

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
        unit_name = CASE WHEN $26::boolean THEN $18 ELSE unit_name END,
        sub_unit_name = CASE WHEN $27::boolean THEN $19 ELSE sub_unit_name END,
        conversion_rate = CASE WHEN $28::boolean THEN $20 ELSE conversion_rate END,
        sub_unit_selling_price = CASE WHEN $29::boolean THEN $21 ELSE sub_unit_selling_price END,
        sub_unit_barcode = CASE WHEN $30::boolean THEN $22 ELSE sub_unit_barcode END,
        image_url = CASE WHEN $31::boolean THEN $32 ELSE image_url END,
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
      hasUnitName ? (unit_name ? String(unit_name).trim() : 'Pcs') : null,
      hasSubUnitName ? (sub_unit_name ? String(sub_unit_name).trim() : null) : null,
      hasConversionRate ? (conversion_rate ? Number(conversion_rate) : 1) : null,
      hasSubUnitSellingPrice ? (sub_unit_selling_price ? Number(sub_unit_selling_price) : null) : null,
      hasSubUnitBarcode ? (sub_unit_barcode ? String(sub_unit_barcode).trim() : null) : null,
      status || null,
      description !== undefined ? description : null,
      Number(id),
      hasUnitName,
      hasSubUnitName,
      hasConversionRate,
      hasSubUnitSellingPrice,
      hasSubUnitBarcode,
      finalImageUrl !== undefined,
      (finalImageUrl && String(finalImageUrl).trim()) ? String(finalImageUrl).trim() : null,
    ];

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (finalImageUrl && String(finalImageUrl).trim()) {
      await db.query(
        `INSERT INTO product_images (product_id, image_url, image_type, sort_order)
         VALUES ($1, $2, 'feature', 0)
         ON CONFLICT DO NOTHING`,
        [Number(id), String(finalImageUrl).trim()]
      ).catch(() => {});
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

module.exports = {
  updateProduct,
};
