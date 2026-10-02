-- ============================================================================
-- V47: Add missing foreign key and high-frequency lookup indexes
-- Optimizes query performance, reporting, and cascade checks
-- ============================================================================

-- 1. Payments: cashier reporting and multi-tenant order payment lookup
CREATE INDEX IF NOT EXISTS idx_payments_cashier
    ON payments(cashier_id);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_order
    ON payments(tenant_id, order_id);

-- 2. Orders: cashier and customer joins
CREATE INDEX IF NOT EXISTS idx_orders_cashier
    ON orders(cashier_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_customer
    ON orders(customer_id) WHERE deleted_at IS NULL;

-- 3. Cancellation Receipts: table and user audit lookups
CREATE INDEX IF NOT EXISTS idx_cancellation_receipts_table
    ON cancellation_receipts(table_id);

CREATE INDEX IF NOT EXISTS idx_cancellation_receipts_user
    ON cancellation_receipts(cancelled_by);

-- 4. Kitchen Order Batch Items: tenant isolation and product cascade checks
CREATE INDEX IF NOT EXISTS idx_kitchen_batch_items_tenant
    ON kitchen_order_batch_items(tenant_id);

CREATE INDEX IF NOT EXISTS idx_kitchen_batch_items_product
    ON kitchen_order_batch_items(product_id);

-- 5. Restaurant Tables: current order lookup
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_current_order
    ON restaurant_tables(current_order_id) WHERE current_order_id IS NOT NULL;

-- 6. Debts: customer reference index
CREATE INDEX IF NOT EXISTS idx_debts_customer
    ON debts(customer_id) WHERE deleted_at IS NULL;

-- 7. Employee Kitchens: kitchen and employee lookups
CREATE INDEX IF NOT EXISTS idx_employee_kitchens_kitchen
    ON employee_kitchens(kitchen_id);

CREATE INDEX IF NOT EXISTS idx_employee_kitchens_employee
    ON employee_kitchens(employee_id);
