"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLoggerWithSkip = exports.requestLogger = void 0;
exports.logRequest = logRequest;
exports.logError = logError;
exports.shouldSkipLogging = shouldSkipLogging;
const morgan_1 = __importDefault(require("morgan"));
morgan_1.default.token('user-id', (req) => {
    return req.user?.userId || 'anonymous';
});
morgan_1.default.token('user-role', (req) => {
    return req.user?.role || 'none';
});
morgan_1.default.token('pharmacy-id', (req) => {
    return req.user?.pharmacyId || 'none';
});
morgan_1.default.token('request-id', (req) => {
    return req.headers['x-request-id'] || '-';
});
const devFormat = ':date[iso] :method :url :status :response-time ms - :user-id (:user-role)';
const productionFormat = JSON.stringify({
    timestamp: ':date[iso]',
    method: ':method',
    url: ':url',
    status: ':status',
    responseTime: ':response-time',
    userId: ':user-id',
    userRole: ':user-role',
    pharmacyId: ':pharmacy-id',
    requestId: ':request-id',
    ip: ':remote-addr',
    userAgent: ':user-agent',
});
exports.requestLogger = process.env['NODE_ENV'] === 'production'
    ? (0, morgan_1.default)(productionFormat)
    : (0, morgan_1.default)(devFormat);
function logRequest(req, message, metadata) {
    const user = req.user;
    console.info({
        message,
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        userId: user?.userId || 'anonymous',
        role: user?.role || 'none',
        pharmacyId: user?.pharmacyId || 'none',
        ip: req.ip,
        ...metadata,
    });
}
function logError(req, error, metadata) {
    const user = req.user;
    console.error({
        message: error.message,
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        userId: user?.userId || 'anonymous',
        role: user?.role || 'none',
        pharmacyId: user?.pharmacyId || 'none',
        ip: req.ip,
        stack: error.stack,
        ...metadata,
    });
}
function shouldSkipLogging(req, _res) {
    if (process.env['NODE_ENV'] === 'production' && req.path === '/health') {
        return true;
    }
    return false;
}
exports.requestLoggerWithSkip = (0, morgan_1.default)(process.env['NODE_ENV'] === 'production' ? productionFormat : devFormat, {
    skip: shouldSkipLogging,
});
//# sourceMappingURL=logger.js.map