const pool = require('../../config/db');
const {
    money,
    formatProductFullName,
    makePoNumber,
    ensurePurchaseColumns,
    checkSerial,
    applyPurchasePayment,
    reversePurchasePayment,
} = require('./purchaseHelpers');

// =========================================================
// PURCHASE ORDERS
// =========================================================

const getAccounts = async (_req, res) => {
    try {
        const result = await pool.query('SELECT * FROM payment_accounts ORDER BY id ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to load payment accounts' });
    }
};

const createOrder = async (req, res) => {
    await ensurePurchaseColumns();
    const {
        supplier_id,
        transaction_reference,
        extra_cost,
        extra_cost_category,
        extra_cost_notes,
        items = [],
        payments = [],
    } = req.body;

    if (!supplier_id) return res.status(400).json({ error: 'Please select a supplier' });
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Please add at least one product' });
    }

    const seenProductIds = new Set();
    for (const item of items) {
        const pid = parseInt(item.product_id, 10);
        if (!pid) {
            return res.status(400).json({ error: 'Please select a valid product for each line item' });
        }
        if (seenProductIds.has(pid)) {
            return res.status(400).json({ error: 'The same item cannot be added twice in a single purchase order.' });
        }
        seenProductIds.add(pid);
    }

    const seenPaymentMethods = new Set();
    for (const pay of payments) {
        const method = (pay.payment_method || 'Cash').trim();
        if (money(pay.amount) > 0) {
            if (seenPaymentMethods.has(method)) {
                return res.status(400).json({ error: `The same payment method "${method}" cannot be used twice in a single purchase.` });
            }
            seenPaymentMethods.add(method);
        }
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const supplier = await client.query('SELECT id, name FROM suppliers WHERE id = $1', [supplier_id]);
        if (!supplier.rows.length) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Supplier not found' });
        }

        const extraCost = money(extra_cost);
        let totalCost = extraCost;
        let totalSale = 0;
        let unitCount = 0;

        const normalizedItems = items.map((item, index) => {
            const quantity = Number(item.quantity || 0);
            const costPrice = money(item.cost_price);
            const salePrice = money(item.sale_price);
            const finalSale = money(item.final_sale_price);
            if (!item.product_id) {
                throw Object.assign(new Error('Please select a product'), { status: 400 });
            }
            if (costPrice <= 0) {
                throw Object.assign(new Error('Please enter a valid cost price greater than 0 for each item'), { status: 400 });
            }
            if (!item.expected_date) {
                throw Object.assign(new Error('Please provide expected date for each item'), { status: 400 });
            }
            totalCost += costPrice * quantity;
            totalSale += finalSale * quantity;
            unitCount += quantity;

            const rawWarranty = item.warranty_months;
            let cleanWarranty = 0;
            if (typeof rawWarranty === 'number' && !isNaN(rawWarranty)) {
                cleanWarranty = Math.round(rawWarranty);
            } else if (rawWarranty) {
                const parsed = parseInt(String(rawWarranty).replace(/[^0-9]/g, ''), 10);
                cleanWarranty = isNaN(parsed) ? 0 : parsed;
            }

            return {
                product_id: parseInt(item.product_id, 10) || 0,
                quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
                cost_price: costPrice,
                sale_price: salePrice,
                margin_type: item.margin_type || 'percentage',
                margin_value: money(item.margin_value),
                final_sale_price: finalSale,
                line_total: costPrice * quantity,
                expected_date: item.expected_date,
                warranty_months: cleanWarranty,
                sort_order: index + 1,
                serials: Array.isArray(item.serials) ? item.serials.filter(Boolean) : [],
            };
        });

        const allPayloadSerials = [];
        for (const item of normalizedItems) {
            if (Array.isArray(item.serials)) {
                for (const s of item.serials) {
                    const trimmed = String(s || '').trim();
                    if (trimmed) {
                        const lower = trimmed.toLowerCase();
                        if (allPayloadSerials.includes(lower)) {
                            throw Object.assign(
                                new Error(`Duplicate serial/barcode "${trimmed}" found within this purchase order submission`),
                                { status: 400 }
                            );
                        }
                        allPayloadSerials.push(lower);
                    }
                }
            }
        }

        if (allPayloadSerials.length > 0) {
            const existingSerialsRes = await client.query(
                `SELECT pos.serial_code, po.po_number, p.name AS product_name
                 FROM purchase_order_serials pos
                 JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
                 JOIN purchase_orders po ON po.id = poi.purchase_order_id
                 JOIN products p ON p.id = poi.product_id
                 WHERE LOWER(TRIM(pos.serial_code)) = ANY($1)
                   AND po.deleted_at IS NULL
                 LIMIT 5`,
                [allPayloadSerials]
            );
            if (existingSerialsRes.rows.length > 0) {
                const duplicates = existingSerialsRes.rows.map(r => `"${r.serial_code}" (in PO ${r.po_number || 'N/A'}, Product: ${r.product_name || 'N/A'})`).join(', ');
                throw Object.assign(
                    new Error(`The following serial(s)/barcode(s) already exist in Inventory: ${duplicates}`),
                    { status: 400 }
                );
            }
        }

        const tenders = Array.isArray(payments) ? payments : [];
        let totalPaid = 0;
        for (const tender of tenders) {
            totalPaid += money(tender.amount || 0);
        }

        const totalDue = tenders.length === 0 ? totalCost : Math.max(0, totalCost - totalPaid);
        const paymentStatus = totalDue === 0 ? 'PAID' : 'approved';

        const poNumber = makePoNumber();

        const order = await client.query(
            `INSERT INTO purchase_orders (
                po_number, supplier_id, transaction_reference,
                total_cost, total_sale, extra_cost, extra_cost_category, extra_cost_notes, total_paid, total_due,
                item_count, unit_count, status
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
              RETURNING *`,
            [
                poNumber,
                supplier_id,
                transaction_reference || null,
                totalCost,
                totalSale,
                extraCost,
                extra_cost_category || null,
                extra_cost_notes || null,
                totalPaid,
                totalDue,
                normalizedItems.length,
                unitCount,
                paymentStatus,
            ]
        );
        const orderId = order.rows[0].id;

        if (extraCost > 0) {
            try {
                const catName = extra_cost_category || 'Transportation & Logistics';
                const payeeName = supplier.rows[0].name || 'Supplier';
                const expNote = extra_cost_notes
                    ? `PO ${poNumber} - ${extra_cost_notes}`
                    : `Purchase Order ${poNumber} Extra Cost (${catName})`;
                await client.query(
                    `INSERT INTO expenses (voucher_no, category_name, amount, expense_date, payee_name, reference_no, note)
                     VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6)
                     ON CONFLICT (voucher_no) DO UPDATE 
                     SET category_name = EXCLUDED.category_name, amount = EXCLUDED.amount, note = EXCLUDED.note`,
                    [`EXP-${poNumber}`, catName, extraCost, payeeName, poNumber, expNote]
                );
            } catch (expErr) {
                console.warn('Expense recording for PO extra cost notice:', expErr.message);
            }
        }

        for (const item of normalizedItems) {
            const product = await client.query('SELECT id FROM products WHERE id = $1', [item.product_id]);
            if (!product.rows.length) {
                throw Object.assign(new Error('A product was not found'), { status: 400 });
            }

            let supplierWarrantyExpireDate = null;
            const supplierWarrantyMonths = Math.max(0, parseInt(item.supplier_warranty_months !== undefined && item.supplier_warranty_months !== null ? item.supplier_warranty_months : item.warranty_months, 10) || 0);
            const customerWarrantyMonths = Math.max(0, parseInt(item.customer_warranty_months !== undefined && item.customer_warranty_months !== null ? item.customer_warranty_months : item.warranty_months, 10) || 0);
            const baseDateStr = item.expected_date || new Date().toISOString().split('T')[0];
            if (supplierWarrantyMonths > 0 && baseDateStr) {
                const baseDate = new Date(baseDateStr);
                if (!isNaN(baseDate.getTime())) {
                    const expDate = new Date(baseDate);
                    expDate.setMonth(expDate.getMonth() + supplierWarrantyMonths);
                    supplierWarrantyExpireDate = expDate.toISOString().split('T')[0];
                }
            }

            const savedItem = await client.query(
                `INSERT INTO purchase_order_items (
                    purchase_order_id, product_id, quantity, cost_price, sale_price,
                    margin_type, margin_value, final_sale_price, line_total,
                    expected_date, warranty_months, sort_order, supplier_warranty_expire_date,
                    supplier_warranty_months, customer_warranty_months
                 ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
                  RETURNING id`,
                [
                    orderId,
                    item.product_id,
                    item.quantity,
                    item.cost_price,
                    item.sale_price,
                    item.margin_type,
                    item.margin_value,
                    item.final_sale_price,
                    item.line_total,
                    item.expected_date,
                    customerWarrantyMonths,
                    item.sort_order,
                    supplierWarrantyExpireDate,
                    supplierWarrantyMonths,
                    customerWarrantyMonths,
                ]
            );

            for (const serial of item.serials) {
                await client.query(
                    'INSERT INTO purchase_order_serials (purchase_order_item_id, serial_code) VALUES ($1, $2)',
                    [savedItem.rows[0].id, String(serial).trim()]
                );
            }

            const itemCostPrice = money(item.cost_price);
            const itemSalePrice = money(item.final_sale_price || item.sale_price);

            await client.query(
                `UPDATE products
                 SET stock = COALESCE(stock, 0) + $1::int,
                     purchase_count = COALESCE(purchase_count, 0) + 1,
                     purchased_at = NOW(),
                     purchase_price = $6::numeric,
                     selling_price = CASE WHEN $7::numeric > 0 THEN $7::numeric ELSE selling_price END,
                     mrp = CASE WHEN $7::numeric > 0 THEN $7::numeric ELSE mrp END,
                     supplier_warranty_expire_date = COALESCE($2::date, supplier_warranty_expire_date),
                     warranty_months = CASE WHEN $3::int > 0 THEN $3::int ELSE warranty_months END,
                     barcode = CASE WHEN COALESCE(NULLIF(barcode, ''), '') = '' THEN $5::text ELSE barcode END,
                     updated_at = NOW()
                 WHERE id = $4::int`,
                [
                    Number(item.quantity) || 1,
                    supplierWarrantyExpireDate || null,
                    customerWarrantyMonths,
                    Number(item.product_id) || 0,
                    item.serials.length > 0 ? String(item.serials[0]).trim() : null,
                    itemCostPrice,
                    itemSalePrice,
                ]
            );

            await client.query(
                `INSERT INTO stock_levels (product_id, warehouse_id, quantity)
                 VALUES ($1, 1, $2)
                 ON CONFLICT (product_id, warehouse_id)
                 DO UPDATE SET quantity = stock_levels.quantity + EXCLUDED.quantity`,
                [Number(item.product_id) || 0, Number(item.quantity) || 1]
            ).catch(() => null);
        }

        for (const payment of tenders) {
            await applyPurchasePayment(client, {
                orderId,
                payment,
                poNumber: order.rows[0].po_number,
                supplierId: supplier_id,
                supplierName: supplier.rows[0].name,
            });
        }

        await client.query(
            `UPDATE suppliers
             SET payable_balance = payable_balance + $1, updated_at = NOW()
             WHERE id = $2`,
            [totalDue, supplier_id]
        );

        await client.query('COMMIT');
        res.status(201).json({
            message: 'Purchase order saved successfully',
            data: {
                ...order.rows[0],
                items: normalizedItems,
                payments: tenders,
                supplier: supplier.rows[0],
                payment_status: paymentStatus,
                total_paid: totalPaid,
                due_amount: totalDue,
            },
        });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Serial number is already in use' });
        }
        console.error(error);
        res.status(error.status || 500).json({ error: error.message || 'Failed to save purchase order' });
    } finally {
        client.release();
    }
};

