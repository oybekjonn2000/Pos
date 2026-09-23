-- V40: Remove uniqueness constraint on employee PIN lookup
-- Allow multiple employees in the same restaurant to use identical PINs (1-4 digits).

DROP INDEX IF EXISTS idx_users_tenant_pin_lookup;

-- Recreate as a non-unique index to support fast lookups without enforcing uniqueness
CREATE INDEX IF NOT EXISTS idx_users_tenant_pin_lookup
ON users (tenant_id, pin_lookup_hash)
WHERE deleted_at IS NULL AND pin_lookup_hash IS NOT NULL;
