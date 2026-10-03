const money = (val) => Number.parseFloat(val || 0) || 0;

/**
 * Reconciles and updates supplier payable balance when purchase order due changes or supplier changes.
 */
const adjustSupplierPayableBalance = async (client, {
    targetSupplierId,
    oldSupplierId,
    newDue = 0,
    oldDue = 0,
}) => {
    const targetSupId = targetSupplierId ? Number(targetSupplierId) : null;
    const oldSupId = oldSupplierId ? Number(oldSupplierId) : null;
    const effectiveNewDue = money(newDue);
    const effectiveOldDue = money(oldDue);

    if (targetSupId !== oldSupId) {
        if (oldSupId && effectiveOldDue > 0) {
            await client.query(
                `UPDATE suppliers 
                 SET payable_balance = GREATEST(0, COALESCE(payable_balance, 0) - $1), updated_at = NOW() 
                 WHERE id = $2`,
                [effectiveOldDue, oldSupId]
            );
        }
        if (targetSupId && effectiveNewDue > 0) {
            await client.query(
                `UPDATE suppliers 
                 SET payable_balance = COALESCE(payable_balance, 0) + $1, updated_at = NOW() 
                 WHERE id = $2`,
                [effectiveNewDue, targetSupId]
            );
        }
    } else {
        const dueDelta = effectiveNewDue - effectiveOldDue;
        if (dueDelta !== 0 && targetSupId) {
            await client.query(
                `UPDATE suppliers 
                 SET payable_balance = GREATEST(0, COALESCE(payable_balance, 0) + $1), updated_at = NOW()
                 WHERE id = $2`,
                [dueDelta, targetSupId]
            );
        }
    }
};

/**
 * Synchronizes purchase order extra cost (logistics/transport) to expenses table.
 * If extraCost > 0, creates or updates an expense record with unique voucher_no 'EXP-${poNumber}'.
 * If extraCost is 0 and previous extraCost was > 0, removes the expense record.
 */
const syncPurchaseExtraCostExpense = async (client, {
    poNumber,
    extraCost,
    oldExtraCost = 0,
    extraCostCategory,
    extraCostNotes,
    payeeName = 'Supplier',
}) => {
    const effectiveExtraCost = money(extraCost);
    const voucherNo = `EXP-${poNumber}`;

    if (effectiveExtraCost > 0) {
        await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_voucher_no ON expenses (voucher_no)');

        const catName = extraCostCategory || 'Transportation & Logistics';
        const expNote = extraCostNotes
            ? `PO ${poNumber} - ${extraCostNotes}`
            : `Purchase Order ${poNumber} Extra Cost (${catName})`;

        let categoryId = null;
        const catRes = await client.query(
            'SELECT id FROM expense_categories WHERE LOWER(name) LIKE $1 OR LOWER(name) LIKE $2 LIMIT 1',
            [`%${catName.toLowerCase().slice(0, 10)}%`, '%transport%']
        );
        if (catRes.rows.length > 0) {
            categoryId = catRes.rows[0].id;
        }

        await client.query(
            `INSERT INTO expenses (voucher_no, category_id, category_name, expense_date, amount, payee_name, reference_no, note)
             VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7)
             ON CONFLICT (voucher_no) DO UPDATE 
             SET category_id = EXCLUDED.category_id, category_name = EXCLUDED.category_name, 
                 amount = EXCLUDED.amount, payee_name = EXCLUDED.payee_name, note = EXCLUDED.note`,
            [voucherNo, categoryId, catName, effectiveExtraCost, payeeName, poNumber, expNote]
        );
    } else if (effectiveExtraCost === 0 && money(oldExtraCost) > 0) {
        await client.query('DELETE FROM expenses WHERE voucher_no = $1', [voucherNo]).catch(() => null);
    }
};

module.exports = {
    adjustSupplierPayableBalance,
    syncPurchaseExtraCostExpense,
};
