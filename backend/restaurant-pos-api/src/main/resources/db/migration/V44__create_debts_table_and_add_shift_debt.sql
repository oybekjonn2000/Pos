-- ============================================================================
-- V44: Create debts table and add total_debt_sales to shifts table
-- Supports Qarz (Debt / Nasiya) payment method for restaurant POS
-- ============================================================================

-- 1. Create debts table
CREATE TABLE IF NOT EXISTS debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    payment_id UUID NOT NULL REFERENCES payments(id),
    amount NUMERIC(15, 2) NOT NULL,
    remaining_amount NUMERIC(15, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    due_date DATE,
    notes TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- 2. Add performance indexes for debts
CREATE INDEX IF NOT EXISTS idx_debts_tenant_customer ON debts(tenant_id, customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_debts_order ON debts(order_id);
CREATE INDEX IF NOT EXISTS idx_debts_payment ON debts(payment_id);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(tenant_id, due_date) WHERE deleted_at IS NULL;

-- 3. Add total_debt_sales column to shifts table
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS total_debt_sales NUMERIC(15, 2) DEFAULT 0.00;
