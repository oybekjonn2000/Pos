-- ============================================================
-- V35__standard_pro_trial_subscription_system.sql
-- Production SaaS Subscriptions: Standard (189 000 UZS), Pro (249 000 UZS), 
-- 15-Day Free Trial, Zero Resource Limits, Dynamic Database Features & Payment Provider Settings
-- ============================================================

-- 1. CREATE SUBSCRIPTION FEATURES CATALOG TABLE
CREATE TABLE IF NOT EXISTS subscription_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_features_code ON subscription_features(code);

-- Seed Features
INSERT INTO subscription_features (code, name, description)
VALUES
    ('POS_CORE', 'Asosiy POS Tizimi', 'Stollar, zallar, buyurtmalar, kassa va tolovlar moduli'),
    ('TABLES_HALLS', 'Stol va Zallar Boshqaruvi', 'Zallar, stollar xaritasi va interaktiv boshqaruv'),
    ('ORDERS', 'Buyurtmalar va Kassa', 'Buyurtma ochish, tolovlar, cheklar va kassa operatsiyalari'),
    ('KITCHEN_MANAGEMENT', 'Oshxonalar Boshqaruvi', 'Oshxona sexlarini yaratish, printer biriktirish va kategoriyalarni marshrutlash'),
    ('WAREHOUSE', 'Ombor va Mahsulotlar', 'Mahsulotlar katalogi, kategoriyalar, kirim-chiqim va qoldiqlar'),
    ('REPORTS', 'Hisobotlar va Analitika', 'Savdo statistikasi, P&L, ofitsiantlar va oshxonalar hisoboti'),
    ('PRINTERS', 'Printerlar va Marshrutlash', 'Kassa va oshxona printerlari, chek shablonlari'),
    ('EMPLOYEE_MANAGEMENT', 'Xodimlar va Rollar', 'Xodimlar, ofitsiantlar, oshpazlar va ruxsatnomalar boshqaruvi'),
    ('SETTINGS', 'Restoran Sozlamalari', 'Restoran profili, soliqlar, xizmat haqi va konfiguratsiyalar'),
    ('MOBILE_APP', 'Mobil Ofitsiant Ilovasi', 'Ofitsiantlar uchun qulay Android mobil ilova (APK) orqali buyurtma olish'),
    ('KITCHEN_DISPLAY', 'Oshxona Ekrani (KDS)', 'Oshpazlar uchun real-vaqt rejimida buyurtmalar ekrani va pishirish monitoringi')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 2. CREATE PLAN FEATURES MAPPING TABLE
CREATE TABLE IF NOT EXISTS plan_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES subscription_features(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_plan_feature UNIQUE (plan_id, feature_id)
);

CREATE INDEX IF NOT EXISTS idx_plan_feat_plan ON plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_feat_feature ON plan_features(feature_id);

-- 3. CREATE PAYMENT PROVIDER SETTINGS TABLE
CREATE TABLE IF NOT EXISTS payment_provider_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_code VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    is_test_mode BOOLEAN NOT NULL DEFAULT TRUE,
    merchant_id VARCHAR(255),
    api_key VARCHAR(255),
    secret_key VARCHAR(255),
    callback_url VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pay_prov_code ON payment_provider_settings(provider_code);

-- Seed Payment Providers
INSERT INTO payment_provider_settings (provider_code, display_name, is_enabled, is_test_mode, description)
VALUES
    ('MOCK', 'Mock Payment Gateway (Test To''lov)', TRUE, TRUE, 'Dasturchilar va test sinovlari uchun simulyatsiya to''lov shlyuzi'),
    ('PAYME', 'Payme Business Gateway', FALSE, TRUE, 'Payme orqali milliy kartalardan to''lov qabul qilish shlyuzi'),
    ('CLICK', 'Click Merchant API', FALSE, TRUE, 'Click orqali to''lovlarni qabul qilish integratsiyasi'),
    ('UZCARD', 'Uzcard Gateway', FALSE, TRUE, 'Uzcard to''g''ridan-to''g''ri to''lov shlyuzi'),
    ('HUMO', 'Humo Online Gateway', FALSE, TRUE, 'Humo to''g''ridan-to''g''ri to''lov shlyuzi')
