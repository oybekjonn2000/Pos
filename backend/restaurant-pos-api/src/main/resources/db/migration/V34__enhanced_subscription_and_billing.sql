-- ============================================================
-- V34__enhanced_subscription_and_billing.sql
-- Enhanced SaaS Subscriptions, Discount Rules, Invoices, Audit & Periods
-- ============================================================

-- 1. EXTEND SUBSCRIPTION PLANS TABLE
ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS yearly_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS trial_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS max_devices INT DEFAULT 5,
    ADD COLUMN IF NOT EXISTS max_branches INT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- 2. CREATE SUBSCRIPTION DISCOUNT RULES TABLE
CREATE TABLE IF NOT EXISTS subscription_discount_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    min_months INT NOT NULL UNIQUE,
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disc_rules_months ON subscription_discount_rules(min_months);

-- Seed default discount rules (1 month -> 0%, 3 months -> 5%, 6 months -> 10%, 12 months -> 20%)
INSERT INTO subscription_discount_rules (min_months, discount_percent, name, is_active)
VALUES
    (1, 0.00, '1 oylik standart tarif', TRUE),
    (3, 5.00, '3 oylik chegirma (5%)', TRUE),
    (6, 10.00, '6 oylik chegirma (10%)', TRUE),
    (12, 20.00, '12 oylik chegirma (20%)', TRUE)
ON CONFLICT (min_months) DO UPDATE SET
    discount_percent = EXCLUDED.discount_percent,
    name = EXCLUDED.name,
    is_active = TRUE;

-- 3. EXTEND RESTAURANT SUBSCRIPTIONS TABLE
ALTER TABLE restaurant_subscriptions
    ADD COLUMN IF NOT EXISTS next_plan_id UUID REFERENCES subscription_plans(id),
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. CREATE SUBSCRIPTION INVOICES TABLE
CREATE TABLE IF NOT EXISTS subscription_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES restaurant_subscriptions(id) ON DELETE SET NULL,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    duration_months INT NOT NULL DEFAULT 1,
    base_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    adjustment_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    final_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'UZS',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- DRAFT, PENDING, PAID, CANCELLED, EXPIRED
    payment_method VARCHAR(30) NOT NULL DEFAULT 'MANUAL', -- MANUAL, CLICK, PAYME, UZUM, STRIPE, OTHER
    notes TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_inv_tenant ON subscription_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sub_inv_status ON subscription_invoices(status);
CREATE INDEX IF NOT EXISTS idx_sub_inv_num ON subscription_invoices(invoice_number);

-- 5. EXTEND SUBSCRIPTION PAYMENTS TABLE
ALTER TABLE subscription_payments
    ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES subscription_invoices(id) ON DELETE SET NULL;

-- 6. CREATE SUBSCRIPTION PERIODS (HISTORICAL PERIODS)
CREATE TABLE IF NOT EXISTS subscription_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES restaurant_subscriptions(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    period_type VARCHAR(30) NOT NULL DEFAULT 'INITIAL', -- TRIAL, INITIAL, RENEWAL, UPGRADE, DOWNGRADE, MANUAL
    invoice_id UUID REFERENCES subscription_invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_periods_sub ON subscription_periods(subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_periods_tenant ON subscription_periods(tenant_id);

-- 7. CREATE SUBSCRIPTION AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS subscription_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(100),
    role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_audit_tenant ON subscription_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sub_audit_action ON subscription_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_sub_audit_created ON subscription_audit_logs(created_at);

-- 8. UPDATE STANDARD SEED PLANS WITH NEW PRICING & ATTRIBUTES
UPDATE subscription_plans
SET
    price = 0.00,
    yearly_price = 0.00,
    trial_enabled = TRUE,
    trial_days = 14,
    max_users = 10,
    max_tables = 30,
    max_products = 200,
    max_kitchens = 2,
    max_devices = 5,
    max_branches = 1,
    max_orders_per_month = 3000,
    features = '["POS", "KITCHEN", "REPORTS_BASIC", "WAITER_APP"]'::jsonb,
    is_active = TRUE,
    is_archived = FALSE,
    sort_order = 1
WHERE code = 'TRIAL';

UPDATE subscription_plans
SET
    price = 100000.00,
    yearly_price = 1000000.00,
    trial_enabled = FALSE,
    trial_days = 0,
    max_users = 10,
    max_tables = 25,
    max_products = 200,
    max_kitchens = 1,
    max_devices = 5,
    max_branches = 1,
    max_orders_per_month = 2000,
    features = '["POS", "KITCHEN", "REPORTS_BASIC", "WAITER_APP"]'::jsonb,
    is_active = TRUE,
    is_archived = FALSE,
    sort_order = 2
WHERE code = 'STARTER';

UPDATE subscription_plans
SET
    price = 200000.00,
    yearly_price = 2000000.00,
    trial_enabled = FALSE,
    trial_days = 0,
    max_users = 30,
    max_tables = 80,
    max_products = 1000,
    max_kitchens = 3,
    max_devices = 15,
    max_branches = 3,
    max_orders_per_month = 10000,
    features = '["POS", "KITCHEN", "INVENTORY", "RECIPES", "REPORTS_BASIC", "REPORTS_ADVANCED", "OWNER_APP", "WAITER_APP"]'::jsonb,
    is_active = TRUE,
    is_archived = FALSE,
    sort_order = 3
WHERE code = 'BUSINESS';

UPDATE subscription_plans
SET
    price = 400000.00,
    yearly_price = 4000000.00,
    trial_enabled = FALSE,
    trial_days = 0,
    max_users = -1,
    max_tables = -1,
    max_products = -1,
    max_kitchens = -1,
    max_devices = -1,
    max_branches = -1,
    max_orders_per_month = -1,
    features = '["POS", "KITCHEN", "INVENTORY", "RECIPES", "REPORTS_BASIC", "REPORTS_ADVANCED", "OWNER_APP", "WAITER_APP", "API_ACCESS", "MULTI_BRANCH"]'::jsonb,
    is_active = TRUE,
    is_archived = FALSE,
    sort_order = 4
WHERE code = 'PRO';

-- 9. SEED SUBSCRIPTION PERIODS FOR EXISTING SUBSCRIPTIONS (IF ANY)
INSERT INTO subscription_periods (subscription_id, tenant_id, plan_id, start_date, end_date, period_type, created_at)
SELECT rs.id, rs.tenant_id, rs.plan_id, rs.start_date, rs.end_date, 'INITIAL', rs.created_at
FROM restaurant_subscriptions rs
WHERE NOT EXISTS (
    SELECT 1 FROM subscription_periods sp WHERE sp.subscription_id = rs.id
);
