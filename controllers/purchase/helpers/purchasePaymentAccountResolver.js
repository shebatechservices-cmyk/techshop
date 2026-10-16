// Resolve target payment account (checks ID, name/sub_option, or defaults by payment method)
const resolvePaymentAccount = async (client, payment) => {
    let targetAccount = null;
    const accountId = payment.account_id ? parseInt(payment.account_id, 10) : null;
    const subOption = String(payment.sub_option || payment.account_name || '').trim();
    const paymentMethod = String(payment.payment_method || payment.method || payment.payment_mode || '').trim().toLowerCase();

    if (accountId && !isNaN(accountId)) {
        const accRes = await client.query('SELECT * FROM payment_accounts WHERE id = $1', [accountId]);
        if (accRes.rows.length) targetAccount = accRes.rows[0];
    }
    if (!targetAccount && subOption) {
        const cleanedSubOption = subOption.replace(/\s*\([^)]*\)$/, '').trim();
        const accRes = await client.query(
            'SELECT * FROM payment_accounts WHERE LOWER(name) = LOWER($1) OR LOWER(name) = LOWER($2) OR LOWER(account_number) = LOWER($1) LIMIT 1',
            [subOption, cleanedSubOption]
        );
        if (accRes.rows.length) targetAccount = accRes.rows[0];
    }
    if (!targetAccount && paymentMethod) {
        // Method-aware resolution: never silently dump bank or MFS payments into cash drawer
        if (paymentMethod.includes('bank')) {
            const bankRes = await client.query(
                "SELECT * FROM payment_accounts WHERE LOWER(account_type) = 'bank' ORDER BY id ASC LIMIT 1"
            );
            if (bankRes.rows.length) targetAccount = bankRes.rows[0];
        } else if (paymentMethod.includes('mfs') || paymentMethod.includes('mobile') || paymentMethod.includes('bkash') || paymentMethod.includes('nagad') || paymentMethod.includes('rocket')) {
            const mfsRes = await client.query(
                "SELECT * FROM payment_accounts WHERE LOWER(account_type) IN ('mfs', 'mobile_banking') ORDER BY id ASC LIMIT 1"
            );
            if (mfsRes.rows.length) targetAccount = mfsRes.rows[0];
        }
    }
    if (!targetAccount) {
        // Fallback: primary Cash Drawer
        const drawerRes = await client.query(
            "SELECT * FROM payment_accounts WHERE account_type = 'drawer' OR LOWER(name) LIKE '%drawer%' OR id = 1 ORDER BY (account_type = 'drawer') DESC, id ASC LIMIT 1"
        );
        if (drawerRes.rows.length) targetAccount = drawerRes.rows[0];
    }
    return targetAccount;
};

module.exports = {
    resolvePaymentAccount,
};