const getOrders = async (_req, res) => {
    try {
        const result = await pool.query(
            `SELECT po.*, s.name AS supplier_name
             FROM purchase_orders po
             JOIN suppliers s ON s.id = po.supplier_id
             WHERE po.deleted_at IS NULL
             ORDER BY po.id DESC`
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to load purchase orders' });
    }
};

const getOrderById = async (req, res) => {
    try {
        await ensurePurchaseColumns();
        const orderId = Number(req.params.id);
        const orderResult = await pool.query(
            `SELECT po.*, s.name AS supplier_name, s.phone AS supplier_phone, s.contact_code AS supplier_contact,
                    s.address AS supplier_address, s.email AS supplier_email,
                    COALESCE(s.payable_balance, 0) AS supplier_payable_balance,
                    COALESCE(s.wallet_balance, 0) AS supplier_wallet_balance
             FROM purchase_orders po
             JOIN suppliers s ON s.id = po.supplier_id
             WHERE po.id = $1`,
            [orderId]
        );
        if (!orderResult.rows.length) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        const order = orderResult.rows[0];

        const itemsResult = await pool.query(
            `SELECT poi.*, p.name AS product_name, b.name AS brand_name, p.sku, p.barcode,
                    c.name AS category_name, m.name AS model_name, s.name AS series_name
             FROM purchase_order_items poi
             JOIN products p ON p.id = poi.product_id
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN brands b ON b.id = p.brand_id
             LEFT JOIN models m ON m.id = p.model_id
             LEFT JOIN series s ON s.id = p.series_id
             WHERE poi.purchase_order_id = $1
             ORDER BY poi.sort_order ASC, poi.id ASC`,
            [orderId]
        );

        const itemIds = itemsResult.rows.map((it) => it.id);
        let serialsByItem = {};
        if (itemIds.length > 0) {
            const serialsResult = await pool.query(
                `SELECT purchase_order_item_id, serial_code
                 FROM purchase_order_serials
                 WHERE purchase_order_item_id = ANY($1::int[])`,
                [itemIds]
            );
            serialsResult.rows.forEach((s) => {
                if (!serialsByItem[s.purchase_order_item_id]) {
                    serialsByItem[s.purchase_order_item_id] = [];
                }
                serialsByItem[s.purchase_order_item_id].push(s.serial_code);
            });
        }

        const items = itemsResult.rows.map((it) => {
            const fullTitle = formatProductFullName(it);
            return {
                ...it,
                name: fullTitle,
                full_name: fullTitle,
                serials: serialsByItem[it.id] || [],
            };
        });

        const paymentsResult = await pool.query(
            `SELECT pop.*, pa.name AS account_name
             FROM purchase_order_payments pop
             LEFT JOIN payment_accounts pa ON pa.id = pop.account_id
             WHERE pop.purchase_order_id = $1
             ORDER BY pop.id ASC`,
            [orderId]
        );

        res.status(200).json({
            ...order,
            items,
            payments: paymentsResult.rows,
        });
    } catch (error) {
        console.error('getOrderById error:', error);
        res.status(500).json({ error: 'Failed to load purchase order' });
    }
};

const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const poRes = await pool.query('SELECT * FROM purchase_orders WHERE id = $1', [id]);
        if (!poRes.rows.length) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        const po = poRes.rows[0];

        const createdAt = new Date(po.created_at || Date.now());
        const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursOld > 168) {
            return res.status(400).json({
                error: "Delete window (7 days) has expired. Please use the Return/Exchange module instead."
            });
        }

        if (po.supplier_id) {
            const laterPO = await pool.query(
                'SELECT po_number FROM purchase_orders WHERE supplier_id = $1 AND id != $2 AND created_at > (SELECT created_at FROM purchase_orders WHERE id = $2) AND deleted_at IS NULL LIMIT 1',
                [po.supplier_id, id]
            ).catch(() => ({ rows: [] }));
            if (laterPO.rows.length > 0) {
                return res.status(400).json({
                    error: `Cannot delete purchase order: Later purchase order (#${laterPO.rows[0].po_number}) has already been recorded for this supplier. Only the most recent transaction can be deleted.`
                });
            }
        }

        const serialSoldCheck = await pool.query(`
            SELECT DISTINCT s.invoice_no 
            FROM sales_item_serials sis
            JOIN sales_items si ON si.id = sis.sales_item_id
            JOIN sales s ON s.id = si.sale_id
            JOIN purchase_order_serials pos ON LOWER(TRIM(pos.serial_code)) = LOWER(TRIM(sis.serial_code))
            JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
            WHERE poi.purchase_order_id = $1
              AND s.deleted_at IS NULL
        `, [id]).catch(() => ({ rows: [] }));

        const salesCheck = await pool.query(`
            SELECT DISTINCT s.invoice_no 
            FROM sales_items si
            JOIN sales s ON s.id = si.sale_id
            JOIN purchase_order_items poi ON poi.product_id = si.product_id
            WHERE poi.purchase_order_id = $1 
              AND s.created_at > (SELECT created_at FROM purchase_orders WHERE id = $1)
              AND s.deleted_at IS NULL
        `, [id]).catch(() => ({ rows: [] }));

        const allLinkedInvoices = [...new Set([
            ...serialSoldCheck.rows.map(r => r.invoice_no).filter(Boolean),
            ...salesCheck.rows.map(r => r.invoice_no).filter(Boolean)
        ])];

        if (allLinkedInvoices.length > 0) {
            const invoiceList = allLinkedInvoices.map(inv => `[Invoice #${inv}]`).join(', ');
            return res.status(400).json({
                error: `Cannot delete Purchase! Items from this batch are already sold. Please delete or rollback Sale Invoices ${invoiceList} first.`,
                linked_invoices: allLinkedInvoices
            });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const poItems = await client.query(
                'SELECT product_id, quantity FROM purchase_order_items WHERE purchase_order_id = $1',
                [id]
            );
            for (const item of poItems.rows) {
                const qty = Number(item.quantity || 0);
                const pid = item.product_id;

                await client.query(
                    `UPDATE products
                     SET stock = GREATEST(0, COALESCE(stock, 0) - $1),
                         purchase_count = GREATEST(0, COALESCE(purchase_count, 0) - 1),
                         updated_at = NOW()
                     WHERE id = $2`,
                    [qty, pid]
                );

                await client.query(
                    `UPDATE stock_levels
                     SET quantity = GREATEST(0, COALESCE(quantity, 0) - $1)
                     WHERE product_id = $2 AND warehouse_id = 1`,
                    [qty, pid]
                ).catch(() => null);

                await client.query(
                    `UPDATE products p
                     SET purchase_price = COALESCE((
                          SELECT poi.cost_price 
                          FROM purchase_order_items poi 
                          JOIN purchase_orders po ON po.id = poi.purchase_order_id 
                          WHERE poi.product_id = p.id AND po.id != $1 AND po.deleted_at IS NULL 
                          ORDER BY po.created_at DESC 
                          LIMIT 1
                     ), 0),
                     selling_price = COALESCE((
                          SELECT COALESCE(NULLIF(poi.final_sale_price, 0), poi.sale_price)
                          FROM purchase_order_items poi 
                          JOIN purchase_orders po ON po.id = poi.purchase_order_id 
                          WHERE poi.product_id = p.id AND po.id != $1 AND po.deleted_at IS NULL 
                          ORDER BY po.created_at DESC 
                          LIMIT 1
                     ), p.selling_price)
                     WHERE p.id = $2`,
                    [id, pid]
                ).catch(() => null);
            }

            await client.query(
                `DELETE FROM purchase_order_serials 
                 WHERE purchase_order_item_id IN (
                     SELECT id FROM purchase_order_items WHERE purchase_order_id = $1
                 )`,
                [id]
            );

            await client.query('DELETE FROM purchase_order_items WHERE purchase_order_id = $1', [id]);

            if (po.supplier_id && Number(po.total_due) > 0) {
                await client.query(
                    `UPDATE suppliers 
                     SET payable_balance = GREATEST(0, COALESCE(payable_balance, 0) - $1), 
                         updated_at = NOW() 
                     WHERE id = $2`,
                    [Number(po.total_due), po.supplier_id]
                );
            }

            const poPayments = await client.query(
                'SELECT * FROM purchase_order_payments WHERE purchase_order_id = $1',
                [id]
            );
            for (const pay of poPayments.rows) {
                await reversePurchasePayment(client, {
                    payment: pay,
                    poNumber: po.po_number || id,
                    supplierId: po.supplier_id,
                    ledgerType: 'purchase_delete_refund',
                    reasonNote: `PO ${po.po_number || id} deleted`,
                });
            }
            await client.query('DELETE FROM purchase_order_payments WHERE purchase_order_id = $1', [id]);
            await client.query('DELETE FROM payments WHERE purchase_id = $1', [id]).catch(() => null);

            await client.query("UPDATE purchase_orders SET deleted_at = NOW(), status = 'cancelled', updated_at = NOW() WHERE id = $1", [id]);
            await client.query(`
                INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
                VALUES ('purchase_orders', $1, $2, $3, NOW())
            `, [id, `PO #${po.po_number || id}`, JSON.stringify(po)]).catch(() => null);

            await client.query('COMMIT');
        } catch (txErr) {
            await client.query('ROLLBACK').catch(() => null);
            throw txErr;
        } finally {
            client.release();
        }

        res.status(200).json({ success: true, message: `Purchase order #${po.po_number || id} moved to Trash successfully! Stock and inventory reversed.` });
    } catch (error) {
        console.error('Delete purchase order error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete purchase order' });
    }
};

