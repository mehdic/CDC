/**
 * InventoryTransaction Entity
 * QR scan events for traceability (receive, dispense, transfer, adjustments)
 * Based on: /specs/002-metapharm-platform/data-model.md
 * User Story 3 (P3): Real-Time Inventory Management (FR-031 to FR-040)
 */
import { Pharmacy } from './Pharmacy';
import { InventoryItem } from './InventoryItem';
import { User } from './User';
export declare enum TransactionType {
    RECEIVE = "receive",// Incoming from supplier
    DISPENSE = "dispense",// Outgoing to patient (linked to prescription)
    TRANSFER = "transfer",// Transfer to another pharmacy location
    RETURN = "return",// Returned from patient
    ADJUSTMENT = "adjustment",// Manual stock adjustment
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
    /**
     * Check if this is an incoming transaction (positive quantity change)
     */
    get isIncoming(): boolean;
    /**
     * Check if this is an outgoing transaction (negative quantity change)
     */
    get isOutgoing(): boolean;
    /**
     * Check if transaction is linked to a prescription
     */
    get isLinkedToPrescription(): boolean;
}
//# sourceMappingURL=InventoryTransaction.d.ts.map