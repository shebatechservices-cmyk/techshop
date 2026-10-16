const pool = require('../../../config/db');
const { ensureWalletSchema } = require('../../walletController');
const { ensureSalesColumns } = require('../salesHelpers');
const {
    validateCreatePayload,
    prepareAndValidateItems,
    calculateSaleFinances,
    generateInvoiceNo,
} = require('./create/salesCreateValidation');
const { insertSaleItemsAndDeductStock } = require('./create/salesCreateItems');
const { settleSalePaymentsAndBalances } = require('./create/salesCreateSettlement');

/**
 * Creates a new sale invoice with validation, stock deduction, and payment settlement.
 */
const createSale = async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            customer_id,
            items = [],
            extra_cost_category = null,
            extra_cost_notes = null,
            payment_tenders = [],
            payment_details = [],
            payment_method_id = 1,
            loyalty_points_to_use = 0,
            sales_person = null,
            destination = null,
            attention = null,
            invoice_date = null,
        } = req.body;

        validateCreatePayload({ customer_id, items });

        await client.query('BEGIN');
        await ensureSalesColumns();
        await ensureWalletSchema();

        // 1. Validate items, stock, and serial numbers
        const { normalizedItems, calculatedSubtotal } = await prepareAndValidateItems(client, items);

        // 2. Compute financial amounts, discounts, loyalty points, and tenders
        const finances = await calculateSaleFinances(client, req.body, calculatedSubtotal);

        // 3. Generate invoice number and insert sale header
        let invoiceNo = await generateInvoiceNo(client);
        const insertSaleQuery = `
            INSERT INTO sales (
                invoice_no, customer_id, subtotal, discount, vat, setup_charge,
                extra_cost, extra_cost_category, extra_cost_notes,
                total_amount,
                paid_amount, due_amount, payment_status, payment_details,
                loyalty_points_earned, loyalty_points_used, payment_method_id,
                sales_person, destination, attention, invoice_date, previous_due,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, COALESCE($21::date, CURRENT_DATE), $22, NOW())
            RETURNING *;
        `;

        let saleResult = null;
        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                saleResult = await client.query(insertSaleQuery, [
                    invoiceNo,
                    Number(customer_id),
                    finances.subtotal,
                    finances.discount + finances.discountFromLoyalty,
                    finances.vat,
                    finances.setupCharge,
                    finances.extraCost,
                    extra_cost_category || null,
                    extra_cost_notes || null,
                    finances.totalAmount,
                    finances.totalPaid,
                    finances.totalDue,
                    finances.paymentStatus,
                    JSON.stringify(payment_tenders.length > 0 ? payment_tenders : payment_details),
                    finances.pointsEarned,
                    loyalty_points_to_use || 0,
                    payment_method_id,
                    sales_person,
                    destination,
                    attention,
                    invoice_date,
                    finances.previousDue,
                ]);
                break;
            } catch (insertErr) {
                const isInvoiceCollision = insertErr
                    && insertErr.code === '23505'
                    && String(insertErr.detail || insertErr.message || '').includes('invoice_no');
                if (!isInvoiceCollision || attempt === 2) throw insertErr;
                invoiceNo = await generateInvoiceNo(client);
            }
        }
        const saleId = saleResult.rows[0].id;

        // 4. Insert items, serials and deduct inventory stock
        await insertSaleItemsAndDeductStock(client, { saleId, normalizedItems });

        // 5. Update balances, loyalty points, and journalize ledger transactions
        await settleSalePaymentsAndBalances(client, {
            customer_id: Number(customer_id),
            saleId,
            invoiceNo,
            tenders: finances.tenders,
            totalPaid: finances.totalPaid,
            totalDue: finances.totalDue,
            pointsEarned: finances.pointsEarned,
        });

        await client.query('COMMIT');
        return res.status(201).json({
            success: true,
            message: `Sale Invoice #${invoiceNo} created successfully!`,
            data: {
                ...saleResult.rows[0],
                items: normalizedItems,
            },
            invoice_no: invoiceNo,
        });
    } catch (error) {
        await client.query('ROLLBACK').catch(() => null);
        console.error('Create sale error:', error);
        return res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to create sale', error: error.message });
    } finally {
        client.release();
    }
};

module.exports = {
    createSale,
};
