const pool = require('../../config/db');

async function searchOperationalProducts(searchTerm, rawQuery) {
    const productsRes = await pool.query(
        `SELECT 
            p.id,
            p.name,
            p.sku,
            p.barcode,
            COALESCE(p.stock, 0) AS stock,
            COALESCE(p.min_stock, 5) AS min_stock,
            COALESCE(p.purchase_price, 0) AS cost_price,
            COALESCE(p.selling_price, 0) AS sale_price,
            COALESCE(p.mrp, 0) AS mrp,
            p.status,
            p.image_url,
            p.supplier_warranty_expire_date,
            COALESCE(p.warranty_months, 0) AS warranty_months,
            b.name AS brand_name,
            c.name AS category_name,
            matched_sn.serial_code AS matched_serial,
            CASE 
                WHEN matched_sn.serial_code IS NOT NULL THEN
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM sales_item_serials sis 
                            JOIN sales_items si ON si.id = sis.sales_item_id 
                            JOIN sales s ON s.id = si.sale_id 
                            WHERE (sis.serial_code = matched_sn.serial_code OR LOWER(sis.serial_code) = LOWER(matched_sn.serial_code)) 
                              AND s.deleted_at IS NULL
                        ) THEN 'Sold'
                        ELSE 'In Stock'
                    END
                ELSE NULL
            END AS matched_serial_status,
            -- Sales Invoices (if sold)
            (
                SELECT COALESCE(json_agg(sub), '[]'::json)
                FROM (
                    SELECT s.id AS sale_id, s.invoice_no, COALESCE(cust.name, 'Walk-in') AS customer_name,
                           cust.phone AS customer_phone,
                           s.created_at AS sale_date, si.quantity, si.unit_price, si.line_total, si.warranty_expire_date
                    FROM sales_items si
                    JOIN sales s ON s.id = si.sale_id
                    LEFT JOIN customers cust ON cust.id = s.customer_id
                    WHERE si.product_id = p.id AND s.deleted_at IS NULL
                      AND (
                          matched_sn.serial_code IS NULL 
                          OR EXISTS (
                              SELECT 1 FROM sales_item_serials sis
                              WHERE sis.sales_item_id = si.id
                                AND (sis.serial_code = matched_sn.serial_code OR LOWER(sis.serial_code) = LOWER(matched_sn.serial_code))
                          )
                      )
                    ORDER BY s.id DESC
                    LIMIT 5
                ) sub
            ) AS sales_history,
            -- Purchase Invoices
            (
                SELECT COALESCE(json_agg(sub), '[]'::json)
                FROM (
                    SELECT po.id AS po_id, po.po_number, COALESCE(sup.name, 'Supplier') AS supplier_name,
                           sup.phone AS supplier_phone,
                           po.created_at AS purchase_date, poi.quantity, poi.cost_price, poi.expected_date, poi.supplier_warranty_expire_date
                    FROM purchase_order_items poi
                    JOIN purchase_orders po ON po.id = poi.purchase_order_id
                    LEFT JOIN suppliers sup ON sup.id = po.supplier_id
                    WHERE poi.product_id = p.id AND po.deleted_at IS NULL
                      AND (
                          matched_sn.serial_code IS NULL
                          OR EXISTS (
                              SELECT 1 FROM purchase_order_serials pos
                              WHERE pos.purchase_order_item_id = poi.id
                                AND (pos.serial_code = matched_sn.serial_code OR LOWER(pos.serial_code) = LOWER(matched_sn.serial_code))
                          )
                      )
                    ORDER BY po.id DESC
                    LIMIT 5
                ) sub
            ) AS purchase_history,
            -- Warranty Claims (if done or in process)
            (
                SELECT COALESCE(json_agg(sub), '[]'::json)
                FROM (
                    SELECT wc.id AS claim_id, wc.claim_no, wc.status, wc.barcode, wc.serial_code,
                           wc.issue_description, wc.customer_name, wc.claim_date
                    FROM warranty_claims wc
                    WHERE wc.product_id = p.id AND wc.deleted_at IS NULL
                      AND (
                          matched_sn.serial_code IS NULL
                          OR wc.serial_code = matched_sn.serial_code
                          OR LOWER(wc.serial_code) = LOWER(matched_sn.serial_code)
                      )
                    ORDER BY wc.id DESC
                    LIMIT 5
                ) sub
            ) AS warranty_claims,
            -- Return-Refunds (if done or in process)
            (
                SELECT COALESCE(json_agg(sub), '[]'::json)
                FROM (
                    SELECT pr.id AS return_id, pr.return_no, pr.return_qty, pr.refund_amount,
                           pr.return_reason, pr.customer_name, pr.return_date
                    FROM product_returns pr
                    WHERE pr.product_id = p.id AND pr.deleted_at IS NULL
                      AND (
                          matched_sn.serial_code IS NULL
                          OR pr.serial_code = matched_sn.serial_code
                          OR LOWER(pr.serial_code) = LOWER(matched_sn.serial_code)
                      )
                    ORDER BY pr.id DESC
                    LIMIT 5
                ) sub
            ) AS returns_refunds
         FROM products p
         LEFT JOIN brands b ON b.id = p.brand_id
         LEFT JOIN categories c ON c.id = p.category_id
         LEFT JOIN LATERAL (
             SELECT COALESCE(
                 (
                     SELECT sis.serial_code 
                     FROM sales_item_serials sis
                     JOIN sales_items si ON si.id = sis.sales_item_id
                     WHERE si.product_id = p.id AND (sis.serial_code ILIKE $1 OR LOWER(sis.serial_code) = LOWER($2))
                     LIMIT 1
                 ),
                 (
                     SELECT pos.serial_code 
                     FROM purchase_order_serials pos
                     JOIN purchase_order_items poi ON poi.id = pos.purchase_order_item_id
                     WHERE poi.product_id = p.id AND (pos.serial_code ILIKE $1 OR LOWER(pos.serial_code) = LOWER($2))
                     LIMIT 1
                 )
             ) AS serial_code
         ) matched_sn ON TRUE
         WHERE p.deleted_at IS NULL
           AND (
               p.name ILIKE $1 
               OR p.sku ILIKE $1 
               OR p.barcode ILIKE $1 
               OR b.name ILIKE $1
               OR matched_sn.serial_code IS NOT NULL
           )
           AND (
               COALESCE(p.stock, 0) > 0 
               OR COALESCE(p.purchase_count, 0) > 0
               OR EXISTS (SELECT 1 FROM purchase_order_items poi WHERE poi.product_id = p.id)
               OR EXISTS (SELECT 1 FROM sales_items si WHERE si.product_id = p.id)
               OR EXISTS (SELECT 1 FROM warranty_claims wc WHERE wc.product_id = p.id AND wc.deleted_at IS NULL)
               OR EXISTS (SELECT 1 FROM product_returns pr WHERE pr.product_id = p.id AND pr.deleted_at IS NULL)
           )
         ORDER BY p.id DESC
         LIMIT 8`,
        [searchTerm, rawQuery]
    ).catch((err) => { console.error('Global search products error:', err.message); return { rows: [] }; });

    return productsRes.rows;
}

module.exports = { searchOperationalProducts };
