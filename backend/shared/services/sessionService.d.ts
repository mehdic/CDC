export interface Session {
    sessionId: string;
    userId: string;
    userRole: 'PATIENT' | 'PHARMACIST' | 'DOCTOR' | 'NURSE' | 'DELIVERY';
    pharmacyId?: string | null;
    createdAt: Date;
    lastActivityAt: Date;
    expiresAt: Date;
    ipAddress: string;
    userAgent: string;
    deviceInfo?: {
        os?: string;
        browser?: string;
        platform?: string;
    };
    mfaVerified: boolean;
    hinAuthenticated?: boolean;
}
export interface SessionActivity {
    timestamp: Date;
    action: string;
    ipAddress: string;
    userAgent: string;
    location?: {
        country?: string;
        city?: string;
        latitude?: number;
        longitude?: number;
    };
}
export declare function closeSessionRedis(): Promise<void>;
export declare function createSession(userId: string, userRole: 'PATIENT' | 'PHARMACIST' | 'DOCTOR' | 'NURSE' | 'DELIVERY', metadata: {
    ipAddress: string;
    userAgent: string;
    deviceInfo?: Session['deviceInfo'];
    pharmacyId?: string | null;
    mfaVerified: boolean;
    hinAuthenticated?: boolean;
}): Promise<Session>;
export declare function getSession(sessionId: string): Promise<Session | null>;
export declare function getUserSessions(userId: string): Promise<Session[]>;
export declare function updateSessionActivity(sessionId: string, activity: {
    ipAddress: string;
    userAgent: string;
}): Promise<Session | null>;
export declare function renewSession(sessionId: string): Promise<string | null>;
export declare function destroySession(sessionId: string): Promise<boolean>;
export declare function destroyAllUserSessions(userId: string): Promise<number>;
export declare function detectGeolocationJump(oldLocation: {
    latitude: number;
    longitude: number;
}, newLocation: {
    latitude: number;
    longitude: number;
}, timeDeltaMs: number): boolean;
export declare function getSessionStatistics(): Promise<{
    totalSessions: number;
    sessionsByRole: Record<string, number>;
}>;
export declare function cleanupExpiredSessions(): Promise<number>;
//# sourceMappingURL=sessionService.d.ts.map