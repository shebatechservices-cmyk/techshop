const pool = require('../../../config/db');

/**
 * Technician submits a withdrawal or deposit request with reference / TrxID
 */
exports.submitWalletRequest = async (req, res) => {
    try {
        const userId = req.params.id || req.body.technician_id;
        const { type = 'withdraw', amount, channel = 'bkash', reference_id = '', notes = '' } = req.body;

        const valAmount = parseFloat(amount);
        if (isNaN(valAmount) || valAmount <= 0) {
            return res.status(400).json({ success: false, message: 'সঠিক টাকার পরিমাণ দিন।' });
        }

        const userRes = await pool.query('SELECT id, name, wallet_balance FROM users WHERE id = $1 AND deleted_at IS NULL', [userId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'টেকনিশিয়ান পাওয়া যায়নি।' });
        }

        const user = userRes.rows[0];
        const currentBal = parseFloat(user.wallet_balance || 0);

        if (type === 'withdraw' && valAmount > currentBal) {
            return res.status(400).json({ 
                success: false, 
                message: `অপর্যাপ্ত ব্যালেন্স! আপনার বর্তমান ওয়ালেট ব্যালেন্স ৳${currentBal.toLocaleString()}, এর বেশি উইথড্র করা সম্ভব নয়।` 
            });
        }

        const insertRes = await pool.query(`
            INSERT INTO technician_wallet_requests (
                technician_id, technician_name, type, amount, channel, reference_id, notes, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
            RETURNING *
        `, [user.id, user.name, type, valAmount, channel, reference_id, notes]);

        return res.status(201).json({
            success: true,
            message: `আপনার ৳${valAmount.toLocaleString()} টাকার ${type === 'withdraw' ? 'উইথড্র' : 'ডিপোজিট'} রিকোয়েস্ট সাবমিট হয়েছে। শপ অ্যাডমিন যাচাই করে পোস্টিং বা পেমেন্ট সম্পন্ন করবেন।`,
            data: insertRes.rows[0]
        });
    } catch (err) {
        console.error('Error in submitWalletRequest:', err);
        return res.status(500).json({ success: false, message: 'রিকোয়েস্ট সাবমিট করতে সমস্যা হয়েছে', error: err.message });
    }
};

/**
 * Get wallet requests for a specific technician
 */
exports.getStaffWalletRequests = async (req, res) => {
    try {
        const userId = req.params.id;
        const result = await pool.query(`
            SELECT * FROM technician_wallet_requests
            WHERE technician_id = $1
            ORDER BY id DESC
            LIMIT 50
        `, [userId]);

        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error in getStaffWalletRequests:', err);
        return res.status(500).json({ success: false, message: 'রিকোয়েস্ট লোড করতে সমস্যা হয়েছে', error: err.message });
    }
};

/**
 * Admin: Get all pending technician wallet requests
 */
exports.getPendingWalletRequests = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT twr.*, u.phone as technician_phone, u.wallet_balance as current_balance
            FROM technician_wallet_requests twr
            LEFT JOIN users u ON u.id = twr.technician_id
            WHERE twr.status = 'pending'
            ORDER BY twr.id DESC
        `);

        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error in getPendingWalletRequests:', err);
        return res.status(500).json({ success: false, message: 'পেন্ডিং রিকোয়েস্ট লোড করতে সমস্যা হয়েছে', error: err.message });
    }
};
