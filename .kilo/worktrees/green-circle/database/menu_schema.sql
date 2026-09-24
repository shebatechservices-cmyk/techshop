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
  menu_item_id INT NOT NULL,
  label VARCHAR(120) NOT NULL,
  route_key VARCHAR(80) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_menu_sub_items_parent
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  UNIQUE (menu_item_id, label)
);

CREATE INDEX IF NOT EXISTS idx_menu_items_sort ON menu_items (sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_sub_items_parent ON menu_sub_items (menu_item_id, sort_order);

INSERT INTO menu_items (label, slug, icon, route_key, sort_order) VALUES
('Dashboard', 'dashboard', 'grid', 'dashboard', 10),
('Products', 'products', 'box', 'catalog', 20),
('Purchases & Suppliers', 'purchases', 'cart', 'purchases', 30),
('Inventory & Stock', 'inventory', 'layers', 'inventory', 40),
('Sales & Customers', 'sales', 'users', 'sales', 50),
('Accounts & eWallets', 'accounts', 'wallet', 'accounts', 60),
('Projects & Services', 'projects', 'wrench', 'projects', 70),
('E-Commerce', 'ecommerce', 'globe', 'ecommerce', 80),
('SOC Security', 'soc', 'shield', 'soc', 90),
('Trash', 'trash', 'trash', 'trash', 100),
('Settings', 'settings', 'gear', 'settings', 110)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO menu_sub_items (menu_item_id, label, route_key, sort_order)
SELECT parent.id, seed.label, seed.route_key, seed.sort_order
FROM (
  VALUES
    ('dashboard', 'Overview', 'dashboard', 10),
    ('products', 'Product Catalog', 'catalog', 10),
    ('products', 'Categories & Attributes', 'attributes', 20),
    ('purchases', 'New Purchase Order', 'purchase_new', 10),
    ('purchases', 'Suppliers', 'purchases', 20),
    ('inventory', 'Stock overview', 'inventory', 10),
    ('inventory', 'Low stock', 'inventory', 20),
    ('sales', 'Customers', 'sales', 10),
    ('sales', 'New sale', 'sales', 20),
    ('accounts', 'eWallets', 'accounts', 10),
    ('accounts', 'Ledgers', 'accounts', 20),
    ('projects', 'Active projects', 'projects', 10),
    ('ecommerce', 'Storefront', 'ecommerce', 10),
    ('soc', 'Alerts', 'soc', 10),
    ('trash', 'Deleted items', 'trash', 10),
    ('settings', 'General', 'settings', 10)
) AS seed(slug, label, route_key, sort_order)
JOIN menu_items parent ON parent.slug = seed.slug
ON CONFLICT (menu_item_id, label) DO NOTHING;
