# MetaPharm Monitoring - Prometheus & AlertManager Helm Chart

Comprehensive monitoring and alerting solution for the MetaPharm Connect healthcare platform.

## Overview

This Helm chart deploys a production-ready Prometheus and AlertManager stack for monitoring all 31 MetaPharm microservices, with healthcare-specific alerting rules and compliance tracking.

## Features

- **Prometheus Server**: Metrics collection with 15-day retention
- **AlertManager**: Multi-channel alerting (Slack, PagerDuty, Email)
- **ServiceMonitors**: Auto-discovery for all 31 MetaPharm microservices
- **PrometheusRules**: 30+ alert rules for critical healthcare scenarios
- **RBAC**: Least-privilege access controls
- **High Availability**: 2 replicas for both Prometheus and AlertManager
- **Persistent Storage**: 50Gi for metrics, 2Gi for AlertManager

## Architecture

### Monitored Services (31 Microservices)

**High Tier (Critical - 10s scrape interval):**
- API Gateway
- Auth Service
- Prescription Service
- Medical Records Service
- Messaging Service
- Payment Service
- Teleconsultation Service
- Digital Twin Service
- Drug Interaction Service

**Medium Tier (15s scrape interval):**
- Delivery, Inventory, Notification, Order, Adherence, Analytics
- Appointment, Calendar, Controlled Substance, Doctor, Ecommerce
- Esante, Insurance, Nurse, Pharmacy, Refill, User, VIP, Voice

**Low Tier (30s scrape interval):**
- Marketing Service
- Recycling Service

### Alert Categories

1. **Service Availability**: Down services, error rates
2. **Performance**: Latency, throughput degradation
3. **Healthcare Critical**: Prescription failures, drug interaction failures, medical records unavailability
4. **Security**: Authentication failures, unauthorized access
5. **Database**: Connection pool exhaustion, slow queries
6. **Infrastructure**: Memory/CPU usage, pod crashes
7. **Business Metrics**: Payment failures, low processing rates

## Installation

### Prerequisites

- Kubernetes 1.24+
- Helm 3.x
- MetaPharm services deployed in `metapharm` namespace

### Install Chart

```bash
# Create monitoring namespace
kubectl create namespace metapharm-monitoring

# Install Prometheus Operator CRDs (if not already installed)
kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/example/prometheus-operator-crd/monitoring.coreos.com_servicemonitors.yaml
kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/example/prometheus-operator-crd/monitoring.coreos.com_prometheusrules.yaml

# Install monitoring stack
helm install metapharm-monitoring ./kubernetes/helm/charts/monitoring \
  --namespace metapharm-monitoring \
  --create-namespace
```

### Configuration

#### Slack Notifications

Edit `values.yaml`:

```yaml
alertmanager:
  notifications:
    slack:
      enabled: true
      webhookUrl: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
      channel: "#metapharm-alerts"
```

Or use Helm values:

```bash
helm install metapharm-monitoring ./kubernetes/helm/charts/monitoring \
  --set alertmanager.notifications.slack.webhookUrl="https://hooks.slack.com/..." \
  --namespace metapharm-monitoring
```

#### PagerDuty Integration (Critical Alerts)

```yaml
alertmanager:
  notifications:
    pagerduty:
      enabled: true
      serviceKey: "YOUR_PAGERDUTY_SERVICE_KEY"
```

## Alert Rules

### Critical Patient Safety Alerts

- **PrescriptionProcessingFailure**: Fires when prescription processing errors exceed 0.05/s
- **DrugInteractionCheckFailure**: Fires on any drug interaction check failure (patient safety)
- **MedicalRecordsUnavailable**: Fires when medical records service is down for >30s

### Service Health Alerts

- **ServiceDown**: Any MetaPharm service down for >1 minute
- **HighServiceErrorRate**: Error rate >10% for 5 minutes
- **CriticalLatency**: 95th percentile latency >5s

### Security Alerts

