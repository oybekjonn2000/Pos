-- ============================================================
-- V32__multi_tenant_restaurant_enhancements.sql
-- Multi-Tenant Restaurant POS Architecture Migration
-- 1. Adds restaurant code, status, and inn to tenants
-- 2. Makes tenant_id nullable for platform SUPER_ADMIN in users & roles
-- 3. Provisions SUPER_ADMIN and RESTAURANT_ADMIN roles & superadmin user
-- 4. Ensures indexes for high performance tenant filtering
-- ============================================================

-- 1. ENHANCE TENANTS TABLE FOR MULTI-RESTAURANT MANAGEMENT
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS inn VARCHAR(50);

-- Migrate existing tenant to Demo Restaurant with code DEMO001
UPDATE tenants 
SET code = 'DEMO001', 
    name = 'Demo Restaurant', 
    status = 'ACTIVE', 
    inn = COALESCE(tax_number, '305123987')
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Fallback for any other tenants without code
UPDATE tenants 
SET code = 'REST-' || substring(id::text from 1 for 8) 
WHERE code IS NULL;

-- Enforce NOT NULL and unique constraint on code
ALTER TABLE tenants ALTER COLUMN code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenants_code ON tenants(upper(code));
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- 2. ALLOW NULL TENANT_ID FOR PLATFORM-LEVEL SUPER_ADMIN IN ROLES AND USERS
ALTER TABLE roles ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL;

-- 3. SEED SUPER_ADMIN AND RESTAURANT_ADMIN ROLES
INSERT INTO roles (id, tenant_id, name, description, is_system, is_active)
VALUES 
    ('b0000000-0000-0000-0000-000000000000', NULL, 'SUPER_ADMIN', 'Platforma Super Admini (Barcha restoranlarni boshqarish)', TRUE, TRUE),
    ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'RESTAURANT_ADMIN', 'Restoran Admini (Faqat o''z restoranini boshqarish)', TRUE, TRUE)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = TRUE;

-- Grant ALL system permissions to SUPER_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'b0000000-0000-0000-0000-000000000000', id FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Grant permissions to RESTAURANT_ADMIN (matches ADMIN)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'b0000000-0000-0000-0000-000000000006', permission_id 
FROM role_permissions 
WHERE role_id = 'b0000000-0000-0000-0000-000000000001'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. SEED SUPERADMIN USER (Platform Owner)
-- Password: superadmin123 (BCrypt hash)
INSERT INTO users (
    id, 
    tenant_id, 
    username, 
    email, 
    phone, 
    password_hash, 
    first_name, 
    last_name, 
    pin_hash, 
    language, 
    is_active, 
    created_at, 
    updated_at
)
VALUES (
    'c0000000-0000-0000-0000-000000000000',
    NULL,
    'superadmin',
    'superadmin@restaurantpos.uz',
    '+998900000000',
    crypt('superadmin123', gen_salt('bf', 10)),
    'Platform',
    'SuperAdmin',
    crypt('0000', gen_salt('bf', 10)),
    'uz',
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    password_hash = crypt('superadmin123', gen_salt('bf', 10)),
    is_active = TRUE,
    deleted_at = NULL,
    updated_at = NOW();

-- Assign SUPER_ADMIN role to superadmin user
INSERT INTO user_roles (user_id, role_id)
VALUES ('c0000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Unique index for users where tenant_id IS NULL
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_null_tenant_username 
ON users(lower(username)) 
WHERE tenant_id IS NULL;
