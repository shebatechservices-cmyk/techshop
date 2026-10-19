const pool = require('../../../config/db');
const { money } = require('../salesHelpers');

const normalizeQuoteItems = (items) => {
    let subtotal = 0;
    const normalized = items.map((it) => {
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
    return { normalized, subtotal };
};

const insertQuoteItems = async (client, quoteId, items) => {
    for (const item of items) {
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

        const { normalized: normalizedItems, subtotal } = normalizeQuoteItems(items);
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
        await insertQuoteItems(client, quoteId, normalizedItems);

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

        const { normalized: normalizedItems, subtotal } = normalizeQuoteItems(items);
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
        await insertQuoteItems(client, id, normalizedItems);

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
