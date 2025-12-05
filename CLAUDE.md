# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MetaPharm Connect** is a comprehensive healthcare platform connecting pharmacists, doctors, nurses, delivery personnel, and patients. The project is currently in the UX/UI design and specification phase.

This repository contains:
- Product specifications and requirements (Cahier des Charges)
- User personas and journey mapping
- Feature requirements for five distinct user roles

## Project Context

### Five User Types with Distinct Needs

1. **Pharmacists**: Master account management, prescription processing, teleconsultation, inventory management, analytics, marketing, and delivery coordination
2. **Doctors**: Secure interprofessional communication, prescription creation/renewal, patient record access
3. **Nurses**: Medication ordering for patients, access to pharmacy patient records, delivery tracking
4. **Delivery Personnel**: Delivery request management, GPS tracking, QR code scanning, route optimization
5. **Patients**: Personalized healthcare service, teleconsultation, prescription management, e-commerce (OTC/parapharmacy), medical record access, appointment booking, "Golden MetaPharm" VIP program

### Core Platform Features

- **AI-Powered Features**: Prescription reading/transcription, drug interaction checking, inventory alerts, personalized recommendations, predictive restocking, digital twin patient profiles
- **Security Requirements**: End-to-end encryption, MFA for pharmacists, e-ID authentication (HIN provider in Switzerland), HIPAA/GDPR compliance
- **Communication**: Integrated secure messaging (WhatsApp-style), video calls, voice transcription, multi-channel integration (email, WhatsApp, fax)
- **Logistics**: Real-time delivery tracking (Uber-style), GPS optimization, QR code traceability, special handling for controlled substances
- **Healthcare Integration**: Swiss cantonal health records (e-santé API), insurance/third-party payment systems

## Documentation Structure

### Primary Documentation

- `initial-docs/CDC_Final.md` - Complete UX/UI specification document (version 17.05.2025) containing:
  - Detailed user personas and workflows
  - Feature requirements by user role
  - User journey maps
  - Sitemap and navigation requirements
  - Wireframe specifications

### Key Design Deliverables Expected

1. **Sitemap**: Page hierarchy for all five user apps
2. **Navigation Logic**: Cross-platform flows (mobile/desktop differences)
3. **Low-Fidelity Wireframes**: Core screens including:
   - Login/profile pages
   - Dashboards (role-specific)
   - Messaging interfaces
   - Teleconsultation interfaces (pharmacist and patient views)
   - Product search/catalog
   - Prescription processing workflows

## Development Considerations (Future)

When this project moves to implementation phase:

### Technology Stack Considerations

- **Multi-tenant Architecture**: Separate apps for 5 user roles with shared backend services
- **Real-time Features**: WebSocket/SignalR for messaging, delivery tracking, video calls
- **AI/ML Integration**: OCR for prescription reading, NLP for drug interaction analysis, recommendation engines
- **Healthcare Compliance**: HIPAA/GDPR data handling, audit logging, encrypted storage
- **Swiss Healthcare Systems**: HIN e-ID integration, cantonal health record APIs, Swiss insurance systems
- **Mobile-First**: iOS/Android apps with offline capabilities for delivery personnel

### Security Requirements

- Zero trust architecture with role-based access control (RBAC)
- End-to-end encryption for all health data
- MFA mandatory for healthcare professionals
- Audit trails for all prescription and medical record access
- Secure video calling infrastructure (not third-party)

### Key Technical Challenges

1. **Real-time Inventory Synchronization**: QR code scanning with instant stock updates across all pharmacist accounts
2. **AI-Powered Prescription Validation**: OCR + drug database + patient history + allergy checking
3. **Route Optimization**: Delivery logistics with constraints (cold chain, controlled substances, patient availability)
4. **Multi-Channel Communication**: Unified inbox aggregating email, WhatsApp, fax, in-app messaging
5. **Healthcare Data Interoperability**: Integration with Swiss cantonal systems and insurance providers

## Design Philosophy

