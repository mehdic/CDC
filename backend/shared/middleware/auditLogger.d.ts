import { Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { AuthenticatedRequest } from './auth';
import { AuditAction } from '../models/AuditTrailEntry';
export declare enum ProtectedResourceType {
    PATIENT_RECORD = "patient_medical_record",
    PRESCRIPTION = "prescription",
    PRESCRIPTION_ITEM = "prescription_item",
    TELECONSULTATION = "teleconsultation",
    CONSULTATION_NOTE = "consultation_note",
    TREATMENT_PLAN = "treatment_plan",
    PATIENT_PROFILE = "patient_profile",
    MEDICAL_HISTORY = "medical_history",
    ALLERGY_RECORD = "allergy_record",
    DIAGNOSIS = "diagnosis",
    LAB_RESULT = "lab_result"
}
export declare function auditLog(dataSource: DataSource, resourceType: ProtectedResourceType, options?: {
    resourceIdParam?: string;
    eventTypePrefix?: string;
    captureRequestBody?: boolean;
    captureResponseBody?: boolean;
}): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare function autoAuditLog(dataSource: DataSource): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare function batchAuditLog(dataSource: DataSource, req: AuthenticatedRequest, resourceType: ProtectedResourceType, resourceIds: string[], action: AuditAction): Promise<void>;
export declare function getAuditLogsForResource(dataSource: DataSource, resourceType: string, resourceId: string, options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    action?: AuditAction;
    userId?: string;
}): Promise<import("typeorm").ObjectLiteral[]>;
export declare function getAuditLogsForUser(dataSource: DataSource, userId: string, options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    resourceType?: ProtectedResourceType;
}): Promise<import("typeorm").ObjectLiteral[]>;
export declare function generateHIPAAAuditReport(dataSource: DataSource, startDate: Date, endDate: Date): Promise<{
    period: {
        start: Date;
        end: Date;
    };
    summary: any[];
    totalEvents: any;
}>;
//# sourceMappingURL=auditLogger.d.ts.map