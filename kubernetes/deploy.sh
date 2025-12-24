#!/bin/bash

################################################################################
# Kubernetes Deployment Script using Kustomize
# Usage: ./deploy.sh <environment> [--dry-run]
# Environments: dev, staging, prod
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_usage() {
    cat << EOF
Usage: $0 <environment> [options]

Environments:
  dev       Development environment (namespace: metapharm-dev)
  staging   Staging environment (namespace: metapharm-staging)
  prod      Production environment (namespace: metapharm)

Options:
  --dry-run      Preview changes without applying
  --diff         Show diff between current and new state
  --validate     Validate manifests only
  --help         Show this help message

Examples:
  $0 dev                    # Deploy to dev
  $0 staging --dry-run      # Preview staging deployment
  $0 prod --diff            # Show production changes
  $0 dev --validate         # Validate dev manifests
EOF
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install kubectl."
        exit 1
    fi

    # Check kustomize (built into kubectl 1.14+)
    if ! kubectl kustomize --help &> /dev/null; then
        log_error "kustomize not available. Upgrade kubectl to 1.14+"
        exit 1
    fi

    # Check cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    log_info "Prerequisites OK"
}

# Validate manifests
validate_manifests() {
    local env=$1
    log_info "Validating manifests for $env..."

    # Build manifests
    if ! kubectl kustomize "overlays/$env" > /dev/null 2>&1; then
        log_error "Invalid kustomize configuration for $env"
        exit 1
    fi

    # Validate with kubectl
    if ! kubectl kustomize "overlays/$env" | kubectl apply --dry-run=client -f - > /dev/null 2>&1; then
        log_error "Manifest validation failed for $env"
        exit 1
    fi

    log_info "Validation successful"
}

# Show diff
show_diff() {
    local env=$1
    log_info "Showing diff for $env..."

    kubectl kustomize "overlays/$env" | kubectl diff -f - || true
}

# Deploy
deploy() {
    local env=$1
    local dry_run=${2:-false}

    log_info "Deploying to $env environment..."

    if [ "$dry_run" = true ]; then
        log_warn "DRY RUN MODE - No changes will be applied"
        kubectl kustomize "overlays/$env" | kubectl apply --dry-run=server -f -
    else
        # Confirm production deployments
        if [ "$env" = "prod" ]; then
            read -p "⚠️  Deploy to PRODUCTION? This will affect live users. (yes/no): " confirm
            if [ "$confirm" != "yes" ]; then
                log_warn "Production deployment cancelled"
                exit 0
            fi
        fi

        # Apply manifests
        kubectl apply -k "overlays/$env"

        # Wait for rollout
        local namespace
        case $env in
            dev) namespace="metapharm-dev" ;;
            staging) namespace="metapharm-staging" ;;
            prod) namespace="metapharm" ;;
        esac

        log_info "Waiting for rollout to complete..."
        kubectl rollout status deployment/api-gateway-deployment -n "$namespace" --timeout=5m || true
        kubectl rollout status deployment/auth-service-deployment -n "$namespace" --timeout=5m || true
        kubectl rollout status deployment/prescription-service-deployment -n "$namespace" --timeout=5m || true

        log_info "Deployment complete!"
        log_info "Verify with: kubectl get all -n $namespace"
    fi
}

# Main
main() {
    if [ $# -eq 0 ]; then
        print_usage
        exit 1
    fi

    local environment=$1
    shift

    # Validate environment
    if [[ ! "$environment" =~ ^(dev|staging|prod)$ ]]; then
        log_error "Invalid environment: $environment"
        print_usage
        exit 1
    fi

    # Parse options
    local dry_run=false
    local show_diff_only=false
    local validate_only=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                dry_run=true
                shift
                ;;
            --diff)
                show_diff_only=true
                shift
                ;;
            --validate)
                validate_only=true
                shift
                ;;
            --help)
                print_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                print_usage
                exit 1
                ;;
        esac
    done

    # Change to kubernetes directory
    cd "$(dirname "$0")"

    # Execute
    check_prerequisites

    if [ "$validate_only" = true ]; then
        validate_manifests "$environment"
        exit 0
    fi

    if [ "$show_diff_only" = true ]; then
        show_diff "$environment"
        exit 0
    fi

    validate_manifests "$environment"
    deploy "$environment" "$dry_run"
}

main "$@"
