#!/usr/bin/env python3
"""
Generate Kubernetes deployment and service manifests for all MetaPharm services.
"""

import os
import yaml
from typing import Dict, List, Tuple

# Service configurations: (service_name, port, replicas, resource_tier, health_path)
# Resource tiers: 'high' (API gateways, critical services), 'medium' (most services), 'low' (workers, batch jobs)
SERVICES = [
    ("adherence-service", 3011, 2, "medium", "/health"),
    ("analytics-service", 3012, 2, "medium", "/health"),
    ("api-gateway", 3000, 3, "high", "/health"),
    ("appointment-service", 3013, 2, "medium", "/health"),
    ("auth-service", 3001, 3, "high", "/health"),
    ("calendar-service", 3014, 2, "medium", "/health"),
    ("controlled-substance-service", 3015, 2, "medium", "/health"),
    ("delivery-service", 3002, 2, "medium", "/health"),
    ("digital-twin-service", 3016, 2, "high", "/health"),
    ("doctor-service", 3017, 2, "medium", "/health"),
    ("drug-interaction-service", 3018, 3, "high", "/health"),
    ("ecommerce-service", 3019, 2, "medium", "/health"),
    ("esante-service", 3020, 2, "medium", "/health"),
    ("insurance-service", 3021, 2, "medium", "/health"),
    ("inventory-service", 3003, 2, "medium", "/health"),
    ("marketing-service", 3022, 2, "low", "/health"),
    ("medical-records-service", 3004, 3, "high", "/health"),
    ("messaging-service", 3005, 3, "high", "/health"),
    ("notification-service", 3006, 2, "medium", "/health"),
    ("nurse-service", 3023, 2, "medium", "/health"),
    ("order-service", 3007, 2, "medium", "/health"),
    ("payment-service", 3008, 3, "high", "/health"),
    ("pharmacy-service", 3024, 2, "medium", "/health"),
    ("prescription-service", 3009, 3, "high", "/health"),
    ("recycling-service", 3025, 1, "low", "/health"),
    ("refill-service", 3026, 2, "medium", "/health"),
    ("teleconsultation-service", 3010, 3, "high", "/health"),
    ("user-service", 3027, 2, "medium", "/health"),
    ("vip-service", 3028, 2, "medium", "/health"),
    ("voice-service", 3029, 2, "medium", "/health"),
]

# Infrastructure services
INFRA_SERVICES = [
    ("postgres-primary", 5432, 1, "high", None),
    ("postgres-replica", 5432, 2, "high", None),
    ("redis", 6379, 2, "medium", None),
    ("rabbitmq", 5672, 2, "medium", None),
    ("elasticsearch", 9200, 2, "medium", None),
]

RESOURCE_CONFIGS = {
    "high": {
        "requests": {"cpu": "500m", "memory": "512Mi"},
        "limits": {"cpu": "1000m", "memory": "1Gi"}
    },
    "medium": {
        "requests": {"cpu": "250m", "memory": "256Mi"},
        "limits": {"cpu": "500m", "memory": "512Mi"}
    },
    "low": {
        "requests": {"cpu": "100m", "memory": "128Mi"},
        "limits": {"cpu": "250m", "memory": "256Mi"}
    }
}

def create_deployment_manifest(service_name: str, port: int, replicas: int,
                               resource_tier: str, health_path: str = "/health") -> Dict:
    """Create a deployment manifest for a service."""

    resources = RESOURCE_CONFIGS[resource_tier]

    deployment = {
        "apiVersion": "apps/v1",
        "kind": "Deployment",
        "metadata": {
            "name": f"{service_name}-deployment",
            "namespace": "metapharm",
            "labels": {
                "app": service_name,
                "tier": resource_tier,
                "component": "microservice" if health_path else "infrastructure",
                "version": "v1"
            },
            "annotations": {
                "deployment.kubernetes.io/revision": "1"
            }
        },
        "spec": {
            "replicas": replicas,
            "selector": {
                "matchLabels": {
                    "app": service_name,
                    "version": "v1"
                }
            },
            "strategy": {
                "type": "RollingUpdate",
                "rollingUpdate": {
                    "maxSurge": 1,
                    "maxUnavailable": 0
                }
            },
            "template": {
                "metadata": {
                    "labels": {
                        "app": service_name,
                        "tier": resource_tier,
                        "version": "v1"
                    },
                    "annotations": {
                        "prometheus.io/scrape": "true",
                        "prometheus.io/port": str(port),
                        "prometheus.io/path": "/metrics"
                    }
                },
                "spec": {
                    "serviceAccountName": f"{service_name}-sa",
                    "securityContext": {
                        "runAsNonRoot": True,
                        "runAsUser": 1000,
                        "fsGroup": 1000
                    },
                    "containers": [{
                        "name": service_name,
                        "image": f"metapharm/{service_name}:latest",
                        "imagePullPolicy": "IfNotPresent",
                        "ports": [{
                            "name": "http",
                            "containerPort": port,
                            "protocol": "TCP"
                        }],
                        "env": [
                            {
                                "name": "PORT",
                                "value": str(port)
                            },
                            {
                                "name": "SERVICE_NAME",
                                "value": service_name
                            }
                        ],
                        "envFrom": [
                            {
                                "configMapRef": {
                                    "name": "common-config"
                                }
                            },
                            {
                                "secretRef": {
                                    "name": "metapharm-db-credentials"
                                }
                            },
                            {
                                "secretRef": {
                                    "name": "metapharm-jwt-secret"
                                }
                            }
                        ],
                        "resources": resources,
                        "securityContext": {
                            "allowPrivilegeEscalation": False,
                            "readOnlyRootFilesystem": True,
                            "runAsNonRoot": True,
                            "capabilities": {
                                "drop": ["ALL"]
                            }
                        }
                    }],
                    "restartPolicy": "Always",
                    "terminationGracePeriodSeconds": 30
                }
            }
        }
    }

    # Add health checks for application services
    if health_path:
        container = deployment["spec"]["template"]["spec"]["containers"][0]
        container["livenessProbe"] = {
            "httpGet": {
                "path": health_path,
                "port": "http",
                "scheme": "HTTP"
            },
            "initialDelaySeconds": 30,
            "periodSeconds": 10,
            "timeoutSeconds": 5,
            "successThreshold": 1,
            "failureThreshold": 3
        }
        container["readinessProbe"] = {
            "httpGet": {
                "path": health_path,
                "port": "http",
                "scheme": "HTTP"
            },
            "initialDelaySeconds": 10,
            "periodSeconds": 5,
            "timeoutSeconds": 3,
            "successThreshold": 1,
            "failureThreshold": 3
        }

    # Add anti-affinity for HA services (replicas > 1)
    if replicas > 1:
        deployment["spec"]["template"]["spec"]["affinity"] = {
            "podAntiAffinity": {
                "preferredDuringSchedulingIgnoredDuringExecution": [{
                    "weight": 100,
                    "podAffinityTerm": {
                        "labelSelector": {
                            "matchExpressions": [{
                                "key": "app",
                                "operator": "In",
                                "values": [service_name]
                            }]
                        },
                        "topologyKey": "kubernetes.io/hostname"
                    }
                }]
            }
        }

    return deployment

