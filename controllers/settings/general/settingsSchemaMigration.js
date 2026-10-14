const pool = require('../../../config/db');

let tablesMigrated = false;

async function ensureSettingsTables() {
    if (tablesMigrated) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS shop_settings (
                id SERIAL PRIMARY KEY,
                shop_name VARCHAR(150) NOT NULL DEFAULT 'Sheba Technology & Networking',
                shop_title VARCHAR(200) DEFAULT 'CCTV, IT & Networking Solution',
                description TEXT,
                phone VARCHAR(50) DEFAULT '01700000000',
                email VARCHAR(100) DEFAULT 'info@shebatech.com',
                address TEXT DEFAULT 'Dhaka, Bangladesh',
                website VARCHAR(150) DEFAULT 'https://shebatech.com',
                logo_url TEXT,
                banner_url TEXT,
                theme_mode VARCHAR(20) DEFAULT 'light',
                invoice_template VARCHAR(50) DEFAULT 'default',
                invoice_color_scheme VARCHAR(30) DEFAULT 'blue',
                loyalty_enabled BOOLEAN DEFAULT true,
                loyalty_rate NUMERIC(6,2) DEFAULT 1.00,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            INSERT INTO shop_settings (id, shop_name)
            VALUES (1, 'Sheba Technology & Networking')
            ON CONFLICT (id) DO NOTHING;

            -- Extend shop_settings with advanced fields
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS shop_code VARCHAR(50) DEFAULT 'SHB-001';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS branch_name VARCHAR(100) DEFAULT 'Main Branch - Head Office';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS alt_phone VARCHAR(50) DEFAULT '+880 1800-000000';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS trade_license VARCHAR(100) DEFAULT 'TRAD/DNCC/048219/2024';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS bin_tin VARCHAR(100) DEFAULT 'BIN-003948172-0101';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS currency_symbol VARCHAR(10) DEFAULT '৳';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Dhaka';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS invoice_footer_note TEXT DEFAULT 'ধন্যবাদ! আবার আসবেন। বিক্রিত পণ্য ৩ দিনের মধ্যে পরিবর্তনযোগ্য (শর্ত প্রযোজ্য)।';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS invoice_terms TEXT DEFAULT '১. ক্যাশ মেমো ব্যতীত কোনো ওয়ারেন্টি দাবি গ্রহণযোগ্য নয়。\n২. বৈদ্যুতিক গোলযোগ বা বার্নজনিত ক্ষতি ওয়ারেন্টির আওতাভুক্ত নয়。\n৩. কাটার পর কোনো তার বা অপটিক্যাল ক্যাবল ফেরত নেওয়া হবে না।';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS show_logo_on_invoice BOOLEAN DEFAULT true;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS show_qr_on_invoice BOOLEAN DEFAULT true;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS show_signature_on_invoice BOOLEAN DEFAULT true;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS default_invoice_format VARCHAR(30) DEFAULT 'thermal_80mm';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS barcode_scanner_auto_submit BOOLEAN DEFAULT true;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS sound_effects_enabled BOOLEAN DEFAULT true;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 5;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS negative_stock_allowed BOOLEAN DEFAULT false;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS app_language VARCHAR(20) DEFAULT 'bn';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS number_format VARCHAR(20) DEFAULT 'lakh';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS sms_provider VARCHAR(50) DEFAULT '';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS sms_api_key VARCHAR(200) DEFAULT '';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS sms_sender_id VARCHAR(50) DEFAULT '';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS sms_sales_enabled BOOLEAN DEFAULT true;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS sms_warranty_enabled BOOLEAN DEFAULT true;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS sms_low_stock_enabled BOOLEAN DEFAULT false;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS sms_sales_template TEXT DEFAULT 'ধন্যবাদ {customer_name}! আপনার চালান নং #{invoice_no}, মোট {amount} ৳ পরিশোধিত হয়েছে। - {shop_name}';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS sms_warranty_template TEXT DEFAULT 'প্রিয় {customer_name}, আপনার সার্ভিস টোকেন #{warranty_token} এর পণ্য সার্ভিসিং সম্পন্ন হয়েছে। শপে এসে সংগ্রহ করুন।';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS auto_backup_enabled BOOLEAN DEFAULT true;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS auto_backup_time VARCHAR(10) DEFAULT '02:00';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS session_timeout_minutes INT DEFAULT 30;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS license_key VARCHAR(100) DEFAULT 'SHEBA-ENT-2026-X99-PRO';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS license_status VARCHAR(50) DEFAULT 'Active Lifetime Enterprise';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS domain_name VARCHAR(100) DEFAULT 'shebatech.com.bd';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS domain_expiry VARCHAR(50) DEFAULT '2027-01-15';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS ssl_status VARCHAR(50) DEFAULT 'Valid (Let''s Encrypt Wildcard)';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS hosting_server VARCHAR(100) DEFAULT 'Ubuntu 24.04 LTS (Dedicated 8 vCPU, 16GB RAM)';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS warranty_policy TEXT;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS return_refund_policy TEXT;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS secondary_logo_url TEXT;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS sister_concern_name VARCHAR(150);
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS watermark_logo_url TEXT;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS watermark_opacity INT DEFAULT 6;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS enable_watermark BOOLEAN DEFAULT true;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS show_sister_concern BOOLEAN DEFAULT true;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS thermal_tc_clause TEXT;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS footer_greeting TEXT;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS warranty_disclaimer_text TEXT;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS return_policy_text TEXT;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS footer_partner_logos JSONB DEFAULT '[]'::jsonb;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS paper_size VARCHAR(30) DEFAULT 'a4';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS page_margin VARCHAR(30) DEFAULT 'default';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS show_footer_details BOOLEAN DEFAULT true;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS security_pin VARCHAR(20) DEFAULT '1234';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS allow_invoice_modification BOOLEAN DEFAULT true;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS invoice_edit_time_limit_hours INT DEFAULT 360;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS customer_offer_headline TEXT DEFAULT '🔥 মেগা অফার: ৪টি সিসিটিভি ক্যামেরা প্যাকেজে ফ্রি রাউটার ও ইনস্টলেশন চার্জে ২০% ছাড়!';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS customer_offer_enabled BOOLEAN DEFAULT true;
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS technician_offer_headline TEXT DEFAULT '⚡ টেকনিশিয়ান বোনাস: চলতি সপ্তাহে ৫টি প্রজেক্ট সম্পন্ন করলে ১,০০০ টাকা বিশেষ ইনসেনটিভ!';
            ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS technician_offer_enabled BOOLEAN DEFAULT true;

            CREATE TABLE IF NOT EXISTS system_backup_logs (
                id SERIAL PRIMARY KEY,
                backup_name VARCHAR(200) NOT NULL,
                backup_type VARCHAR(50) DEFAULT 'SQL Dump',
                file_size VARCHAR(50) DEFAULT '14.2 MB',
                status VARCHAR(50) DEFAULT 'SUCCESS',
                created_by VARCHAR(100) DEFAULT 'System Admin',
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS sms_providers (
                id SERIAL PRIMARY KEY,
                provider_name VARCHAR(100) NOT NULL,
                provider_code VARCHAR(50) NOT NULL,
                api_url TEXT NOT NULL,
                http_method VARCHAR(10) DEFAULT 'GET',
                auth_type VARCHAR(20) DEFAULT 'param',
                api_key TEXT DEFAULT '',
                api_secret TEXT DEFAULT '',
                sender_id VARCHAR(50) DEFAULT '',
                param_phone_key VARCHAR(50) DEFAULT 'to',
                param_message_key VARCHAR(50) DEFAULT 'message',
                param_sender_key VARCHAR(50) DEFAULT 'sender_id',
                param_api_key VARCHAR(50) DEFAULT 'token',
                extra_params JSONB DEFAULT '{}'::jsonb,
                balance_endpoint TEXT DEFAULT '',
                balance_response_path VARCHAR(100) DEFAULT '',
                is_active BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS sms_trigger_settings (
                id SERIAL PRIMARY KEY,
                trigger_key VARCHAR(100) UNIQUE NOT NULL,
                trigger_name VARCHAR(150) NOT NULL,
                category VARCHAR(50) DEFAULT 'Sales',
                recipient_type VARCHAR(50) DEFAULT 'Customer',
                is_enabled BOOLEAN DEFAULT true,
                template_bn TEXT NOT NULL,
                available_tokens TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS sms_logs (
                id SERIAL PRIMARY KEY,
                trigger_key VARCHAR(100),
                recipient_phone VARCHAR(50) NOT NULL,
                recipient_name VARCHAR(150),
                message_content TEXT NOT NULL,
                provider_used VARCHAR(100),
                status VARCHAR(20) DEFAULT 'sent',
                response_data TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );

            -- Default SMS Triggers Seed
            INSERT INTO sms_trigger_settings (trigger_key, trigger_name, category, recipient_type, is_enabled, template_bn, available_tokens)
            VALUES 
                ('pos_sale_receipt', 'নতুন বিক্রয় ক্যাশ মেমো / রিসিপ্ট', 'Sales', 'Customer', true, 
                 'ধন্যবাদ {customer_name}! আপনার চালান নং #{invoice_no}, পরিশোধিত {paid_amount} ৳ (বকেয়া: {due_amount} ৳)। বিস্তারিত: {short_link} - {shop_name}', 
                 '{customer_name}, {invoice_no}, {total_amount}, {paid_amount}, {due_amount}, {shop_name}, {date}, {short_link}'),
                
                ('due_reminder', 'বকেয়া তাগাদা / ডিউ রিমাইন্ডার', 'Accounts', 'Customer', true, 
                 'প্রিয় {customer_name}, আপনার পূর্বের বকেয়া ৳ {due_amount} পরিশোধ করার জন্য অনুরোধ করা হচ্ছে। - {shop_name}, ফোন: {shop_phone}', 
                 '{customer_name}, {due_amount}, {shop_name}, {shop_phone}'),
                
                ('warranty_received', 'ওয়ারেন্টি ক্লেইম গ্রহণ', 'Warranty', 'Customer', true, 
                 'প্রিয় {customer_name}, আপনার {product_name} এর ওয়ারেন্টি ক্লেইম টোকেন #{warranty_token} গ্রহণ করা হয়েছে। - {shop_name}', 
                 '{customer_name}, {warranty_token}, {product_name}, {shop_name}'),
                
                ('warranty_completed', 'ওয়ারেন্টি সার্ভিস সম্পন্ন ও ডেলিভারি রেডি', 'Warranty', 'Customer', true, 
                 'প্রিয় {customer_name}, আপনার সার্ভিস টোকেন #{warranty_token} এর পণ্য ডেলিভারির জন্য প্রস্তুত। শপে এসে সংগ্রহ করুন। - {shop_name}', 
                 '{customer_name}, {warranty_token}, {product_name}, {shop_name}')
            ON CONFLICT (trigger_key) DO NOTHING;
        `);
        tablesMigrated = true;
    } catch (e) {
        console.warn('Settings table migration notice:', e.message);
    }
}

// Run eager table initialization
ensureSettingsTables().catch(() => {});

module.exports = {
    ensureSettingsTables,
};
