const fs = require('fs');

const controller = `const pool = require('../config/db');

// ১. সব ওয়ালেট ও ব্যালেন্স দেখা
exports.getAccounts = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM financial_accounts WHERE deleted_at IS NULL');
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ২. নতুন অ্যাকাউন্ট বা ওয়ালেট তৈরি (যেমন: বিকাশ মার্চেন্ট বা নতুন ব্যাংক অ্যাকাউন্ট)
exports.createAccount = async (req, res) => {
    try {
        const { account_name, account_type, account_number, initial_balance } = req.body;
        const result = await pool.query(
            'INSERT INTO financial_accounts (account_name, account_type, account_number, balance) VALUES ($1, $2, $3, $4) RETURNING *',
            [account_name, account_type, account_number, initial_balance || 0.00]
        );
        return res.status(201).json({ success: true, message: 'নতুন ওয়ালেট বা অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!', data: result.rows[0] });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ৩. ট্রানজেকশন (ডিপোজিট, উইথড্র বা পেমেন্ট পাথ সহ খরচ/আয়)
exports.makeTransaction = async (req, res) => {
    const client = await pool.connect();
    try {
        const { account_id, payment_method_id, type, amount, reference_no, note } = req.body;
        // type: 'deposit' (টাকা জমা), 'withdrawal' (উত্তোলন/পেমেন্ট)
        
        await client.query('BEGIN');

        const transaction_no = 'TRX-' + Date.now();

        // অ্যাকাউন্ট ব্যালেন্স আপডেট লজিক
        if (type === 'deposit' || type === 'income') {
            await client.query('UPDATE financial_accounts SET balance = balance + $1 WHERE id = $2', [amount, account_id]);
        } else if (type === 'withdrawal' || type === 'expense') {
            // ব্যালেন্স পর্যাপ্ত আছে কি না চেক করা
            const accCheck = await client.query('SELECT balance FROM financial_accounts WHERE id = $1', [account_id]);
            const currentBalance = Number(accCheck.rows[0]?.balance || 0);
            
            if (currentBalance < amount) {
                throw new Error('ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই!');
            }
            await client.query('UPDATE financial_accounts SET balance = balance - $1 WHERE id = $2', [amount, account_id]);
        }

        // ট্রানজেকশন টেবিলে এন্ট্রি
        const trxQuery = \`
            INSERT INTO transactions (transaction_no, account_id, payment_method_id, type, amount, reference_no, note)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
        \`;
        const trxRes = await client.query(trxQuery, [transaction_no, account_id, payment_method_id, type, amount, reference_no, note]);

        await client.query('COMMIT');
        return res.status(200).json({ success: true, message: 'ট্রানজেকশন সফলভাবে সম্পন্ন হয়েছে!', data: trxRes.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

// ৪. নির্দিষ্ট ওয়ালেটের ট্রানজেকশন হিস্ট্রি দেখা
exports.getTransactionHistory = async (req, res) => {
    try {
        const { account_id } = req.params;
        const result = await pool.query(
            'SELECT t.*, p.method_name FROM transactions t LEFT JOIN payment_methods p ON t.payment_method_id = p.id WHERE t.account_id = $1 AND t.deleted_at IS NULL ORDER BY t.created_at DESC',
            [account_id]
        );
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};`;

const route = `const express = require('express');
const router = express.Router();
const accountsController = require('../controllers/accountsController');
const { checkPermission } = require('../middlewares/authMiddleware');

router.get('/wallets', accountsController.getAccounts);
router.post('/wallets/create', checkPermission('manage_settings'), accountsController.createAccount);
router.post('/transaction', checkPermission('manage_settings'), accountsController.makeTransaction);
router.get('/history/:account_id', accountsController.getTransactionHistory);

module.exports = router;`;

fs.writeFileSync('controllers/accountsController.js', controller);
fs.writeFileSync('routes/accountsRoute.js', route);

let serverContent = fs.readFileSync('server.js', 'utf8');
if (!serverContent.includes('/api/accounts')) {
    serverContent = serverContent.replace('app.listen(', 'app.use("/api/accounts", require("./routes/accountsRoute"));\napp.listen(');
    fs.writeFileSync('server.js', serverContent);
}

console.log('Accounts & Wallet API Created Successfully!');
