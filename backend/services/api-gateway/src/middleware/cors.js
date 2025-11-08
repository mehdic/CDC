"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsMiddleware = void 0;
exports.additionalCorsHeaders = additionalCorsHeaders;
const cors_1 = __importDefault(require("cors"));
const allowedOriginsString = process.env['ALLOWED_ORIGINS'] || 'http://localhost:3001,http://localhost:19006';
const allowedOrigins = allowedOriginsString.split(',').map(origin => origin.trim());
console.info('CORS Configuration:', {
    allowedOrigins,
    credentialsSupported: true,
});
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            console.warn('CORS: Origin not allowed', { origin });
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-Pharmacy-ID',
        'X-Request-ID',
    ],
    exposedHeaders: [
        'X-Request-ID',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
    ],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
};
exports.corsMiddleware = (0, cors_1.default)(corsOptions);
function additionalCorsHeaders(_req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    if (process.env['NODE_ENV'] === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
}
//# sourceMappingURL=cors.js.map