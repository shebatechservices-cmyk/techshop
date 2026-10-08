const pool = require('../../../config/db');
const { ensureWalletSchema, drawerLedgerOnly } = require('../../walletController');
const {
    money,
    ensureSalesColumns,
    formatProductFullName,
    normalizeAndValidateItems,
    validateAvailableStockAndSerials,
    applySaleTender,
} = require('../salesHelpers');

/**
 * Creates a new sale invoice with validation, stock deduction, and payment settlement.
 */
const createSale = async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            customer_id,
            items = [],
            subtotal: rawSubtotal,
            discount: rawDiscount = 0,
            vat: rawVat = 0,
            setup_charge: rawSetupCharge = 0,
            extra_cost: rawExtraCost = 0,
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
            previous_due: rawPreviousDue,
            notes = '',
        } = req.body;

        if (!customer_id) {
            return res.status(400).json({ success: false, message: 'Please select or provide a customer' });
        }
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Please add at least one product item' });
        }

        await client.query('BEGIN');
        await ensureSalesColumns();
        await ensureWalletSchema();

        // Normalize items & enforce serial-tracking rule
        const { normalizedItems, calculatedSubtotal, missingItem: missing } = await normalizeAndValidateItems(items, client);
        if (missing) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: `"${missing.name || 'Product'}" is serial/barcode-tracked — attach at least one barcode/serial before saving.`,
            });
        }

        // RULE 1: Strict available stock & serial database verification
        await validateAvailableStockAndSerials(client, normalizedItems);

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

        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const generateInvoiceNo = async () => {
            const seqRes = await client.query("SELECT nextval('sales_invoice_no_seq') AS seq").catch(() => ({ rows: [] }));
            const seqVal = seqRes.rows?.[0]?.seq || Math.floor(1000 + Math.random() * 9000);
            return `INV-${dateStr}-${String(seqVal).padStart(4, '0').slice(-4)}`;
        };
        let invoiceNo = await generateInvoiceNo();

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
                    subtotal,
                    discount + discountFromLoyalty,
                    vat,
                    setupCharge,
                    extraCost,
                    extra_cost_category || null,
                    extra_cost_notes || null,
                    totalAmount,
                    totalPaid,
                    totalDue,
                    paymentStatus,
                    JSON.stringify(payment_tenders.length > 0 ? payment_tenders : payment_details),
                    pointsEarned,
                    loyalty_points_to_use || 0,
                    payment_method_id,
                    sales_person,
                    destination,
                    attention,
                    invoice_date,
                    previousDue,
                ]);
                break;
            } catch (insertErr) {
                const isInvoiceCollision = insertErr
                    && insertErr.code === '23505'
                    && String(insertErr.detail || insertErr.message || '').includes('invoice_no');
                if (!isInvoiceCollision || attempt === 2) throw insertErr;
                invoiceNo = await generateInvoiceNo();
            }
        }
        const saleId = saleResult.rows[0].id;

        // Insert sale items & update product stocks
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

            // Lock cost price to the exact purchase batch cost of the scanned serials
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

            const itemConvRate = Number(item.conversion_rate || 1);
            if (itemConvRate > 1 && (item.unit_type === 'sub_unit' || itemCostPrice > money(item.unit_price) * 2)) {
                itemCostPrice = money(itemCostPrice / itemConvRate);
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
                    saleId,
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
                    await client.query(
                        'INSERT INTO sales_item_serials (sales_item_id, serial_code) VALUES ($1, $2)',
                        [savedItem.rows[0].id, trimmed]
                    );
                }
            }

            // Deduct stock for standard product or bundle components
            const prodRes = await client.query('SELECT is_bundle, conversion_rate, unit_name, sub_unit_name FROM products WHERE id = $1', [item.product_id]);
            const isBundle = Boolean(prodRes.rows[0]?.is_bundle);

            if (isBundle) {
                const bundleItemsRes = await client.query('SELECT product_id, quantity FROM product_bundle_items WHERE bundle_id = $1', [item.product_id]);
                for (const bItem of bundleItemsRes.rows) {
                    const deductQty = Number(item.quantity || 1) * Number(bItem.quantity || 1);
                    await client.query(
                        `UPDATE products
                         SET stock = GREATEST(0, COALESCE(stock, 0) - $1),
                             updated_at = NOW()
                         WHERE id = $2`,
                        [deductQty, bItem.product_id]
                    );
                    await client.query(
                        `UPDATE stock_levels
                         SET quantity = GREATEST(0, quantity - $1)
                         WHERE product_id = $2 AND warehouse_id = 1`,
                        [deductQty, bItem.product_id]
                    ).catch(() => null);
                }
            } else {
                const prodData = prodRes.rows[0];
                const convRate = Number(prodData?.conversion_rate || 1);
                const isSubUnit = item.unit_type === 'sub_unit' || (prodData?.sub_unit_name && item.unit_name === prodData?.sub_unit_name);
                const deductMultiplier = isSubUnit ? 1 : (convRate > 1 ? convRate : 1);
                const deductQty = Number(item.quantity || 0) * deductMultiplier;

                await client.query(
                    `UPDATE products
                     SET stock = GREATEST(0, COALESCE(stock, 0) - $1),
                         updated_at = NOW()
                     WHERE id = $2`,
                    [deductQty, item.product_id]
                );
                await client.query(
                    `UPDATE stock_levels
                     SET quantity = GREATEST(0, quantity - $1)
                     WHERE product_id = $2 AND warehouse_id = 1`,
                    [deductQty, item.product_id]
                ).catch(() => null);
            }
        }

        // Update customer balances: add due to receivable balance and award loyalty points
        if (totalDue > 0) {
            await client.query(
                'UPDATE customers SET receivable_balance = COALESCE(receivable_balance, 0) + $1 WHERE id = $2',
                [totalDue, Number(customer_id)]
            );
        }
        if (pointsEarned > 0) {
            await client.query(
                'UPDATE customers SET loyalty_points = COALESCE(loyalty_points, 0) + $1 WHERE id = $2',
                [pointsEarned, Number(customer_id)]
            );
        }

        // Process payment tenders & apply ledger effects
        let walletUsed = 0;
        if (tenders.length > 0) {
            for (const tender of tenders) {
                const tenderAmount = money(tender.amount || tender.quantity || 0);
                if (tenderAmount <= 0) continue;
                await client.query(
                    `INSERT INTO payments (sale_id, payment_mode, account_name, reference_no, amount, created_at)
                     VALUES ($1, $2, $3, $4, $5, NOW())`,
                    [
                        saleId,
                        tender.payment_mode || tender.method || 'Cash',
                        tender.account_name || null,
                        tender.reference_no || null,
                        tenderAmount,
                    ]
                );
                const res = await applySaleTender(client, {
                    customerId: Number(customer_id),
                    invoiceNo,
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
                invoiceNo,
                tender: { amount: totalPaid, payment_mode: 'Cash' },
                ledgerType: 'sale_payment',
            });
            await client.query(
                `INSERT INTO payments (sale_id, payment_mode, account_name, reference_no, amount, created_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                [saleId, 'Cash', null, null, totalPaid]
            );
        }

        if (walletUsed > 0) {
            await drawerLedgerOnly(client, 'wallet_settlement', walletUsed, invoiceNo, `Customer wallet payment for sale #${invoiceNo} (drawer unchanged)`);
        }

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
        await client.query('ROLLBACK');
        console.error('Create sale error:', error);
        return res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to create sale', error: error.message });
    } finally {
        client.release();
    }
};


module.exports = {
    createSale,
};
