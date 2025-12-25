# Post-Launch Monitoring Dashboard Specification

**MetaPharm Connect - Real-Time Operations Dashboard**

---

## Overview

This document specifies the post-launch monitoring dashboard for MetaPharm Connect. The dashboard provides real-time visibility into system health, business metrics, and SLO performance.

---

## Table of Contents

1. [Dashboard Architecture](#dashboard-architecture)
2. [Overview Dashboard](#overview-dashboard)
3. [SLO Dashboard](#slo-dashboard)
4. [Infrastructure Dashboard](#infrastructure-dashboard)
5. [Business Metrics Dashboard](#business-metrics-dashboard)
6. [Security Dashboard](#security-dashboard)
7. [Implementation Guide](#implementation-guide)

---

## Dashboard Architecture {#dashboard-architecture}

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Visualization | Grafana 10.x | Dashboard rendering |
| Metrics Store | Prometheus | Time-series metrics |
| Log Aggregation | CloudWatch Logs | Log storage and search |
| Tracing | Jaeger / OpenTelemetry | Distributed tracing |
| Alerting | Grafana Alerting + PagerDuty | Alert routing |

### Data Sources

```yaml
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    access: proxy
    isDefault: true

  - name: CloudWatch
    type: cloudwatch
    access: proxy
    jsonData:
      authType: default
      defaultRegion: eu-central-1

  - name: Jaeger
    type: jaeger
    url: http://jaeger:16686
    access: proxy

  - name: PostgreSQL
    type: postgres
    url: metapharm-prod-db.xxx.rds.amazonaws.com:5432
    database: metapharm
    user: readonly
```

### Dashboard Organization

```
MetaPharm Dashboards/
├── Overview          # High-level system health
├── SLO Performance   # SLO tracking and error budgets
├── Infrastructure    # K8s, database, Redis, network
├── Business Metrics  # Orders, consultations, users
├── Security          # Auth, audit, threats
└── On-Call           # Quick diagnostic view
```

---

## Overview Dashboard {#overview-dashboard}

### Purpose
Primary operational dashboard for quick health assessment. Should load in < 2 seconds and answer "Is the system healthy?" at a glance.

### Layout (Grid: 24 columns)

```
Row 1: Health Status Indicators (height: 2)
┌────────┬────────┬────────┬────────┬────────┬────────┐
│ Avail  │ Error  │ Latency│ Active │ Alerts │ Budget │
│ 99.95% │ 0.02%  │  45ms  │ 1,234  │   0    │  95%   │
└────────┴────────┴────────┴────────┴────────┴────────┘

Row 2: Traffic & Errors (height: 8)
┌─────────────────────────┬─────────────────────────┐
│   Request Rate (RPS)    │     Error Rate (%)      │
│   [time series graph]   │   [time series graph]   │
└─────────────────────────┴─────────────────────────┘

Row 3: Latency Distribution (height: 8)
┌─────────────────────────┬─────────────────────────┐
│  Latency (P50/P95/P99)  │   Status Code Dist.     │
│   [time series graph]   │     [pie chart]         │
└─────────────────────────┴─────────────────────────┘

Row 4: Infrastructure (height: 6)
┌────────┬────────┬────────┬────────┬────────┬────────┐
│ Pods   │ CPU    │ Memory │ DB Conn│ Redis  │ Queue  │
│ 12/12  │ 45%    │  62%   │ 42/100 │  OK    │  123   │
└────────┴────────┴────────┴────────┴────────┴────────┘
```

### Panel Specifications

#### 1. Availability Stat Panel
```yaml
panel:
  type: stat
  title: "Availability"
  description: "30-day rolling availability"
  datasource: Prometheus

query: |
  1 - (
    sum(rate(http_requests_total{status=~"5.."}[30d]))
    /
    sum(rate(http_requests_total[30d]))
  )

thresholds:
  - value: 0.999   # Green: >= 99.9%
    color: green
  - value: 0.99    # Yellow: 99-99.9%
    color: yellow
  - value: 0       # Red: < 99%
    color: red

format: percentunit
decimals: 3
```

#### 2. Request Rate Graph
```yaml
panel:
  type: timeseries
  title: "Request Rate"
  description: "Requests per second by service"
  datasource: Prometheus

queries:
  - expr: sum(rate(http_requests_total[5m])) by (service)
    legendFormat: "{{service}}"

options:
  tooltip:
    mode: all
    sort: desc
  legend:
    displayMode: table
    placement: right
    calcs: [mean, max, last]
```

#### 3. Error Rate Graph
```yaml
panel:
  type: timeseries
  title: "Error Rate"
  description: "5xx errors as percentage of total requests"
  datasource: Prometheus

queries:
  - expr: |
      sum(rate(http_requests_total{status=~"5.."}[5m]))
      /
      sum(rate(http_requests_total[5m])) * 100
    legendFormat: "Error Rate %"

options:
  fieldConfig:
    defaults:
      unit: percent
      thresholds:
        steps:
          - value: 0
            color: green
          - value: 0.1
            color: yellow
          - value: 1
            color: red
```

#### 4. Latency Percentiles
```yaml
panel:
  type: timeseries
  title: "Request Latency"
  description: "P50, P95, P99 latency"
  datasource: Prometheus

queries:
  - expr: histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
    legendFormat: "P50"
  - expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
    legendFormat: "P95"
  - expr: histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
    legendFormat: "P99"

options:
  fieldConfig:
    defaults:
      unit: s
```

---

## SLO Dashboard {#slo-dashboard}

### Purpose
Track SLO performance and error budget consumption. Critical for SRE decision-making.

### Layout

```
Row 1: Error Budget Status (height: 3)
┌────────────────┬────────────────┬────────────────┬────────────────┐
│   API Gateway  │  Auth Service  │   Pharmacy     │ Teleconsult    │
│   Budget: 92%  │   Budget: 88%  │   Budget: 95%  │  Budget: 78%   │
│   [Progress]   │   [Progress]   │   [Progress]   │   [Progress]   │
└────────────────┴────────────────┴────────────────┴────────────────┘

Row 2: 30-Day SLO Trends (height: 8)
┌─────────────────────────────────────────────────────────────────────┐
│                     Availability SLO (99.9% Target)                  │
│                         [time series graph]                          │
└─────────────────────────────────────────────────────────────────────┘

Row 3: Error Budget Burn Rate (height: 8)
┌─────────────────────────────────────────────────────────────────────┐
│                     Error Budget Burn Rate                           │
│   [Burn rate with fast/slow burn annotations]                        │
└─────────────────────────────────────────────────────────────────────┘

Row 4: SLO Details Table (height: 6)
┌─────────────────────────────────────────────────────────────────────┐
│ Service      │ SLO Target │ Current │ Budget Used │ Status         │
│ API Gateway  │ 99.9%      │ 99.95%  │ 8%          │ ✅ Healthy     │
│ Auth Service │ 99.95%     │ 99.97%  │ 12%         │ ✅ Healthy     │
│ Pharmacy     │ 99.9%      │ 99.92%  │ 5%          │ ✅ Healthy     │
│ Teleconsult  │ 99.5%      │ 99.6%   │ 22%         │ ⚠️ Monitor     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Panels

#### Error Budget Gauge
```yaml
panel:
  type: gauge
  title: "Error Budget Remaining"
  datasource: Prometheus

query: |
  1 - (
    sum(increase(http_requests_total{status=~"5.."}[30d]))
    /
    (sum(increase(http_requests_total[30d])) * 0.001)
  )

options:
  fieldConfig:
    defaults:
      min: 0
      max: 1
      unit: percentunit
      thresholds:
        steps:
          - value: 0
            color: red
          - value: 0.2
            color: orange
          - value: 0.5
            color: yellow
          - value: 0.8
            color: green
```

#### Burn Rate Alert Visualization
```yaml
panel:
  type: timeseries
  title: "Error Budget Burn Rate"
  datasource: Prometheus

queries:
  - expr: |
      (
        sum(rate(http_requests_total{status=~"5.."}[1h]))
        /
        sum(rate(http_requests_total[1h]))
      ) / 0.001
    legendFormat: "1h Burn Rate"
  - expr: |
      (
        sum(rate(http_requests_total{status=~"5.."}[6h]))
        /
        sum(rate(http_requests_total[6h]))
      ) / 0.001
    legendFormat: "6h Burn Rate"

options:
  annotations:
    - name: "Fast Burn Threshold"
      value: 14.4
      color: red
    - name: "Slow Burn Threshold"
      value: 1
      color: yellow
```

---

## Infrastructure Dashboard {#infrastructure-dashboard}

### Purpose
Detailed infrastructure monitoring for capacity planning and troubleshooting.

### Panels

#### Kubernetes
- Pod count by deployment
- Pod restart count
- Container CPU/Memory usage
- Node resource utilization
- HPA scaling events

#### Database (PostgreSQL)
- Active connections (vs max)
- Query latency percentiles
- Transaction rate
- Lock contention
- Replication lag (if applicable)

#### Redis
- Memory usage
- Cache hit rate
- Connected clients
- Commands per second
- Key expiration rate

#### Network
- Ingress bandwidth
- Request size distribution
- Connection count
- TLS handshake failures

---

## Business Metrics Dashboard {#business-metrics-dashboard}

### Purpose
Track business KPIs and user activity for product insights.

### Layout

```
Row 1: Key Business Metrics (height: 3)
┌────────────┬────────────┬────────────┬────────────┬────────────┐
│  Active    │  Orders    │ Consults   │ Rx Filled  │ Revenue    │
│  Users     │  Today     │  Today     │  Today     │  Today     │
│   1,234    │    567     │    89      │   432      │ CHF 45.2K  │
└────────────┴────────────┴────────────┴────────────┴────────────┘

Row 2: User Activity (height: 8)
┌─────────────────────────────────────────────────────────────────────┐
│                     Active Users Over Time                           │
│   [Stacked area: Pharmacist, Doctor, Nurse, Patient, Delivery]       │
└─────────────────────────────────────────────────────────────────────┘

Row 3: Order Flow (height: 8)
┌─────────────────────────┬─────────────────────────┐
│   Orders by Status      │   Prescription Volume   │
│   [Sankey diagram]      │   [time series]         │
└─────────────────────────┴─────────────────────────┘

Row 4: Teleconsultation (height: 6)
┌─────────────────────────┬─────────────────────────┬─────────────────┐
│  Sessions Started       │  Average Duration       │  Completion %   │
│  [time series]          │  [gauge]                │  [stat]         │
└─────────────────────────┴─────────────────────────┴─────────────────┘
```

### Key Metrics

| Metric | Query | Target |
|--------|-------|--------|
| Active Users | `sum(metapharm_active_users)` | Growth trend |
| Orders/Hour | `sum(rate(metapharm_orders_total[1h])) * 3600` | > 10/hour |
| Rx Processing Time | `histogram_quantile(0.95, metapharm_rx_processing_seconds_bucket)` | < 5 min |
| Teleconsult Completion | `sum(metapharm_consultations_completed) / sum(metapharm_consultations_started)` | > 90% |

---

## Security Dashboard {#security-dashboard}

### Purpose
Monitor security events, authentication patterns, and potential threats.

### Panels

#### Authentication
- Login success/failure rate
- MFA usage rate
- Failed login by IP (top 10)
- Session creation rate
- Suspicious IP blocks

#### Audit Activity
- PHI access count
- Admin actions
- Configuration changes
- API key usage

#### Threat Detection
- Rate limit hits
- Blocked requests (WAF)
- SQL injection attempts
- XSS attempts

### Example Panel

```yaml
panel:
  type: table
  title: "Failed Login Attempts (Last 24h)"
  datasource: CloudWatch

query: |
  fields @timestamp, @message, sourceIPAddress, userIdentity.userName
  | filter @message like /LOGIN_FAILED/
  | stats count(*) as attempts by sourceIPAddress
  | sort attempts desc
  | limit 20

options:
  columns:
    - sourceIPAddress
    - attempts
    - action (link to block IP)
```

---

## Implementation Guide {#implementation-guide}

### Deployment

```bash
# 1. Create Grafana namespace
kubectl create namespace monitoring

# 2. Deploy Grafana
helm repo add grafana https://grafana.github.io/helm-charts
helm install grafana grafana/grafana \
  --namespace monitoring \
  --set persistence.enabled=true \
  --set adminPassword=${GRAFANA_ADMIN_PASSWORD}

# 3. Import dashboards
kubectl create configmap grafana-dashboards \
  --from-file=dashboards/ \
  -n monitoring

# 4. Configure data sources
kubectl apply -f grafana-datasources.yaml
```

### Dashboard Provisioning

```yaml
# grafana-dashboards.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboard-provider
  namespace: monitoring
data:
  dashboards.yaml: |
    apiVersion: 1
    providers:
      - name: 'MetaPharm'
        orgId: 1
        folder: 'MetaPharm'
        type: file
        disableDeletion: true
        editable: false
        options:
          path: /var/lib/grafana/dashboards/metapharm
```

### Access Control

| Role | Dashboards | Permissions |
|------|------------|-------------|
| Viewer | All | View only |
| Editor | All except Security | View + Edit |
| Admin | All | Full access |
| Security | Security only | View + Export |

---

## Dashboard Verification Checklist

### Pre-Launch
- [ ] All panels loading correctly
- [ ] Data sources connected
- [ ] Thresholds configured appropriately
- [ ] Alerts linked to dashboards
- [ ] Access controls verified
- [ ] Mobile view tested

### Post-Launch
- [ ] Panels showing production data
- [ ] SLO baselines established
- [ ] Alert annotations visible
- [ ] Dashboard load time < 2s
- [ ] All team members have access

---

*Dashboard specifications should be reviewed monthly and updated based on operational needs.*