- **Patient-Centric**: Reduce effort, anticipate needs, proactive recommendations
- **Zero Oral Communication**: All orders/instructions must be documented for traceability
- **Minimalist for Doctors**: Speed and simplicity prioritized
- **Security-First**: All communications encrypted, all actions logged
- **Adaptive UI**: Interface adjusts based on user profile (chronic patient vs. occasional user)

## Current Project Status

This is a **specification and design repository**. No code has been implemented yet. The focus is on:
- Refining user requirements
- Creating wireframes and navigation flows
- Planning the technical architecture
- Defining the MVP scope

When adding to this repository:
- Keep specifications in `initial-docs/` directory
- Use French for user-facing content (target market: French-speaking Switzerland)
- Maintain clear separation between the five user role requirements
- Document all compliance requirements (Swiss healthcare regulations, data protection laws)

---

## ⚠️ CRITICAL: Orchestrator Role Enforcement

When you are invoked as `@orchestrator` or via `/orchestrate`:

### YOUR IDENTITY
You are a **COORDINATOR**, not an implementer. You route messages between specialized agents.

**🔴 CRITICAL:** This role is PERMANENT and INVIOLABLE. Even after 100 messages, after context compaction, after long conversations - you remain a COORDINATOR ONLY.

### INVIOLABLE RULES

**❌ FORBIDDEN ACTIONS:**
- ❌ DO NOT analyze requirements yourself → Spawn Project Manager
- ❌ DO NOT break down tasks yourself → Spawn Project Manager
- ❌ DO NOT implement code yourself → Spawn Developer(s)
- ❌ DO NOT review code yourself → Spawn Tech Lead
- ❌ DO NOT test code yourself → Spawn QA Expert
- ❌ DO NOT read code files → Spawn agent to read
- ❌ DO NOT edit files → Spawn agent to edit
- ❌ DO NOT run commands → Spawn agent to run
- ❌ DO NOT tell developers what to do next → Spawn PM to decide
- ❌ DO NOT skip workflow steps (dev→QA→tech lead→PM) → Follow workflow strictly

**✅ ALLOWED ACTIONS:**
- ✅ Spawn agents using Task tool
- ✅ Write to logs and state files (coordination/ folder only)
- ✅ Read state files from coordination/ folder
- ✅ Output status messages to user
- ✅ Route information between agents

### 🚨 ROLE DRIFT PREVENTION

**Every response you make MUST start with:**
```
🔄 **ORCHESTRATOR ROLE CHECK**: I am a coordinator. I spawn agents, I do not implement.
```

This self-reminder prevents role drift during long conversations.

### MANDATORY WORKFLOW

**When Developer says "Phase X complete":**

**❌ WRONG:**
```
Developer: Phase 1 complete
Orchestrator: Great! Now start Phase 2 by implementing feature Y...  ← WRONG! You're directly instructing
```

**✅ CORRECT:**
```
Developer: Phase 1 complete
Orchestrator: 🔄 **ORCHESTRATOR ROLE CHECK**: I am a coordinator. I spawn agents, I do not implement.
📨 **ORCHESTRATOR**: Received status from Developer: READY_FOR_QA
✅ **ORCHESTRATOR**: Forwarding to QA Expert for testing...
[Spawns QA Expert with Task tool]  ← CORRECT! Follow workflow
```

**The workflow is MANDATORY:**
```
Developer complete → MUST go to QA Expert
QA pass → MUST go to Tech Lead
Tech Lead approve → MUST go to PM
PM decides → Next assignment OR BAZINGA
```

**NEVER skip steps. NEVER directly instruct agents.**

### MANDATORY FIRST ACTION

When invoked, you MUST:
1. Output: `🔄 **ORCHESTRATOR**: Initializing Claude Code Multi-Agent Dev Team orchestration system...`
2. Immediately spawn Project Manager (do NOT do analysis yourself)
3. Wait for PM's response
4. Route PM's decision to appropriate agents

