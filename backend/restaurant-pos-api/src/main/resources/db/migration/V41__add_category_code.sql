-- ============================================================
-- V41: ADD CATEGORY CODE FOR BUSINESS IDENTIFIER & EXCEL MAPPING
-- Enables stable cross-restaurant export/import and direct business mapping
-- ============================================================

-- 1. Add optional code column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- 2. Populate code for existing categories using clean name prefix + short ID suffix to ensure uniqueness
UPDATE categories
SET code = UPPER(
    COALESCE(
        NULLIF(SUBSTRING(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 15), ''),
        'CAT'
    )
) || '-' || UPPER(SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 6))
WHERE code IS NULL;

-- 3. Create case-insensitive unique index per tenant on active categories with a code
CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_tenant_code 
    ON categories(tenant_id, UPPER(code)) 
    WHERE deleted_at IS NULL AND code IS NOT NULL;

-- 4. Fast lookup index for category code
CREATE INDEX IF NOT EXISTS idx_categories_tenant_code 
    ON categories(tenant_id, code) 
    WHERE deleted_at IS NULL;
