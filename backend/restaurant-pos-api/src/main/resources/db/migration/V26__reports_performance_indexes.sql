-- ============================================================
-- V26: REPORTS PERFORMANCE INDEXES
-- Optimizes sales, products, cashier, kitchen, and waiter report aggregations
-- ============================================================

-- 1. Orders: Paid at & closed at index for tenant report ranges
CREATE INDEX IF NOT EXISTS idx_orders_paid_at_reports
    ON orders(tenant_id, status, paid_at)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_closed_at_reports
    ON orders(tenant_id, status, closed_at)
    WHERE deleted_at IS NULL;

-- 2. Payments: Fast paid_at range and status lookup
CREATE INDEX IF NOT EXISTS idx_payments_tenant_status_paid
    ON payments(tenant_id, status, paid_at);

-- 3. Product Ingredients: Fast batch loading by product
CREATE INDEX IF NOT EXISTS idx_product_ingredients_product_id
    ON product_ingredients(product_id);