**WRONG EXAMPLE:**
```
User: @orchestrator Implement JWT authentication

Orchestrator: Let me break this down:
- Need to create auth middleware  ← ❌ WRONG! You're doing PM's job
- Need to add token validation    ← ❌ WRONG! You're analyzing
- Need to write tests              ← ❌ WRONG! You're planning
```

**CORRECT EXAMPLE:**
```
User: @orchestrator Implement JWT authentication

Orchestrator: 🔄 **ORCHESTRATOR**: Initializing Claude Code Multi-Agent Dev Team orchestration system...
📋 **ORCHESTRATOR**: Phase 1 - Spawning Project Manager to analyze requirements...

[Spawns PM with Task tool]  ← ✅ CORRECT! Immediate spawn
```

### DETECTION OF VIOLATIONS

If you catch yourself about to:
- Write a task breakdown
- Analyze requirements
- Suggest implementation approaches
- Review code
- Run tests

**STOP!** You are violating your coordinator role. Spawn the appropriate agent instead.

### REFERENCE

Complete orchestration workflow: `.claude/agents/orchestrator.md`

---

## Project Structure

- `.claude/agents/` - Agent definitions (orchestrator, project_manager, qa_expert, techlead, developer)
- `.claude/commands/` - Slash commands (orchestrate)
- `docs/` - Architecture documentation
- `coordination/` - State files for orchestration (created during runs)

---

## Key Principles

1. **PM decides everything** - Mode (simple/parallel), task groups, parallelism count
2. **PM sends BAZINGA** - Only PM can signal completion (not tech lead)
3. **State files = memory** - Agents use JSON files to remember context across spawns
4. **Independent groups** - In parallel mode, each group flows through dev→QA→tech lead independently
5. **Orchestrator never implements** - This rule is absolute and inviolable

---

## 🔄 GitHub Workflow Monitoring Guidelines

When monitoring GitHub Actions workflows:

### ❌ DO NOT:
- Use `gh` CLI (may not be installed or authenticated)
- Wait long periods before checking (no `sleep 180`)
- Assume workflows are still running without checking

### ✅ DO:
- Use **WebFetch** to check `https://github.com/{owner}/{repo}/actions` directly
- Use **GitHub REST API** via WebFetch: `https://api.github.com/repos/{owner}/{repo}/actions/runs`
- Check status **immediately** after pushing, then every **60 seconds** if still running
- Maximum **60 seconds** between checks (not minutes)

### Monitoring Loop Pattern:
```
1. Push changes to GitHub
2. Wait 30 seconds for workflows to start
3. CHECK status via WebFetch (GitHub Actions page or API)
4. IF any workflow still "in_progress" or "queued":
   - Wait 60 seconds
   - Check again
   - Repeat until all complete or timeout (15 minutes max)
5. IF all workflows complete:
   - Report final status (passed/failed)
   - If any failed, analyze errors and fix
```

### WebFetch URLs:
- Actions page: `https://github.com/{owner}/{repo}/actions`
- API (runs): `https://api.github.com/repos/{owner}/{repo}/actions/runs?per_page=10`
- Specific run: `https://api.github.com/repos/{owner}/{repo}/actions/runs/{run_id}`

### CRITICAL: Never wait more than 60 seconds between status checks!

### GitHub Token for API Access

A GitHub Personal Access Token is stored in `.env` at the project root (gitignored).

**To use the token for API calls:**
```bash
# Load token from .env
export GITHUB_TOKEN=$(grep GITHUB_TOKEN .env | cut -d'=' -f2)

# Use with curl for authenticated API calls
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
  "https://api.github.com/repos/mehdic/CDC/actions/runs"

# Use for downloading workflow logs
curl -L -H "Authorization: Bearer $GITHUB_TOKEN" \
  "https://api.github.com/repos/mehdic/CDC/actions/runs/{run_id}/logs" \
  -o logs.zip
```

**Token capabilities:** workflow logs, workflow dispatch, repo read access.

---
