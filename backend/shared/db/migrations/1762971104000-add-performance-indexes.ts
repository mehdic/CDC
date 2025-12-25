/**
 * Performance Indexes Migration
 * Adds optimized indexes for common query patterns
 * T8-061: Database Performance Optimization
 *
 * Index Strategy:
 * - B-tree for equality, range, ORDER BY, GROUP BY
 * - Partial indexes for common status filters
 * - Composite indexes for multi-column queries
 * - GIN indexes for JSONB columns
 *
 * Target: Sub-100ms response times for common queries
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1762971104000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1762971104000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================================================
    // Users Table Indexes
    // ========================================================================

    // Composite index for user lookup by pharmacy and role (common filter)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_pharmacy_role
      ON users (primary_pharmacy_id, role)
      WHERE deleted_at IS NULL
    `);

    // Partial index for active users only (most queries filter by status)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_active
      ON users (id)
      WHERE status = 'active' AND deleted_at IS NULL
    `);

    // Index for login queries (email lookup with status check)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email_active
      ON users (email)
      WHERE status = 'active' AND deleted_at IS NULL
    `);

    // Index for last login analytics
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_last_login
      ON users (last_login_at DESC NULLS LAST)
      WHERE status = 'active'
    `);

    // ========================================================================
    // Products Table Indexes
    // ========================================================================

    // Composite index for product catalog queries (category + active + stock)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_catalog
      ON products (category_id, is_active, stock)
      WHERE is_active = true
    `);

    // Index for product search by name (for autocomplete)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_name_search
      ON products (name varchar_pattern_ops)
      WHERE is_active = true
    `);

    // Index for featured products on homepage
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_featured
      ON products (is_featured, rating DESC)
      WHERE is_active = true AND is_featured = true
    `);

    // Index for low stock alerts
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_low_stock
      ON products (stock, low_stock_threshold)
      WHERE is_active = true AND stock <= low_stock_threshold
    `);

    // Index for prescription products
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_prescription
      ON products (category_id)
      WHERE requires_prescription = true AND is_active = true
    `);

    // ========================================================================
    // Orders Table Indexes
    // ========================================================================

    // Composite index for pharmacy order management (multi-tenant + status)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_pharmacy_status
      ON orders (pharmacy_id, status, created_at DESC)
    `);

    // Composite index for user order history
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_user_history
      ON orders (user_id, created_at DESC)
    `);

    // Index for pending orders requiring attention
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_pending
      ON orders (pharmacy_id, created_at)
      WHERE status = 'pending'
    `);

    // Index for payment reconciliation
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_payment
      ON orders (payment_status, paid_at)
      WHERE payment_status != 'pending'
    `);

    // GIN index for order items JSONB (searching within items)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_items_gin
      ON orders USING GIN (items jsonb_path_ops)
    `);

    // ========================================================================
    // Prescriptions Table Indexes
    // ========================================================================

    // Composite index for pharmacy prescription queue
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_prescriptions_queue
      ON prescriptions (pharmacy_id, status, created_at DESC)
    `);

    // Index for patient prescription history
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_prescriptions_patient
      ON prescriptions (patient_id, created_at DESC)
    `);

    // Index for prescriptions requiring attention
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_prescriptions_pending
      ON prescriptions (pharmacy_id, created_at)
      WHERE status IN ('pending', 'in_review', 'clarification_needed')
    `);

    // Index for pharmacist workload
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_prescriptions_pharmacist
      ON prescriptions (pharmacist_id, status)
      WHERE pharmacist_id IS NOT NULL
    `);

    // GIN indexes for JSONB safety check columns
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_prescriptions_interactions_gin
      ON prescriptions USING GIN (drug_interactions jsonb_path_ops)
      WHERE drug_interactions IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_prescriptions_allergies_gin
      ON prescriptions USING GIN (allergy_warnings jsonb_path_ops)
      WHERE allergy_warnings IS NOT NULL
    `);

    // ========================================================================
    // VIP Memberships Table Indexes
    // ========================================================================

    // Index for tier-based queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vip_tier_active
      ON vip_memberships (tier, is_active)
      WHERE is_active = true
    `);

    // Index for points expiry checks
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vip_expiry
      ON vip_memberships (next_tier_expiry)
      WHERE is_active = true AND next_tier_expiry IS NOT NULL
    `);

    // ========================================================================
    // Audit Trail Indexes
    // ========================================================================

    // Check if audit_trail_entries table exists before creating indexes
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_trail_entries') THEN
          -- Composite index for audit log queries
          CREATE INDEX IF NOT EXISTS idx_audit_user_date
          ON audit_trail_entries (user_id, created_at DESC);

          -- Index for compliance audits by entity
          CREATE INDEX IF NOT EXISTS idx_audit_entity
          ON audit_trail_entries (entity_type, entity_id, created_at DESC);
        END IF;
      END $$;
    `);

    // ========================================================================
    // Delivery Table Indexes
    // ========================================================================

    // Check if deliveries table exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'deliveries') THEN
          -- Index for driver deliveries
          CREATE INDEX IF NOT EXISTS idx_deliveries_driver
          ON deliveries (driver_id, status, scheduled_at);

          -- Index for active deliveries requiring tracking
          CREATE INDEX IF NOT EXISTS idx_deliveries_active
          ON deliveries (status, scheduled_at)
          WHERE status IN ('assigned', 'in_transit', 'arriving');
        END IF;
      END $$;
    `);

    // ========================================================================
    // Inventory Indexes
    // ========================================================================

    // Check if inventory_items table exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inventory_items') THEN
          -- Composite index for pharmacy inventory lookup
          CREATE INDEX IF NOT EXISTS idx_inventory_pharmacy_product
          ON inventory_items (pharmacy_id, product_id);

          -- Index for expiring inventory alerts
          CREATE INDEX IF NOT EXISTS idx_inventory_expiring
          ON inventory_items (pharmacy_id, expiry_date)
          WHERE expiry_date IS NOT NULL;
        END IF;
      END $$;
    `);

    // ========================================================================
    // Query Result Cache Table (for TypeORM cache)
    // ========================================================================

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS query_result_cache (
        id SERIAL PRIMARY KEY,
        identifier VARCHAR(255) NOT NULL,
        time BIGINT NOT NULL,
        duration INTEGER NOT NULL,
        query TEXT NOT NULL,
        result TEXT NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_query_cache_identifier
      ON query_result_cache (identifier)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_query_cache_time
      ON query_result_cache (time)
    `);

    // ========================================================================
    // Enable pg_stat_statements extension (if superuser)
    // ========================================================================

    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
      EXCEPTION
        WHEN insufficient_privilege THEN
          RAISE NOTICE 'Insufficient privileges to create pg_stat_statements extension. Skipping.';
      END $$;
    `);

    // ========================================================================
    // Analyze tables to update statistics
    // ========================================================================

    await queryRunner.query(`ANALYZE users`);
    await queryRunner.query(`ANALYZE products`);
    await queryRunner.query(`ANALYZE orders`);
    await queryRunner.query(`ANALYZE prescriptions`);
    await queryRunner.query(`ANALYZE vip_memberships`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ========================================================================
    // Remove Indexes (in reverse order)
    // ========================================================================

    // Users
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_pharmacy_role`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_active`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_email_active`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_last_login`);

    // Products
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_catalog`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_name_search`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_featured`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_low_stock`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_prescription`);

    // Orders
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_pharmacy_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_user_history`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_pending`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_payment`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_items_gin`);

    // Prescriptions
    await queryRunner.query(`DROP INDEX IF EXISTS idx_prescriptions_queue`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_prescriptions_patient`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_prescriptions_pending`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_prescriptions_pharmacist`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_prescriptions_interactions_gin`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_prescriptions_allergies_gin`);

    // VIP
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vip_tier_active`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vip_expiry`);

    // Audit
    await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_user_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_entity`);

    // Delivery
    await queryRunner.query(`DROP INDEX IF EXISTS idx_deliveries_driver`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_deliveries_active`);

    // Inventory
    await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_pharmacy_product`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_expiring`);

    // Query cache
    await queryRunner.query(`DROP INDEX IF EXISTS idx_query_cache_identifier`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_query_cache_time`);
    await queryRunner.query(`DROP TABLE IF EXISTS query_result_cache`);
  }
}
