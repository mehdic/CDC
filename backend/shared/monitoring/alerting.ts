import axios from 'axios';
import { logger } from './logger';

const SERVICE_NAME = process.env.SERVICE_NAME || 'metapharm-api';
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const PAGERDUTY_INTEGRATION_KEY = process.env.PAGERDUTY_INTEGRATION_KEY || '';
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || '';

export interface AlertConfig {
  name: string;
  description: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  service: string;
  environment: string;
  metric?: string;
  threshold?: number;
  currentValue?: number;
}

/**
 * Send alert to PagerDuty
 */
export async function sendPagerDutyAlert(
  alert: AlertConfig,
  dedupKey?: string
) {
  if (!PAGERDUTY_INTEGRATION_KEY) {
    logger.warn('PagerDuty integration key not configured');
    return;
  }

  if (ENVIRONMENT !== 'production' && alert.severity !== 'critical') {
    logger.debug('Skipping non-critical PagerDuty alert in non-production', {
      alert: alert.name,
    });
    return;
  }

  try {
    const payload = {
      routing_key: PAGERDUTY_INTEGRATION_KEY,
      event_action: alert.severity === 'critical' ? 'trigger' : 'trigger',
      dedup_key: dedupKey || `${SERVICE_NAME}-${alert.name}-${Date.now()}`,
      payload: {
        summary: `[${alert.severity.toUpperCase()}] ${alert.name}`,
        severity: alert.severity === 'critical' ? 'critical' : 'error',
        source: SERVICE_NAME,
        component: SERVICE_NAME,
        custom_details: {
          description: alert.description,
          service: alert.service,
          environment: alert.environment,
          ...(alert.metric && { metric: alert.metric }),
          ...(alert.currentValue !== undefined && { current_value: alert.currentValue }),
          ...(alert.threshold !== undefined && { threshold: alert.threshold }),
          timestamp: new Date().toISOString(),
        },
      },
    };

    await axios.post('https://events.pagerduty.com/v2/enqueue', payload);
    logger.info('PagerDuty alert sent', {
      alert: alert.name,
      severity: alert.severity,
    });
  } catch (error) {
    logger.error('Failed to send PagerDuty alert', {
      error: (error as Error).message,
      alert: alert.name,
    });
  }
}

/**
 * Send alert to Slack
 */
