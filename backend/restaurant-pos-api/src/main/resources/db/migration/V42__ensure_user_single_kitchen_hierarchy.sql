-- ============================================================
-- V42: ENSURE USER SINGLE KITCHEN HIERARCHY
-- Enforces Kitchen 1 -> N Employees, Employee -> 1 Kitchen
-- ============================================================

-- 1. Ensure kitchen_id column exists on users table with foreign key
ALTER TABLE users ADD COLUMN IF NOT EXISTS kitchen_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_users_kitchen'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT fk_users_kitchen 
        FOREIGN KEY (kitchen_id) REFERENCES kitchens(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Migrate existing employee_kitchens assignments to users.kitchen_id
UPDATE users u
SET kitchen_id = ek.kitchen_id
FROM employee_kitchens ek
WHERE u.id = ek.employee_id
  AND u.kitchen_id IS NULL;

-- 3. Fast lookup index for kitchen staff
CREATE INDEX IF NOT EXISTS idx_users_kitchen_tenant 
    ON users(tenant_id, kitchen_id) 
    WHERE deleted_at IS NULL AND kitchen_id IS NOT NULL;
