const pool = require('../../config/db');

// ১. সাম্প্রতিক সেলস ইনভয়েস খোঁজা (নতুন ক্যামেরা সেটাপ রেফারেন্সের জন্য)
exports.getInvoicesLookup = async (req, res) => {
    try {
        const query = `
            SELECT 
                s.id,
                s.invoice_no,
                s.created_at,
                s.total_amount,
                s.paid_amount,
                s.due_amount,
                COALESCE(s.setup_charge, 0) AS setup_charge,
                s.customer_id,
                COALESCE(c.name, 'Walking Customer') AS customer_name,
                c.phone AS customer_phone,
                c.address AS customer_address,
                COALESCE(
                    (
                        SELECT json_agg(json_build_object(
                            'product_id', si.product_id,
                            'product_name', COALESCE(p.name, 'Item'),
                            'quantity', si.quantity,
                            'unit_price', si.unit_price,
                            'line_total', si.line_total
                        ))
                        FROM sales_items si
                        LEFT JOIN products p ON p.id = si.product_id
                        WHERE si.sale_id = s.id
                    ), '[]'::json
                ) AS items
            FROM sales s
            LEFT JOIN customers c ON c.id = s.customer_id
            ORDER BY s.id DESC
            LIMIT 50;
        `;
        const result = await pool.query(query);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('getInvoicesLookup error:', error);
        return res.status(500).json({ success: false, message: 'ইনভয়েস লোড করতে সমস্যা হয়েছে।' });
    }
};

// ২. উপলব্ধ টেকনিশিয়ানদের তালিকা (শুধুমাত্র অ্যাক্টিভ স্টাফ/ইউজার যাদের টেকনিশিয়ান রোল রয়েছে)
exports.getTechniciansLookup = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id,
                u.name,
                COALESCE(u.phone, u.email, '') AS phone,
                COALESCE(u.phone, u.email, '') AS contact,
                u.email,
                COALESCE(r.name, u.role_name, u.designation, 'Technician') AS role_title,
                COALESCE(u.designation, 'Field Technician') AS designation,
                COALESCE(u.wallet_balance, 0) AS wallet_balance
            FROM users u
            LEFT JOIN roles r ON r.id = u.role_id
            WHERE u.deleted_at IS NULL
              AND (u.is_active IS NOT FALSE AND u.is_locked IS NOT TRUE)
              AND (
                  UPPER(COALESCE(u.role::text, '')) = 'TECHNICIAN'
                  OR u.role_id = 4
                  OR COALESCE(u.role_name, '') ILIKE '%technician%'
                  OR COALESCE(r.name, '') ILIKE '%technician%'
                  OR COALESCE(u.designation, '') ILIKE '%technician%'
                  OR COALESCE(u.designation, '') ILIKE '%tech%'
              )
            ORDER BY u.name ASC;
        `;
        const result = await pool.query(query);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('getTechniciansLookup error:', error);
        return res.status(500).json({ success: false, message: 'টেকনিশিয়ানদের তালিকা লোড করতে সমস্যা হয়েছে।' });
    }
};
