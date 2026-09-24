const pool = require('../config/db');
const { ensureWalletSchema, writeWalletLedger, drawerLedgerOnly } = require('./walletController');

const money = (val) => Number.parseFloat(val || 0) || 0;

let salesMigrated = false;
const ensureSalesColumns = async () => {
    if (salesMigrated) return;
    try {
        await pool.query(`
            ALTER TABLE sales ADD COLUMN IF NOT EXISTS extra_cost NUMERIC(14,2) DEFAULT 0;
            ALTER TABLE sales ADD COLUMN IF NOT EXISTS extra_cost_category VARCHAR(100);
            ALTER TABLE sales ADD COLUMN IF NOT EXISTS extra_cost_notes TEXT;
            ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type VARCHAR(30) DEFAULT 'retail';
            ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_group VARCHAR(30);
            ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
            ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
            ALTER TABLE products ADD COLUMN IF NOT EXISTS is_serial_tracked BOOLEAN DEFAULT false;
            ALTER TABLE sales ADD COLUMN IF NOT EXISTS previous_due NUMERIC(14,2) DEFAULT 0;
            CREATE SEQUENCE IF NOT EXISTS sales_invoice_no_seq START 1000;
        `);
        salesMigrated = true;
    } catch (e) {
        console.warn('Sales table column migration notice:', e.message);
    }
};

// ==========================================================
// Shared sale helpers (used by createSale & updateSale)
// ==========================================================

// Normalize incoming sale items: coerce qty/price/cost, compute line totals.
const normalizeSaleItems = (items) => {
    let calculatedSubtotal = 0;
    const normalizedItems = items.map((it, idx) => {
        const qty = Math.max(1, Number(it.quantity || 1));
        const price = money(it.unit_price);
        const cost = money(it.cost_price);
        const lineTotal = price * qty;
        calculatedSubtotal += lineTotal;
        return {
            ...it,
            quantity: qty,
            unit_price: price,
            cost_price: cost,
            line_total: lineTotal,
            sort_order: idx + 1,
            serials: Array.isArray(it.serials) ? it.serials : [],
        };
    });
    return { normalizedItems, calculatedSubtotal };
};

// Serial/barcode-tracked products must ship with at least one attached
// barcode/serial. Returns the first offending item, or null when all good.
const validateSerialTracking = async (client, normalizedItems) => {
    if (normalizedItems.length === 0) return null;
    const productIds = [...new Set(normalizedItems.map((it) => Number(it.product_id)))];
    const trackedRes = await client.query(
        'SELECT id, is_serial_tracked FROM products WHERE id = ANY($1::int[])',
        [productIds]
    );
    const trackedIds = new Set(
        (trackedRes.rows || []).filter((r) => r.is_serial_tracked).map((r) => Number(r.id))
    );
    return normalizedItems.find(
        (it) => trackedIds.has(Number(it.product_id)) && !(it.serials && it.serials.length > 0)
    ) || null;
};

// Combined helper: normalize items and validate serial-tracked products.
// Returns { normalizedItems, calculatedSubtotal, missingItem }.
const normalizeAndValidateItems = async (items, client) => {
    const { normalizedItems, calculatedSubtotal } = normalizeSaleItems(items);
    const missingItem = await validateSerialTracking(client, normalizedItems);
    return { normalizedItems, calculatedSubtotal, missingItem };
};

const getDrawerAccountId = async (client) => {
    const drawerRes = await client.query("SELECT id FROM payment_accounts WHERE account_type = 'drawer' OR id = 1 LIMIT 1");
    return drawerRes.rows.length ? drawerRes.rows[0].id : null;
};

// Apply sale tenders: wallet tenders debit the customer wallet (with a ledger
// entry); every other tender accumulates as cash. Returns the cash/wallet split.
const applyTenders = async (client, { customerId, invoiceNo, tenders, ledgerType = 'sale_payment' }) => {
    let cashPaid = 0;
    let walletUsed = 0;
    for (const tender of tenders || []) {
        const amt = money(tender.amount);
        if (amt <= 0) continue;
        if (String(tender.method || '').toLowerCase() === 'wallet') {
            const custWalletRes = await client.query('SELECT wallet_balance FROM customers WHERE id = $1', [customerId]);
            const walletBal = money(custWalletRes.rows[0]?.wallet_balance || 0);
            if (walletBal < amt) {
                throw new Error(`Customer wallet has insufficient balance (৳ ${walletBal}) for this wallet payment of ৳ ${amt}. Add a cash tender for the remaining amount.`);
            }
            await client.query('UPDATE customers SET wallet_balance = wallet_balance - $1 WHERE id = $2', [amt, customerId]);
            await writeWalletLedger(client, {
                party_type: 'customer', party_id: Number(customerId), party_name: null,
                type: ledgerType, amount: amt, credit: false,
                account_effect: 'none', cash_drawer_effect: 'none',
                reference: invoiceNo, note: `Product purchase paid from wallet (invoice ${invoiceNo})`,
                balance_before: walletBal, balance_after: walletBal - amt,
            });
            walletUsed += amt;
        } else {
            cashPaid += amt;
        }
    }
    return { cashPaid, walletUsed };
};

