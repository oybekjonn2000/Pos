-- ============================================================
-- V29__remove_delivery_module.sql
-- Yetkazib berish (Delivery) moduliga tegishli barcha jadvallar
-- va orders jadvalidagi delivery ustunlarini butunlay olib tashlash
-- ============================================================

-- 1. Yetkazib berishga oid barcha jadvallarni o'chirish
DROP TABLE IF EXISTS delivery_integration_logs CASCADE;
DROP TABLE IF EXISTS delivery_webhook_events CASCADE;
DROP TABLE IF EXISTS delivery_category_mappings CASCADE;
DROP TABLE IF EXISTS delivery_product_mappings CASCADE;
DROP TABLE IF EXISTS delivery_order_items CASCADE;
DROP TABLE IF EXISTS delivery_orders CASCADE;
DROP TABLE IF EXISTS delivery_providers CASCADE;

-- 2. Orders jadvalidan yetkazib berishga tegishli ustunlarni o'chirish
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_address;
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_phone;
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_notes;
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_fee;
ALTER TABLE orders DROP COLUMN IF EXISTS courier_id;
