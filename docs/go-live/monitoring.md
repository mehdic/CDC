# Monitoring and Alerting Setup

**MetaPharm Connect - Production Monitoring Verification**

---

## Overview

This document verifies the monitoring and alerting infrastructure for MetaPharm Connect production environment. All systems must be verified before go-live.

---

## Table of Contents

1. [Monitoring Stack](#monitoring-stack)
2. [SLO Definitions](#slo-definitions)
3. [Alert Configuration](#alert-configuration)
4. [Dashboard Verification](#dashboard-verification)
5. [Success Metrics](#success-metrics)
6. [On-Call Procedures](#on-call-procedures)

---

## Monitoring Stack {#monitoring-stack}

### Components

| Component | Purpose | Endpoint | Status |
|-----------|---------|----------|--------|
| Prometheus | Metrics collection | http://prometheus:9090 | [ ] Verified |
| Grafana | Dashboards and visualization | https://grafana.metapharm-connect.ch | [ ] Verified |
| Sentry | Error tracking | https://sentry.io/metapharm | [ ] Verified |
| PagerDuty | Incident management | https://metapharm.pagerduty.com | [ ] Verified |
| CloudWatch | AWS logging | AWS Console | [ ] Verified |
| OpenTelemetry | Distributed tracing | http://jaeger:16686 | [ ] Verified |

### Verification Commands

```bash
# Verify Prometheus targets
curl -s http://prometheus:9090/api/v1/targets | jq '.data.activeTargets | length'

# Verify Grafana datasources
curl -s -u admin:password http://grafana:3000/api/datasources | jq '.[].name'

# Verify Sentry connectivity
curl -s https://sentry.io/api/0/ -H "Authorization: Bearer ${SENTRY_TOKEN}"

# Verify PagerDuty integration
curl -s https://api.pagerduty.com/services \
  -H "Authorization: Token token=${PAGERDUTY_TOKEN}" \
  -H "Content-Type: application/json" | jq '.services[].name'
```

---

## SLO Definitions {#slo-definitions}

### Availability SLO

| Service | Target | Measurement | Error Budget (30d) |
|---------|--------|-------------|-------------------|
| API Gateway | 99.9% | Successful requests / Total requests | 43 minutes |
| Web Application | 99.9% | Successful page loads / Total loads | 43 minutes |
| Authentication | 99.95% | Successful logins / Total attempts | 22 minutes |
| Teleconsultation | 99.5% | Successful sessions / Total sessions | 3.6 hours |
| Prescription Service | 99.9% | Successful operations / Total operations | 43 minutes |

### Latency SLO

| Service | P50 | P95 | P99 | Measurement Window |
|---------|-----|-----|-----|-------------------|
| API Gateway | < 50ms | < 200ms | < 500ms | 5 minutes |
| Web Page Load | < 1s | < 2s | < 3s | 5 minutes |
| Database Queries | < 10ms | < 50ms | < 100ms | 5 minutes |
| Search API | < 100ms | < 300ms | < 500ms | 5 minutes |
| File Upload | < 500ms | < 2s | < 5s | 5 minutes |

### Error Budget Policy

| Budget Consumed | Action | Owner |
|-----------------|--------|-------|
| 0-50% (Green) | Normal development velocity | Engineering |
| 50-80% (Yellow) | Prioritize reliability work | SRE + Engineering |
| 80-100% (Red) | Feature freeze, reliability only | SRE |
| >100% (Exhausted) | Code freeze, incident review | Leadership |

---

## Alert Configuration {#alert-configuration}

### Critical Alerts (Page Immediately)

| Alert Name | Condition | For | Severity |
|------------|-----------|-----|----------|
| HighErrorRateFastBurn | Error rate > 14.4 * (1 - 0.999) | 5m | Critical |
| ServiceDown | Health check failing | 2m | Critical |
| DatabaseConnectionExhausted | Active connections >= 95% | 2m | Critical |
| SSLCertificateExpiring | Cert expires < 7 days | 1h | Critical |
| SecurityIncident | Suspicious activity detected | Immediate | Critical |
| DataBreachIndicator | Unusual data access patterns | Immediate | Critical |

### Warning Alerts (Slack + Ticket)

| Alert Name | Condition | For | Severity |
|------------|-----------|-----|----------|
| HighErrorRateSlowBurn | Error rate > 1% | 30m | Warning |
| HighLatencyP99 | P99 > 500ms | 15m | Warning |
| MemoryUsageHigh | Memory > 90% | 10m | Warning |
| DiskUsageHigh | Disk > 85% | 15m | Warning |
| QueueBacklog | Queue depth > 1000 | 10m | Warning |
| CacheHitRateLow | Cache hit rate < 80% | 30m | Warning |

### Prometheus Alert Rules

```yaml
# File: prometheus/alerts/metapharm.yml
groups:
  - name: metapharm_slo_alerts
    interval: 30s
    rules:
      # Fast Burn - 5% budget in 1 hour
      - alert: HighErrorRateFastBurn
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[1h]))
            /
            sum(rate(http_requests_total[1h]))
          ) > 0.05
        for: 5m
        labels:
          severity: critical
          team: sre
        annotations:
          summary: "High error rate detected (fast burn)"
          description: "Error rate is {{ $value | humanizePercentage }}. 5% of 30-day budget consumed in 1 hour."
          runbook_url: "https://docs.metapharm-connect.ch/runbooks/high-error-rate"

      # Slow Burn - 10% budget in 6 hours
      - alert: HighErrorRateSlowBurn
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[6h]))
            /
            sum(rate(http_requests_total[6h]))
          ) > 0.01
        for: 30m
        labels:
          severity: warning
          team: sre
        annotations:
          summary: "Elevated error rate detected (slow burn)"
          description: "Error rate is {{ $value | humanizePercentage }}. Budget burning slowly."

      # Service Down
      - alert: ServiceDown
        expr: up{job="metapharm-api"} == 0
        for: 2m
        labels:
          severity: critical
          team: sre
        annotations:
          summary: "Service {{ $labels.instance }} is down"
          description: "Health check failing for 2 minutes."
          runbook_url: "https://docs.metapharm-connect.ch/runbooks/service-down"

      # Database Connections
      - alert: DatabaseConnectionExhausted
        expr: pg_stat_activity_count >= 95
        for: 2m
        labels:
          severity: critical
          team: sre
        annotations:
          summary: "Database connection pool near exhaustion"
          description: "{{ $value }} active connections. Pool limit: 100."
          runbook_url: "https://docs.metapharm-connect.ch/runbooks/db-connections"

      # High Latency
      - alert: HighLatencyP99
        expr: |
          histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
          > 0.5
        for: 15m
        labels:
          severity: warning
          team: sre
        annotations:
          summary: "P99 latency above threshold"
          description: "P99 latency is {{ $value | humanizeDuration }}. Target: 500ms."
```

### PagerDuty Integration

```yaml
# Alertmanager configuration
receivers:
  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: ${PAGERDUTY_SERVICE_KEY}
        severity: critical
        description: '{{ .CommonAnnotations.summary }}'
        details:
          firing: '{{ .Alerts.Firing | len }}'
          resolved: '{{ .Alerts.Resolved | len }}'

  - name: 'slack-warnings'
    slack_configs:
      - api_url: ${SLACK_WEBHOOK_URL}
        channel: '#alerts-metapharm'
        title: '{{ .CommonAnnotations.summary }}'
        text: '{{ .CommonAnnotations.description }}'

route:
  receiver: 'slack-warnings'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      repeat_interval: 15m
    - match:
        severity: warning
      receiver: 'slack-warnings'
      repeat_interval: 4h
```

---

## Dashboard Verification {#dashboard-verification}

### Required Dashboards

| Dashboard | Purpose | Panels | Status |
|-----------|---------|--------|--------|
| Overview | High-level system health | SLO status, traffic, errors | [ ] Verified |
| API Performance | Request latency and throughput | Latency histograms, RPS | [ ] Verified |
| Database | PostgreSQL metrics | Connections, queries, locks | [ ] Verified |
| Redis | Cache metrics | Memory, hit rate, connections | [ ] Verified |
| Business Metrics | Business KPIs | Orders, consultations, users | [ ] Verified |
| Error Budget | SLO burn rate tracking | Budget remaining, burn rate | [ ] Verified |
| Security | Security events | Auth failures, suspicious activity | [ ] Verified |

### Key Dashboard Panels

#### Overview Dashboard
- [ ] Request rate (RPS)
- [ ] Error rate (%)
- [ ] P50/P95/P99 latency
- [ ] Active users
- [ ] Uptime indicator
- [ ] Error budget remaining

#### SLO Dashboard
- [ ] 30-day availability SLO
- [ ] Error budget burn rate
- [ ] Budget consumption trend
- [ ] Incident impact on SLO

#### Business Dashboard
- [ ] Orders per hour
- [ ] Prescriptions processed
- [ ] Teleconsultations completed
- [ ] Active pharmacies
- [ ] User registrations

---

## Success Metrics {#success-metrics}

### Launch Day Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Availability | > 99.9% | Uptime monitoring |
| Error Rate | < 0.1% | Prometheus |
| P99 Latency | < 500ms | Prometheus |
| Page Load Time | < 3s | Core Web Vitals |
| User Signups | > 0 | Business metrics |
| Zero Critical Incidents | 0 | PagerDuty |

### Week 1 Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Availability | > 99.9% | SLO dashboard |
| Error Budget Consumed | < 10% | Error budget tracker |
| User Retention | > 50% | Analytics |
| Support Tickets | < 50 | Support system |
| NPS Score | > 50 | User surveys |

### Month 1 Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Availability | > 99.9% | 30-day SLO |
| Active Pharmacies | > 10 | Business metrics |
| Active Patients | > 100 | Business metrics |
| Prescriptions Processed | > 500 | Business metrics |
| Teleconsultations | > 50 | Business metrics |

---

## On-Call Procedures {#on-call-procedures}

### On-Call Rotation

| Week | Primary | Secondary | Escalation |
|------|---------|-----------|------------|
| Week 1 | [SRE 1] | [SRE 2] | [Engineering Lead] |
| Week 2 | [SRE 2] | [SRE 1] | [Engineering Lead] |
| Week 3 | [SRE 1] | [SRE 2] | [Engineering Lead] |
| Week 4 | [SRE 2] | [SRE 1] | [Engineering Lead] |

### Response Time SLA

| Severity | Acknowledgment | Resolution Start | Escalation |
|----------|----------------|------------------|------------|
| Critical (P1) | 5 minutes | 15 minutes | 30 minutes |
| High (P2) | 15 minutes | 1 hour | 2 hours |
| Medium (P3) | 1 hour | 4 hours | Next business day |
| Low (P4) | 4 hours | Next business day | N/A |

### On-Call Toolkit

```bash
# Quick diagnostic commands
alias mc-health='curl -s https://api.metapharm-connect.ch/health | jq .'
alias mc-pods='kubectl get pods -n metapharm'
alias mc-logs='kubectl logs -f deployment/api-gateway -n metapharm --tail=100'
alias mc-errors='kubectl logs deployment/api-gateway -n metapharm --since=1h | grep ERROR'
alias mc-metrics='curl -s http://prometheus:9090/api/v1/query?query=up'

# Dashboard URLs
GRAFANA_URL="https://grafana.metapharm-connect.ch/d/metapharm-overview"
SENTRY_URL="https://sentry.io/metapharm/issues/"
PAGERDUTY_URL="https://metapharm.pagerduty.com/incidents"
```

### Incident Response Checklist

1. **Acknowledge** alert in PagerDuty
2. **Assess** severity and impact
3. **Communicate** in #incidents Slack channel
4. **Diagnose** using dashboards and logs
5. **Mitigate** (rollback if needed)
6. **Resolve** root cause
7. **Document** in incident report
8. **Review** in post-mortem

---

## Verification Checklist

### Pre-Launch Verification

- [ ] Prometheus scraping all targets
- [ ] All Grafana dashboards loading
- [ ] Alert rules deployed and active
- [ ] PagerDuty receiving test alerts
- [ ] Slack notifications working
- [ ] On-call schedule configured
- [ ] Runbooks accessible
- [ ] SLO baselines established

### Post-Launch Verification

- [ ] All SLOs tracking correctly
- [ ] Error budget calculating accurately
- [ ] Alerts firing as expected (test)
- [ ] Dashboards showing production data
- [ ] Log aggregation working
- [ ] Traces visible in Jaeger

---

*This document should be reviewed quarterly and updated after any monitoring changes.*
