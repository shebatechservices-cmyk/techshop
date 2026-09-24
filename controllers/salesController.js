const pool = require('../config/db');
const { ensureWalletSchema, writeWalletLedger, drawerLedgerOnly } = require('./walletController');
const { recordAccountTransaction } = require('../services/accountLedgerService');

const money = (val) => Number.parseFloat(val || 0) || 0;

let salesMigrated = false;
const ensureSalesColumns = async (dbClient = pool) => {
    if (salesMigrated) return;
    try {
        await dbClient.query(`
            ALTER TABLE sales ADD COLUMN IF NOT EXISTS extra_cost NUMERIC(14,2) DEFAULT 0;
            ALTER TABLE sales ADD COLUMN IF NOT EXISTS extra_cost_category VARCHAR(100);
            ALTER TABLE sales ADD COLUMN IF NOT EXISTS extra_cost_notes TEXT;
            ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type VARCHAR(30) DEFAULT 'retail';
            ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_group VARCHAR(30);
            ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
            ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
            ALTER TABLE products ADD COLUMN IF NOT EXISTS is_serial_tracked BOOLEAN DEFAULT false;
            ALTER TABLE sales_items ADD COLUMN IF NOT EXISTS warranty_months INT DEFAULT 0;
            ALTER TABLE sales ADD COLUMN IF NOT EXISTS previous_due NUMERIC(14,2) DEFAULT 0;
            ALTER TABLE sales ADD COLUMN IF NOT EXISTS exchange_from_invoice_no VARCHAR(100);
            ALTER TABLE sales ADD COLUMN IF NOT EXISTS original_sale_id INT;
            ALTER TABLE sales ADD COLUMN IF NOT EXISTS exchange_details JSONB;
            CREATE SEQUENCE IF NOT EXISTS sales_invoice_no_seq START 1000;
        `);
        salesMigrated = true;
    } catch (e) {
        console.warn('Sales table column migration notice:', e.message);
    }
};

// Run eagerly so DDL is never executed inside concurrent write transactions
ensureSalesColumns().catch(() => {});

