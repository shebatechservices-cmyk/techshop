// Strict validation for available stock and serial tracking (RULE 1)
const validateAvailableStockAndSerials = async (client, normalizedItems, existingSaleId = null) => {
    if (!normalizedItems || normalizedItems.length === 0) return;

    // 1. Check duplicate serials submitted within this request payload
    const seenSerials = new Map();
    for (const it of normalizedItems) {
        if (Array.isArray(it.serials)) {
            for (const s of it.serials) {
                const lower = String(s).trim().toLowerCase();
                if (!lower) continue;
                if (seenSerials.has(lower)) {
                    const err = new Error(`Duplicate serial number "${s}" submitted in sale items.`);
                    err.status = 400;
                    throw err;
                }
                seenSerials.set(lower, it.name || 'Product');
            }
        }
    }

    // 2. Validate product stock and serial numbers against database
    for (const item of normalizedItems) {
        const prodId = Number(item.product_id);
        const pRes = await client.query(
            'SELECT id, name, stock, is_serial_tracked, is_bundle FROM products WHERE id = $1 AND deleted_at IS NULL',
            [prodId]
        );
        if (pRes.rows.length === 0) {
            const err = new Error(`Product #${prodId} not found or has been deleted.`);
            err.status = 400;
            throw err;
        }
        const product = pRes.rows[0];
        const isTracked = Boolean(product.is_serial_tracked);
        const isBundle = Boolean(product.is_bundle);
        const reqQty = Number(item.quantity || 1);

        // A. Stock count validation (RULE 1 & 3)
        if (isBundle) {
            const bundleItemsRes = await client.query(
                `SELECT bi.quantity, p.id, p.name, p.stock
                 FROM product_bundle_items bi
                 JOIN products p ON p.id = bi.product_id
                 WHERE bi.bundle_id = $1 AND p.deleted_at IS NULL`,
                [prodId]
            );
            for (const comp of bundleItemsRes.rows) {
                const compReq = reqQty * Number(comp.quantity || 1);
                const compStock = Number(comp.stock || 0);
                if (compStock < compReq) {
                    const err = new Error(`Insufficient stock for bundle component "${comp.name}". Available: ${compStock}, Required: ${compReq}.`);
                    err.status = 400;
                    throw err;
                }
            }
        } else {
            let oldQty = 0;
            if (existingSaleId) {
                const oldQtyRes = await client.query(
                    'SELECT COALESCE(SUM(quantity), 0) AS old_qty FROM sales_items WHERE sale_id = $1 AND product_id = $2',
                    [Number(existingSaleId), prodId]
                );
                oldQty = Number(oldQtyRes.rows[0]?.old_qty || 0);
            }
            const effectiveStock = Number(product.stock || 0) + oldQty;

            if (effectiveStock <= 0) {
                const err = new Error(`"${product.name}" is currently out of stock (Available: 0).`);
                err.status = 400;
                throw err;
            }
            if (reqQty > effectiveStock) {
                const err = new Error(`Insufficient stock for "${product.name}". Available stock: ${effectiveStock}, Requested quantity: ${reqQty}.`);
                err.status = 400;
                throw err;
            }
        }

        // B. Strict Serial Validation for Serial Tracked Items (RULE 1)
        if (isTracked) {
            const serials = Array.isArray(item.serials) ? item.serials.map((s) => String(s).trim()).filter(Boolean) : [];
            if (serials.length === 0) {
                const err = new Error(`"${product.name}" is serial-tracked — you must provide valid serial number(s) before completing the sale.`);
                err.status = 400;
                throw err;
            }
            if (serials.length !== reqQty) {
                const err = new Error(`"${product.name}" quantity (${reqQty}) must match the number of attached serial numbers (${serials.length}).`);
                err.status = 400;
                throw err;
            }

            for (const code of serials) {
                // Check if serial exists in purchase_order_serials for this product
                const posRes = await client.query(`
                    SELECT pos.id, pos.serial_code
                    FROM purchase_order_serials pos
                    JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
                    JOIN purchase_orders po ON po.id = poi.purchase_order_id
                    WHERE poi.product_id = $1
                      AND LOWER(TRIM(pos.serial_code)) = LOWER(TRIM($2))
                      AND po.deleted_at IS NULL
                    LIMIT 1
                `, [prodId, code]);

                if (posRes.rows.length === 0) {
                    const err = new Error(`Error: Serial "${code}" does not exist in inventory for "${product.name}".`);
                    err.status = 400;
                    throw err;
                }

                // Check if serial is already sold in another active sale
                let soldQuery = `
                    SELECT s.invoice_no, s.id AS sale_id
                    FROM sales_item_serials sis
                    JOIN sales_items si ON si.id = sis.sales_item_id
                    LEFT JOIN sales s ON s.id = si.sale_id
                    WHERE LOWER(TRIM(sis.serial_code)) = LOWER(TRIM($1))
                      AND (s.id IS NULL OR s.deleted_at IS NULL)
                `;
                const soldParams = [code];
                if (existingSaleId) {
                    soldQuery += ' AND (s.id IS NULL OR s.id != $2)';
                    soldParams.push(Number(existingSaleId));
                }
                soldQuery += ' LIMIT 1';

                const soldRes = await client.query(soldQuery, soldParams);
                if (soldRes.rows.length > 0) {
                    const soldRow = soldRes.rows[0];
                    const err = new Error(`Error: Serial "${code}" has already been sold in Invoice #${soldRow.invoice_no || soldRow.sale_id}.`);
                    err.status = 400;
                    throw err;
                }
            }
        }
    }
};

