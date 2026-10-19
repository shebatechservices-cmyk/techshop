function mapInventoryItem(p, batchesByProduct, now) {
    const prodBatches = batchesByProduct[p.id] || [];
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
    let supWarrantyExpireDate = p.supplier_warranty_expire_date
        ? new Date(p.supplier_warranty_expire_date).toISOString().split('T')[0]
        : null;
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
    const effectiveCostPerStockUnit = convRate > 1 ? costPrice / convRate : costPrice;
    const effectiveSalePerStockUnit = convRate > 1 ? salePrice / convRate : salePrice;
    const stockValuation = stock * effectiveCostPerStockUnit;
    const retailValuation = stock * effectiveSalePerStockUnit;
    const stockDisplay =
        p.sub_unit_name && convRate > 1
            ? `${stock} ${p.sub_unit_name} (${(stock / convRate).toFixed(2)} ${p.unit_name || 'Roll'})`
            : `${stock} ${p.unit_name || 'pcs'}`;

    // Compute exact batch valuation for available stock
    let calculatedBatchValuation = 0;
    let tempStock = stock;
    for (const b of prodBatches) {
        const takeQty = Math.min(tempStock, b.quantity);
        if (takeQty > 0) {
            calculatedBatchValuation += takeQty * (b.final_cost || b.cost_price);
            tempStock -= takeQty;
        }
        if (tempStock <= 0) break;
    }
    if (tempStock > 0) {
        calculatedBatchValuation += tempStock * effectiveCostPerStockUnit;
    }

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
        batch_valuation: Number(calculatedBatchValuation.toFixed(2)),
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
        batches: prodBatches,
    };
}

module.exports = {
    mapInventoryItem,
};
