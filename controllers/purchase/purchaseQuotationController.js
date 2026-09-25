const pool = require('../../config/db');

// =========================================================
// PURCHASE QUOTATIONS
// =========================================================

const getQuotations = async (_req, res) => {
    try {
        const result = await pool.query(`
            SELECT pq.*, s.name AS supplier_name, s.phone AS supplier_phone 
            FROM purchase_quotations pq 
            LEFT JOIN suppliers s ON s.id = pq.supplier_id 
            WHERE pq.deleted_at IS NULL
            ORDER BY pq.id DESC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('getQuotations error:', error);
        res.status(500).json({ error: 'Failed to load purchase quotations' });
    }
};

const createQuotation = async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            supplier_id,
            reference,
            valid_until,
            notes,
            items = []
        } = req.body;

        if (!supplier_id) {
            return res.status(400).json({ error: 'Supplier is required' });
        }
        if (!items.length) {
            return res.status(400).json({ error: 'Please add at least one item to the quotation' });
        }

        await client.query('BEGIN');

        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let token = '';
        for (let i = 0; i < 6; i++) {
            token += alphabet[Math.floor(Math.random() * alphabet.length)];
        }
        const quotation_no = `PQ-${token}`;

        let total_amount = 0;
        let item_count = 0;

        items.forEach(it => {
            const qty = Number(it.quantity || 1);
            const price = Number(it.unit_price || 0);
            total_amount += qty * price;
            item_count += qty;
        });

        const qRes = await client.query(`
            INSERT INTO purchase_quotations 
            (quotation_no, supplier_id, reference, quotation_date, valid_until, total_amount, item_count, status, notes)
            VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, 'draft', $7)
            RETURNING *
        `, [quotation_no, Number(supplier_id), reference || null, valid_until || null, total_amount, item_count, notes || null]);

        const quotationId = qRes.rows[0].id;

        for (const it of items) {
            const qty = Number(it.quantity || 1);
            const price = Number(it.unit_price || 0);
            const line_total = qty * price;
            await client.query(`
                INSERT INTO purchase_quotation_items 
                (quotation_id, product_id, quantity, unit_price, line_total, notes)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [quotationId, it.product_id || null, qty, price, line_total, it.notes || null]);
        }

        await client.query('COMMIT');
        res.status(201).json({
            message: 'Purchase quotation created successfully',
            data: qRes.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('createQuotation error:', error);
        res.status(500).json({ error: error.message || 'Failed to create quotation' });
    } finally {
        client.release();
    }
};

const updateQuotation = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const {
            supplier_id,
            reference,
            valid_until,
            notes,
            items = []
        } = req.body;

        if (!supplier_id) {
            return res.status(400).json({ error: 'Supplier is required' });
        }
        if (!items.length) {
            return res.status(400).json({ error: 'Please add at least one item to the quotation' });
        }

        const existing = await pool.query('SELECT id FROM purchase_quotations WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (!existing.rows.length) return res.status(404).json({ error: 'Quotation not found' });

        await client.query('BEGIN');

        let total_amount = 0;
        let item_count = 0;
        items.forEach(it => {
            const qty = Number(it.quantity || 1);
            const price = Number(it.unit_price || 0);
            total_amount += qty * price;
            item_count += qty;
        });

        const qRes = await client.query(`
            UPDATE purchase_quotations
            SET supplier_id = $1, reference = $2, valid_until = $3,
                total_amount = $4, item_count = $5, notes = $6, updated_at = NOW()
            WHERE id = $7
            RETURNING *
        `, [Number(supplier_id), reference || null, valid_until || null, total_amount, item_count, notes || null, id]);

        await client.query('DELETE FROM purchase_quotation_items WHERE quotation_id = $1', [id]);
        for (const it of items) {
            const qty = Number(it.quantity || 1);
            const price = Number(it.unit_price || 0);
            const line_total = qty * price;
            await client.query(`
                INSERT INTO purchase_quotation_items
                (quotation_id, product_id, quantity, unit_price, line_total, notes)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [id, it.product_id || null, qty, price, line_total, it.notes || null]);
        }

        await client.query('COMMIT');
        res.status(200).json({
            message: 'Purchase quotation updated successfully',
            data: qRes.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('updateQuotation error:', error);
        res.status(500).json({ error: error.message || 'Failed to update quotation' });
    } finally {
        client.release();
    }
};

const getQuotationById = async (req, res) => {
    try {
        const { id } = req.params;
        const qRes = await pool.query('SELECT * FROM purchase_quotations WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (!qRes.rows.length) return res.status(404).json({ error: 'Quotation not found' });

        const itemRes = await pool.query(
            `SELECT qi.*, p.name AS product_name
             FROM purchase_quotation_items qi
             LEFT JOIN products p ON p.id = qi.product_id
             WHERE qi.quotation_id = $1`,
            [id]
        );
        res.status(200).json({ data: { ...qRes.rows[0], items: itemRes.rows } });
    } catch (error) {
        console.error('getQuotationById error:', error);
        res.status(500).json({ error: 'Failed to load quotation' });
    }
};

const updateQuotationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ['draft', 'pending', 'approved', 'rejected', 'ordered'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const result = await pool.query(
            'UPDATE purchase_quotations SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Quotation not found' });
        res.status(200).json({ message: 'Status updated successfully', data: result.rows[0] });
    } catch (error) {
        console.error('updateQuotationStatus error:', error);
        res.status(500).json({ error: 'Failed to update quotation status' });
    }
};

const deleteQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const qRes = await pool.query('SELECT * FROM purchase_quotations WHERE id = $1', [id]);
        if (!qRes.rows.length) return res.status(404).json({ error: 'Quotation not found' });
        const quote = qRes.rows[0];

        await pool.query('UPDATE purchase_quotations SET deleted_at = NOW() WHERE id = $1', [id]);
        await pool.query(`
            INSERT INTO trash_records (table_name, record_id, record_title, record_data, deleted_at)
            VALUES ('purchase_quotations', $1, $2, $3, NOW())
        `, [id, `Purchase Quote #${quote.quotation_no || id}`, JSON.stringify(quote)]).catch(() => null);

        res.status(200).json({ success: true, message: `Quotation #${quote.quotation_no || id} moved to Trash successfully!` });
    } catch (error) {
        console.error('deleteQuotation error:', error);
        res.status(500).json({ error: 'Failed to delete quotation' });
    }
};

module.exports = {
    getQuotations,
    createQuotation,
    updateQuotation,
    getQuotationById,
    updateQuotationStatus,
    deleteQuotation,
};
