const pool = require('../../../config/db');
const { ensureWalletSchema } = require('../../walletController');
const { ensureSalesColumns } = require('../salesHelpers');
const { validateSaleUpdatePolicy } = require('./update/salesUpdateValidation');
const { syncSaleInventoryAndItems } = require('./update/salesUpdateInventory');
const { settleSaleFinanceAndTenders } = require('./update/salesUpdateFinance');

/**
 * Updates an existing sale invoice with validation, stock/serial rollback, and financial re-settlement.
 * Orchestrates policy validation, inventory synchronizer, and financial settlement sub-modules.
 */
const updateSale = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const sRes = await client.query('SELECT * FROM sales WHERE id = $1', [id]);
        if (!sRes.rows.length) {
            client.release();
            return res.status(404).json({ success: false, message: 'Sale invoice not found' });
        }
        const sale = sRes.rows[0];

        // 1. Validate administrative policy, shifts, PIN, warranty/returns, linked projects
        const { projectRes } = await validateSaleUpdatePolicy(client, sale, id, req);

        const {
            customer_id = sale.customer_id,
            items,
            subtotal: rawSubtotal = sale.subtotal,
            discount: rawDiscount = 0,
            vat: rawVat = 0,
            setup_charge: rawSetupCharge = 0,
            extra_cost: rawExtraCost = 0,
            extra_cost_category = sale.extra_cost_category ?? null,
            extra_cost_notes = sale.extra_cost_notes ?? null,
            paid_amount: rawPaid = sale.paid_amount,
            payment_method_id = 1,
            payment_details = sale.payment_details || [],
            loyalty_points_to_use = 0,
            sales_person = sale.sales_person ?? null,
            destination = sale.destination ?? null,
            attention = sale.attention ?? null,
            invoice_date = sale.invoice_date ?? null,
            notes = sale.notes ?? '',
        } = req.body;

        if (!customer_id) {
            client.release();
            return res.status(400).json({ success: false, message: 'Please select or provide a customer' });
        }

        const itemsList = Array.isArray(items) && items.length > 0
            ? items
            : (await client.query(`
                SELECT si.*, 
                       COALESCE((
                           SELECT array_agg(sis.serial_code) 
                           FROM sales_item_serials sis 
                           WHERE sis.sales_item_id = si.id
                       ), ARRAY[]::varchar[]) AS serials
                FROM sales_items si 
                WHERE si.sale_id = $1
            `, [id])).rows;

        await ensureSalesColumns(client);
        await ensureWalletSchema(client);
        await client.query('BEGIN');

        const oldItemsRes = await client.query('SELECT * FROM sales_items WHERE sale_id = $1', [id]);
        const oldItems = oldItemsRes.rows;

        // 2. Synchronize inventory, validation, and sales items
        const { subtotal } = await syncSaleInventoryAndItems(client, {
            id,
            oldItems,
            itemsList,
            rawSubtotal,
        });

        // 3. Settle finance, loyalty, tenders, and update database
        const { totalAmount, totalPaid, totalDue, paymentStatus } = await settleSaleFinanceAndTenders(client, {
            sale,
            id,
            customer_id,
            subtotal,
            rawDiscount,
            rawVat,
            rawSetupCharge,
            rawExtraCost,
            extra_cost_category,
            extra_cost_notes,
            rawPaid,
            payment_method_id,
            payment_details,
            loyalty_points_to_use,
            sales_person,
            destination,
            attention,
            invoice_date,
            notes,
            projectRes,
            itemsList,
            paymentTendersFromReq: req.body.payment_tenders,
        });

        await client.query('COMMIT');
        client.release();

        return res.status(200).json({
            success: true,
            message: `Sale Invoice #${sale.invoice_no || id} updated successfully!`,
            data: {
                ...sale,
                total_amount: totalAmount,
                paid_amount: totalPaid,
                due_amount: totalDue,
                payment_status: paymentStatus,
            },
        });
    } catch (error) {
        await client.query('ROLLBACK').catch(() => null);
        client.release();
        console.error('Update sale error:', error);
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Failed to update sale',
            error: error.message,
        });
    }
};

module.exports = {
    updateSale,
};
