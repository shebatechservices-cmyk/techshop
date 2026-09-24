const pool = require('../config/db');
const { ensureWalletSchema, writeWalletLedger } = require('./walletController');

// 1. GET ALL PARTIES (Customers, Suppliers, Staff) WITH SEARCH & PAGINATION (20 PER PAGE)
exports.getParties = async (req, res) => {
    try {
        const { type = 'all', search = '', page = 1, limit = 20 } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, parseInt(limit) || 20);
        const offset = (pageNum - 1) * limitNum;
        const searchPattern = `%${search.trim()}%`;

        // Query components
        const params = [];
        let paramIdx = 1;

        // A. Customers query
        const customerSelect = `
            SELECT 
                'customer' AS party_type,
                c.id,
                c.name,
                COALESCE(c.phone, '') AS phone,
                COALESCE(c.email, '') AS email,
                COALESCE(c.address, '') AS address,
                COALESCE(c.customer_type, 'Retail') AS role_or_type,
                COALESCE(c.receivable_balance, 0)::NUMERIC AS balance,
                c.created_at,
                (
                    (SELECT COUNT(*) FROM sales s WHERE s.customer_id = c.id) +
                    (SELECT COUNT(*) FROM sales_quotations sq WHERE sq.customer_id = c.id)
                )::INT AS activity_count
            FROM customers c
            WHERE c.deleted_at IS NULL
        `;

        // B. Suppliers query
        const supplierSelect = `
            SELECT 
                'supplier' AS party_type,
                s.id,
                s.name,
                COALESCE(s.phone, s.mobile, '') AS phone,
                COALESCE(s.email, '') AS email,
                COALESCE(s.address, '') AS address,
                COALESCE(s.contact_person, 'Vendor') AS role_or_type,
                COALESCE(s.payable_balance, 0)::NUMERIC AS balance,
                s.created_at,
                (
                    (SELECT COUNT(*) FROM purchase_orders po WHERE po.supplier_id = s.id) +
                    (SELECT COUNT(*) FROM purchase_quotations pq WHERE pq.supplier_id = s.id)
                )::INT AS activity_count
            FROM suppliers s
            WHERE s.deleted_at IS NULL
        `;

        // C. Staff query
        const staffSelect = `
            SELECT 
                'staff' AS party_type,
                u.id,
                u.name,
                COALESCE(u.phone, '') AS phone,
                COALESCE(u.email, '') AS email,
                '' AS address,
                COALESCE(r.name, 'Staff') AS role_or_type,
                0::NUMERIC AS balance,
                u.created_at,
                (
                    SELECT COUNT(*) FROM sales s WHERE s.sales_person = u.name
                )::INT AS activity_count
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.deleted_at IS NULL
        `;

        let unions = [];
        if (type === 'customer') {
            unions.push(customerSelect);
        } else if (type === 'supplier') {
            unions.push(supplierSelect);
        } else if (type === 'staff') {
            unions.push(staffSelect);
        } else {
            unions.push(customerSelect, supplierSelect, staffSelect);
        }

        const combinedQuery = `(${unions.join(' UNION ALL ')}) AS parties`;

        // Where condition for search
        let whereClause = '';
        if (search.trim()) {
            whereClause = ` WHERE name ILIKE $${paramIdx} OR phone ILIKE $${paramIdx} OR email ILIKE $${paramIdx} OR role_or_type ILIKE $${paramIdx}`;
            params.push(searchPattern);
            paramIdx++;
        }

        // Count total
        const countSql = `SELECT COUNT(*) FROM ${combinedQuery} ${whereClause}`;
        const countRes = await pool.query(countSql, params);
        const total = parseInt(countRes.rows[0].count) || 0;

        // Fetch paginated records
        const dataSql = `
            SELECT * FROM ${combinedQuery} ${whereClause}
            ORDER BY created_at DESC, id DESC
            LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
        `;
        const dataRes = await pool.query(dataSql, [...params, limitNum, offset]);

        // Fetch summary totals
        const custCount = await pool.query("SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL");
        const suppCount = await pool.query("SELECT COUNT(*) FROM suppliers WHERE deleted_at IS NULL");
        const staffCount = await pool.query("SELECT COUNT(*) FROM users WHERE deleted_at IS NULL");

        return res.status(200).json({
            success: true,
            data: dataRes.rows,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.max(1, Math.ceil(total / limitNum))
            },
            counts: {
                total: parseInt(custCount.rows[0].count) + parseInt(suppCount.rows[0].count) + parseInt(staffCount.rows[0].count),
                customer: parseInt(custCount.rows[0].count),
                supplier: parseInt(suppCount.rows[0].count),
                staff: parseInt(staffCount.rows[0].count)
            }
        });
    } catch (error) {
        console.error('getParties error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2. GET DETAILED PROFILE & LEDGER FOR A PARTY
exports.getPartyProfile = async (req, res) => {
    try {
        const { type, id } = req.params;
        const partyId = parseInt(id);
        if (!partyId) return res.status(400).json({ success: false, message: 'Invalid party ID' });

        if (type === 'customer') {
            const custRes = await pool.query('SELECT * FROM customers WHERE id = $1', [partyId]);
            if (!custRes.rows.length) return res.status(404).json({ success: false, message: 'Customer not found' });
            const customer = custRes.rows[0];

            // Recent sales
            const salesRes = await pool.query(`
                SELECT id, invoice_no, total_amount, paid_amount, due_amount, payment_status, created_at
                FROM sales 
                WHERE customer_id = $1 
                ORDER BY id DESC LIMIT 15
            `, [partyId]);

            // Recent quotations
            const quotesRes = await pool.query(`
                SELECT id, quotation_no, total_amount, status, created_at
                FROM sales_quotations
                WHERE customer_id = $1
                ORDER BY id DESC LIMIT 10
            `, [partyId]);

            // Recent ledger transactions
            const txRes = await pool.query(`
                SELECT t.*, a.name AS account_name
                FROM account_transactions t
                LEFT JOIN payment_accounts a ON t.account_id = a.id
                WHERE t.reference LIKE $1 OR t.note LIKE $1
                ORDER BY t.id DESC LIMIT 15
            `, [`%Customer ID: ${partyId}%`]);

            // Overall stats
            const statsRes = await pool.query(`
                SELECT 
                    COUNT(*) AS total_invoices,
                    COALESCE(SUM(total_amount), 0) AS lifetime_purchases,
                    COALESCE(SUM(paid_amount), 0) AS lifetime_paid,
                    COALESCE(SUM(due_amount), 0) AS total_due
                FROM sales
                WHERE customer_id = $1
            `, [partyId]);

            const activityCount = parseInt(statsRes.rows[0].total_invoices) + quotesRes.rows.length + txRes.rows.length;

            return res.status(200).json({
                success: true,
                party_type: 'customer',
                profile: {
                    id: customer.id,
                    name: customer.name,
                    phone: customer.phone,
                    email: customer.email,
                    address: customer.address,
                    customer_type: customer.customer_type || 'Retail',
                    balance: parseFloat(customer.receivable_balance || 0),
                    loyalty_points: parseInt(customer.loyalty_points || 0),
                    created_at: customer.created_at,
                    activity_count: activityCount
                },
                stats: statsRes.rows[0],
                sales: salesRes.rows,
                quotations: quotesRes.rows,
                transactions: txRes.rows
            });

        } else if (type === 'supplier') {
            const suppRes = await pool.query('SELECT * FROM suppliers WHERE id = $1', [partyId]);
            if (!suppRes.rows.length) return res.status(404).json({ success: false, message: 'Supplier not found' });
            const supplier = suppRes.rows[0];

            // Recent POs
            const poRes = await pool.query(`
                SELECT id, po_number, total_cost, total_paid, total_due, status, created_at
                FROM purchase_orders 
                WHERE supplier_id = $1 
                ORDER BY id DESC LIMIT 15
            `, [partyId]);

            // Recent PO quotations
            const quotesRes = await pool.query(`
                SELECT id, quotation_no, total_amount AS total_cost, status, created_at
                FROM purchase_quotations
                WHERE supplier_id = $1
                ORDER BY id DESC LIMIT 10
            `, [partyId]);

            // Recent ledger transactions
            const txRes = await pool.query(`
                SELECT t.*, a.name AS account_name
                FROM account_transactions t
                LEFT JOIN payment_accounts a ON t.account_id = a.id
                WHERE t.reference LIKE $1 OR t.note LIKE $1
                ORDER BY t.id DESC LIMIT 15
            `, [`%Supplier ID: ${partyId}%`]);

            // Overall stats
            const statsRes = await pool.query(`
                SELECT 
                    COUNT(*) AS total_pos,
                    COALESCE(SUM(total_cost), 0) AS lifetime_orders,
                    COALESCE(SUM(total_paid), 0) AS lifetime_paid,
                    COALESCE(SUM(total_due), 0) AS total_due
                FROM purchase_orders
                WHERE supplier_id = $1
            `, [partyId]);

            const activityCount = parseInt(statsRes.rows[0].total_pos) + quotesRes.rows.length + txRes.rows.length;

            return res.status(200).json({
                success: true,
                party_type: 'supplier',
                profile: {
                    id: supplier.id,
                    name: supplier.name,
                    phone: supplier.phone || supplier.mobile,
                    email: supplier.email,
                    address: supplier.address,
                    contact_person: supplier.contact_person || 'Vendor',
                    balance: parseFloat(supplier.payable_balance || 0),
                    created_at: supplier.created_at,
                    activity_count: activityCount
                },
                stats: statsRes.rows[0],
                purchase_orders: poRes.rows,
                quotations: quotesRes.rows,
                transactions: txRes.rows
            });

        } else if (type === 'staff') {
            const userRes = await pool.query(`
                SELECT u.id, u.name, u.phone, u.email, u.role_id, u.is_active, u.created_at, r.name AS role_name
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.id = $1
            `, [partyId]);
            if (!userRes.rows.length) return res.status(404).json({ success: false, message: 'Staff member not found' });
            const staff = userRes.rows[0];

            // Sales recorded by this staff
            const salesRes = await pool.query(`
                SELECT id, invoice_no, total_amount, paid_amount, payment_status, created_at
                FROM sales
                WHERE sales_person = $1
                ORDER BY id DESC LIMIT 15
            `, [staff.name]);

            const statsRes = await pool.query(`
                SELECT 
                    COUNT(*) AS total_sales,
                    COALESCE(SUM(total_amount), 0) AS total_sales_volume
                FROM sales
                WHERE sales_person = $1
            `, [staff.name]);

            return res.status(200).json({
                success: true,
                party_type: 'staff',
                profile: {
                    id: staff.id,
                    name: staff.name,
                    phone: staff.phone,
                    email: staff.email,
                    role_id: staff.role_id,
                    role_name: staff.role_name || 'Staff',
                    is_active: staff.is_active,
                    created_at: staff.created_at,
                    balance: 0,
                    activity_count: parseInt(statsRes.rows[0].total_sales)
                },
                stats: statsRes.rows[0],
                sales: salesRes.rows
            });
        } else {
            return res.status(400).json({ success: false, message: 'Unsupported party type' });
        }
    } catch (error) {
        console.error('getPartyProfile error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 3. IN-PLACE PROFILE EDIT
exports.updatePartyProfile = async (req, res) => {
    try {
        const { type, id } = req.params;
        const partyId = parseInt(id);
        const { name, phone, email, address, role_or_type, role_id } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }

        if (type === 'customer') {
            const result = await pool.query(`
                UPDATE customers 
                SET name = $1, phone = $2, email = $3, address = $4, customer_type = $5
                WHERE id = $6
                RETURNING *
            `, [name.trim(), phone || '', email || '', address || '', role_or_type || 'Retail', partyId]);
            if (!result.rows.length) return res.status(404).json({ success: false, message: 'Customer not found' });
            return res.status(200).json({ success: true, message: 'Customer profile updated successfully', data: result.rows[0] });

        } else if (type === 'supplier') {
            const result = await pool.query(`
                UPDATE suppliers
                SET name = $1, phone = $2, mobile = $2, email = $3, address = $4, contact_person = $5
                WHERE id = $6
                RETURNING *
            `, [name.trim(), phone || '', email || '', address || '', role_or_type || 'Vendor', partyId]);
            if (!result.rows.length) return res.status(404).json({ success: false, message: 'Supplier not found' });
            return res.status(200).json({ success: true, message: 'Supplier profile updated successfully', data: result.rows[0] });

        } else if (type === 'staff') {
            const roleVal = role_id ? parseInt(role_id) : 3;
            const result = await pool.query(`
                UPDATE users
                SET name = $1, phone = $2, email = $3, role_id = $4
                WHERE id = $5
                RETURNING id, name, phone, email, role_id, is_active
            `, [name.trim(), phone || '', email || '', roleVal, partyId]);
            if (!result.rows.length) return res.status(404).json({ success: false, message: 'Staff member not found' });
            return res.status(200).json({ success: true, message: 'Staff profile updated successfully', data: result.rows[0] });

        } else {
            return res.status(400).json({ success: false, message: 'Invalid party type' });
        }
    } catch (error) {
        console.error('updatePartyProfile error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 4. SAFE DELETION (ONLY IF ZERO ACTIVITY)
exports.deleteParty = async (req, res) => {
    try {
        const { type, id } = req.params;
        const partyId = parseInt(id);
        if (!partyId) return res.status(400).json({ success: false, message: 'Invalid ID' });

        if (type === 'customer') {
            // Check sales
            const salesCheck = await pool.query('SELECT COUNT(*) FROM sales WHERE customer_id = $1', [partyId]);
            const salesCount = parseInt(salesCheck.rows[0].count);

            // Check quotations
            const quoteCheck = await pool.query('SELECT COUNT(*) FROM sales_quotations WHERE customer_id = $1', [partyId]);
            const quoteCount = parseInt(quoteCheck.rows[0].count);

            // Check service projects
            const projCheck = await pool.query('SELECT COUNT(*) FROM service_projects WHERE customer_id = $1 AND deleted_at IS NULL', [partyId]).catch(() => ({ rows: [{ count: 0 }] }));
            const projCount = parseInt(projCheck.rows[0].count, 10) || 0;

            // Check balance
            const balCheck = await pool.query('SELECT receivable_balance FROM customers WHERE id = $1', [partyId]);
            const bal = balCheck.rows.length ? parseFloat(balCheck.rows[0].receivable_balance || 0) : 0;

            if ((salesCount > 0 || quoteCount > 0 || projCount > 0) && req.query.force !== 'true') {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete customer: ${salesCount} sales invoices, ${quoteCount} quotations, or ${projCount} service projects exist. Records must be preserved.`
                });
            }

            const custRes = await pool.query('SELECT * FROM customers WHERE id = $1', [partyId]);
            const cust = custRes.rows[0] || { id: partyId, type: 'customer' };

            // Safe to soft delete into Trash
            await pool.query('UPDATE customers SET deleted_at = NOW() WHERE id = $1', [partyId]);
            await pool.query(`
                INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
                VALUES ('customers', $1, $2, $3, NOW())
            `, [partyId, cust.name || `Customer #${partyId}`, JSON.stringify(cust)]).catch(() => null);
            return res.status(200).json({ success: true, message: 'Customer moved to Trash successfully.' });

        } else if (type === 'supplier') {
            // Check purchase orders
            const poCheck = await pool.query('SELECT COUNT(*) FROM purchase_orders WHERE supplier_id = $1 AND deleted_at IS NULL', [partyId]);
            const poCount = parseInt(poCheck.rows[0].count);

            // Check quotations
            const quoteCheck = await pool.query('SELECT COUNT(*) FROM purchase_quotations WHERE supplier_id = $1 AND deleted_at IS NULL', [partyId]);
            const quoteCount = parseInt(quoteCheck.rows[0].count);

            if ((poCount > 0 || quoteCount > 0) && req.query.force !== 'true') {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete supplier: ${poCount} purchase orders or ${quoteCount} quotations exist. Records must be preserved.`
                });
            }

            const supRes = await pool.query('SELECT * FROM suppliers WHERE id = $1', [partyId]);
            const sup = supRes.rows[0] || { id: partyId, type: 'supplier' };

            // Safe to soft delete into Trash
            await pool.query('UPDATE suppliers SET deleted_at = NOW() WHERE id = $1', [partyId]);
            await pool.query(`
                INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
                VALUES ('suppliers', $1, $2, $3, NOW())
            `, [partyId, sup.name || `Supplier #${partyId}`, JSON.stringify(sup)]).catch(() => null);
            return res.status(200).json({ success: true, message: 'Supplier moved to Trash successfully.' });

        } else if (type === 'staff') {
            if (partyId === 1) {
                return res.status(400).json({ success: false, message: 'Super Admin account cannot be deleted.' });
            }

            const staffCheck = await pool.query('SELECT name FROM users WHERE id = $1', [partyId]);
            if (!staffCheck.rows.length) return res.status(404).json({ success: false, message: 'Staff member not found' });
            const staffName = staffCheck.rows[0].name;

            // 1. Check sales
            const salesCheck = await pool.query(
                'SELECT COUNT(*) FROM sales WHERE (sales_person = $1 OR sold_by = $2) AND deleted_at IS NULL',
                [staffName, partyId]
            ).catch(() => ({ rows: [{ count: 0 }] }));
            const salesCount = parseInt(salesCheck.rows[0].count, 10) || 0;

            // 2. Check service projects (assigned technician or confirmed by)
            const projCheck = await pool.query(
                'SELECT COUNT(*) FROM service_projects WHERE (assigned_technician = $1 OR technician_id = $1 OR confirmed_by = $1) AND deleted_at IS NULL',
                [partyId]
            ).catch(() => ({ rows: [{ count: 0 }] }));
            const projCount = parseInt(projCheck.rows[0].count, 10) || 0;

            // 3. Check expenses created
            const expCheck = await pool.query(
                'SELECT COUNT(*) FROM expenses WHERE created_by = $1',
                [partyId]
            ).catch(() => ({ rows: [{ count: 0 }] }));
            const expCount = parseInt(expCheck.rows[0].count, 10) || 0;

            if (salesCount > 0 || projCount > 0 || expCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete staff/technician: ${projCount} service projects, ${salesCount} sales invoices, or ${expCount} expenses are attached to this user.`
                });
            }

            await pool.query('UPDATE users SET deleted_at = NOW() WHERE id = $1', [partyId]);
            await pool.query(`
                INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
                VALUES ('users', $1, $2, $3, NOW())
            `, [partyId, staffName || `Staff #${partyId}`, JSON.stringify({ id: partyId, name: staffName })]).catch(() => null);
            return res.status(200).json({ success: true, message: 'Staff member moved to Trash successfully.' });

        } else {
            return res.status(400).json({ success: false, message: 'Invalid party type' });
        }
    } catch (error) {
        console.error('deleteParty error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 5. UNIFIED FINANCIAL TRANSACTIONS (Supplier Payments, Customer Receipts, Staff Disbursals)
exports.handlePartyTransaction = async (req, res) => {
    const client = await pool.connect();
    try {
        const { party_type, party_id, action_type, account_id, amount, note, to_account_id } = req.body;
        const numAmount = parseFloat(amount);

        if (!action_type || !numAmount || numAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid action type and positive amount are required.' });
        }

        await client.query('BEGIN');

        // Check primary payment account
        if (action_type !== 'transfer') {
            if (!account_id) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Please select a payment wallet/account.' });
            }
            const accCheck = await client.query('SELECT id, name, balance FROM payment_accounts WHERE id = $1', [account_id]);
            if (!accCheck.rows.length) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Selected payment account does not exist.' });
            }
            const acc = accCheck.rows[0];
            const accBalance = parseFloat(acc.balance || 0);

            // =========================
            // 1. SUPPLIER TRANSACTIONS
            // =========================
            if (party_type === 'supplier') {
                const supCheck = await client.query('SELECT id, name, payable_balance FROM suppliers WHERE id = $1', [party_id]);
                if (!supCheck.rows.length) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ success: false, message: 'Supplier not found.' });
                }
                const supplier = supCheck.rows[0];

                if (action_type === 'due_payment' || action_type === 'due') {
                    // Pay supplier due: Outflow from shop account, decreases supplier payable balance
                    await client.query('UPDATE payment_accounts SET balance = balance - $1 WHERE id = $2', [numAmount, account_id]);
                    await client.query('UPDATE suppliers SET payable_balance = payable_balance - $1 WHERE id = $2', [numAmount, party_id]);
                    await client.query(`
                        INSERT INTO account_transactions (account_id, type, amount, reference, note)
                        VALUES ($1, 'due_payment', $2, $3, $4)
                    `, [account_id, numAmount, `Due Paid to Supplier: ${supplier.name} (#${party_id})`, note || 'Due Settlement']);

                } else if (action_type === 'advance_payment' || action_type === 'advance') {
                    // Supplier advance = wallet deposit (drawer reservation): money stays in the shop
                    // drawer, only the supplier's wallet tag increases. Drawer & payable unchanged.
                    await ensureWalletSchema();
                    const supWalletRes = await client.query('SELECT wallet_balance FROM suppliers WHERE id = $1', [party_id]);
                    const supWallet = parseFloat(supWalletRes.rows[0]?.wallet_balance || 0) || 0;
                    await client.query('UPDATE suppliers SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2', [numAmount, party_id]);
                    await writeWalletLedger(client, {
                        party_type: 'supplier', party_id: Number(party_id), party_name: supplier.name,
                        type: 'advance_deposit', amount: numAmount, credit: true,
                        account_id: null, account_name: null, account_effect: 'none', cash_drawer_effect: 'none',
                        reference: null, note: (note && note !== 'Supplier Advance') ? note : 'Supplier advance held in wallet (drawer unchanged)',
                        balance_before: supWallet, balance_after: supWallet + numAmount,
                    });

                } else {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ success: false, message: 'Invalid supplier action. Suppliers only support Due Payment or Advance Payment.' });
                }

            // =========================
            // 2. CUSTOMER TRANSACTIONS
            // =========================
            } else if (party_type === 'customer') {
                const custCheck = await client.query('SELECT id, name, receivable_balance FROM customers WHERE id = $1', [party_id]);
                if (!custCheck.rows.length) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ success: false, message: 'Customer not found.' });
                }
                const customer = custCheck.rows[0];

                if (action_type === 'due_payment' || action_type === 'due' || action_type === 'due_receive') {
                    // Customer pays due: Inflow to shop account, decreases customer receivable balance
                    await client.query('UPDATE payment_accounts SET balance = balance + $1 WHERE id = $2', [numAmount, account_id]);
                    await client.query('UPDATE customers SET receivable_balance = receivable_balance - $1 WHERE id = $2', [numAmount, party_id]);
                    await client.query(`
                        INSERT INTO account_transactions (account_id, type, amount, reference, note)
                        VALUES ($1, 'due_receive', $2, $3, $4)
                    `, [account_id, numAmount, `Due Received from Customer: ${customer.name} (#${party_id})`, note || 'Due Collection']);

                } else if (action_type === 'advance_receive' || action_type === 'advance' || action_type === 'deposit') {
                    // Customer advance = wallet deposit: Inflow to shop account, customer wallet credited.
                    // Receivable balance is NOT changed — wallet credit is independent of invoice dues.
                    await client.query('UPDATE payment_accounts SET balance = balance + $1 WHERE id = $2', [numAmount, account_id]);
                    await client.query(`
                        INSERT INTO account_transactions (account_id, type, amount, reference, note)
                        VALUES ($1, 'advance_receive', $2, $3, $4)
                    `, [account_id, numAmount, `Advance Received from Customer: ${customer.name} (#${party_id})`, note || 'Customer Advance']);

                    // Customer advance = wallet deposit: credit the customer's spendable wallet balance
                    await ensureWalletSchema();
                    const custWalletRes = await client.query('SELECT wallet_balance FROM customers WHERE id = $1', [party_id]);
                    const custWallet = parseFloat(custWalletRes.rows[0]?.wallet_balance || 0) || 0;
                    await client.query('UPDATE customers SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2', [numAmount, party_id]);
                    await writeWalletLedger(client, {
                        party_type: 'customer', party_id: Number(party_id), party_name: customer.name,
                        type: 'advance_deposit', amount: numAmount, credit: true,
                        account_id, account_name: null, account_effect: 'in', cash_drawer_effect: 'in',
                        reference: null, note: (note && note !== 'Customer Advance') ? note : 'Customer advance deposit into wallet',
                        balance_before: custWallet, balance_after: custWallet + numAmount,
                    });

                } else if (action_type === 'refund' || action_type === 'withdraw') {
                    // Refund to customer: Outflow from shop account; wallet credit settles the payout.
                    // Receivable balance is NOT changed — simple wallet/account payout.
                    await client.query('UPDATE payment_accounts SET balance = balance - $1 WHERE id = $2', [numAmount, account_id]);
                    await client.query(`
                        INSERT INTO account_transactions (account_id, type, amount, reference, note)
                        VALUES ($1, 'refund', $2, $3, $4)
                    `, [account_id, numAmount, `Refund Payout to Customer: ${customer.name} (#${party_id})`, note || 'Customer Refund']);

                    // Debit the customer's wallet credit (refund settled against spendable balance)
                    await ensureWalletSchema();
                    const refundWalletRes = await client.query('SELECT wallet_balance FROM customers WHERE id = $1', [party_id]);
                    const refundWallet = parseFloat(refundWalletRes.rows[0]?.wallet_balance || 0) || 0;
                    const refundFromWallet = Math.min(numAmount, refundWallet);
                    if (refundFromWallet > 0) {
                        await client.query(
                            'UPDATE customers SET wallet_balance = GREATEST(0, COALESCE(wallet_balance, 0) - $1) WHERE id = $2',
                            [refundFromWallet, party_id]
                        );
                        await writeWalletLedger(client, {
                            party_type: 'customer', party_id: Number(party_id), party_name: customer.name,
                            type: 'refund_payout', amount: refundFromWallet, credit: false,
                            account_id, account_name: null, account_effect: 'out', cash_drawer_effect: 'out',
                            reference: null, note: note || 'Refund payout against wallet credit',
                            balance_before: refundWallet, balance_after: refundWallet - refundFromWallet,
                        });
                    }

                } else {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ success: false, message: 'Invalid customer action.' });
                }

            // =========================
            // 3. STAFF TRANSACTIONS
            // =========================
            } else if (party_type === 'staff') {
                const staffCheck = await client.query('SELECT id, name FROM users WHERE id = $1', [party_id]);
                if (!staffCheck.rows.length) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ success: false, message: 'Staff member not found.' });
                }
                const staff = staffCheck.rows[0];

                if (action_type === 'salary_payment' || action_type === 'salary' || action_type === 'due_payment') {
                    await client.query('UPDATE payment_accounts SET balance = balance - $1 WHERE id = $2', [numAmount, account_id]);
                    await client.query(`
                        INSERT INTO account_transactions (account_id, type, amount, reference, note)
                        VALUES ($1, 'expense', $2, $3, $4)
                    `, [account_id, numAmount, `Salary/Advance Paid to Staff: ${staff.name} (#${party_id})`, note || 'Staff Remuneration']);
                } else {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ success: false, message: 'Staff members only support Salary or Advance payment.' });
                }

            } else {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Unknown party type.' });
            }

        // =========================
        // 4. WALLET-TO-WALLET TRANSFER (INTERNAL SHOP)
        // =========================
        } else if (action_type === 'transfer') {
            if (!account_id || !to_account_id) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Please select both source and destination accounts.' });
            }
            if (account_id === to_account_id) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Source and destination accounts cannot be identical.' });
            }
            const srcRes = await client.query('SELECT id, name, balance FROM payment_accounts WHERE id = $1', [account_id]);
            if (!srcRes.rows.length || parseFloat(srcRes.rows[0].balance) < numAmount) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Source account has insufficient balance.' });
            }

            await client.query('UPDATE payment_accounts SET balance = balance - $1 WHERE id = $2', [numAmount, account_id]);
            await client.query('UPDATE payment_accounts SET balance = balance + $1 WHERE id = $2', [numAmount, to_account_id]);

            const partyNote = party_type && party_id ? ` (Party: ${party_type} #${party_id})` : '';
            await client.query(`
                INSERT INTO account_transactions (account_id, type, amount, reference, note)
                VALUES ($1, 'transfer_out', $2, $3, $4)
            `, [account_id, numAmount, `Transfer to #${to_account_id}${partyNote}`, note || 'Fund Transfer Out']);

            await client.query(`
                INSERT INTO account_transactions (account_id, type, amount, reference, note)
                VALUES ($1, 'transfer_in', $2, $3, $4)
            `, [to_account_id, numAmount, `Transfer from #${account_id}${partyNote}`, note || 'Fund Transfer In']);
        }

        await client.query('COMMIT');
        return res.status(200).json({
            success: true,
            message: 'Transaction completed successfully.'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('handlePartyTransaction error:', error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};
