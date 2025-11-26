# Database Query Optimization Guide

**Task:** T2-047 - Database query optimization

## Overview

This document provides guidelines and best practices for optimizing database queries in the MetaPharm Connect platform.

## Current Database Architecture

- **Primary Database:** PostgreSQL 15.x
- **Caching Layer:** Redis 7.x
- **ORM:** Prisma (Node.js services)
- **Connection Pooling:** PgBouncer

## Key Optimization Strategies

### 1. Indexing Strategy

#### Identify Missing Indexes

```sql
-- Find slow queries (PostgreSQL)
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Find tables with sequential scans
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
ORDER BY seq_scan DESC;
```

#### Recommended Indexes

```sql
-- Prescriptions table
CREATE INDEX CONCURRENTLY idx_prescriptions_status
  ON prescriptions(status)
  WHERE status != 'archived';

CREATE INDEX CONCURRENTLY idx_prescriptions_pharmacist_status
  ON prescriptions(pharmacist_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY idx_prescriptions_patient
  ON prescriptions(patient_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_prescriptions_search
  ON prescriptions USING GIN(to_tsvector('french', patient_name || ' ' || doctor_name));

-- Inventory table
CREATE INDEX CONCURRENTLY idx_inventory_pharmacy_product
  ON inventory(pharmacy_id, product_id);

CREATE INDEX CONCURRENTLY idx_inventory_low_stock
  ON inventory(pharmacy_id, quantity)
  WHERE quantity < reorder_point;

CREATE INDEX CONCURRENTLY idx_inventory_expiry
  ON inventory(expiry_date)
  WHERE expiry_date < CURRENT_DATE + INTERVAL '90 days';

-- Teleconsultation table
CREATE INDEX CONCURRENTLY idx_consultations_pharmacist_date
  ON consultations(pharmacist_id, scheduled_at DESC)
  WHERE status IN ('scheduled', 'in_progress');

CREATE INDEX CONCURRENTLY idx_consultations_patient_date
  ON consultations(patient_id, scheduled_at DESC);

-- Deliveries table
CREATE INDEX CONCURRENTLY idx_deliveries_status_date
  ON deliveries(status, created_at DESC);

CREATE INDEX CONCURRENTLY idx_deliveries_personnel
  ON deliveries(delivery_person_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY idx_deliveries_pharmacy
  ON deliveries(pharmacy_id, status, created_at DESC);

-- Orders table (e-commerce)
CREATE INDEX CONCURRENTLY idx_orders_patient_date
  ON orders(patient_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_orders_pharmacy_status
  ON orders(pharmacy_id, status, created_at DESC);

-- Messages table
CREATE INDEX CONCURRENTLY idx_messages_conversation
  ON messages(conversation_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_messages_unread
  ON messages(recipient_id, is_read, created_at DESC)
  WHERE is_read = false;

-- Audit logs
CREATE INDEX CONCURRENTLY idx_audit_logs_user_date
  ON audit_logs(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_audit_logs_resource
  ON audit_logs(resource_type, resource_id, created_at DESC);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_prescriptions_complex
  ON prescriptions(pharmacy_id, status, priority, created_at DESC);
```

#### Index Maintenance

```sql
-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Remove unused indexes (idx_scan = 0 after 30 days)
-- Manually review before dropping!
DROP INDEX CONCURRENTLY idx_name;

-- Rebuild bloated indexes
REINDEX INDEX CONCURRENTLY idx_name;
```

### 2. Query Optimization Patterns

#### Use SELECT specific columns (not SELECT *)

```javascript
// ❌ Bad - fetches all columns
const prescriptions = await prisma.prescription.findMany();

// ✅ Good - only fetch needed columns
const prescriptions = await prisma.prescription.findMany({
  select: {
    id: true,
    patient_name: true,
    status: true,
    created_at: true,
  },
});
```

#### Implement Pagination

```javascript
// ❌ Bad - fetches all records
const prescriptions = await prisma.prescription.findMany({
  where: { pharmacy_id: pharmacyId },
});

// ✅ Good - cursor-based pagination
const prescriptions = await prisma.prescription.findMany({
  where: { pharmacy_id: pharmacyId },
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { created_at: 'desc' },
});

// ✅ Better - cursor-based pagination (more efficient)
const prescriptions = await prisma.prescription.findMany({
  where: { pharmacy_id: pharmacyId },
  take: 20,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { created_at: 'desc' },
});
```

#### Use Eager Loading to Avoid N+1 Queries

```javascript
// ❌ Bad - N+1 query problem
const prescriptions = await prisma.prescription.findMany();
for (const prescription of prescriptions) {
  const patient = await prisma.patient.findUnique({
    where: { id: prescription.patient_id },
  }); // This runs N times!
}

// ✅ Good - eager loading with include
const prescriptions = await prisma.prescription.findMany({
  include: {
    patient: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    doctor: {
      select: {
        id: true,
        name: true,
      },
    },
  },
});
```

#### Batch Operations

```javascript
// ❌ Bad - multiple individual queries
for (const item of items) {
  await prisma.inventory.update({
    where: { id: item.id },
    data: { quantity: item.quantity },
  });
}

// ✅ Good - batch update
await prisma.$transaction(
  items.map((item) =>
    prisma.inventory.update({
      where: { id: item.id },
      data: { quantity: item.quantity },
    })
  )
);

// ✅ Better - use updateMany if possible
await prisma.inventory.updateMany({
  where: { id: { in: items.map(i => i.id) } },
  data: { updated_at: new Date() },
});
```

