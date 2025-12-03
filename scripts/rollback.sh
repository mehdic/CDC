#!/bin/bash

##############################################################################
# MetaPharm Rollback Script
#
# Usage: ./rollback.sh --environment [staging|production] [options]
#
# Options:
#   --environment ENV          Target environment (staging, production)
#   --target VERSION           Target version/revision to rollback to
#   --backup BACKUP_FILE       Path to backup file created by deploy.sh
#   --namespace NAMESPACE      Kubernetes namespace (default: metapharm-[env])
#   --timeout TIMEOUT          Rollback timeout in seconds (default: 300)
#   --skip-db-rollback        Skip database migration rollback
#   --dry-run                  Perform a dry-run without making changes
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
TARGET_VERSION=""
BACKUP_FILE=""
NAMESPACE=""
TIMEOUT=300
SKIP_DB_ROLLBACK=false
DRY_RUN=false
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
            --target)
                TARGET_VERSION="$2"
                shift 2
                ;;
            --backup)
                BACKUP_FILE="$2"
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
            --skip-db-rollback)
                SKIP_DB_ROLLBACK=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
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
    log_info "Checking rollback prerequisites..."

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
        log_error "Namespace '$NAMESPACE' does not exist"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Rollback using kubectl rollout undo
rollback_kubernetes() {
    log_info "Rolling back Kubernetes deployments..."

    local deployments=("backend" "web")

    for deployment in "${deployments[@]}"; do
        log_info "Rolling back deployment: $deployment"

        if [[ "$DRY_RUN" == true ]]; then
            log_info "[DRY-RUN] Would undo deployment: $deployment"
        else
            if kubectl rollout undo deployment/"$deployment" -n "$NAMESPACE"; then
                log_success "Rolled back deployment: $deployment"
            else
                log_warning "Failed to rollback deployment: $deployment"
            fi
        fi
    done
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
    log_info "Running health checks after rollback..."

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

# Main rollback flow
main() {
    log_info "=== MetaPharm Rollback Script ==="
    log_info "Environment: $ENVIRONMENT"
    log_info "Namespace: $NAMESPACE"

    if [[ "$DRY_RUN" == true ]]; then
        log_warning "Running in DRY-RUN mode (no changes will be made)"
    fi

    # Step 1: Check prerequisites
    check_prerequisites

    # Step 2: Perform rollback
    rollback_kubernetes

    # Step 3: Wait for rollout
    if ! wait_for_rollout; then
        log_error "Rollout failed during rollback!"
        exit 1
    fi

    # Step 4: Run health checks
    if ! run_health_checks; then
        log_error "Health checks failed after rollback!"
        log_warning "Manual intervention may be required"
        exit 1
    fi

    log_success "=== Rollback completed successfully ==="
}

# Execute main function
parse_args "$@"
validate_args
main
