const { allowedEntities, ensureMasterSchema } = require('./masterHelpers');
const { handleProductCreate } = require('./create/masterProductCreateHandler');
const { handleAttributeCreate } = require('./create/masterAttributeCreateHandler');

const entityLabels = {
    categories: 'Category',
    sub_categories: 'Sub-Category',
    brands: 'Brand',
    models: 'Model',
    series: 'Series',
    product_names: 'Product Name',
    products: 'Product',
};

const create = async (req, res) => {
    const { entity } = req.params;
    if (!allowedEntities.includes(entity)) {
        return res.status(400).json({ error: 'Invalid entity' });
    }

    try {
        await ensureMasterSchema();

        if (entity === 'products') {
            return await handleProductCreate(req, res);
        }

        return await handleAttributeCreate(entity, req, res);
    } catch (error) {
        if (error.code === '23505') {
            const label = entityLabels[entity] || 'Item';
            return res.status(409).json({
                error: `A ${label.toLowerCase()} with this name already exists! Please use a different name.`,
            });
        }
        console.error(`[masterCreateController error]:`, error);
        return res.status(500).json({ error: error.message || 'Server error!' });
    }
};

module.exports = { create };
