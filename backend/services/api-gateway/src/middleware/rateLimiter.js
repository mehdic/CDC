"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticatedLimiter = exports.authLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const RATE_LIMIT_WINDOW_MS = parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10);
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100', 10);
const AUTH_RATE_LIMIT_MAX_REQUESTS = parseInt(process.env['AUTH_RATE_LIMIT_MAX_REQUESTS'] || '5', 10);
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX_REQUESTS,
    message: {
        error: 'Too Many Requests',
        message: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        const whitelistedIPs = process.env['RATE_LIMIT_WHITELIST_IPS']?.split(',') || [];
        return whitelistedIPs.includes(req.ip || '');
    },
});
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: AUTH_RATE_LIMIT_MAX_REQUESTS,
    message: {
        error: 'Too Many Requests',
        message: 'Too many login attempts from this IP, please try again later.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
});
exports.authenticatedLimiter = (0, express_rate_limit_1.default)({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX_REQUESTS * 2,
    message: {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please slow down your requests.',
        code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.user?.userId || req.ip || 'unknown';
    },
});
//# sourceMappingURL=rateLimiter.js.map