// Lock-chain + time-window validation for deleting a sale.
const validateSaleDeletable = async (sale, id, client, options = {}) => {
    const { allowOverride = false } = options;

    if (!allowOverride) {
        const settingsRes = await client.query(
            'SELECT allow_invoice_modification FROM shop_settings WHERE id = 1'
        ).catch(() => ({ rows: [] }));
        if (settingsRes.rows[0]?.allow_invoice_modification === false) {
            return "Invoice deletion is currently disabled by administrative policy.";
        }

        const createdAt = new Date(sale.created_at || Date.now());
        const shiftRes = await client.query(`
            SELECT 1 FROM register_shifts 
            WHERE status = 'closed' AND $1 <= closed_at AND (opened_at IS NULL OR $1 >= opened_at) 
            LIMIT 1
        `, [createdAt]).catch(() => ({ rows: [] }));
        if (shiftRes.rows.length > 0) {
            return "Cannot delete sale: The cash register shift for this invoice has already been closed and audited.";
        }

        const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursOld > 168) {
            return "Delete window (7 days) has expired. Please use the Return/Exchange module instead.";
        }
    }

    if (sale.customer_id) {
        const laterSale = await client.query(
            'SELECT invoice_no FROM sales WHERE customer_id = $1 AND id != $2 AND created_at > (SELECT created_at FROM sales WHERE id = $2) AND deleted_at IS NULL LIMIT 1',
            [sale.customer_id, id]
        ).catch(() => ({ rows: [] }));
        if (laterSale.rows.length > 0) {
            return `Cannot delete sale: Later sales invoice (#${laterSale.rows[0].invoice_no}) has already been recorded for this customer. Only the most recent transaction can be deleted.`;
        }
    }

    if (sale.invoice_no) {
        const warrantyRes = await client.query(
            'SELECT 1 FROM warranty_claims WHERE invoice_no = $1 AND deleted_at IS NULL LIMIT 1',
            [sale.invoice_no]
        ).catch(() => ({ rows: [] }));
        if (warrantyRes.rows.length > 0) {
            return 'Cannot delete this sale invoice because warranty claims are attached to it.';
        }

        const returnRes = await client.query(
            'SELECT 1 FROM product_returns WHERE invoice_no = $1 AND deleted_at IS NULL LIMIT 1',
            [sale.invoice_no]
        ).catch(() => ({ rows: [] }));
        if (returnRes.rows.length > 0) {
            return 'Cannot delete this sale invoice because customer returns are attached to it.';
        }
    }

    const projectRes = await client.query(
        'SELECT id, status, project_code FROM service_projects WHERE (invoice_id = $1::int OR invoice_no = $2) AND deleted_at IS NULL LIMIT 1',
        [Number(id) || 0, sale.invoice_no || '']
    ).catch(() => ({ rows: [] }));
    if (projectRes.rows.length > 0) {
        const p = projectRes.rows[0];
        if (p.status === 'completed') {
            return `Cannot delete this sale invoice because project #${p.project_code} is already completed.`;
        }
        await client.query(
            'UPDATE service_projects SET invoice_id = NULL, invoice_no = NULL, updated_at = NOW() WHERE id = $1',
            [p.id]
        );
    }

    return null;
};

module.exports = {
    validateAvailableStockAndSerials,
    validateSaleDeletable,
};
