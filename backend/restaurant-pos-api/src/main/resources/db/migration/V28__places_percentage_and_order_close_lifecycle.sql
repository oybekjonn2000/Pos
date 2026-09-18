-- V28: Places (Table Zones) percentage, order closed status lifecycle, and payment status

-- 1. Add percentage to table_zones (places)
ALTER TABLE table_zones 
ADD COLUMN IF NOT EXISTS percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00;

-- 2. Update orders status check constraint to include 'CLOSED'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('OPEN','IN_PROGRESS','READY','CLOSED','PAID','CANCELLED','REFUNDED'));

-- 3. Add zone and payment tracking columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES table_zones(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS place_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS place_fee NUMERIC(15,2) NOT NULL DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(tenant_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_zone_id ON orders(zone_id);

-- Update existing PAID orders to have payment_status = 'PAID'
UPDATE orders SET payment_status = 'PAID' WHERE status = 'PAID';

-- 4. Seed default "Olib ketish" zone (0%) and default tables for each tenant if not present
DO $$
DECLARE
    t RECORD;
    new_zone_id UUID;
BEGIN
    FOR t IN SELECT id FROM tenants LOOP
        -- Check if 'Olib ketish' zone already exists for this tenant
        SELECT id INTO new_zone_id FROM table_zones 
        WHERE tenant_id = t.id AND LOWER(name) = 'olib ketish' AND deleted_at IS NULL
        LIMIT 1;

        IF new_zone_id IS NULL THEN
            new_zone_id := gen_random_uuid();
            INSERT INTO table_zones (id, tenant_id, name, description, percentage, sort_order, is_active, created_at, updated_at)
            VALUES (new_zone_id, t.id, 'Olib ketish', 'Olib ketish buyurtmalari joyi', 0.00, 99, TRUE, NOW(), NOW());

            -- Create default tables for Olib ketish
            INSERT INTO restaurant_tables (id, tenant_id, zone_id, table_number, name, capacity, shape, status, is_active, created_at, updated_at)
            VALUES 
                (gen_random_uuid(), t.id, new_zone_id, 'OK-1', 'Olib ketish 1', 1, 'rectangle', 'FREE', TRUE, NOW(), NOW()),
                (gen_random_uuid(), t.id, new_zone_id, 'OK-2', 'Olib ketish 2', 1, 'rectangle', 'FREE', TRUE, NOW(), NOW())
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;
