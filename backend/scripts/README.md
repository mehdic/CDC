# Backend Test Scripts

This directory contains utility scripts for running E2E and contract tests.

## Available Scripts

### 1. `start-services-for-tests.sh`

Starts the minimum required services for contract and E2E testing.

**Services started:**
- Auth Service (Port 4001)
- API Gateway (Port 4002)

**Usage:**
```bash
cd /Users/mchaouachi/IdeaProjects/CDC/backend
./scripts/start-services-for-tests.sh
```

**Environment variables set:**
- `NODE_ENV=test`
- `API_BASE_URL=http://localhost:4002`
- `API_GATEWAY_PORT=4002`
- `AUTH_SERVICE_PORT=4001`
- JWT secrets and test configuration

**Logs:**
- Auth Service: `/tmp/auth-service.log`
- API Gateway: `/tmp/api-gateway.log`

**PIDs saved to:**
- `/tmp/metapharm-test-services.pid`

---

### 2. `stop-services-for-tests.sh`

Stops all services started by `start-services-for-tests.sh`.

**Usage:**
```bash
./scripts/stop-services-for-tests.sh
```

**What it does:**
1. Reads PIDs from `/tmp/metapharm-test-services.pid`
2. Gracefully stops each service (SIGTERM)
3. Force kills if needed (SIGKILL)
4. Cleans up log files
5. Removes PID file

**Fallback:**
If PID file not found, searches for processes on ports 4001 and 4002 and kills them.

---

## Quick Start

### Run Contract Tests

```bash
# 1. Start services
./scripts/start-services-for-tests.sh

# 2. Wait for services to be ready (30 seconds)
sleep 30

# 3. Run contract tests
npm run test:contract

# 4. Stop services
./scripts/stop-services-for-tests.sh
```

### Run E2E Tests

```bash
# 1. Start services
./scripts/start-services-for-tests.sh

# 2. Run E2E tests
npm run test:e2e

# 3. Stop services
./scripts/stop-services-for-tests.sh
```

---

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

```bash
# Find and kill processes on port 4001
lsof -ti:4001 | xargs kill -9

# Find and kill processes on port 4002
lsof -ti:4002 | xargs kill -9

# Or use the stop script
./scripts/stop-services-for-tests.sh
```

### Service Failed to Start

Check the logs:

```bash
# Auth Service log
tail -f /tmp/auth-service.log

# API Gateway log
tail -f /tmp/api-gateway.log
```

Common issues:
- Missing dependencies: Run `npm install` in service directories
- Environment variables: Check `.env` files in service directories
- Database connection: E2E tests use in-memory SQLite by default

### Tests Still Failing

1. Verify services are running:
   ```bash
   curl http://localhost:4001/health
   curl http://localhost:4002/health
   ```

2. Check service PIDs:
   ```bash
   cat /tmp/metapharm-test-services.pid
   ps aux | grep <PID>
   ```

3. Restart services:
   ```bash
   ./scripts/stop-services-for-tests.sh
   ./scripts/start-services-for-tests.sh
   ```

---

## Manual Service Control

### Start Individual Services

**Auth Service:**
```bash
cd services/auth-service
export AUTH_SERVICE_PORT=4001
npm run dev
```

**API Gateway:**
```bash
cd services/api-gateway
export API_GATEWAY_PORT=4002
npm run dev
```

### Stop Individual Services

```bash
# Find PID
lsof -ti:4001  # Auth Service
lsof -ti:4002  # API Gateway

# Kill process
kill <PID>
```

---

## Notes

- Services run in development mode (`npm run dev`)
- Logs are written to `/tmp/`
- Use in-memory SQLite for E2E tests (no PostgreSQL required)
- Mock tokens are used by default in contract tests
- For full integration, start all microservices and seed test database

---

## See Also

- [Contract Test Setup Guide](../../docs/contract-test-setup.md)
- [E2E Testing Documentation](../tests/README.md)
- [API Gateway README](../services/api-gateway/README.md)