const formatProductFullName = (p) => {
    if (!p) return 'Product';
    const brand = (p.brand_name || p.brand || '').trim();
    const name = (p.product_name || p.name || '').trim();
    const model = (p.model_name || p.model || '').trim();
    const series = (p.series_name || p.series || '').trim();
    const parts = [];
    if (brand) parts.push(brand);
    if (name) {
        if (brand && name.toLowerCase().startsWith(brand.toLowerCase())) {
            const rest = name.slice(brand.length).trim();
            if (rest) parts.push(rest);
        } else {
            parts.push(name);
        }
    }
    if (model && !parts.join(' ').toLowerCase().includes(model.toLowerCase())) {
        parts.push(model);
    }
    if (series && !parts.join(' ').toLowerCase().includes(series.toLowerCase())) {
        parts.push(series);
    }
    return parts.filter(Boolean).join(' ') || name || 'Product';
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

// Resolve target payment account (checks ID, name/sub_option/payment_mode, or defaults to active Cash Drawer)
const resolvePaymentAccount = async (client, tender) => {
    let targetAccount = null;
    const accountId = tender.account_id ? parseInt(tender.account_id, 10) : null;
    const subOption = String(tender.sub_option || tender.account_name || tender.payment_mode || tender.method || '').trim();

    if (accountId && !isNaN(accountId)) {
        const accRes = await client.query('SELECT * FROM payment_accounts WHERE id = $1', [accountId]);
        if (accRes.rows.length) targetAccount = accRes.rows[0];
    }
    if (!targetAccount && subOption) {
        const accRes = await client.query(
            'SELECT * FROM payment_accounts WHERE LOWER(name) = LOWER($1) OR LOWER(account_number) = LOWER($1) LIMIT 1',
            [subOption]
        );
        if (accRes.rows.length) targetAccount = accRes.rows[0];
    }
    if (!targetAccount && (tender.payment_mode || tender.method)) {
        const mode = tender.payment_mode || tender.method;
        const accRes = await client.query(
            'SELECT * FROM payment_accounts WHERE LOWER(name) ILIKE LOWER($1) OR LOWER(account_type) = LOWER($1) LIMIT 1',
            [`%${mode}%`]
        );
        if (accRes.rows.length) targetAccount = accRes.rows[0];
    }
    if (!targetAccount) {
        // Fallback: primary Cash Drawer
        const drawerRes = await client.query(
            "SELECT * FROM payment_accounts WHERE account_type = 'drawer' OR LOWER(name) LIKE '%drawer%' OR id = 1 ORDER BY (account_type = 'drawer') DESC, id ASC LIMIT 1"
        );
        if (drawerRes.rows.length) targetAccount = drawerRes.rows[0];
    }
    return targetAccount;
};

// Apply a single sale tender: debits customer wallet or credits the resolved payment account (double-entry audit trail)
const applySaleTender = async (client, { customerId, invoiceNo, tender, ledgerType = 'sale_payment' }) => {
    const amt = money(tender.amount || tender.quantity || 0);
    if (amt <= 0) return { type: 'none', amount: 0, account: null };

    const method = String(tender.payment_mode || tender.method || '').toLowerCase();
    if (method === 'wallet') {
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
        return { type: 'wallet', amount: amt, account: null };
    }

    const targetAccount = await resolvePaymentAccount(client, tender);
    if (targetAccount) {
        await recordAccountTransaction(client, {
            accountId: targetAccount.id,
            transactionType: 'credit',
            type: 'deposit',
            amount: amt,
            sourceType: 'pos_sale',
            sourceId: invoiceNo,
            reference: invoiceNo,
            note: `Sale revenue received via ${targetAccount.name || tender.payment_mode || 'Cash'} (Invoice #${invoiceNo})`,
            transactionId: tender.transaction_id || tender.ref_no || null,
        });
    }
    return { type: 'account', amount: amt, account: targetAccount };
};

// Reverse a single sale tender (on sale delete or sale edit)
const reverseSaleTender = async (client, { customerId, invoiceNo, tender, ledgerType = 'sale_refund', reasonNote }) => {
    const amt = money(tender.amount || tender.quantity || 0);
    if (amt <= 0) return;

    const method = String(tender.payment_mode || tender.method || '').toLowerCase();
    if (method === 'wallet') {
        if (customerId) {
            const custWalletRes = await client.query('SELECT wallet_balance FROM customers WHERE id = $1', [customerId]);
            const walletBal = money(custWalletRes.rows[0]?.wallet_balance || 0);
            await client.query('UPDATE customers SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2', [amt, customerId]);
            await writeWalletLedger(client, {
                party_type: 'customer', party_id: Number(customerId), party_name: null,
                type: ledgerType, amount: amt, credit: true,
                account_effect: 'none', cash_drawer_effect: 'none',
                reference: invoiceNo, note: `Wallet refunded from invoice #${invoiceNo} (${reasonNote || 'reversal'})`,
                balance_before: walletBal, balance_after: walletBal + amt,
            });
        }
        return;
    }

    const targetAccount = await resolvePaymentAccount(client, tender);
    if (targetAccount) {
        await recordAccountTransaction(client, {
            accountId: targetAccount.id,
            transactionType: 'debit',
            type: 'refund',
            amount: amt,
            sourceType: 'sale_refund',
            sourceId: invoiceNo,
            reference: invoiceNo,
            note: `Sale invoice #${invoiceNo} ${reasonNote || 'reversal'} — refunded from ${targetAccount.name}`,
            transactionId: tender.transaction_id || tender.ref_no || null,
        });
    }
};

// Apply sale tenders (shared helper)
const applyTenders = async (client, { customerId, invoiceNo, tenders, ledgerType = 'sale_payment' }) => {
    let cashPaid = 0;
    let walletUsed = 0;
    for (const tender of tenders || []) {
        const res = await applySaleTender(client, { customerId, invoiceNo, tender, ledgerType });
        if (res.type === 'wallet') {
            walletUsed += res.amount;
        } else if (res.type === 'account') {
            cashPaid += res.amount;
        }
    }
    return { cashPaid, walletUsed };
};

// Deposit cash into the drawer account and record the account transaction.
const depositToDrawer = async (client, { drawerId, amount, reference, note, type = 'deposit' }) => {
    if (!drawerId || !(amount > 0)) return;
    await recordAccountTransaction(client, {
        accountId: drawerId,
        transactionType: 'credit',
        type,
        amount,
        sourceType: 'pos_sale',
        sourceId: reference,
        reference,
        note,
    });
};

// Reverse cash out of the drawer account (sale delete/edit rollback).
const reverseCashFromDrawer = async (client, { drawerId, amount, reference, note }) => {
    if (!drawerId || !(amount > 0)) return;
    await recordAccountTransaction(client, {
        accountId: drawerId,
        transactionType: 'debit',
        type: 'refund',
        amount,
        sourceType: 'sale_refund',
        sourceId: reference,
        reference,
        note,
    });
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

        // Calculate total paid from payment tenders (split payments)
        // Support both new payment_tenders and old payment_details/paid_amount for backward compatibility
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

        // If no payment tenders, entire amount is due
        const totalDue = tenders.length === 0 ? totalAmount : Math.max(0, totalAmount - totalPaid);
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
                `INSERT INTO sales_items (
                    sale_id, product_id, quantity, unit_price, cost_price, line_total, warranty_expire_date, warranty_months
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING id`,
                [
                    saleId,
                    item.product_id,
                    item.quantity,
                    item.unit_price,
                    item.cost_price,
                    item.line_total,
                    expireDate,
                    warrantyMonths,
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

            // Deduct stock from stock_levels table
            await client.query(
                `UPDATE stock_levels
                 SET quantity = GREATEST(0, quantity - $1)
                 WHERE product_id = $2 AND warehouse_id = 1`,
                [item.quantity, item.product_id]
            ).catch(() => null);
        }

        // Update customer balance & loyalty points
        await client.query(
            `UPDATE customers
             SET receivable_balance = COALESCE(receivable_balance, 0) + $1,
                 loyalty_points = COALESCE(loyalty_points, 0) + $2
             WHERE id = $3`,
            [totalDue, pointsEarned, customer_id]
        );

        // Save payment tender records (split payments) inside the transaction
        // Use payment_tenders if available, otherwise fall back to payment_details
        const paymentRecords = Array.isArray(payment_tenders) && payment_tenders.length > 0
            ? payment_tenders
            : (Array.isArray(payment_details) && payment_details.length > 0 ? payment_details : []);
        for (const tender of paymentRecords) {
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
        }

        // Settlement into payment accounts + customer wallet handling.
        // Process tenders: wallet tenders debit the customer wallet (with a ledger
        // entry); payment account tenders update respective account balances.
        if (paymentRecords.length > 0) {
            const { walletUsed } = await applyTenders(client, {
                customerId: customer_id, invoiceNo, tenders: paymentRecords,
            });
            if (walletUsed > 0) {
                await drawerLedgerOnly(client, 'wallet_settlement', walletUsed, invoiceNo, 'Customer wallet payment for sale (drawer unchanged)');
            }
        } else if (totalPaid > 0) {
            await applySaleTender(client, {
                customerId: customer_id,
                invoiceNo,
                tender: { amount: totalPaid, payment_mode: 'Cash' },
                ledgerType: 'sale_payment',
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
            payment_status: paymentStatus,
            due_amount: totalDue,
            total_paid: totalPaid,
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

// Lock-chain + time-window validation for deleting a sale.
// Returns a rejection message string, or null when deletion is allowed.
const validateSaleDeletable = async (sale, id, client, options = {}) => {
    const { allowOverride = false } = options;

    if (!allowOverride) {
        // Policy: Check if modification is globally allowed
        const settingsRes = await client.query(
            'SELECT allow_invoice_modification FROM shop_settings WHERE id = 1'
        ).catch(() => ({ rows: [] }));
        if (settingsRes.rows[0]?.allow_invoice_modification === false) {
            return "Invoice deletion is currently disabled by administrative policy.";
        }

        // Policy: Check Shift Close
        const createdAt = new Date(sale.created_at || Date.now());
        const shiftRes = await client.query(`
            SELECT 1 FROM register_shifts 
            WHERE status = 'closed' AND $1 <= closed_at AND (opened_at IS NULL OR $1 >= opened_at) 
            LIMIT 1
        `, [createdAt]).catch(() => ({ rows: [] }));
        if (shiftRes.rows.length > 0) {
            return "Cannot delete sale: The cash register shift for this invoice has already been closed and audited.";
        }

        // Time Window Rule: Sales can only be deleted within 7 days (168 hours) of creation
        const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursOld > 168) {
            return "Delete window (7 days) has expired. Please use the Return/Exchange module instead.";
        }
    }

    // Last Action Rule: Sale must be the last active transaction for this customer
    if (sale.customer_id) {
        const laterSale = await client.query(
            'SELECT invoice_no FROM sales WHERE customer_id = $1 AND id != $2 AND created_at > (SELECT created_at FROM sales WHERE id = $2) AND deleted_at IS NULL LIMIT 1',
            [sale.customer_id, id]
        ).catch(() => ({ rows: [] }));
        if (laterSale.rows.length > 0) {
            return `Cannot delete sale: Later sales invoice (#${laterSale.rows[0].invoice_no}) has already been recorded for this customer. Only the most recent transaction can be deleted.`;
        }
    }

    // Lock Chain Rules: warranty claims / customer returns / service projects
    if (sale.invoice_no) {
        const warrantyRes = await client.query(
            'SELECT 1 FROM warranty_claims WHERE invoice_no = $1 AND deleted_at IS NULL LIMIT 1',
            [sale.invoice_no]
        ).catch(() => ({ rows: [] }));
        if (warrantyRes.rows.length > 0) {
            return 'Cannot delete this sale invoice because warranty claims are attached to it.';
        }

        const returnRes = await client.query(
            'SELECT 1 FROM product_returns WHERE invoice_no = $1 AND deleted_at IS NULL LIMIT 1',
            [sale.invoice_no]
        ).catch(() => ({ rows: [] }));
        if (returnRes.rows.length > 0) {
            return 'Cannot delete this sale invoice because customer returns are attached to it.';
        }
    }

    const projectRes = await client.query(
        'SELECT 1 FROM service_projects WHERE (invoice_id = $1::int OR invoice_no = $2) AND deleted_at IS NULL LIMIT 1',
        [Number(id) || 0, sale.invoice_no || '']
    ).catch(() => ({ rows: [] }));
    if (projectRes.rows.length > 0) {
        return 'Cannot delete this sale invoice because a service project is linked to it.';
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

    // a. Restore stock & remove sale items/serials
    const saleItems = await client.query('SELECT * FROM sales_items WHERE sale_id = $1', [id]);
    for (const item of saleItems.rows) {
        await client.query(
            'UPDATE products SET stock = COALESCE(stock, 0) + $1, updated_at = NOW() WHERE id = $2',
            [Number(item.quantity || 0), item.product_id]
        );
        await client.query(
            'UPDATE stock_levels SET quantity = quantity + $1 WHERE product_id = $2 AND warehouse_id = 1',
            [Number(item.quantity || 0), item.product_id]
        ).catch(() => null);
    }
    await client.query('DELETE FROM sales_item_serials WHERE sales_item_id IN (SELECT id FROM sales_items WHERE sale_id = $1)', [id]);
    await client.query('DELETE FROM sales_items WHERE sale_id = $1', [id]);

    // b. Reverse customer balances: due added back & loyalty (refund used, revoke earned)
    const customerId = Number(sale.customer_id);
    if (customerId) {
        const dueRev = money(sale.due_amount);
        if (dueRev !== 0) {
            await client.query(
                'UPDATE customers SET receivable_balance = GREATEST(0, COALESCE(receivable_balance, 0) - $1) WHERE id = $2',
                [dueRev, customerId]
            );
        }
        await ensureWalletSchema(client);
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
    }

    // c. Reverse payment tenders across respective accounts & wallet
    if (oldTenders.length > 0) {
        for (const t of oldTenders) {
            await reverseSaleTender(client, {
                customerId,
                invoiceNo: sale.invoice_no,
                tender: t,
                ledgerType: 'sale_delete_refund',
                reasonNote: 'deleted',
            });
        }
    } else if (money(sale.paid_amount) > 0) {
        await reverseSaleTender(client, {
            customerId,
            invoiceNo: sale.invoice_no,
            tender: { amount: sale.paid_amount, payment_mode: 'Cash' },
            ledgerType: 'sale_delete_refund',
            reasonNote: 'deleted',
        });
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

        // Check for Admin Security PIN override
        const adminPin = req.body?.admin_pin || req.headers?.['x-admin-pin'] || req.query?.admin_pin;
        let allowOverride = false;
        if (adminPin) {
            const pinRes = await client.query('SELECT security_pin FROM shop_settings WHERE id = 1').catch(() => ({ rows: [] }));
            const configuredPin = String(pinRes.rows[0]?.security_pin || '1234');
            if (String(adminPin).trim() === configuredPin) {
                allowOverride = true;
            }
        }

        // 1+2. Time window & lock-chain rules (7-day window; warranty/returns/projects)
        const blocked = await validateSaleDeletable(sale, id, client, { allowOverride });
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

        // Fetch shop_settings for RBAC policy
        const settingsRes = await client.query(
            'SELECT allow_invoice_modification, invoice_edit_time_limit_hours, security_pin FROM shop_settings WHERE id = 1'
        ).catch(() => ({ rows: [] }));
        const shopSettings = settingsRes.rows[0] || {};
        const allowMod = shopSettings.allow_invoice_modification !== false;
        const editLimitHours = shopSettings.invoice_edit_time_limit_hours ?? 360;
        const configuredPin = String(shopSettings.security_pin || '1234');

        const adminPin = req.body?.admin_pin || req.headers?.['x-admin-pin'];
        const isPinValid = adminPin && String(adminPin).trim() === configuredPin;

        // Check Shift Close
        const createdAt = new Date(sale.created_at || Date.now());
        const shiftRes = await client.query(`
            SELECT 1 FROM register_shifts 
            WHERE status = 'closed' AND $1 <= closed_at AND (opened_at IS NULL OR $1 >= opened_at) 
            LIMIT 1
        `, [createdAt]).catch(() => ({ rows: [] }));
        const isShiftClosed = shiftRes.rows.length > 0;

        // Time Window Rule: Editing allowed strictly within limit (default 15 days / 360 hours)
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

        // Lock Chain: cannot edit invoices with warranty/returns/service projects attached
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
        let oldTenders = [];
        try {
            oldTenders = Array.isArray(sale.payment_details)
                ? (typeof sale.payment_details === 'string' ? JSON.parse(sale.payment_details) : sale.payment_details)
                : [];
        } catch (e) { oldTenders = []; }

        // Reverse old payment tenders from respective accounts and wallet
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

        // Apply new tenders
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

// Sale Exchange — creates a new Exchange Invoice, restocks returned items, deducts stock for replacement items, and reconciles balances
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

        // Price difference: Positive means customer owes money; Negative means shop owes refund / credit
        const netDifference = newGrossTotal - returnSubtotal;
        const totalPaid = money(paid_amount);

        // Generate unique Exchange Invoice No
        const nextValRes = await client.query("SELECT nextval('sales_invoice_no_seq') AS next_val");
        const seqVal = nextValRes.rows[0].next_val;
        const invoiceNo = `INV-EXC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(seqVal).padStart(4, '0')}`;

        // Due amount on this exchange invoice
        const invoiceDue = Math.max(0, netDifference - totalPaid);

        // Insert new sale record
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

        // Insert sales_items and sales_item_serials for new items
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

            // Deduct stock for new items
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

        // Adjust customer balance
        if (netDifference > 0) {
            // Customer owes difference; if unpaid, add to receivable balance
            if (invoiceDue > 0) {
                await client.query(
                    `UPDATE customers SET receivable_balance = COALESCE(receivable_balance, 0) + $1, updated_at = NOW() WHERE id = $2`,
                    [invoiceDue, customer_id]
                );
            }
        } else if (netDifference < 0) {
            // Shop owes customer refund/credit
            const excessCredit = Math.abs(netDifference);
            if (totalPaid > 0) {
                // Refund paid out in cash/drawer
                const drawerId = await getDrawerAccountId(client);
                await reverseCashFromDrawer(client, {
                    drawerId,
                    amount: totalPaid,
                    reference: invoiceNo,
                    note: `Exchange refund paid to customer for invoice #${invoiceNo}`
                });
            } else {
                // Credit excess to customer's wallet or reduce existing due
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

        // If customer paid positive amount towards difference
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