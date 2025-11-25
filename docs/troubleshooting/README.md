# Troubleshooting Guide

Common issues and solutions for MetaPharm Connect.

## Quick Navigation

- [Installation Issues](#installation-issues)
- [Development Issues](#development-issues)
- [Database Issues](#database-issues)
- [Authentication Issues](#authentication-issues)
- [Performance Issues](#performance-issues)
- [Deployment Issues](#deployment-issues)
- [Mobile App Issues](#mobile-app-issues)
- [Contact & Support](#contact--support)

## Installation Issues

### Issue: npm install fails with permission error

**Error**:
```
npm ERR! Error: EACCES: permission denied, open '/usr/local/lib/node_modules'
```

**Solution**:
```bash
# Option 1: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Option 2: Use nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Issue: Cannot find module errors

**Error**:
```
Error: Cannot find module 'express'
```

**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# For specific package
npm install --save express
```

### Issue: Node version mismatch

**Error**:
```
The engine "node" is incompatible with this package: expected 18.0.0
```

**Solution**:
```bash
# Check Node version
node --version

# Switch Node version (using nvm)
nvm list                # See available versions
nvm install 18.0.0     # Install required version
nvm use 18.0.0         # Switch to version
```

## Development Issues

### Issue: Port already in use

**Error**:
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution**:
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=5001 npm run dev
```

### Issue: Hot reload not working

**Problem**: Changes aren't reflected without restart

**Solution**:
```bash
# Check nodemon is installed
npm list nodemon

# Verify tsconfig.json has proper config
cat backend/tsconfig.json

# Check webpack/watch settings
npm run dev -- --watch
```

### Issue: TypeScript compilation errors

**Error**:
```
src/utils/helpers.ts(45,10): error TS2339: Property 'x' does not exist on type 'Y'
```

**Solution**:
```bash
# Check types are imported
import { User } from '../types';

# Update types definition
# File: src/types/models.ts

# Recompile
npm run build

# Check tsconfig strictness
cat tsconfig.json | grep strict
```

### Issue: Git conflicts during merge

**Error**:
```
CONFLICT (content): Merge conflict in file.ts
```

**Solution**:
```bash
# View conflicts
git status

# Edit file manually or use tool
# VS Code: Click "Accept Current Change" / "Accept Incoming Change"

# After resolving
git add .
git commit -m "resolve: merge conflicts"
```

## Database Issues

### Issue: Cannot connect to PostgreSQL

**Error**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**:
```bash
# Check if PostgreSQL is running
ps aux | grep postgres

# Start PostgreSQL (macOS)
brew services start postgresql

# Start PostgreSQL (Linux)
sudo systemctl start postgresql

# Check connection string
echo $DATABASE_URL

# Test connection
psql postgresql://user:password@localhost:5432/metapharm_dev
```

### Issue: Database migration fails

**Error**:
```
ERROR: column "email" of relation "users" already exists
```

**Solution**:
```bash
# Check migration status
npm run migration:status

# View migration history
psql -c "SELECT * FROM schema_migrations;"

# Revert last migration
npm run migration:down

# Edit migration and retry
npm run migration:up
```

### Issue: Port 5432 in use by another process

**Solution**:
```bash
# Find process
lsof -i :5432

# Stop other PostgreSQL instance
pg_ctl stop -D /usr/local/var/postgres

# Start clean
pg_ctl start -D /usr/local/var/postgres
```

### Issue: Seed data not loading

**Error**:
```
Error: ENOENT: no such file or directory, open './seeds/users.json'
```

**Solution**:
```bash
# Check seed directory exists
ls -la backend/seeds/

# Verify seed file path in package.json
cat backend/package.json | grep seed

# Run with correct path
npm run seed -- --dir ./seeds
```

## Authentication Issues

### Issue: JWT token expired errors

**Error**:
```
Error: jwt expired
```

**Solution**:
```bash
# Check token expiration in code
// src/middleware/auth.ts
const decoded = jwt.verify(token, process.env.JWT_SECRET);

# Increase token expiry
// Change from 1h to 24h
const token = jwt.sign(payload, secret, { expiresIn: '24h' });

# Client: Implement token refresh
const refreshToken = async () => {
  const response = await fetch('/auth/refresh', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${refreshToken}` }
  });
  return response.json().accessToken;
};
```

### Issue: CORS errors on login

**Error**:
```
Access to XMLHttpRequest at 'http://localhost:5000/auth/login'
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution**:
```bash
# Check backend CORS configuration
cat backend/src/middleware/cors.ts

# Update .env to include frontend origin
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Restart backend
npm run dev

# Verify headers in response
curl -i http://localhost:5000/auth/login
```

### Issue: Invalid credentials

**Error**:
```
Error: Invalid email or password
```

**Solution**:
```bash
# Check user exists in database
psql -d metapharm_dev -c "SELECT id, email FROM users WHERE email='user@example.com';"

# Check password hash
# Password should be hashed with bcrypt
const password = 'mypassword';
const hashedPassword = await bcrypt.hash(password, 10);

# Test login with curl
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

## Performance Issues

### Issue: Slow API responses

**Symptoms**: Requests taking >1 second

**Debugging**:
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/api/users

# Monitor in code
console.time('getUsersQuery');
const users = await User.find();
console.timeEnd('getUsersQuery');

# Check database indexes
psql -d metapharm_dev -c "SELECT * FROM pg_stat_user_indexes;"

# Monitor server resources
top
# or
htop
```

**Solutions**:
```typescript
// 1. Add database indexes
CREATE INDEX idx_users_email ON users(email);

// 2. Use pagination
const users = await User.find()
  .limit(10)
  .offset(0);

// 3. Implement caching
const users = await redis.get('all-users');
if (!users) {
  users = await User.find();
  await redis.set('all-users', JSON.stringify(users), 'EX', 3600);
}

// 4. Use select to limit fields
const users = await User.find().select('id email name');

// 5. Implement async operations
Promise.all([
  fetchUsers(),
  fetchDoctors(),
  fetchPharmacies()
])
```

### Issue: High memory usage

**Symptoms**: Process using >500MB RAM

**Debugging**:
```bash
# Check memory usage
node --inspect app.js

# Monitor live
ps aux | grep node

# Find memory leaks
const heapdump = require('heapdump');
heapdump.writeSnapshot(`./heap-${Date.now()}.heapsnapshot`);
```

**Solutions**:
```typescript
// 1. Clear caches periodically
setInterval(() => {
  redis.flushdb();
}, 3600000); // Every hour

// 2. Implement streaming for large datasets
app.get('/api/export', (req, res) => {
  const stream = User.find().stream();
  stream.pipe(res);
});

// 3. Close connections properly
db.close();
redis.quit();
```

### Issue: Database connection pool exhausted

**Error**:
```
Error: Client is already acquiring a resource
```

**Solution**:
```bash
# Check pool configuration
cat backend/.env | grep DATABASE_POOL

# Adjust pool size
DATABASE_POOL_MAX=30
DATABASE_POOL_MIN=10

# Monitor active connections
SELECT count(*) FROM pg_stat_activity;
```

## Deployment Issues

### Issue: Container fails to start in production

**Error**:
```
docker: Error response from daemon: OCI runtime create failed
```

**Solution**:
```bash
# Test container locally first
docker run -p 5000:5000 metapharm-backend:latest

# Check environment variables
docker run -e NODE_ENV=production -e DATABASE_URL=... metapharm-backend:latest

# View logs
docker logs container-id

# Verify image
docker inspect metapharm-backend:latest
```

### Issue: Out of memory in container

**Error**:
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed
```

**Solution**:
```yaml
# Update docker-compose.yml
services:
  backend:
    mem_limit: 1024m
    memswap_limit: 2048m

# Or for Kubernetes
resources:
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

### Issue: Database migration fails in production

**Error**:
```
ERROR: relation "users" already exists
```

**Solution**:
```bash
# Check migration status
kubectl exec -it deployment/backend -- npm run migration:status

# Skip problematic migration if safe
npm run migration:up -- --skip-migration-name

# Or rollback
kubectl exec -it deployment/backend -- npm run migration:down
```

## Mobile App Issues

### Issue: App crashes on startup

**Solution**:
```bash
# Check for runtime errors
npm run test:mobile

# Clear cache
npm run mobile:clean

# Reinstall dependencies
rm -rf node_modules
npm install

# Rebuild
npm run android
# or
npm run ios
```

### Issue: API calls timeout in mobile app

**Solution**:
```javascript
// mobile/src/services/api.js
const API_TIMEOUT = 30000; // 30 seconds

export const apiCall = async (url, options) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};
```

### Issue: OAuth login fails on mobile

**Solution**:
```javascript
// mobile/src/screens/LoginScreen.tsx
import { InAppBrowser } from '@react-native-camera-roll/camera-roll';

const handleOAuthLogin = async () => {
  const authUrl = 'https://auth.metapharm.com/oauth/authorize';
  const redirectUrl = 'com.metapharm://auth-callback';

  const result = await InAppBrowser.openAuth(authUrl, redirectUrl);
  if (result.type === 'success') {
    // Handle token
  }
};
```

## Contact & Support

### Getting Help

1. **Check this guide first** - Most issues are covered above
2. **Review logs** - Enable debug logging and check output
3. **Search GitHub Issues** - Your problem may already be solved
4. **Ask in Slack** - Post in #dev-support channel
5. **Schedule pairing session** - For complex issues

### Useful Commands for Debugging

```bash
# Backend logs
npm run dev -- --verbose

# Database logs
psql -f logs.sql

# Network debugging
curl -v http://localhost:5000

# System monitoring
top
iostat -x 1 5

# Docker debugging
docker exec -it container-id /bin/bash

# Kubernetes debugging
kubectl logs -f deployment/metapharm-backend
kubectl describe pod pod-name
kubectl exec -it pod-name -- /bin/bash
```

### Escalation Path

- **Level 1**: Check this guide
- **Level 2**: Ask senior developer in Slack
- **Level 3**: Create GitHub Issue with reproduction steps
- **Level 4**: Schedule incident post-mortem

---

**Still stuck?** Message #dev-support on Slack or create an issue on GitHub.

**Happy debugging! 🐛**
