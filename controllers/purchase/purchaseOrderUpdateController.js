const pool = require("../../config/db");
const {
    money,
    ensurePurchaseColumns,
    adjustSupplierPayableBalance,
    syncPurchaseExtraCostExpense,
} = require("./purchaseHelpers");
const {
    checkPoEditabilityAndSoldItems,
    validatePayloadItemsAndSerials,
    reconcilePurchaseOrderItems,
    reconcilePurchaseOrderPayments,
} = require("./purchaseOrderUpdateHelpers");

const updateOrder = async (req, res) => {
    await ensurePurchaseColumns();
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const poRes = await client.query('SELECT * FROM purchase_orders WHERE id = $1', [id]);
        if (!poRes.rows.length) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        const po = poRes.rows[0];

        const { soldProductMap, hasSales } = await checkPoEditabilityAndSoldItems(client, po, id);

        await client.query('BEGIN');

        const {
            transaction_reference,
            discount,
            extra_cost,
            extra_cost_category,
            extra_cost_notes,
            items = []
        } = req.body;

        const effectiveDiscount = money(discount !== undefined ? discount : po.discount);
        const resolvedCategoryInput = extra_cost_category !== undefined ? extra_cost_category : req.body.extraCostCategory;
        const resolvedNotesInput = extra_cost_notes !== undefined ? extra_cost_notes : req.body.extraCostNotes;
        const effectiveExtraCostCategory = resolvedCategoryInput !== undefined ? resolvedCategoryInput : po.extra_cost_category;
        const effectiveExtraCostNotes = resolvedNotesInput !== undefined ? resolvedNotesInput : po.extra_cost_notes;

        let totalCost = money(po.total_cost);
        let totalSale = money(po.total_sale);
        let unitCount = po.unit_count;

        if (Array.isArray(items) && items.length > 0) {
            await validatePayloadItemsAndSerials(client, items, id);
            const reconciled = await reconcilePurchaseOrderItems(client, {
                id,
                items,
                soldProductMap,
                effectiveDiscount,
            });
            totalCost = reconciled.totalCost;
            totalSale = reconciled.totalSale;
            unitCount = reconciled.unitCount;
        }

        const targetSupplierId = req.body.supplier_id ? parseInt(req.body.supplier_id, 10) : po.supplier_id;
        const supplierRes = await client.query('SELECT id, name FROM suppliers WHERE id = $1', [targetSupplierId]);
        const supplierName = supplierRes.rows[0]?.name || 'Supplier';

        const {
            totalPaid,
            newDue,
            paymentStatus,
            appliedTenders,
        } = await reconcilePurchaseOrderPayments(client, {
            id,
            po,
            payments: req.body.payments,
            targetSupplierId,
            supplierName,
            totalCost,
        });

        await client.query(
            `UPDATE purchase_orders 
             SET supplier_id = $1, total_cost = $2, total_sale = $3, extra_cost = $4, extra_cost_category = $5, extra_cost_notes = $6,
                 discount = $7, total_paid = $8, total_due = $9, unit_count = $10, transaction_reference = $11, status = $12, updated_at = NOW()
             WHERE id = $13`,
            [
                targetSupplierId,
                totalCost,
                totalSale,
                money(extra_cost !== undefined ? extra_cost : po.extra_cost),
                effectiveExtraCostCategory,
                effectiveExtraCostNotes,
                effectiveDiscount,
                totalPaid,
                newDue,
                unitCount,
                transaction_reference !== undefined ? transaction_reference : po.transaction_reference,
                paymentStatus,
                id
            ]
        );

        await adjustSupplierPayableBalance(client, {
            targetSupplierId,
            oldSupplierId: po.supplier_id,
            newDue,
            oldDue: po.total_due,
        });

        const effectiveExtraCost = money(extra_cost !== undefined ? extra_cost : po.extra_cost);
        const currentPoNumber = po.po_number || id;
        await syncPurchaseExtraCostExpense(client, {
            poNumber: currentPoNumber,
            extraCost: effectiveExtraCost,
            oldExtraCost: po.extra_cost,
            extraCostCategory: effectiveExtraCostCategory,
            extraCostNotes: effectiveExtraCostNotes,
            payeeName: supplierName || 'Supplier',
        });

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: `Purchase order #${po.po_number || id} updated successfully!`,
            data: {
                ...po,
                id: Number(id),
                supplier_id: targetSupplierId,
                total_cost: totalCost,
                total_sale: totalSale,
                extra_cost: effectiveExtraCost,
                extra_cost_category: extra_cost_category !== undefined ? extra_cost_category : po.extra_cost_category,
                extra_cost_notes: extra_cost_notes !== undefined ? extra_cost_notes : po.extra_cost_notes,
                discount: effectiveDiscount,
                total_paid: totalPaid,
                total_due: newDue,
                status: paymentStatus,
                payments: req.body.payments !== undefined ? appliedTenders : undefined,
            },
            hasSales
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('updateOrder error:', error);
        res.status(error.status || 500).json({ error: error.message || 'Failed to update purchase order' });
    } finally {
        client.release();
    }
};

module.exports = { updateOrder };
