const pool = require('../config/db');
const { ensureWalletSchema, writeWalletLedger } = require('./walletController');

const WARRANTY_GRACE_DAYS = 60;

let tablesMigrated = false;

async function ensureWarrantyTables() {
    if (tablesMigrated) return;
    try {
        await pool.query(`
            -- Warranty Claims Table
            CREATE TABLE IF NOT EXISTS warranty_claims (
                id SERIAL PRIMARY KEY,
                claim_no VARCHAR(100) UNIQUE NOT NULL,
                order_source VARCHAR(20) DEFAULT 'offline',
                invoice_no VARCHAR(100),
                ecommerce_order_no VARCHAR(100),
                customer_id INT,
                customer_name VARCHAR(150),
                customer_phone VARCHAR(50),
                product_id INT,
                product_name VARCHAR(255),
                serial_code VARCHAR(100),
                barcode VARCHAR(100),
                issue_description TEXT,
                status VARCHAR(50) DEFAULT 'Received',
                service_notes TEXT,
                replacement_serial_code VARCHAR(100),
                backup_unit_provided VARCHAR(255),
                received_date TIMESTAMP DEFAULT NOW(),
                estimated_delivery_date DATE,
                completed_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            );

            -- Ensure columns in warranty_claims
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150);
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS serial_code VARCHAR(100);
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Received';
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS service_notes TEXT;
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS replacement_serial_code VARCHAR(100);
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS backup_unit_provided VARCHAR(255);
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS received_date TIMESTAMP DEFAULT NOW();
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;
            ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS completed_date TIMESTAMP;

            -- Product Returns Table
            CREATE TABLE IF NOT EXISTS product_returns (
                id SERIAL PRIMARY KEY,
                return_no VARCHAR(100) UNIQUE NOT NULL,
                order_source VARCHAR(20) DEFAULT 'offline',
                invoice_no VARCHAR(100),
                ecommerce_order_no VARCHAR(100),
                customer_id INT,
                customer_name VARCHAR(150),
                customer_phone VARCHAR(50),
                product_id INT,
                product_name VARCHAR(255),
                serial_code VARCHAR(100),
                return_qty INT DEFAULT 1,
                return_type VARCHAR(50) DEFAULT 'Refund',
                refund_amount NUMERIC(12,2) DEFAULT 0,
                refund_method VARCHAR(50) DEFAULT 'Cash',
                condition VARCHAR(50) DEFAULT 'Good',
                return_reason TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );

            -- Ensure columns in product_returns
            ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150);
            ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
            ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
            ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS serial_code VARCHAR(100);
            ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS return_type VARCHAR(50) DEFAULT 'Refund';
            ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS refund_method VARCHAR(50) DEFAULT 'Cash';

            -- Damaged products table
            CREATE TABLE IF NOT EXISTS damaged_products (
                id SERIAL PRIMARY KEY,
                product_id INT,
                quantity INT DEFAULT 1,
                note TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        tablesMigrated = true;
    } catch (err) {
        console.error('Warranty table migration notice:', err.message);
    }
}

// -------------------------------------------------------------
// ১. ইনস্ট্যান্ট ওয়ারেন্টি চেক (Instant S/N or Invoice Lookup)
// -------------------------------------------------------------
exports.getExpiringWarranties = async (req, res) => {
    try {
        await ensureWarrantyTables();
        const windowDays = Math.max(0, parseInt(req.query.days, 10) || 30);
        const sql = `
            SELECT 
                sis.id,
                sis.serial_code,
                s.invoice_no,
                s.sale_date,
                COALESCE(c.name, 'Walk-in Customer') AS customer_name,
                COALESCE(c.phone, 'N/A') AS customer_phone,
                COALESCE(p.name, 'Product') AS product_name,
                COALESCE(p.warranty_months, 12) AS warranty_months
            FROM sales_item_serials sis
            JOIN sales_items si ON si.id = sis.sales_item_id
            JOIN sales s ON s.id = si.sale_id
            JOIN products p ON p.id = si.product_id
            LEFT JOIN customers c ON c.id = s.customer_id
            ORDER BY s.id DESC
            LIMIT 3000
        `;
        const { rows } = await pool.query(sql);
        const now = new Date();
        const expired = [];
        const expiringSoon = [];
        const valid = [];

        rows.forEach((r) => {
            const saleDate = new Date(r.sale_date || new Date());
            const months = parseInt(r.warranty_months, 10) || 12;
            const expiry = new Date(saleDate);
            expiry.setMonth(expiry.getMonth() + months);
            expiry.setDate(expiry.getDate() + WARRANTY_GRACE_DAYS);
            const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const entry = {
                serial_id: r.id,
                serial_code: r.serial_code,
                invoice_no: r.invoice_no,
                sale_date: r.sale_date,
                product_name: r.product_name,
                customer_name: r.customer_name,
                customer_phone: r.customer_phone,
                warranty_months: months,
                warranty_expiry: expiry.toISOString().split('T')[0],
                days_remaining: daysRemaining,
            };
            if (daysRemaining < 0) expired.push(entry);
            else if (daysRemaining <= windowDays) expiringSoon.push(entry);
            else valid.push(entry);
        });

        expired.sort((a, b) => a.days_remaining - b.days_remaining);
        expiringSoon.sort((a, b) => a.days_remaining - b.days_remaining);
        valid.sort((a, b) => a.days_remaining - b.days_remaining);

        return res.status(200).json({
            success: true,
            grace_days: WARRANTY_GRACE_DAYS,
            window_days: windowDays,
            summary: {
                total: rows.length,
                expired_count: expired.length,
                expiring_count: expiringSoon.length,
                valid_count: valid.length,
            },
            expired: expired.slice(0, 30),
            expiring: expiringSoon.slice(0, 30),
            valid: valid.slice(0, 10),
        });
    } catch (err) {
        console.error('Get expiring warranties error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.checkWarranty = async (req, res) => {
    try {
        await ensureWarrantyTables();
        const query = (req.query.query || '').trim();
        if (!query) {
            return res.status(400).json({ success: false, message: 'Please provide a Serial Number or Invoice Number to check.' });
        }

        // ১. Check by Serial Number in sales_item_serials
        const serialSql = `
            SELECT 
                sis.serial_code,
                s.id AS sale_id,
                s.invoice_no AS invoice_no,
                s.sale_date,
                s.created_at AS sale_timestamp,
                COALESCE(c.name, 'Walk-in Customer') AS customer_name,
                COALESCE(c.phone, 'N/A') AS customer_phone,
                p.id AS product_id,
                p.name AS product_name,
                COALESCE(b.name, 'General') AS brand_name,
                COALESCE(p.warranty_months, 12) AS warranty_months,
                si.unit_price,
                pos.id AS purchase_serial_id,
                po.created_at AS purchase_date,
                sup.name AS supplier_name
            FROM sales_item_serials sis
            JOIN sales_items si ON si.id = sis.sales_item_id
            JOIN sales s ON s.id = si.sale_id
            JOIN products p ON p.id = si.product_id
            LEFT JOIN brands b ON b.id = p.brand_id
            LEFT JOIN customers c ON c.id = s.customer_id
            LEFT JOIN purchase_order_serials pos ON pos.serial_code = sis.serial_code
            LEFT JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
            LEFT JOIN purchase_orders po ON po.id = poi.purchase_order_id
            LEFT JOIN suppliers sup ON sup.id = po.supplier_id
            WHERE LOWER(sis.serial_code) = LOWER($1)
            ORDER BY s.id DESC
            LIMIT 1;
        `;

        const serialRes = await pool.query(serialSql, [query]);

        if (serialRes.rows.length > 0) {
            const row = serialRes.rows[0];
            const saleDate = new Date(row.sale_date || row.sale_timestamp || new Date());
            const months = parseInt(row.warranty_months, 10) || 12;
            const customerExpiry = new Date(saleDate);
            customerExpiry.setMonth(customerExpiry.getMonth() + months);
            customerExpiry.setDate(customerExpiry.getDate() + 60);

            const now = new Date();
            const isCustomerValid = now <= customerExpiry;
            const msDiff = customerExpiry.getTime() - now.getTime();
            const daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));

            // Vendor warranty calculation
            let vendorWarrantyText = '1 Year Standard Supplier Warranty';
            let isVendorValid = true;
            if (row.purchase_date) {
                const purchDate = new Date(row.purchase_date);
                const vendorExpiry = new Date(purchDate);
                vendorExpiry.setMonth(vendorExpiry.getMonth() + (months > 12 ? months : 24));
                vendorExpiry.setDate(vendorExpiry.getDate() + 60);
                isVendorValid = now <= vendorExpiry;
                const vDiffDays = Math.max(0, Math.ceil((vendorExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                vendorWarrantyText = isVendorValid ? `${vDiffDays} days remaining (Vendor: ${row.supplier_name || 'Brand Center'})` : 'Expired from Supplier';
            }

            // Also check previous warranty claims on this serial
            const pastClaimsRes = await pool.query(
                `SELECT claim_no, status, issue_description, received_date, replacement_serial_code 
                 FROM warranty_claims 
                 WHERE LOWER(serial_code) = LOWER($1) 
                 ORDER BY id DESC LIMIT 5`,
                [query]
            );

            return res.status(200).json({
                success: true,
                match_type: 'SERIAL',
                data: {
                    serial_code: row.serial_code,
                    product_id: row.product_id,
                    product_name: row.product_name,
                    brand_name: row.brand_name,
                    invoice_no: row.invoice_no,
                    sale_date: row.sale_date,
                    customer_name: row.customer_name,
                    customer_phone: row.customer_phone,
                    unit_price: row.unit_price,
                    warranty_months: months,
                    customer_warranty_expiry: customerExpiry.toISOString().split('T')[0],
                    is_customer_warranty_valid: isCustomerValid,
                    customer_days_remaining: daysRemaining,
                    is_vendor_warranty_valid: isVendorValid,
                    vendor_warranty_info: vendorWarrantyText,
                    supplier_name: row.supplier_name || 'Authorized Importer',
                    past_claims: pastClaimsRes.rows
                }
            });
        }

        // ২. Check by Invoice Number in sales
        const invoiceSql = `
            SELECT 
                s.id AS sale_id,
                s.invoice_no AS invoice_no,
                s.sale_date,
                s.created_at AS sale_timestamp,
                COALESCE(c.name, 'Walk-in Customer') AS customer_name,
                COALESCE(c.phone, 'N/A') AS customer_phone,
                s.total_amount
            FROM sales s
            LEFT JOIN customers c ON c.id = s.customer_id
            WHERE LOWER(s.invoice_no) = LOWER($1)
            LIMIT 1;
        `;
        const invoiceRes = await pool.query(invoiceSql, [query]);

        if (invoiceRes.rows.length > 0) {
            const sale = invoiceRes.rows[0];
            const itemsRes = await pool.query(`
                SELECT si.id, si.product_id, COALESCE(p.name, 'Product') AS product_name, 
                       si.quantity, si.unit_price, COALESCE(p.warranty_months, 12) AS warranty_months
                FROM sales_items si
                LEFT JOIN products p ON p.id = si.product_id
                WHERE si.sale_id = $1
            `, [sale.sale_id]);

            const itemIds = itemsRes.rows.map(it => it.id);
            let serialsMap = {};
            if (itemIds.length > 0) {
                const sRes = await pool.query(
                    `SELECT sales_item_id, serial_code FROM sales_item_serials WHERE sales_item_id = ANY($1::int[])`,
                    [itemIds]
                );
                sRes.rows.forEach(s => {
                    if (!serialsMap[s.sales_item_id]) serialsMap[s.sales_item_id] = [];
                    serialsMap[s.sales_item_id].push(s.serial_code);
                });
            }

            const saleDate = new Date(sale.sale_date || sale.sale_timestamp || new Date());
            const itemsWithWarranty = itemsRes.rows.map(item => {
                const months = parseInt(item.warranty_months, 10) || 12;
                const expiry = new Date(saleDate);
                expiry.setMonth(expiry.getMonth() + months);
                expiry.setDate(expiry.getDate() + 60);
                const isCustValid = new Date() <= expiry;
                const daysRemaining = Math.max(0, Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                return {
                    ...item,
                    serials: serialsMap[item.id] || [],
                    customer_warranty_expiry: expiry.toISOString().split('T')[0],
                    is_customer_warranty_valid: isCustValid,
                    customer_days_remaining: daysRemaining
                };
            });

            return res.status(200).json({
                success: true,
                match_type: 'INVOICE',
                data: {
                    invoice_no: sale.invoice_no,
                    sale_date: sale.sale_date,
                    customer_name: sale.customer_name,
                    customer_phone: sale.customer_phone,
                    total_amount: sale.total_amount,
                    items: itemsWithWarranty
                }
            });
        }

        // ৩. Check in purchase_order_serials (in-stock or unassigned)
        const unassignedSql = `
            SELECT pos.serial_code, p.name AS product_name, po.created_at AS order_date, sup.name AS supplier_name, p.id AS product_id
            FROM purchase_order_serials pos
            JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
            JOIN purchase_orders po ON po.id = poi.purchase_order_id
            JOIN products p ON p.id = poi.product_id
            LEFT JOIN suppliers sup ON sup.id = po.supplier_id
            WHERE LOWER(pos.serial_code) = LOWER($1)
            LIMIT 1;
        `;
        const unassignedRes = await pool.query(unassignedSql, [query]);
        if (unassignedRes.rows.length > 0) {
            const un = unassignedRes.rows[0];
            return res.status(200).json({
                success: true,
                match_type: 'INVENTORY_STOCK',
                data: {
                    serial_code: un.serial_code,
                    product_id: un.product_id,
                    product_name: un.product_name,
                    invoice_no: 'Unsold (In Current Shop Inventory)',
                    sale_date: null,
                    customer_name: 'In Stock / Not yet sold',
                    customer_phone: 'N/A',
                    is_customer_warranty_valid: false,
                    is_vendor_warranty_valid: true,
                    vendor_warranty_info: `Purchased on ${new Date(un.order_date).toISOString().split('T')[0]} from ${un.supplier_name || 'Vendor'}`,
                    supplier_name: un.supplier_name
                }
            });
        }

        return res.status(404).json({
            success: false,
            message: `No record found for Serial / Invoice "${query}". Make sure the S/N or Invoice number is entered correctly.`
        });
    } catch (err) {
        console.error('Check warranty error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// -------------------------------------------------------------
// ২. ওয়ারেন্টি ক্লেইম তালিকা (Get All Warranty Claims)
// -------------------------------------------------------------
exports.getClaims = async (req, res) => {
    try {
        await ensureWarrantyTables();
        const { status, search } = req.query;
        let conditions = ['deleted_at IS NULL'];
        let params = [];

        if (status && status !== 'ALL') {
            params.push(status);
            conditions.push(`status = $${params.length}`);
        }

        if (search && search.trim()) {
            params.push(`%${search.trim().toLowerCase()}%`);
            conditions.push(`(
                LOWER(claim_no) LIKE $${params.length} OR 
                LOWER(serial_code) LIKE $${params.length} OR 
                LOWER(customer_name) LIKE $${params.length} OR 
                LOWER(customer_phone) LIKE $${params.length} OR 
                LOWER(product_name) LIKE $${params.length} OR 
                LOWER(invoice_no) LIKE $${params.length}
            )`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const query = `SELECT * FROM warranty_claims ${whereClause} ORDER BY id DESC LIMIT 200;`;
        const result = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Get claims error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// -------------------------------------------------------------
// ৩. নতুন ওয়ারেন্টি ক্লেইম গ্রহণ (Create Warranty Claim)
// -------------------------------------------------------------
exports.createWarrantyClaim = async (req, res) => {
    try {
        await ensureWarrantyTables();
        const {
            order_source = 'offline',
            invoice_no,
            ecommerce_order_no,
            customer_id,
            customer_name,
            customer_phone,
            product_id,
            product_name,
            serial_code,
            barcode,
            issue_description,
            backup_unit_provided,
            estimated_delivery_date,
            service_notes
        } = req.body;

        if (!issue_description) {
            return res.status(400).json({ success: false, message: 'Please enter issue description.' });
        }

        const claim_no = 'CLM-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
        const effectiveSerial = serial_code || barcode || 'S/N-MANUAL';

        const query = `
            INSERT INTO warranty_claims 
            (claim_no, order_source, invoice_no, ecommerce_order_no, customer_id, customer_name, customer_phone, 
             product_id, product_name, serial_code, barcode, issue_description, status, backup_unit_provided, 
             estimated_delivery_date, service_notes) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Received', $13, $14, $15) 
            RETURNING *;
        `;
        const values = [
            claim_no,
            order_source,
            invoice_no || null,
            ecommerce_order_no || null,
            customer_id || null,
            customer_name || 'Walk-in Customer',
            customer_phone || '',
            product_id || null,
            product_name || 'Product Unit',
            effectiveSerial,
            barcode || effectiveSerial,
            issue_description,
            backup_unit_provided || 'None',
            estimated_delivery_date || null,
            service_notes || ''
        ];

        const result = await pool.query(query, values);

        return res.status(201).json({
            success: true,
            message: `Warranty claim accepted! Token Slip: ${claim_no}`,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Create warranty claim error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// -------------------------------------------------------------
// ৪. ক্লেইম স্ট্যাটাস আপডেট ও নিউ এস/এন সোয়াপ (Update Status)
// -------------------------------------------------------------
exports.updateClaimStatus = async (req, res) => {
    try {
        await ensureWarrantyTables();
        const { id } = req.params;
        const { status, service_notes, replacement_serial_code } = req.body;

        const updateFields = [];
        const values = [];

        if (status) {
            values.push(status);
            updateFields.push(`status = $${values.length}`);
            if (status === 'Delivered') {
                updateFields.push(`completed_date = NOW()`);
            }
        }
        if (service_notes !== undefined) {
            values.push(service_notes);
            updateFields.push(`service_notes = $${values.length}`);
        }
        if (replacement_serial_code !== undefined) {
            values.push(replacement_serial_code);
            updateFields.push(`replacement_serial_code = $${values.length}`);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields provided to update.' });
        }

        values.push(id);
        const query = `
            UPDATE warranty_claims 
            SET ${updateFields.join(', ')} 
            WHERE id = $${values.length} 
            RETURNING *;
        `;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Claim not found.' });
        }

        return res.status(200).json({
            success: true,
            message: `Claim status updated to ${status}!`,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Update claim status error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 4b. Full Claim Edit
exports.updateClaim = async (req, res) => {
    try {
        await ensureWarrantyTables();
        const { id } = req.params;
        const {
            customer_name,
            customer_phone,
            product_name,
            serial_code,
            issue_description,
            backup_unit_provided,
            status,
            service_notes,
            replacement_serial_code,
            estimated_delivery_date,
            invoice_no
        } = req.body;

        const updateFields = [];
        const values = [];

        if (customer_name !== undefined) {
            values.push(customer_name ? customer_name.trim() : null);
            updateFields.push(`customer_name = $${values.length}`);
        }
        if (customer_phone !== undefined) {
            values.push(customer_phone ? customer_phone.trim() : null);
            updateFields.push(`customer_phone = $${values.length}`);
        }
        if (product_name !== undefined) {
            values.push(product_name ? product_name.trim() : null);
            updateFields.push(`product_name = $${values.length}`);
        }
        if (serial_code !== undefined) {
            values.push(serial_code ? serial_code.trim() : null);
            updateFields.push(`serial_code = $${values.length}`);
        }
        if (issue_description !== undefined) {
            values.push(issue_description ? issue_description.trim() : null);
            updateFields.push(`issue_description = $${values.length}`);
        }
        if (backup_unit_provided !== undefined) {
            values.push(backup_unit_provided ? backup_unit_provided.trim() : null);
            updateFields.push(`backup_unit_provided = $${values.length}`);
        }
        if (status !== undefined) {
            values.push(status);
            updateFields.push(`status = $${values.length}`);
            if (status === 'Delivered') {
                updateFields.push(`completed_date = NOW()`);
            }
        }
        if (service_notes !== undefined) {
            values.push(service_notes ? service_notes.trim() : null);
            updateFields.push(`service_notes = $${values.length}`);
        }
        if (replacement_serial_code !== undefined) {
            values.push(replacement_serial_code ? replacement_serial_code.trim() : null);
            updateFields.push(`replacement_serial_code = $${values.length}`);
        }
        if (estimated_delivery_date !== undefined) {
            values.push(estimated_delivery_date || null);
            updateFields.push(`estimated_delivery_date = $${values.length}`);
        }
        if (invoice_no !== undefined) {
            values.push(invoice_no ? invoice_no.trim() : null);
            updateFields.push(`invoice_no = $${values.length}`);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields provided to update.' });
        }

        values.push(id);
        const query = `
            UPDATE warranty_claims 
            SET ${updateFields.join(', ')} 
            WHERE id = $${values.length} 
            RETURNING *;
        `;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Claim not found.' });
        }

        return res.status(200).json({
            success: true,
            message: `Warranty claim ${result.rows[0].claim_no} updated successfully!`,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('updateClaim error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// -------------------------------------------------------------
// ৫. পণ্য রিটার্ন তালিকা (Get All Product Returns)
// -------------------------------------------------------------
exports.getReturns = async (req, res) => {
    try {
        await ensureWarrantyTables();
        const { search } = req.query;
        let conditions = ['deleted_at IS NULL'];
        let params = [];

        if (search && search.trim()) {
            params.push(`%${search.trim().toLowerCase()}%`);
            conditions.push(`(
                LOWER(return_no) LIKE $${params.length} OR 
                LOWER(invoice_no) LIKE $${params.length} OR 
                LOWER(customer_name) LIKE $${params.length} OR 
                LOWER(product_name) LIKE $${params.length} OR 
                LOWER(serial_code) LIKE $${params.length}
            )`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const result = await pool.query(`SELECT * FROM product_returns ${whereClause} ORDER BY id DESC LIMIT 200;`, params);

        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Get returns error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// -------------------------------------------------------------
// ৬. প্রোডাক্ট রিটার্ন ও রিফান্ড প্রসেস করা (Process Return & Refund)
// -------------------------------------------------------------
exports.processReturn = async (req, res) => {
    const client = await pool.connect();
    try {
        await ensureWarrantyTables();
        const {
            order_source = 'offline',
            invoice_no,
            ecommerce_order_no,
            customer_id,
            customer_name,
            customer_phone,
            product_id,
            product_name,
            serial_code,
            return_qty = 1,
            return_type = 'Refund', // 'Refund' | 'Exchange' | 'Store Credit'
            refund_amount = 0,
            refund_method = 'Cash',
            condition = 'Good',     // 'Good' (Restock) | 'Damaged' (Damage bin)
            return_reason = ''
        } = req.body;

        await client.query('BEGIN');

        const return_no = 'RET-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));

        // Insert into product_returns
        const returnQuery = `
            INSERT INTO product_returns 
            (return_no, order_source, invoice_no, ecommerce_order_no, customer_id, customer_name, customer_phone,
             product_id, product_name, serial_code, return_qty, return_type, refund_amount, refund_method, condition, return_reason) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
            RETURNING *;
        `;
        const returnValues = [
            return_no,
            order_source,
            invoice_no || null,
            ecommerce_order_no || null,
            customer_id || null,
            customer_name || 'Customer',
            customer_phone || '',
            product_id || null,
            product_name || 'Product Unit',
            serial_code || '',
            parseInt(return_qty, 10) || 1,
            return_type,
            parseFloat(refund_amount) || 0,
            refund_method,
            condition,
            return_reason
        ];
        const returnRes = await client.query(returnQuery, returnValues);

        // যদি কন্ডিশন ভালো থাকে (Good), দোকানে স্টক ১ বাড়িয়ে দেওয়া
        if (condition === 'Good' && product_id) {
            await client.query(
                `UPDATE products SET stock = COALESCE(stock, 0) + $1 WHERE id = $2`,
                [parseInt(return_qty, 10) || 1, product_id]
            ).catch(() => null);
        }

        // যদি ড্যামেজ হয়, ড্যামেজ টেবিলে পাঠানো
        if (condition === 'Damaged' && product_id) {
            await client.query(
                'INSERT INTO damaged_products (product_id, quantity, note) VALUES ($1, $2, $3)', 
                [product_id, parseInt(return_qty, 10) || 1, return_reason]
            ).catch(() => null);
        }

        // যদি রিফান্ড মানি ওয়ালেটে যোগ করার কথা থাকে
        // রিফান্ডের বেলায় ডেবিট/ক্রেডিট দিক:
        //  - 'Customer Ledger' = স্টোর ক্রেডিট → কাস্টমারের ওয়ালেটে ক্রেডিট, ড্রয়ার অপরিবর্তিত
        //  - Cash/Bank/MFS = প্রকৃত টাকা ফেরত → ড্রয়ার থেকে ক্যাশ বের হয় + ledger
        if (parseFloat(refund_amount) > 0) {
            const refundAmt = parseFloat(refund_amount);
            if (refund_method === 'Customer Ledger' && customer_id) {
                await ensureWalletSchema();
                const custWalletRes = await client.query('SELECT wallet_balance FROM customers WHERE id = $1', [customer_id]);
                const custWallet = parseFloat(custWalletRes.rows[0]?.wallet_balance || 0) || 0;
                await client.query(
                    'UPDATE customers SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2',
                    [refundAmt, customer_id]
                );
                await client.query(
                    'UPDATE customers SET receivable_balance = COALESCE(receivable_balance, 0) - $1 WHERE id = $2',
                    [refundAmt, customer_id]
                );
                await writeWalletLedger(client, {
                    party_type: 'customer', party_id: Number(customer_id), party_name: customer_name || 'Customer',
                    type: 'return_store_credit', amount: refundAmt, credit: true,
                    account_effect: 'none', cash_drawer_effect: 'none',
                    reference: return_no, note: `Product return ${return_no} — store credit into wallet`,
                    balance_before: custWallet, balance_after: custWallet + refundAmt,
                });
            } else {
                // Cash / Bank / MFS refund → money physically leaves the cash drawer
                const drawerRes = await client.query("SELECT id, name FROM payment_accounts WHERE account_type = 'drawer' OR id = 1 LIMIT 1")
                    .catch(() => ({ rows: [] }));
                if (drawerRes.rows.length) {
                    const drawerId = drawerRes.rows[0].id;
                    await client.query(
                        'UPDATE payment_accounts SET balance = balance - $1 WHERE id = $2',
                        [refundAmt, drawerId]
                    );
                    const isNonCash = String(refund_method || '').toLowerCase() !== 'cash';
                    await client.query(`
                        INSERT INTO account_transactions (account_id, type, amount, reference, note, created_at)
                        VALUES ($1, 'refund', $2, $3, $4, NOW())
                    `, [drawerId, refundAmt, return_no,
                        `Product return ${return_no} refund (${refund_method || 'Cash'})${isNonCash ? ' — manual transaction ID entry required' : ''}`]);
                }
            }
        }

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: `Product return ${return_no} processed successfully! ${condition === 'Good' ? 'Restocked into active inventory.' : 'Sent to damage quarantine.'}`,
            data: returnRes.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Process return error:', error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

// 7. Delete Claim (Soft Delete to Trash)
exports.deleteClaim = async (req, res) => {
    try {
        const { id } = req.params;
        const claimId = parseInt(id, 10);
        if (!claimId) return res.status(400).json({ success: false, message: 'Invalid claim ID' });

        const existing = await pool.query('SELECT * FROM warranty_claims WHERE id = $1', [claimId]);
        if (!existing.rows.length) return res.status(404).json({ success: false, message: 'Claim not found' });

        const row = existing.rows[0];
        await pool.query('UPDATE warranty_claims SET deleted_at = NOW() WHERE id = $1', [claimId]);
        await pool.query(
            `INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
             VALUES ('warranty_claims', $1, $2, $3, NOW())`,
            [claimId, `Warranty Claim ${row.claim_no}`, JSON.stringify(row)]
        ).catch(() => null);

        return res.status(200).json({ success: true, message: `Warranty claim ${row.claim_no} moved to Trash.` });
    } catch (err) {
        console.error('Delete claim error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 8. Delete Return (Soft Delete to Trash)
exports.deleteReturn = async (req, res) => {
    try {
        const { id } = req.params;
        const returnId = parseInt(id, 10);
        if (!returnId) return res.status(400).json({ success: false, message: 'Invalid return ID' });

        const existing = await pool.query('SELECT * FROM product_returns WHERE id = $1', [returnId]);
        if (!existing.rows.length) return res.status(404).json({ success: false, message: 'Return not found' });

        const row = existing.rows[0];
        await pool.query('UPDATE product_returns SET deleted_at = NOW() WHERE id = $1', [returnId]);
        await pool.query(
            `INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
             VALUES ('product_returns', $1, $2, $3, NOW())`,
            [returnId, `Product Return ${row.return_no}`, JSON.stringify(row)]
        ).catch(() => null);

        return res.status(200).json({ success: true, message: `Product return ${row.return_no} moved to Trash.` });
    } catch (err) {
        console.error('Delete return error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 9. Update Return (Edit Return Record)
exports.updateReturn = async (req, res) => {
    try {
        await ensureWarrantyTables();
        const { id } = req.params;
        const {
            customer_name,
            customer_phone,
            product_name,
            serial_code,
            return_type,
            condition,
            refund_amount,
            return_reason,
            invoice_no
        } = req.body;

        const updateFields = [];
        const values = [];

        if (customer_name !== undefined) {
            values.push(customer_name ? customer_name.trim() : null);
            updateFields.push(`customer_name = $${values.length}`);
        }
        if (customer_phone !== undefined) {
            values.push(customer_phone ? customer_phone.trim() : null);
            updateFields.push(`customer_phone = $${values.length}`);
        }
        if (product_name !== undefined) {
            values.push(product_name ? product_name.trim() : null);
            updateFields.push(`product_name = $${values.length}`);
        }
        if (serial_code !== undefined) {
            values.push(serial_code ? serial_code.trim() : null);
            updateFields.push(`serial_code = $${values.length}`);
        }
        if (return_type !== undefined) {
            values.push(return_type);
            updateFields.push(`return_type = $${values.length}`);
        }
        if (condition !== undefined) {
            values.push(condition);
            updateFields.push(`condition = $${values.length}`);
        }
        if (refund_amount !== undefined) {
            values.push(parseFloat(refund_amount || 0));
            updateFields.push(`refund_amount = $${values.length}`);
        }
        if (return_reason !== undefined) {
            values.push(return_reason ? return_reason.trim() : null);
            updateFields.push(`return_reason = $${values.length}`);
        }
        if (invoice_no !== undefined) {
            values.push(invoice_no ? invoice_no.trim() : null);
            updateFields.push(`invoice_no = $${values.length}`);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields provided to update.' });
        }

        values.push(id);
        const query = `
            UPDATE product_returns 
            SET ${updateFields.join(', ')} 
            WHERE id = $${values.length} 
            RETURNING *;
        `;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Return record not found.' });
        }

        return res.status(200).json({
            success: true,
            message: `Product return ${result.rows[0].return_no} updated successfully!`,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('updateReturn error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

