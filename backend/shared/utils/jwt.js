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
exports.TokenType = void 0;
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.generateTokenPair = generateTokenPair;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.decodeTokenUnsafe = decodeTokenUnsafe;
exports.extractTokenFromHeader = extractTokenFromHeader;
exports.isTokenExpired = isTokenExpired;
exports.getTokenTimeRemaining = getTokenTimeRemaining;
exports.refreshAccessToken = refreshAccessToken;
exports.hasValidTokenStructure = hasValidTokenStructure;
exports.sanitizeTokenForLogging = sanitizeTokenForLogging;
const jwt = __importStar(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-this-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
if (JWT_SECRET === 'your-jwt-secret-key-change-this-in-production') {
    console.warn('WARNING: Using default JWT_SECRET. Set JWT_SECRET environment variable in production!');
}
if (JWT_REFRESH_SECRET === 'your-refresh-token-secret-change-this') {
    console.warn('WARNING: Using default JWT_REFRESH_SECRET. Set JWT_REFRESH_SECRET environment variable in production!');
}
var TokenType;
(function (TokenType) {
    TokenType["ACCESS"] = "access";
    TokenType["REFRESH"] = "refresh";
})(TokenType || (exports.TokenType = TokenType = {}));
function generateAccessToken(userId, email, role, pharmacyId) {
    const payload = {
        userId,
        email,
        role,
        pharmacyId,
        type: TokenType.ACCESS,
    };
    try {
        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
            issuer: 'metapharm-connect',
            audience: 'metapharm-api',
        });
        return token;
    }
    catch (error) {
        console.error('Access token generation failed:', error);
        throw new Error('Failed to generate access token');
    }
}
function generateRefreshToken(userId, email, role, pharmacyId) {
    const payload = {
        userId,
        email,
        role,
        pharmacyId,
        type: TokenType.REFRESH,
    };
    try {
        const token = jwt.sign(payload, JWT_REFRESH_SECRET, {
            expiresIn: REFRESH_TOKEN_EXPIRES_IN,
            issuer: 'metapharm-connect',
            audience: 'metapharm-api',
        });
        return token;
    }
    catch (error) {
        console.error('Refresh token generation failed:', error);
        throw new Error('Failed to generate refresh token');
    }
}
function generateTokenPair(userId, email, role, pharmacyId) {
    const accessToken = generateAccessToken(userId, email, role, pharmacyId);
    const refreshToken = generateRefreshToken(userId, email, role, pharmacyId);
    const expiresIn = parseExpiryToSeconds(JWT_EXPIRES_IN);
    return {
        accessToken,
        refreshToken,
        expiresIn,
    };
}
function verifyAccessToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: 'metapharm-connect',
            audience: 'metapharm-api',
        });
        if (decoded.type !== TokenType.ACCESS) {
            throw new Error('Invalid token type: expected access token');
        }
        return decoded;
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Access token expired');
        }
        else if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid access token');
        }
        else {
            throw new Error(`Token verification failed: ${error.message}`);
        }
    }
}
function verifyRefreshToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
            issuer: 'metapharm-connect',
            audience: 'metapharm-api',
        });
        if (decoded.type !== TokenType.REFRESH) {
            throw new Error('Invalid token type: expected refresh token');
        }
        return decoded;
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Refresh token expired');
        }
        else if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid refresh token');
        }
        else {
            throw new Error(`Token verification failed: ${error.message}`);
        }
    }
}
function decodeTokenUnsafe(token) {
    try {
        const decoded = jwt.decode(token);
        return decoded;
    }
    catch (error) {
        return null;
    }
}
function extractTokenFromHeader(authHeader) {
    if (!authHeader) {
        return null;
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1];
}
function isTokenExpired(token) {
    const decoded = decodeTokenUnsafe(token);
    if (!decoded || !decoded.exp) {
        return true;
    }
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
}
function getTokenTimeRemaining(token) {
    const decoded = decodeTokenUnsafe(token);
    if (!decoded || !decoded.exp) {
        return 0;
    }
    const now = Math.floor(Date.now() / 1000);
    const remaining = decoded.exp - now;
    return Math.max(0, remaining);
}
function parseExpiryToSeconds(expiry) {
    const units = {
        s: 1,
        m: 60,
        h: 3600,
        d: 86400,
    };
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
        return 3600;
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    return value * (units[unit] || 1);
}
function refreshAccessToken(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);
    return generateTokenPair(decoded.userId, decoded.email, decoded.role, decoded.pharmacyId);
}
function hasValidTokenStructure(token) {
    if (!token || typeof token !== 'string') {
        return false;
    }
    const parts = token.split('.');
    if (parts.length !== 3) {
        return false;
    }
    const base64UrlPattern = /^[A-Za-z0-9_-]+$/;
    return parts.every(part => base64UrlPattern.test(part));
}
function sanitizeTokenForLogging(token) {
    if (!token)
        return '[no token]';
    if (token.length < 20)
        return '[invalid token]';
    return `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
}
//# sourceMappingURL=jwt.js.map