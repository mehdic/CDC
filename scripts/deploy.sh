#!/bin/bash

##############################################################################
# MetaPharm Deployment Helper Script
#
# Usage: ./deploy.sh --environment [staging|production] [options]
#
# Options:
#   --environment ENV          Target environment (staging, production)
#   --version VERSION          Application version to deploy
#   --config CONFIG_FILE       Path to deployment config file
#   --namespace NAMESPACE      Kubernetes namespace (default: metapharm-[env])
#   --timeout TIMEOUT          Deployment timeout in seconds (default: 300)
#   --dry-run                  Perform a dry-run without making changes
#   --no-health-check         Skip health checks after deployment
#   --verbose                  Enable verbose output
#   --help                     Display this help message
#
##############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=""
VERSION=$(git describe --tags --always 2>/dev/null || echo "dev")
CONFIG_FILE=""
NAMESPACE=""
TIMEOUT=300
DRY_RUN=false
SKIP_HEALTH_CHECK=false
VERBOSE=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

# Print usage
usage() {
    head -n 28 "$0" | tail -n +2
    exit 0
}

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --version)
                VERSION="$2"
                shift 2
                ;;
            --config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            --namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            --timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --no-health-check)
                SKIP_HEALTH_CHECK=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --help)
                usage
                ;;
            *)
                log_error "Unknown argument: $1"
                usage
                ;;
        esac
    done
}

# Validate arguments
validate_args() {
    if [[ -z "$ENVIRONMENT" ]]; then
        log_error "Environment is required"
        usage
    fi

    if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT (must be 'staging' or 'production')"
        exit 1
    fi

    if [[ -z "$NAMESPACE" ]]; then
        NAMESPACE="metapharm-${ENVIRONMENT}"
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi

    # Check cluster connection
    if ! kubectl cluster-info &>/dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    # Check namespace exists
    if ! kubectl get namespace "$NAMESPACE" &>/dev/null; then
        log_warning "Namespace '$NAMESPACE' does not exist, creating it..."
        kubectl create namespace "$NAMESPACE"
    fi

    log_success "Prerequisites check passed"
}

# Validate deployment configuration
validate_environment() {
    log_info "Validating deployment environment..."

    # Check required secrets
    REQUIRED_SECRETS=("database-credentials" "redis-credentials" "jwt-secret")

    for secret in "${REQUIRED_SECRETS[@]}"; do
        if ! kubectl get secret "$secret" -n "$NAMESPACE" &>/dev/null; then
            log_error "Required secret '$secret' not found in namespace '$NAMESPACE'"
            exit 1
        fi
    done

    log_success "Environment validation passed"
}

# Backup current deployment
backup_deployment() {
    log_info "Backing up current deployment..."

    local backup_dir="${PROJECT_DIR}/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"

    kubectl get all -n "$NAMESPACE" -o yaml > "$backup_dir/deployment-backup.yaml"
    log_success "Deployment backed up to: $backup_dir"
    echo "$backup_dir"
}

# Update deployments with new image version
update_deployments() {
    log_info "Updating deployments with new image version: $VERSION..."

    local deployments=("backend" "web")

    for deployment in "${deployments[@]}"; do
        log_info "Updating deployment: $deployment"

        if [[ "$DRY_RUN" == true ]]; then
            log_info "[DRY-RUN] Would set image for $deployment to $VERSION"
        else
            kubectl set image deployment/"$deployment" \
                "$deployment=ghcr.io/metapharm/$deployment:$VERSION" \
                -n "$NAMESPACE" || log_warning "Deployment $deployment not found, skipping..."
        fi
    done

    log_success "Deployments updated"
}

# Wait for rollout to complete
wait_for_rollout() {
    log_info "Waiting for rollout to complete (timeout: ${TIMEOUT}s)..."

    local deployments=("backend" "web")

    for deployment in "${deployments[@]}"; do
        log_info "Checking rollout status for: $deployment"

        if [[ "$DRY_RUN" == true ]]; then
            log_info "[DRY-RUN] Would wait for rollout of: $deployment"
        else
            if kubectl rollout status deployment/"$deployment" \
                -n "$NAMESPACE" --timeout="${TIMEOUT}s" 2>/dev/null; then
                log_success "Rollout completed for: $deployment"
            else
                log_error "Rollout failed for: $deployment"
                return 1
            fi
        fi
    done
}

# Run health checks
run_health_checks() {
    if [[ "$SKIP_HEALTH_CHECK" == true ]]; then
        log_info "Skipping health checks (--no-health-check)"
        return 0
    fi

    log_info "Running health checks..."

    # Check pod status
    local pending_pods=$(kubectl get pods -n "$NAMESPACE" \
        --field-selector=status.phase!=Running,status.phase!=Succeeded \
        --no-headers 2>/dev/null | wc -l)

    if [[ $pending_pods -gt 0 ]]; then
        log_error "Found $pending_pods pods not in Running/Succeeded state"
        kubectl get pods -n "$NAMESPACE"
        return 1
    fi

    log_success "All pods are running"
    log_success "Health checks passed"
}

# Main deployment flow
main() {
    log_info "=== MetaPharm Deployment Script ==="
    log_info "Environment: $ENVIRONMENT"
    log_info "Version: $VERSION"
    log_info "Namespace: $NAMESPACE"

    if [[ "$DRY_RUN" == true ]]; then
        log_warning "Running in DRY-RUN mode (no changes will be made)"
    fi

    # Step 1: Check prerequisites
    check_prerequisites

    # Step 2: Validate environment
    validate_environment

    # Step 3: Backup current deployment
    BACKUP_DIR=$(backup_deployment)

    # Step 4: Update deployments
    update_deployments

    # Step 5: Wait for rollout
    if ! wait_for_rollout; then
        log_error "Rollout failed! Backup available at: $BACKUP_DIR"
        exit 1
    fi

    # Step 6: Run health checks
    if ! run_health_checks; then
        log_error "Health checks failed! Backup available at: $BACKUP_DIR"
        exit 1
    fi

    log_success "=== Deployment completed successfully ==="
}

# Execute main function
parse_args "$@"
validate_args
main
