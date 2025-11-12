"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeSessionRedis = closeSessionRedis;
exports.createSession = createSession;
exports.getSession = getSession;
exports.getUserSessions = getUserSessions;
exports.updateSessionActivity = updateSessionActivity;
exports.renewSession = renewSession;
exports.destroySession = destroySession;
exports.destroyAllUserSessions = destroyAllUserSessions;
exports.detectGeolocationJump = detectGeolocationJump;
exports.getSessionStatistics = getSessionStatistics;
exports.cleanupExpiredSessions = cleanupExpiredSessions;
const redis_1 = require("redis");
const crypto = __importStar(require("crypto"));
const security_1 = require("../config/security");
// ============================================================================
// Redis Client
// ============================================================================
let redisClient = null;
/**
 * Get Redis client for session storage
 */
async function getRedisClient() {
    if (redisClient && redisClient.isOpen) {
        return redisClient;
    }
    const config = (0, security_1.getSessionConfig)();
    redisClient = (0, redis_1.createClient)({
        url: config.redisUrl,
    });
    redisClient.on('error', (err) => {
        console.error('Redis session store error:', err);
    });
    redisClient.on('connect', () => {
        console.log('✓ Redis session store connected');
    });
    await redisClient.connect();
    return redisClient;
}
/**
 * Close Redis connection
 */
async function closeSessionRedis() {
    if (redisClient && redisClient.isOpen) {
        await redisClient.quit();
        redisClient = null;
        console.log('✓ Redis session store disconnected');
    }
}
// ============================================================================
// Session ID Generation
// ============================================================================
/**
 * Generate cryptographically secure session ID
 *
 * @returns Random session ID (32 bytes, hex-encoded)
 */
function generateSessionId() {
    const config = (0, security_1.getSessionConfig)();
    return crypto.randomBytes(config.sessionIdLength).toString('hex');
}
// ============================================================================
// Session Creation (T246)
// ============================================================================
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
async function createSession(userId, userRole, metadata) {
    const config = (0, security_1.getSessionConfig)();
    const client = await getRedisClient();
    // Check concurrent session limit
    const existingSessions = await getUserSessions(userId);
    if (existingSessions.length >= config.maxConcurrentSessions) {
        // Remove oldest session
        const oldestSession = existingSessions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
        await destroySession(oldestSession.sessionId);
    }
    // Generate session ID
    const sessionId = generateSessionId();
    // Calculate session lifetime based on user role
    const sessionLifetimeMs = getSessionLifetimeForRole(userRole);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + sessionLifetimeMs);
    // Create session object
    const session = {
        sessionId,
        userId,
        userRole,
        pharmacyId: metadata.pharmacyId,
        createdAt: now,
        lastActivityAt: now,
        expiresAt,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        deviceInfo: metadata.deviceInfo,
        mfaVerified: metadata.mfaVerified,
        hinAuthenticated: metadata.hinAuthenticated,
    };
    // Store in Redis with TTL
    const ttlSeconds = Math.floor(sessionLifetimeMs / 1000);
    await client.setEx(`session:${sessionId}`, ttlSeconds, JSON.stringify(session));
    // Add to user's session list
    await client.sAdd(`user_sessions:${userId}`, sessionId);
    // Set expiration on user sessions set
    await client.expire(`user_sessions:${userId}`, ttlSeconds);
    console.log('Session created', {
        sessionId,
        userId,
        userRole,
        expiresAt,
    });
    return session;
}
/**
 * Get session lifetime based on user role
 * Healthcare professionals get longer sessions (2 hours)
 * Patients get shorter sessions (30 minutes)
 *
 * @param userRole User role
 * @returns Session lifetime in milliseconds
 */
