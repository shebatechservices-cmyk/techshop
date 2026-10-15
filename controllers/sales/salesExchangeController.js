const pool = require('../../config/db');
const { money, ensureSalesColumns } = require('./salesHelpers');
const { processReturnedItems } = require('./exchange/exchangeReturnProcessor');
const { validateReplacementItems, insertReplacementItems } = require('./exchange/exchangeReplacementProcessor');
const { generateExchangeInvoiceNumber, processExchangeSettlement } = require('./exchange/exchangeSettlementProcessor');

/**
 * Sales Exchange Controller
 * Orchestrates product return restocking, replacement item validation and ledger settlement.
 */
exports.createExchangeSale = async (req, res) => {
    const client = await pool.connect();
    try {
        await ensureSalesColumns();
        const {
            original_sale_id,
            original_invoice_no,
            customer_id,
            returned_items = [],
            new_items = [],
            discount = 0,
            vat = 0,
            setup_charge = 0,
            extra_cost = 0,
            paid_amount = 0,
            payment_method_id = 1,
            payment_details = [],
            sales_person = null,
            notes = '',
        } = req.body;

        if (!customer_id) {
            client.release();
            return res.status(400).json({ success: false, message: 'Customer is required for exchange' });
        }
        if (!returned_items.length && !new_items.length) {
            client.release();
            return res.status(400).json({ success: false, message: 'Please specify items to return and/or replacement items' });
        }

        await client.query('BEGIN');

        // Customer details lookup for audit logging
        const custRes = await client.query('SELECT name, phone FROM customers WHERE id = $1', [customer_id]);
        const customer = custRes.rows[0] || {};
        const customerName = customer.name || 'Customer';
        const customerPhone = customer.phone || '';

        // 1. Process Returned Items: Restock inventory & record return audit rows
        const { returnSubtotal } = await processReturnedItems(client, {
            returnedItems: returned_items,
            customerId: customer_id,
            customerName,
            customerPhone,
            originalInvoiceNo: original_invoice_no,
            notes,
            newItemsCount: new_items.length,
        });

        // 2. Validate Replacement Items: Check serial-tracking & inventory availability
        const { normalizedItems, calculatedSubtotal } = await validateReplacementItems(client, new_items);

        // 3. Compute Financial Totals & Differences
        const newSubtotal = calculatedSubtotal;
        const totalVat = money(vat);
        const totalDiscount = money(discount);
        const totalSetup = money(setup_charge);
        const totalExtra = money(extra_cost);
        const newGrossTotal = newSubtotal + totalVat + totalSetup + totalExtra - totalDiscount;

        const netDifference = newGrossTotal - returnSubtotal;
        const totalPaid = money(paid_amount);
        const invoiceDue = Math.max(0, netDifference - totalPaid);

        const invoiceNo = await generateExchangeInvoiceNumber(client);

        // 4. Record Exchange Sale Header
        const saleInsertQuery = `
            INSERT INTO sales (
                invoice_no, customer_id, total_amount, subtotal, discount, vat, setup_charge, extra_cost,
                paid_amount, due_amount, payment_method_id, payment_details, sales_person, notes,
                exchange_from_invoice_no, original_sale_id, exchange_details, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
            RETURNING *;
        `;

        const saleResult = await client.query(saleInsertQuery, [
            invoiceNo,
            customer_id,
            newGrossTotal,
            newSubtotal,
            totalDiscount,
            totalVat,
            totalSetup,
            totalExtra,
            totalPaid,
            invoiceDue,
            payment_method_id || 1,
            JSON.stringify(payment_details || []),
            sales_person || null,
            notes || `Exchange from ${original_invoice_no || '#' + original_sale_id}`,
            original_invoice_no || null,
            original_sale_id ? Number(original_sale_id) : null,
            JSON.stringify({
                returned_items,
                return_subtotal: returnSubtotal,
                new_subtotal: newSubtotal,
                net_difference: netDifference,
            }),
        ]);

        const saleId = saleResult.rows[0].id;

        // 5. Insert Replacement Items & Deduct Inventory
        await insertReplacementItems(client, { saleId, normalizedItems });

        // 6. Settle Customer Balances & Cash Drawer
        await processExchangeSettlement(client, {
            originalSaleId: original_sale_id ? Number(original_sale_id) : null,
            returnSubtotal,
            newSubtotal,
            netDifference,
            totalPaid,
            invoiceDue,
            customerId: customer_id,
            invoiceNo,
        });

        await client.query('COMMIT');

        return res.status(201).json({
            success: true,
            message: `Exchange Invoice #${invoiceNo} created successfully!`,
            data: {
                ...saleResult.rows[0],
                items: normalizedItems,
                returned_items,
            },
            invoice_no: invoiceNo,
            net_difference: netDifference,
        });

    } catch (error) {
        await client.query('ROLLBACK').catch(() => null);
        console.error('Create exchange sale error:', error);
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Failed to process exchange',
            error: error.message,
        });
    } finally {
        client.release();
    }
};
