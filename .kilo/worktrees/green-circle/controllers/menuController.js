const pool = require('../config/db');

const getMenu = async (_req, res) => {
    try {
        const items = await pool.query(
            'SELECT * FROM menu_items WHERE is_active = true ORDER BY sort_order ASC, id ASC'
        );
        const subs = await pool.query(
            'SELECT * FROM menu_sub_items ORDER BY sort_order ASC, id ASC'
        );
        const categories = await pool.query('SELECT id, name FROM categories ORDER BY name ASC');
        const subCategories = await pool.query(
            'SELECT id, name, category_id FROM sub_categories ORDER BY name ASC'
        );

        const childrenByParent = {};
        subs.rows.forEach((sub) => {
            if (!childrenByParent[sub.menu_item_id]) childrenByParent[sub.menu_item_id] = [];
            childrenByParent[sub.menu_item_id].push({
                id: `static-${sub.id}`,
                label: sub.label,
                route_key: sub.route_key,
                kind: 'static',
                children: [],
            });
        });

        const productsItem = items.rows.find((item) => item.slug === 'products');
        if (productsItem) {
            const categoryChildren = categories.rows.map((category) => ({
                id: `category-${category.id}`,
                label: category.name,
                route_key: 'catalog',
                kind: 'category',
                source_id: category.id,
                children: subCategories.rows
                    .filter((sub) => sub.category_id === category.id)
                    .map((sub) => ({
                        id: `subcategory-${sub.id}`,
                        label: sub.name,
                        route_key: 'catalog',
                        kind: 'sub_category',
                        source_id: sub.id,
                    })),
            }));
            childrenByParent[productsItem.id] = [
                ...(childrenByParent[productsItem.id] || []),
                ...categoryChildren,
            ];
        }

        res.status(200).json(items.rows.map((item) => ({
            ...item,
            children: childrenByParent[item.id] || [],
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'মেনু লোড করা যায়নি' });
    }
};

module.exports = { getMenu };