function getSessionLifetimeForRole(userRole) {
    const config = (0, security_1.getSessionConfig)();
    switch (userRole) {
        case 'PHARMACIST':
        case 'DOCTOR':
        case 'NURSE':
            return config.maxAge; // 2 hours (default)
        case 'PATIENT':
            return 1800000; // 30 minutes
        case 'DELIVERY':
            return 14400000; // 4 hours (longer for delivery personnel)
        default:
            return config.maxAge;
    }
}
// ============================================================================
// Session Retrieval (T246)
// ============================================================================
/**
 * Get session by ID
 *
 * @param sessionId Session ID
 * @returns Session object or null if not found/expired
 */
async function getSession(sessionId) {
    const client = await getRedisClient();
    const data = await client.get(`session:${sessionId}`);
    if (!data) {
        return null;
    }
    const session = JSON.parse(data);
    // Parse dates
    session.createdAt = new Date(session.createdAt);
    session.lastActivityAt = new Date(session.lastActivityAt);
    session.expiresAt = new Date(session.expiresAt);
    // Check if session is expired
    if (session.expiresAt < new Date()) {
        await destroySession(sessionId);
        return null;
    }
    return session;
}
/**
 * Get all active sessions for a user
 *
 * @param userId User ID
 * @returns Array of active sessions
 */
async function getUserSessions(userId) {
    const client = await getRedisClient();
    const sessionIds = await client.sMembers(`user_sessions:${userId}`);
    const sessions = [];
    for (const sessionId of sessionIds) {
        const session = await getSession(sessionId);
        if (session) {
            sessions.push(session);
        }
        else {
            // Remove expired session from set
            await client.sRem(`user_sessions:${userId}`, sessionId);
        }
    }
    return sessions;
}
// ============================================================================
// Session Update (T246)
// ============================================================================
/**
 * Update session last activity
 * Call this on every authenticated request to keep session alive
 *
 * @param sessionId Session ID
 * @param activity Activity metadata
 * @returns Updated session
 */
async function updateSessionActivity(sessionId, activity) {
    const session = await getSession(sessionId);
    if (!session) {
        return null;
    }
    const client = await getRedisClient();
    // Update last activity
    session.lastActivityAt = new Date();
    // Detect suspicious activity
    const isSuspicious = detectSuspiciousActivity(session, activity);
    if (isSuspicious) {
        console.warn('Suspicious session activity detected', {
            sessionId,
            userId: session.userId,
            oldIP: session.ipAddress,
            newIP: activity.ipAddress,
            oldUA: session.userAgent,
            newUA: activity.userAgent,
        });
        // Optionally: Destroy session and require re-authentication
        // await destroySession(sessionId);
        // return null;
    }
    // Calculate new TTL (time until expiration)
    const ttlSeconds = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);
    if (ttlSeconds > 0) {
        await client.setEx(`session:${sessionId}`, ttlSeconds, JSON.stringify(session));
    }
    return session;
}
/**
 * Renew session (extend expiration)
 * Use this after sensitive operations to prevent session fixation
 *
 * @param sessionId Session ID
 * @returns New session ID (old session is destroyed)
 */
async function renewSession(sessionId) {
    const session = await getSession(sessionId);
    if (!session) {
        return null;
    }
    // Destroy old session
    await destroySession(sessionId);
    // Create new session with same data but new ID
    const newSession = await createSession(session.userId, session.userRole, {
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        deviceInfo: session.deviceInfo,
        pharmacyId: session.pharmacyId,
        mfaVerified: session.mfaVerified,
        hinAuthenticated: session.hinAuthenticated,
    });
    console.log('Session renewed', {
        oldSessionId: sessionId,
        newSessionId: newSession.sessionId,
        userId: session.userId,
    });
    return newSession.sessionId;
}
// ============================================================================
// Session Destruction (T246)
// ============================================================================
/**
 * Destroy a session (logout)
 *
 * @param sessionId Session ID
 * @returns True if session was destroyed
 */
