const pool = require('../../../config/db');
const { ensureWalletSchema } = require('../../walletController');
const {
    ensureSalesColumns,
    validateSaleDeletable,
    reverseSaleFinancials,
} = require('../salesHelpers');

/**
 * Handles soft deletion of a sale invoice with validation, stock restoration, and financial reversal.
 */
const deleteSale = async (req, res) => {
    await ensureSalesColumns();
    await ensureWalletSchema();
    const client = await pool.connect();
    try {
        const { id } = req.params;
        await client.query('BEGIN');

        const sRes = await client.query('SELECT * FROM sales WHERE id = $1', [id]);
        if (sRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Sale record not found' });
        }
        const sale = sRes.rows[0];

        const adminPin = req.body?.admin_pin || req.headers?.['x-admin-pin'] || req.query?.admin_pin;
        let allowOverride = false;
        if (adminPin) {
            const pinRes = await client.query('SELECT security_pin FROM shop_settings WHERE id = 1').catch(() => ({ rows: [] }));
            const configuredPin = String(pinRes.rows[0]?.security_pin || '1234');
            if (String(adminPin).trim() === configuredPin) {
                allowOverride = true;
            }
        }

        const blocked = await validateSaleDeletable(sale, id, client, { allowOverride });
        if (blocked) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: blocked });
        }

        await reverseSaleFinancials(sale, id, client);

        await client.query('UPDATE sales SET deleted_at = NOW() WHERE id = $1', [id]);
        await client.query(`
            INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
            VALUES ('sales', $1, $2, $3, NOW())
        `, [id, `Invoice #${sale.invoice_no || id}`, JSON.stringify(sale)]).catch(() => null);

        await client.query('COMMIT');
        return res.status(200).json({ success: true, message: `Sale Invoice #${sale.invoice_no || id} moved to Trash successfully!` });
    } catch (error) {
        await client.query('ROLLBACK').catch(() => null);
        console.error('Delete sale error:', error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

module.exports = {
    deleteSale,
};
