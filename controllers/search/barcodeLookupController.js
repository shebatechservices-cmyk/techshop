const pool = require('../../config/db');
const {
    findSoldSerial,
    findInventorySerial,
    findProductBarcode,
} = require('./barcodeLookupHelpers');

const barcodeLookup = async (req, res) => {
    try {
        const code = (req.query.code || req.query.q || '').trim();
        if (!code) {
            return res.status(400).json({ success: false, message: 'Barcode or serial code is required' });
        }

        // 1. Try to find by Serial Number in sales_item_serials (sold serial unit)
        const soldResult = await findSoldSerial(pool, code);
        if (soldResult) {
            return res.status(200).json(soldResult);
        }

        // 2. Check if serial is in purchase_order_serials (in-stock or unsold)
        const inStockResult = await findInventorySerial(pool, code);
        if (inStockResult) {
            return res.status(200).json(inStockResult);
        }

        // 3. Fallback: Lookup by Product Barcode or SKU
        const productResult = await findProductBarcode(pool, code);
        if (productResult) {
            return res.status(200).json(productResult);
        }

        return res.status(404).json({
            success: false,
            message: `No serial number or barcode match found for "${code}"`,
        });
    } catch (error) {
        console.error('barcodeLookup error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    barcodeLookup,
};
