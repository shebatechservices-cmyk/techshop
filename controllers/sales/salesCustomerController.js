const pool = require('../../config/db');
const { ensureWalletSchema, writeWalletLedger } = require('../walletController');
const { money, ensureSalesColumns } = require('./salesHelpers');

// ==========================================================
// CUSTOMER MANAGEMENT
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

        const salesCheck = await pool.query('SELECT COUNT(*) FROM sales WHERE customer_id = $1 AND deleted_at IS NULL', [id]);
        const salesCount = parseInt(salesCheck.rows[0].count, 10) || 0;
        if (salesCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete customer: ${salesCount} active sales invoices exist. Records must be preserved.`
            });
        }

        const quoteCheck = await pool.query('SELECT COUNT(*) FROM sales_quotations WHERE customer_id = $1 AND deleted_at IS NULL', [id]);
        const quoteCount = parseInt(quoteCheck.rows[0].count, 10) || 0;
        if (quoteCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete customer: ${quoteCount} sales quotations exist.`
            });
        }

        const projCheck = await pool.query('SELECT COUNT(*) FROM service_projects WHERE customer_id = $1 AND deleted_at IS NULL', [id]).catch(() => ({ rows: [{ count: 0 }] }));
        const projCount = parseInt(projCheck.rows[0].count, 10) || 0;
        if (projCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete customer: ${projCount} service projects are associated with this customer.`
            });
        }

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
