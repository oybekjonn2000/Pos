-- V37: Employee PIN-only authentication and per-tenant unique PIN constraint
-- Support JOWI POS authentication model:
-- 1. Ordinary employees have NO username and NO password (username and password_hash are NULL).
-- 2. Ordinary employees authenticate via 4-6 digit numeric PIN only (PIN_ONLY).
-- 3. Admin has username, password, and PIN (PASSWORD_AND_PIN).
-- 4. PIN is strictly unique per restaurant (tenant_id).

-- 1. Allow nullable username and password_hash
ALTER TABLE users ALTER COLUMN username DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- 2. Add authentication_type and deterministic pin_lookup_hash
ALTER TABLE users ADD COLUMN IF NOT EXISTS authentication_type VARCHAR(30) NOT NULL DEFAULT 'PASSWORD_AND_PIN';
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_lookup_hash VARCHAR(64);

-- 3. Backfill authentication_type for existing users
-- Users with role ADMIN or SUPER_ADMIN remain PASSWORD_AND_PIN.
-- All other staff roles become PIN_ONLY.
UPDATE users u
SET authentication_type = 'PIN_ONLY',
    username = NULL,
    password_hash = NULL
WHERE u.deleted_at IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = u.id AND r.name IN ('ADMIN', 'SUPER_ADMIN')
  );

-- Ensure pgcrypto extension is available for sha256 digests
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 4. Seed / Backfill PINs for existing users to guarantee valid non-duplicate PINs per restaurant

-- Demo Restaurant (tenant code DEMO001)
-- Admin (Oybek Rustamov): PIN 1111
UPDATE users
SET pin_hash = crypt('1111', gen_salt('bf', 10)),
    pin_lookup_hash = encode(digest(tenant_id::text || ':1111', 'sha256'), 'hex'),
    authentication_type = 'PASSWORD_AND_PIN'
WHERE username = 'admin' AND deleted_at IS NULL;

-- Cashier (Malika Sobirova): PIN 2222
UPDATE users u
SET pin_hash = crypt('2222', gen_salt('bf', 10)),
    pin_lookup_hash = encode(digest(u.tenant_id::text || ':2222', 'sha256'), 'hex')
WHERE u.first_name = 'Malika' AND u.deleted_at IS NULL;

-- Waiter (Jasur Karimov): PIN 3333
UPDATE users u
SET pin_hash = crypt('3333', gen_salt('bf', 10)),
    pin_lookup_hash = encode(digest(u.tenant_id::text || ':3333', 'sha256'), 'hex')
WHERE u.first_name = 'Jasur' AND u.deleted_at IS NULL;

-- Kitchen (Bobur Oshpaz): PIN 4444
UPDATE users u
SET pin_hash = crypt('4444', gen_salt('bf', 10)),
    pin_lookup_hash = encode(digest(u.tenant_id::text || ':4444', 'sha256'), 'hex')
WHERE u.first_name = 'Bobur' AND u.deleted_at IS NULL;

-- Toshkent Milliy Taomlar (tenant code TASH001)
-- Admin (Toshkent Boshqaruvchisi): PIN 1234
UPDATE users
SET pin_hash = crypt('1234', gen_salt('bf', 10)),
    pin_lookup_hash = encode(digest(tenant_id::text || ':1234', 'sha256'), 'hex'),
    authentication_type = 'PASSWORD_AND_PIN'
WHERE username = 'admin_tash' AND deleted_at IS NULL;

-- Waiter (Tashkent Ofitsiant): PIN 2580
UPDATE users u
SET pin_hash = crypt('2580', gen_salt('bf', 10)),
    pin_lookup_hash = encode(digest(u.tenant_id::text || ':2580', 'sha256'), 'hex'),
    authentication_type = 'PIN_ONLY'
WHERE u.first_name = 'Tashkent' AND u.last_name = 'Ofitsiant' AND u.deleted_at IS NULL;

-- Samarqand Osh Markazi (SAM001)
UPDATE users
SET pin_hash = crypt('1234', gen_salt('bf', 10)),
    pin_lookup_hash = encode(digest(tenant_id::text || ':1234', 'sha256'), 'hex'),
    authentication_type = 'PASSWORD_AND_PIN'
WHERE username = 'admin_sam' AND deleted_at IS NULL;

-- 5. Backfill pin_lookup_hash for any other existing user who already has a pin_hash
-- In case some other test users had 1111/2222/3333/4444:
UPDATE users
SET pin_lookup_hash = encode(digest(tenant_id::text || ':2222', 'sha256'), 'hex')
WHERE pin_lookup_hash IS NULL AND pin_hash IS NOT NULL AND first_name = 'Malika';

-- 6. Create UNIQUE index for PIN uniqueness within each tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_pin_lookup
ON users (tenant_id, pin_lookup_hash)
WHERE deleted_at IS NULL AND pin_lookup_hash IS NOT NULL;
