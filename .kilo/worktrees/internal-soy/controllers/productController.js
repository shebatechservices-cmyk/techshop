const db = require('../config/db');

// নতুন প্রোডাক্ট যোগ করা
exports.createProduct = async (req, res) => {
  try {
    const { name, category_id, brand_id, sku, barcode, purchase_price, selling_price } = req.body;

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
        sku ? sku.trim() : null,
        barcode ? barcode.trim() : null,
        name.trim(),
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

    const query = `
      INSERT INTO products (name, category_id, brand_id, sku, barcode, purchase_price, selling_price)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [
      name.trim(),
      category_id || null,
      brand_id || null,
      sku ? sku.trim() : null,
      barcode ? barcode.trim() : null,
      purchase_price || 0,
      selling_price || 0
    ];

    const result = await db.query(query, values);

    return res.status(201).json({
      success: true,
      message: 'প্রোডাক্ট সফলভাবে যুক্ত হয়েছে।',
      data: result.rows[0]
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
    return res.status(500).json({ success: false, message: 'সার্ভার এরর হয়েছে।' });
  }
};

// সব প্রোডাক্ট ফেচ করা
exports.getAllProducts = async (req, res) => {
  try {
    const query = `SELECT * FROM products ORDER BY id DESC;`;
    const result = await db.query(query);
    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Fetch products error:', error);
    return res.status(500).json({ success: false, message: 'ডাটা ফেচ করতে সমস্যা হয়েছে।' });
  }
};
