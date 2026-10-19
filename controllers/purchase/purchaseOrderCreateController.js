const pool = require('../../config/db');
const {
    money,
    makePoNumber,
    ensurePurchaseColumns,
    applyPurchasePayment,
    syncPurchaseExtraCostExpense,
} = require('./purchaseHelpers');
const {
    validateOrderPayload,
    normalizeOrderItemsAndSerials,
} = require('./create/purchaseOrderValidator');
const {
    saveOrderItemsAndStock,
} = require('./create/purchaseItemStockUpdater');

const createOrder = async (req, res) => {
    await ensurePurchaseColumns();
    const {
        supplier_id,
        transaction_reference,
        discount,
        extra_cost,
        extra_cost_category,
        extra_cost_notes,
        items = [],
        payments = [],
    } = req.body;

    try {
        validateOrderPayload({ supplier_id, items, payments });
    } catch (valErr) {
        return res.status(valErr.status || 400).json({ error: valErr.message });
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
        const discountVal = money(discount || req.body.discount);
        const extraCostCat = extra_cost_category || req.body.extraCostCategory || null;
        const extraCostNote = extra_cost_notes || req.body.extraCostNotes || null;

        const {
            normalizedItems,
            itemsCost,
            totalSale,
            unitCount,
        } = await normalizeOrderItemsAndSerials(client, items);

        const supplierOrderCost = Math.max(0, itemsCost - discountVal);
        const totalCost = supplierOrderCost;

        const tenders = Array.isArray(payments) ? payments : [];
        let totalPaid = 0;
        for (const tender of tenders) {
            totalPaid += money(tender.amount || 0);
        }

        const totalDue = tenders.length === 0 ? supplierOrderCost : Math.max(0, supplierOrderCost - totalPaid);
        const paymentStatus = totalDue === 0 ? 'PAID' : (totalPaid > 0 ? 'PARTIAL' : 'approved');

        const poNumber = makePoNumber();

        const order = await client.query(
            `INSERT INTO purchase_orders (
                po_number, supplier_id, transaction_reference,
                total_cost, total_sale, discount, extra_cost, extra_cost_category, extra_cost_notes, total_paid, total_due,
                item_count, unit_count, status
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
              RETURNING *`,
            [
                poNumber,
                supplier_id,
                transaction_reference || null,
                totalCost,
                totalSale,
                discountVal,
                extraCost,
                extraCostCat,
                extraCostNote,
                totalPaid,
                totalDue,
                normalizedItems.length,
                unitCount,
                paymentStatus,
            ]
        );
        const orderId = order.rows[0].id;

        if (extraCost > 0) {
            await syncPurchaseExtraCostExpense(client, {
                poNumber,
                extraCost,
                extraCostCategory: extraCostCat,
                extraCostNotes: extraCostNote,
                payeeName: supplier.rows[0]?.name || 'Supplier',
            });
        }

        await saveOrderItemsAndStock(client, orderId, normalizedItems);

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
    createOrder,
};
