-- ========================================================
-- V27: KITCHEN ORDER BATCHES & ORDER ROUNDS ARCHITECTURE
-- Separates total order item quantities from kitchen dispatch batches.
-- Supports incremental kitchen rounds ("Qo'shimcha buyurtma")
-- ========================================================

-- 1. Create kitchen_order_batches table
CREATE TABLE IF NOT EXISTS kitchen_order_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    kitchen_id UUID REFERENCES kitchens(id) ON DELETE SET NULL,
    batch_number INT NOT NULL DEFAULT 1,
    batch_type VARCHAR(30) NOT NULL DEFAULT 'INITIAL', -- 'INITIAL', 'ADDON'
    status VARCHAR(30) NOT NULL DEFAULT 'NEW', -- 'NEW', 'ACCEPTED', 'COOKING', 'READY', 'SERVED', 'CANCELLED'
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    printed_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    served_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_kitchen_order_batches_order ON kitchen_order_batches(order_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_order_batches_kitchen ON kitchen_order_batches(kitchen_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_order_batches_tenant_status ON kitchen_order_batches(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_kitchen_order_batches_created_at ON kitchen_order_batches(created_at DESC);

-- 2. Create kitchen_order_batch_items table
CREATE TABLE IF NOT EXISTS kitchen_order_batch_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES kitchen_order_batches(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    quantity NUMERIC(10,3) NOT NULL,
    unit_price NUMERIC(15,2),
    status VARCHAR(30) NOT NULL DEFAULT 'NEW', -- 'NEW', 'ACCEPTED', 'COOKING', 'READY', 'SERVED', 'CANCELLED'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ready_at TIMESTAMPTZ,
    served_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_kitchen_batch_items_batch ON kitchen_order_batch_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_batch_items_order_item ON kitchen_order_batch_items(order_item_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_batch_items_status ON kitchen_order_batch_items(status);

-- 3. Historical data migration: Populate Batch #1 for existing active/sent orders
DO $$
DECLARE
    r_order RECORD;
    v_batch_id UUID;
    v_kitchen_id UUID;
BEGIN
    FOR r_order IN 
        SELECT DISTINCT o.id, o.tenant_id, o.waiter_id, o.created_at, o.sent_to_kitchen_at, o.notes, o.kitchen_notes
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE (oi.sent_quantity > 0 OR oi.kitchen_status NOT IN ('NEW'))
          AND NOT EXISTS (SELECT 1 FROM kitchen_order_batches kob WHERE kob.order_id = o.id)
    LOOP
        FOR v_kitchen_id IN
            SELECT DISTINCT oi.kitchen_id
            FROM order_items oi
            WHERE oi.order_id = r_order.id
              AND (oi.sent_quantity > 0 OR oi.kitchen_status NOT IN ('NEW'))
              AND oi.kitchen_id IS NOT NULL
        LOOP
            v_batch_id := uuid_generate_v4();
            INSERT INTO kitchen_order_batches (
                id, tenant_id, order_id, kitchen_id, batch_number, batch_type, status,
                notes, created_by, created_at, sent_at
            ) VALUES (
                v_batch_id, r_order.tenant_id, r_order.id, v_kitchen_id, 1, 'INITIAL', 'NEW',
                COALESCE(r_order.kitchen_notes, r_order.notes), r_order.waiter_id,
                COALESCE(r_order.sent_to_kitchen_at, r_order.created_at),
                COALESCE(r_order.sent_to_kitchen_at, r_order.created_at)
            );

            INSERT INTO kitchen_order_batch_items (
                id, tenant_id, batch_id, order_item_id, product_id, product_name,
                product_sku, quantity, unit_price, status, notes, created_at, updated_at
            )
            SELECT
                uuid_generate_v4(), r_order.tenant_id, v_batch_id, oi.id, oi.product_id,
                oi.product_name, oi.product_sku,
                CASE WHEN oi.sent_quantity > 0 THEN oi.sent_quantity ELSE oi.quantity END,
                oi.unit_price,
                CASE WHEN oi.kitchen_status IN ('READY', 'SERVED', 'DELIVERED') THEN 'READY'
                     WHEN oi.kitchen_status IN ('COOKING', 'PREPARING') THEN 'COOKING'
                     ELSE 'NEW' END,
                oi.notes,
                COALESCE(oi.sent_to_kitchen_at, oi.created_at),
                COALESCE(oi.sent_to_kitchen_at, oi.created_at)
            FROM order_items oi
            WHERE oi.order_id = r_order.id
              AND oi.kitchen_id = v_kitchen_id
              AND (oi.sent_quantity > 0 OR oi.kitchen_status NOT IN ('NEW'));
        END LOOP;
    END LOOP;
END $$;
