const pool = require('../../config/db');
const {
    money,
    makePoNumber,
    ensurePurchaseColumns,
    applyPurchasePayment,
} = require('./purchaseHelpers');

const createOrder = async (req, res) => {
    await ensurePurchaseColumns();
    const {
        supplier_id,
        transaction_reference,
        extra_cost,
        extra_cost_category,
        extra_cost_notes,
        items = [],
        payments = [],
    } = req.body;

    if (!supplier_id) return res.status(400).json({ error: 'Please select a supplier' });
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Please add at least one product' });
    }

    const seenProductIds = new Set();
    for (const item of items) {
        const pid = parseInt(item.product_id, 10);
        if (!pid) {
            return res.status(400).json({ error: 'Please select a valid product for each line item' });
        }
        if (seenProductIds.has(pid)) {
            return res.status(400).json({ error: 'The same item cannot be added twice in a single purchase order.' });
        }
        seenProductIds.add(pid);
    }

    const seenPaymentMethods = new Set();
    for (const pay of payments) {
        const method = (pay.payment_method || 'Cash').trim();
        if (money(pay.amount) > 0) {
            if (seenPaymentMethods.has(method)) {
                return res.status(400).json({ error: `The same payment method "${method}" cannot be used twice in a single purchase.` });
            }
            seenPaymentMethods.add(method);
        }
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const supplier = await client.query('SELECT id, name FROM suppliers WHERE id = $1', [supplier_id]);
        if (!supplier.rows.length) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Supplier not found' });
        }

        const extraCost = money(extra_cost);
        let totalCost = extraCost;
        let totalSale = 0;
        let unitCount = 0;

        const normalizedItems = items.map((item, index) => {
            const quantity = Number(item.quantity || 0);
            const costPrice = money(item.cost_price);
            const salePrice = money(item.sale_price);
            const finalSale = money(item.final_sale_price);
            if (!item.product_id) {
                throw Object.assign(new Error('Please select a product'), { status: 400 });
            }
            if (costPrice <= 0) {
                throw Object.assign(new Error('Please enter a valid cost price greater than 0 for each item'), { status: 400 });
            }
            if (!item.expected_date) {
                throw Object.assign(new Error('Please provide expected date for each item'), { status: 400 });
            }
            totalCost += costPrice * quantity;
            totalSale += finalSale * quantity;
            unitCount += quantity;

            const rawWarranty = item.warranty_months;
            let cleanWarranty = 0;
            if (typeof rawWarranty === 'number' && !isNaN(rawWarranty)) {
                cleanWarranty = Math.round(rawWarranty);
            } else if (rawWarranty) {
                const parsed = parseInt(String(rawWarranty).replace(/[^0-9]/g, ''), 10);
                cleanWarranty = isNaN(parsed) ? 0 : parsed;
            }

            return {
                product_id: parseInt(item.product_id, 10) || 0,
                quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
                cost_price: costPrice,
                sale_price: salePrice,
                margin_type: item.margin_type || 'percentage',
                margin_value: money(item.margin_value),
                final_sale_price: finalSale,
                line_total: costPrice * quantity,
                expected_date: item.expected_date,
                warranty_months: cleanWarranty,
                sort_order: index + 1,
                serials: Array.isArray(item.serials) ? item.serials.filter(Boolean) : [],
            };
        });

        const allPayloadSerials = [];
        for (const item of normalizedItems) {
            if (Array.isArray(item.serials)) {
                for (const s of item.serials) {
                    const trimmed = String(s || '').trim();
                    if (trimmed) {
                        const lower = trimmed.toLowerCase();
                        if (allPayloadSerials.includes(lower)) {
                            throw Object.assign(
                                new Error(`Duplicate serial/barcode "${trimmed}" found within this purchase order submission`),
                                { status: 400 }
                            );
                        }
                        allPayloadSerials.push(lower);
                    }
                }
            }
        }

        if (allPayloadSerials.length > 0) {
            const existingSerialsRes = await client.query(
                `SELECT pos.serial_code, po.po_number, p.name AS product_name
                 FROM purchase_order_serials pos
                 JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
                 JOIN purchase_orders po ON po.id = poi.purchase_order_id
                 JOIN products p ON p.id = poi.product_id
                 WHERE LOWER(TRIM(pos.serial_code)) = ANY($1)
                   AND po.deleted_at IS NULL
                 LIMIT 5`,
                [allPayloadSerials]
            );
            if (existingSerialsRes.rows.length > 0) {
                const duplicates = existingSerialsRes.rows.map(r => `"${r.serial_code}" (in PO ${r.po_number || 'N/A'}, Product: ${r.product_name || 'N/A'})`).join(', ');
                throw Object.assign(
                    new Error(`The following serial(s)/barcode(s) already exist in Inventory: ${duplicates}`),
                    { status: 400 }
                );
            }
        }

        const tenders = Array.isArray(payments) ? payments : [];
        let totalPaid = 0;
        for (const tender of tenders) {
            totalPaid += money(tender.amount || 0);
        }

        const totalDue = tenders.length === 0 ? totalCost : Math.max(0, totalCost - totalPaid);
        const paymentStatus = totalDue === 0 ? 'PAID' : 'approved';

        const poNumber = makePoNumber();

        const order = await client.query(
            `INSERT INTO purchase_orders (
                po_number, supplier_id, transaction_reference,
                total_cost, total_sale, extra_cost, extra_cost_category, extra_cost_notes, total_paid, total_due,
                item_count, unit_count, status
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
              RETURNING *`,
            [
                poNumber,
                supplier_id,
                transaction_reference || null,
                totalCost,
                totalSale,
                extraCost,
                extra_cost_category || null,
                extra_cost_notes || null,
                totalPaid,
                totalDue,
                normalizedItems.length,
                unitCount,
                paymentStatus,
            ]
        );
        const orderId = order.rows[0].id;

        if (extraCost > 0) {
            try {
                const catName = extra_cost_category || 'Transportation & Logistics';
                const payeeName = supplier.rows[0].name || 'Supplier';
                const expNote = extra_cost_notes
                    ? `PO ${poNumber} - ${extra_cost_notes}`
                    : `Purchase Order ${poNumber} Extra Cost (${catName})`;
                await client.query(
                    `INSERT INTO expenses (voucher_no, category_name, amount, expense_date, payee_name, reference_no, note)
                     VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6)
                     ON CONFLICT (voucher_no) DO UPDATE 
                     SET category_name = EXCLUDED.category_name, amount = EXCLUDED.amount, note = EXCLUDED.note`,
                    [`EXP-${poNumber}`, catName, extraCost, payeeName, poNumber, expNote]
                );
            } catch (expErr) {
                console.warn('Expense recording for PO extra cost notice:', expErr.message);
            }
        }

        for (const item of normalizedItems) {
            const product = await client.query('SELECT id, conversion_rate, unit_name, sub_unit_name FROM products WHERE id = $1', [item.product_id]);
            if (!product.rows.length) {
                throw Object.assign(new Error('A product was not found'), { status: 400 });
            }
            const prodData = product.rows[0];
            const convRate = Number(prodData?.conversion_rate || 1);
            const isSubUnit = item.unit_type === 'sub_unit' || (prodData?.sub_unit_name && item.unit === prodData?.sub_unit_name);
            const stockIncrement = isSubUnit ? (Number(item.quantity) || 1) : (Number(item.quantity) || 1) * (convRate > 1 ? convRate : 1);

            let supplierWarrantyExpireDate = null;
            const supplierWarrantyMonths = Math.max(0, parseInt(item.supplier_warranty_months !== undefined && item.supplier_warranty_months !== null ? item.supplier_warranty_months : item.warranty_months, 10) || 0);
            const customerWarrantyMonths = Math.max(0, parseInt(item.customer_warranty_months !== undefined && item.customer_warranty_months !== null ? item.customer_warranty_months : item.warranty_months, 10) || 0);
            const baseDateStr = item.expected_date || new Date().toISOString().split('T')[0];
            if (supplierWarrantyMonths > 0 && baseDateStr) {
                const baseDate = new Date(baseDateStr);
                if (!isNaN(baseDate.getTime())) {
                    const expDate = new Date(baseDate);
                    expDate.setMonth(expDate.getMonth() + supplierWarrantyMonths);
                    supplierWarrantyExpireDate = expDate.toISOString().split('T')[0];
                }
            }

            const savedItem = await client.query(
                `INSERT INTO purchase_order_items (
                    purchase_order_id, product_id, quantity, cost_price, sale_price,
                    margin_type, margin_value, final_sale_price, line_total,
                    expected_date, warranty_months, sort_order, supplier_warranty_expire_date,
                    supplier_warranty_months, customer_warranty_months
                 ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
                  RETURNING id`,
                [
                    orderId,
                    item.product_id,
                    item.quantity,
                    item.cost_price,
                    item.sale_price,
                    item.margin_type,
                    item.margin_value,
                    item.final_sale_price,
                    item.line_total,
                    item.expected_date,
                    customerWarrantyMonths,
                    item.sort_order,
                    supplierWarrantyExpireDate,
                    supplierWarrantyMonths,
                    customerWarrantyMonths,
                ]
            );

            for (const serial of item.serials) {
                await client.query(
                    'INSERT INTO purchase_order_serials (purchase_order_item_id, serial_code) VALUES ($1, $2)',
                    [savedItem.rows[0].id, String(serial).trim()]
                );
            }

            const itemCostPrice = money(item.cost_price);
            const itemSalePrice = money(item.final_sale_price || item.sale_price);

            await client.query(
                `UPDATE products
                 SET stock = COALESCE(stock, 0) + $1,
                     purchase_count = COALESCE(purchase_count, 0) + 1,
                     purchased_at = NOW(),
                     purchase_price = $6::numeric,
                     selling_price = CASE WHEN $7::numeric > 0 THEN $7::numeric ELSE selling_price END,
                     mrp = CASE WHEN $7::numeric > 0 THEN $7::numeric ELSE mrp END,
                     supplier_warranty_expire_date = COALESCE($2::date, supplier_warranty_expire_date),
                     warranty_months = CASE WHEN $3::int > 0 THEN $3::int ELSE warranty_months END,
                     barcode = CASE WHEN COALESCE(NULLIF(barcode, ''), '') = '' THEN $5::text ELSE barcode END,
                     updated_at = NOW()
                 WHERE id = $4::int`,
                [
                    stockIncrement,
                    supplierWarrantyExpireDate || null,
                    customerWarrantyMonths,
                    Number(item.product_id) || 0,
                    item.serials.length > 0 ? String(item.serials[0]).trim() : null,
                    itemCostPrice,
                    itemSalePrice,
                ]
            );

            await client.query(
                `INSERT INTO stock_levels (product_id, warehouse_id, quantity)
                 VALUES ($1, 1, $2)
                 ON CONFLICT (product_id, warehouse_id)
                 DO UPDATE SET quantity = stock_levels.quantity + EXCLUDED.quantity`,
                [Number(item.product_id) || 0, stockIncrement]
            ).catch(() => null);
        }

        for (const payment of tenders) {
            await applyPurchasePayment(client, {
                orderId,
                payment,
                poNumber: order.rows[0].po_number,
                supplierId: supplier_id,
                supplierName: supplier.rows[0].name,
            });
        }

        await client.query(
            `UPDATE suppliers
             SET payable_balance = payable_balance + $1, updated_at = NOW()
             WHERE id = $2`,
            [totalDue, supplier_id]
        );

        await client.query('COMMIT');
        res.status(201).json({
            message: 'Purchase order saved successfully',
            data: {
                ...order.rows[0],
                items: normalizedItems,
                payments: tenders,
                supplier: supplier.rows[0],
                payment_status: paymentStatus,
                total_paid: totalPaid,
                due_amount: totalDue,
            },
        });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Serial number is already in use' });
        }
        console.error(error);
        res.status(error.status || 500).json({ error: error.message || 'Failed to save purchase order' });
    } finally {
        client.release();
    }
};

module.exports = {
    createOrder
};
