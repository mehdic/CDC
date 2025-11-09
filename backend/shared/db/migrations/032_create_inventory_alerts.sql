-- Migration: Create inventory_alerts table
-- Purpose: Low stock and expiration alerts with AI-powered reorder suggestions
-- Based on: /specs/002-metapharm-platform/data-model.md
-- User Story: US3 - Real-Time Inventory Management with QR Traceability

-- Create inventory_alerts table
CREATE TABLE inventory_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),

    -- Alert
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('low_stock', 'expiring_soon', 'expired', 'reorder_suggested')),
    severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,

    -- AI Recommendation
    ai_suggested_action TEXT,  -- "Reorder 500 units based on 30-day demand forecast"
    ai_suggested_quantity INTEGER,

    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    acknowledged_by_user_id UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- Enable Row-Level Security for multi-tenant isolation
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access alerts for their pharmacy
CREATE POLICY pharmacy_isolation_policy ON inventory_alerts
    USING (pharmacy_id = current_setting('app.current_pharmacy_id', true)::UUID);

-- Indexes for performance
CREATE INDEX idx_inventory_alerts_pharmacy ON inventory_alerts(pharmacy_id);
CREATE INDEX idx_inventory_alerts_status ON inventory_alerts(status) WHERE status = 'active';
CREATE INDEX idx_inventory_alerts_severity ON inventory_alerts(severity) WHERE status = 'active';
CREATE INDEX idx_inventory_alerts_type ON inventory_alerts(alert_type) WHERE status = 'active';
CREATE INDEX idx_inventory_alerts_item ON inventory_alerts(inventory_item_id);

-- Comments for documentation
COMMENT ON TABLE inventory_alerts IS 'AI-powered alerts for low stock, expiring medications, and reorder suggestions';
COMMENT ON COLUMN inventory_alerts.alert_type IS 'Type of alert: low_stock (below threshold), expiring_soon (within 60 days), expired, reorder_suggested (AI-driven)';
COMMENT ON COLUMN inventory_alerts.severity IS 'Alert priority: low, medium, high, critical';
COMMENT ON COLUMN inventory_alerts.ai_suggested_action IS 'Human-readable AI recommendation (e.g., "Reorder 500 units based on 30-day demand")';
COMMENT ON COLUMN inventory_alerts.ai_suggested_quantity IS 'AI-calculated optimal reorder quantity from AWS Forecast';
COMMENT ON COLUMN inventory_alerts.status IS 'Alert lifecycle: active (needs attention), acknowledged (seen), resolved (action taken), dismissed (ignored)';
