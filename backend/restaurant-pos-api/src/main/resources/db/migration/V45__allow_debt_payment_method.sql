-- ============================================================
-- V45: Allow 'DEBT' payment method in payments table check constraint
-- ============================================================

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;

ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check
    CHECK (payment_method IN ('CASH', 'CARD', 'OTHER', 'MIXED', 'DEBT'));
