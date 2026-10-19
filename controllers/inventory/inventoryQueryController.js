const pool = require('../../config/db');
const { buildInventoryQuery } = require('./queries/inventorySqlBuilder');
const { mapInventoryItem } = require('./queries/inventoryItemMapper');

// Helper to sanitize money numbers
const money = (val) => Number.parseFloat(val || 0) || 0;

// 1. Get Inventory with Full Stock Valuation, Inflow, and Metrics
const getInventory = async (req, res) => {
    try {
        const { filter, search, category_id } = req.query;

        const { query, params } = buildInventoryQuery({ category_id });
        const result = await pool.query(query, params);
        let items = result.rows;

        // Fetch purchase order batches for all products to track fixed historical batch costs
        const productIds = items.map((p) => p.id);
        const batchesByProduct = {};
        if (productIds.length > 0) {
            const batchesRes = await pool.query(
                `SELECT 
                    poi.product_id,
                    poi.purchase_order_id,
                    po.po_number,
                    po.created_at AS purchase_date,
                    poi.quantity,
                    poi.cost_price,
                    poi.final_cost,
                    poi.sale_price,
                    poi.final_sale_price,
                    sup.name AS supplier_name
                 FROM purchase_order_items poi
                 JOIN purchase_orders po ON po.id = poi.purchase_order_id
                 LEFT JOIN suppliers sup ON sup.id = po.supplier_id
                 WHERE po.deleted_at IS NULL AND poi.product_id = ANY($1::int[])
                 ORDER BY po.created_at DESC, poi.id DESC`,
                [productIds]
            );
            for (const b of batchesRes.rows) {
                if (!batchesByProduct[b.product_id]) {
                    batchesByProduct[b.product_id] = [];
                }
                batchesByProduct[b.product_id].push({
                    purchase_order_id: b.purchase_order_id,
                    po_number: b.po_number,
                    purchase_date: b.purchase_date,
                    quantity: Number(b.quantity || 0),
                    cost_price: Number(b.cost_price || 0),
                    final_cost: Number(b.final_cost || b.cost_price || 0),
                    sale_price: Number(b.final_sale_price || b.sale_price || 0),
                    supplier_name: b.supplier_name || 'Authorized Supplier',
                });
            }
        }

        // Build composite label and calculate aging + exact supplier warranty expiry
        const now = new Date();
        items = items.map((p) => mapInventoryItem(p, batchesByProduct, now));

        // Compute Overview Metrics across entire catalog
        const totalProducts = items.length;
        const totalUnits = items.reduce((sum, p) => sum + p.stock, 0);
        const totalCostValuation = items.reduce((sum, p) => sum + (p.stock_valuation || 0), 0);
        const totalRetailValuation = items.reduce((sum, p) => sum + (p.retail_valuation || 0), 0);
        const lowStockCount = items.filter((p) => p.stock_status === 'low_stock').length;
        const outOfStockCount = items.filter((p) => p.stock_status === 'out_of_stock').length;

        // In-memory filter if search or filter status is provided
        let filteredItems = items;
        if (search && search.trim()) {
            const q = search.trim().toLowerCase();
            filteredItems = filteredItems.filter((p) => {
                return (
                    p.composite_name.toLowerCase().includes(q) ||
                    (p.sku && p.sku.toLowerCase().includes(q)) ||
                    (p.barcode && p.barcode.toLowerCase().includes(q)) ||
                    (p.category_name && p.category_name.toLowerCase().includes(q)) ||
                    (p.sub_category_name && p.sub_category_name.toLowerCase().includes(q)) ||
                    (p.brand_name && p.brand_name.toLowerCase().includes(q)) ||
                    (p.model_name && p.model_name.toLowerCase().includes(q))
                );
            });
        }

        if (filter && filter !== 'all') {
            if (filter === 'in_stock') {
                filteredItems = filteredItems.filter((p) => p.stock > 0);
            } else if (filter === 'low_stock' || filter === 'low') {
                filteredItems = filteredItems.filter((p) => p.stock_status === 'low_stock');
            } else if (filter === 'out_of_stock' || filter === 'out') {
                filteredItems = filteredItems.filter((p) => p.stock_status === 'out_of_stock');
            }
        }

        return res.status(200).json({
            success: true,
            summary: {
                total_products: totalProducts,
                total_units: totalUnits,
                total_cost_valuation: totalCostValuation,
                total_retail_valuation: totalRetailValuation,
                low_stock_count: lowStockCount,
                out_of_stock_count: outOfStockCount,
            },
            data: filteredItems,
        });
    } catch (error) {
        console.error('getInventory error:', error);
        return res.status(500).json({ success: false, error: 'Failed to retrieve inventory data' });
    }
};

module.exports = {
    money,
    getInventory,
};
