# Project Manager Assignment - Test Infrastructure Fixing

**Session:** bazinga_20251120_195230
**Assigned To:** Project Manager
**Created:** 2025-11-20T19:52:30Z

## User Request
Fix test infrastructure issues in MetaPharm Connect backend

## Current State
- 77 failing tests (12.1% failure rate)
- 560 passing tests (87.9% pass rate)
- Build succeeds, core functionality works

## Problems Identified

### Priority 1: TypeORM Decorator Issues
- **Error:** "Class decorator is not a function" in entity models
- **Affected:** Pharmacy, User, and other entity models
- **Likely causes:** reflect-metadata import order, tsconfig decorator settings

### Priority 2: OpenTelemetry Configuration
- **Error:** "createContextKey is not a function" in tracing tests
- **Affected:** tracing.test.ts and monitoring tests
- **Likely causes:** OTEL package versions, missing mocks

### Priority 3: AWS KMS Mock Setup
- **Error:** KMS.generateDataKey() returns undefined
- **Affected:** Encryption service tests
- **Likely causes:** Incomplete AWS SDK mocks

### Priority 4: Module Resolution
- **Error:** Cannot find module in some tests
- **Affected:** delivery-service, auth-service integration tests
- **Likely causes:** Jest moduleNameMapper, tsconfig paths misalignment

## Success Criteria
- Reduce failing tests from 77 to under 50
- No new test failures introduced
- Build continues to succeed
- Document any remaining blockers

## Your Tasks
1. Analyze the test infrastructure issues
2. Break down into logical task groups (by priority/category)
3. Decide execution mode (simple/parallel)
4. Create implementation plan for Developer(s)

## Initial Context
- Backend location: /Users/mchaouachi/IdeaProjects/CDC/backend
- Test command: `cd backend && npm test`
- First step should be running tests to see current state
