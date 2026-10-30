/**
 * Reconciles serial codes for a purchase order item.
 * Syncs sold serials if serial numbers have changed, removes deleted serials,
 * and inserts updated serials.
 */
async function reconcileItemSerials(client, poiId, serials) {
    if (!Array.isArray(serials)) return;

    const existingSerialsRows = await client.query(
        'SELECT id, serial_code FROM purchase_order_serials WHERE purchase_order_item_id = $1 ORDER BY id ASC',
        [poiId]
    );
    const oldSerialsList = existingSerialsRows.rows
        .map((r) => String(r.serial_code || '').trim())
        .filter(Boolean);
    const newSerialsList = serials
        .map((s) => String(s || '').trim())
        .filter(Boolean);

    for (let i = 0; i < oldSerialsList.length; i++) {
        const oldCode = oldSerialsList[i];
        const newCode = newSerialsList[i];

        if (oldCode && newCode && oldCode.toLowerCase() !== newCode.toLowerCase()) {
            const soldCheck = await client.query(
                `SELECT sis.id, sis.serial_code, s.invoice_no 
                 FROM sales_item_serials sis
                 JOIN sales_items si ON si.id = sis.sales_item_id
                 JOIN sales s ON s.id = si.sale_id
                 WHERE LOWER(TRIM(sis.serial_code)) = LOWER(TRIM($1))
                   AND s.deleted_at IS NULL`,
                [oldCode]
            );

            if (soldCheck.rows.length > 0) {
                await client.query(
                    `UPDATE sales_item_serials 
                     SET serial_code = $1 
                     WHERE LOWER(TRIM(serial_code)) = LOWER(TRIM($2))`,
                    [newCode, oldCode]
                );
            }
        }
    }

    await client.query(
        'DELETE FROM purchase_order_serials WHERE purchase_order_item_id = $1',
        [poiId]
    );

    for (const s of serials) {
        const trimmed = String(s || '').trim();
        if (trimmed) {
            await client.query(
                'INSERT INTO purchase_order_serials (purchase_order_item_id, serial_code) VALUES ($1, $2)',
                [poiId, trimmed]
            );
        }
    }
}

module.exports = {
    reconcileItemSerials,
};
