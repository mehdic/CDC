import { Pharmacy } from './Pharmacy';
import { InventoryItem } from './InventoryItem';
import { User } from './User';
export declare enum AlertType {
    LOW_STOCK = "low_stock",
    EXPIRING_SOON = "expiring_soon",
    EXPIRED = "expired",
    REORDER_SUGGESTED = "reorder_suggested"
}
export declare enum AlertSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum AlertStatus {
    ACTIVE = "active",
    ACKNOWLEDGED = "acknowledged",
    RESOLVED = "resolved",
    DISMISSED = "dismissed"
}
export declare class InventoryAlert {
    id: string;
    pharmacy_id: string;
    pharmacy: Pharmacy;
    inventory_item_id: string;
    inventory_item: InventoryItem;
    alert_type: AlertType;
    severity: AlertSeverity;
    message: string;
    ai_suggested_action: string | null;
    ai_suggested_quantity: number | null;
    status: AlertStatus;
    acknowledged_by_user_id: string | null;
    acknowledged_by_user: User | null;
    acknowledged_at: Date | null;
    created_at: Date;
    resolved_at: Date | null;
    get isActive(): boolean;
    get hasAiRecommendation(): boolean;
    get isHighPriority(): boolean;
    get ageInHours(): number;
}
//# sourceMappingURL=InventoryAlert.d.ts.map