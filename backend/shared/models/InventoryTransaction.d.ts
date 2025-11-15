import { Pharmacy } from './Pharmacy';
import { InventoryItem } from './InventoryItem';
import { User } from './User';
export declare enum TransactionType {
    RECEIVE = "receive",
    DISPENSE = "dispense",
    TRANSFER = "transfer",
    RETURN = "return",
    ADJUSTMENT = "adjustment",
    EXPIRED = "expired"
}
export declare class InventoryTransaction {
    id: string;
    pharmacy_id: string;
    pharmacy: Pharmacy;
    inventory_item_id: string;
    inventory_item: InventoryItem;
    transaction_type: TransactionType;
    quantity_change: number;
    quantity_after: number;
    prescription_id: string | null;
    user_id: string;
    user: User;
    qr_code_scanned: string | null;
    created_at: Date;
    notes: string | null;
    get isIncoming(): boolean;
    get isOutgoing(): boolean;
    get isLinkedToPrescription(): boolean;
}
//# sourceMappingURL=InventoryTransaction.d.ts.map