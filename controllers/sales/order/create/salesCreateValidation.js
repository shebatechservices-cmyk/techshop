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
