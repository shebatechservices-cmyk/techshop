const pool = require('../../config/db');
const { ensureWalletSchema, writeWalletLedger, drawerLedgerOnly } = require('../walletController');
const { recordAccountTransaction } = require('../../services/accountLedgerService');

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

// Lock-chain + time-window validation for deleting a sale.
const validateSaleDeletable = async (sale, id, client, options = {}) => {
    const { allowOverride = false } = options;

    if (!allowOverride) {
        const settingsRes = await client.query(
            'SELECT allow_invoice_modification FROM shop_settings WHERE id = 1'
        ).catch(() => ({ rows: [] }));
        if (settingsRes.rows[0]?.allow_invoice_modification === false) {
            return "Invoice deletion is currently disabled by administrative policy.";
        }

        const createdAt = new Date(sale.created_at || Date.now());
        const shiftRes = await client.query(`
            SELECT 1 FROM register_shifts 
            WHERE status = 'closed' AND $1 <= closed_at AND (opened_at IS NULL OR $1 >= opened_at) 
            LIMIT 1
        `, [createdAt]).catch(() => ({ rows: [] }));
        if (shiftRes.rows.length > 0) {
            return "Cannot delete sale: The cash register shift for this invoice has already been closed and audited.";
        }

        const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursOld > 168) {
            return "Delete window (7 days) has expired. Please use the Return/Exchange module instead.";
        }
    }

    if (sale.customer_id) {
        const laterSale = await client.query(
            'SELECT invoice_no FROM sales WHERE customer_id = $1 AND id != $2 AND created_at > (SELECT created_at FROM sales WHERE id = $2) AND deleted_at IS NULL LIMIT 1',
            [sale.customer_id, id]
        ).catch(() => ({ rows: [] }));
        if (laterSale.rows.length > 0) {
            return `Cannot delete sale: Later sales invoice (#${laterSale.rows[0].invoice_no}) has already been recorded for this customer. Only the most recent transaction can be deleted.`;
        }
    }

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

// Full financial reversal for a deleted sale
const reverseSaleFinancials = async (sale, id, client) => {
    let oldTenders = [];
    try {
        oldTenders = Array.isArray(sale.payment_details)
            ? sale.payment_details
            : (typeof sale.payment_details === 'string' ? JSON.parse(sale.payment_details) : []);
    } catch (e) { oldTenders = []; }

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

module.exports = {
    money,
    ensureSalesColumns,
    formatProductFullName,
    normalizeSaleItems,
    validateSerialTracking,
    normalizeAndValidateItems,
    getDrawerAccountId,
    resolvePaymentAccount,
    applySaleTender,
    reverseSaleTender,
    applyTenders,
    depositToDrawer,
    reverseCashFromDrawer,
    validateSaleDeletable,
    reverseSaleFinancials,
};