const updateOrder = async (req, res) => {
    await ensurePurchaseColumns();
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const poRes = await client.query('SELECT * FROM purchase_orders WHERE id = $1', [id]);
        if (!poRes.rows.length) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        const po = poRes.rows[0];

        const createdAt = new Date(po.created_at || Date.now());
        const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursOld > 360) {
            return res.status(400).json({
                error: `Cannot edit purchase order: PO #${po.po_number || id} was created ${Math.floor(hoursOld / 24)} days ago. Edits are only permitted within 15 days (360 hours) of creation.`
            });
        }

        const salesCheck = await client.query(`
            SELECT poi.product_id, p.name as product_name, COUNT(si.id) as sold_count
            FROM purchase_order_items poi
            JOIN products p ON p.id = poi.product_id
            JOIN sales_items si ON si.product_id = poi.product_id
            JOIN sales s ON s.id = si.sale_id
            WHERE poi.purchase_order_id = $1 
              AND s.created_at > (SELECT created_at FROM purchase_orders WHERE id = $1)
              AND s.deleted_at IS NULL
            GROUP BY poi.product_id, p.name
        `, [id]).catch(() => ({ rows: [] }));

        const soldProductMap = new Map();
        salesCheck.rows.forEach(r => soldProductMap.set(Number(r.product_id), Number(r.sold_count || 1)));
        const hasSales = soldProductMap.size > 0;

        await client.query('BEGIN');

        const {
            transaction_reference,
            extra_cost,
            extra_cost_category,
            extra_cost_notes,
            items = []
        } = req.body;

        let totalCost = money(extra_cost !== undefined ? extra_cost : po.extra_cost);
        let totalSale = 0;
        let unitCount = 0;

        if (Array.isArray(items) && items.length > 0) {
            const seenPids = new Set();
            const allPayloadSerials = [];

            for (const item of items) {
                const pid = parseInt(item.product_id, 10);
                if (seenPids.has(pid)) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ error: 'The same item cannot be added twice in a purchase order.' });
                }
                seenPids.add(pid);

                if (Array.isArray(item.serials)) {
                    for (const s of item.serials) {
                        const trimmed = String(s || '').trim();
                        if (trimmed) {
                            const lower = trimmed.toLowerCase();
                            if (allPayloadSerials.includes(lower)) {
                                await client.query('ROLLBACK');
                                return res.status(400).json({
                                    error: `Duplicate serial/barcode "${trimmed}" found within this purchase order submission`
                                });
                            }
                            allPayloadSerials.push(lower);
                        }
                    }
                }
            }

            if (allPayloadSerials.length > 0) {
                const existingSerialsRes = await client.query(
                    `SELECT pos.serial_code, po.po_number, p.name AS product_name
                     FROM purchase_order_serials pos
                     JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
                     JOIN purchase_orders po ON po.id = poi.purchase_order_id
                     JOIN products p ON p.id = poi.product_id
                     WHERE LOWER(TRIM(pos.serial_code)) = ANY($1)
                       AND po.id != $2
                       AND po.deleted_at IS NULL
                     LIMIT 5`,
                    [allPayloadSerials, id]
                );
                if (existingSerialsRes.rows.length > 0) {
                    const duplicates = existingSerialsRes.rows.map(r => `"${r.serial_code}" (in PO ${r.po_number || 'N/A'}, Product: ${r.product_name || 'N/A'})`).join(', ');
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        error: `The following serial(s)/barcode(s) already exist in Inventory: ${duplicates}`
                    });
                }
            }

            const existingPoiRes = await client.query('SELECT * FROM purchase_order_items WHERE purchase_order_id = $1', [id]);
            const existingPoiMap = new Map(existingPoiRes.rows.map(r => [Number(r.id), r]));
            const newItemIds = new Set(items.map(it => it.id ? Number(it.id) : null).filter(Boolean));

            for (const [oldPoiId, oldPoi] of existingPoiMap.entries()) {
                if (!newItemIds.has(oldPoiId)) {
                    const oldPid = Number(oldPoi.product_id);
                    if (soldProductMap.has(oldPid)) {
                        await client.query('ROLLBACK');
                        return res.status(400).json({
                            error: `Cannot remove product ID ${oldPid} from purchase order because units from this PO have already been sold.`
                        });
                    }
                    await client.query(
                        `UPDATE products 
                         SET stock = GREATEST(0, COALESCE(stock, 0) - $1), 
                             purchase_count = GREATEST(0, COALESCE(purchase_count, 0) - 1),
                             updated_at = NOW() 
                         WHERE id = $2`,
                        [Number(oldPoi.quantity || 0), oldPid]
                    );
                    await client.query(
                        `UPDATE stock_levels 
                         SET quantity = GREATEST(0, COALESCE(quantity, 0) - $1) 
                         WHERE product_id = $2 AND warehouse_id = 1`,
                        [Number(oldPoi.quantity || 0), oldPid]
                    ).catch(() => null);

                    await client.query('DELETE FROM purchase_order_serials WHERE purchase_order_item_id = $1', [oldPoiId]);
                    await client.query('DELETE FROM purchase_order_items WHERE id = $1', [oldPoiId]);
                }
            }

            for (const item of items) {
                const pid = parseInt(item.product_id, 10);
                const costPrice = money(item.cost_price);
                const salePrice = money(item.sale_price);
                const finalSale = money(item.final_sale_price || item.sale_price);
                const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

                if (soldProductMap.has(pid)) {
                    const minAllowed = soldProductMap.get(pid);
                    if (quantity < minAllowed) {
                        await client.query('ROLLBACK');
                        return res.status(400).json({
                            error: `Cannot reduce quantity of product ID ${pid} below ${minAllowed} because it has already been sold. Only price and barcode can be edited.`
                        });
                    }
                }

                totalCost += costPrice * quantity;
                totalSale += finalSale * quantity;
                unitCount += quantity;

                let poiId = item.id ? Number(item.id) : null;

                if (poiId && existingPoiMap.has(poiId)) {
                    const oldQty = Number(existingPoiMap.get(poiId).quantity || 0);
                    const diff = quantity - oldQty;
                    if (diff !== 0) {
                        await client.query(
                            `UPDATE products SET stock = GREATEST(0, COALESCE(stock, 0) + $1), updated_at = NOW() WHERE id = $2`,
                            [diff, pid]
                        );
                        await client.query(
                            `UPDATE stock_levels SET quantity = GREATEST(0, COALESCE(quantity, 0) + $1) WHERE product_id = $2 AND warehouse_id = 1`,
                            [diff, pid]
                        ).catch(() => null);
                    }

                    const itemWarranty = parseInt(item.warranty_months || 0, 10) || 0;
                    let supplierWarrantyExpireDate = null;
                    const baseDateStr = item.expected_date || po.created_at || new Date().toISOString().split('T')[0];
                    if (itemWarranty > 0 && baseDateStr) {
                        const baseDate = new Date(baseDateStr);
                        if (!isNaN(baseDate.getTime())) {
                            const expDate = new Date(baseDate);
                            expDate.setMonth(expDate.getMonth() + itemWarranty);
                            supplierWarrantyExpireDate = expDate.toISOString().split('T')[0];
                        }
                    }

                    await client.query(`
                        UPDATE purchase_order_items 
                        SET cost_price = $1, sale_price = $2, margin_type = $3, margin_value = $4,
                            final_sale_price = $5, line_total = $1::numeric * $6::numeric, quantity = $6,
                            warranty_months = $7, supplier_warranty_expire_date = $8, updated_at = NOW()
                        WHERE id = $9
                    `, [costPrice, salePrice, item.margin_type || 'percent', money(item.margin_value), finalSale, quantity, itemWarranty, supplierWarrantyExpireDate, poiId]);

                    if (Array.isArray(item.serials)) {
                        await client.query('DELETE FROM purchase_order_serials WHERE purchase_order_item_id = $1', [poiId]);
                        for (const serial of item.serials) {
                            const trimmed = String(serial).trim();
                            if (trimmed) {
                                await client.query(
                                    'INSERT INTO purchase_order_serials (purchase_order_item_id, serial_code) VALUES ($1, $2)',
                                    [poiId, trimmed]
                                );
                            }
                        }
                    }
                } else {
                    const itemWarranty = parseInt(item.warranty_months || 0, 10) || 0;
                    let supplierWarrantyExpireDate = null;
                    const baseDateStr = item.expected_date || po.created_at || new Date().toISOString().split('T')[0];
                    if (itemWarranty > 0 && baseDateStr) {
                        const baseDate = new Date(baseDateStr);
                        if (!isNaN(baseDate.getTime())) {
                            const expDate = new Date(baseDate);
                            expDate.setMonth(expDate.getMonth() + itemWarranty);
                            supplierWarrantyExpireDate = expDate.toISOString().split('T')[0];
                        }
                    }

                    const newPoiRes = await client.query(`
                        INSERT INTO purchase_order_items (
                            purchase_order_id, product_id, cost_price, sale_price, margin_type, margin_value,
                            final_sale_price, line_total, quantity, expected_date, warranty_months, supplier_warranty_expire_date, updated_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
                        RETURNING id
                    `, [
                        id, pid, costPrice, salePrice, item.margin_type || 'percent', money(item.margin_value),
                        finalSale, costPrice * quantity, quantity, item.expected_date || new Date(), itemWarranty, supplierWarrantyExpireDate
                    ]);
                    poiId = newPoiRes.rows[0].id;

                    await client.query(
                        `UPDATE products 
                         SET stock = COALESCE(stock, 0) + $1, 
                             purchase_count = COALESCE(purchase_count, 0) + 1,
                             updated_at = NOW() 
                         WHERE id = $2`,
                        [quantity, pid]
                    );
                    await client.query(
                        `INSERT INTO stock_levels (product_id, warehouse_id, quantity)
                         VALUES ($1, 1, $2)
                         ON CONFLICT (product_id, warehouse_id)
                         DO UPDATE SET quantity = stock_levels.quantity + EXCLUDED.quantity`,
                        [pid, quantity]
                    ).catch(() => null);

                    if (Array.isArray(item.serials)) {
                        for (const serial of item.serials) {
                            const trimmed = String(serial).trim();
                            if (trimmed) {
                                await client.query(
                                    'INSERT INTO purchase_order_serials (purchase_order_item_id, serial_code) VALUES ($1, $2)',
                                    [poiId, trimmed]
                                );
                            }
                        }
                    }
                }

                const itemWarranty = parseInt(item.warranty_months || 0, 10) || 0;
                let supplierWarrantyExpireDate = null;
                const baseDateStr = item.expected_date || po.created_at || new Date().toISOString().split('T')[0];
                if (itemWarranty > 0 && baseDateStr) {
                    const baseDate = new Date(baseDateStr);
                    if (!isNaN(baseDate.getTime())) {
                        const expDate = new Date(baseDate);
                        expDate.setMonth(expDate.getMonth() + itemWarranty);
                        supplierWarrantyExpireDate = expDate.toISOString().split('T')[0];
                    }
                }

                await client.query(`
                    UPDATE products 
                    SET purchase_price = $1,
                        selling_price = CASE WHEN $2 > 0 THEN $2 ELSE selling_price END,
                        mrp = CASE WHEN $2 > 0 THEN $2 ELSE mrp END,
                        warranty_months = CASE WHEN $5::int > 0 THEN $5::int ELSE warranty_months END,
                        supplier_warranty_expire_date = COALESCE($6::date, supplier_warranty_expire_date),
                        barcode = CASE WHEN COALESCE(NULLIF(barcode, ''), '') = '' THEN $4 ELSE barcode END,
                        updated_at = NOW()
                    WHERE id = $3
                `, [costPrice, finalSale || salePrice, pid, Array.isArray(item.serials) && item.serials.length > 0 ? String(item.serials[0]).trim() : null, itemWarranty, supplierWarrantyExpireDate]);
            }
        } else {
            totalCost = Number(po.total_cost || 0);
            totalSale = Number(po.total_sale || 0);
            unitCount = Number(po.unit_count || 0);
        }

        const isFullPaidRequested = req.body.is_full_paid === true ||
            String(req.body.status || '').toUpperCase() === 'PAID' ||
            String(req.body.payment_status || '').toLowerCase().includes('paid');

        let paymentsToApply = Array.isArray(req.body.payments) ? [...req.body.payments] : null;

        if (isFullPaidRequested) {
            if (!paymentsToApply || paymentsToApply.length === 0) {
                paymentsToApply = [{
                    payment_method: 'Cash',
                    amount: totalCost,
                    sub_option: 'Drawer',
                    transaction_id: req.body.transaction_reference || po.transaction_reference || 'FULL-PAID'
                }];
            } else {
                const currentSum = paymentsToApply.reduce((sum, p) => sum + money(p.amount), 0);
                if (currentSum < totalCost) {
                    const diff = totalCost - currentSum;
                    paymentsToApply.push({
                        payment_method: 'Cash',
                        amount: diff,
                        sub_option: 'Drawer',
                        transaction_id: req.body.transaction_reference || po.transaction_reference || 'AUTO-FULL-PAID'
                    });
                }
            }
        }

        let totalPaid;
        if (paymentsToApply !== null) {
            const oldPayments = await client.query(
                'SELECT * FROM purchase_order_payments WHERE purchase_order_id = $1 ORDER BY id ASC',
                [id]
            );
            for (const oldPay of oldPayments.rows) {
                await reversePurchasePayment(client, {
                    payment: oldPay,
                    poNumber: po.po_number || id,
                    supplierId: po.supplier_id,
                    ledgerType: 'purchase_payment_reversal',
                    reasonNote: `PO ${po.po_number || id} payment recalculated on edit`,
                });
            }
            await client.query('DELETE FROM purchase_order_payments WHERE purchase_order_id = $1', [id]);
            await client.query('DELETE FROM payments WHERE purchase_id = $1', [id]).catch(() => null);

            let appliedTotal = 0;
            for (const payment of paymentsToApply) {
                appliedTotal += money(await applyPurchasePayment(client, {
                    orderId: id,
                    payment,
                    poNumber: po.po_number || id,
                    supplierId: po.supplier_id,
                    supplierName: po.supplier_name || 'Supplier',
                }));
            }
            totalPaid = money(appliedTotal);
        } else {
            totalPaid = money(po.total_paid);
        }

        const totalDue = isFullPaidRequested ? 0 : Math.max(0, totalCost - totalPaid);
        const poStatus = (totalDue <= 0 || isFullPaidRequested) ? 'PAID' : 'approved';

        await client.query(`
            UPDATE purchase_orders 
            SET transaction_reference = COALESCE($1, transaction_reference),
                extra_cost = COALESCE($2, extra_cost),
                extra_cost_category = COALESCE($3, extra_cost_category),
                extra_cost_notes = COALESCE($4, extra_cost_notes),
                total_cost = $5,
                total_sale = $6,
                total_paid = $7,
                total_due = $8,
                status = $9,
                unit_count = $10,
                updated_at = NOW()
            WHERE id = $11
        `, [
            transaction_reference || null,
            extra_cost !== undefined ? money(extra_cost) : null,
            extra_cost_category || null,
            extra_cost_notes || null,
            totalCost,
            totalSale,
            totalPaid,
            totalDue,
            poStatus,
            unitCount,
            id
        ]);

        const oldDue = money(po.total_due);
        const dueDelta = totalDue - oldDue;
        if (po.supplier_id && dueDelta !== 0) {
            await client.query(
                `UPDATE suppliers
                 SET payable_balance = GREATEST(0, COALESCE(payable_balance, 0) + $1), updated_at = NOW()
                 WHERE id = $2`,
                [dueDelta, po.supplier_id]
            );
        }

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: `Purchase order #${po.po_number || id} updated successfully!`,
            hasSales
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('updateOrder error:', error);
        res.status(500).json({ error: error.message || 'Failed to update purchase order' });
    } finally {
        client.release();
    }
};

module.exports = {
    getAccounts,
    createOrder,
    getOrders,
    getOrderById,
    deleteOrder,
    updateOrder,
    checkSerial,
};
