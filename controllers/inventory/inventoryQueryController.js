const pool = require('../../config/db');

// Helper to sanitize money numbers
const money = (val) => Number.parseFloat(val || 0) || 0;

// 1. Get Inventory with Full Stock Valuation, Inflow, and Metrics
const getInventory = async (req, res) => {
    try {
        const { warehouse_id, filter, search, category_id } = req.query;

        let query = `
            SELECT 
                p.id,
                p.name,
                p.short_name,
                p.sku,
                p.barcode,
                p.description,
                p.category_id,
                c.name AS category_name,
                p.sub_category_id,
                sc.name AS sub_category_name,
                p.brand_id,
                b.name AS brand_name,
                p.model_id,
                m.name AS model_name,
                p.series_id,
                s.name AS series_name,
                p.unit_name,
                p.sub_unit_name,
                p.conversion_rate,
                p.sub_unit_selling_price,
                p.is_serial_tracked,
                p.is_serial_required,
                COALESCE(NULLIF(p.purchase_price, 0), (
                    SELECT poi.cost_price 
                    FROM purchase_order_items poi 
                    JOIN purchase_orders po ON po.id = poi.purchase_order_id 
                    WHERE poi.product_id = p.id AND po.deleted_at IS NULL 
                    ORDER BY po.created_at DESC 
                    LIMIT 1
                ), 0) AS cost_price,
                COALESCE(NULLIF(p.selling_price, 0), (
                    SELECT COALESCE(NULLIF(poi.final_sale_price, 0), poi.sale_price)
                    FROM purchase_order_items poi 
                    JOIN purchase_orders po ON po.id = poi.purchase_order_id 
                    WHERE poi.product_id = p.id AND po.deleted_at IS NULL 
                    ORDER BY po.created_at DESC 
                    LIMIT 1
                ), p.purchase_price, 0) AS sale_price,
                COALESCE(p.mrp, 0) AS mrp,
                COALESCE(p.stock, 0) AS stock,
                COALESCE(p.min_stock, 5) AS min_stock,
                COALESCE(p.warranty_months, 0) AS warranty_months,
                p.supplier_warranty_expire_date,
                p.purchased_at,
                (
                    SELECT po.created_at 
                    FROM purchase_order_items poi 
                    JOIN purchase_orders po ON po.id = poi.purchase_order_id 
                    WHERE poi.product_id = p.id AND po.deleted_at IS NULL 
                    ORDER BY po.created_at DESC 
                    LIMIT 1
                ) AS latest_purchase_date,
                COALESCE((
                    SELECT poi.warranty_months 
                    FROM purchase_order_items poi 
                    JOIN purchase_orders po ON po.id = poi.purchase_order_id 
                    WHERE poi.product_id = p.id AND po.deleted_at IS NULL 
                    ORDER BY po.created_at DESC 
                    LIMIT 1
                ), p.warranty_months, 0) AS supplier_warranty_months,
                p.status,
                p.image_url,
                COALESCE(p.is_ecommerce_active, true) AS is_ecommerce_active,
                COALESCE(p.purchase_count, 0) AS purchase_count,
                COALESCE((
                    SELECT SUM(poi.quantity) 
                    FROM purchase_order_items poi 
                    JOIN purchase_orders po ON po.id = poi.purchase_order_id
                    WHERE poi.product_id = p.id AND po.deleted_at IS NULL
                ), 0) AS total_inflow_units,
                COALESCE((
                    SELECT COUNT(*) 
                    FROM purchase_order_serials pos
                    JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
                    JOIN purchase_orders po ON po.id = poi.purchase_order_id
                    WHERE poi.product_id = p.id AND po.deleted_at IS NULL
                ), 0) AS total_serials_count,
                COALESCE((
                    SELECT COUNT(*)
                    FROM sales_items si
                    WHERE si.product_id = p.id
                ), 0) AS total_sold_units
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN sub_categories sc ON sc.id = p.sub_category_id
            LEFT JOIN brands b ON b.id = p.brand_id
            LEFT JOIN models m ON m.id = p.model_id
            LEFT JOIN series s ON s.id = p.series_id
            WHERE p.deleted_at IS NULL
              AND (
                COALESCE(p.stock, 0) > 0 
                OR COALESCE(p.purchase_count, 0) > 0 
                OR EXISTS (
                    SELECT 1 
                    FROM purchase_order_items poi 
                    JOIN purchase_orders po ON po.id = poi.purchase_order_id
                    WHERE poi.product_id = p.id AND po.deleted_at IS NULL
                )
              )
        `;

        const conditions = [];
        const params = [];
        let pIndex = 1;

        if (category_id) {
            conditions.push(`p.category_id = $${pIndex++}`);
            params.push(Number(category_id));
        }

        if (conditions.length > 0) {
            query += ` AND ${conditions.join(' AND ')}`;
        }

        query += ` ORDER BY p.id DESC`;

        const result = await pool.query(query, params);
        let items = result.rows;

        // Build composite label and calculate aging + exact supplier warranty expiry
        const now = new Date();
        items = items.map((p) => {
            const parts = [p.brand_name, p.name, p.model_name, p.series_name]
                .filter(Boolean)
                .filter((val, idx, arr) => arr.indexOf(val) === idx);
            const compositeName = parts.length > 0 ? parts.join(' ') : p.name;

            const stock = Number(p.stock || 0);
            const minStock = Number(p.min_stock || 5);
            let stockStatus = 'in_stock';
            if (stock <= 0) {
                stockStatus = 'out_of_stock';
            } else if (stock <= minStock) {
                stockStatus = 'low_stock';
            }

            // Inventory Aging: Current Date - Purchase Date
            const purchaseDateRaw = p.latest_purchase_date || p.purchased_at || null;
            let agingDays = 0;
            let purchaseDateFormatted = null;
            if (purchaseDateRaw) {
                const pDate = new Date(purchaseDateRaw);
                if (!isNaN(pDate.getTime())) {
                    purchaseDateFormatted = pDate.toISOString().split('T')[0];
                    const diffMs = now.getTime() - pDate.getTime();
                    agingDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
                }
            }

            // Exact Supplier Warranty Expiry Date: Purchase Date + Supplier Warranty Months
            const supWarrantyMonths = Number(p.supplier_warranty_months || p.warranty_months || 0);
            let supWarrantyExpireDate = p.supplier_warranty_expire_date ? new Date(p.supplier_warranty_expire_date).toISOString().split('T')[0] : null;
            if (!supWarrantyExpireDate && purchaseDateRaw && supWarrantyMonths > 0) {
                const pDate = new Date(purchaseDateRaw);
                if (!isNaN(pDate.getTime())) {
                    const exp = new Date(pDate);
                    exp.setMonth(exp.getMonth() + supWarrantyMonths);
                    supWarrantyExpireDate = exp.toISOString().split('T')[0];
                }
            }

            const costPrice = Number(p.cost_price || p.purchase_price || 0);
            const salePrice = Number(p.sale_price || p.selling_price || p.mrp || costPrice);
            const convRate = Number(p.conversion_rate || 1) > 1 ? Number(p.conversion_rate) : 1;
            const effectiveCostPerStockUnit = convRate > 1 ? (costPrice / convRate) : costPrice;
            const effectiveSalePerStockUnit = convRate > 1 ? (salePrice / convRate) : salePrice;
            const stockValuation = stock * effectiveCostPerStockUnit;
            const retailValuation = stock * effectiveSalePerStockUnit;
            const stockDisplay = p.sub_unit_name && convRate > 1
                ? `${stock} ${p.sub_unit_name} (${(stock / convRate).toFixed(2)} ${p.unit_name || 'Roll'})`
                : `${stock} ${p.unit_name || 'pcs'}`;

            return {
                ...p,
                composite_name: compositeName,
                cost_price: costPrice,
                costPrice: costPrice,
                sale_price: salePrice,
                salePrice: salePrice,
                selling_price: salePrice,
                purchase_price: costPrice,
                conversion_rate: convRate,
                unit_name: p.unit_name || 'pcs',
                sub_unit_name: p.sub_unit_name || null,
                stock_display: stockDisplay,
                effective_cost_per_unit: effectiveCostPerStockUnit,
                effective_sale_per_unit: effectiveSalePerStockUnit,
                stock_valuation: stockValuation,
                retail_valuation: retailValuation,
                mrp: Number(p.mrp || 0),
                stock: stock,
                min_stock: minStock,
                stock_status: stockStatus,
                total_inflow_units: Number(p.total_inflow_units || 0),
                purchase_date: purchaseDateFormatted,
                aging_days: agingDays,
                is_aged_60_plus: agingDays >= 60,
                supplier_warranty_months: supWarrantyMonths,
                supplier_warranty_expire_date: supWarrantyExpireDate,
            };
        });

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