// Deposit cash into the drawer account and record the account transaction.
const depositToDrawer = async (client, { drawerId, amount, reference, note, type = 'deposit' }) => {
    if (!drawerId || !(amount > 0)) return;
    await client.query('UPDATE payment_accounts SET balance = balance + $1 WHERE id = $2', [amount, drawerId]);
    await client.query(
        `INSERT INTO account_transactions (account_id, type, amount, reference, note, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [drawerId, type, amount, reference, note]
    );
};

// Reverse cash out of the drawer account (sale delete/edit rollback).
const reverseCashFromDrawer = async (client, { drawerId, amount, reference, note }) => {
    if (!drawerId || !(amount > 0)) return;
    await client.query('UPDATE payment_accounts SET balance = GREATEST(0, balance - $1) WHERE id = $2', [amount, drawerId]);
    await client.query(
        `INSERT INTO account_transactions (account_id, type, amount, reference, note, created_at)
         VALUES ($1, 'refund', $2, $3, $4, NOW())`,
        [drawerId, amount, reference, note]
    );
};

// ==========================================================
// 1. SALES INVOICES & POS
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
            paid_amount: rawPaid = 0,
            payment_method_id = 1,
            payment_details = [],
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
        const totalPaid = money(rawPaid);
        const totalDue = Math.max(0, totalAmount - totalPaid);
        const paymentStatus = totalDue === 0 ? 'paid' : (totalPaid > 0 ? 'partial' : 'unpaid');

        // New points earned (1 point per 100 Tk spent)
        const pointsEarned = Math.floor(totalPaid / 100);

        // Snapshot the customer's existing receivable balance as "previous due"
        // for this invoice (used on the printed inward section).
        const prevDueRes = await client.query(
            'SELECT COALESCE(receivable_balance, 0) AS prev_due FROM customers WHERE id = $1',
            [Number(customer_id)]
        );
        const previousDue = money(rawPreviousDue !== undefined ? rawPreviousDue : prevDueRes.rows[0]?.prev_due);

        // Generate unique invoice number: INV-YYYYMMDD-NNNN from a Postgres
        // sequence, so concurrent sales can never collide.
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const generateInvoiceNo = async () => {
            const seqRes = await client.query("SELECT nextval('sales_invoice_no_seq') AS seq");
            return `INV-${dateStr}-${String(seqRes.rows[0].seq).padStart(4, '0').slice(-4)}`;
        };
        let invoiceNo = await generateInvoiceNo();

        // Insert into sales table (retry on a unique-violation of invoice_no,
        // regenerating the number from the sequence on each attempt)
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
                    JSON.stringify(payment_details),
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
            const expireDate = item.warranty_months && Number(item.warranty_months) > 0
                ? new Date(Date.now() + Number(item.warranty_months) * 30 * 24 * 60 * 60 * 1000)
                : null;

            const savedItem = await client.query(
                `INSERT INTO sales_items (
                    sale_id, product_id, quantity, unit_price, cost_price, line_total, warranty_expire_date
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id`,
                [
                    saleId,
                    item.product_id,
                    item.quantity,
                    item.unit_price,
                    item.cost_price,
                    item.line_total,
                    expireDate,
                ]
            );

            // Record serial numbers if provided
            if (item.serials && item.serials.length > 0) {
                for (const serial of item.serials) {
                    await client.query(
                        'INSERT INTO sales_item_serials (sales_item_id, serial_code) VALUES ($1, $2)',
                        [savedItem.rows[0].id, String(serial).trim()]
                    );
                }
            }

            // Deduct stock from products table
            await client.query(
                `UPDATE products
                 SET stock = GREATEST(0, COALESCE(stock, 0) - $1),
                     updated_at = NOW()
                 WHERE id = $2`,
                [item.quantity, item.product_id]
            );
        }

        // Update customer balance & loyalty points
        await client.query(
            `UPDATE customers
             SET receivable_balance = COALESCE(receivable_balance, 0) + $1,
                 loyalty_points = COALESCE(loyalty_points, 0) + $2
             WHERE id = $3`,
            [totalDue, pointsEarned, customer_id]
        );

        // Settlement into payment accounts + customer wallet handling.
        // Wallet tenders are internal transfers (drawer unchanged, wallet deducted, ledger recorded);
        // all other tenders deposit into the cash drawer / shop account as before.
        if (totalPaid > 0 && payment_details.length > 0) {
            const drawerId = await getDrawerAccountId(client);
            const { cashPaid, walletUsed } = await applyTenders(client, {
                customerId: customer_id, invoiceNo, tenders: payment_details,
            });
            if (walletUsed > 0) {
                await drawerLedgerOnly(client, 'wallet_settlement', walletUsed, invoiceNo, 'Customer wallet payment for sale (drawer unchanged)');
            }
            await depositToDrawer(client, {
                drawerId,
                amount: cashPaid,
                reference: invoiceNo,
                note: walletUsed > 0
                    ? `Sale revenue (৳${cashPaid} paid in cash; ৳${walletUsed} settled from customer wallet)`
                    : `Sale revenue received (incl. setup charge ৳${setupCharge})`,
            });
        } else if (totalPaid > 0) {
            const drawerId = await getDrawerAccountId(client);
            await depositToDrawer(client, {
                drawerId,
                amount: totalPaid,
                reference: invoiceNo,
                note: `Sale revenue received (incl. setup charge ৳${setupCharge})`,
            });
        }

        await client.query('COMMIT');

        return res.status(201).json({
            success: true,
            message: 'Sale completed successfully!',
            data: {
                ...saleResult.rows[0],
                items: normalizedItems,
            },
            invoice_no: invoiceNo,
            points_earned: pointsEarned,
            total_amount: totalAmount,
        });
    } catch (error) {
        await client.query('ROLLBACK').catch(() => null);
        console.error('Create sale error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to complete sale' });
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
                   COALESCE((SELECT SUM(quantity) FROM sales_items WHERE sale_id = s.id), 0) AS unit_count
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
                    c.receivable_balance AS customer_receivable_balance
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
                    COALESCE(p.name, 'Product') AS product_name,
                    b.name AS brand_name,
                    m.name AS model_name,
                    s.name AS series_name,
                    p.sku,
                    p.barcode,
                    p.warranty_months
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

        const items = itemsRes.rows.map((it) => ({
            ...it,
            name: it.product_name,
            full_name: [it.brand_name, it.product_name, it.model_name, it.series_name]
                .filter(Boolean)
                .filter((val, idx, arr) => arr.indexOf(val) === idx)
                .join(' ') || it.product_name,
            serials: serialsByItem[it.id] || [],
        }));

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

// Lock-chain + time-window validation for deleting a sale.
// Returns a rejection message string, or null when deletion is allowed.
const validateSaleDeletable = async (sale, id, client) => {
    // Time Window Rule: Sales can only be deleted within 72 hours of creation
    const createdAt = new Date(sale.created_at || Date.now());
    const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursOld > 72) {
        return `Cannot delete sale: Invoice #${sale.invoice_no || id} was created ${Math.floor(hoursOld)} hours ago. Sales can only be deleted within 72 hours of creation.`;
    }

    // Lock Chain Rules: warranty claims / customer returns / service projects
    const lockChecks = [
        ['SELECT 1 FROM warranty_claims WHERE invoice_no = $1 LIMIT 1',
            'Cannot delete this sale invoice because warranty claims are attached to it.'],
        ['SELECT 1 FROM product_returns WHERE invoice_no = $1 LIMIT 1',
            'Cannot delete this sale invoice because customer returns are attached to it.'],
        ['SELECT 1 FROM service_projects WHERE invoice_id = $1 OR invoice_no = $2 LIMIT 1',
            'Cannot delete this sale invoice because a service project is linked to it.'],
    ];
    for (const [check, message] of lockChecks) {
        const res = await client.query(check, [id, sale.invoice_no]).catch(() => ({ rows: [] }));
        if (res.rows.length > 0) return message;
    }
    return null;
};

// Full financial reversal for a deleted sale: restore stock, remove items &
// serials, reverse customer receivable/loyalty, refund wallet tenders and pull
// cash back out of the drawer.
const reverseSaleFinancials = async (sale, id, client) => {
    let oldTenders = [];
    try {
        oldTenders = Array.isArray(sale.payment_details)
            ? sale.payment_details
            : (typeof sale.payment_details === 'string' ? JSON.parse(sale.payment_details) : []);
    } catch (e) { oldTenders = []; }

    let cashAmt = 0;
    let walletAmt = 0;
    for (const t of oldTenders) {
        const amt = money(t.amount);
        if (amt <= 0) continue;
        if (String(t.method || '').toLowerCase() === 'wallet') walletAmt += amt;
        else cashAmt += amt;
    }

    // a. Restore stock & remove sale items/serials
    const saleItems = await client.query('SELECT * FROM sales_items WHERE sale_id = $1', [id]);
    for (const item of saleItems.rows) {
        await client.query(
            'UPDATE products SET stock = COALESCE(stock, 0) + $1, updated_at = NOW() WHERE id = $2',
            [Number(item.quantity || 0), item.product_id]
        );
    }
    await client.query('DELETE FROM sales_item_serials WHERE sales_item_id IN (SELECT id FROM sales_items WHERE sale_id = $1)', [id]);
    await client.query('DELETE FROM sales_items WHERE sale_id = $1', [id]);

    // b. Reverse customer balances: due added back & loyalty (refund used, revoke earned)
    const customerId = Number(sale.customer_id);
    if (customerId) {
        const dueRev = money(sale.due_amount);
        if (dueRev !== 0) {
            await client.query(
                'UPDATE customers SET receivable_balance = COALESCE(receivable_balance, 0) - $1 WHERE id = $2',
                [dueRev, customerId]
            );
        }
        await ensureWalletSchema();
        if (money(sale.loyalty_points_used) > 0) {
            await client.query(
                'UPDATE customers SET loyalty_points = COALESCE(loyalty_points, 0) + $1 WHERE id = $2',
                [money(sale.loyalty_points_used), customerId]
            );
        }
        if (money(sale.loyalty_points_earned) > 0) {
            await client.query(
                'UPDATE customers SET loyalty_points = GREATEST(0, COALESCE(loyalty_points, 0) - $1) WHERE id = $2',
                [money(sale.loyalty_points_earned), customerId]
            );
        }

        // c. Wallet tender refunded back to customer wallet
        if (walletAmt > 0) {
            const custWalletRes = await client.query('SELECT wallet_balance FROM customers WHERE id = $1', [customerId]);
            const custWallet = money(custWalletRes.rows[0]?.wallet_balance || 0);
            await client.query(
                'UPDATE customers SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2',
                [walletAmt, customerId]
            );
            await writeWalletLedger(client, {
                party_type: 'customer', party_id: customerId, party_name: null,
                type: 'sale_delete_refund', amount: walletAmt, credit: true,
                account_effect: 'none', cash_drawer_effect: 'none',
                reference: sale.invoice_no, note: `Wallet refunded from deleted invoice ${sale.invoice_no}`,
                balance_before: custWallet, balance_after: custWallet + walletAmt,
            });
        }
    }

    // d. Reverse cash tenders from drawer
    if (cashAmt > 0) {
        const drawerId = await getDrawerAccountId(client);
        await reverseCashFromDrawer(client, {
            drawerId,
            amount: cashAmt,
            reference: sale.invoice_no,
            note: `Sale invoice #${sale.invoice_no} deleted — cash reversed from drawer`,
        });
    }
};

exports.deleteSale = async (req, res) => {
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

        // 1+2. Time window & lock-chain rules (24h window; warranty/returns/projects)
        const blocked = await validateSaleDeletable(sale, id, client);
        if (blocked) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: blocked });
        }

        // 3. Full rollback: reverse stock, sale items, customer balances, wallet & cash drawer
        await reverseSaleFinancials(sale, id, client);

        // Soft delete sale into Global Trash
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

