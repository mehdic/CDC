"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordDuration = recordDuration;
exports.getPerformanceStats = getPerformanceStats;
exports.trackDatabaseQuery = trackDatabaseQuery;
exports.getMemoryStats = getMemoryStats;
exports.checkForMemoryLeak = checkForMemoryLeak;
exports.performanceMonitor = performanceMonitor;
const logger_1 = require("../utils/logger");
const metrics_1 = require("../utils/metrics");
const SLOW_REQUEST_THRESHOLD = process.env.SLOW_REQUEST_THRESHOLD || 1000;
const SLOW_QUERY_THRESHOLD = process.env.SLOW_QUERY_THRESHOLD || 500;
const ENABLE_MEMORY_TRACKING = process.env.ENABLE_MEMORY_TRACKING !== 'false';
const requestDurations = [];
const MAX_SAMPLES = 1000;
function recordDuration(duration) {
    requestDurations.push(duration);
    if (requestDurations.length > MAX_SAMPLES) {
        requestDurations.shift();
    }
}
function calculatePercentile(samples, percentile) {
    if (samples.length === 0)
        return 0;
    const sorted = [...samples].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
}
function getPerformanceStats() {
    if (requestDurations.length === 0) {
        return { p50: 0, p95: 0, p99: 0, avg: 0, max: 0, min: 0 };
    }
    const sum = requestDurations.reduce((a, b) => a + b, 0);
    return {
        p50: calculatePercentile(requestDurations, 50),
        p95: calculatePercentile(requestDurations, 95),
        p99: calculatePercentile(requestDurations, 99),
        avg: Math.round(sum / requestDurations.length),
        max: Math.max(...requestDurations),
        min: Math.min(...requestDurations),
    };
}
function trackDatabaseQuery(query, duration) {
    const isSlowQuery = duration > SLOW_QUERY_THRESHOLD;
    const queryMetrics = {
        query: query.substring(0, 100),
        duration,
        isSlowQuery,
        timestamp: new Date().toISOString(),
    };
    if (isSlowQuery) {
        logger_1.logger.warn('Slow database query detected', {
            query: queryMetrics.query,
            duration,
            threshold: SLOW_QUERY_THRESHOLD,
        });
    }
    else {
        logger_1.logger.debug('Database query executed', {
            duration,
        });
    }
}
function getMemoryStats() {
    const mem = process.memoryUsage();
    return {
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        external: Math.round(mem.external / 1024 / 1024),
        heapUsedPercent: Math.round((mem.heapUsed / mem.heapTotal) * 100),
        rss: Math.round(mem.rss / 1024 / 1024),
    };
}
const heapHistory = [];
const HEAP_HISTORY_SIZE = 60;
function checkForMemoryLeak() {
    const currentHeap = process.memoryUsage().heapUsed;
    const now = Date.now();
    heapHistory.push({ timestamp: now, heapUsed: currentHeap });
    while (heapHistory.length > HEAP_HISTORY_SIZE) {
        heapHistory.shift();
    }
    if (heapHistory.length < 10) {
        return { isLeaking: false, growth: 0, growthPercent: 0 };
    }
    const recent10 = heapHistory.slice(-10);
    const oldest = recent10[0].heapUsed;
    const newest = recent10[recent10.length - 1].heapUsed;
    const growth = newest - oldest;
    const growthPercent = (growth / oldest) * 100;
    const isLeaking = growthPercent > 10;
    return {
        isLeaking,
        growth: Math.round(growth / 1024 / 1024),
        growthPercent: Math.round(growthPercent),
    };
}
function performanceMonitor(req, res, next) {
    const startTime = Date.now();
    const requestId = req.requestId || 'unknown';
    const originalJson = res.json;
    res.json = function (data) {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        recordDuration(duration);
        (0, metrics_1.recordRequestDuration)(req.method, req.path, duration, statusCode);
        const isSlowRequest = duration > SLOW_REQUEST_THRESHOLD;
        const metrics = {
            requestId,
            method: req.method,
            path: req.path,
            statusCode,
            duration,
            isSlowRequest,
            timestamp: new Date().toISOString(),
        };
        if (ENABLE_MEMORY_TRACKING) {
            const memStats = getMemoryStats();
            metrics.memory = {
                heapUsed: memStats.heapUsed,
                heapTotal: memStats.heapTotal,
                external: memStats.external,
            };
            const leakCheck = checkForMemoryLeak();
            if (leakCheck.isLeaking) {
                logger_1.logger.warn('Potential memory leak detected', {
                    growth: leakCheck.growth,
                    growthPercent: leakCheck.growthPercent,
                    currentHeap: memStats.heapUsed,
                });
            }
        }
        if (isSlowRequest) {
            (0, metrics_1.recordSlowRequest)(req.method, req.path, duration);
            logger_1.logger.warn('Slow request detected', {
                ...metrics,
                threshold: SLOW_REQUEST_THRESHOLD,
            });
        }
        else {
            logger_1.logger.debug('Request performance', {
                method: req.method,
                path: req.path,
                duration,
            });
        }
        return originalJson.call(this, data);
    };
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - startTime;
        recordDuration(duration);
        (0, metrics_1.recordRequestDuration)(req.method, req.path, duration, res.statusCode);
        const isSlowRequest = duration > SLOW_REQUEST_THRESHOLD;
        if (isSlowRequest) {
            (0, metrics_1.recordSlowRequest)(req.method, req.path, duration);
            logger_1.logger.warn('Slow request detected', {
                requestId,
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration,
                threshold: SLOW_REQUEST_THRESHOLD,
            });
        }
        return originalSend.call(this, data);
    };
    next();
}
exports.default = performanceMonitor;
//# sourceMappingURL=performanceMonitor.js.map