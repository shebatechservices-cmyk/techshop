const pool = require('../../config/db');

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
        const totalResult = await pool.query(countSql, params);
        const total = parseInt(totalResult.rows[0].count);

        // Fetch records
        const dataSql = `
            SELECT * FROM ${combinedQuery} 
            ${whereClause} 
            ORDER BY created_at DESC 
            LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
        `;
        params.push(limitNum, offset);

        const result = await pool.query(dataSql, params);

        // Aggregate summaries
        const summarySql = `
            SELECT 
                COALESCE(SUM(CASE WHEN party_type = 'customer' THEN balance ELSE 0 END), 0)::NUMERIC AS total_receivable,
                COALESCE(SUM(CASE WHEN party_type = 'supplier' THEN balance ELSE 0 END), 0)::NUMERIC AS total_payable,
                COUNT(CASE WHEN party_type = 'customer' THEN 1 END)::INT AS customer_count,
                COUNT(CASE WHEN party_type = 'supplier' THEN 1 END)::INT AS supplier_count,
                COUNT(CASE WHEN party_type = 'staff' THEN 1 END)::INT AS staff_count
            FROM ${combinedQuery}
        `;
        const summaryResult = await pool.query(summarySql, search.trim() ? [searchPattern] : []);

        return res.status(200).json({
            success: true,
            data: result.rows,
            summary: summaryResult.rows[0],
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
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
