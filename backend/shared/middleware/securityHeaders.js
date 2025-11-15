"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureCORS = configureCORS;
exports.configureCSP = configureCSP;
exports.configureSecurityHeaders = configureSecurityHeaders;
exports.addCustomSecurityHeaders = addCustomSecurityHeaders;
exports.getSecurityMiddleware = getSecurityMiddleware;
exports.strictCSPForAuth = strictCSPForAuth;
exports.cspForFileUpload = cspForFileUpload;
exports.cspForTeleconsultation = cspForTeleconsultation;
exports.strictCORSForAuth = strictCORSForAuth;
exports.logSecurityHeadersConfig = logSecurityHeadersConfig;
exports.isAllowedOrigin = isAllowedOrigin;
exports.generateCSPNonce = generateCSPNonce;
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const security_1 = require("../config/security");
function configureCORS() {
    const config = (0, security_1.getCORSConfig)();
    return (0, cors_1.default)({
        origin: config.origin,
        credentials: config.credentials,
        optionsSuccessStatus: config.optionsSuccessStatus,
        allowedHeaders: config.allowedHeaders,
        exposedHeaders: config.exposedHeaders,
        maxAge: config.maxAge,
    });
}
function configureCSP() {
    const config = (0, security_1.getCSPConfig)();
    return helmet_1.default.contentSecurityPolicy({
        directives: config.directives,
        reportOnly: config.reportOnly,
    });
}
function configureSecurityHeaders() {
    const config = (0, security_1.getSecurityHeadersConfig)();
    return (0, helmet_1.default)({
        hsts: config.hsts.enabled
            ? {
                maxAge: config.hsts.maxAge,
                includeSubDomains: config.hsts.includeSubDomains,
                preload: config.hsts.preload,
            }
            : false,
        frameguard: {
            action: config.xFrameOptions.toLowerCase(),
        },
        noSniff: true,
        xssFilter: true,
        referrerPolicy: {
            policy: config.referrerPolicy,
        },
        permittedCrossDomainPolicies: {
            permittedPolicies: 'none',
        },
        hidePoweredBy: true,
        dnsPrefetchControl: {
            allow: false,
        },
        expectCt: (0, security_1.isProduction)()
            ? {
                maxAge: 86400,
                enforce: true,
            }
            : false,
    });
}
function addCustomSecurityHeaders(req, res, next) {
    const config = (0, security_1.getSecurityHeadersConfig)();
    const permissionsPolicy = Object.entries(config.permissionsPolicy)
        .map(([feature, allowlist]) => {
        const allowString = allowlist.join(' ');
        return `${feature}=(${allowString})`;
    })
        .join(', ');
    res.setHeader('Permissions-Policy', permissionsPolicy);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', config.xFrameOptions);
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    if (!(0, security_1.isProduction)()) {
        const version = process.env.API_VERSION || 'v1';
        res.setHeader('X-API-Version', version);
    }
    next();
}
function getSecurityMiddleware() {
    return [
        configureCORS(),
        configureSecurityHeaders(),
        configureCSP(),
        addCustomSecurityHeaders,
    ];
}
function strictCSPForAuth(req, res, next) {
    res.setHeader('Content-Security-Policy', "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self'; " +
        "img-src 'self' data:; " +
        "font-src 'self'; " +
        "object-src 'none'; " +
        "frame-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'");
    next();
}
function cspForFileUpload(req, res, next) {
    res.setHeader('Content-Security-Policy', "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob:; " +
        "font-src 'self'; " +
        "object-src 'none'; " +
        "frame-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'");
    next();
}
function cspForTeleconsultation(req, res, next) {
    const twilioVideoDomain = process.env.TWILIO_VIDEO_DOMAIN || 'video.twilio.com';
    res.setHeader('Content-Security-Policy', `default-src 'self'; ` +
        `script-src 'self' https://${twilioVideoDomain}; ` +
        `style-src 'self' 'unsafe-inline'; ` +
        `img-src 'self' data: https:; ` +
        `media-src 'self' blob: https://${twilioVideoDomain}; ` +
        `connect-src 'self' https://${twilioVideoDomain} wss://${twilioVideoDomain}; ` +
        `font-src 'self'; ` +
        `object-src 'none'; ` +
        `frame-src 'none'; ` +
        `base-uri 'self'`);
    next();
}
function strictCORSForAuth(req, res, next) {
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    else {
        res.status(403).json({
            error: 'Forbidden',
            message: 'Origin not allowed',
            code: 'ORIGIN_NOT_ALLOWED',
        });
        return;
    }
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    next();
}
function logSecurityHeadersConfig() {
    const corsConfig = (0, security_1.getCORSConfig)();
    const cspConfig = (0, security_1.getCSPConfig)();
    const headersConfig = (0, security_1.getSecurityHeadersConfig)();
    console.log('🔒 Security Headers Configuration:');
    console.log('CORS:', {
        credentials: corsConfig.credentials,
        maxAge: corsConfig.maxAge,
    });
    console.log('CSP:', {
        reportOnly: cspConfig.reportOnly,
        directiveCount: Object.keys(cspConfig.directives).length,
    });
    console.log('HSTS:', headersConfig.hsts);
    console.log('X-Frame-Options:', headersConfig.xFrameOptions);
}
function isAllowedOrigin(req) {
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
    const origin = req.headers.origin;
    if (!origin) {
        return true;
    }
    return allowedOrigins.includes(origin);
}
function generateCSPNonce() {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('base64');
}
//# sourceMappingURL=securityHeaders.js.map