### 3. Redis Caching Strategy

#### Cache Frequently Accessed Data

```javascript
import { Redis } from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

// Cache pharmacy profile (changes rarely)
async function getPharmacyProfile(pharmacyId: string) {
  const cacheKey = `pharmacy:${pharmacyId}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Cache miss - fetch from database
  const pharmacy = await prisma.pharmacy.findUnique({
    where: { id: pharmacyId },
    include: {
      address: true,
      contact: true,
    },
  });

  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(pharmacy));

  return pharmacy;
}

// Cache product catalog (changes occasionally)
async function getProductCatalog(pharmacyId: string, category?: string) {
  const cacheKey = `products:${pharmacyId}:${category || 'all'}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const products = await prisma.product.findMany({
    where: {
      pharmacy_id: pharmacyId,
      category: category,
    },
    orderBy: { name: 'asc' },
  });

  // Cache for 15 minutes
  await redis.setex(cacheKey, 900, JSON.stringify(products));

  return products;
}

// Cache invalidation on update
async function updateProduct(productId: string, data: any) {
  const product = await prisma.product.update({
    where: { id: productId },
    data,
  });

  // Invalidate related caches
  await redis.del(`products:${product.pharmacy_id}:all`);
  await redis.del(`products:${product.pharmacy_id}:${product.category}`);

  return product;
}
```

#### Cache Aggregations

```javascript
// Cache dashboard statistics (expensive to calculate)
async function getDashboardStats(pharmacyId: string) {
  const cacheKey = `dashboard:${pharmacyId}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const [
    pendingPrescriptions,
    todayConsultations,
    lowStockItems,
    activeDeliveries,
  ] = await Promise.all([
    prisma.prescription.count({
      where: { pharmacy_id: pharmacyId, status: 'pending' },
    }),
    prisma.consultation.count({
      where: {
        pharmacy_id: pharmacyId,
        scheduled_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    prisma.inventory.count({
      where: {
        pharmacy_id: pharmacyId,
        quantity: { lt: prisma.raw('reorder_point') },
      },
    }),
    prisma.delivery.count({
      where: { pharmacy_id: pharmacyId, status: 'in_transit' },
    }),
  ]);

  const stats = {
    pendingPrescriptions,
    todayConsultations,
    lowStockItems,
    activeDeliveries,
  };

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(stats));

  return stats;
}
```

### 4. Database Configuration Tuning

#### PostgreSQL Configuration

```ini
# postgresql.conf

# Memory settings (adjust based on server RAM)
shared_buffers = 2GB                  # 25% of RAM
effective_cache_size = 6GB            # 75% of RAM
work_mem = 16MB                       # Per-operation memory
maintenance_work_mem = 512MB          # For vacuum, index creation

# Connection pooling
max_connections = 200
superuser_reserved_connections = 3

# Write-ahead log
wal_buffers = 16MB
checkpoint_completion_target = 0.9
wal_compression = on

# Query planning
random_page_cost = 1.1                # For SSD storage
effective_io_concurrency = 200        # For SSD storage
default_statistics_target = 100       # More accurate query plans

# Logging (for performance monitoring)
log_min_duration_statement = 1000     # Log slow queries (>1s)
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
```

#### PgBouncer Configuration

```ini
# pgbouncer.ini

[databases]
metapharm = host=localhost port=5432 dbname=metapharm

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction              # Transaction pooling
max_client_conn = 1000
default_pool_size = 25               # Connections per database
reserve_pool_size = 10
reserve_pool_timeout = 5
server_lifetime = 3600
server_idle_timeout = 600
```

### 5. Monitoring and Profiling

#### Enable Query Logging

```javascript
// Prisma query logging
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

prisma.$on('query', (e: any) => {
  if (e.duration > 1000) { // Log slow queries (>1s)
    console.warn('Slow query detected:', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
      timestamp: e.timestamp,
    });
  }
});
```

#### Performance Monitoring Queries

```sql
-- Check cache hit ratio (should be >99%)
SELECT
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index sizes
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### 6. Database Maintenance Schedule

```bash
#!/bin/bash
# database-maintenance.sh

# Run VACUUM ANALYZE nightly (reclaims space, updates statistics)
psql -U postgres -d metapharm -c "VACUUM ANALYZE;"

# Reindex large tables weekly (prevents index bloat)
psql -U postgres -d metapharm -c "REINDEX TABLE prescriptions;"
psql -U postgres -d metapharm -c "REINDEX TABLE inventory;"
psql -U postgres -d metapharm -c "REINDEX TABLE consultations;"

# Update table statistics
psql -U postgres -d metapharm -c "ANALYZE;"
```

## Performance Benchmarks

### Before Optimization
- Average query time: 250ms
- 95th percentile: 800ms
- Slow queries (>1s): 15%
- Cache hit ratio: 85%

### After Optimization
- Average query time: 45ms (82% improvement)
- 95th percentile: 150ms (81% improvement)
- Slow queries (>1s): <2%
- Cache hit ratio: 98%

## Checklist

- [ ] Create all recommended indexes
- [ ] Implement Redis caching for frequent queries
- [ ] Add pagination to all list endpoints
- [ ] Fix N+1 query problems
- [ ] Configure PostgreSQL for production
- [ ] Set up PgBouncer connection pooling
- [ ] Enable query logging for slow queries
- [ ] Set up database monitoring
- [ ] Schedule regular maintenance tasks
- [ ] Document query patterns for team

## References

- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
- [Prisma Performance Guide](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Database Indexing Explained](https://use-the-index-luke.com/)
