/**
 * Data Auditor
 * T8-067: Pre-migration data audit and analysis tools
 *
 * Provides comprehensive data analysis before migration to identify
 * potential issues, calculate quality metrics, and generate audit reports.
 * Critical for healthcare data with zero data loss guarantee.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  DataAuditReport,
  TableAuditInfo,
  ColumnAuditInfo,
  ForeignKeyInfo,
  IndexInfo,
  DataAuditIssue,
  DataAuditIssueType,
  ValidationSeverity,
  DatabaseTransaction,
  MigrationLogger,
} from './types';

// ============================================================================
// Data Auditor Implementation
// ============================================================================

export class DataAuditor {
  private logger: MigrationLogger;

  constructor(logger: MigrationLogger) {
    this.logger = logger;
  }

  // ============================================================================
  // Main Audit Methods
  // ============================================================================

  /**
   * Generate a comprehensive audit report for specified tables
   * @param transaction - Database transaction
   * @param tables - Tables to audit (empty = all tables)
   */
  async generateAuditReport(
    transaction: DatabaseTransaction,
    tables?: string[]
  ): Promise<DataAuditReport> {
    const reportId = uuidv4();
    const startTime = Date.now();

    this.logger.info('Starting data audit', { reportId, tables });

    // Get list of tables to audit
    const tablesToAudit = tables || await this.getAllTables(transaction);
    this.logger.info(`Auditing ${tablesToAudit.length} tables`);

    // Audit each table
    const tableInfos: TableAuditInfo[] = [];
    const allIssues: DataAuditIssue[] = [];

    for (const tableName of tablesToAudit) {
      try {
        const tableInfo = await this.auditTable(transaction, tableName);
        tableInfos.push(tableInfo);

        const issues = await this.detectTableIssues(transaction, tableName, tableInfo);
        allIssues.push(...issues);
      } catch (error) {
        this.logger.error(`Failed to audit table ${tableName}`, error as Error);
        allIssues.push({
          severity: ValidationSeverity.ERROR,
          table: tableName,
          type: DataAuditIssueType.DATA_INCONSISTENCY,
          description: `Failed to audit table: ${(error as Error).message}`,
          affectedRows: 0,
        });
      }
    }

    // Calculate overall quality score
    const qualityScore = this.calculateQualityScore(tableInfos, allIssues);

    // Generate recommendations
    const recommendations = this.generateRecommendations(allIssues);

    const report: DataAuditReport = {
      id: reportId,
      tables: tableInfos,
      qualityScore,
      issues: allIssues,
      recommendations,
      generatedAt: new Date(),
    };

    const duration = Date.now() - startTime;
    this.logger.info('Data audit completed', {
      reportId,
      tablesAudited: tableInfos.length,
      issuesFound: allIssues.length,
      qualityScore,
      durationMs: duration,
    });

    return report;
  }

  /**
   * Audit a single table
   */
  async auditTable(
    transaction: DatabaseTransaction,
    tableName: string
  ): Promise<TableAuditInfo> {
    this.logger.debug(`Auditing table: ${tableName}`);

    // Get row count
    const rowCount = await this.getRowCount(transaction, tableName);

    // Get column information
    const columns = await this.getColumnInfo(transaction, tableName);

    // Calculate table checksum
    const checksum = await this.calculateTableChecksum(transaction, tableName);

    // Get foreign key information
    const foreignKeys = await this.getForeignKeys(transaction, tableName);

    // Get index information
    const indexes = await this.getIndexes(transaction, tableName);

    return {
      name: tableName,
      rowCount,
      columns,
      checksum,
      foreignKeys,
      indexes,
    };
  }

  // ============================================================================
  // Data Collection Methods
  // ============================================================================

  private async getAllTables(transaction: DatabaseTransaction): Promise<string[]> {
    const sql = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const results = await transaction.query<{ table_name: string }>(sql);
    return results.map(r => r.table_name);
  }

  private async getRowCount(
    transaction: DatabaseTransaction,
    tableName: string
  ): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM "${tableName}"`;
    const result = await transaction.queryOne<{ count: string }>(sql);
    return parseInt(result?.count || '0', 10);
  }

  private async getColumnInfo(
    transaction: DatabaseTransaction,
    tableName: string
  ): Promise<ColumnAuditInfo[]> {
    // Get column metadata
    const metadataSql = `
      SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
    `;

    const metadata = await transaction.query<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>(metadataSql, [tableName]);

    const columns: ColumnAuditInfo[] = [];

    for (const col of metadata) {
      // Get column statistics
      const statsSql = `
        SELECT
          COUNT(*) as total_count,
          COUNT("${col.column_name}") as non_null_count,
          COUNT(DISTINCT "${col.column_name}") as distinct_count
        FROM "${tableName}"
      `;

      const stats = await transaction.queryOne<{
        total_count: string;
        non_null_count: string;
        distinct_count: string;
      }>(statsSql);

      const totalCount = parseInt(stats?.total_count || '0', 10);
      const nonNullCount = parseInt(stats?.non_null_count || '0', 10);
      const distinctCount = parseInt(stats?.distinct_count || '0', 10);

      // Get sample values
      const sampleSql = `
        SELECT DISTINCT "${col.column_name}" as value
        FROM "${tableName}"
        WHERE "${col.column_name}" IS NOT NULL
        LIMIT 5
      `;

      const samples = await transaction.query<{ value: unknown }>(sampleSql);

      // Get min/max/avg for numeric columns
      let minValue: unknown;
      let maxValue: unknown;
      let avgValue: number | undefined;

      if (['integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision'].includes(col.data_type)) {
        const numericStatsSql = `
          SELECT
            MIN("${col.column_name}") as min_val,
            MAX("${col.column_name}") as max_val,
            AVG("${col.column_name}")::numeric as avg_val
          FROM "${tableName}"
          WHERE "${col.column_name}" IS NOT NULL
        `;

        const numericStats = await transaction.queryOne<{
          min_val: unknown;
          max_val: unknown;
          avg_val: string;
        }>(numericStatsSql);

        minValue = numericStats?.min_val;
        maxValue = numericStats?.max_val;
        avgValue = numericStats?.avg_val ? parseFloat(numericStats.avg_val) : undefined;
      } else if (['timestamp', 'timestamptz', 'date'].includes(col.data_type)) {
        const dateStatsSql = `
          SELECT
            MIN("${col.column_name}") as min_val,
            MAX("${col.column_name}") as max_val
          FROM "${tableName}"
          WHERE "${col.column_name}" IS NOT NULL
        `;

        const dateStats = await transaction.queryOne<{
          min_val: unknown;
          max_val: unknown;
        }>(dateStatsSql);

        minValue = dateStats?.min_val;
        maxValue = dateStats?.max_val;
      }

      columns.push({
        name: col.column_name,
        dataType: col.data_type,
        nullable: col.is_nullable === 'YES',
        nullCount: totalCount - nonNullCount,
        distinctCount,
        sampleValues: samples.map(s => s.value),
        minValue,
        maxValue,
        avgValue,
      });
    }

    return columns;
  }

  private async calculateTableChecksum(
    transaction: DatabaseTransaction,
    tableName: string
  ): Promise<string> {
    // Get the primary key column
    const pkSql = `
      SELECT a.attname
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = $1::regclass
        AND i.indisprimary
      LIMIT 1
    `;

    const pkResult = await transaction.queryOne<{ attname: string }>(pkSql, [tableName]);
    const pkColumn = pkResult?.attname || 'id';

    // Calculate checksum using MD5 of all row data
    const checksumSql = `
      SELECT MD5(STRING_AGG(t::text, '' ORDER BY "${pkColumn}")) as checksum
      FROM "${tableName}" t
    `;

    const result = await transaction.queryOne<{ checksum: string }>(checksumSql);
    return result?.checksum || '';
  }

  private async getForeignKeys(
    transaction: DatabaseTransaction,
    tableName: string
  ): Promise<ForeignKeyInfo[]> {
    const fkSql = `
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1
    `;

    const fks = await transaction.query<{
      constraint_name: string;
      column_name: string;
      foreign_table_name: string;
      foreign_column_name: string;
    }>(fkSql, [tableName]);

    const result: ForeignKeyInfo[] = [];

    for (const fk of fks) {
      // Count orphan records
      const orphanSql = `
        SELECT COUNT(*) as count
        FROM "${tableName}" t
        LEFT JOIN "${fk.foreign_table_name}" f
          ON t."${fk.column_name}" = f."${fk.foreign_column_name}"
        WHERE t."${fk.column_name}" IS NOT NULL
          AND f."${fk.foreign_column_name}" IS NULL
      `;

      const orphanResult = await transaction.queryOne<{ count: string }>(orphanSql);

      result.push({
        name: fk.constraint_name,
        column: fk.column_name,
        referenceTable: fk.foreign_table_name,
        referenceColumn: fk.foreign_column_name,
        orphanCount: parseInt(orphanResult?.count || '0', 10),
      });
    }

    return result;
  }

  private async getIndexes(
    transaction: DatabaseTransaction,
    tableName: string
  ): Promise<IndexInfo[]> {
    const indexSql = `
      SELECT
        i.relname as index_name,
        a.attname as column_name,
        ix.indisunique as is_unique,
        am.amname as index_type
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      JOIN pg_am am ON am.oid = i.relam
      WHERE t.relname = $1
        AND t.relkind = 'r'
      ORDER BY i.relname, a.attnum
    `;

    const indexes = await transaction.query<{
      index_name: string;
      column_name: string;
      is_unique: boolean;
      index_type: string;
    }>(indexSql, [tableName]);

    // Group by index name
    const indexMap = new Map<string, IndexInfo>();

    for (const idx of indexes) {
      if (!indexMap.has(idx.index_name)) {
        indexMap.set(idx.index_name, {
          name: idx.index_name,
          columns: [],
          unique: idx.is_unique,
          type: idx.index_type,
        });
      }
      indexMap.get(idx.index_name)!.columns.push(idx.column_name);
    }

    return Array.from(indexMap.values());
  }

  // ============================================================================
  // Issue Detection Methods
  // ============================================================================

  private async detectTableIssues(
    transaction: DatabaseTransaction,
    tableName: string,
    tableInfo: TableAuditInfo
  ): Promise<DataAuditIssue[]> {
    const issues: DataAuditIssue[] = [];

    // Check for orphan records in foreign keys
    for (const fk of tableInfo.foreignKeys) {
      if (fk.orphanCount > 0) {
        issues.push({
          severity: ValidationSeverity.ERROR,
          table: tableName,
          column: fk.column,
          type: DataAuditIssueType.ORPHAN_RECORDS,
          description: `${fk.orphanCount} orphan records found (missing reference to ${fk.referenceTable}.${fk.referenceColumn})`,
          affectedRows: fk.orphanCount,
        });
      }
    }

    // Check for NULL values in columns that should be required
    for (const col of tableInfo.columns) {
      // Check for high NULL ratio in non-nullable looking columns
      const nullRatio = tableInfo.rowCount > 0
        ? col.nullCount / tableInfo.rowCount
        : 0;

      if (!col.nullable && col.nullCount > 0) {
        issues.push({
          severity: ValidationSeverity.ERROR,
          table: tableName,
          column: col.name,
          type: DataAuditIssueType.NULL_IN_REQUIRED,
          description: `${col.nullCount} NULL values in non-nullable column`,
          affectedRows: col.nullCount,
        });
      } else if (nullRatio > 0.5 && nullRatio < 1) {
        issues.push({
          severity: ValidationSeverity.WARNING,
          table: tableName,
          column: col.name,
          type: DataAuditIssueType.NULL_IN_REQUIRED,
          description: `High NULL ratio (${(nullRatio * 100).toFixed(1)}%) - consider if this column should be required`,
          affectedRows: col.nullCount,
        });
      }

      // Check for potential duplicate issues
      if (col.name.toLowerCase().includes('email') ||
          col.name.toLowerCase().includes('code') ||
          col.name.toLowerCase().includes('number')) {
        const duplicates = await this.checkDuplicates(transaction, tableName, col.name);
        if (duplicates.count > 0) {
          issues.push({
            severity: ValidationSeverity.WARNING,
            table: tableName,
            column: col.name,
            type: DataAuditIssueType.DUPLICATE_VALUES,
            description: `${duplicates.count} duplicate values found in ${col.name}`,
            affectedRows: duplicates.affectedRows,
            sampleRows: duplicates.samples,
          });
        }
      }
    }

    // Check for missing indexes on foreign key columns
    const fkColumns = new Set(tableInfo.foreignKeys.map(fk => fk.column));
    const indexedColumns = new Set(tableInfo.indexes.flatMap(idx => idx.columns));

    for (const fkColumn of fkColumns) {
      if (!indexedColumns.has(fkColumn)) {
        issues.push({
          severity: ValidationSeverity.WARNING,
          table: tableName,
          column: fkColumn,
          type: DataAuditIssueType.MISSING_INDEX,
          description: `Foreign key column ${fkColumn} is not indexed - may cause slow joins`,
          affectedRows: 0,
        });
      }
    }

    // Check for data format issues (email, phone, etc.)
    for (const col of tableInfo.columns) {
      if (col.name.toLowerCase().includes('email')) {
        const invalidEmails = await this.checkEmailFormat(transaction, tableName, col.name);
        if (invalidEmails > 0) {
          issues.push({
            severity: ValidationSeverity.ERROR,
            table: tableName,
            column: col.name,
            type: DataAuditIssueType.INVALID_FORMAT,
            description: `${invalidEmails} invalid email addresses found`,
            affectedRows: invalidEmails,
          });
        }
      }

      if (col.name.toLowerCase().includes('phone')) {
        const invalidPhones = await this.checkPhoneFormat(transaction, tableName, col.name);
        if (invalidPhones > 0) {
          issues.push({
            severity: ValidationSeverity.WARNING,
            table: tableName,
            column: col.name,
            type: DataAuditIssueType.INVALID_FORMAT,
            description: `${invalidPhones} potentially invalid phone numbers found`,
            affectedRows: invalidPhones,
          });
        }
      }
    }

    return issues;
  }

  private async checkDuplicates(
    transaction: DatabaseTransaction,
    tableName: string,
    columnName: string
  ): Promise<{ count: number; affectedRows: number; samples: unknown[] }> {
    const sql = `
      SELECT "${columnName}" as value, COUNT(*) as cnt
      FROM "${tableName}"
      WHERE "${columnName}" IS NOT NULL
      GROUP BY "${columnName}"
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
      LIMIT 5
    `;

    const results = await transaction.query<{ value: unknown; cnt: string }>(sql);

    const count = results.length;
    const affectedRows = results.reduce((sum, r) => sum + parseInt(r.cnt, 10), 0);
    const samples = results.map(r => r.value);

    return { count, affectedRows, samples };
  }

  private async checkEmailFormat(
    transaction: DatabaseTransaction,
    tableName: string,
    columnName: string
  ): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count
      FROM "${tableName}"
      WHERE "${columnName}" IS NOT NULL
        AND "${columnName}"::text !~ '^[^@]+@[^@]+\\.[^@]+$'
    `;

    const result = await transaction.queryOne<{ count: string }>(sql);
    return parseInt(result?.count || '0', 10);
  }

  private async checkPhoneFormat(
    transaction: DatabaseTransaction,
    tableName: string,
    columnName: string
  ): Promise<number> {
    // Check for phones that don't match common formats
    const sql = `
      SELECT COUNT(*) as count
      FROM "${tableName}"
      WHERE "${columnName}" IS NOT NULL
        AND "${columnName}"::text !~ '^\\+?[0-9\\s\\-\\(\\)]{7,20}$'
    `;

    const result = await transaction.queryOne<{ count: string }>(sql);
    return parseInt(result?.count || '0', 10);
  }

  // ============================================================================
  // Quality Score Calculation
  // ============================================================================

  private calculateQualityScore(
    tables: TableAuditInfo[],
    issues: DataAuditIssue[]
  ): number {
    if (tables.length === 0) {
      return 100;
    }

    let score = 100;

    // Deduct points for each issue based on severity
    for (const issue of issues) {
      switch (issue.severity) {
        case ValidationSeverity.ERROR:
          score -= 10;
          break;
        case ValidationSeverity.WARNING:
          score -= 3;
          break;
        case ValidationSeverity.INFO:
          score -= 1;
          break;
      }
    }

    // Calculate average null ratio penalty
    const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);
    const totalNulls = tables.reduce((sum, t) =>
      sum + t.columns.reduce((colSum, c) => colSum + c.nullCount, 0), 0
    );

    if (totalRows > 0) {
      const nullRatio = totalNulls / totalRows;
      score -= Math.min(20, nullRatio * 50);
    }

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // ============================================================================
  // Recommendations Generation
  // ============================================================================

  private generateRecommendations(issues: DataAuditIssue[]): string[] {
    const recommendations: string[] = [];
    const issueTypes = new Set(issues.map(i => i.type));

    if (issueTypes.has(DataAuditIssueType.ORPHAN_RECORDS)) {
      recommendations.push(
        'CRITICAL: Orphan records detected. Clean up orphan records before migration ' +
        'or implement CASCADE DELETE to handle them automatically.'
      );
    }

    if (issueTypes.has(DataAuditIssueType.NULL_IN_REQUIRED)) {
      recommendations.push(
        'Address NULL values in non-nullable columns before migration. ' +
        'Consider adding default values or cleaning up the data.'
      );
    }

    if (issueTypes.has(DataAuditIssueType.DUPLICATE_VALUES)) {
      recommendations.push(
        'Review and resolve duplicate values before migration, especially ' +
        'in columns that should be unique (email, codes, identifiers).'
      );
    }

    if (issueTypes.has(DataAuditIssueType.MISSING_INDEX)) {
      recommendations.push(
        'Add indexes on foreign key columns to improve migration performance ' +
        'and overall query efficiency.'
      );
    }

    if (issueTypes.has(DataAuditIssueType.INVALID_FORMAT)) {
      recommendations.push(
        'Clean up invalid data formats (emails, phone numbers) before migration ' +
        'to ensure data quality in the target system.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Data quality looks good. No critical issues detected.');
    }

    return recommendations;
  }

  // ============================================================================
  // Additional Audit Methods
  // ============================================================================

  /**
   * Compare data between source and target (for verification)
   */
  async compareData(
    sourceTransaction: DatabaseTransaction,
    targetTransaction: DatabaseTransaction,
    tableName: string
  ): Promise<{
    match: boolean;
    sourceCount: number;
    targetCount: number;
    checksumMatch: boolean;
    differences: string[];
  }> {
    const sourceCount = await this.getRowCount(sourceTransaction, tableName);
    const targetCount = await this.getRowCount(targetTransaction, tableName);

    const sourceChecksum = await this.calculateTableChecksum(sourceTransaction, tableName);
    const targetChecksum = await this.calculateTableChecksum(targetTransaction, tableName);

    const differences: string[] = [];

    if (sourceCount !== targetCount) {
      differences.push(`Row count mismatch: source=${sourceCount}, target=${targetCount}`);
    }

    if (sourceChecksum !== targetChecksum) {
      differences.push('Checksum mismatch: data content differs');
    }

    return {
      match: differences.length === 0,
      sourceCount,
      targetCount,
      checksumMatch: sourceChecksum === targetChecksum,
      differences,
    };
  }

  /**
   * Generate a data fingerprint for a table (for quick comparison)
   */
  async generateFingerprint(
    transaction: DatabaseTransaction,
    tableName: string
  ): Promise<{
    tableName: string;
    rowCount: number;
    checksum: string;
    timestamp: Date;
  }> {
    const rowCount = await this.getRowCount(transaction, tableName);
    const checksum = await this.calculateTableChecksum(transaction, tableName);

    return {
      tableName,
      rowCount,
      checksum,
      timestamp: new Date(),
    };
  }
}

// ============================================================================
// Export
// ============================================================================

export default DataAuditor;
