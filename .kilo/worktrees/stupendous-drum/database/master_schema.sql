-- ==========================================================
-- 1. SETTINGS & BUSINESS CONFIGURATION
-- ==========================================================
CREATE TABLE IF NOT EXISTS business_profiles (
  id SERIAL PRIMARY KEY,
  business_name VARCHAR(150) NOT NULL,
  tagline VARCHAR(200),
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(100),
  address TEXT,
  logo_url VARCHAR(255),
  currency VARCHAR(10) DEFAULT 'BDT',
  vat_percentage NUMERIC(5,2) DEFAULT 0,
  invoice_terms TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  label VARCHAR(80) NOT NULL,
  slug VARCHAR(80) NOT NULL UNIQUE,
  icon VARCHAR(40) NOT NULL,
  route_key VARCHAR(80) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS menu_sub_items (
  id SERIAL PRIMARY KEY,
  menu_item_id INT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  label VARCHAR(120) NOT NULL,
  route_key VARCHAR(80) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE (menu_item_id, label)
);

-- ==========================================================
-- 2. SOC & SECURITY CONTROL (USERS, ROLES & LOGS)
-- ==========================================================
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  permissions JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  role_id INT REFERENCES roles(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(50) UNIQUE,
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  target_table VARCHAR(50),
  target_id INT,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- 3. ACCOUNTS & DIGITAL WALLETS
-- ==========================================================
CREATE TABLE IF NOT EXISTS payment_accounts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  account_type VARCHAR(30) NOT NULL DEFAULT 'drawer', -- drawer, bank, bkash, nagad
  account_number VARCHAR(50),
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expense_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES expense_categories(id) ON DELETE SET NULL,
  account_id INT REFERENCES payment_accounts(id) ON DELETE RESTRICT,
  amount NUMERIC(14,2) NOT NULL,
  expense_date DATE DEFAULT CURRENT_DATE,
  reference_no VARCHAR(100),
  note TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- 4. PRODUCTS CATALOG
-- ==========================================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  image_url VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_categories (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  deleted_at TIMESTAMP DEFAULT NULL,
  UNIQUE(category_id, name)
);

CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  logo_url VARCHAR(255),
  deleted_at TIMESTAMP DEFAULT NULL,
  sub_category_id INT REFERENCES sub_categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS units (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  model_no VARCHAR(100),
  sku VARCHAR(100),
  barcode VARCHAR(100),
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  sub_category_id INT REFERENCES sub_categories(id) ON DELETE SET NULL,
  brand_id INT REFERENCES brands(id) ON DELETE SET NULL,
  model_id INT REFERENCES models(id) ON DELETE SET NULL,
  series_id INT REFERENCES series(id) ON DELETE SET NULL,
  purchase_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  min_stock INT DEFAULT 0,
  warranty_months INT DEFAULT 0,
  description TEXT,
  is_serial_tracked BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  location VARCHAR(255),
  supplier_name VARCHAR(150),
  supplier_phone VARCHAR(50),
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_path VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT false
);

-- ==========================================================
-- 5. INVENTORY & STOCK
-- ==========================================================
CREATE TABLE IF NOT EXISTS warehouses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  location TEXT,
  is_default BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS stock_levels (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id INT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0,
  UNIQUE(product_id, warehouse_id)
);

-- ==========================================================
-- 6. PURCHASES & SUPPLIERS
-- ==========================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL UNIQUE,
  contact_person VARCHAR(100),
  mobile VARCHAR(50),
  email VARCHAR(100) UNIQUE,
  address TEXT,
  payable_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number VARCHAR(30) NOT NULL UNIQUE,
  supplier_id INT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  warehouse_id INT REFERENCES warehouses(id) ON DELETE RESTRICT,
  transaction_reference VARCHAR(120),
  extra_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_sale NUMERIC(14,2) NOT NULL DEFAULT 0,
  potential_profit NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_paid NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_due NUMERIC(14,2) NOT NULL DEFAULT 0,
  item_count INT NOT NULL DEFAULT 0,
  unit_count INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'saved',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id SERIAL PRIMARY KEY,
  purchase_order_id INT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL DEFAULT 0,
  cost_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  margin_type VARCHAR(10) NOT NULL DEFAULT 'percent',
  margin_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  final_sale_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  expected_date DATE,
  warranty_months INT DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS purchase_order_serials (
  id SERIAL PRIMARY KEY,
  purchase_order_item_id INT NOT NULL REFERENCES purchase_order_items(id) ON DELETE CASCADE,
  serial_code VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS purchase_order_payments (
  id SERIAL PRIMARY KEY,
  purchase_order_id INT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  payment_method VARCHAR(40) NOT NULL,
  account_id INT REFERENCES payment_accounts(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- 7. SALES & CUSTOMERS
-- ==========================================================
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100),
  address TEXT,
  customer_type VARCHAR(30) DEFAULT 'retail',
  receivable_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_invoices (
  id SERIAL PRIMARY KEY,
  invoice_no VARCHAR(30) NOT NULL UNIQUE,
  customer_id INT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  warehouse_id INT REFERENCES warehouses(id) ON DELETE RESTRICT,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount NUMERIC(14,2) NOT NULL DEFAULT 0,
  vat NUMERIC(14,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  due_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  sold_by INT REFERENCES users(id) ON DELETE SET NULL,
  invoice_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_items (
  id SERIAL PRIMARY KEY,
  sales_invoice_id INT NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2) NOT NULL,
  cost_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(14,2) NOT NULL,
  warranty_expire_date DATE
);

CREATE TABLE IF NOT EXISTS sales_item_serials (
  id SERIAL PRIMARY KEY,
  sales_item_id INT NOT NULL REFERENCES sales_items(id) ON DELETE CASCADE,
  serial_code VARCHAR(120) NOT NULL
);

-- ==========================================================
-- 8. PROJECTS & SERVICES
-- ==========================================================
CREATE TABLE IF NOT EXISTS service_projects (
  id SERIAL PRIMARY KEY,
  project_code VARCHAR(30) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
  assigned_technician INT REFERENCES users(id) ON DELETE SET NULL,
  contract_amount NUMERIC(14,2) DEFAULT 0,
  start_date DATE,
  deadline DATE,
  status VARCHAR(30) DEFAULT 'ongoing',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- 9. E-COMMERCE
-- ==========================================================
CREATE TABLE IF NOT EXISTS ecommerce_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(30) NOT NULL UNIQUE,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  shipping_address TEXT NOT NULL,
  delivery_charge NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(14,2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  order_status VARCHAR(30) DEFAULT 'processing',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- 10. TRASH & RECOVERY
-- ==========================================================
CREATE TABLE IF NOT EXISTS trash_records (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  record_id INT NOT NULL,
  record_data JSONB NOT NULL,
  deleted_by INT REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- 11. DASHBOARD SUMMARIES & INDEXES
-- ==========================================================
CREATE TABLE IF NOT EXISTS daily_summaries (
  id SERIAL PRIMARY KEY,
  summary_date DATE NOT NULL UNIQUE,
  total_sales NUMERIC(14,2) DEFAULT 0,
  total_purchases NUMERIC(14,2) DEFAULT 0,
  total_expenses NUMERIC(14,2) DEFAULT 0,
  net_profit NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku_barcode);
CREATE INDEX IF NOT EXISTS idx_sales_inv_cust ON sales_invoices (customer_id, invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_po_supp ON purchase_orders (supplier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_prod_wh ON stock_levels (product_id, warehouse_id);

-- ==========================================================
-- 12. SHOP SETTINGS & PAYMENT METHODS
-- ==========================================================
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

CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  method_name VARCHAR(100) NOT NULL UNIQUE,
  account_details TEXT,
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO payment_methods (method_name)
VALUES ('Cash'), ('bKash'), ('Nagad'), ('Bank Transfer')
ON CONFLICT (method_name) DO NOTHING;

-- ==========================================================
-- 13. PRODUCT NAMES & ATTRIBUTES
-- ==========================================================
CREATE TABLE IF NOT EXISTS product_names (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  brand_id INT REFERENCES brands(id) ON DELETE SET NULL,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  sub_category_id INT REFERENCES sub_categories(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP DEFAULT NULL,
  deleted_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS series (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  brand_id INT REFERENCES brands(id) ON DELETE CASCADE,
  deleted_at TIMESTAMP DEFAULT NULL,
  deleted_by INT DEFAULT NULL,
  model_id INT REFERENCES models(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS models (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  brand_id INT REFERENCES brands(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  sub_category_id INT REFERENCES sub_categories(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP DEFAULT NULL,
  deleted_by INT DEFAULT NULL
);

-- ==========================================================
-- 14. WARRANTY CLAIMS, RETURNS & DAMAGED GOODS
-- ==========================================================
CREATE TABLE IF NOT EXISTS warranty_claims (
  id SERIAL PRIMARY KEY,
  claim_no VARCHAR(50) NOT NULL UNIQUE,
  order_source VARCHAR(30) DEFAULT 'offline',
  invoice_no VARCHAR(50),
  ecommerce_order_no VARCHAR(50),
  customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
  product_id INT REFERENCES products(id) ON DELETE RESTRICT,
  barcode VARCHAR(100),
  issue_description TEXT,
  status VARCHAR(30) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_returns (
  id SERIAL PRIMARY KEY,
  return_no VARCHAR(50) NOT NULL UNIQUE,
  order_source VARCHAR(30) DEFAULT 'offline',
  invoice_no VARCHAR(50),
  ecommerce_order_no VARCHAR(50),
  customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
  product_id INT REFERENCES products(id) ON DELETE RESTRICT,
  return_qty INT NOT NULL DEFAULT 1,
  refund_amount NUMERIC(14,2) DEFAULT 0,
  return_reason TEXT,
  condition VARCHAR(50) DEFAULT 'Good',
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS damaged_products (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- 15. E-COMMERCE ORDER ITEMS & SALES COMPATIBILITY
-- ==========================================================
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS order_no VARCHAR(50);

CREATE TABLE IF NOT EXISTS ecommerce_order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES ecommerce_orders(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  invoice_no VARCHAR(50) NOT NULL UNIQUE,
  customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  payment_method_id INT,
  loyalty_points_earned INT DEFAULT 0,
  loyalty_points_used INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- ==========================================================
-- 16. PURCHASE QUOTATIONS & ESTIMATES
-- ==========================================================
CREATE TABLE IF NOT EXISTS purchase_quotations (
  id SERIAL PRIMARY KEY,
  quotation_no VARCHAR(50) NOT NULL UNIQUE,
  supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
  reference VARCHAR(120),
  quotation_date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  total_amount NUMERIC(14,2) DEFAULT 0,
  item_count INT DEFAULT 0,
  status VARCHAR(30) DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_quotation_items (
  id SERIAL PRIMARY KEY,
  quotation_id INT NOT NULL REFERENCES purchase_quotations(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT
);