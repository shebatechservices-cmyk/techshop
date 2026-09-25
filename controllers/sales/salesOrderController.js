const pool = require('../../config/db');
const { ensureWalletSchema, drawerLedgerOnly } = require('../walletController');
const {
    money,
    ensureSalesColumns,
    formatProductFullName,
    normalizeAndValidateItems,
    applySaleTender,
    reverseSaleTender,
    validateSaleDeletable,
    reverseSaleFinancials,
} = require('./salesHelpers');

// ==========================================================
// SALES INVOICES & POS
// ==========================================================

exports.createSale = async (req, res) => {
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
            const seqRes = await client.query("SELECT nextval('sales_invoice_no_seq') AS seq");
            return `INV-${dateStr}-${String(seqRes.rows[0].seq).padStart(4, '0').slice(-4)}`;
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
            const savedItem = await client.query(
                `INSERT INTO sales_items (sale_id, product_id, quantity, unit_price, cost_price, line_total, warranty_expire_date, warranty_months)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                [saleId, item.product_id, item.quantity, item.unit_price, item.cost_price, item.line_total, expireDate, warrantyMonths]
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
        return res.status(500).json({ success: false, message: error.message || 'Failed to create sale' });
    } finally {
        client.release();
    }
};

exports.getSales = async (_req, res) => {
    try {
        const query = `
            SELECT s.*,
                   c.name AS customer_name,
                   c.phone AS customer_phone,
                   c.email AS customer_email,
                   COALESCE((SELECT COUNT(*) FROM sales_items WHERE sale_id = s.id), 0) AS item_count,
                   COALESCE((SELECT SUM(quantity) FROM sales_items WHERE sale_id = s.id), 0) AS unit_count,
                   COALESCE((
                       SELECT true FROM register_shifts rs 
                       WHERE rs.status = 'closed' 
                         AND s.created_at <= rs.closed_at 
                         AND (rs.opened_at IS NULL OR s.created_at >= rs.opened_at)
                       LIMIT 1
                   ), false) AS is_shift_closed
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.deleted_at IS NULL
            ORDER BY s.id DESC
            LIMIT 200;
        `;
        const result = await pool.query(query);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get sales error:', error);
        return res.status(500).json({ success: false, message: error.message, data: [] });
    }
};

exports.getSaleById = async (req, res) => {
    try {
        await ensureSalesColumns();
        const saleId = Number(req.params.id);
        const saleRes = await pool.query(
            `SELECT s.*,
                    c.name AS customer_name,
                    c.phone AS customer_phone,
                    c.email AS customer_email,
                    c.address AS customer_address,
                    c.receivable_balance AS customer_receivable_balance,
                    COALESCE((
                        SELECT true FROM register_shifts rs 
                        WHERE rs.status = 'closed' 
                          AND s.created_at <= rs.closed_at 
                          AND (rs.opened_at IS NULL OR s.created_at >= rs.opened_at)
                        LIMIT 1
                    ), false) AS is_shift_closed
             FROM sales s
             LEFT JOIN customers c ON s.customer_id = c.id
             WHERE s.id = $1`,
            [saleId]
        );
        if (!saleRes.rows.length) {
            return res.status(404).json({ success: false, message: 'Sale invoice not found' });
        }
        const sale = saleRes.rows[0];

        const itemsRes = await pool.query(
            `SELECT si.*,
                    COALESCE(si.warranty_months, p.warranty_months, 0) AS warranty_months,
                    COALESCE(p.name, 'Product') AS product_name,
                    b.name AS brand_name,
                    m.name AS model_name,
                    s.name AS series_name,
                    p.sku,
                    p.barcode
             FROM sales_items si
             LEFT JOIN products p ON p.id = si.product_id
             LEFT JOIN brands b ON b.id = p.brand_id
             LEFT JOIN models m ON m.id = p.model_id
             LEFT JOIN series s ON s.id = p.series_id
             WHERE si.sale_id = $1
             ORDER BY si.id ASC`,
            [saleId]
        );

        const itemIds = itemsRes.rows.map((it) => it.id);
        let serialsByItem = {};
        if (itemIds.length > 0) {
            const serialsRes = await pool.query(
                `SELECT sales_item_id, serial_code
                 FROM sales_item_serials
                 WHERE sales_item_id = ANY($1::int[])`,
                [itemIds]
            );
            serialsRes.rows.forEach((s) => {
                if (!serialsByItem[s.sales_item_id]) {
                    serialsByItem[s.sales_item_id] = [];
                }
                serialsByItem[s.sales_item_id].push(s.serial_code);
            });
        }

        const items = itemsRes.rows.map((it) => {
            const fullTitle = formatProductFullName(it);
            return {
                ...it,
                name: fullTitle,
                full_name: fullTitle,
                warranty_months: Number(it.warranty_months || 0),
                serials: serialsByItem[it.id] || [],
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                ...sale,
                items,
            },
        });
    } catch (error) {
        console.error('Get sale by id error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteSale = async (req, res) => {
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

exports.updateSale = async (req, res) => {
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
            const savedItem = await client.query(
                `INSERT INTO sales_items (sale_id, product_id, quantity, unit_price, cost_price, line_total, warranty_expire_date, warranty_months)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                [Number(id), item.product_id, item.quantity, item.unit_price, item.cost_price, item.line_total, expireDate, warrantyMonths]
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
        return res.status(500).json({ success: false, message: error.message || 'Failed to update sale' });
    }
};
