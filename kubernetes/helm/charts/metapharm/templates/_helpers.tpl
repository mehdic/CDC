{{/*
Expand the name of the chart.
*/}}
{{- define "metapharm.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "metapharm.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "metapharm.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "metapharm.labels" -}}
helm.sh/chart: {{ include "metapharm.chart" . }}
{{ include "metapharm.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
environment: {{ .Values.global.environment }}
project: metapharm-connect
{{- end }}

{{/*
Selector labels
*/}}
{{- define "metapharm.selectorLabels" -}}
app.kubernetes.io/name: {{ include "metapharm.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "metapharm.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "metapharm.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Generate service-specific labels
*/}}
{{- define "metapharm.serviceLabels" -}}
app: {{ .serviceName }}
tier: {{ .tier }}
component: {{ .component }}
version: v1
{{- end }}

{{/*
Generate service-specific selector labels
*/}}
{{- define "metapharm.serviceSelectorLabels" -}}
app: {{ .serviceName }}
version: v1
{{- end }}

{{/*
Generate deployment name
*/}}
{{- define "metapharm.deploymentName" -}}
{{- printf "%s-deployment" .serviceName }}
{{- end }}

{{/*
Generate service name
*/}}
{{- define "metapharm.serviceName" -}}
{{- printf "%s-svc" .serviceName }}
{{- end }}

{{/*
Generate service account name
*/}}
{{- define "metapharm.serviceAccountName.service" -}}
{{- printf "%s-sa" .serviceName }}
{{- end }}

{{/*
Generate image name
*/}}
{{- define "metapharm.image" -}}
{{- $registry := .Values.global.imageRegistry }}
{{- $name := .serviceName }}
{{- $tag := .Values.global.imageTag }}
{{- printf "%s/%s:%s" $registry $name $tag }}
{{- end }}

{{/*
Generate namespace
*/}}
{{- define "metapharm.namespace" -}}
{{- .Values.global.namespace | default "metapharm" }}
{{- end }}

{{/*
Generate ConfigMap name
*/}}
{{- define "metapharm.configMapName" -}}
common-config
{{- end }}

{{/*
Generate resource requests and limits
*/}}
{{- define "metapharm.resources" -}}
resources:
  requests:
    cpu: {{ .resources.requests.cpu }}
    memory: {{ .resources.requests.memory }}
  limits:
    cpu: {{ .resources.limits.cpu }}
    memory: {{ .resources.limits.memory }}
{{- end }}

{{/*
Generate health check probes
*/}}
{{- define "metapharm.livenessProbe" -}}
livenessProbe:
  httpGet:
    path: {{ .healthCheck.path }}
    port: {{ .serviceName | replace "-" "" }}
    scheme: HTTP
  initialDelaySeconds: {{ .Values.healthProbe.liveness.initialDelaySeconds }}
  periodSeconds: {{ .Values.healthProbe.liveness.periodSeconds }}
  timeoutSeconds: {{ .Values.healthProbe.liveness.timeoutSeconds }}
  successThreshold: {{ .Values.healthProbe.liveness.successThreshold }}
  failureThreshold: {{ .Values.healthProbe.liveness.failureThreshold }}
{{- end }}

{{- define "metapharm.readinessProbe" -}}
readinessProbe:
  httpGet:
    path: {{ .healthCheck.path }}
    port: {{ .serviceName | replace "-" "" }}
    scheme: HTTP
  initialDelaySeconds: {{ .Values.healthProbe.readiness.initialDelaySeconds }}
  periodSeconds: {{ .Values.healthProbe.readiness.periodSeconds }}
  timeoutSeconds: {{ .Values.healthProbe.readiness.timeoutSeconds }}
  successThreshold: {{ .Values.healthProbe.readiness.successThreshold }}
  failureThreshold: {{ .Values.healthProbe.readiness.failureThreshold }}
{{- end }}

{{/*
Generate pod security context
*/}}
{{- define "metapharm.podSecurityContext" -}}
securityContext:
  runAsNonRoot: {{ .Values.securityContext.runAsNonRoot }}
  runAsUser: {{ .Values.securityContext.runAsUser }}
  fsGroup: {{ .Values.securityContext.fsGroup }}
{{- end }}

{{/*
Generate container security context
*/}}
{{- define "metapharm.containerSecurityContext" -}}
securityContext:
  allowPrivilegeEscalation: {{ .Values.securityContext.allowPrivilegeEscalation }}
  readOnlyRootFilesystem: {{ .Values.securityContext.readOnlyRootFilesystem }}
  runAsNonRoot: {{ .Values.securityContext.runAsNonRoot }}
  capabilities:
    drop:
      {{- range .Values.securityContext.capabilities.drop }}
      - {{ . }}
      {{- end }}
{{- end }}

{{/*
Generate pod affinity
*/}}
{{- define "metapharm.podAntiAffinity" -}}
{{- if .Values.affinity.podAntiAffinity.enabled }}
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: {{ .Values.affinity.podAntiAffinity.weight }}
      podAffinityTerm:
        labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values:
            - {{ .serviceName }}
        topologyKey: kubernetes.io/hostname
{{- end }}
{{- end }}

{{/*
Generate update strategy
*/}}
{{- define "metapharm.updateStrategy" -}}
strategy:
  type: {{ .Values.updateStrategy.type }}
  rollingUpdate:
    maxSurge: {{ .Values.updateStrategy.rollingUpdate.maxSurge }}
    maxUnavailable: {{ .Values.updateStrategy.rollingUpdate.maxUnavailable }}
{{- end }}

{{/*
Generate service annotations
*/}}
{{- define "metapharm.serviceAnnotations" -}}
annotations:
  service.kubernetes.io/topology-aware-hints: auto
{{- end }}

{{/*
Generate session affinity
*/}}
{{- define "metapharm.sessionAffinity" -}}
{{- if .Values.sessionAffinity.enabled }}
sessionAffinity: {{ .Values.sessionAffinity.type }}
sessionAffinityConfig:
  clientIP:
    timeoutSeconds: {{ .Values.sessionAffinity.timeout }}
{{- end }}
{{- end }}

{{/*
Generate prometheus annotations
*/}}
{{- define "metapharm.prometheusAnnotations" -}}
{{- if .Values.monitoring.prometheus.enabled }}
prometheus.io/scrape: "true"
prometheus.io/port: {{ .port | quote }}
prometheus.io/path: {{ .Values.monitoring.metrics.path }}
{{- end }}
{{- end }}

{{/*
Generate HPA (Horizontal Pod Autoscaler) name
*/}}
{{- define "metapharm.hpaName" -}}
{{- printf "%s-hpa" .serviceName }}
{{- end }}

{{/*
Database host helper
*/}}
{{- define "metapharm.dbHost" -}}
{{- if .Values.global.environment | eq "production" }}
{{- printf "metapharm-db.postgres.database.azure.com" }}
{{- else }}
{{- printf "postgres-primary-svc.%s.svc.cluster.local" (include "metapharm.namespace" .) }}
{{- end }}
{{- end }}

{{/*
Redis host helper
*/}}
{{- define "metapharm.redisHost" -}}
{{- printf "redis-svc.%s.svc.cluster.local" (include "metapharm.namespace" .) }}
{{- end }}

{{/*
RabbitMQ host helper
*/}}
{{- define "metapharm.rabbitmqHost" -}}
{{- printf "rabbitmq-svc.%s.svc.cluster.local" (include "metapharm.namespace" .) }}
{{- end }}

{{/*
Elasticsearch host helper
*/}}
{{- define "metapharm.elasticsearchHost" -}}
{{- printf "elasticsearch-svc.%s.svc.cluster.local" (include "metapharm.namespace" .) }}
{{- end }}

{{/*
API Gateway URL helper
*/}}
{{- define "metapharm.apiGatewayUrl" -}}
{{- printf "http://api-gateway-svc.%s.svc.cluster.local:3000" (include "metapharm.namespace" .) }}
{{- end }}
