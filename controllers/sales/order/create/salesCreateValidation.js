const {
    money,
    normalizeAndValidateItems,
    validateAvailableStockAndSerials,
} = require('../../salesHelpers');

/**
 * Validates basic request payload for sale creation.
 */
function validateCreatePayload({ customer_id, items }) {
    if (!customer_id) {
        const err = new Error('Please select or provide a customer');
        err.status = 400;
        throw err;
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
        const err = new Error('Please add at least one product item');
        err.status = 400;
        throw err;
    }
}

/**
 * Normalizes item properties, enforces serial tracking rules, and verifies inventory stock.
 */
async function prepareAndValidateItems(client, items) {
    const { normalizedItems, calculatedSubtotal, missingItem: missing } = await normalizeAndValidateItems(items, client);
    if (missing) {
        const err = new Error(`"${missing.name || 'Product'}" is serial/barcode-tracked — attach at least one barcode/serial before saving.`);
        err.status = 400;
        throw err;
    }

    // RULE 1: Strict available stock & serial database verification
    await validateAvailableStockAndSerials(client, normalizedItems);

    // Validate selling price after discount >= purchase cost
    const productIds = [...new Set(normalizedItems.map((it) => Number(it.product_id)).filter(Boolean))];
    const pMap = new Map();
    if (productIds.length > 0) {
        const pRes = await client.query(
            'SELECT id, name, COALESCE(purchase_price, 0) AS purchase_price, conversion_rate, unit_name, sub_unit_name FROM products WHERE id = ANY($1::int[])',
            [productIds]
        ).catch(() => ({ rows: [] }));
        for (const r of pRes.rows) {
            pMap.set(Number(r.id), {
                name: r.name,
                purchase_price: Number(r.purchase_price || 0),
                conversion_rate: Number(r.conversion_rate || 1),
                unit_name: r.unit_name,
                sub_unit_name: r.sub_unit_name,
            });
        }
    }

    for (const item of normalizedItems) {
        const prod = pMap.get(Number(item.product_id));
        let costPrice = Number(item.cost_price || prod?.purchase_price || 0);
        const convRate = Number(item.conversion_rate || prod?.conversion_rate || 1);
        const isSubUnit = item.unit_type === 'sub_unit' || (prod?.sub_unit_name && item.unit_name === prod?.sub_unit_name);
        if (convRate > 1 && (isSubUnit || costPrice > Number(item.unit_price || 0) * 2)) {
            costPrice = Number((costPrice / convRate).toFixed(2));
        }

        const unitPrice = Number(item.unit_price || 0);
        const qty = Number(item.quantity || 1);
        const itDiscount = Number(item.discount || 0);
        const lineTotal = unitPrice * qty - itDiscount;
        const lineCost = costPrice * qty;

        if (costPrice > 0 && lineTotal < lineCost) {
            const itemName = item.name || item.product_name || prod?.name || 'Product';
            const err = new Error(
                `আইটেম "${itemName}"-এ ডিসকাউন্ট দেয়ার পর বিক্রয়মূল্য (৳ ${lineTotal.toLocaleString()}) পারচেজ কস্ট (৳ ${lineCost.toLocaleString()}) এর চেয়ে কম হতে পারবে না।`
            );
            err.status = 400;
            throw err;
        }
    }

    return { normalizedItems, calculatedSubtotal };
}

/**
 * Computes financial totals, loyalty points discount, tender amounts, and customer due.
 */
async function calculateSaleFinances(client, body, calculatedSubtotal) {
    const {
        customer_id,
        subtotal: rawSubtotal,
        discount: rawDiscount = 0,
        vat: rawVat = 0,
        setup_charge: rawSetupCharge = 0,
        extra_cost: rawExtraCost = 0,
        payment_tenders = [],
        payment_details = [],
        loyalty_points_to_use = 0,
        previous_due: rawPreviousDue,
    } = body;

    const subtotal = rawSubtotal !== undefined ? money(rawSubtotal) : calculatedSubtotal;
    const discount = money(rawDiscount);
    const vat = money(rawVat);
    const setupCharge = money(rawSetupCharge);
    const extraCost = money(rawExtraCost);

    // Loyalty points discount calculation (if applicable)
    let discountFromLoyalty = 0;
    if (loyalty_points_to_use && loyalty_points_to_use > 0) {
        const custRes = await client.query('SELECT loyalty_points FROM customers WHERE id = $1', [customer_id]);
        const currentPoints = money(custRes.rows[0]?.loyalty_points || 0);
        if (currentPoints < loyalty_points_to_use) {
            throw new Error(`Insufficient loyalty points! Available: ${currentPoints}`);
        }
        discountFromLoyalty = loyalty_points_to_use;
        await client.query(
            'UPDATE customers SET loyalty_points = loyalty_points - $1 WHERE id = $2',
            [loyalty_points_to_use, customer_id]
        );
    }

    const totalAmount = Math.max(0, subtotal - discount - discountFromLoyalty + vat + setupCharge + extraCost);

    const tenders = Array.isArray(payment_tenders) && payment_tenders.length > 0
        ? payment_tenders
        : (Array.isArray(payment_details) && payment_details.length > 0
            ? payment_details.map((t) => ({
                payment_mode: t.method || 'Cash',
                method: t.method || 'Cash',
                account_name: t.account_name || null,
                reference_no: t.reference_no || null,
                amount: t.amount || 0,
              }))
            : []);

    let totalPaid = 0;
    for (const tender of tenders) {
        totalPaid += money(tender.amount || 0);
    }

    const totalDue = tenders.length === 0 ? totalAmount : Math.max(0, totalAmount - totalPaid);
    const paymentStatus = totalDue === 0 ? 'paid' : (totalPaid > 0 ? 'partial' : 'unpaid');
    const pointsEarned = Math.floor(totalPaid / 100);

    const prevDueRes = await client.query(
        'SELECT COALESCE(receivable_balance, 0) AS prev_due FROM customers WHERE id = $1',
        [Number(customer_id)]
    );
    const previousDue = money(rawPreviousDue !== undefined ? rawPreviousDue : prevDueRes.rows[0]?.prev_due);

    return {
        subtotal,
        discount,
        discountFromLoyalty,
        vat,
        setupCharge,
        extraCost,
        totalAmount,
        tenders,
        totalPaid,
        totalDue,
        paymentStatus,
        pointsEarned,
        previousDue,
    };
}

/**
 * Generates date-stamped sequential invoice number.
 */
async function generateInvoiceNo(client) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seqRes = await client.query("SELECT nextval('sales_invoice_no_seq') AS seq").catch(() => ({ rows: [] }));
    const seqVal = seqRes.rows?.[0]?.seq || Math.floor(1000 + Math.random() * 9000);
    return `INV-${dateStr}-${String(seqVal).padStart(4, '0').slice(-4)}`;
}

module.exports = {
    validateCreatePayload,
    prepareAndValidateItems,
    calculateSaleFinances,
    generateInvoiceNo,
};
