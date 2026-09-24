-- Migration: Add extended fields to service_projects for CCTV Setup & Repair Workflow

ALTER TABLE service_projects
    ADD COLUMN IF NOT EXISTS invoice_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS invoice_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS setup_charge NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS conveyance_cost NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS meal_allowance NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS customer_billing_amount NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS technician_status VARCHAR(50) DEFAULT 'assigned',
    ADD COLUMN IF NOT EXISTS admin_confirmed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS confirmed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS site_address TEXT,
    ADD COLUMN IF NOT EXISTS site_phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS equipment_details JSONB,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Create index for quick lookup
CREATE INDEX IF NOT EXISTS idx_service_projects_invoice_id ON service_projects(invoice_id);
CREATE INDEX IF NOT EXISTS idx_service_projects_tech_status ON service_projects(technician_status);
CREATE INDEX IF NOT EXISTS idx_service_projects_admin_confirmed ON service_projects(admin_confirmed);

-- Ensure sample technician user exists if none
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE role_id = 4) THEN
        INSERT INTO users (name, email, password_hash, role_id)
        VALUES ('Field Technician', 'technician@example.com', 'scrypt_or_hash_dummy', 4);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM customers WHERE customer_type = 'technician') THEN
        INSERT INTO customers (name, phone, address, customer_type, user_role, receivable_balance)
        VALUES ('Demo Technician', '01700000000', 'Central Service Point, Dhaka', 'technician', 'technician', 0);
    END IF;
END $$;
