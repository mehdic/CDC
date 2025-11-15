"use strict";
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
let redisClient = null;
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
async function closeSessionRedis() {
    if (redisClient && redisClient.isOpen) {
        await redisClient.quit();
        redisClient = null;
        console.log('✓ Redis session store disconnected');
    }
}
function generateSessionId() {
    const config = (0, security_1.getSessionConfig)();
    return crypto.randomBytes(config.sessionIdLength).toString('hex');
}
async function createSession(userId, userRole, metadata) {
    const config = (0, security_1.getSessionConfig)();
    const client = await getRedisClient();
    const existingSessions = await getUserSessions(userId);
    if (existingSessions.length >= config.maxConcurrentSessions) {
        const oldestSession = existingSessions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
        await destroySession(oldestSession.sessionId);
    }
    const sessionId = generateSessionId();
    const sessionLifetimeMs = getSessionLifetimeForRole(userRole);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + sessionLifetimeMs);
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
    const ttlSeconds = Math.floor(sessionLifetimeMs / 1000);
    await client.setEx(`session:${sessionId}`, ttlSeconds, JSON.stringify(session));
    await client.sAdd(`user_sessions:${userId}`, sessionId);
    await client.expire(`user_sessions:${userId}`, ttlSeconds);
    console.log('Session created', {
        sessionId,
        userId,
        userRole,
        expiresAt,
    });
    return session;
}
function getSessionLifetimeForRole(userRole) {
    const config = (0, security_1.getSessionConfig)();
    switch (userRole) {
        case 'PHARMACIST':
        case 'DOCTOR':
        case 'NURSE':
            return config.maxAge;
        case 'PATIENT':
            return 1800000;
        case 'DELIVERY':
            return 14400000;
        default:
            return config.maxAge;
    }
}
async function getSession(sessionId) {
    const client = await getRedisClient();
    const data = await client.get(`session:${sessionId}`);
    if (!data) {
        return null;
    }
    const session = JSON.parse(data);
    session.createdAt = new Date(session.createdAt);
    session.lastActivityAt = new Date(session.lastActivityAt);
    session.expiresAt = new Date(session.expiresAt);
    if (session.expiresAt < new Date()) {
        await destroySession(sessionId);
        return null;
    }
    return session;
}
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
            await client.sRem(`user_sessions:${userId}`, sessionId);
        }
    }
    return sessions;
}
async function updateSessionActivity(sessionId, activity) {
    const session = await getSession(sessionId);
    if (!session) {
        return null;
    }
    const client = await getRedisClient();
    session.lastActivityAt = new Date();
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
    }
    const ttlSeconds = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);
    if (ttlSeconds > 0) {
        await client.setEx(`session:${sessionId}`, ttlSeconds, JSON.stringify(session));
    }
    return session;
}
async function renewSession(sessionId) {
    const session = await getSession(sessionId);
    if (!session) {
        return null;
    }
    await destroySession(sessionId);
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
async function destroySession(sessionId) {
    const session = await getSession(sessionId);
    if (!session) {
        return false;
    }
    const client = await getRedisClient();
    await client.del(`session:${sessionId}`);
    await client.sRem(`user_sessions:${session.userId}`, sessionId);
    console.log('Session destroyed', {
        sessionId,
        userId: session.userId,
    });
    return true;
}
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
function detectSuspiciousActivity(session, newActivity) {
    if (session.ipAddress !== newActivity.ipAddress) {
        return true;
    }
    if (session.userAgent !== newActivity.userAgent) {
        return true;
    }
    return false;
}
function detectGeolocationJump(oldLocation, newLocation, timeDeltaMs) {
    const distanceKm = calculateDistance(oldLocation.latitude, oldLocation.longitude, newLocation.latitude, newLocation.longitude);
    const maxPossibleDistanceKm = (timeDeltaMs / 1000 / 60 / 60) * 1000;
    return distanceKm > maxPossibleDistanceKm;
}
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
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
async function getSessionStatistics() {
    const client = await getRedisClient();
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