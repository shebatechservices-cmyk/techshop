const pool = require('../config/db');

const addCategory = async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        const result = await pool.query(
            'INSERT INTO categories (name) VALUES ($1) RETURNING *',
            [name]
        );
        res.status(201).json({
            message: 'Category added successfully!',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'A category with this name already exists! Please use a different name.' });
        }
        console.error('addCategory error:', error);
        res.status(500).json({ error: 'Failed to add category. Server error.' });
    }
};

const getCategories = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY id ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('getCategories error:', error);
        res.status(500).json({ error: 'Failed to load categories. Server error.' });
    }
};

const addSubCategory = async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        const categoryId = Number(req.body.category_id);

        if (!name) {
            return res.status(400).json({ error: 'Sub-category name is required' });
        }
        if (!categoryId) {
            return res.status(400).json({ error: 'Please select a parent category' });
        }

        const parent = await pool.query('SELECT id FROM categories WHERE id = $1 AND deleted_at IS NULL', [categoryId]);
        if (!parent.rows.length) {
            return res.status(400).json({ error: 'Selected parent category not found or has been moved to Trash' });
        }

        const result = await pool.query(
            'INSERT INTO sub_categories (name, category_id) VALUES ($1, $2) RETURNING *',
            [name, categoryId]
        );
        res.status(201).json({
            message: 'Sub-category added successfully!',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'A sub-category with this name already exists in this category!' });
        }
        console.error('addSubCategory error:', error);
        res.status(500).json({ error: 'Failed to add sub-category. Server error.' });
    }
};

const getSubCategories = async (req, res) => {
    try {
        const categoryId = req.query.category_id ? Number(req.query.category_id) : null;
        const result = categoryId
            ? await pool.query(
                'SELECT * FROM sub_categories WHERE category_id = $1 AND deleted_at IS NULL ORDER BY id ASC',
                [categoryId]
            )
            : await pool.query('SELECT * FROM sub_categories WHERE deleted_at IS NULL ORDER BY id ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('getSubCategories error:', error);
        res.status(500).json({ error: 'Failed to load sub-categories. Server error.' });
    }
};

module.exports = { addCategory, getCategories, addSubCategory, getSubCategories };
