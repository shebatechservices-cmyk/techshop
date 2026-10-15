const { money } = require('../salesHelpers');

/**
 * Process returned items: updates product inventory and records audit rows in product_returns.
 *
 * @param {import('pg').PoolClient} client
 * @param {Object} params
 * @param {Array} params.returnedItems
 * @param {number|string} params.customerId
 * @param {string} params.customerName
 * @param {string} params.customerPhone
 * @param {string} params.originalInvoiceNo
 * @param {string} params.notes
 * @param {number} params.newItemsCount
 * @returns {Promise<{ returnSubtotal: number }>}
 */
async function processReturnedItems(client, {
    returnedItems = [],
    customerId,
    customerName = 'Customer',
    customerPhone = '',
    originalInvoiceNo = 'EXCHANGE',
    notes = '',
    newItemsCount = 0,
}) {
    let returnSubtotal = 0;

    for (const ret of returnedItems) {
        const retQty = Math.max(1, Number(ret.quantity || 1));
        const retPrice = money(ret.unit_price || ret.price);
        returnSubtotal += (retQty * retPrice);

        // If condition is 'Good' or not specified, restock product
        if (ret.condition !== 'Damaged' && ret.product_id) {
            await client.query(
                `UPDATE products 
                 SET stock = COALESCE(stock, 0) + $1, updated_at = NOW() 
                 WHERE id = $2`,
                [retQty, ret.product_id]
            );
            await client.query(
                `UPDATE stock_levels 
                 SET quantity = quantity + $1 
                 WHERE product_id = $2 AND warehouse_id = 1`,
                [retQty, ret.product_id]
            );
        }

        // Insert into product_returns with generated return_no
        const returnNo = 'RET-' + new Date().getFullYear() + '-' + String(Math.floor(100000 + Math.random() * 900000));
        await client.query(
            `INSERT INTO product_returns (
                return_no, order_source, invoice_no, customer_id, customer_name, customer_phone,
                product_id, product_name, serial_code, return_qty, return_type, refund_amount,
                condition, return_reason, return_date, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
            [
                returnNo,
                'offline',
                originalInvoiceNo || 'EXCHANGE',
                customerId,
                customerName,
                customerPhone,
                ret.product_id || null,
                ret.product_name || ret.name || 'Returned Item',
                Array.isArray(ret.serials) ? ret.serials.join(', ') : (ret.serial_code || null),
                retQty,
                newItemsCount > 0 ? 'Exchange' : 'Refund',
                retQty * retPrice,
                ret.condition || 'Good',
                ret.reason || notes || 'Exchange item return'
            ]
        );
    }

    return { returnSubtotal };
}

module.exports = {
    processReturnedItems,
};
