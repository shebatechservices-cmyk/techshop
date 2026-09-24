DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS models CASCADE;
DROP TABLE IF EXISTS series CASCADE;
DROP TABLE IF EXISTS sub_categories CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE sub_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category_id INT NOT NULL,
  UNIQUE (name, category_id),
  CONSTRAINT fk_sub_categories_category
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE models (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  brand_id INT NOT NULL,
  category_id INT,
  sub_category_id INT,
  UNIQUE (name, brand_id),
  CONSTRAINT fk_models_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  CONSTRAINT fk_models_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_models_sub_category FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id) ON DELETE SET NULL
);

CREATE TABLE series (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  brand_id INT NOT NULL,
  UNIQUE (name, brand_id),
  CONSTRAINT fk_series_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

CREATE SEQUENCE IF NOT EXISTS product_sku_seq START WITH 1001;

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  short_name VARCHAR(100),
  sku VARCHAR(100) DEFAULT ('SKU-' || LPAD(nextval('product_sku_seq')::text, 5, '0')),
  barcode VARCHAR(100),
  description TEXT,
  category_id INT,
  sub_category_id INT,
  brand_id INT,
  model_id INT,
  series_id INT,
  purchase_price NUMERIC(12,2) DEFAULT 0,
  selling_price NUMERIC(12,2) DEFAULT 0,
  mrp NUMERIC(12,2) DEFAULT 0,
  stock INT DEFAULT 0,
  min_stock INT DEFAULT 0,
  purchase_count INT NOT NULL DEFAULT 0,
  purchased_at TIMESTAMP,
  location VARCHAR(100),
  warranty_months INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  supplier_name VARCHAR(150),
  supplier_phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_products_sub_category FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
  CONSTRAINT fk_products_model FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE SET NULL,
  CONSTRAINT fk_products_series FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE SET NULL
);

CREATE TABLE product_images (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL,
  image_url TEXT NOT NULL,
  image_type VARCHAR(20) NOT NULL DEFAULT 'gallery',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

INSERT INTO categories (name) VALUES ('Laptop'), ('Mobile');

INSERT INTO sub_categories (name, category_id) VALUES
('Gaming', 1),
('Android', 2);

INSERT INTO brands (name) VALUES ('Dell'), ('Samsung');

INSERT INTO models (name, brand_id, category_id, sub_category_id) VALUES
('XPS 13', 1, 1, 1),
('Galaxy S24', 2, 2, 2);

INSERT INTO series (name, brand_id) VALUES
('XPS', 1),
('S Series', 2);

INSERT INTO products (name, category_id, sub_category_id, brand_id, model_id, series_id, selling_price, stock, min_stock) VALUES
('Dell XPS 13 9310', 1, 1, 1, 1, 1, 119900, 10, 2),
('Samsung Galaxy S24', 2, 2, 2, 2, 2, 89900, 15, 3);

-- Purchase Order schema (New Purchase Order popup)
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  contact_code VARCHAR(50),
  phone VARCHAR(50),
  payable_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_accounts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  account_type VARCHAR(30) NOT NULL DEFAULT 'drawer',
  balance NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number VARCHAR(30) NOT NULL UNIQUE,
  supplier_id INT NOT NULL,
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
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_purchase_orders_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id SERIAL PRIMARY KEY,
  purchase_order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  cost_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  margin_type VARCHAR(10) NOT NULL DEFAULT 'percent',
  margin_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  final_sale_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  expected_date DATE,
  warranty_months INT DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_po_items_order
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_po_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS purchase_order_serials (
  id SERIAL PRIMARY KEY,
  purchase_order_item_id INT NOT NULL,
  serial_code VARCHAR(120) NOT NULL,
  UNIQUE (serial_code),
  CONSTRAINT fk_po_serials_item
    FOREIGN KEY (purchase_order_item_id) REFERENCES purchase_order_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchase_order_payments (
  id SERIAL PRIMARY KEY,
  purchase_order_id INT NOT NULL,
  payment_method VARCHAR(40) NOT NULL,
  account_id INT,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_po_payments_order
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_po_payments_account
    FOREIGN KEY (account_id) REFERENCES payment_accounts(id)
);
