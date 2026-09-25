const pool = require('../../config/db');
const {
    money,
    ensureSalesColumns,
    formatProductFullName,
    normalizeSaleItems,
    validateSerialTracking,
    getDrawerAccountId,
    depositToDrawer,
    reverseCashFromDrawer,
} = require('./salesHelpers');

// ==========================================================
// SALE EXCHANGE
// ==========================================================

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

        // 1. Process Returned Items: Restock inventory & record return
        let returnSubtotal = 0;
        for (const ret of returned_items) {
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
                ).catch(() => null);
            }

            // Insert into product_returns
            await client.query(
                `INSERT INTO product_returns (
                    invoice_no, customer_name, customer_phone, product_id, product_name,
                    serial_code, return_qty, return_type, refund_amount, condition, return_reason, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
                [
                    original_invoice_no || 'EXCHANGE',
                    ret.customer_name || 'Customer',
                    ret.customer_phone || '',
                    ret.product_id || null,
                    ret.product_name || ret.name || 'Returned Item',
                    Array.isArray(ret.serials) ? ret.serials.join(', ') : (ret.serial_code || null),
                    retQty,
                    'Exchange',
                    retQty * retPrice,
                    ret.condition || 'Good',
                    ret.reason || notes || 'Exchange item return'
                ]
            ).catch(() => null);
        }

        // 2. Process New Items: Validate stock, serials, and deduct stock
        const { normalizedItems, calculatedSubtotal } = normalizeSaleItems(new_items);
        const missingSerial = await validateSerialTracking(client, normalizedItems);
        if (missingSerial) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: `"${missingSerial.full_name || missingSerial.name || 'Product'}" is serial-tracked — attach at least one serial number.`
            });
        }

        // 3. Financial calculations for Exchange
        const newSubtotal = calculatedSubtotal;
        const totalVat = money(vat);
        const totalDiscount = money(discount);
        const totalSetup = money(setup_charge);
        const totalExtra = money(extra_cost);
        const newGrossTotal = newSubtotal + totalVat + totalSetup + totalExtra - totalDiscount;

        const netDifference = newGrossTotal - returnSubtotal;
        const totalPaid = money(paid_amount);

        const nextValRes = await client.query("SELECT nextval('sales_invoice_no_seq') AS next_val");
        const seqVal = nextValRes.rows[0].next_val;
        const invoiceNo = `INV-EXC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(seqVal).padStart(4, '0')}`;

        const invoiceDue = Math.max(0, netDifference - totalPaid);

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

        for (const item of normalizedItems) {
            const prodRes = await client.query(
                `SELECT p.*, b.name as brand_name, m.name as model_name, s.name as series_name
                 FROM products p
                 LEFT JOIN brands b ON b.id = p.brand_id
                 LEFT JOIN models m ON m.id = p.model_id
                 LEFT JOIN series s ON s.id = p.series_id
                 WHERE p.id = $1`,
                [item.product_id]
            );
            const catalogProduct = prodRes.rows[0];
            const fullName = formatProductFullName(catalogProduct) || item.name || 'Product';
            const warrantyMonths = item.warranty_months !== undefined ? Number(item.warranty_months) : (catalogProduct?.warranty_months || 0);

            const expireDate = new Date();
            expireDate.setMonth(expireDate.getMonth() + Number(warrantyMonths || 0));

            const savedItem = await client.query(
                `INSERT INTO sales_items (
                    sale_id, product_id, product_name, quantity, unit_price, cost_price,
                    total_price, warranty_expires_at, warranty_months
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
                [
                    saleId,
                    item.product_id,
                    fullName,
                    item.quantity,
                    item.unit_price,
                    item.cost_price,
                    item.line_total,
                    expireDate,
                    warrantyMonths,
                ]
            );

            if (item.serials && item.serials.length > 0) {
                for (const serial of item.serials) {
                    await client.query(
                        'INSERT INTO sales_item_serials (sales_item_id, serial_code) VALUES ($1, $2)',
                        [savedItem.rows[0].id, String(serial).trim()]
                    );
                }
            }

            await client.query(
                `UPDATE products
                 SET stock = GREATEST(0, COALESCE(stock, 0) - $1),
                     updated_at = NOW()
                 WHERE id = $2`,
                [item.quantity, item.product_id]
            );
            await client.query(
                `UPDATE stock_levels
                 SET quantity = GREATEST(0, quantity - $1)
                 WHERE product_id = $2 AND warehouse_id = 1`,
                [item.quantity, item.product_id]
            ).catch(() => null);
        }

        if (netDifference > 0) {
            if (invoiceDue > 0) {
                await client.query(
                    `UPDATE customers SET receivable_balance = COALESCE(receivable_balance, 0) + $1, updated_at = NOW() WHERE id = $2`,
                    [invoiceDue, customer_id]
                );
            }
        } else if (netDifference < 0) {
            const excessCredit = Math.abs(netDifference);
            if (totalPaid > 0) {
                const drawerId = await getDrawerAccountId(client);
                await reverseCashFromDrawer(client, {
                    drawerId,
                    amount: totalPaid,
                    reference: invoiceNo,
                    note: `Exchange refund paid to customer for invoice #${invoiceNo}`
                });
            } else {
                await client.query(
                    `UPDATE customers 
                     SET receivable_balance = GREATEST(0, COALESCE(receivable_balance, 0) - $1),
                         wallet_balance = COALESCE(wallet_balance, 0) + CASE WHEN COALESCE(receivable_balance, 0) < $1 THEN $1 - COALESCE(receivable_balance, 0) ELSE 0 END,
                         updated_at = NOW() 
                     WHERE id = $2`,
                    [excessCredit, customer_id]
                );
            }
        }

        if (totalPaid > 0 && netDifference > 0) {
            const drawerId = await getDrawerAccountId(client);
            await depositToDrawer(client, {
                drawerId,
                amount: totalPaid,
                reference: invoiceNo,
                note: `Exchange price difference payment for invoice #${invoiceNo}`
            });
        }

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
        return res.status(500).json({ success: false, message: error.message || 'Failed to process exchange' });
    } finally {
        client.release();
    }
};
