-- ============================================================
-- V39__platform_payment_card_settings.sql
-- Super Admin Payment Card Settings for B2B Subscriptions
-- ============================================================

CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_card_number VARCHAR(50),
    payment_card_holder VARCHAR(150),
    payment_bank_name VARCHAR(150),
    payment_instructions TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default initial card settings if none exist
INSERT INTO platform_settings (id, payment_card_number, payment_card_holder, payment_bank_name, payment_instructions, updated_at)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    '8600 0000 0000 0000',
    'Platform Administrator',
    'Kapitalbank',
    'Iltimos, to''lov izohiga restoraningiz nomini yozing va to''lov chekini yuklang.',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM platform_settings);