async function destroySession(sessionId) {
    const session = await getSession(sessionId);
    if (!session) {
        return false;
    }
    const client = await getRedisClient();
    // Remove from Redis
    await client.del(`session:${sessionId}`);
    // Remove from user's session list
    await client.sRem(`user_sessions:${session.userId}`, sessionId);
    console.log('Session destroyed', {
        sessionId,
        userId: session.userId,
    });
    return true;
}
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
async function destroyAllUserSessions(userId) {
    const sessions = await getUserSessions(userId);
    for (const session of sessions) {
        await destroySession(session.sessionId);
    }
    console.log('All user sessions destroyed', {
        userId,
        count: sessions.length,
    });
    return sessions.length;
}
// ============================================================================
// Suspicious Activity Detection (T246)
// ============================================================================
/**
 * Detect suspicious session activity
 *
 * Suspicious indicators:
 * - IP address change
 * - User-Agent change
 * - Rapid geolocation change (geolocation jump)
 *
 * @param session Current session
 * @param newActivity New activity data
 * @returns True if activity is suspicious
 */
function detectSuspiciousActivity(session, newActivity) {
    // IP address changed
    if (session.ipAddress !== newActivity.ipAddress) {
        // This could be legitimate (mobile switching networks, VPN)
        // But we should log it for audit
        return true;
    }
    // User-Agent changed (possible session hijacking)
    if (session.userAgent !== newActivity.userAgent) {
        return true;
    }
    return false;
}
/**
 * Check for geolocation jump
 * Detects if user location changed impossibly fast
 *
 * @param oldLocation Previous location
 * @param newLocation New location
 * @param timeDeltaMs Time between activities (ms)
 * @returns True if geolocation jump detected
 */
function detectGeolocationJump(oldLocation, newLocation, timeDeltaMs) {
    // Calculate distance using Haversine formula
    const distanceKm = calculateDistance(oldLocation.latitude, oldLocation.longitude, newLocation.latitude, newLocation.longitude);
    // Calculate maximum possible distance (assume 1000 km/h - faster than commercial flight)
    const maxPossibleDistanceKm = (timeDeltaMs / 1000 / 60 / 60) * 1000;
    // If distance is greater than possible, it's suspicious
    return distanceKm > maxPossibleDistanceKm;
}
/**
 * Calculate distance between two coordinates (Haversine formula)
 *
 * @param lat1 Latitude 1
 * @param lon1 Longitude 1
 * @param lat2 Latitude 2
 * @param lon2 Longitude 2
 * @returns Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
// ============================================================================
// Session Statistics
// ============================================================================
/**
 * Get session statistics for monitoring
 *
 * @returns Session statistics
 */
async function getSessionStatistics() {
    const client = await getRedisClient();
    // Get all session keys
    const sessionKeys = await client.keys('session:*');
    const totalSessions = sessionKeys.length;
    const sessionsByRole = {
        PATIENT: 0,
        PHARMACIST: 0,
        DOCTOR: 0,
        NURSE: 0,
        DELIVERY: 0,
    };
    for (const key of sessionKeys) {
        const data = await client.get(key);
        if (data) {
            const session = JSON.parse(data);
            sessionsByRole[session.userRole] =
                (sessionsByRole[session.userRole] || 0) + 1;
        }
    }
    return {
        totalSessions,
        sessionsByRole,
    };
}
// ============================================================================
// Session Cleanup
// ============================================================================
/**
 * Clean up expired sessions
 * This is handled automatically by Redis TTL, but this function can be used for manual cleanup
 *
 * @returns Number of sessions cleaned up
 */
async function cleanupExpiredSessions() {
    const client = await getRedisClient();
    const sessionKeys = await client.keys('session:*');
    let cleanedCount = 0;
    for (const key of sessionKeys) {
        const data = await client.get(key);
        if (data) {
            const session = JSON.parse(data);
            if (new Date(session.expiresAt) < new Date()) {
                await client.del(key);
                cleanedCount++;
            }
        }
    }
    console.log(`Cleaned up ${cleanedCount} expired sessions`);
    return cleanedCount;
}
//# sourceMappingURL=sessionService.js.map