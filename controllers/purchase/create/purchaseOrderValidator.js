const { money } = require('../purchaseHelpers');

function validateOrderPayload({ supplier_id, items, payments }) {
    if (!supplier_id) {
        throw Object.assign(new Error('Please select a supplier'), { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
        throw Object.assign(new Error('Please add at least one product'), { status: 400 });
    }

    const seenProductIds = new Set();
    for (const item of items) {
        const pid = parseInt(item.product_id, 10);
        if (!pid) {
            throw Object.assign(new Error('Please select a valid product for each line item'), { status: 400 });
        }
        if (seenProductIds.has(pid)) {
            throw Object.assign(new Error('The same item cannot be added twice in a single purchase order.'), { status: 400 });
        }
        seenProductIds.add(pid);
    }

    const seenPaymentMethods = new Set();
    for (const pay of payments || []) {
        const method = (pay.payment_method || 'Cash').trim();
        if (money(pay.amount) > 0) {
            if (seenPaymentMethods.has(method)) {
                throw Object.assign(new Error(`The same payment method "${method}" cannot be used twice in a single purchase.`), { status: 400 });
            }
            seenPaymentMethods.add(method);
        }
    }
}

async function normalizeOrderItemsAndSerials(client, items) {
    let itemsCost = 0;
    let totalSale = 0;
    let unitCount = 0;

    const normalizedItems = items.map((item, index) => {
        const quantity = Number(item.quantity || 0);
        const costPrice = money(item.cost_price);
        const salePrice = money(item.sale_price);
        const finalSale = money(item.final_sale_price);
        if (!item.product_id) {
            throw Object.assign(new Error('Please select a product'), { status: 400 });
        }
        if (costPrice <= 0) {
            throw Object.assign(new Error('Please enter a valid cost price greater than 0 for each item'), { status: 400 });
        }
        if (!item.expected_date) {
            throw Object.assign(new Error('Please provide expected date for each item'), { status: 400 });
        }
        itemsCost += costPrice * quantity;
        totalSale += finalSale * quantity;
        unitCount += quantity;

        const rawWarranty = item.warranty_months;
        let cleanWarranty = 0;
        if (typeof rawWarranty === 'number' && !isNaN(rawWarranty)) {
            cleanWarranty = Math.round(rawWarranty);
        } else if (rawWarranty) {
            const parsed = parseInt(String(rawWarranty).replace(/[^0-9]/g, ''), 10);
            cleanWarranty = isNaN(parsed) ? 0 : parsed;
        }

        return {
            product_id: parseInt(item.product_id, 10) || 0,
            quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
            cost_price: costPrice,
            final_cost: money(item.final_cost || costPrice),
            sale_price: salePrice,
            margin_type: item.margin_type || 'percentage',
            margin_value: money(item.margin_value),
            final_sale_price: finalSale,
            line_total: costPrice * quantity,
            expected_date: item.expected_date,
            warranty_months: cleanWarranty,
            sort_order: index + 1,
            serials: Array.isArray(item.serials) ? item.serials.filter(Boolean) : [],
        };
    });

    const allPayloadSerials = [];
    for (const item of normalizedItems) {
        if (Array.isArray(item.serials)) {
            for (const s of item.serials) {
                const trimmed = String(s || '').trim();
                if (trimmed) {
                    const lower = trimmed.toLowerCase();
                    if (allPayloadSerials.includes(lower)) {
                        throw Object.assign(
                            new Error(`Duplicate serial/barcode "${trimmed}" found within this purchase order submission`),
                            { status: 400 }
                        );
                    }
                    allPayloadSerials.push(lower);
                }
            }
        }
    }

    if (allPayloadSerials.length > 0) {
        const existingSerialsRes = await client.query(
            `SELECT pos.serial_code, po.po_number, p.name AS product_name
             FROM purchase_order_serials pos
             JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
             JOIN purchase_orders po ON po.id = poi.purchase_order_id
             JOIN products p ON p.id = poi.product_id
             WHERE LOWER(TRIM(pos.serial_code)) = ANY($1)
               AND po.deleted_at IS NULL
             LIMIT 5`,
            [allPayloadSerials]
        );
        if (existingSerialsRes.rows.length > 0) {
            const duplicates = existingSerialsRes.rows
                .map(r => `"${r.serial_code}" (in PO ${r.po_number || 'N/A'}, Product: ${r.product_name || 'N/A'})`)
                .join(', ');
            throw Object.assign(
                new Error(`The following serial(s)/barcode(s) already exist in Inventory: ${duplicates}`),
                { status: 400 }
            );
        }
    }

    return {
        normalizedItems,
        itemsCost,
        totalSale,
        unitCount,
    };
}

module.exports = {
    validateOrderPayload,
    normalizeOrderItemsAndSerials,
};
