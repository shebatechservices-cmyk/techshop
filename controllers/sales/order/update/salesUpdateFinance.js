const { money } = require('../../helpers/salesFormatHelpers');
const { applySaleTender, reverseSaleTender } = require('../../helpers/salesTenderHelpers');
const { drawerLedgerOnly } = require('../../../walletController');

/**
 * Handles financial calculations, customer ledger, tender re-settlement,
 * and project equipment updates.
 */
const settleSaleFinanceAndTenders = async (client, {
    sale,
    id,
    customer_id,
    subtotal,
    rawDiscount,
    rawVat,
    rawSetupCharge,
    rawExtraCost,
    extra_cost_category,
    extra_cost_notes,
    rawPaid,
    payment_method_id,
    payment_details,
    loyalty_points_to_use,
    sales_person,
    destination,
    attention,
    invoice_date,
    notes,
    projectRes,
    itemsList,
    paymentTendersFromReq,
}) => {
    const discount = money(rawDiscount);
    const vat = money(rawVat);
    const setupCharge = money(rawSetupCharge);
    const extraCost = money(rawExtraCost);

    let discountFromLoyalty = 0;
    const loyaltyToUse = Number(loyalty_points_to_use || 0);
    const custLoyaltyRes = await client.query('SELECT loyalty_points FROM customers WHERE id = $1', [Number(customer_id)]);
    const availablePoints = money(custLoyaltyRes.rows[0]?.loyalty_points || 0);

    if (loyaltyToUse > 0) {
        const previouslyUsed = money(sale.loyalty_points_used || 0);
        const needExtra = Math.max(0, loyaltyToUse - previouslyUsed);
        if (availablePoints < needExtra) {
            const err = new Error(`Insufficient loyalty points! Available: ${availablePoints}`);
            err.status = 400;
            throw err;
        }
        await client.query('UPDATE customers SET loyalty_points = COALESCE(loyalty_points, 0) + $1 WHERE id = $2', [previouslyUsed, Number(customer_id)]);
        await client.query('UPDATE customers SET loyalty_points = COALESCE(loyalty_points, 0) - $1 WHERE id = $2', [loyaltyToUse, Number(customer_id)]);
        discountFromLoyalty = loyaltyToUse;
    } else if (money(sale.loyalty_points_used || 0) > 0) {
        await client.query('UPDATE customers SET loyalty_points = COALESCE(loyalty_points, 0) + $1 WHERE id = $2', [money(sale.loyalty_points_used), Number(customer_id)]);
    }

    const totalAmount = Math.max(0, subtotal - discount - discountFromLoyalty + vat + setupCharge + extraCost);
    const totalPaid = money(rawPaid);
    const totalDue = Math.max(0, totalAmount - totalPaid);
    const paymentStatus = totalDue === 0 ? 'paid' : (totalPaid > 0 ? 'partial' : 'unpaid');
    const pointsEarned = Math.floor(totalPaid / 100);
    const oldPointsEarned = money(sale.loyalty_points_earned || 0);

    // 1. Customer balances
    const oldDue = money(sale.due_amount || 0);
    const dueDelta = totalDue - oldDue;
    if (dueDelta !== 0) {
        await client.query(
            `UPDATE customers SET receivable_balance = GREATEST(0, COALESCE(receivable_balance, 0) + $1) WHERE id = $2`,
            [dueDelta, Number(customer_id)]
        );
    }
    const pointsDelta = pointsEarned - oldPointsEarned;
    if (pointsDelta !== 0) {
        await client.query(
            `UPDATE customers SET loyalty_points = GREATEST(0, COALESCE(loyalty_points, 0) + $1) WHERE id = $2`,
            [pointsDelta, Number(customer_id)]
        );
    }

    // 2. Payment & wallet reversal + new settlement
    let oldTenders = [];
    try {
        oldTenders = Array.isArray(sale.payment_details)
            ? (typeof sale.payment_details === 'string' ? JSON.parse(sale.payment_details) : sale.payment_details)
            : [];
    } catch (e) { oldTenders = []; }

    if (oldTenders.length > 0) {
        for (const t of oldTenders) {
            await reverseSaleTender(client, {
                customerId: Number(customer_id),
                invoiceNo: sale.invoice_no,
                tender: t,
                ledgerType: 'sale_edit_refund',
                reasonNote: 'edited',
            });
        }
    } else if (money(sale.paid_amount) > 0) {
        await reverseSaleTender(client, {
            customerId: Number(customer_id),
            invoiceNo: sale.invoice_no,
            tender: { amount: sale.paid_amount, payment_mode: 'Cash' },
            ledgerType: 'sale_edit_refund',
            reasonNote: 'edited',
        });
    }

    const tenderList = Array.isArray(payment_details) && payment_details.length > 0
        ? payment_details.filter((t) => money(t.amount || t.quantity) > 0)
        : (Array.isArray(paymentTendersFromReq) && paymentTendersFromReq.length > 0
            ? paymentTendersFromReq.filter((t) => money(t.amount || t.quantity) > 0)
            : []);

    await client.query('DELETE FROM payments WHERE sale_id = $1', [id]).catch(() => null);

    let walletUsed = 0;
    if (tenderList.length > 0) {
        for (const tender of tenderList) {
            const tenderAmount = money(tender.amount || tender.quantity || 0);
            if (tenderAmount <= 0) continue;
            await client.query(
                `INSERT INTO payments (sale_id, payment_mode, account_name, reference_no, amount, created_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                [
                    id,
                    tender.payment_mode || tender.method || 'Cash',
                    tender.account_name || null,
                    tender.reference_no || null,
                    tenderAmount,
                ]
            );
            const res = await applySaleTender(client, {
                customerId: Number(customer_id),
                invoiceNo: sale.invoice_no,
                tender,
                ledgerType: 'sale_payment',
            });
            if (res.type === 'wallet') {
                walletUsed += res.amount;
            }
        }
    } else if (totalPaid > 0) {
        await applySaleTender(client, {
            customerId: Number(customer_id),
            invoiceNo: sale.invoice_no,
            tender: { amount: totalPaid, payment_mode: 'Cash' },
            ledgerType: 'sale_payment',
        });
        await client.query(
            `INSERT INTO payments (sale_id, payment_mode, account_name, reference_no, amount, created_at)
             VALUES ($1, 'Cash', null, null, totalPaid]`,
            [id, 'Cash', null, null, totalPaid]
        );
    }

    if (walletUsed > 0) {
        await drawerLedgerOnly(client, 'wallet_settlement', walletUsed, sale.invoice_no, `Customer wallet payment for edited sale #${sale.invoice_no} (drawer unchanged)`);
    }

    // 3. Update sale header
    const updatedSaleRes = await client.query(
        `UPDATE sales SET
            customer_id = $1,
            subtotal = $2,
            discount = $3,
            vat = $4,
            setup_charge = $5,
            extra_cost = $6,
            extra_cost_category = COALESCE($7, extra_cost_category),
            extra_cost_notes = COALESCE($8, extra_cost_notes),
            total_amount = $9,
            paid_amount = $10,
            due_amount = $11,
            payment_status = $12,
            payment_details = $13,
            loyalty_points_earned = $14,
            loyalty_points_used = $15,
            payment_method_id = $16,
            sales_person = $17,
            destination = $18,
            attention = $19,
            notes = COALESCE($20, notes),
            invoice_date = COALESCE($21::date, invoice_date)
         WHERE id = $22 RETURNING *`,
        [
            Number(customer_id),
            subtotal,
            discount + discountFromLoyalty,
            vat,
            setupCharge,
            extraCost,
            extra_cost_category,
            extra_cost_notes,
            totalAmount,
            totalPaid,
            totalDue,
            paymentStatus,
            JSON.stringify(tenderList),
            pointsEarned,
            loyaltyToUse,
            payment_method_id,
            sales_person,
            destination,
            attention,
            notes || null,
            invoice_date || null,
            id,
        ]
    );

    // 4. Synchronize linked projects
    if (projectRes.rows.length > 0) {
        const activeProjects = projectRes.rows.filter(p => p.status !== 'completed');
        if (activeProjects.length > 0) {
            const updatedEquipment = (itemsList || []).map(it => ({
                product_id: it.product_id,
                product_name: it.product_name || it.name || 'Product',
                quantity: Number(it.quantity || 1),
                unit_price: Number(it.unit_price || it.price || 0),
                warranty_months: it.warranty_months || 0
            }));
            for (const p of activeProjects) {
                await client.query(`
                    UPDATE service_projects 
                    SET equipment_details = $1,
                        customer_id = COALESCE($2, customer_id),
                        updated_at = NOW()
                    WHERE id = $3
                `, [JSON.stringify(updatedEquipment), Number(customer_id) || null, p.id]);
            }
        }
    }

    return {
        updatedSale: updatedSaleRes.rows[0],
        totalAmount,
        totalPaid,
        totalDue,
        paymentStatus,
    };
};

module.exports = {
    settleSaleFinanceAndTenders,
};
