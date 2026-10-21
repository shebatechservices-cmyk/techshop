const { ensureWarrantyTables } = require('../warrantySchema');
const {
    lookupSerialWarranty,
    lookupInvoiceWarranty,
    lookupInventoryStockWarranty,
} = require('./warrantyLookupHelper');

exports.checkWarranty = async (req, res) => {
    try {
        await ensureWarrantyTables();
        const query = (req.query.query || '').trim();
        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a Serial Number or Invoice Number to check.',
            });
        }

        // 1. Check by Serial Number in sales_item_serials
        const serialResult = await lookupSerialWarranty(query);
        if (serialResult) {
            return res.status(200).json({ success: true, ...serialResult });
        }

        // 2. Check by Invoice Number in sales
        const invoiceResult = await lookupInvoiceWarranty(query);
        if (invoiceResult) {
            return res.status(200).json({ success: true, ...invoiceResult });
        }

        // 3. Check in purchase_order_serials (in-stock or unassigned)
        const inStockResult = await lookupInventoryStockWarranty(query);
        if (inStockResult) {
            return res.status(200).json({ success: true, ...inStockResult });
        }

        return res.status(404).json({
            success: false,
            message: `No record found for Serial / Invoice "${query}". Make sure the S/N or Invoice number is entered correctly.`,
        });
    } catch (err) {
        console.error('Check warranty error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