- **HighAuthenticationFailureRate**: >10 failed auth attempts/second
- **UnauthorizedAccessAttempts**: >5 unauthorized requests/second
- **SuspiciousDataAccess**: Abnormal access patterns to sensitive endpoints

## Accessing Prometheus UI

```bash
# Port-forward Prometheus
kubectl port-forward -n metapharm-monitoring svc/prometheus 9090:9090

# Access at http://localhost:9090
```

## Accessing AlertManager UI

```bash
# Port-forward AlertManager
kubectl port-forward -n metapharm-monitoring svc/alertmanager 9093:9093

# Access at http://localhost:9093
```

## Customization

### Adjust Retention Period

```yaml
prometheus:
  storage:
    retention: 30d  # Change from default 15d
    size: 100Gi     # Increase storage accordingly
```

### Add Custom Alert Rules

Edit `values.yaml` under `prometheusRules.rules`:

```yaml
prometheusRules:
  rules:
    - name: custom-alerts
      interval: 30s
      rules:
        - alert: CustomAlert
          expr: your_metric > threshold
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Custom alert description"
```

### Modify Scrape Intervals

```yaml
serviceMonitors:
  interval: 30s  # Global default
  scrapeTimeout: 10s
```

## Testing

### Run Test Suite

```bash
# Install pytest
pip install pytest pyyaml

# Run tests
cd kubernetes/helm/charts/monitoring
pytest __tests__/ -v
```

### Validate Helm Chart

```bash
# Lint chart
helm lint ./kubernetes/helm/charts/monitoring

# Dry-run installation
helm install --dry-run --debug metapharm-monitoring ./kubernetes/helm/charts/monitoring
```

## Troubleshooting

### Prometheus Not Scraping Services

1. Check ServiceMonitor is created:
   ```bash
   kubectl get servicemonitors -n metapharm-monitoring
   ```

2. Verify services have metrics endpoints:
   ```bash
   kubectl port-forward -n metapharm svc/api-gateway-svc 3000:3000
   curl http://localhost:3000/metrics
   ```

3. Check Prometheus targets:
   - Access Prometheus UI → Status → Targets
   - Look for services in "down" state

### Alerts Not Firing

1. Check PrometheusRules are loaded:
   ```bash
   kubectl get configmap prometheus-rules -n metapharm-monitoring -o yaml
   ```

2. Check AlertManager configuration:
   ```bash
   kubectl logs -n metapharm-monitoring deployment/alertmanager
   ```

3. Test alert rule manually in Prometheus UI → Alerts

## Metrics Reference

### Custom MetaPharm Metrics

- `prescription_processing_duration_seconds`: Time to process prescriptions
- `prescription_processing_errors_total`: Count of prescription processing errors
- `drug_interaction_checks_total`: Number of drug interaction checks performed
- `drug_interaction_check_errors_total`: Failed drug interaction checks
- `teleconsultation_sessions_active`: Current active teleconsultation sessions
- `payment_transactions_total`: Total payment transactions
- `payment_transactions_failed_total`: Failed payment transactions
- `authentication_failures_total`: Authentication failure count
- `http_requests_total`: HTTP request count by status
- `http_request_duration_seconds`: HTTP request latency histogram
- `database_query_duration_seconds`: Database query latency

## Compliance

### HIPAA Compliance

- All metrics are anonymized (no PHI)
- Audit logs for alert access
- Encrypted storage (via Kubernetes secrets)
- 15-day retention aligns with audit requirements

### Alert Compliance Tracking

Alerts tagged with compliance labels:
- `compliance: hipaa` - HIPAA-related alerts
- `compliance: patient-safety` - Patient safety issues
- `compliance: gdpr` - GDPR-related alerts

## Uninstall

```bash
helm uninstall metapharm-monitoring -n metapharm-monitoring
kubectl delete namespace metapharm-monitoring
```

## Support

For issues or questions:
- Email: devops@metapharm.ch
- Slack: #metapharm-monitoring
- Documentation: https://docs.metapharm.ch/monitoring

## License

Proprietary - MetaPharm Connect
