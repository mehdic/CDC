"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = authenticateJWT;
exports.optionalAuthenticateJWT = optionalAuthenticateJWT;
exports.requireMFA = requireMFA;
exports.requireHINAuth = requireHINAuth;
exports.requirePharmacyAffiliation = requirePharmacyAffiliation;
exports.getUserIdFromRequest = getUserIdFromRequest;
exports.getPharmacyIdFromRequest = getPharmacyIdFromRequest;
exports.isAuthenticated = isAuthenticated;
exports.getUserRoleFromRequest = getUserRoleFromRequest;
const jwt_1 = require("../utils/jwt");
function authenticateJWT(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = (0, jwt_1.extractTokenFromHeader)(authHeader);
        if (!token) {
            console.warn('Authentication failed: No token provided', {
                ip: req.ip,
                path: req.path,
                method: req.method,
            });
            res.status(401).json({
                error: 'Unauthorized',
                message: 'No authentication token provided',
                code: 'NO_TOKEN',
            });
            return;
        }
        let decoded;
        try {
            decoded = (0, jwt_1.verifyAccessToken)(token);
        }
        catch (error) {
            const errorMessage = error.message;
            console.warn('Authentication failed: Invalid token', {
                ip: req.ip,
                path: req.path,
                method: req.method,
                error: errorMessage,
                token: (0, jwt_1.sanitizeTokenForLogging)(token),
            });
            if (errorMessage.includes('expired')) {
                res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Access token expired. Please refresh your token.',
                    code: 'TOKEN_EXPIRED',
                });
                return;
            }
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid authentication token',
                code: 'INVALID_TOKEN',
            });
            return;
        }
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            pharmacyId: decoded.pharmacyId,
            tokenPayload: decoded,
        };
        console.info('Authentication successful', {
            userId: decoded.userId,
            role: decoded.role,
            ip: req.ip,
            path: req.path,
            method: req.method,
        });
        next();
    }
    catch (error) {
        console.error('Authentication middleware error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Authentication processing failed',
            code: 'AUTH_ERROR',
        });
    }
}
function optionalAuthenticateJWT(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = (0, jwt_1.extractTokenFromHeader)(authHeader);
        if (!token) {
            next();
            return;
        }
        try {
            const decoded = (0, jwt_1.verifyAccessToken)(token);
            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                pharmacyId: decoded.pharmacyId,
                tokenPayload: decoded,
            };
            console.info('Optional authentication successful', {
                userId: decoded.userId,
                role: decoded.role,
                ip: req.ip,
                path: req.path,
            });
        }
        catch (error) {
            console.warn('Optional authentication failed: Invalid token', {
                ip: req.ip,
                path: req.path,
                error: error.message,
            });
        }
        next();
    }
    catch (error) {
        console.error('Optional authentication middleware error:', error);
        next();
    }
}
function requireMFA(req, res, next) {
    if (!req.user) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
            code: 'NO_AUTH',
        });
        return;
    }
    const mfaVerified = req.user.tokenPayload.mfaVerified === true;
    if (!mfaVerified) {
        console.warn('MFA required but not verified', {
            userId: req.user.userId,
            role: req.user.role,
            ip: req.ip,
            path: req.path,
        });
        res.status(403).json({
            error: 'Forbidden',
            message: 'Multi-factor authentication required',
            code: 'MFA_REQUIRED',
        });
        return;
    }
    next();
}
function requireHINAuth(req, res, next) {
    if (!req.user) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
            code: 'NO_AUTH',
        });
        return;
    }
    const hinAuthenticated = req.user.tokenPayload.hinAuthenticated === true;
    if (!hinAuthenticated) {
        console.warn('HIN e-ID authentication required but not present', {
            userId: req.user.userId,
            role: req.user.role,
            ip: req.ip,
            path: req.path,
        });
        res.status(403).json({
            error: 'Forbidden',
            message: 'Swiss HIN e-ID authentication required',
            code: 'HIN_AUTH_REQUIRED',
        });
        return;
    }
    next();
}
function requirePharmacyAffiliation(req, res, next) {
    if (!req.user) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
            code: 'NO_AUTH',
        });
        return;
    }
    if (!req.user.pharmacyId) {
        console.warn('Pharmacy affiliation required but not present', {
            userId: req.user.userId,
            role: req.user.role,
            ip: req.ip,
            path: req.path,
        });
        res.status(403).json({
            error: 'Forbidden',
            message: 'Pharmacy affiliation required for this operation',
            code: 'NO_PHARMACY_AFFILIATION',
        });
        return;
    }
    next();
}
function getUserIdFromRequest(req) {
    return req.user?.userId || null;
}
function getPharmacyIdFromRequest(req) {
    return req.user?.pharmacyId || null;
}
function isAuthenticated(req) {
    return req.user !== undefined;
}
function getUserRoleFromRequest(req) {
    return req.user?.role || null;
}
//# sourceMappingURL=auth.js.map