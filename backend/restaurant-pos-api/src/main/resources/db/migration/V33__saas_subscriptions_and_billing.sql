-- ============================================================
-- V33__saas_subscriptions_and_billing.sql
-- SaaS Platform Migration: Subscription Plans, Restaurant Subscriptions & Payments
-- ============================================================

-- 1. SUBSCRIPTION PLANS TABLE
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'UZS',
    billing_period VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    trial_days INT NOT NULL DEFAULT 0,
    max_users INT DEFAULT 10,
    max_tables INT DEFAULT 30,
    max_products INT DEFAULT 200,
    max_kitchens INT DEFAULT 2,
    max_orders_per_month INT DEFAULT 5000,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_price ON subscription_plans(price);

-- 2. RESTAURANT SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS restaurant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(30) NOT NULL DEFAULT 'TRIAL', -- TRIAL, ACTIVE, EXPIRED, CANCELLED, SUSPENDED, PENDING_PAYMENT
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_subs_tenant ON restaurant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_subs_status ON restaurant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_subs_end_date ON restaurant_subscriptions(end_date);

-- 3. SUBSCRIPTION PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES restaurant_subscriptions(id) ON DELETE SET NULL,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'UZS',
    provider VARCHAR(30) NOT NULL DEFAULT 'MOCK', -- MOCK, CLICK, PAYME, UZUM
    provider_transaction_id VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, FAILED, CANCELLED, REFUNDED
    paid_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_payments_tenant ON subscription_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sub_payments_status ON subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_sub_payments_tx ON subscription_payments(provider_transaction_id);

-- 4. SEED INITIAL SUBSCRIPTION PLANS
INSERT INTO subscription_plans (
    id, code, name, description, price, currency, billing_period, trial_days, 
    max_users, max_tables, max_products, max_kitchens, max_orders_per_month, features, is_active
) VALUES 
(
    'c0000000-0000-0000-0000-000000000001',
    'TRIAL',
    '14-Kunlik Sinov (Trial)',
    'Yangi restoranlar uchun to‘liq funksional 14 kunlik bepul sinov davri',
    0.00,
    'UZS',
    'MONTHLY',
    14,
    15,
    35,
    300,
    2,
    3000,
    '["TABLE_MAP", "KITCHEN_MANAGEMENT", "BASIC_REPORTS", "ORDER_MANAGEMENT"]'::jsonb,
    TRUE
),
(
    'c0000000-0000-0000-0000-000000000002',
    'STARTER',
    'Starter Tarifi',
    'Kichik kafe va tez ovqatlanish shoxobchalari uchun qulay boshlang‘ich tarif',
    99000.00,
    'UZS',
    'MONTHLY',
    0,
    10,
    25,
    200,
    1,
    2000,
    '["TABLE_MAP", "BASIC_REPORTS", "ORDER_MANAGEMENT", "RECEIPT_PRINTING"]'::jsonb,
    TRUE
),
(
    'c0000000-0000-0000-0000-000000000003',
    'BUSINESS',
    'Business Tarifi',
    'O‘rta va yirik restoranlar, ko‘p zalli milliy taomlar maskanlari uchun eng ommabop tarif',
    249000.00,
    'UZS',
    'MONTHLY',
    0,
    30,
    80,
    1000,
    3,
    10000,
    '["TABLE_MAP", "KITCHEN_MANAGEMENT", "ADVANCED_REPORTS", "ORDER_MANAGEMENT", "PRINTER_ROUTING", "DISCOUNTS"]'::jsonb,
    TRUE
),
(
    'c0000000-0000-0000-0000-000000000004',
    'PRO',
    'Pro Korporativ',
    'Cheksiz imkoniyatlar, yirik tarmoqlar va premium restoranlar uchun to‘liq paket',
    499000.00,
    'UZS',
    'MONTHLY',
    0,
    999999,
    999999,
    999999,
    999999,
    999999,
    '["TABLE_MAP", "KITCHEN_MANAGEMENT", "ADVANCED_REPORTS", "ORDER_MANAGEMENT", "PRINTER_ROUTING", "DISCOUNTS", "PRIORITY_SUPPORT", "API_ACCESS"]'::jsonb,
    TRUE
)
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    max_users = EXCLUDED.max_users,
    max_tables = EXCLUDED.max_tables,
    max_products = EXCLUDED.max_products,
    features = EXCLUDED.features,
    is_active = TRUE;

-- 5. SEED SUBSCRIPTIONS FOR EXISTING TENANTS (ENSURE ZERO DISRUPTION)
-- Demo Restaurant (DEMO001) -> 1 Year Active Business Plan
INSERT INTO restaurant_subscriptions (
    id, tenant_id, plan_id, status, start_date, end_date, auto_renew
) VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000003',
    'ACTIVE',
    NOW(),
    NOW() + INTERVAL '365 days',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Samarqand & Toshkent test tenants if exist
INSERT INTO restaurant_subscriptions (
    tenant_id, plan_id, status, start_date, end_date, auto_renew
)
SELECT t.id, 'c0000000-0000-0000-0000-000000000003'::uuid, 'ACTIVE', NOW(), NOW() + INTERVAL '365 days', TRUE
FROM tenants t
WHERE t.id != 'a0000000-0000-0000-0000-000000000001'
  AND NOT EXISTS (SELECT 1 FROM restaurant_subscriptions rs WHERE rs.tenant_id = t.id);