ON CONFLICT (provider_code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 4. CREATE RESTAURANT RESOURCE USAGE TABLE
CREATE TABLE IF NOT EXISTS restaurant_resource_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    employees_count INT NOT NULL DEFAULT 0,
    waiters_count INT NOT NULL DEFAULT 0,
    chefs_count INT NOT NULL DEFAULT 0,
    products_count INT NOT NULL DEFAULT 0,
    categories_count INT NOT NULL DEFAULT 0,
    tables_count INT NOT NULL DEFAULT 0,
    halls_count INT NOT NULL DEFAULT 0,
    kitchens_count INT NOT NULL DEFAULT 0,
    orders_count INT NOT NULL DEFAULT 0,
    printers_count INT NOT NULL DEFAULT 0,
    users_count INT NOT NULL DEFAULT 0,
    devices_count INT NOT NULL DEFAULT 0,
    last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_res_usage_tenant ON restaurant_resource_usage(tenant_id);

-- 5. ENSURE EXACT 3 PLANS: TRIAL (15 kun), STANDARD (189 000 UZS), PRO (249 000 UZS) WITH ZERO LIMITS (-1)
-- Insert STANDARD plan if not existing
INSERT INTO subscription_plans (
    id, code, name, description, price, yearly_price, currency, billing_period,
    trial_enabled, trial_days, max_users, max_tables, max_products, max_kitchens,
    max_devices, max_branches, max_orders_per_month, features, is_active, is_archived, sort_order
) VALUES (
    'c0000000-0000-0000-0000-000000000010',
    'STANDARD',
    'Standard',
    'POS tizimining barcha asosiy funksiyalari (Stollar, Zallar, Kassa, Ombor, Hisobotlar, Oshxonalar boshqaruvi)',
    189000.00,
    1890000.00,
    'UZS',
    'MONTHLY',
    FALSE,
    0,
    -1, -1, -1, -1, -1, -1, -1,
    '["POS_CORE", "TABLES_HALLS", "ORDERS", "KITCHEN_MANAGEMENT", "WAREHOUSE", "REPORTS", "PRINTERS", "EMPLOYEE_MANAGEMENT", "SETTINGS"]'::jsonb,
    TRUE,
    FALSE,
    2
) ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = 189000.00,
    yearly_price = 1890000.00,
    trial_enabled = FALSE,
    trial_days = 0,
    max_users = -1,
    max_tables = -1,
    max_products = -1,
    max_kitchens = -1,
    max_devices = -1,
    max_branches = -1,
    max_orders_per_month = -1,
    features = '["POS_CORE", "TABLES_HALLS", "ORDERS", "KITCHEN_MANAGEMENT", "WAREHOUSE", "REPORTS", "PRINTERS", "EMPLOYEE_MANAGEMENT", "SETTINGS"]'::jsonb,
    is_active = TRUE,
    is_archived = FALSE,
    sort_order = 2;

-- Update TRIAL plan: 15 days, 0 UZS, exact same features as STANDARD, unlimited resources
UPDATE subscription_plans
SET
    name = '15 Kunlik Bepul Sinov',
    description = '15 kun davomida Standard tarifining barcha asosiy imkoniyatlaridan to''liq bepul foydalaning',
    price = 0.00,
    yearly_price = 0.00,
    currency = 'UZS',
    billing_period = 'MONTHLY',
    trial_enabled = TRUE,
    trial_days = 15,
    max_users = -1,
    max_tables = -1,
    max_products = -1,
    max_kitchens = -1,
    max_devices = -1,
    max_branches = -1,
    max_orders_per_month = -1,
    features = '["POS_CORE", "TABLES_HALLS", "ORDERS", "KITCHEN_MANAGEMENT", "WAREHOUSE", "REPORTS", "PRINTERS", "EMPLOYEE_MANAGEMENT", "SETTINGS"]'::jsonb,
    is_active = TRUE,
    is_archived = FALSE,
    sort_order = 1
WHERE code = 'TRIAL';

-- Update PRO plan: 249 000 UZS/month, 2 490 000 UZS/year, includes MOBILE_APP and KITCHEN_DISPLAY, unlimited resources
UPDATE subscription_plans
SET
    name = 'Pro',
    description = 'Standard tarifidagi barcha imkoniyatlar + Mobil ofitsiant ilovasi (APK) + Oshxona ekrani (KDS)',
    price = 249000.00,
    yearly_price = 2490000.00,
    currency = 'UZS',
    billing_period = 'MONTHLY',
    trial_enabled = FALSE,
    trial_days = 0,
    max_users = -1,
    max_tables = -1,
    max_products = -1,
    max_kitchens = -1,
    max_devices = -1,
    max_branches = -1,
    max_orders_per_month = -1,
    features = '["POS_CORE", "TABLES_HALLS", "ORDERS", "KITCHEN_MANAGEMENT", "WAREHOUSE", "REPORTS", "PRINTERS", "EMPLOYEE_MANAGEMENT", "SETTINGS", "MOBILE_APP", "KITCHEN_DISPLAY"]'::jsonb,
    is_active = TRUE,
    is_archived = FALSE,
    sort_order = 3
WHERE code = 'PRO';

-- Archive legacy test plans STARTER and BUSINESS
UPDATE subscription_plans
SET
    is_active = FALSE,
    is_archived = TRUE
WHERE code IN ('STARTER', 'BUSINESS');

-- Migrate existing subscriptions pointing to STARTER or BUSINESS to STANDARD
UPDATE restaurant_subscriptions
SET plan_id = (SELECT id FROM subscription_plans WHERE code = 'STANDARD')
WHERE plan_id IN (SELECT id FROM subscription_plans WHERE code IN ('STARTER', 'BUSINESS'));

-- 6. POPULATE plan_features RELATIONAL TABLE
-- Standard features (POS core only, NO MOBILE_APP, NO KITCHEN_DISPLAY)
INSERT INTO plan_features (plan_id, feature_id, is_enabled)
SELECT p.id, f.id, TRUE
FROM subscription_plans p
CROSS JOIN subscription_features f
WHERE p.code IN ('TRIAL', 'STANDARD')
  AND f.code NOT IN ('MOBILE_APP', 'KITCHEN_DISPLAY')
ON CONFLICT (plan_id, feature_id) DO UPDATE SET is_enabled = TRUE;

INSERT INTO plan_features (plan_id, feature_id, is_enabled)
SELECT p.id, f.id, FALSE
FROM subscription_plans p
CROSS JOIN subscription_features f
WHERE p.code IN ('TRIAL', 'STANDARD')
  AND f.code IN ('MOBILE_APP', 'KITCHEN_DISPLAY')
ON CONFLICT (plan_id, feature_id) DO UPDATE SET is_enabled = FALSE;

-- Pro features (ALL features enabled)
INSERT INTO plan_features (plan_id, feature_id, is_enabled)
SELECT p.id, f.id, TRUE
FROM subscription_plans p
CROSS JOIN subscription_features f
WHERE p.code = 'PRO'
ON CONFLICT (plan_id, feature_id) DO UPDATE SET is_enabled = TRUE;
