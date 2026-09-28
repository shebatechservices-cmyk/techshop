const pool = require('../../config/db');

// Get all tenders
exports.getTenders = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tenders ORDER BY id ASC');
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('getTenders error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Create a new tender
exports.createTender = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Tender name is required.' });
        }
        const trimmed = name.trim();
        const result = await pool.query(`
            INSERT INTO tenders (name) VALUES ($1)
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING *
        `, [trimmed]);
        return res.status(201).json({ success: true, message: 'Tender created successfully!', data: result.rows[0] });
    } catch (error) {
        console.error('createTender error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Update an existing tender
exports.updateTender = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { name } = req.body;
        if (isNaN(id) || !name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Valid Tender ID and name are required.' });
        }
        const trimmed = name.trim();
        const result = await pool.query(
            'UPDATE tenders SET name = $1 WHERE id = $2 RETURNING *',
            [trimmed, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Tender not found.' });
        }
        return res.status(200).json({ success: true, message: 'Tender updated successfully!', data: result.rows[0] });
    } catch (error) {
        console.error('updateTender error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a tender safely (with active link check)
exports.deleteTender = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid Tender ID.' });

        const accCheck = await pool.query('SELECT COUNT(*) FROM accounts WHERE tender_id = $1', [id]);
        const accCount = parseInt(accCheck.rows[0].count, 10);
        if (accCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete tender: ${accCount} active account(s) are linked to this tender. Please reassign or delete those accounts first.`
            });
        }

        const result = await pool.query('DELETE FROM tenders WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Tender not found.' });
        }
        return res.status(200).json({ success: true, message: 'Tender deleted successfully!' });
    } catch (error) {
        console.error('deleteTender error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
