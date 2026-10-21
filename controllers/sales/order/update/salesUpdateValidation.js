/**
 * Validates administrative policy, register shifts, time expiration,
 * PIN override, warranty/return conflicts, and linked project status for sale updates.
 */
const validateSaleUpdatePolicy = async (client, sale, id, req) => {
    const settingsRes = await client.query(
        'SELECT allow_invoice_modification, invoice_edit_time_limit_hours, security_pin FROM shop_settings WHERE id = 1'
    ).catch(() => ({ rows: [] }));
    const shopSettings = settingsRes.rows[0] || {};
    const allowMod = shopSettings.allow_invoice_modification !== false;
    const editLimitHours = shopSettings.invoice_edit_time_limit_hours ?? 360;
    const configuredPin = String(shopSettings.security_pin || '1234');

    const adminPin = req.body?.admin_pin || req.headers?.['x-admin-pin'];
    const isPinValid = adminPin && String(adminPin).trim() === configuredPin;

    const createdAt = new Date(sale.created_at || Date.now());
    const shiftRes = await client.query(`
        SELECT 1 FROM register_shifts 
        WHERE status = 'closed' AND $1 <= closed_at AND (opened_at IS NULL OR $1 >= opened_at) 
        LIMIT 1
    `, [createdAt]).catch(() => ({ rows: [] }));
    const isShiftClosed = shiftRes.rows.length > 0;

    const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    const isTimeExpired = hoursOld > editLimitHours;

    if (!allowMod || isTimeExpired || isShiftClosed) {
        if (!isPinValid) {
            const reason = !allowMod
                ? 'Invoice editing is currently disabled by administrative policy.'
                : isShiftClosed
                    ? 'Cannot edit sale: The register shift for this invoice has already been closed and locked.'
                    : `Cannot edit sale: Invoice #${sale.invoice_no || id} was created ${Math.floor(hoursOld / 24)} days ago. Edits are only permitted within ${Math.floor(editLimitHours / 24)} days (${editLimitHours} hours) of creation.`;
            const err = new Error(reason);
            err.status = 400;
            throw err;
        }
    }

    if (sale.invoice_no) {
        const warrantyRes = await client.query(
            'SELECT 1 FROM warranty_claims WHERE invoice_no = $1 AND deleted_at IS NULL LIMIT 1',
            [sale.invoice_no]
        ).catch(() => ({ rows: [] }));
        if (warrantyRes.rows.length > 0) {
            const err = new Error('Cannot edit this sale invoice because warranty claims are attached to it.');
            err.status = 400;
            throw err;
        }

        const returnRes = await client.query(
            'SELECT 1 FROM product_returns WHERE invoice_no = $1 AND deleted_at IS NULL LIMIT 1',
            [sale.invoice_no]
        ).catch(() => ({ rows: [] }));
        if (returnRes.rows.length > 0) {
            const err = new Error('Cannot edit this sale invoice because customer returns are attached to it.');
            err.status = 400;
            throw err;
        }
    }

    const projectRes = await client.query(
        'SELECT id, status, project_code FROM service_projects WHERE (invoice_id = $1::int OR invoice_no = $2) AND deleted_at IS NULL',
        [Number(id) || 0, sale.invoice_no || '']
    ).catch(() => ({ rows: [] }));
    const completedProjects = projectRes.rows.filter(p => p.status === 'completed');
    const userRoleId = Number(req.user?.role_id || 0);
    if (completedProjects.length > 0 && userRoleId !== 1 && userRoleId !== 2) {
        const err = new Error(`Cannot edit this sale invoice because project #${completedProjects[0].project_code} is already completed. Contact an admin if an adjustment is required.`);
        err.status = 400;
        throw err;
    }

    return { projectRes };
};

/**
 * Validates discount boundaries:
 * 1. Discount must not exceed paid amount when updating an invoice with prior payments.
 * 2. Selling price after discount must not fall below purchase cost (per item and overall invoice).
 */
const validateSaleDiscountAndCost = async (client, { sale, itemsList, subtotal, discount, discountFromLoyalty = 0 }) => {
    const totalDiscount = Number(discount || 0) + Number(discountFromLoyalty || 0);

    const priorPaid = Number(sale?.paid_amount || 0);
    if (priorPaid > 0 && totalDiscount > priorPaid) {
        const err = new Error(
            `মোট ডিসকাউন্টের পরিমাণ (৳ ${totalDiscount.toLocaleString()}) ইনভয়েসের পরিশোধিত পরিমাণ (৳ ${priorPaid.toLocaleString()}) এর চেয়ে বেশি হতে পারবে না।`
        );
        err.status = 400;
        throw err;
    }

    if (Array.isArray(itemsList) && itemsList.length > 0) {
        const productIds = [...new Set(itemsList.map(it => Number(it.product_id)).filter(Boolean))];
        const pMap = new Map();
        if (productIds.length > 0) {
            const pRes = await client.query(
                'SELECT id, name, COALESCE(purchase_price, 0) AS purchase_price FROM products WHERE id = ANY($1::int[])',
                [productIds]
            ).catch(() => ({ rows: [] }));
            for (const r of pRes.rows) {
                pMap.set(Number(r.id), { name: r.name, purchase_price: Number(r.purchase_price || 0) });
            }
        }

        let totalCogs = 0;
        for (const item of itemsList) {
            const prod = pMap.get(Number(item.product_id));
            const costPrice = Number(item.cost_price || prod?.purchase_price || 0);
            const unitPrice = Number(item.unit_price || 0);
            const qty = Number(item.quantity || 1);
            const itDiscount = Number(item.discount || 0);
            const lineTotal = unitPrice * qty - itDiscount;
            const lineCost = costPrice * qty;

            if (costPrice > 0) {
                totalCogs += lineCost;
                if (lineTotal < lineCost) {
                    const itemName = item.name || item.product_name || prod?.name || 'Product';
                    const err = new Error(
                        `আইটেম "${itemName}"-এ ডিসকাউন্ট দেয়ার পর বিক্রয়মূল্য (৳ ${lineTotal.toLocaleString()}) পারচেজ কস্ট (৳ ${lineCost.toLocaleString()}) এর চেয়ে কম হতে পারবে না।`
                    );
                    err.status = 400;
                    throw err;
                }
            }
        }

        const netInvoiceAfterDiscount = Number(subtotal || 0) - totalDiscount;
        if (totalCogs > 0 && netInvoiceAfterDiscount < totalCogs) {
            const err = new Error(
                `মোট ডিসকাউন্ট দেয়ার পর ইনভয়েস বিক্রয়মূল্য (৳ ${netInvoiceAfterDiscount.toLocaleString()}) মোট পারচেজ কস্ট (৳ ${totalCogs.toLocaleString()}) এর চেয়ে কম হতে পারবে না।`
            );
            err.status = 400;
            throw err;
        }
    }
};

module.exports = {
    validateSaleUpdatePolicy,
    validateSaleDiscountAndCost,
};
