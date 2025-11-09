-- Migration: Create inventory_transactions table
-- Purpose: QR scan events for traceability (receive, dispense, transfer, adjustments)
-- Based on: /specs/002-metapharm-platform/data-model.md
-- User Story: US3 - Real-Time Inventory Management with QR Traceability

-- Create inventory_transactions table
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),

    -- Transaction
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'receive',    -- Incoming from supplier
        'dispense',   -- Outgoing to patient (linked to prescription)
        'transfer',   -- Transfer to another pharmacy location
        'return',     -- Returned from patient
        'adjustment', -- Manual stock adjustment
        'expired'     -- Expired medication disposal
    )),
    quantity_change INTEGER NOT NULL,  -- Positive for receive, negative for dispense
    quantity_after INTEGER NOT NULL,

    -- Links
    prescription_id UUID,  -- FK to prescriptions (added later, nullable for non-dispensing transactions)
    user_id UUID NOT NULL REFERENCES users(id),  -- Pharmacist performing action

    -- QR Code
    qr_code_scanned VARCHAR(255),  -- GTIN or internal QR

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    notes TEXT
);

-- Enable Row-Level Security for multi-tenant isolation
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access transactions for their pharmacy
CREATE POLICY pharmacy_isolation_policy ON inventory_transactions
    USING (pharmacy_id = current_setting('app.current_pharmacy_id', true)::UUID);

-- Indexes for performance
CREATE INDEX idx_inventory_transactions_pharmacy ON inventory_transactions(pharmacy_id);
CREATE INDEX idx_inventory_transactions_item ON inventory_transactions(inventory_item_id);
CREATE INDEX idx_inventory_transactions_prescription ON inventory_transactions(prescription_id) WHERE prescription_id IS NOT NULL;
CREATE INDEX idx_inventory_transactions_created ON inventory_transactions(created_at DESC);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(transaction_type);

-- Comments for documentation
COMMENT ON TABLE inventory_transactions IS 'Immutable audit trail of all inventory movements with QR scan traceability';
COMMENT ON COLUMN inventory_transactions.transaction_type IS 'Type of inventory movement: receive, dispense, transfer, return, adjustment, expired';
COMMENT ON COLUMN inventory_transactions.quantity_change IS 'Stock delta: positive for incoming (receive), negative for outgoing (dispense)';
COMMENT ON COLUMN inventory_transactions.quantity_after IS 'Snapshot of total quantity after this transaction for audit reconciliation';
COMMENT ON COLUMN inventory_transactions.qr_code_scanned IS 'Raw QR code data scanned (GS1 DataMatrix format)';
COMMENT ON COLUMN inventory_transactions.prescription_id IS 'Links dispensing transaction to prescription for controlled substance compliance';
