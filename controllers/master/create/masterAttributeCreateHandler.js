const pool = require('../../../config/db');
const { safeIntOrNull } = require('./masterCreateParsers');

async function handleAttributeCreate(entity, req, res) {
    const { name, category_id, sub_category_id, brand_id, model_id } = req.body;
    const trimmedName = String(name || '').trim();

    if (!trimmedName) {
        return res.status(400).json({ error: 'Name is required' });
    }

    let result;

    if (entity === 'sub_categories') {
        const catId = safeIntOrNull(category_id);
        if (!catId) {
            return res.status(400).json({ error: 'Please select a category' });
        }
        const existing = await pool.query(
            'SELECT * FROM sub_categories WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) AND category_id = $2 LIMIT 1',
            [trimmedName, catId]
        );
        if (existing.rows.length > 0) {
            result = existing;
        } else {
            result = await pool.query(
                'INSERT INTO sub_categories (name, category_id) VALUES ($1, $2) RETURNING *',
                [trimmedName, catId]
            );
        }
    } else if (entity === 'series') {
        const brId = safeIntOrNull(brand_id);
        const moId = safeIntOrNull(model_id);
        const existing = await pool.query(
            'SELECT * FROM series WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) AND brand_id = $2 LIMIT 1',
            [trimmedName, brId]
        );
        if (existing.rows.length > 0) {
            result = existing;
        } else {
            result = await pool.query(
                `INSERT INTO series (name, brand_id, model_id)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (name, brand_id) DO UPDATE SET model_id = COALESCE(series.model_id, EXCLUDED.model_id)
                 RETURNING *`,
                [trimmedName, brId, moId]
            );
        }
    } else if (entity === 'models') {
        const brId = safeIntOrNull(brand_id);
        const catId = safeIntOrNull(category_id);
        const subCatId = safeIntOrNull(sub_category_id);
        const existing = await pool.query(
            'SELECT * FROM models WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) AND brand_id = $2 LIMIT 1',
            [trimmedName, brId]
        );
        if (existing.rows.length > 0) {
            result = existing;
        } else {
            result = await pool.query(
                'INSERT INTO models (name, brand_id, category_id, sub_category_id) VALUES ($1, $2, $3, $4) RETURNING *',
                [trimmedName, brId, catId, subCatId]
            );
        }
    } else if (entity === 'product_names') {
        const brId = safeIntOrNull(brand_id);
        const catId = safeIntOrNull(category_id);
        const subCatId = safeIntOrNull(sub_category_id);
        result = await pool.query(
            `INSERT INTO product_names (name, brand_id, category_id, sub_category_id)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT DO NOTHING
             RETURNING *`,
            [trimmedName, brId, catId, subCatId]
        );
        if (!result.rows.length) {
            result = await pool.query(
                'SELECT * FROM product_names WHERE name = $1 LIMIT 1',
                [trimmedName]
            );
        }
    } else if (entity === 'brands') {
        const subCatId = safeIntOrNull(sub_category_id);
        const existing = await pool.query(
            'SELECT * FROM brands WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1',
            [trimmedName]
        );
        if (existing.rows.length > 0) {
            result = existing;
        } else {
            result = await pool.query(
                `INSERT INTO brands (name, sub_category_id) VALUES ($1, $2) RETURNING *`,
                [trimmedName, subCatId]
            );
        }
    } else if (entity === 'categories') {
        const existing = await pool.query(
            'SELECT * FROM categories WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1',
            [trimmedName]
        );
        if (existing.rows.length > 0) {
            result = existing;
        } else {
            result = await pool.query(
                'INSERT INTO categories (name) VALUES ($1) RETURNING *',
                [trimmedName]
            );
        }
    } else {
        result = await pool.query(
            `INSERT INTO ${entity} (name) VALUES ($1) RETURNING *`,
            [trimmedName]
        );
    }

    return res.status(201).json({
        message: 'Successfully added!',
        data: result.rows[0],
    });
}

module.exports = { handleAttributeCreate };
