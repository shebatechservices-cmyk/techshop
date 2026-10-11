const { money } = require('./salesFormatHelpers');

// Normalize incoming sale items: coerce qty/price/cost, compute line totals.
const normalizeSaleItems = (items) => {
    let calculatedSubtotal = 0;
    const normalizedItems = (items || []).map((it, idx) => {
        const qty = Math.max(1, Number(it.quantity || 1));
        const price = money(it.unit_price);
        const cost = money(it.cost_price);
        const discount = money(it.discount);
        const lineTotal = Math.max(0, price * qty - discount);
        calculatedSubtotal += price * qty;
        return {
            ...it,
            quantity: qty,
            unit_price: price,
            cost_price: cost,
            discount,
            line_total: lineTotal,
            sort_order: idx + 1,
            serials: Array.isArray(it.serials) ? it.serials : [],
        };
    });
    return { normalizedItems, calculatedSubtotal };
};

// Serial/barcode-tracked products must ship with at least one attached
// barcode/serial. Returns the first offending item, or null when all good.
const validateSerialTracking = async (client, normalizedItems) => {
    if (!normalizedItems || normalizedItems.length === 0) return null;
    const productIds = [...new Set(normalizedItems.map((it) => Number(it.product_id)))];
    const trackedRes = await client.query(
        'SELECT id, is_serial_tracked FROM products WHERE id = ANY($1::int[])',
        [productIds]
    );
    const trackedIds = new Set(
        (trackedRes.rows || []).filter((r) => r.is_serial_tracked).map((r) => Number(r.id))
    );
    return normalizedItems.find(
        (it) => trackedIds.has(Number(it.product_id)) && !(it.serials && it.serials.length > 0)
    ) || null;
};

// Combined helper: normalize items and validate serial-tracked products.
// Returns { normalizedItems, calculatedSubtotal, missingItem }.
const normalizeAndValidateItems = async (items, client) => {
    const { normalizedItems, calculatedSubtotal } = normalizeSaleItems(items);
    const missingItem = await validateSerialTracking(client, normalizedItems);
    return { normalizedItems, calculatedSubtotal, missingItem };
};

module.exports = {
    normalizeSaleItems,
    validateSerialTracking,
    normalizeAndValidateItems,
};
