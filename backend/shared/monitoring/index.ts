// Logger exports
export {
  logger,
  configureCloudWatchLogging,
  requestLoggingMiddleware,
  logWithContext,
  logInfo,
  logWarn,
  logError,
  logDebug,
} from './logger';

// Metrics exports
export {
  httpRequestDuration,
  httpRequestTotal,
  httpRequestSize,
  httpResponseSize,
  ordersCreatedTotal,
  ordersCompletedTotal,
  deliveriesCompletedTotal,
  consultationsStartedTotal,
  activeUsersGauge,
  inventoryLevelGauge,
  databaseConnectionsActive,
  databaseQueryDuration,
  databaseErrorsTotal,
  cacheHitsTotal,
  cacheMissesTotal,
  errorsTotal,
  metricsMiddleware,
  recordOrderCreated,
  recordOrderCompleted,
  recordDeliveryCompleted,
  recordConsultationStarted,
  updateActiveUsers,
  updateInventoryLevel,
  recordDatabaseQuery,
  recordDatabaseError,
  updateDatabaseConnections,
  recordCacheHit,
  recordCacheMiss,
  recordError,
  getMetrics,
  metricsEndpoint,
} from './metrics';

// Health check exports
export {
  HealthCheckResult,
  ReadinessCheckResult,
  performHealthCheck,
  performReadinessCheck,
  healthCheckEndpoint,
  readinessCheckEndpoint,
  livenessCheckEndpoint,
} from './health';

// Tracing exports
export {
  initializeTracing,
  shutdownTracing,
  getTracer,
  createSpan,
  tracingMiddleware,
  addSpanAttribute,
  addSpanEvent,
  recordException,
  addUserContext,
  addBusinessContext,
  traceDatabase,
  traceCache,
  traceExternalCall,
} from './tracing';

// Error tracking exports
export {
  initializeSentry,
  sentryRequestHandler,
  sentryErrorHandler,
  SilentError,
  captureException,
  captureMessage,
  setErrorTrackingUserContext,
  clearErrorTrackingUserContext,
  addErrorTrackingBreadcrumb,
  trackReleaseEvent,
  configureSourceMaps,
  errorHandlerMiddleware,
  setupUncaughtExceptionHandler,
  setupUnhandledRejectionHandler,
} from './errorTracking';

// Alerting exports
export {
  AlertConfig,
  AlertDefinition,
  DEFAULT_ALERT_DEFINITIONS,
  sendAlert,
  sendPagerDutyAlert,
  sendSlackAlert,
  checkAlertCondition,
  AlertManager,
  alertManager,
} from './alerting';
