const pool = require('../../config/db');
const { getToken, hashSessionToken } = require('../../middlewares/authMiddleware');
const { searchEntities } = require('./entitySearchQueries');
const { searchOperationalProducts } = require('./productSearchQuery');

const checkTechnicianRole = async (req) => {
    try {
        const token = getToken(req);
        if (token) {
            const userRes = await pool.query(
                'SELECT role_id, role_name FROM users WHERE current_session_token = $1 LIMIT 1',
                [hashSessionToken(token)]
            );
            const user = userRes.rows[0];
            if (user && (user.role_id === 4 || user.role_name?.toLowerCase() === 'technician')) {
                return true;
            }
        }
    } catch (e) {
        console.error('Global search auth check error:', e.message);
    }
    return false;
};

const globalSearch = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || !q.trim()) {
            return res.status(200).json({
                success: true,
                data: {
                    sales: [],
                    sale_quotations: [],
                    customers: [],
                    purchases: [],
                    purchase_quotations: [],
                    suppliers: [],
                    products: [],
                },
            });
        }

        const rawQuery = q.trim();
        const searchTerm = `%${rawQuery}%`;

        const isTechnician = await checkTechnicianRole(req);

        const [entityResults, products] = await Promise.all([
            searchEntities(searchTerm, isTechnician),
            searchOperationalProducts(searchTerm, rawQuery),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                ...entityResults,
                products,
            },
        });
    } catch (error) {
        console.error('globalSearch error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    globalSearch,
};
