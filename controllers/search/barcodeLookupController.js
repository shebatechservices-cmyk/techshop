const pool = require('../../config/db');

const barcodeLookup = async (req, res) => {
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
                COALESCE(poi.final_cost, poi.cost_price, p.purchase_price, 0) AS cost_price,
                COALESCE(poi.final_sale_price, poi.sale_price, p.selling_price, 0) AS sale_price,
                COALESCE(p.warranty_months, 12) AS warranty_months,
                b.name AS brand_name,
                c.name AS category_name,
                po.id AS po_id,
                po.po_number,
                po.created_at AS purchase_date,
                COALESCE(poi.final_cost, poi.cost_price, p.purchase_price, 0) AS purchase_cost_price,
                COALESCE(poi.final_sale_price, poi.sale_price, p.selling_price, 0) AS batch_sale_price,
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
                        cost_price: row.purchase_cost_price || row.cost_price,
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

module.exports = {
    barcodeLookup,
};
