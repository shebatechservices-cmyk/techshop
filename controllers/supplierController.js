const db = require('../config/db');
const { ensureWalletSchema, writeWalletLedger } = require('./walletController');

const money = (val) => Number.parseFloat(val || 0) || 0;

exports.createSupplier = async (req, res) => {
  try {
    const { name, phone, contact_person, mobile, email, address, opening_wallet_balance = 0 } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'সাপ্লায়ারের নাম এবং ফোন নম্বর দেওয়া বাধ্যতামূলক।'
      });
    }

    const openingWallet = money(opening_wallet_balance);
    if (openingWallet < 0) {
      return res.status(400).json({ success: false, message: 'Opening wallet balance cannot be negative' });
    }

    await ensureWalletSchema();
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const query = `
        INSERT INTO suppliers (name, phone, contact_person, mobile, email, address, wallet_balance)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;
      const values = [
        name.trim(),
        phone.trim(),
        contact_person ? contact_person.trim() : null,
        mobile ? mobile.trim() : null,
        email ? email.trim().toLowerCase() : null,
        address ? address.trim() : null,
        openingWallet
      ];

      const result = await client.query(query, values);
      const supplier = result.rows[0];
      if (openingWallet > 0) {
        await writeWalletLedger(client, {
          party_type: 'supplier',
          party_id: supplier.id,
          party_name: supplier.name,
          type: 'opening_balance',
          amount: openingWallet,
          credit: true,
          account_effect: 'none',
          cash_drawer_effect: 'none',
          reference: 'opening_balance',
          note: 'Opening wallet balance at supplier registration',
          balance_before: 0,
          balance_after: openingWallet,
        });
      }
      await client.query('COMMIT');

      return res.status(201).json({
        success: true,
        message: 'সাপ্লায়ার সফলভাবে যুক্ত হয়েছে।',
        data: supplier
      });
    } catch (e2) {
      await client.query('ROLLBACK');
      throw e2;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.code === '23505') {
      if (error.constraint && error.constraint.includes('phone')) {
        return res.status(409).json({ success: false, message: 'এই ফোন নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে।' });
      }
      if (error.constraint && error.constraint.includes('email')) {
        return res.status(409).json({ success: false, message: 'এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হয়েছে।' });
      }
      if (error.constraint && error.constraint.includes('name')) {
        return res.status(409).json({ success: false, message: 'এই নামের সাপ্লায়ার ইতিমধ্যে বিদ্যমান।' });
      }
    }

    console.error('Supplier creation error:', error);
    return res.status(500).json({ success: false, message: 'সার্ভার এরর হয়েছে।' });
  }
};

exports.getAllSuppliers = async (req, res) => {
  try {
    const query = `
      SELECT id, name, phone, contact_person, mobile, email, address, payable_balance, created_at
      FROM suppliers
      WHERE deleted_at IS NULL
      ORDER BY id DESC;
    `;
    const result = await db.query(query);

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Fetch suppliers error:', error);
    return res.status(500).json({ success: false, message: 'ডাটা ফেচ করতে সমস্যা হয়েছে।' });
  }
};
