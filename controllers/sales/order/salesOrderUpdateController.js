const pool = require('../../../config/db');
const { ensureWalletSchema, drawerLedgerOnly } = require('../../walletController');
const {
    money,
    ensureSalesColumns,
    normalizeAndValidateItems,
    validateAvailableStockAndSerials,
    applySaleTender,
    reverseSaleTender,
} = require('../salesHelpers');

/**
 * Updates an existing sale invoice with validation, stock/serial rollback, and financial re-settlement.
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

        const settingsRes = await client.query(
            'SELECT allow_invoice_modification, invoice_edit_time_limit_hours, security_pin FROM shop_settings WHERE id = 1'
        ).catch(() => ({ rows: [] }));
        const shopSettings = settingsRes.rows[0] || {};
        const allowMod = shopSettings.allow_invoice_modification !== false;
        const editLimitHours = shopSettings.invoice_edit_time_limit_hours ?? 360;
        const configuredPin = String(shopSettings.security_pin || '1234');

        const adminPin = req.body?.admin_pin || req.headers?.['x-admin-pin'];
        const isPinValid = adminPin && String(adminPin).trim() === configuredPin;

        const createdAt = new Date(sale.created_at || Date.now());
        const shiftRes = await client.query(`
            SELECT 1 FROM register_shifts 
            WHERE status = 'closed' AND $1 <= closed_at AND (opened_at IS NULL OR $1 >= opened_at) 
            LIMIT 1
        `, [createdAt]).catch(() => ({ rows: [] }));
        const isShiftClosed = shiftRes.rows.length > 0;

        const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        const isTimeExpired = hoursOld > editLimitHours;

        if (!allowMod || isTimeExpired || isShiftClosed) {
            if (!isPinValid) {
                client.release();
                const reason = !allowMod
                    ? 'Invoice editing is currently disabled by administrative policy.'
                    : isShiftClosed
                        ? 'Cannot edit sale: The register shift for this invoice has already been closed and locked.'
                        : `Cannot edit sale: Invoice #${sale.invoice_no || id} was created ${Math.floor(hoursOld / 24)} days ago. Edits are only permitted within ${Math.floor(editLimitHours / 24)} days (${editLimitHours} hours) of creation.`;
                return res.status(400).json({
                    success: false,
                    message: reason
                });
            }
        }

        if (sale.invoice_no) {
            const warrantyRes = await client.query(
                'SELECT 1 FROM warranty_claims WHERE invoice_no = $1 AND deleted_at IS NULL LIMIT 1',
                [sale.invoice_no]
            ).catch(() => ({ rows: [] }));
            if (warrantyRes.rows.length > 0) {
                client.release();
                return res.status(400).json({ success: false, message: 'Cannot edit this sale invoice because warranty claims are attached to it.' });
            }

            const returnRes = await client.query(
                'SELECT 1 FROM product_returns WHERE invoice_no = $1 AND deleted_at IS NULL LIMIT 1',
                [sale.invoice_no]
            ).catch(() => ({ rows: [] }));
            if (returnRes.rows.length > 0) {
                client.release();
                return res.status(400).json({ success: false, message: 'Cannot edit this sale invoice because customer returns are attached to it.' });
            }
        }

        const projectRes = await client.query(
            'SELECT 1 FROM service_projects WHERE (invoice_id = $1::int OR invoice_no = $2) AND deleted_at IS NULL LIMIT 1',
            [Number(id) || 0, sale.invoice_no || '']
        ).catch(() => ({ rows: [] }));
        if (projectRes.rows.length > 0) {
            client.release();
            return res.status(400).json({ success: false, message: 'Cannot edit this sale invoice because service projects are attached to it.' });
        }

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
            : (await client.query('SELECT * FROM sales_items WHERE sale_id = $1', [id])).rows.map((si) => ({ ...si, serials: [] }));

        await ensureSalesColumns(client);
        await ensureWalletSchema(client);
        await client.query('BEGIN');

        const oldItemsRes = await client.query('SELECT * FROM sales_items WHERE sale_id = $1', [id]);
        const oldItems = oldItemsRes.rows;

        // 1. Reverse old stock, remove old serials & items
        for (const oldItem of oldItems) {
            await client.query(
                `UPDATE products SET stock = COALESCE(stock, 0) + $1, updated_at = NOW() WHERE id = $2`,
                [Number(oldItem.quantity || 0), oldItem.product_id]
            );
            await client.query(
                `UPDATE stock_levels SET quantity = quantity + $1 WHERE product_id = $2 AND warehouse_id = 1`,
                [Number(oldItem.quantity || 0), oldItem.product_id]
            ).catch(() => null);
        }
        await client.query('DELETE FROM sales_item_serials WHERE sales_item_id IN (SELECT id FROM sales_items WHERE sale_id = $1)', [id]);
        await client.query('DELETE FROM sales_items WHERE sale_id = $1', [id]);

        // 2. Recompute finance
        const { normalizedItems, calculatedSubtotal, missingItem: missing } = await normalizeAndValidateItems(itemsList, client);
        if (missing) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(400).json({
                success: false,
                message: `"${missing.name || 'Product'}" is serial/barcode-tracked — attach at least one barcode/serial before saving.`,
            });
        }

        // RULE 1: Strict available stock & serial database verification
        await validateAvailableStockAndSerials(client, normalizedItems, id);
        const subtotal = rawSubtotal !== undefined ? money(rawSubtotal) : calculatedSubtotal;
        const discount = money(rawDiscount);
        const vat = money(rawVat);
        const setupCharge = money(rawSetupCharge);
        const extraCost = money(rawExtraCost);

        let discountFromLoyalty = 0;
        const loyaltyToUse = Number(loyalty_points_to_use || 0);
        const custLoyaltyRes = await client.query('SELECT loyalty_points FROM customers WHERE id = $1', [Number(customer_id)]);
        const availablePoints = money(custLoyaltyRes.rows[0]?.loyalty_points || 0);
        if (loyaltyToUse > 0) {
            const previouslyUsed = money(sale.loyalty_points_used || 0);
            const needExtra = Math.max(0, loyaltyToUse - previouslyUsed);
            if (availablePoints < needExtra) {
                await client.query('ROLLBACK');
                client.release();
                return res.status(400).json({ success: false, message: `Insufficient loyalty points! Available: ${availablePoints}` });
            }
            await client.query('UPDATE customers SET loyalty_points = COALESCE(loyalty_points, 0) + $1 WHERE id = $2', [previouslyUsed, Number(customer_id)]);
            await client.query('UPDATE customers SET loyalty_points = COALESCE(loyalty_points, 0) - $1 WHERE id = $2', [loyaltyToUse, Number(customer_id)]);
            discountFromLoyalty = loyaltyToUse;
        } else if (money(sale.loyalty_points_used || 0) > 0) {
            await client.query('UPDATE customers SET loyalty_points = COALESCE(loyalty_points, 0) + $1 WHERE id = $2', [money(sale.loyalty_points_used), Number(customer_id)]);
        }

        const totalAmount = Math.max(0, subtotal - discount - discountFromLoyalty + vat + setupCharge + extraCost);
        const totalPaid = money(rawPaid);
        const totalDue = Math.max(0, totalAmount - totalPaid);
        const paymentStatus = totalDue === 0 ? 'paid' : (totalPaid > 0 ? 'partial' : 'unpaid');
        const pointsEarned = Math.floor(totalPaid / 100);
        const oldPointsEarned = money(sale.loyalty_points_earned || 0);

        // 3. Insert new items & serials
        for (const item of normalizedItems) {
            let warrantyMonths = Number(item.warranty_months || 0);
            if (warrantyMonths <= 0 && item.product_id) {
                const pRes = await client.query('SELECT warranty_months FROM products WHERE id = $1', [item.product_id]);
                if (pRes.rows.length > 0) {
                    warrantyMonths = Number(pRes.rows[0].warranty_months || 0);
                }
            }
            const expireDate = warrantyMonths > 0
                ? new Date(Date.now() + warrantyMonths * 30 * 24 * 60 * 60 * 1000)
                : null;
            let itemCostPrice = money(item.cost_price);
            if (Array.isArray(item.serials) && item.serials.length > 0 && item.product_id) {
                const cleanSerials = item.serials.map(s => String(s).trim().toLowerCase()).filter(Boolean);
                if (cleanSerials.length > 0) {
                    const serialCostRes = await client.query(
                        `SELECT COALESCE(poi.final_cost, poi.cost_price) AS batch_cost
                         FROM purchase_order_serials pos
                         JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
                         JOIN purchase_orders po ON po.id = poi.purchase_order_id
                         WHERE poi.product_id = $1
                           AND LOWER(TRIM(pos.serial_code)) = ANY($2)
                           AND po.deleted_at IS NULL`,
                        [item.product_id, cleanSerials]
                    );
                    if (serialCostRes.rows.length > 0) {
                        const totalBatchCost = serialCostRes.rows.reduce((sum, r) => sum + Number(r.batch_cost || 0), 0);
                        itemCostPrice = Number((totalBatchCost / serialCostRes.rows.length).toFixed(2));
                    }
                }
            }

            // If product is a bundle and no explicit cost provided, compute sum of component costs
            if (itemCostPrice <= 0 && item.product_id) {
                const bCostRes = await client.query(
                    `SELECT SUM(bi.quantity * COALESCE(p.purchase_price, 0)) AS total_bundle_cost
                     FROM product_bundle_items bi
                     JOIN products p ON p.id = bi.product_id
                     WHERE bi.bundle_id = $1`,
                    [item.product_id]
                );
                if (bCostRes.rows[0]?.total_bundle_cost > 0) {
                    itemCostPrice = money(bCostRes.rows[0].total_bundle_cost);
                }
            }

            const savedItem = await client.query(
                `INSERT INTO sales_items (sale_id, product_id, quantity, unit_price, cost_price, line_total, warranty_expire_date, warranty_months, unit_name, unit_type, conversion_rate, discount)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
                [
                    Number(id),
                    item.product_id,
                    item.quantity,
                    item.unit_price,
                    itemCostPrice,
                    item.line_total,
                    expireDate,
                    warrantyMonths,
                    item.unit_name || null,
                    item.unit_type || 'base_unit',
                    Number(item.conversion_rate || 1),
                    money(item.discount || 0)
                ]
            );
            for (const serial of item.serials) {
                const trimmed = String(serial).trim();
                if (trimmed) {
                    await client.query('INSERT INTO sales_item_serials (sales_item_id, serial_code) VALUES ($1, $2)', [savedItem.rows[0].id, trimmed]);
                }
            }
            await client.query(
                `UPDATE products SET stock = GREATEST(0, COALESCE(stock, 0) - $1), updated_at = NOW() WHERE id = $2`,
                [item.quantity, item.product_id]
            );
            await client.query(
                `UPDATE stock_levels SET quantity = GREATEST(0, quantity - $1) WHERE product_id = $2 AND warehouse_id = 1`,
                [item.quantity, item.product_id]
            ).catch(() => null);
        }

        // 4. Customer balances
        const oldDue = money(sale.due_amount || 0);
        const dueDelta = totalDue - oldDue;
        if (dueDelta !== 0) {
            await client.query(
                `UPDATE customers SET receivable_balance = GREATEST(0, COALESCE(receivable_balance, 0) + $1) WHERE id = $2`,
                [dueDelta, Number(customer_id)]
            );
        }
        const pointsDelta = pointsEarned - oldPointsEarned;
        if (pointsDelta !== 0) {
            await client.query(
                `UPDATE customers SET loyalty_points = GREATEST(0, COALESCE(loyalty_points, 0) + $1) WHERE id = $2`,
                [pointsDelta, Number(customer_id)]
            );
        }

        // 5. Payment & wallet reversal + new settlement
        let oldTenders = [];
        try {
            oldTenders = Array.isArray(sale.payment_details)
                ? (typeof sale.payment_details === 'string' ? JSON.parse(sale.payment_details) : sale.payment_details)
                : [];
        } catch (e) { oldTenders = []; }

        if (oldTenders.length > 0) {
            for (const t of oldTenders) {
                await reverseSaleTender(client, {
                    customerId: Number(customer_id),
                    invoiceNo: sale.invoice_no,
                    tender: t,
                    ledgerType: 'sale_edit_refund',
                    reasonNote: 'edited',
                });
            }
        } else if (money(sale.paid_amount) > 0) {
            await reverseSaleTender(client, {
                customerId: Number(customer_id),
                invoiceNo: sale.invoice_no,
                tender: { amount: sale.paid_amount, payment_mode: 'Cash' },
                ledgerType: 'sale_edit_refund',
                reasonNote: 'edited',
            });
        }

        const tenderList = Array.isArray(payment_details) && payment_details.length > 0
            ? payment_details.filter((t) => money(t.amount || t.quantity) > 0)
            : (Array.isArray(req.body.payment_tenders) && req.body.payment_tenders.length > 0
                ? req.body.payment_tenders.filter((t) => money(t.amount || t.quantity) > 0)
                : []);

        await client.query('DELETE FROM payments WHERE sale_id = $1', [id]).catch(() => null);

        let walletUsed = 0;
        if (tenderList.length > 0) {
            for (const tender of tenderList) {
                const tenderAmount = money(tender.amount || tender.quantity || 0);
                if (tenderAmount <= 0) continue;
                await client.query(
                    `INSERT INTO payments (sale_id, payment_mode, account_name, reference_no, amount, created_at)
                     VALUES ($1, $2, $3, $4, $5, NOW())`,
                    [
                        id,
                        tender.payment_mode || tender.method || 'Cash',
                        tender.account_name || null,
                        tender.reference_no || null,
                        tenderAmount,
                    ]
                );
                const res = await applySaleTender(client, {
                    customerId: Number(customer_id),
                    invoiceNo: sale.invoice_no,
                    tender,
                    ledgerType: 'sale_payment',
                });
                if (res.type === 'wallet') {
                    walletUsed += res.amount;
                }
            }
        } else if (totalPaid > 0) {
            await applySaleTender(client, {
                customerId: Number(customer_id),
                invoiceNo: sale.invoice_no,
                tender: { amount: totalPaid, payment_mode: 'Cash' },
                ledgerType: 'sale_payment',
            });
            await client.query(
                `INSERT INTO payments (sale_id, payment_mode, account_name, reference_no, amount, created_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                [id, 'Cash', null, null, totalPaid]
            );
        }

        if (walletUsed > 0) {
            await drawerLedgerOnly(client, 'wallet_settlement', walletUsed, sale.invoice_no, `Customer wallet payment for edited sale #${sale.invoice_no} (drawer unchanged)`);
        }

        // 6. Update sale header
        await client.query(
            `UPDATE sales SET
                customer_id = $1,
                subtotal = $2,
                discount = $3,
                vat = $4,
                setup_charge = $5,
                extra_cost = $6,
                extra_cost_category = COALESCE($7, extra_cost_category),
                extra_cost_notes = COALESCE($8, extra_cost_notes),
                total_amount = $9,
                paid_amount = $10,
                due_amount = $11,
                payment_status = $12,
                payment_details = $13,
                loyalty_points_earned = $14,
                loyalty_points_used = $15,
                payment_method_id = $16,
                sales_person = $17,
                destination = $18,
                attention = $19,
                notes = COALESCE($20, notes),
                invoice_date = COALESCE($21::date, invoice_date)
             WHERE id = $22 RETURNING *`,
            [
                Number(customer_id),
                subtotal,
                discount + discountFromLoyalty,
                vat,
                setupCharge,
                extraCost,
                extra_cost_category,
                extra_cost_notes,
                totalAmount,
                totalPaid,
                totalDue,
                paymentStatus,
                JSON.stringify(tenderList),
                pointsEarned,
                loyaltyToUse,
                payment_method_id,
                sales_person,
                destination,
                attention,
                notes || null,
                invoice_date || null,
                id,
            ]
        );

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
        return res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to update sale', error: error.message });
    }
};

module.exports = {
    updateSale,
};
