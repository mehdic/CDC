# Support Escalation Procedures

**MetaPharm Connect - Incident Response and Escalation**

---

## Overview

This document defines the support tiers, escalation paths, and incident response procedures for MetaPharm Connect. It ensures rapid response to issues while maintaining clear accountability.

---

## Table of Contents

1. [Support Tiers](#support-tiers)
2. [Escalation Matrix](#escalation-matrix)
3. [Incident Response](#incident-response)
4. [Contact Directory](#contact-directory)
5. [Runbooks](#runbooks)

---

## Support Tiers {#support-tiers}

### Tier 1: First-Line Support

**Team:** Customer Support
**Hours:** Monday-Friday, 08:00-18:00 CET
**Channels:** Email, Phone, Chat

**Responsibilities:**
- User account issues (password reset, login problems)
- Basic feature questions
- Known issue identification
- Ticket creation and triage
- User communication

**Handles:**
- Password resets
- Account lockouts
- Basic navigation help
- FAQ-answerable questions
- Status updates to users

**Escalates When:**
- Technical issue beyond known solutions
- Security-related concerns
- Data integrity questions
- System-wide issues
- Prescription/clinical queries

**SLA:**
- First response: < 4 hours (business hours)
- Resolution for simple issues: < 24 hours

### Tier 2: Technical Support

**Team:** Support Engineering
**Hours:** Monday-Friday, 08:00-20:00 CET
**Channels:** Slack #support-engineering, PagerDuty

**Responsibilities:**
- Technical troubleshooting
- Log analysis
- Bug reproduction
- Configuration issues
- Integration problems

**Handles:**
- API integration issues
- Performance complaints
- Feature not working as expected
- Browser/device compatibility
- Third-party integration issues

**Escalates When:**
- Code change required
- Infrastructure issue suspected
- Security incident detected
- Data loss/corruption
- SLA breach imminent

**SLA:**
- First response: < 2 hours (business hours)
- Resolution: < 8 hours (business hours)

### Tier 3: Engineering/SRE

**Team:** Platform Engineering + SRE
**Hours:** 24/7 on-call for critical issues
**Channels:** PagerDuty, Slack #incidents

**Responsibilities:**
- Production incidents
- Infrastructure issues
- Code deployments
- Security incidents
- Performance optimization

**Handles:**
- Service outages
- Database issues
- Deployment problems
- Security vulnerabilities
- Capacity planning

**Escalates When:**
- Executive decision required
- Legal/compliance involvement needed
- External vendor escalation needed
- Business impact significant

**SLA:**
- Acknowledgment: < 5 minutes (critical)
- Resolution start: < 15 minutes (critical)

### Tier 4: Executive/Specialist

**Team:** CTO, Security Officer, DPO, Legal
**Hours:** On-call for critical escalations
**Channels:** Phone, Executive Slack channel

**Responsibilities:**
- Strategic decisions during major incidents
- External communications
- Regulatory notifications
- Legal matters
- Business continuity decisions

**Handles:**
- Major service outages (SEV1)
- Security breaches
- Data breaches
- Regulatory inquiries
- Media/PR issues

---

## Escalation Matrix {#escalation-matrix}

### By Issue Type

| Issue Type | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|------------|--------|--------|--------|--------|
| Password reset | Resolve | - | - | - |
| Feature question | Resolve | - | - | - |
| Bug report | Triage | Investigate | Fix | - |
| Performance issue | Triage | Diagnose | Resolve | - |
| Service outage | Report | Triage | Resolve | Notify |
| Security incident | Report | Triage | Investigate | Lead |
| Data breach | Report | Report | Investigate | Lead |
| Compliance query | Triage | - | - | Resolve |

### By Severity

| Severity | Definition | Initial Owner | Escalation Trigger |
|----------|------------|---------------|-------------------|
| SEV1 - Critical | Complete service outage | Tier 3 (SRE) | Immediate |
| SEV2 - High | Major feature unavailable | Tier 2 | 30 min no progress |
| SEV3 - Medium | Partial degradation | Tier 2 | 2 hours no progress |
| SEV4 - Low | Minor issue, workaround exists | Tier 1 | 24 hours no progress |

### Escalation Timeframes

```
Tier 1 → Tier 2:
  - SEV1/SEV2: Immediate
  - SEV3: 30 minutes without resolution
  - SEV4: 4 hours without resolution

Tier 2 → Tier 3:
  - SEV1: Immediate
  - SEV2: 30 minutes without resolution
  - SEV3: 2 hours without resolution

Tier 3 → Tier 4:
  - SEV1: 30 minutes (or immediately if data breach/security)
  - SEV2: 2 hours without resolution
  - Business impact exceeds defined thresholds
```

---

## Incident Response {#incident-response}

### Incident Severity Definitions

#### SEV1 - Critical
**Definition:** Complete service outage or security breach affecting all users

**Examples:**
- API gateway down
- Database unreachable
- Security breach detected
- Data loss/corruption

**Response:**
- Immediate page to SRE on-call
- War room activated within 15 minutes
- Executive notification within 30 minutes
- Status page updated within 10 minutes
- User communication within 30 minutes

#### SEV2 - High
**Definition:** Major feature unavailable or significant performance degradation

**Examples:**
- Teleconsultation service down
- Prescription processing failing
- Authentication issues for subset of users
- Response times > 10x normal

**Response:**
- Page to SRE on-call
- Status page updated within 15 minutes
- Hourly updates to stakeholders
- Executive notification if > 1 hour

#### SEV3 - Medium
**Definition:** Partial degradation, workaround available

**Examples:**
- Non-critical feature unavailable
- Elevated error rates (< 5%)
- Slow performance in specific areas
- Single pharmacy affected

**Response:**
- Support Engineering investigates
- Status page update if user-facing
- Updates every 2 hours
- Escalate to Tier 3 if no progress in 2 hours

#### SEV4 - Low
**Definition:** Minor issue, no significant user impact

**Examples:**
- Cosmetic bugs
- Non-blocking errors in logs
- Single user issue with workaround
- Documentation issues

**Response:**
- Tier 1/2 handles
- Standard ticket workflow
- Scheduled for next sprint if code change needed

### Incident Response Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    INCIDENT DETECTED                         │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. ACKNOWLEDGE (< 5 min for SEV1-2)                          │
│    - Acknowledge in PagerDuty                                │
│    - Post in #incidents                                      │
│    - Assign Incident Commander                               │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ASSESS (< 15 min)                                         │
│    - Determine severity                                      │
│    - Identify scope and impact                               │
│    - Initial hypothesis                                      │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. COMMUNICATE                                               │
│    - Update status page                                      │
│    - Notify stakeholders per severity                        │
│    - Set update cadence                                      │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. MITIGATE                                                  │
│    - Apply immediate fix or workaround                       │
│    - Rollback if necessary                                   │
│    - Scale resources if needed                               │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. RESOLVE                                                   │
│    - Root cause fix deployed                                 │
│    - Monitoring confirms resolution                          │
│    - All affected users recovered                            │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. POST-INCIDENT                                             │
│    - Update status page to resolved                          │
│    - Notify stakeholders of resolution                       │
│    - Schedule post-mortem (within 48h for SEV1-2)            │
│    - Create follow-up tickets                                │
└─────────────────────────────────────────────────────────────┘
```

### Incident Commander Responsibilities

The Incident Commander (IC) is responsible for:

1. **Coordination** - Single point of contact for incident
2. **Communication** - External updates and stakeholder management
3. **Decision Making** - Authorize rollbacks, escalations
4. **Documentation** - Ensure timeline is recorded
5. **Resource Management** - Bring in additional responders

**IC is NOT responsible for:**
- Hands-on debugging (delegate to responders)
- Direct customer communication (delegate to support)
- Code fixes (delegate to engineers)

---

## Contact Directory {#contact-directory}

### On-Call Rotation

| Role | Primary | Secondary | Phone |
|------|---------|-----------|-------|
| SRE On-Call | [Current from PagerDuty] | [Current from PagerDuty] | +41 XXX |
| Engineering On-Call | [Current from PagerDuty] | [Current from PagerDuty] | +41 XXX |
| Support Lead | [Name] | [Name] | +41 XXX |

### Leadership Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| CTO | [Name] | +41 XXX | cto@metapharm-connect.ch |
| VP Engineering | [Name] | +41 XXX | vp-eng@metapharm-connect.ch |
| Security Officer | [Name] | +41 XXX | security@metapharm-connect.ch |
| DPO | [Name] | +41 XXX | dpo@metapharm-connect.ch |

### External Contacts

| Service | Contact | SLA |
|---------|---------|-----|
| AWS Support | AWS Console → Support | < 15 min (Business Critical) |
| PagerDuty | support@pagerduty.com | < 1 hour |
| Sentry | support@sentry.io | < 24 hours |
| HIN (e-ID) | support@hin.ch | +41 848 830 740 |

---

## Runbooks {#runbooks}

### Quick Links to Runbooks

| Issue | Runbook Location |
|-------|------------------|
| Service Down | [runbook.md#emergency-procedures](./runbook.md#emergency-procedures) |
| High Error Rate | [monitoring.md#alert-configuration](./monitoring.md#alert-configuration) |
| Database Issues | [runbook.md#database-rollback](./runbook.md#rollback-procedures) |
| Security Incident | [../security/SECURITY_IMPLEMENTATION.md](../security/SECURITY_IMPLEMENTATION.md) |
| Rollback Procedure | [runbook.md#rollback-procedures](./runbook.md#rollback-procedures) |

### Quick Diagnostic Commands

```bash
# Service health
curl -s https://api.metapharm-connect.ch/health | jq .

# Pod status
kubectl get pods -n metapharm

# Recent errors
kubectl logs -l app=api-gateway -n metapharm --since=10m | grep ERROR

# Database connections
kubectl exec -it $(kubectl get pod -n metapharm -l app=api-gateway -o jsonpath='{.items[0].metadata.name}') -n metapharm -- node -e "require('pg').query('SELECT count(*) FROM pg_stat_activity')"

# Redis health
kubectl exec -it $(kubectl get pod -n metapharm -l app=redis -o jsonpath='{.items[0].metadata.name}') -n metapharm -- redis-cli ping

# Current deployments
kubectl get deployments -n metapharm -o wide

# Recent events
kubectl get events -n metapharm --sort-by='.lastTimestamp' | tail -20
```

### Emergency Actions

| Action | Command | Risk Level |
|--------|---------|------------|
| Restart pod | `kubectl delete pod <pod-name> -n metapharm` | Low |
| Rollback deployment | `kubectl rollout undo deployment/<name> -n metapharm` | Medium |
| Scale to zero | `kubectl scale deployment --all -n metapharm --replicas=0` | High |
| Database failover | `aws rds failover-db-cluster --db-cluster-identifier metapharm-prod` | High |
| Rotate secrets | See [runbook.md#security-incident-response](./runbook.md#emergency-procedures) | High |

---

## Post-Incident Process

### Timeline

| Milestone | Deadline | Owner |
|-----------|----------|-------|
| Incident resolved | - | IC |
| Initial summary posted | 1 hour after resolution | IC |
| Incident report draft | 24 hours | IC |
| Post-mortem meeting | 48 hours | Engineering Lead |
| Action items created | 72 hours | IC + Assignees |
| Post-mortem published | 1 week | IC |

### Post-Mortem Template

```markdown
# Incident Post-Mortem: [Title]

**Incident ID:** INC-XXXX
**Date:** YYYY-MM-DD
**Duration:** X hours Y minutes
**Severity:** SEVX
**Authors:** [Names]

## Summary
[2-3 sentence summary]

## Impact
- Users affected: X
- Revenue impact: $X
- SLO impact: X% budget consumed

## Timeline
| Time (UTC) | Event |
|------------|-------|
| HH:MM | [Event] |

## Root Cause
[Technical explanation]

## Resolution
[What fixed it]

## What Went Well
- [Point 1]
- [Point 2]

## What Went Wrong
- [Point 1]
- [Point 2]

## Action Items
| Action | Owner | Due Date | Priority |
|--------|-------|----------|----------|
| [Action] | [Name] | YYYY-MM-DD | P1 |

## Lessons Learned
[Key takeaways]
```

---

*This document should be reviewed quarterly and updated after any significant incidents.*
