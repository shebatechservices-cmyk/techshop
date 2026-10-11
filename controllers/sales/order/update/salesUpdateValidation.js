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

module.exports = {
    validateSaleUpdatePolicy,
};
