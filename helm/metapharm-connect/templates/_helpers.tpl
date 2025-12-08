{{/*
Expand the name of the chart.
*/}}
{{- define "metapharm-connect.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "metapharm-connect.fullname" -}}
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
{{- define "metapharm-connect.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "metapharm-connect.labels" -}}
helm.sh/chart: {{ include "metapharm-connect.chart" . }}
{{ include "metapharm-connect.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "metapharm-connect.selectorLabels" -}}
app.kubernetes.io/name: {{ include "metapharm-connect.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Service-specific labels
*/}}
{{- define "metapharm-connect.serviceLabels" -}}
{{- $serviceName := .serviceName -}}
app.kubernetes.io/name: {{ include "metapharm-connect.name" .root }}
app.kubernetes.io/instance: {{ .root.Release.Name }}
app.kubernetes.io/component: {{ $serviceName }}
helm.sh/chart: {{ include "metapharm-connect.chart" .root }}
{{- if .root.Chart.AppVersion }}
app.kubernetes.io/version: {{ .root.Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .root.Release.Service }}
{{- end }}

{{/*
Service-specific selector labels
*/}}
{{- define "metapharm-connect.serviceSelectorLabels" -}}
{{- $serviceName := .serviceName -}}
app.kubernetes.io/name: {{ include "metapharm-connect.name" .root }}
app.kubernetes.io/instance: {{ .root.Release.Name }}
app.kubernetes.io/component: {{ $serviceName }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "metapharm-connect.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "metapharm-connect.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create image pull secrets
*/}}
{{- define "metapharm-connect.imagePullSecrets" -}}
{{- if .Values.global.imagePullSecrets }}
imagePullSecrets:
{{- range .Values.global.imagePullSecrets }}
  - name: {{ . }}
{{- end }}
{{- else if .Values.image.pullSecrets }}
imagePullSecrets:
{{- range .Values.image.pullSecrets }}
  - name: {{ . }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create image reference for a service
*/}}
{{- define "metapharm-connect.image" -}}
{{- $registry := .Values.image.registry -}}
{{- $repository := .Values.image.repository -}}
{{- $serviceName := .serviceName -}}
{{- $tag := .Values.image.tag | default .Chart.AppVersion -}}
{{- if .Values.global.imageRegistry }}
{{- $registry = .Values.global.imageRegistry -}}
{{- end }}
{{- printf "%s/%s/%s:%s" $registry $repository $serviceName $tag }}
{{- end }}

{{/*
Database URL for services
*/}}
{{- define "metapharm-connect.databaseUrl" -}}
{{- if .Values.config.database.url }}
{{- .Values.config.database.url }}
{{- else }}
{{- printf "postgresql://%s:%s@%s-postgresql:5432/%s" .Values.postgresql.auth.username .Values.postgresql.auth.password (include "metapharm-connect.fullname" .) .Values.postgresql.auth.database }}
{{- end }}
{{- end }}

{{/*
Redis URL for services
*/}}
{{- define "metapharm-connect.redisUrl" -}}
{{- if .Values.config.redis.url }}
{{- .Values.config.redis.url }}
{{- else }}
{{- if .Values.redis.auth.enabled }}
{{- printf "redis://:%s@%s-redis-master:6379" .Values.redis.auth.password (include "metapharm-connect.fullname" .) }}
{{- else }}
{{- printf "redis://%s-redis-master:6379" (include "metapharm-connect.fullname" .) }}
{{- end }}
{{- end }}
{{- end }}

{{/*
JWT Secret reference
*/}}
{{- define "metapharm-connect.jwtSecret" -}}
{{- if .Values.secrets.jwt.secret }}
{{- .Values.secrets.jwt.secret }}
{{- else }}
{{- .Values.config.jwt.secret }}
{{- end }}
{{- end }}

{{/*
Jaeger OTLP Exporter URL
*/}}
{{- define "metapharm-connect.otlpExporterUrl" -}}
{{- if .Values.config.tracing.enabled }}
{{- printf "http://%s-jaeger:4318/v1/traces" (include "metapharm-connect.fullname" .) }}
{{- else }}
{{- "" }}
{{- end }}
{{- end }}

{{/*
Common environment variables for all backend services
*/}}
{{- define "metapharm-connect.commonEnvVars" -}}
- name: NODE_ENV
  value: {{ .Values.config.env | default "production" | quote }}
- name: LOG_LEVEL
  value: {{ .Values.config.logging.level | quote }}
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: {{ include "metapharm-connect.fullname" . }}-secrets
      key: database-url
- name: REDIS_URL
  valueFrom:
    secretKeyRef:
      name: {{ include "metapharm-connect.fullname" . }}-secrets
      key: redis-url
- name: JWT_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "metapharm-connect.fullname" . }}-secrets
      key: jwt-secret
{{- if .Values.config.tracing.enabled }}
- name: OTLP_EXPORTER_URL
  value: {{ include "metapharm-connect.otlpExporterUrl" . | quote }}
{{- end }}
{{- end }}

{{/*
Health check probes for services
*/}}
{{- define "metapharm-connect.healthProbes" -}}
{{- $port := .port -}}
livenessProbe:
  httpGet:
    path: /health
    port: {{ $port }}
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
readinessProbe:
  httpGet:
    path: /health
    port: {{ $port }}
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
{{- end }}

{{/*
Resource limits and requests
*/}}
{{- define "metapharm-connect.resources" -}}
{{- $serviceResources := .serviceResources -}}
{{- if $serviceResources }}
resources:
  {{- if $serviceResources.limits }}
  limits:
    {{- if $serviceResources.limits.cpu }}
    cpu: {{ $serviceResources.limits.cpu }}
    {{- end }}
    {{- if $serviceResources.limits.memory }}
    memory: {{ $serviceResources.limits.memory }}
    {{- end }}
  {{- end }}
  {{- if $serviceResources.requests }}
  requests:
    {{- if $serviceResources.requests.cpu }}
    cpu: {{ $serviceResources.requests.cpu }}
    {{- end }}
    {{- if $serviceResources.requests.memory }}
    memory: {{ $serviceResources.requests.memory }}
    {{- end }}
  {{- end }}
{{- else }}
resources:
  limits:
    cpu: {{ .root.Values.resources.limits.cpu }}
    memory: {{ .root.Values.resources.limits.memory }}
  requests:
    cpu: {{ .root.Values.resources.requests.cpu }}
    memory: {{ .root.Values.resources.requests.memory }}
{{- end }}
{{- end }}

{{/*
Security context for pods
*/}}
{{- define "metapharm-connect.securityContext" -}}
securityContext:
  {{- toYaml .Values.securityContext | nindent 2 }}
{{- end }}

{{/*
Pod security context
*/}}
{{- define "metapharm-connect.podSecurityContext" -}}
securityContext:
  {{- toYaml .Values.podSecurityContext | nindent 2 }}
{{- end }}
