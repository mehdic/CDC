import { User } from './User';
export declare enum DeliveryStatus {
    PENDING = "pending",
    ASSIGNED = "assigned",
    IN_TRANSIT = "in_transit",
    DELIVERED = "delivered",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare class Delivery {
    id: string;
    user_id: string;
    user: User;
    order_id: string | null;
    delivery_personnel_id: string | null;
    delivery_personnel: User | null;
    status: DeliveryStatus;
    delivery_address_encrypted: Buffer;
    delivery_notes_encrypted: Buffer | null;
    tracking_info: Record<string, any> | null;
    tracking_number: string | null;
    scheduled_at: Date | null;
    picked_up_at: Date | null;
    delivered_at: Date | null;
    failed_at: Date | null;
    failure_reason: string | null;
    created_at: Date;
    updated_at: Date;
    isPending(): boolean;
    isAssigned(): boolean;
    isInTransit(): boolean;
    isDelivered(): boolean;
    isFailed(): boolean;
    isCancelled(): boolean;
    assign(deliveryPersonnelId: string): void;
    pickUp(): void;
    deliver(): void;
    fail(reason: string): void;
    cancel(): void;
}
//# sourceMappingURL=Delivery.d.ts.map