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
    get isLowStock(): boolean;
    get isCriticalStock(): boolean;
    get isOutOfStock(): boolean;
    get isExpiringSoon(): boolean;
    get isExpired(): boolean;
}
//# sourceMappingURL=InventoryItem.d.ts.map