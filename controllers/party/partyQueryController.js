const pool = require('../../config/db');
const {
    getCustomerProfile,
    getSupplierProfile,
    getStaffProfile,
} = require('./queries/partyProfileQueryHelper');

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

        let profileData = null;
        if (type === 'customer') {
            profileData = await getCustomerProfile(partyId);
            if (!profileData) return res.status(404).json({ success: false, message: 'Customer not found' });
        } else if (type === 'supplier') {
            profileData = await getSupplierProfile(partyId);
            if (!profileData) return res.status(404).json({ success: false, message: 'Supplier not found' });
        } else if (type === 'staff') {
            profileData = await getStaffProfile(partyId);
            if (!profileData) return res.status(404).json({ success: false, message: 'Staff member not found' });
        } else {
            return res.status(400).json({ success: false, message: 'Unsupported party type' });
        }

        return res.status(200).json({
            success: true,
            ...profileData,
        });
    } catch (error) {
        console.error('getPartyProfile error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
