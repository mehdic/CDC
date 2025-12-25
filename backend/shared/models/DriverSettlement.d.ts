/**
 * Driver Settlement Entity
 * Tracks daily driver COD collection settlements
 * Used for driver accountability and financial reconciliation
 */
import { User } from './User';
export declare enum SettlementStatus {
    PENDING = "pending",
    APPROVED = "approved",
    DISPUTED = "disputed",
    RESOLVED = "resolved"
}
export declare class DriverSettlement {
    id: string;
    driver_id: string;
    driver: User;
    settlement_date: Date;
    total_expected: number;
    total_collected: number;
    total_settled: number;
    variance: number;
    transaction_count: number;
    cash_amount: number;
    card_amount: number;
    status: SettlementStatus;
    driver_notes: string | null;
    manager_notes: string | null;
    approved_by: string | null;
    approved_at: Date | null;
    resolved_by: string | null;
    resolved_at: Date | null;
    metadata: Record<string, any> | null;
    created_at: Date;
    updated_at: Date;
    /**
     * Calculate variance
     */
    calculateVariance(): void;
    /**
     * Approve settlement
     */
    approve(approvedBy: string, managerNotes?: string): void;
    /**
     * Dispute settlement
     */
    dispute(disputedBy: string, reason: string): void;
    /**
     * Resolve dispute
     */
    resolve(resolvedBy: string, resolution: string): void;
    /**
     * Check if has deficit
     */
    hasDeficit(): boolean;
    /**
     * Check if has surplus
     */
    hasSurplus(): boolean;
    /**
     * Check if variance exceeds threshold (business rule: CHF 50)
     */
    requiresManagerApproval(): boolean;
    /**
     * Get variance percentage
     */
    getVariancePercentage(): number;
    /**
     * Check if pending
     */
    isPending(): boolean;
    /**
     * Check if approved
     */
    isApproved(): boolean;
    /**
     * Check if disputed
     */
    isDisputed(): boolean;
    /**
     * Get settlement summary for driver dashboard
     */
    getSummary(): {
        date: Date;
        transactions: number;
        expected: number;
        collected: number;
        variance: number;
        status: SettlementStatus;
    };
}
//# sourceMappingURL=DriverSettlement.d.ts.map