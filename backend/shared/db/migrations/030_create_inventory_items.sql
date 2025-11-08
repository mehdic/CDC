-- Migration: Create inventory_items table
-- Purpose: Medication stock tracking in pharmacies with QR traceability
-- Based on: /specs/002-metapharm-platform/data-model.md
-- User Story: US3 - Real-Time Inventory Management with QR Traceability

-- Create inventory_items table
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id),

    -- Medication
    medication_name VARCHAR(255) NOT NULL,
    medication_rxnorm_code VARCHAR(50),
    medication_gtin VARCHAR(50),  -- Global Trade Item Number (QR code)

    -- Stock
    quantity INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL,  -- "pills", "bottles", "boxes"
    reorder_threshold INTEGER,
    optimal_stock_level INTEGER,  -- AI-recommended based on demand

    -- Batch Info
    batch_number VARCHAR(100),
    expiry_date DATE,
    supplier_name VARCHAR(255),
    cost_per_unit DECIMAL(10, 2),

    -- Controlled Substance
    is_controlled BOOLEAN DEFAULT FALSE,
    substance_schedule VARCHAR(10),  -- I, II, III, IV, V (Swiss narcotics classification)

    -- Location
    storage_location VARCHAR(100),  -- Shelf/bin location
    requires_refrigeration BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_restocked_at TIMESTAMP
);

-- Enable Row-Level Security for multi-tenant isolation
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access inventory for their pharmacy
CREATE POLICY pharmacy_isolation_policy ON inventory_items
    USING (pharmacy_id = current_setting('app.current_pharmacy_id', true)::UUID);

-- Indexes for performance
CREATE INDEX idx_inventory_items_pharmacy ON inventory_items(pharmacy_id);
CREATE INDEX idx_inventory_items_medication ON inventory_items(medication_rxnorm_code);
CREATE INDEX idx_inventory_items_gtin ON inventory_items(medication_gtin);
CREATE INDEX idx_inventory_items_low_stock ON inventory_items(pharmacy_id, quantity) WHERE quantity <= reorder_threshold;
CREATE INDEX idx_inventory_items_expiring ON inventory_items(expiry_date) WHERE expiry_date <= CURRENT_DATE + INTERVAL '60 days';

-- Comments for documentation
COMMENT ON TABLE inventory_items IS 'Medication stock tracking with QR traceability and AI-powered alerts';
COMMENT ON COLUMN inventory_items.medication_gtin IS 'Global Trade Item Number from GS1 QR code for scanning';
COMMENT ON COLUMN inventory_items.optimal_stock_level IS 'AI-recommended stock level based on AWS Forecast demand prediction';
COMMENT ON COLUMN inventory_items.is_controlled IS 'True for narcotics requiring enhanced audit trail (Swiss Narcotics Act compliance)';
COMMENT ON COLUMN inventory_items.substance_schedule IS 'Swiss narcotics classification: I (strictest) to V (least strict)';
COMMENT ON COLUMN inventory_items.requires_refrigeration IS 'Cold chain requirement flag for delivery routing prioritization';