def create_service_manifest(service_name: str, port: int, is_external: bool = False) -> Dict:
    """Create a service manifest for a service."""

    service = {
        "apiVersion": "v1",
        "kind": "Service",
        "metadata": {
            "name": f"{service_name}-svc",
            "namespace": "metapharm",
            "labels": {
                "app": service_name,
                "service": "true"
            },
            "annotations": {
                "service.kubernetes.io/topology-aware-hints": "auto"
            }
        },
        "spec": {
            "selector": {
                "app": service_name
            },
            "ports": [{
                "name": "http",
                "protocol": "TCP",
                "port": port,
                "targetPort": "http"
            }],
            "sessionAffinity": "ClientIP",
            "sessionAffinityConfig": {
                "clientIP": {
                    "timeoutSeconds": 10800
                }
            }
        }
    }

    # API Gateway and some services should be exposed externally
    if is_external:
        service["spec"]["type"] = "LoadBalancer"
    else:
        service["spec"]["type"] = "ClusterIP"

    return service

def create_service_account(service_name: str) -> Dict:
    """Create a service account manifest."""

    return {
        "apiVersion": "v1",
        "kind": "ServiceAccount",
        "metadata": {
            "name": f"{service_name}-sa",
            "namespace": "metapharm",
            "labels": {
                "app": service_name
            }
        }
    }

def write_manifest(manifest: Dict, directory: str, filename: str):
    """Write a manifest to a YAML file."""
    os.makedirs(directory, exist_ok=True)
    filepath = os.path.join(directory, filename)

    with open(filepath, 'w') as f:
        yaml.dump(manifest, f, default_flow_style=False, sort_keys=False, indent=2)

    print(f"✓ Created {filepath}")

def main():
    """Generate all Kubernetes manifests."""

    base_dir = os.path.dirname(os.path.abspath(__file__))

    print("🚀 Generating Kubernetes manifests for MetaPharm Connect\n")

    # Generate application service manifests
    print("📦 Generating application service manifests...")
    for service_name, port, replicas, tier, health_path in SERVICES:
        # Deployment
        deployment = create_deployment_manifest(service_name, port, replicas, tier, health_path)
        write_manifest(deployment, os.path.join(base_dir, "deployments"), f"{service_name}.yaml")

        # Service (API Gateway is external)
        is_external = (service_name == "api-gateway")
        service = create_service_manifest(service_name, port, is_external)
        write_manifest(service, os.path.join(base_dir, "services"), f"{service_name}-svc.yaml")

        # Service Account
        sa = create_service_account(service_name)
        write_manifest(sa, os.path.join(base_dir, "deployments"), f"{service_name}-sa.yaml")

    # Generate infrastructure service manifests
    print("\n🗄️  Generating infrastructure service manifests...")
    for service_name, port, replicas, tier, _ in INFRA_SERVICES:
        # Deployment (infrastructure services don't have health checks via HTTP)
        deployment = create_deployment_manifest(service_name, port, replicas, tier, None)
        write_manifest(deployment, os.path.join(base_dir, "deployments"), f"{service_name}.yaml")

        # Service (internal only)
        service = create_service_manifest(service_name, port, False)
        write_manifest(service, os.path.join(base_dir, "services"), f"{service_name}-svc.yaml")

        # Service Account
        sa = create_service_account(service_name)
        write_manifest(sa, os.path.join(base_dir, "deployments"), f"{service_name}-sa.yaml")

    print(f"\n✅ Generated manifests for {len(SERVICES) + len(INFRA_SERVICES)} services")
    print("\n📂 Directory structure:")
    print("  kubernetes/")
    print("    ├── namespaces/metapharm.yaml")
    print("    ├── configmaps/common-config.yaml")
    print(f"    ├── deployments/ ({len(SERVICES) + len(INFRA_SERVICES)} deployments + service accounts)")
    print(f"    └── services/ ({len(SERVICES) + len(INFRA_SERVICES)} services)")

if __name__ == "__main__":
    main()
