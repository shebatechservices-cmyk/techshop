-- Purchase Order schema for the "New Purchase Order" popup.
-- Safe to run on an existing catalog database.

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

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders (supplier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order ON purchase_order_items (purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_order ON purchase_order_payments (purchase_order_id);

INSERT INTO payment_accounts (name, account_type, balance)
VALUES ('Drawer', 'drawer', 156201.62)
ON CONFLICT (name) DO NOTHING;
