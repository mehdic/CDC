/**
 * Secure Session Management Service (T246)
 * Implements secure, distributed session management using Redis
 * Based on OWASP Session Management Cheat Sheet
 *
 * Features:
 * - Session storage in Redis with TTL
 * - Concurrent session limits (max 3 sessions per user)
 * - Session invalidation on logout
 * - Suspicious activity detection (geolocation jumps, unusual access patterns)
 * - Session renewal (prevents fixation attacks)
 * - Different session lifetimes per user role
 *
 * Security Features:
 * - Cryptographically secure session IDs
 * - HTTP-only, secure, SameSite cookies
 * - Session binding to IP and User-Agent (optional)
 * - Automatic session expiration
 * - Activity tracking for audit compliance
 */
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
/**
 * Close Redis connection
 */
export declare function closeSessionRedis(): Promise<void>;
/**
 * Create a new session
 *
 * @param userId User ID
 * @param userRole User role (determines session lifetime)
 * @param metadata Session metadata (IP, user agent, device info)
 * @returns Created session
 *
 * @example
 * ```typescript
 * // After successful login and MFA verification
 * const session = await createSession(user.id, user.role, {
 *   ipAddress: req.ip,
 *   userAgent: req.headers['user-agent'],
 *   deviceInfo: parseDeviceInfo(req.headers['user-agent']),
 *   pharmacyId: user.pharmacyId,
 *   mfaVerified: true,
 *   hinAuthenticated: user.hinAuthenticated
 * });
 *
 * // Set session cookie
 * res.cookie('sessionId', session.sessionId, {
 *   httpOnly: true,
 *   secure: true,
 *   sameSite: 'strict',
 *   maxAge: 7200000 // 2 hours
 * });
 * ```
 */
export declare function createSession(userId: string, userRole: 'PATIENT' | 'PHARMACIST' | 'DOCTOR' | 'NURSE' | 'DELIVERY', metadata: {
    ipAddress: string;
    userAgent: string;
    deviceInfo?: Session['deviceInfo'];
    pharmacyId?: string | null;
    mfaVerified: boolean;
    hinAuthenticated?: boolean;
}): Promise<Session>;
/**
 * Get session by ID
 *
 * @param sessionId Session ID
 * @returns Session object or null if not found/expired
 */
export declare function getSession(sessionId: string): Promise<Session | null>;
/**
 * Get all active sessions for a user
 *
 * @param userId User ID
 * @returns Array of active sessions
 */
export declare function getUserSessions(userId: string): Promise<Session[]>;
/**
 * Update session last activity
 * Call this on every authenticated request to keep session alive
 *
 * @param sessionId Session ID
 * @param activity Activity metadata
 * @returns Updated session
 */
export declare function updateSessionActivity(sessionId: string, activity: {
    ipAddress: string;
    userAgent: string;
}): Promise<Session | null>;
/**
 * Renew session (extend expiration)
 * Use this after sensitive operations to prevent session fixation
 *
 * @param sessionId Session ID
 * @returns New session ID (old session is destroyed)
 */
export declare function renewSession(sessionId: string): Promise<string | null>;
/**
 * Destroy a session (logout)
 *
 * @param sessionId Session ID
 * @returns True if session was destroyed
 */
export declare function destroySession(sessionId: string): Promise<boolean>;
/**
 * Destroy all sessions for a user
 * Use this when:
 * - User changes password
 * - User disables MFA
 * - Security breach detected
 *
 * @param userId User ID
 * @returns Number of sessions destroyed
 */
export declare function destroyAllUserSessions(userId: string): Promise<number>;
/**
 * Check for geolocation jump
 * Detects if user location changed impossibly fast
 *
 * @param oldLocation Previous location
 * @param newLocation New location
 * @param timeDeltaMs Time between activities (ms)
 * @returns True if geolocation jump detected
 */
export declare function detectGeolocationJump(oldLocation: {
    latitude: number;
    longitude: number;
}, newLocation: {
    latitude: number;
    longitude: number;
}, timeDeltaMs: number): boolean;
/**
 * Get session statistics for monitoring
 *
 * @returns Session statistics
 */
export declare function getSessionStatistics(): Promise<{
    totalSessions: number;
    sessionsByRole: Record<string, number>;
}>;
/**
 * Clean up expired sessions
 * This is handled automatically by Redis TTL, but this function can be used for manual cleanup
 *
 * @returns Number of sessions cleaned up
 */
export declare function cleanupExpiredSessions(): Promise<number>;
//# sourceMappingURL=sessionService.d.ts.map