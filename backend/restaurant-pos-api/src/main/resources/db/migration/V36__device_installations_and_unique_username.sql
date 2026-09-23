-- =====================================================================
-- V36: JOWI POS Device Installations & Case-Insensitive Unique Username
-- =====================================================================

-- 1. Ensure any remaining duplicate usernames are safe before creating unique index
UPDATE users 
SET username = username || '_' || SUBSTRING(id::text, 1, 4)
WHERE id IN (
    SELECT u.id
    FROM users u
    JOIN (
        SELECT LOWER(username) AS uname, MIN(created_at) AS min_created
        FROM users
        WHERE deleted_at IS NULL
        GROUP BY LOWER(username)
        HAVING COUNT(*) > 1
    ) dup ON LOWER(u.username) = dup.uname AND u.created_at > dup.min_created
    WHERE u.deleted_at IS NULL
);

-- 2. Create case-insensitive unique index on LOWER(username) for active users
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower 
ON users (LOWER(username)) 
WHERE deleted_at IS NULL;

-- 3. Create device_installations table for Desktop POS Device Binding
CREATE TABLE IF NOT EXISTS device_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id VARCHAR(100) NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_name VARCHAR(255),
    device_type VARCHAR(50) NOT NULL DEFAULT 'DESKTOP_POS',
    os_info VARCHAR(255),
    app_version VARCHAR(50),
    ip_address VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_device_installations_installation_id UNIQUE (installation_id)
);

CREATE INDEX IF NOT EXISTS idx_device_installations_inst_id ON device_installations(installation_id);
CREATE INDEX IF NOT EXISTS idx_device_installations_dev_id ON device_installations(device_id);
CREATE INDEX IF NOT EXISTS idx_device_installations_tenant ON device_installations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_device_installations_status ON device_installations(status);
