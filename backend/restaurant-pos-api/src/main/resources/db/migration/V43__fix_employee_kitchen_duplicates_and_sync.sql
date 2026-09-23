-- ============================================================
-- V43: FIX EMPLOYEE-KITCHEN SYNC & REMOVE DUPLICATES
-- Ensures employee_kitchens and users.kitchen_id are in sync
-- Removes any duplicate rows that cause unique constraint errors
-- ============================================================

-- 1. Remove duplicate employee_kitchens records
-- Keep only the oldest (min id) for each (employee_id, kitchen_id) pair
DELETE FROM employee_kitchens
WHERE id NOT IN (
    SELECT MIN(id::text)::uuid
    FROM employee_kitchens
    GROUP BY employee_id, kitchen_id
);

-- 2. For users who have kitchen_id set but NO employee_kitchens record,
-- ensure employee_kitchens row exists (ON CONFLICT DO NOTHING to be safe)
INSERT INTO employee_kitchens (id, tenant_id, employee_id, kitchen_id, created_at, updated_at)
SELECT
    uuid_generate_v4(),
    u.tenant_id,
    u.id,
    u.kitchen_id,
    NOW(),
    NOW()
FROM users u
WHERE u.kitchen_id IS NOT NULL
  AND u.deleted_at IS NULL
  AND u.tenant_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM kitchens k WHERE k.id = u.kitchen_id AND k.deleted_at IS NULL)
  AND NOT EXISTS (
      SELECT 1 FROM employee_kitchens ek
      WHERE ek.employee_id = u.id AND ek.kitchen_id = u.kitchen_id
  )
ON CONFLICT (employee_id, kitchen_id) DO NOTHING;

-- 3. For users who have employee_kitchens but kitchen_id is NULL on users table,
-- sync kitchen_id from employee_kitchens (first assignment)
UPDATE users u
SET kitchen_id = (
    SELECT ek.kitchen_id
    FROM employee_kitchens ek
    WHERE ek.employee_id = u.id
    ORDER BY ek.created_at ASC
    LIMIT 1
)
WHERE u.kitchen_id IS NULL
  AND u.deleted_at IS NULL
  AND EXISTS (
      SELECT 1 FROM employee_kitchens ek WHERE ek.employee_id = u.id
  );
