const pool = require('../config/db');

const formatProductResponse = (row) => {
    if (!row) return row;
    const isSerial = Boolean(
        row.is_serial_required ||
        row.is_serial_tracked ||
        row.tracks_serial ||
        row.isSerialRequired
    );
    const isWarranty = Boolean(
        row.is_warranty_required ||
        row.isWarrantyRequired ||
        (Number(row.warranty_months || 0) > 0)
    );
    const costPrice = Number(row.cost_price || row.costPrice || row.last_purchase_price || row.purchase_price || 0);
    const salePrice = Number(row.sale_price || row.salePrice || row.batch_sale_price || row.selling_price || row.mrp || costPrice);
    return {
        ...row,
        cost_price: costPrice,
        costPrice: costPrice,
        sale_price: salePrice,
        salePrice: salePrice,
        selling_price: salePrice,
        purchase_price: costPrice,
        isSerialRequired: isSerial,
        is_serial_required: isSerial,
        is_serial_tracked: isSerial,
        tracks_serial: isSerial,
        isWarrantyRequired: isWarranty,
        is_warranty_required: isWarranty,
    };
};

exports.searchProduct = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ success: false, message: 'সার্চ করার জন্য কিছু লিখুন' });
        
        let result;
        try {
            // চেষ্টা ১: purchase_orders এবং sales টেবিল থেকে সম্পূর্ণ হিস্ট্রি সহ
            const query = `
                SELECT p.*, 
                COALESCE((
                    SELECT json_agg(json_build_object('supplier', s.name, 'date', po.created_at, 'qty', poi.quantity, 'price', poi.cost_price)) 
                    FROM purchase_order_items poi 
                    JOIN purchase_orders po ON poi.purchase_order_id = po.id 
                    JOIN suppliers s ON po.supplier_id = s.id 
                    WHERE poi.product_id = p.id
                ), '[]') as purchase_history, 
                COALESCE((
                    SELECT json_agg(json_build_object('customer', c.name, 'date', sa.created_at, 'qty', si.quantity, 'price', si.unit_price)) 
                    FROM sales_items si 
                    JOIN sales sa ON (si.sale_id = sa.id) 
                    JOIN customers c ON sa.customer_id = c.id 
                    WHERE si.product_id = p.id
                ), '[]') as sales_history 
                FROM products p 
                WHERE (p.barcode = $1 OR p.sku = $1 OR p.name ILIKE $2) AND p.deleted_at IS NULL
                ORDER BY p.id DESC;
            `;
            result = await pool.query(query, [q, `%${q}%`]);
        } catch (subErr) {
            console.warn('Subquery search fallback:', subErr.message);
            // ফলব্যাক: যদি হিস্ট্রি টেবিল না থাকে, সাধারণ প্রোডাক্ট সার্চ
            result = await pool.query(
                `SELECT p.*, '[]'::json as purchase_history, '[]'::json as sales_history 
                 FROM products p 
                 WHERE (p.barcode = $1 OR p.sku = $1 OR p.name ILIKE $2) AND p.deleted_at IS NULL
                 ORDER BY p.id DESC;`,
                [q, `%${q}%`]
            );
        }
        
        return res.status(200).json({ success: true, data: result.rows.map(formatProductResponse) });
    } catch (error) {
        console.error('searchProduct error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.searchCustomer = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ success: false, message: 'নাম বা ফোন নাম্বার দিন' });
        
        const query = `
            SELECT c.*, COALESCE(pa.balance, 0) as wallet_balance 
            FROM customers c 
            LEFT JOIN payment_accounts pa ON pa.name = 'Tech: ' || c.name OR pa.name = c.name 
            WHERE c.name ILIKE $1 OR c.phone ILIKE $1 
            ORDER BY c.id DESC;
        `;
        
        const result = await pool.query(query, [`%${q}%`]);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('searchCustomer error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.searchInvoice = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ success: false, message: 'ইনভয়েস নং বা ফোন নাম্বার দিন' });
        
        let result;
        try {
            const query = `
                SELECT s.*, c.name as customer_name, c.phone as customer_phone 
                FROM sales s 
                JOIN customers c ON s.customer_id = c.id 
                WHERE s.invoice_no ILIKE $1 OR c.phone ILIKE $1 
                ORDER BY s.id DESC;
            `;
            result = await pool.query(query, [`%${q}%`]);
        } catch (e) {
            const query = `
                SELECT s.*, s.grand_total as total_amount, c.name as customer_name, c.phone as customer_phone 
                FROM sales_invoices s 
                JOIN customers c ON s.customer_id = c.id 
                WHERE s.invoice_no ILIKE $1 OR c.phone ILIKE $1 
                ORDER BY s.id DESC;
            `;
            result = await pool.query(query, [`%${q}%`]);
        }
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('searchInvoice error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.globalSearch = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || !q.trim()) {
            return res.status(200).json({
                success: true,
                data: {
                    sales: [],
                    sale_quotations: [],
                    customers: [],
                    purchases: [],
                    purchase_quotations: [],
                    suppliers: [],
                    products: [],
                },
            });
        }

        const searchTerm = `%${q.trim()}%`;

        const [salesRes, sqRes, custRes, poRes, pqRes, supRes, productsRes] = await Promise.all([
            // 1. Sales Invoices
            pool.query(
                `SELECT s.id, s.invoice_no, s.total_amount, s.paid_amount, s.due_amount, 
                        s.payment_status, s.sale_date, s.created_at,
                        COALESCE(c.name, 'Customer') AS customer_name, c.phone AS customer_phone
                 FROM sales s
                 LEFT JOIN customers c ON s.customer_id = c.id
                 WHERE s.invoice_no ILIKE $1 
                    OR c.name ILIKE $1 
                    OR c.phone ILIKE $1 
                    OR s.sales_person ILIKE $1
                 ORDER BY s.id DESC LIMIT 5`,
                [searchTerm]
            ).catch((err) => { console.error('Global search sales error:', err.message); return { rows: [] }; }),

            // 2. Sale Quotations
            pool.query(
                `SELECT sq.id, sq.quotation_no, sq.customer_name, sq.customer_phone, 
                        sq.total_amount, sq.status, sq.created_at
                 FROM sales_quotations sq
                 WHERE sq.quotation_no ILIKE $1 
                    OR sq.customer_name ILIKE $1 
                    OR sq.customer_phone ILIKE $1
                 ORDER BY sq.id DESC LIMIT 5`,
                [searchTerm]
            ).catch((err) => { console.error('Global search sale_quotations error:', err.message); return { rows: [] }; }),

            // 3. Customers
            pool.query(
                `SELECT c.id, c.name, c.phone, c.email, c.address, c.customer_type, 
                        c.receivable_balance, c.loyalty_points
                 FROM customers c
                 WHERE c.name ILIKE $1 
                    OR c.phone ILIKE $1 
                    OR c.email ILIKE $1 
                    OR c.address ILIKE $1
                 ORDER BY c.id DESC LIMIT 5`,
                [searchTerm]
            ).catch((err) => { console.error('Global search customers error:', err.message); return { rows: [] }; }),

            // 4. Purchase Orders
            pool.query(
                `SELECT po.id, po.po_number, po.total_cost, po.total_paid, po.total_due, 
                        po.transaction_reference, po.status, po.created_at,
                        COALESCE(s.name, 'Supplier') AS supplier_name, s.phone AS supplier_phone
                 FROM purchase_orders po
                 LEFT JOIN suppliers s ON po.supplier_id = s.id
                 WHERE po.po_number ILIKE $1 
                    OR po.transaction_reference ILIKE $1 
                    OR s.name ILIKE $1 
                    OR s.phone ILIKE $1
                 ORDER BY po.id DESC LIMIT 5`,
                [searchTerm]
            ).catch((err) => { console.error('Global search purchase_orders error:', err.message); return { rows: [] }; }),

            // 5. Purchase Quotations
            pool.query(
                `SELECT pq.id, pq.quotation_no, pq.reference, pq.total_amount, pq.status, pq.created_at,
                        COALESCE(s.name, 'Supplier') AS supplier_name
                 FROM purchase_quotations pq
                 LEFT JOIN suppliers s ON pq.supplier_id = s.id
                 WHERE pq.quotation_no ILIKE $1 
                    OR pq.reference ILIKE $1 
                    OR s.name ILIKE $1
                 ORDER BY pq.id DESC LIMIT 5`,
                [searchTerm]
            ).catch((err) => { console.error('Global search purchase_quotations error:', err.message); return { rows: [] }; }),

            // 6. Suppliers
            // 6. Suppliers
            pool.query(
                `SELECT sup.id, sup.name, sup.contact_person, sup.phone, sup.mobile, 
                        sup.email, sup.payable_balance
                 FROM suppliers sup
                 WHERE sup.name ILIKE $1 
                    OR sup.contact_person ILIKE $1 
                    OR sup.phone ILIKE $1 
                    OR sup.mobile ILIKE $1
                 ORDER BY sup.id DESC LIMIT 5`,
                [searchTerm]
            ).catch((err) => { console.error('Global search suppliers error:', err.message); return { rows: [] }; }),

            // 7. Operational Products (1. Inventory/Stock, 2. Sales Invoices, 3. Purchase Invoices, 4. Warranty & Returns)
            pool.query(
                `SELECT 
                    p.id,
                    p.name,
                    p.sku,
                    p.barcode,
                    COALESCE(p.stock, 0) AS stock,
                    COALESCE(p.min_stock, 5) AS min_stock,
                    COALESCE(p.purchase_price, 0) AS cost_price,
                    COALESCE(p.selling_price, 0) AS sale_price,
                    COALESCE(p.mrp, 0) AS mrp,
                    p.status,
                    p.image_url,
                    p.supplier_warranty_expire_date,
                    COALESCE(p.warranty_months, 0) AS warranty_months,
                    b.name AS brand_name,
                    c.name AS category_name,
                    -- Matched serial code if search matched an individual serial
                    COALESCE(
                        (
                            SELECT sis.serial_code 
                            FROM sales_item_serials sis
                            JOIN sales_items si ON si.id = sis.sales_item_id
                            WHERE si.product_id = p.id AND (sis.serial_code ILIKE $1 OR LOWER(sis.serial_code) = LOWER($2))
                            LIMIT 1
                        ),
                        (
                            SELECT pos.serial_code 
                            FROM purchase_order_serials pos
                            JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
                            WHERE poi.product_id = p.id AND (pos.serial_code ILIKE $1 OR LOWER(pos.serial_code) = LOWER($2))
                            LIMIT 1
                        )
                    ) AS matched_serial,
                    -- 2. Sales Invoices (if sold)
                    (
                        SELECT COALESCE(json_agg(sub), '[]'::json)
                        FROM (
                            SELECT s.id AS sale_id, s.invoice_no, COALESCE(cust.name, 'Walk-in') AS customer_name,
                                   cust.phone AS customer_phone,
                                   s.created_at AS sale_date, si.quantity, si.unit_price, si.line_total, si.warranty_expire_date
                            FROM sales_items si
                            JOIN sales s ON s.id = si.sale_id
                            LEFT JOIN customers cust ON cust.id = s.customer_id
                            WHERE si.product_id = p.id AND s.deleted_at IS NULL
                            ORDER BY s.id DESC
                            LIMIT 5
                        ) sub
                    ) AS sales_history,
                    -- 3. Purchase Invoices
                    (
                        SELECT COALESCE(json_agg(sub), '[]'::json)
                        FROM (
                            SELECT po.id AS po_id, po.po_number, COALESCE(sup.name, 'Supplier') AS supplier_name,
                                   sup.phone AS supplier_phone,
                                   po.created_at AS purchase_date, poi.quantity, poi.cost_price, poi.expected_date, poi.supplier_warranty_expire_date
                            FROM purchase_order_items poi
                            JOIN purchase_orders po ON po.id = poi.purchase_order_id
                            LEFT JOIN suppliers sup ON sup.id = po.supplier_id
                            WHERE poi.product_id = p.id AND po.deleted_at IS NULL
                            ORDER BY po.id DESC
                            LIMIT 5
                        ) sub
                    ) AS purchase_history,
                    -- 4. Warranty Claims (if done or in process)
                    (
                        SELECT COALESCE(json_agg(sub), '[]'::json)
                        FROM (
                            SELECT wc.id AS claim_id, wc.claim_no, wc.status, wc.barcode, wc.serial_code,
                                   wc.issue_description, wc.customer_name, wc.claim_date
                            FROM warranty_claims wc
                            WHERE wc.product_id = p.id AND wc.deleted_at IS NULL
                            ORDER BY wc.id DESC
                            LIMIT 5
                        ) sub
                    ) AS warranty_claims,
                    -- 4. Return-Refunds (if done or in process)
                    (
                        SELECT COALESCE(json_agg(sub), '[]'::json)
                        FROM (
                            SELECT pr.id AS return_id, pr.return_no, pr.return_qty, pr.refund_amount,
                                   pr.return_reason, pr.customer_name, pr.return_date
                            FROM product_returns pr
                            WHERE pr.product_id = p.id AND pr.deleted_at IS NULL
                            ORDER BY pr.id DESC
                            LIMIT 5
                        ) sub
                    ) AS returns_refunds
                 FROM products p
                 LEFT JOIN brands b ON b.id = p.brand_id
                 LEFT JOIN categories c ON c.id = p.category_id
                 WHERE p.deleted_at IS NULL
                   AND (
                       p.name ILIKE $1 
                       OR p.sku ILIKE $1 
                       OR p.barcode ILIKE $1 
                       OR b.name ILIKE $1
                       OR EXISTS (
                           SELECT 1 FROM purchase_order_serials pos
                           JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
                           WHERE poi.product_id = p.id AND (pos.serial_code ILIKE $1 OR LOWER(pos.serial_code) = LOWER($2))
                       )
                       OR EXISTS (
                           SELECT 1 FROM sales_item_serials sis
                           JOIN sales_items si ON si.id = sis.sales_item_id
                           WHERE si.product_id = p.id AND (sis.serial_code ILIKE $1 OR LOWER(sis.serial_code) = LOWER($2))
                       )
                   )
                   AND (
                       COALESCE(p.stock, 0) > 0 
                       OR COALESCE(p.purchase_count, 0) > 0
                       OR EXISTS (SELECT 1 FROM purchase_order_items poi WHERE poi.product_id = p.id)
                       OR EXISTS (SELECT 1 FROM sales_items si WHERE si.product_id = p.id)
                       OR EXISTS (SELECT 1 FROM warranty_claims wc WHERE wc.product_id = p.id AND wc.deleted_at IS NULL)
                       OR EXISTS (SELECT 1 FROM product_returns pr WHERE pr.product_id = p.id AND pr.deleted_at IS NULL)
                   )
                 ORDER BY p.id DESC
                 LIMIT 8`,
                [searchTerm, q.trim()]
            ).catch((err) => { console.error('Global search products error:', err.message); return { rows: [] }; }),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                sales: salesRes.rows,
                sale_quotations: sqRes.rows,
                customers: custRes.rows,
                purchases: poRes.rows,
                purchase_quotations: pqRes.rows,
                suppliers: supRes.rows,
                products: productsRes.rows,
            },
        });
    } catch (error) {
        console.error('globalSearch error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.barcodeLookup = async (req, res) => {
    try {
        const code = (req.query.code || req.query.q || '').trim();
        if (!code) {
            return res.status(400).json({ success: false, message: 'Barcode or serial code is required' });
        }

        // 1. Try to find by Serial Number in sales_item_serials (sold serial unit)
        const soldSerialSql = `
            SELECT 
                sis.serial_code,
                p.id AS product_id,
                p.name AS product_name,
                p.sku,
                p.barcode,
                COALESCE(p.stock, 0) AS stock,
                COALESCE(p.purchase_price, 0) AS cost_price,
                COALESCE(p.selling_price, 0) AS sale_price,
                COALESCE(p.warranty_months, 12) AS warranty_months,
                b.name AS brand_name,
                c.name AS category_name,
                s.id AS sale_id,
                s.invoice_no,
                s.sale_date,
                s.created_at AS sale_created_at,
                s.payment_status,
                COALESCE(cust.name, 'Walk-in Customer') AS customer_name,
                COALESCE(cust.phone, 'N/A') AS customer_phone,
                si.unit_price AS sold_unit_price,
                si.quantity AS sold_quantity,
                po.id AS po_id,
                po.po_number,
                po.created_at AS purchase_date,
                poi.cost_price AS purchase_cost_price,
                poi.supplier_warranty_expire_date,
                COALESCE(sup.name, 'Authorized Supplier') AS supplier_name,
                COALESCE(sup.phone, 'N/A') AS supplier_phone
            FROM sales_item_serials sis
            JOIN sales_items si ON si.id = sis.sales_item_id
            JOIN sales s ON s.id = si.sale_id
            JOIN products p ON p.id = si.product_id
            LEFT JOIN brands b ON b.id = p.brand_id
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN customers cust ON cust.id = s.customer_id
            LEFT JOIN purchase_order_serials pos ON LOWER(pos.serial_code) = LOWER(sis.serial_code)
            LEFT JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
            LEFT JOIN purchase_orders po ON po.id = poi.purchase_order_id
            LEFT JOIN suppliers sup ON sup.id = po.supplier_id
            WHERE LOWER(sis.serial_code) = LOWER($1)
            ORDER BY s.id DESC
            LIMIT 1;
        `;
        const soldRes = await pool.query(soldSerialSql, [code]);

        if (soldRes.rows.length > 0) {
            const row = soldRes.rows[0];
            const saleDate = new Date(row.sale_date || row.sale_created_at || new Date());
            const months = parseInt(row.warranty_months, 10) || 12;
            const customerExpiry = new Date(saleDate);
            customerExpiry.setMonth(customerExpiry.getMonth() + months);
            customerExpiry.setDate(customerExpiry.getDate() + 60);

            const now = new Date();
            const isCustomerValid = now <= customerExpiry;
            const daysRemaining = Math.max(0, Math.ceil((customerExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

            // Supplier warranty
            let isSupplierValid = true;
            let supplierExpiryStr = null;
            let supplierDaysRemaining = 0;
            if (row.supplier_warranty_expire_date) {
                const sExp = new Date(row.supplier_warranty_expire_date);
                supplierExpiryStr = sExp.toISOString().split('T')[0];
                isSupplierValid = now <= sExp;
                supplierDaysRemaining = Math.max(0, Math.ceil((sExp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            } else if (row.purchase_date) {
                const pDate = new Date(row.purchase_date);
                const sExp = new Date(pDate);
                sExp.setMonth(sExp.getMonth() + Math.max(months, 12) + 2);
                supplierExpiryStr = sExp.toISOString().split('T')[0];
                isSupplierValid = now <= sExp;
                supplierDaysRemaining = Math.max(0, Math.ceil((sExp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            }

            // Past claims
            let claims = [];
            try {
                const claimsRes = await pool.query(
                    `SELECT claim_no, status, issue_description, received_date, replacement_serial_code 
                     FROM warranty_claims 
                     WHERE LOWER(serial_code) = LOWER($1) 
                     ORDER BY id DESC LIMIT 5`,
                    [code]
                );
                claims = claimsRes.rows;
            } catch (err) {
                console.warn('Claims query fallback:', err.message);
            }

            // Returns
            let returns = [];
            try {
                const returnsRes = await pool.query(
                    `SELECT return_no, return_qty, refund_amount, return_reason, created_at 
                     FROM product_returns 
                     WHERE LOWER(serial_code) = LOWER($1) 
                     ORDER BY id DESC LIMIT 5`,
                    [code]
                );
                returns = returnsRes.rows;
            } catch (err) {
                console.warn('Returns query fallback:', err.message);
            }

            return res.status(200).json({
                success: true,
                match_type: 'SERIAL_SOLD',
                scanned_code: code,
                data: {
                    serial_code: row.serial_code,
                    status: 'Sold',
                    product: {
                        id: row.product_id,
                        name: row.product_name,
                        brand_name: row.brand_name,
                        category_name: row.category_name,
                        sku: row.sku,
                        barcode: row.barcode,
                        stock: row.stock,
                        cost_price: row.cost_price,
                        sale_price: row.sale_price,
                    },
                    purchase: {
                        po_id: row.po_id,
                        po_number: row.po_number || 'Initial Inflow / Purchase',
                        purchase_date: row.purchase_date,
                        cost_price: row.purchase_cost_price || row.cost_price,
                        supplier_name: row.supplier_name,
                        supplier_phone: row.supplier_phone,
                        supplier_warranty_expire_date: supplierExpiryStr,
                    },
                    inventory: {
                        stock: row.stock,
                        unit_status: 'Sold to Customer',
                        cost_price: row.cost_price,
                        sale_price: row.sale_price,
                    },
                    sale: {
                        sale_id: row.sale_id,
                        invoice_no: row.invoice_no,
                        sale_date: row.sale_date,
                        customer_name: row.customer_name,
                        customer_phone: row.customer_phone,
                        unit_price: row.sold_unit_price || row.sale_price,
                        payment_status: row.payment_status || 'paid',
                    },
                    warranty: {
                        warranty_months: months,
                        customer_warranty_expiry: customerExpiry.toISOString().split('T')[0],
                        is_customer_warranty_valid: isCustomerValid,
                        customer_days_remaining: daysRemaining,
                        grace_days: 60,
                        is_supplier_warranty_valid: isSupplierValid,
                        supplier_days_remaining: supplierDaysRemaining,
                        supplier_warranty_expiry: supplierExpiryStr,
                        supplier_name: row.supplier_name,
                        claims,
                        returns,
                    },
                },
            });
        }

        // 2. Check if serial is in purchase_order_serials (in-stock or unsold)
        const unsoldSerialSql = `
            SELECT 
                pos.serial_code,
                p.id AS product_id,
                p.name AS product_name,
                p.sku,
                p.barcode,
                COALESCE(p.stock, 0) AS stock,
                COALESCE(p.purchase_price, 0) AS cost_price,
                COALESCE(p.selling_price, 0) AS sale_price,
                COALESCE(p.warranty_months, 12) AS warranty_months,
                b.name AS brand_name,
                c.name AS category_name,
                po.id AS po_id,
                po.po_number,
                po.created_at AS purchase_date,
                poi.cost_price AS purchase_cost_price,
                poi.supplier_warranty_expire_date,
                COALESCE(sup.name, 'Supplier') AS supplier_name,
                COALESCE(sup.phone, 'N/A') AS supplier_phone
            FROM purchase_order_serials pos
            JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
            JOIN purchase_orders po ON po.id = poi.purchase_order_id
            JOIN products p ON p.id = poi.product_id
            LEFT JOIN brands b ON b.id = p.brand_id
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN suppliers sup ON sup.id = po.supplier_id
            WHERE LOWER(pos.serial_code) = LOWER($1)
            LIMIT 1;
        `;
        const unsoldRes = await pool.query(unsoldSerialSql, [code]);

        if (unsoldRes.rows.length > 0) {
            const row = unsoldRes.rows[0];
            const now = new Date();
            const months = parseInt(row.warranty_months, 10) || 12;

            let isSupplierValid = true;
            let supplierExpiryStr = null;
            let supplierDaysRemaining = 0;
            if (row.supplier_warranty_expire_date) {
                const sExp = new Date(row.supplier_warranty_expire_date);
                supplierExpiryStr = sExp.toISOString().split('T')[0];
                isSupplierValid = now <= sExp;
                supplierDaysRemaining = Math.max(0, Math.ceil((sExp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            } else if (row.purchase_date) {
                const pDate = new Date(row.purchase_date);
                const sExp = new Date(pDate);
                sExp.setMonth(sExp.getMonth() + Math.max(months, 12) + 2);
                supplierExpiryStr = sExp.toISOString().split('T')[0];
                isSupplierValid = now <= sExp;
                supplierDaysRemaining = Math.max(0, Math.ceil((sExp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            }

            return res.status(200).json({
                success: true,
                match_type: 'SERIAL_INVENTORY',
                scanned_code: code,
                data: {
                    serial_code: row.serial_code,
                    status: 'In Stock',
                    product: {
                        id: row.product_id,
                        name: row.product_name,
                        brand_name: row.brand_name,
                        category_name: row.category_name,
                        sku: row.sku,
                        barcode: row.barcode,
                        stock: row.stock,
                        cost_price: row.purchase_cost_price || row.cost_price,
                        sale_price: row.sale_price,
                    },
                    purchase: {
                        po_id: row.po_id,
                        po_number: row.po_number,
                        purchase_date: row.purchase_date,
                        cost_price: row.purchase_cost_price || row.cost_price,
                        supplier_name: row.supplier_name,
                        supplier_phone: row.supplier_phone,
                        supplier_warranty_expire_date: supplierExpiryStr,
                    },
                    inventory: {
                        stock: row.stock,
                        unit_status: 'Available in Current Inventory',
                        cost_price: row.cost_price,
                        sale_price: row.sale_price,
                    },
                    sale: null,
                    warranty: {
                        warranty_months: months,
                        customer_warranty_info: 'Unit in shop stock. Customer warranty begins upon sale invoice.',
                        is_customer_warranty_valid: false,
                        is_supplier_warranty_valid: isSupplierValid,
                        supplier_days_remaining: supplierDaysRemaining,
                        supplier_warranty_expiry: supplierExpiryStr,
                        supplier_name: row.supplier_name,
                        claims: [],
                        returns: [],
                    },
                },
            });
        }

        // 3. Fallback: Lookup by Product Barcode or SKU
        const prodSql = `
            SELECT 
                p.id AS product_id,
                p.name AS product_name,
                p.sku,
                p.barcode,
                COALESCE(p.stock, 0) AS stock,
                COALESCE(p.min_stock, 5) AS min_stock,
                COALESCE(p.purchase_price, 0) AS cost_price,
                COALESCE(p.selling_price, 0) AS sale_price,
                COALESCE(p.warranty_months, 12) AS warranty_months,
                p.supplier_warranty_expire_date,
                b.name AS brand_name,
                c.name AS category_name
            FROM products p
            LEFT JOIN brands b ON b.id = p.brand_id
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.deleted_at IS NULL AND (LOWER(p.barcode) = LOWER($1) OR LOWER(p.sku) = LOWER($1))
            LIMIT 1;
        `;
        const prodRes = await pool.query(prodSql, [code]);

        if (prodRes.rows.length > 0) {
            const p = prodRes.rows[0];

            // Latest Purchase
            const latestPoRes = await pool.query(
                `SELECT po.id AS po_id, po.po_number, po.created_at AS purchase_date, 
                        poi.cost_price, poi.quantity, poi.supplier_warranty_expire_date,
                        COALESCE(sup.name, 'Supplier') AS supplier_name,
                        COALESCE(sup.phone, 'N/A') AS supplier_phone
                 FROM purchase_order_items poi
                 JOIN purchase_orders po ON po.id = poi.purchase_order_id
                 LEFT JOIN suppliers sup ON sup.id = po.supplier_id
                 WHERE poi.product_id = $1 AND po.deleted_at IS NULL
                 ORDER BY po.id DESC LIMIT 1`,
                [p.product_id]
            );

            // Latest Sale
            const latestSaleRes = await pool.query(
                `SELECT s.id AS sale_id, s.invoice_no, s.sale_date, s.payment_status,
                        si.unit_price, si.quantity,
                        COALESCE(cust.name, 'Customer') AS customer_name,
                        COALESCE(cust.phone, 'N/A') AS customer_phone
                 FROM sales_items si
                 JOIN sales s ON s.id = si.sale_id
                 LEFT JOIN customers cust ON cust.id = s.customer_id
                 WHERE si.product_id = $1 AND s.deleted_at IS NULL
                 ORDER BY s.id DESC LIMIT 1`,
                [p.product_id]
            );

            // Claims and Returns
            let claims = [];
            try {
                const claimsRes = await pool.query(
                    `SELECT claim_no, status, issue_description, received_date 
                     FROM warranty_claims 
                     WHERE product_id = $1 AND deleted_at IS NULL 
                     ORDER BY id DESC LIMIT 5`,
                    [p.product_id]
                );
                claims = claimsRes.rows;
            } catch (err) {}

            let returns = [];
            try {
                const returnsRes = await pool.query(
                    `SELECT return_no, return_qty, refund_amount, return_reason, created_at 
                     FROM product_returns 
                     WHERE product_id = $1 AND deleted_at IS NULL 
                     ORDER BY id DESC LIMIT 5`,
                    [p.product_id]
                );
                returns = returnsRes.rows;
            } catch (err) {}

            const latestPo = latestPoRes.rows[0] || null;
            const latestSale = latestSaleRes.rows[0] || null;

            return res.status(200).json({
                success: true,
                match_type: 'PRODUCT_BARCODE',
                scanned_code: code,
                data: {
                    serial_code: null,
                    status: Number(p.stock) > 0 ? 'In Stock' : 'Out of Stock',
                    product: {
                        id: p.product_id,
                        name: p.product_name,
                        brand_name: p.brand_name,
                        category_name: p.category_name,
                        sku: p.sku,
                        barcode: p.barcode,
                        stock: p.stock,
                        cost_price: p.cost_price,
                        sale_price: p.sale_price,
                    },
                    purchase: latestPo ? {
                        po_id: latestPo.po_id,
                        po_number: latestPo.po_number,
                        purchase_date: latestPo.purchase_date,
                        cost_price: latestPo.cost_price,
                        supplier_name: latestPo.supplier_name,
                        supplier_phone: latestPo.supplier_phone,
                        supplier_warranty_expire_date: latestPo.supplier_warranty_expire_date,
                    } : null,
                    inventory: {
                        stock: p.stock,
                        unit_status: Number(p.stock) > 0 ? 'In Stock' : 'Out of Stock',
                        cost_price: p.cost_price,
                        sale_price: p.sale_price,
                    },
                    sale: latestSale ? {
                        sale_id: latestSale.sale_id,
                        invoice_no: latestSale.invoice_no,
                        sale_date: latestSale.sale_date,
                        customer_name: latestSale.customer_name,
                        customer_phone: latestSale.customer_phone,
                        unit_price: latestSale.unit_price,
                        payment_status: latestSale.payment_status,
                    } : null,
                    warranty: {
                        warranty_months: p.warranty_months,
                        customer_warranty_info: `${p.warranty_months} Months Customer Warranty (begins on invoice date)`,
                        claims,
                        returns,
                    },
                },
            });
        }

        return res.status(404).json({
            success: false,
            message: `No serial number or barcode match found for "${code}"`,
        });
    } catch (error) {
        console.error('barcodeLookup error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};