export async function sendSlackAlert(alert: AlertConfig) {
  if (!SLACK_WEBHOOK_URL) {
    logger.warn('Slack webhook URL not configured');
    return;
  }

  try {
    const severityColor = {
      critical: '#FF0000',
      error: '#FF6B6B',
      warning: '#FFA500',
      info: '#0099FF',
    }[alert.severity];

    const severityEmoji = {
      critical: ':fire:',
      error: ':x:',
      warning: ':warning:',
      info: ':information_source:',
    }[alert.severity];

    const payload = {
      text: `${severityEmoji} ${alert.severity.toUpperCase()}: ${alert.name}`,
      attachments: [
        {
          color: severityColor,
          fields: [
            {
              title: 'Description',
              value: alert.description,
              short: false,
            },
            {
              title: 'Service',
              value: alert.service,
              short: true,
            },
            {
              title: 'Environment',
              value: alert.environment,
              short: true,
            },
            ...(alert.metric ? [
              {
                title: 'Metric',
                value: alert.metric,
                short: true,
              },
            ] : []),
            ...(alert.currentValue !== undefined ? [
              {
                title: 'Current Value',
                value: String(alert.currentValue),
                short: true,
              },
            ] : []),
            ...(alert.threshold !== undefined ? [
              {
                title: 'Threshold',
                value: String(alert.threshold),
                short: true,
              },
            ] : []),
          ],
          footer: 'MetaPharm Alert System',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    await axios.post(SLACK_WEBHOOK_URL, payload);
    logger.info('Slack alert sent', {
      alert: alert.name,
      severity: alert.severity,
    });
  } catch (error) {
    logger.error('Failed to send Slack alert', {
      error: (error as Error).message,
      alert: alert.name,
    });
  }
}

/**
 * Send alert to both PagerDuty and Slack
 */
export async function sendAlert(alert: AlertConfig, dedupKey?: string) {
  // Send to Slack always
  await sendSlackAlert(alert);

  // Send to PagerDuty only for critical issues
  if (alert.severity === 'critical') {
    await sendPagerDutyAlert(alert, dedupKey);
  }
}

/**
 * Alert definitions with thresholds
 */
export interface AlertDefinition {
  name: string;
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity: 'critical' | 'error' | 'warning';
  checkInterval: number; // milliseconds
}

export const DEFAULT_ALERT_DEFINITIONS: AlertDefinition[] = [
  {
    name: 'High API Latency',
    metric: 'http_request_duration_seconds',
    operator: 'gt',
    threshold: 2,
    severity: 'warning',
    checkInterval: 60000,
  },
  {
    name: 'High Error Rate',
    metric: 'http_requests_total_errors',
    operator: 'gt',
    threshold: 0.05, // 5%
    severity: 'error',
    checkInterval: 60000,
  },
  {
    name: 'Database Connection Pool Exhausted',
    metric: 'db_connections_active',
    operator: 'gte',
    threshold: 95, // 95% of max connections
    severity: 'critical',
    checkInterval: 30000,
  },
  {
    name: 'Cache Hit Rate Low',
    metric: 'cache_hit_rate',
    operator: 'lt',
    threshold: 0.5, // Below 50%
    severity: 'warning',
    checkInterval: 120000,
  },
  {
    name: 'Memory Usage Critical',
    metric: 'process_heap_used_bytes',
    operator: 'gt',
    threshold: 0.9, // 90% of heap
    severity: 'critical',
    checkInterval: 30000,
  },
  {
    name: 'Delivery Service Availability Low',
    metric: 'service_availability',
    operator: 'lt',
    threshold: 0.95, // Below 95%
    severity: 'error',
    checkInterval: 120000,
  },
];

/**
 * Check if value triggers alert
 */
export function checkAlertCondition(
  value: number,
  definition: AlertDefinition
): boolean {
  switch (definition.operator) {
    case 'gt':
      return value > definition.threshold;
    case 'lt':
      return value < definition.threshold;
    case 'gte':
      return value >= definition.threshold;
    case 'lte':
      return value <= definition.threshold;
    case 'eq':
      return value === definition.threshold;
    default:
      return false;
  }
}

/**
 * Alert manager for tracking active alerts
 */
export class AlertManager {
  private activeAlerts: Map<string, { timestamp: number; dedupKey: string }> = new Map();
  private alertCooldown = 300000; // 5 minutes cooldown between same alerts

  async checkAndAlert(definition: AlertDefinition, currentValue: number) {
    if (!checkAlertCondition(currentValue, definition)) {
      // Clear active alert if condition is no longer met
      this.activeAlerts.delete(definition.name);
      return;
    }

    const lastAlert = this.activeAlerts.get(definition.name);
    const now = Date.now();

    // Don't send duplicate alerts within cooldown period
    if (lastAlert && now - lastAlert.timestamp < this.alertCooldown) {
      return;
    }

    const dedupKey = lastAlert?.dedupKey || definition.name;

    await sendAlert(
      {
        name: definition.name,
        description: `${definition.metric} exceeded threshold (current: ${currentValue}, threshold: ${definition.threshold})`,
        severity: definition.severity,
        service: SERVICE_NAME,
        environment: ENVIRONMENT,
        metric: definition.metric,
        threshold: definition.threshold,
        currentValue,
      },
      dedupKey
    );

    this.activeAlerts.set(definition.name, {
      timestamp: now,
      dedupKey,
    });
  }

  getActiveAlerts(): string[] {
    return Array.from(this.activeAlerts.keys());
  }

  clearAlert(alertName: string) {
    this.activeAlerts.delete(alertName);
  }

  clearAllAlerts() {
    this.activeAlerts.clear();
  }
}

// Global alert manager instance
export const alertManager = new AlertManager();