// Edit Sale — full invoice edit with stock/serial/payment & wallet reversal (72h window)
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

        // Time Window Rule: Editing allowed strictly within 7 days (168 hours)
        const createdAt = new Date(sale.created_at || Date.now());
        const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursOld > 168) {
            client.release();
            return res.status(400).json({
                success: false,
                message: `Cannot edit sale: Invoice #${sale.invoice_no || id} was created ${Math.floor(hoursOld)} hours ago. Edits are only permitted within 7 days (168 hours) of creation.`
            });
        }

        // Lock Chain: cannot edit invoices with warranty/returns/service projects attached
        for (const [label, check] of [
            ['warranty claims', 'SELECT 1 FROM warranty_claims WHERE invoice_no = $1 LIMIT 1'],
            ['customer returns', 'SELECT 1 FROM product_returns WHERE invoice_no = $1 LIMIT 1'],
            ['service projects', 'SELECT 1 FROM service_projects WHERE invoice_id = $1 OR invoice_no = $2 LIMIT 1'],
        ]) {
            const lockRes = await client.query(check, [id, sale.invoice_no]).catch(() => ({ rows: [] }));
            if (lockRes.rows.length > 0) {
                client.release();
                return res.status(400).json({ success: false, message: `Cannot edit this sale invoice because ${label} are attached to it.` });
            }
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

        await client.query('BEGIN');
        await ensureSalesColumns();
        await ensureWalletSchema();

        const oldItemsRes = await client.query('SELECT * FROM sales_items WHERE sale_id = $1', [id]);
        const oldItems = oldItemsRes.rows;

        // 1. Reverse old stock, remove old serials & items
        for (const oldItem of oldItems) {
            await client.query(
                `UPDATE products SET stock = COALESCE(stock, 0) + $1, updated_at = NOW() WHERE id = $2`,
                [Number(oldItem.quantity || 0), oldItem.product_id]
            );
        }
        await client.query('DELETE FROM sales_item_serials WHERE sales_item_id IN (SELECT id FROM sales_items WHERE sale_id = $1)', [id]);
        await client.query('DELETE FROM sales_items WHERE sale_id = $1', [id]);

        // 2. Recompute finance (normalize items & enforce serial-tracking rule)
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
            // refund previously used points, then apply what this edit asks for
            await client.query('UPDATE customers SET loyalty_points = COALESCE(loyalty_points, 0) + $1 WHERE id = $2', [previouslyUsed, Number(customer_id)]);
            await client.query('UPDATE customers SET loyalty_points = COALESCE(loyalty_points, 0) - $1 WHERE id = $2', [loyaltyToUse, Number(customer_id)]);
            discountFromLoyalty = loyaltyToUse;
        } else if (money(sale.loyalty_points_used || 0) > 0) {
            // user removed loyalty usage → refund points
            await client.query('UPDATE customers SET loyalty_points = COALESCE(loyalty_points, 0) + $1 WHERE id = $2', [money(sale.loyalty_points_used), Number(customer_id)]);
        }

        const totalAmount = Math.max(0, subtotal - discount - discountFromLoyalty + vat + setupCharge + extraCost);
        const totalPaid = money(rawPaid);
        const totalDue = Math.max(0, totalAmount - totalPaid);
        const paymentStatus = totalDue === 0 ? 'paid' : (totalPaid > 0 ? 'partial' : 'unpaid');
        const pointsEarned = Math.floor(totalPaid / 100);
        const oldPointsEarned = money(sale.loyalty_points_earned || 0);

        // 3. Insert new items, serials, deduct stock (mirror create)
        for (const item of normalizedItems) {
            const expireDate = item.warranty_months && Number(item.warranty_months) > 0
                ? new Date(Date.now() + Number(item.warranty_months) * 30 * 24 * 60 * 60 * 1000)
                : null;
            const savedItem = await client.query(
                `INSERT INTO sales_items (sale_id, product_id, quantity, unit_price, cost_price, line_total, warranty_expire_date)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [Number(id), item.product_id, item.quantity, item.unit_price, item.cost_price, item.line_total, expireDate]
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
        }

        // 4. Customer balances: due delta & loyalty earned delta
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
        const tenderList = Array.isArray(payment_details) ? payment_details.filter((t) => money(t.amount) > 0) : [];
        const newTenderList = tenderList.length > 0 ? tenderList : [];
        let oldWalletAmt = 0;
        let oldCashAmt = 0;
        const oldCustWalletRes = await client.query('SELECT wallet_balance FROM customers WHERE id = $1', [Number(customer_id)]);
        let custWallet = money(oldCustWalletRes.rows[0]?.wallet_balance || 0);

        const reverseOldPayments = async () => {
            const oldTenders = Array.isArray(sale.payment_details)
                ? (typeof sale.payment_details === 'string' ? JSON.parse(sale.payment_details) : sale.payment_details)
                : [];
            for (const t of oldTenders) {
                const amt = money(t.amount);
                if (amt <= 0) continue;
                if (String(t.method || '').toLowerCase() === 'wallet') {
                    custWallet += amt;
                    await client.query('UPDATE customers SET wallet_balance = wallet_balance + $1 WHERE id = $2', [amt, Number(customer_id)]);
                    await writeWalletLedger(client, {
                        party_type: 'customer', party_id: Number(customer_id), party_name: null,
                        type: 'sale_edit_refund', amount: amt, credit: true,
                        account_effect: 'none', cash_drawer_effect: 'none',
                        reference: sale.invoice_no, note: `Wallet refunded from edited invoice ${sale.invoice_no}`,
                        balance_before: custWallet - amt, balance_after: custWallet,
                    });
                    oldWalletAmt += amt;
                } else {
                    oldCashAmt += amt;
                }
            }
        };

        const drawerId = await getDrawerAccountId(client);
        await reverseOldPayments();

        if (oldCashAmt > 0) {
            await reverseCashFromDrawer(client, {
                drawerId,
                amount: oldCashAmt,
                reference: sale.invoice_no,
                note: `Sale invoice #${sale.invoice_no} edited — cash reversed from drawer`,
            });
        }

        // Apply new tenders (wallet tenders debit the customer wallet via shared helper)
        const { cashPaid } = await applyTenders(client, {
            customerId: customer_id, invoiceNo: sale.invoice_no, tenders: newTenderList,
        });

        if (drawerId) {
            if (cashPaid > 0) {
                await client.query('UPDATE payment_accounts SET balance = balance + $1 WHERE id = $2', [cashPaid, drawerId]);
            }
            // Net drawer movement = cashPaid - oldCashAmt (double-entry correct)
            const netDrawerDelta = cashPaid - oldCashAmt;
            await client.query(
                `INSERT INTO account_transactions (account_id, type, amount, reference, note, created_at)
                 VALUES ($1, 'edit_adjustment', $2, $3, $4, NOW())`,
                [drawerId, netDrawerDelta, sale.invoice_no,
                 `Sale invoice edited: net drawer change ৳${netDrawerDelta} (reversed ${oldCashAmt} cash, re-deposited ${cashPaid} cash)${newTenderList.some((t) => String(t.method || '').toLowerCase() === 'wallet') ? ' + wallet settlement' : ''}`]
            );
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
                JSON.stringify(newTenderList),
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

// ==========================================================
// 2. SALES QUOTATIONS
// ==========================================================

exports.getQuotations = async (_req, res) => {
    try {
        const query = `
            SELECT sq.*,
                   COALESCE((SELECT COUNT(*) FROM sales_quotation_items WHERE quotation_id = sq.id), 0) AS item_count,
                   COALESCE((SELECT SUM(quantity) FROM sales_quotation_items WHERE quotation_id = sq.id), 0) AS unit_count
            FROM sales_quotations sq
            WHERE sq.deleted_at IS NULL
            ORDER BY sq.id DESC;
        `;
        const result = await pool.query(query);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get quotations error:', error);
        return res.status(500).json({ success: false, message: error.message, data: [] });
    }
};

exports.getQuotationById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const quoteRes = await pool.query('SELECT * FROM sales_quotations WHERE id = $1', [id]);
        if (!quoteRes.rows.length) {
            return res.status(404).json({ success: false, message: 'Quotation not found' });
        }
        const quote = quoteRes.rows[0];

        const itemsRes = await pool.query(
            `SELECT sqi.*, b.name AS brand_name, p.sku, p.barcode
             FROM sales_quotation_items sqi
             LEFT JOIN products p ON p.id = sqi.product_id
             LEFT JOIN brands b ON b.id = p.brand_id
             WHERE sqi.quotation_id = $1
             ORDER BY sqi.id ASC`,
            [id]
        );

        return res.status(200).json({
            success: true,
            data: {
                ...quote,
                items: itemsRes.rows,
            },
        });
    } catch (error) {
        console.error('Get quotation by id error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.createQuotation = async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            customer_id,
            customer_name,
            customer_phone,
            customer_address,
            valid_until,
            notes,
            items = [],
            discount: rawDiscount = 0,
            vat: rawVat = 0,
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Please add at least one product item to the quotation' });
        }

        await client.query('BEGIN');

        let subtotal = 0;
        const normalizedItems = items.map((it) => {
            const qty = Math.max(1, Number(it.quantity || 1));
            const price = money(it.unit_price);
            const lineTotal = qty * price;
            subtotal += lineTotal;
            return {
                product_id: it.product_id || null,
                product_name: it.product_name || it.name || 'Product',
                quantity: qty,
                unit_price: price,
                line_total: lineTotal,
                warranty_months: Number(it.warranty_months || 0),
            };
        });

        const discount = money(rawDiscount);
        const vat = money(rawVat);
        const totalAmount = Math.max(0, subtotal - discount + vat);

        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const quotationNo = `QTN-${dateStr}-${randomSuffix}`;

        const quoteRes = await client.query(
            `INSERT INTO sales_quotations (
                quotation_no, customer_id, customer_name, customer_phone, customer_address,
                subtotal, discount, vat, total_amount, status, valid_until, notes, created_at, updated_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, $11, NOW(), NOW())
             RETURNING *`,
            [
                quotationNo,
                customer_id ? Number(customer_id) : null,
                customer_name || 'Valued Customer',
                customer_phone || '',
                customer_address || '',
                subtotal,
                discount,
                vat,
                totalAmount,
                valid_until || null,
                notes || '',
            ]
        );
        const quoteId = quoteRes.rows[0].id;

        for (const item of normalizedItems) {
            await client.query(
                `INSERT INTO sales_quotation_items (
                    quotation_id, product_id, product_name, quantity, unit_price, line_total, warranty_months
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    quoteId,
                    item.product_id,
                    item.product_name,
                    item.quantity,
                    item.unit_price,
                    item.line_total,
                    item.warranty_months,
                ]
            );
        }

        await client.query('COMMIT');
        return res.status(201).json({
            success: true,
            message: 'Quotation created successfully!',
            data: {
                ...quoteRes.rows[0],
                items: normalizedItems,
            },
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create quotation error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to create quotation' });
    } finally {
        client.release();
    }
};

exports.updateQuotation = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const {
            customer_id,
            customer_name,
            customer_phone,
            customer_address,
            valid_until,
            notes,
            items = [],
            discount: rawDiscount = 0,
            vat: rawVat = 0,
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Please add at least one product item to the quotation' });
        }

        const existing = await pool.query('SELECT id FROM sales_quotations WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Quotation not found' });
        }

        await client.query('BEGIN');

        let subtotal = 0;
        const normalizedItems = items.map((it) => {
            const qty = Math.max(1, Number(it.quantity || 1));
            const price = money(it.unit_price);
            const lineTotal = qty * price;
            subtotal += lineTotal;
            return {
                product_id: it.product_id || null,
                product_name: it.product_name || it.name || 'Product',
                quantity: qty,
                unit_price: price,
                line_total: lineTotal,
                warranty_months: Number(it.warranty_months || 0),
            };
        });

        const discount = money(rawDiscount);
        const vat = money(rawVat);
        const totalAmount = Math.max(0, subtotal - discount + vat);

        const quoteRes = await client.query(
            `UPDATE sales_quotations SET
                customer_id = $1, customer_name = $2, customer_phone = $3, customer_address = $4,
                subtotal = $5, discount = $6, vat = $7, total_amount = $8,
                valid_until = $9, notes = $10, updated_at = NOW()
             WHERE id = $11
             RETURNING *`,
            [
                customer_id ? Number(customer_id) : null,
                customer_name || 'Valued Customer',
                customer_phone || '',
                customer_address || '',
                subtotal,
                discount,
                vat,
                totalAmount,
                valid_until || null,
                notes || '',
                id,
            ]
        );

        await client.query('DELETE FROM sales_quotation_items WHERE quotation_id = $1', [id]);
        for (const item of normalizedItems) {
            await client.query(
                `INSERT INTO sales_quotation_items (
                    quotation_id, product_id, product_name, quantity, unit_price, line_total, warranty_months
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    id,
                    item.product_id,
                    item.product_name,
                    item.quantity,
                    item.unit_price,
                    item.line_total,
                    item.warranty_months,
                ]
            );
        }

        await client.query('COMMIT');
        return res.status(200).json({
            success: true,
            message: 'Quotation updated successfully!',
            data: {
                ...quoteRes.rows[0],
                items: normalizedItems,
            },
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update quotation error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to update quotation' });
    } finally {
        client.release();
    }
};

exports.deleteQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const qRes = await pool.query('SELECT * FROM sales_quotations WHERE id = $1', [id]);
        if (qRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Quotation not found' });
        }
        const quote = qRes.rows[0];

        await pool.query('UPDATE sales_quotations SET deleted_at = NOW() WHERE id = $1', [id]);
        await pool.query(`
            INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
            VALUES ('sales_quotations', $1, $2, $3, NOW())
        `, [id, `Quote #${quote.quotation_no || id}`, JSON.stringify(quote)]).catch(() => null);

        return res.status(200).json({ success: true, message: `Quotation #${quote.quotation_no || id} moved to Trash successfully` });
    } catch (error) {
        console.error('Delete quotation error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateQuotationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid quotation status' });
        }
        const updateRes = await pool.query(
            'UPDATE sales_quotations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (!updateRes.rows.length) {
            return res.status(404).json({ success: false, message: 'Quotation not found' });
        }
        return res.status(200).json({ success: true, message: `Quotation status changed to ${status}`, data: updateRes.rows[0] });
    } catch (error) {
        console.error('Update quotation status error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================================
// 3. CUSTOMER MANAGEMENT
// ==========================================================

exports.getCustomers = async (_req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.*,
                    COALESCE((SELECT COUNT(*) FROM sales WHERE customer_id = c.id AND deleted_at IS NULL), 0) AS total_sales_count,
                    COALESCE((SELECT SUM(total_amount) FROM sales WHERE customer_id = c.id AND deleted_at IS NULL), 0) AS total_purchased_amount
             FROM customers c
             WHERE c.deleted_at IS NULL
             ORDER BY c.id DESC;`
        );
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get customers error:', error);
        return res.status(500).json({ success: false, message: error.message, data: [] });
    }
};

exports.createCustomer = async (req, res) => {
    try {
        const { name, phone, email, address, customer_type = 'retail', receivable_balance = 0, opening_wallet_balance = 0 } = req.body;
        if (!name || !phone) {
            return res.status(400).json({ success: false, message: 'Customer name and phone number are required' });
        }
        const openingWallet = money(opening_wallet_balance);
        if (openingWallet < 0) {
            return res.status(400).json({ success: false, message: 'Opening wallet balance cannot be negative' });
        }

        // Check duplicate phone
        const existing = await pool.query('SELECT id FROM customers WHERE phone = $1 AND deleted_at IS NULL', [phone]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'A customer with this phone number already exists' });
        }

        await ensureWalletSchema();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await client.query(
                `INSERT INTO customers (name, phone, email, address, customer_type, receivable_balance, wallet_balance, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                 RETURNING *;`,
                [name.trim(), phone.trim(), email ? email.trim() : null, address ? address.trim() : null, customer_type, money(receivable_balance), openingWallet]
            );
            const customer = result.rows[0];
            if (openingWallet > 0) {
                await writeWalletLedger(client, {
                    party_type: 'customer',
                    party_id: customer.id,
                    party_name: customer.name,
                    type: 'opening_balance',
                    amount: openingWallet,
                    credit: true,
                    account_effect: 'none',
                    cash_drawer_effect: 'none',
                    reference: 'opening_balance',
                    note: 'Opening wallet balance at customer registration',
                    balance_before: 0,
                    balance_after: openingWallet,
                });
            }
            await client.query('COMMIT');
            return res.status(201).json({
                success: true,
                message: 'Customer registered successfully',
                data: customer,
            });
        } catch (e2) {
            await client.query('ROLLBACK');
            throw e2;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Create customer error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to create customer' });
    }
};

exports.getCustomerSummary = async (req, res) => {
    try {
        await ensureWalletSchema();
        const id = Number(req.params.id);
        const custRes = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
        if (!custRes.rows.length) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        const customer = custRes.rows[0];

        const recentSales = await pool.query(
            `SELECT id, invoice_no, total_amount, paid_amount, due_amount, payment_status, created_at
             FROM sales
             WHERE customer_id = $1 AND deleted_at IS NULL
             ORDER BY id DESC LIMIT 5;`,
            [id]
        );

        return res.status(200).json({
            success: true,
            customer,
            wallet: {
                balance: money(customer.wallet_balance || 0),
            },
            recent_sales: recentSales.rows,
        });
    } catch (error) {
        console.error('Get customer summary error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const custRes = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
        if (!custRes.rows.length) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        const customer = custRes.rows[0];

        // 1. Lock Chain: Sales invoices
        const salesCheck = await pool.query('SELECT COUNT(*) FROM sales WHERE customer_id = $1 AND deleted_at IS NULL', [id]);
        const salesCount = parseInt(salesCheck.rows[0].count, 10) || 0;
        if (salesCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete customer: ${salesCount} active sales invoices exist. Records must be preserved.`
            });
        }

        // 2. Lock Chain: Quotations
        const quoteCheck = await pool.query('SELECT COUNT(*) FROM sales_quotations WHERE customer_id = $1 AND deleted_at IS NULL', [id]);
        const quoteCount = parseInt(quoteCheck.rows[0].count, 10) || 0;
        if (quoteCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete customer: ${quoteCount} sales quotations exist.`
            });
        }

        // 3. Lock Chain: Service projects
        const projCheck = await pool.query('SELECT COUNT(*) FROM service_projects WHERE customer_id = $1 AND deleted_at IS NULL', [id]).catch(() => ({ rows: [{ count: 0 }] }));
        const projCount = parseInt(projCheck.rows[0].count, 10) || 0;
        if (projCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete customer: ${projCount} service projects are associated with this customer.`
            });
        }

        // 4. Lock Chain: Non-zero receivable balance
        const balance = Math.abs(parseFloat(customer.receivable_balance || 0));
        if (balance > 0.01) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete customer: Active receivable balance of ৳ ${customer.receivable_balance} must be cleared first.`
            });
        }

        await pool.query('UPDATE customers SET deleted_at = NOW() WHERE id = $1', [id]);
        await pool.query(`
            INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
            VALUES ('customers', $1, $2, $3, NOW())
        `, [id, customer.name || `Customer #${id}`, JSON.stringify(customer)]).catch(() => null);

        return res.status(200).json({ success: true, message: `Customer "${customer.name}" moved to Trash successfully!` });
    } catch (error) {
        console.error('Delete customer error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateCustomerGroup = async (req, res) => {
    try {
        await ensureSalesColumns();
        const id = Number(req.params.id);
        const { customer_type, customer_group } = req.body;
        const group = String(customer_type || customer_group || 'Regular').trim();

        const result = await pool.query(
            `UPDATE customers
             SET customer_type = $1, updated_at = NOW()
             WHERE id = $2 AND deleted_at IS NULL
             RETURNING *;`,
            [group, id]
        );
        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        return res.status(200).json({ success: true, message: 'Customer group updated', data: result.rows[0] });
    } catch (error) {
        console.error('Update customer group error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        await ensureSalesColumns();
        const id = Number(req.params.id);
        const { name, phone, email, address, customer_type, customer_group, receivable_balance } = req.body;
        const group = customer_type || customer_group ? String(customer_type || customer_group).trim() : null;

        const result = await pool.query(
            `UPDATE customers
             SET name = COALESCE($1, name),
                 phone = COALESCE($2, phone),
                 email = COALESCE($3, email),
                 address = COALESCE($4, address),
                 customer_type = COALESCE($5, customer_type),
                 receivable_balance = CASE WHEN $6::numeric IS NOT NULL THEN $6::numeric ELSE receivable_balance END,
                 updated_at = NOW()
             WHERE id = $7 AND deleted_at IS NULL
             RETURNING *;`,
            [name ? name.trim() : null, phone ? phone.trim() : null, email ? email.trim() : null, address ? address.trim() : null, group, receivable_balance !== undefined ? money(receivable_balance) : null, id]
        );

        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        return res.status(200).json({ success: true, message: 'Customer updated successfully', data: result.rows[0] });
    } catch (error) {
        console.error('Update customer error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};