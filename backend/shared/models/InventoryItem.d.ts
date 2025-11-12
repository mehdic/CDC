/**
 * InventoryItem Entity
 * Medication stock tracking in pharmacies with QR traceability and AI-powered alerts
 * Based on: /specs/002-metapharm-platform/data-model.md
 * User Story 3 (P3): Real-Time Inventory Management (FR-031 to FR-040)
 */
import { Pharmacy } from './Pharmacy';
import { InventoryTransaction } from './InventoryTransaction';
import { InventoryAlert } from './InventoryAlert';
export declare class InventoryItem {
    id: string;
    pharmacy_id: string;
    pharmacy: Pharmacy;
    medication_name: string;
    medication_rxnorm_code: string | null;
    medication_gtin: string | null;
    quantity: number;
    unit: string;
    reorder_threshold: number | null;
    optimal_stock_level: number | null;
    batch_number: string | null;
    expiry_date: Date | null;
    supplier_name: string | null;
    cost_per_unit: number | null;
    is_controlled: boolean;
    substance_schedule: string | null;
    storage_location: string | null;
    requires_refrigeration: boolean;
    created_at: Date;
    updated_at: Date;
    last_restocked_at: Date | null;
    transactions: InventoryTransaction[];
    alerts: InventoryAlert[];
    /**
     * Check if item is low stock (quantity <= reorder_threshold)
     */
    get isLowStock(): boolean;
    /**
     * Check if item is critical stock (quantity <= reorder_threshold / 2)
     */
    get isCriticalStock(): boolean;
    /**
     * Check if item is out of stock
     */
    get isOutOfStock(): boolean;
    /**
     * Check if item is expiring soon (within 60 days)
     */
    get isExpiringSoon(): boolean;
    /**
     * Check if item is expired
     */
    get isExpired(): boolean;
}
//# sourceMappingURL=InventoryItem.d.ts.map