const pool = require('../../../config/db');

exports.getQuotations = async (_req, res) => {
    try {
        const query = `
            SELECT sq.*,
                   COALESCE((SELECT COUNT(*) FROM sales_quotation_items WHERE quotation_id = sq.id), 0) AS item_count,
                   COALESCE((SELECT SUM(quantity) FROM sales_quotation_items WHERE quotation_id = sq.id), 0) AS unit_count
            FROM sales_quotations sq
            WHERE sq.deleted_at IS NULL
            ORDER BY sq.id DESC;
        `;
        const result = await pool.query(query);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get quotations error:', error);
        return res.status(500).json({ success: false, message: error.message, data: [] });
    }
};

exports.getQuotationById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const quoteRes = await pool.query('SELECT * FROM sales_quotations WHERE id = $1', [id]);
        if (!quoteRes.rows.length) {
            return res.status(404).json({ success: false, message: 'Quotation not found' });
        }
        const quote = quoteRes.rows[0];

        const itemsRes = await pool.query(
            `SELECT sqi.*, b.name AS brand_name, p.sku, p.barcode
             FROM sales_quotation_items sqi
             LEFT JOIN products p ON p.id = sqi.product_id
             LEFT JOIN brands b ON b.id = p.brand_id
             WHERE sqi.quotation_id = $1
             ORDER BY sqi.id ASC`,
            [id]
        );

        return res.status(200).json({
            success: true,
            data: {
                ...quote,
                items: itemsRes.rows,
            },
        });
    } catch (error) {
        console.error('Get quotation by id error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const qRes = await pool.query('SELECT * FROM sales_quotations WHERE id = $1', [id]);
        if (qRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Quotation not found' });
        }
        const quote = qRes.rows[0];

        await pool.query('UPDATE sales_quotations SET deleted_at = NOW() WHERE id = $1', [id]);
        await pool.query(`
            INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
            VALUES ('sales_quotations', $1, $2, $3, NOW())
        `, [id, `Quote #${quote.quotation_no || id}`, JSON.stringify(quote)]).catch(() => null);

        return res.status(200).json({ success: true, message: `Quotation #${quote.quotation_no || id} moved to Trash successfully` });
    } catch (error) {
        console.error('Delete quotation error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateQuotationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid quotation status' });
        }
        const updateRes = await pool.query(
            'UPDATE sales_quotations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (!updateRes.rows.length) {
            return res.status(404).json({ success: false, message: 'Quotation not found' });
        }
        return res.status(200).json({ success: true, message: `Quotation status changed to ${status}`, data: updateRes.rows[0] });
    } catch (error) {
        console.error('Update quotation status error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
