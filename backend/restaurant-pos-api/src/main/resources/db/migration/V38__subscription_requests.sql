-- ============================================================
-- V38__subscription_requests.sql
-- B2B Manual Subscription Request & Super Admin Approval Engine
-- ============================================================

CREATE TABLE IF NOT EXISTS subscription_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    requested_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    billing_period VARCHAR(20) NOT NULL,
    duration_months INT NOT NULL DEFAULT 1,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'UZS',
    
    payment_method VARCHAR(50) NOT NULL,
    receipt_url TEXT,
    client_notes TEXT,
    
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL',
    
    reviewed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    admin_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_req_tenant ON subscription_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sub_req_status ON subscription_requests(status);
CREATE INDEX IF NOT EXISTS idx_sub_req_created ON subscription_requests(created_at DESC);
