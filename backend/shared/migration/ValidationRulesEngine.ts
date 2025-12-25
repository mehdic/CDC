/**
 * Validation Rules Engine
 * T8-067: Data validation framework for healthcare data migrations
 *
 * Provides configurable validation rules to ensure data integrity
 * during migrations. Designed for zero data loss guarantee.
 */

import {
  ValidationRule,
  ValidationRuleType,
  ValidationRuleConfig,
  ValidationResult,
  ValidationViolation,
  ValidationSeverity,
  ValidationEngine,
  DatabaseTransaction,
  DataType,
} from './types';

// ============================================================================
// Validation Rules Engine Implementation
// ============================================================================

export class ValidationRulesEngine implements ValidationEngine {
  private rules: Map<string, ValidationRule> = new Map();
  private customValidators: Map<string, CustomValidatorFn> = new Map();

  constructor() {
    this.registerBuiltInValidators();
  }

  // ============================================================================
  // Rule Management
  // ============================================================================

  /**
   * Add a validation rule
   */
  addRule(rule: ValidationRule): void {
    if (this.rules.has(rule.id)) {
      throw new Error(`Validation rule with ID '${rule.id}' already exists`);
    }
    this.validateRuleConfig(rule);
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove a validation rule
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Get all rules
   */
  getRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rules for a specific table
   */
  getRulesForTable(table: string): ValidationRule[] {
    return Array.from(this.rules.values()).filter(rule => rule.table === table);
  }

  /**
   * Register a custom validator function
   */
  registerCustomValidator(name: string, validator: CustomValidatorFn): void {
    this.customValidators.set(name, validator);
  }

  // ============================================================================
  // Validation Execution
  // ============================================================================

  /**
   * Validate a table against all applicable rules
   */
  async validateTable(
    table: string,
    transaction: DatabaseTransaction
  ): Promise<ValidationResult[]> {
    const tableRules = this.getRulesForTable(table);
    const results: ValidationResult[] = [];

    for (const rule of tableRules) {
      const result = await this.executeRule(rule, transaction);
      results.push(result);
    }

    return results;
  }

  /**
   * Validate all registered tables
   */
  async validateAll(transaction: DatabaseTransaction): Promise<ValidationResult[]> {
    const tables = new Set(Array.from(this.rules.values()).map(r => r.table));
    const results: ValidationResult[] = [];

    for (const table of tables) {
      const tableResults = await this.validateTable(table, transaction);
      results.push(...tableResults);
    }

    return results;
  }

  // ============================================================================
  // Rule Execution
  // ============================================================================

  private async executeRule(
    rule: ValidationRule,
    transaction: DatabaseTransaction
  ): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      switch (rule.type) {
        case ValidationRuleType.NOT_NULL:
          return await this.executeNotNullRule(rule, transaction);

        case ValidationRuleType.DATA_TYPE:
          return await this.executeDataTypeRule(rule, transaction);

        case ValidationRuleType.RANGE:
          return await this.executeRangeRule(rule, transaction);

        case ValidationRuleType.PATTERN:
          return await this.executePatternRule(rule, transaction);

        case ValidationRuleType.UNIQUE:
          return await this.executeUniqueRule(rule, transaction);

        case ValidationRuleType.FOREIGN_KEY:
          return await this.executeForeignKeyRule(rule, transaction);

        case ValidationRuleType.ENUM:
          return await this.executeEnumRule(rule, transaction);

        case ValidationRuleType.LENGTH:
          return await this.executeLengthRule(rule, transaction);

        case ValidationRuleType.ROW_COUNT:
          return await this.executeRowCountRule(rule, transaction);

        case ValidationRuleType.CHECKSUM:
          return await this.executeChecksumRule(rule, transaction);

        case ValidationRuleType.CUSTOM:
          return await this.executeCustomRule(rule, transaction);

        default:
          throw new Error(`Unknown validation rule type: ${rule.type}`);
      }
    } catch (error) {
      return {
        ruleId: rule.id,
        passed: false,
        severity: ValidationSeverity.ERROR,
        table: rule.table,
        column: rule.column,
        violationCount: 0,
        message: `Validation error: ${(error as Error).message}`,
        timestamp: new Date(),
      };
    }
  }

  // ============================================================================
  // Built-in Rule Implementations
  // ============================================================================

  private async executeNotNullRule(
    rule: ValidationRule,
    transaction: DatabaseTransaction
  ): Promise<ValidationResult> {
    if (!rule.column) {
      throw new Error('NOT_NULL rule requires a column');
    }

    const sql = `
      SELECT id, ${this.quoteIdentifier(rule.column)} as value
      FROM ${this.quoteIdentifier(rule.table)}
      WHERE ${this.quoteIdentifier(rule.column)} IS NULL
      LIMIT 100
    `;

    const violations = await transaction.query<{ id: string; value: unknown }>(sql);

    const countSql = `
      SELECT COUNT(*) as count
      FROM ${this.quoteIdentifier(rule.table)}
      WHERE ${this.quoteIdentifier(rule.column)} IS NULL
    `;

    const countResult = await transaction.queryOne<{ count: string }>(countSql);
    const violationCount = parseInt(countResult?.count || '0', 10);

    return {
      ruleId: rule.id,
      passed: violationCount === 0,
      severity: rule.severity,
      table: rule.table,
      column: rule.column,
      violationCount,
      sampleViolations: violations.map(v => ({
        rowId: v.id,
        actualValue: null,
        expectedValue: 'non-null value',
      })),
      message: violationCount === 0
        ? `${rule.column} has no NULL values`
        : `${violationCount} NULL values found in ${rule.column}`,
      timestamp: new Date(),
    };
  }

  private async executeDataTypeRule(
    rule: ValidationRule,
    transaction: DatabaseTransaction
  ): Promise<ValidationResult> {
    if (!rule.column || !rule.config.dataType) {
      throw new Error('DATA_TYPE rule requires column and dataType config');
    }

    const typeCheck = this.getDataTypeCheckSql(rule.config.dataType, rule.column);

    const sql = `
      SELECT id, ${this.quoteIdentifier(rule.column)} as value
      FROM ${this.quoteIdentifier(rule.table)}
      WHERE ${this.quoteIdentifier(rule.column)} IS NOT NULL
        AND NOT (${typeCheck})
      LIMIT 100
    `;

    const violations = await transaction.query<{ id: string; value: unknown }>(sql);

    const countSql = `
      SELECT COUNT(*) as count
      FROM ${this.quoteIdentifier(rule.table)}
      WHERE ${this.quoteIdentifier(rule.column)} IS NOT NULL
        AND NOT (${typeCheck})
    `;

    const countResult = await transaction.queryOne<{ count: string }>(countSql);
    const violationCount = parseInt(countResult?.count || '0', 10);

    return {
      ruleId: rule.id,
      passed: violationCount === 0,
      severity: rule.severity,
      table: rule.table,
      column: rule.column,
      violationCount,
      sampleViolations: violations.map(v => ({
        rowId: v.id,
        actualValue: v.value,
        expectedValue: rule.config.dataType,
      })),
      message: violationCount === 0
        ? `${rule.column} values match expected type ${rule.config.dataType}`
        : `${violationCount} values in ${rule.column} do not match type ${rule.config.dataType}`,
      timestamp: new Date(),
    };
  }

  private async executeRangeRule(
    rule: ValidationRule,
    transaction: DatabaseTransaction
  ): Promise<ValidationResult> {
    if (!rule.column) {
      throw new Error('RANGE rule requires a column');
    }

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (rule.config.min !== undefined) {
      conditions.push(`${this.quoteIdentifier(rule.column)} < $${params.length + 1}`);
      params.push(rule.config.min);
    }

    if (rule.config.max !== undefined) {
      conditions.push(`${this.quoteIdentifier(rule.column)} > $${params.length + 1}`);
      params.push(rule.config.max);
    }

    if (conditions.length === 0) {
      throw new Error('RANGE rule requires min or max config');
    }

    const whereClause = conditions.join(' OR ');

    const sql = `
      SELECT id, ${this.quoteIdentifier(rule.column)} as value
      FROM ${this.quoteIdentifier(rule.table)}
      WHERE ${this.quoteIdentifier(rule.column)} IS NOT NULL
        AND (${whereClause})
      LIMIT 100
    `;

    const violations = await transaction.query<{ id: string; value: unknown }>(sql, params);

    const countSql = `
      SELECT COUNT(*) as count
      FROM ${this.quoteIdentifier(rule.table)}
      WHERE ${this.quoteIdentifier(rule.column)} IS NOT NULL
        AND (${whereClause})
    `;

    const countResult = await transaction.queryOne<{ count: string }>(countSql, params);
    const violationCount = parseInt(countResult?.count || '0', 10);

    const rangeStr = `${rule.config.min ?? '-inf'} to ${rule.config.max ?? '+inf'}`;

    return {
      ruleId: rule.id,
      passed: violationCount === 0,
      severity: rule.severity,
      table: rule.table,
      column: rule.column,
      violationCount,
      sampleViolations: violations.map(v => ({
        rowId: v.id,
        actualValue: v.value,
        expectedValue: rangeStr,
      })),
      message: violationCount === 0
        ? `${rule.column} values are within range ${rangeStr}`
        : `${violationCount} values in ${rule.column} are outside range ${rangeStr}`,
      timestamp: new Date(),
    };
  }

  private async executePatternRule(
    rule: ValidationRule,
    transaction: DatabaseTransaction
  ): Promise<ValidationResult> {
    if (!rule.column || !rule.config.pattern) {
      throw new Error('PATTERN rule requires column and pattern config');
    }

    const sql = `
      SELECT id, ${this.quoteIdentifier(rule.column)} as value
      FROM ${this.quoteIdentifier(rule.table)}
      WHERE ${this.quoteIdentifier(rule.column)} IS NOT NULL
        AND ${this.quoteIdentifier(rule.column)}::text !~ $1
      LIMIT 100
    `;

    const violations = await transaction.query<{ id: string; value: unknown }>(
      sql,
      [rule.config.pattern]
    );

    const countSql = `
      SELECT COUNT(*) as count
      FROM ${this.quoteIdentifier(rule.table)}
      WHERE ${this.quoteIdentifier(rule.column)} IS NOT NULL
        AND ${this.quoteIdentifier(rule.column)}::text !~ $1
    `;

    const countResult = await transaction.queryOne<{ count: string }>(
      countSql,
      [rule.config.pattern]
    );
    const violationCount = parseInt(countResult?.count || '0', 10);

    return {
      ruleId: rule.id,
      passed: violationCount === 0,
      severity: rule.severity,
      table: rule.table,
      column: rule.column,
      violationCount,
      sampleViolations: violations.map(v => ({
        rowId: v.id,
        actualValue: v.value,
        expectedValue: `Pattern: ${rule.config.pattern}`,
      })),
      message: violationCount === 0
        ? `${rule.column} values match pattern ${rule.config.pattern}`
        : `${violationCount} values in ${rule.column} do not match pattern`,
      timestamp: new Date(),
    };
  }

  private async executeUniqueRule(
    rule: ValidationRule,
    transaction: DatabaseTransaction
  ): Promise<ValidationResult> {
    if (!rule.column) {
      throw new Error('UNIQUE rule requires a column');
    }

    const sql = `
      SELECT ${this.quoteIdentifier(rule.column)} as value, COUNT(*) as count
      FROM ${this.quoteIdentifier(rule.table)}
      WHERE ${this.quoteIdentifier(rule.column)} IS NOT NULL
      GROUP BY ${this.quoteIdentifier(rule.column)}
      HAVING COUNT(*) > 1
      LIMIT 100
    `;

    const duplicates = await transaction.query<{ value: unknown; count: string }>(sql);

    const countSql = `
      SELECT COUNT(*) as count
      FROM (
        SELECT ${this.quoteIdentifier(rule.column)}
        FROM ${this.quoteIdentifier(rule.table)}
        WHERE ${this.quoteIdentifier(rule.column)} IS NOT NULL
        GROUP BY ${this.quoteIdentifier(rule.column)}
        HAVING COUNT(*) > 1
      ) duplicates
    `;

    const countResult = await transaction.queryOne<{ count: string }>(countSql);
    const violationCount = parseInt(countResult?.count || '0', 10);

    return {
      ruleId: rule.id,
      passed: violationCount === 0,
      severity: rule.severity,
      table: rule.table,
      column: rule.column,
      violationCount,
      sampleViolations: duplicates.map(d => ({
        rowId: String(d.value),
        actualValue: d.value,
        expectedValue: 'unique value',
        context: { duplicateCount: parseInt(d.count, 10) },
      })),
      message: violationCount === 0
        ? `${rule.column} values are unique`
        : `${violationCount} duplicate values found in ${rule.column}`,
      timestamp: new Date(),
    };
  }

  private async executeForeignKeyRule(
    rule: ValidationRule,
    transaction: DatabaseTransaction
  ): Promise<ValidationResult> {
    if (!rule.column || !rule.config.referenceTable || !rule.config.referenceColumn) {
      throw new Error('FOREIGN_KEY rule requires column, referenceTable, and referenceColumn config');
    }

    const sql = `
      SELECT t.id, t.${this.quoteIdentifier(rule.column)} as value
      FROM ${this.quoteIdentifier(rule.table)} t
      LEFT JOIN ${this.quoteIdentifier(rule.config.referenceTable)} r
        ON t.${this.quoteIdentifier(rule.column)} = r.${this.quoteIdentifier(rule.config.referenceColumn)}
      WHERE t.${this.quoteIdentifier(rule.column)} IS NOT NULL
        AND r.${this.quoteIdentifier(rule.config.referenceColumn)} IS NULL
      LIMIT 100
    `;

    const orphans = await transaction.query<{ id: string; value: unknown }>(sql);

    const countSql = `
      SELECT COUNT(*) as count
      FROM ${this.quoteIdentifier(rule.table)} t
      LEFT JOIN ${this.quoteIdentifier(rule.config.referenceTable)} r
        ON t.${this.quoteIdentifier(rule.column)} = r.${this.quoteIdentifier(rule.config.referenceColumn)}
      WHERE t.${this.quoteIdentifier(rule.column)} IS NOT NULL
        AND r.${this.quoteIdentifier(rule.config.referenceColumn)} IS NULL
    `;

    const countResult = await transaction.queryOne<{ count: string }>(countSql);
    const violationCount = parseInt(countResult?.count || '0', 10);

    return {
      ruleId: rule.id,
      passed: violationCount === 0,
      severity: rule.severity,
      table: rule.table,
      column: rule.column,
      violationCount,
      sampleViolations: orphans.map(o => ({
        rowId: o.id,
        actualValue: o.value,
        expectedValue: `Reference in ${rule.config.referenceTable}.${rule.config.referenceColumn}`,
      })),
      message: violationCount === 0
        ? `All ${rule.column} values have valid references`
        : `${violationCount} orphan records found (missing foreign key reference)`,
      timestamp: new Date(),
    };
  }

  private async executeEnumRule(
    rule: ValidationRule,
    transaction: DatabaseTransaction
  ): Promise<ValidationResult> {
    if (!rule.column || !rule.config.allowedValues || rule.config.allowedValues.length === 0) {
      throw new Error('ENUM rule requires column and allowedValues config');
    }

    const placeholders = rule.config.allowedValues.map((_, i) => `$${i + 1}`).join(', ');

    const sql = `
      SELECT id, ${this.quoteIdentifier(rule.column)} as value
      FROM ${this.quoteIdentifier(rule.table)}
      WHERE ${this.quoteIdentifier(rule.column)} IS NOT NULL
        AND ${this.quoteIdentifier(rule.column)}::text NOT IN (${placeholders})
      LIMIT 100
    `;

    const violations = await transaction.query<{ id: string; value: unknown }>(
      sql,
      rule.config.allowedValues.map(v => String(v))
    );

    const countSql = `
      SELECT COUNT(*) as count
      FROM ${this.quoteIdentifier(rule.table)}
      WHERE ${this.quoteIdentifier(rule.column)} IS NOT NULL
        AND ${this.quoteIdentifier(rule.column)}::text NOT IN (${placeholders})
    `;

    const countResult = await transaction.queryOne<{ count: string }>(
      countSql,
      rule.config.allowedValues.map(v => String(v))
    );
    const violationCount = parseInt(countResult?.count || '0', 10);

    return {
      ruleId: rule.id,
      passed: violationCount === 0,
      severity: rule.severity,
      table: rule.table,
      column: rule.column,
      violationCount,
      sampleViolations: violations.map(v => ({
        rowId: v.id,
        actualValue: v.value,
        expectedValue: `One of: ${rule.config.allowedValues!.join(', ')}`,
      })),
      message: violationCount === 0
        ? `${rule.column} values are valid enum values`
        : `${violationCount} invalid enum values found in ${rule.column}`,
      timestamp: new Date(),
    };
  }

  private async executeLengthRule(
    rule: ValidationRule,
    transaction: DatabaseTransaction
  ): Promise<ValidationResult> {
    if (!rule.column) {
      throw new Error('LENGTH rule requires a column');
    }

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (rule.config.minLength !== undefined) {
      conditions.push(`LENGTH(${this.quoteIdentifier(rule.column)}::text) < $${params.length + 1}`);
      params.push(rule.config.minLength);
    }

    if (rule.config.maxLength !== undefined) {
      conditions.push(`LENGTH(${this.quoteIdentifier(rule.column)}::text) > $${params.length + 1}`);
      params.push(rule.config.maxLength);
    }

    if (conditions.length === 0) {
      throw new Error('LENGTH rule requires minLength or maxLength config');
    }

    const whereClause = conditions.join(' OR ');

    const sql = `
      SELECT id, ${this.quoteIdentifier(rule.column)} as value,
             LENGTH(${this.quoteIdentifier(rule.column)}::text) as length
      FROM ${this.quoteIdentifier(rule.table)}
      WHERE ${this.quoteIdentifier(rule.column)} IS NOT NULL
        AND (${whereClause})
      LIMIT 100
    `;

    const violations = await transaction.query<{ id: string; value: unknown; length: number }>(
      sql,
      params
    );

    const countSql = `
      SELECT COUNT(*) as count
      FROM ${this.quoteIdentifier(rule.table)}
      WHERE ${this.quoteIdentifier(rule.column)} IS NOT NULL
        AND (${whereClause})
    `;

    const countResult = await transaction.queryOne<{ count: string }>(countSql, params);
    const violationCount = parseInt(countResult?.count || '0', 10);

    const lengthRange = `${rule.config.minLength ?? 0} to ${rule.config.maxLength ?? 'unlimited'}`;

    return {
      ruleId: rule.id,
      passed: violationCount === 0,
      severity: rule.severity,
      table: rule.table,
      column: rule.column,
      violationCount,
      sampleViolations: violations.map(v => ({
        rowId: v.id,
        actualValue: v.value,
        expectedValue: `Length: ${lengthRange}`,
        context: { actualLength: v.length },
      })),
      message: violationCount === 0
        ? `${rule.column} values have valid length (${lengthRange})`
        : `${violationCount} values in ${rule.column} have invalid length`,
      timestamp: new Date(),
    };
  }

  private async executeRowCountRule(
    rule: ValidationRule,
    transaction: DatabaseTransaction
  ): Promise<ValidationResult> {
    if (rule.config.expectedRowCount === undefined) {
      throw new Error('ROW_COUNT rule requires expectedRowCount config');
    }

    const sql = `SELECT COUNT(*) as count FROM ${this.quoteIdentifier(rule.table)}`;
    const result = await transaction.queryOne<{ count: string }>(sql);
    const actualCount = parseInt(result?.count || '0', 10);

    const tolerance = rule.config.rowCountTolerance ?? 0;
    const minExpected = Math.floor(rule.config.expectedRowCount * (1 - tolerance / 100));
    const maxExpected = Math.ceil(rule.config.expectedRowCount * (1 + tolerance / 100));

    const passed = actualCount >= minExpected && actualCount <= maxExpected;

    return {
      ruleId: rule.id,
      passed,
      severity: rule.severity,
      table: rule.table,
      violationCount: passed ? 0 : 1,
      sampleViolations: passed ? undefined : [{
        rowId: 'N/A',
        actualValue: actualCount,
        expectedValue: rule.config.expectedRowCount,
        context: { tolerance: `${tolerance}%`, minExpected, maxExpected },
      }],
      message: passed
        ? `Row count (${actualCount}) is within expected range`
        : `Row count (${actualCount}) differs from expected (${rule.config.expectedRowCount})`,
      timestamp: new Date(),
    };
  }

  private async executeChecksumRule(
    rule: ValidationRule,
    transaction: DatabaseTransaction
  ): Promise<ValidationResult> {
    if (!rule.config.expectedChecksum) {
      throw new Error('CHECKSUM rule requires expectedChecksum config');
    }

    // Calculate MD5 checksum of all rows
    const sql = rule.column
      ? `SELECT MD5(STRING_AGG(${this.quoteIdentifier(rule.column)}::text, '' ORDER BY id)) as checksum
         FROM ${this.quoteIdentifier(rule.table)}`
      : `SELECT MD5(STRING_AGG(t::text, '' ORDER BY id)) as checksum
         FROM ${this.quoteIdentifier(rule.table)} t`;

    const result = await transaction.queryOne<{ checksum: string }>(sql);
    const actualChecksum = result?.checksum || '';

    const passed = actualChecksum === rule.config.expectedChecksum;

    return {
      ruleId: rule.id,
      passed,
      severity: rule.severity,
      table: rule.table,
      column: rule.column,
      violationCount: passed ? 0 : 1,
      sampleViolations: passed ? undefined : [{
        rowId: 'N/A',
        actualValue: actualChecksum,
        expectedValue: rule.config.expectedChecksum,
      }],
      message: passed
        ? 'Checksum matches expected value'
        : 'Checksum mismatch - data may have been modified',
      timestamp: new Date(),
    };
  }

  private async executeCustomRule(
    rule: ValidationRule,
    transaction: DatabaseTransaction
  ): Promise<ValidationResult> {
    if (!rule.config.customValidator) {
      throw new Error('CUSTOM rule requires customValidator config');
    }

    const validator = this.customValidators.get(rule.config.customValidator);
    if (!validator) {
      throw new Error(`Custom validator '${rule.config.customValidator}' not found`);
    }

    return await validator(rule, transaction);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private quoteIdentifier(identifier: string): string {
    // Prevent SQL injection by validating identifier
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
      throw new Error(`Invalid identifier: ${identifier}`);
    }
    return `"${identifier}"`;
  }

  private getDataTypeCheckSql(dataType: DataType, column: string): string {
    const quotedColumn = this.quoteIdentifier(column);

    switch (dataType) {
      case DataType.STRING:
        return `pg_typeof(${quotedColumn}::text) = 'text'::regtype`;

      case DataType.NUMBER:
        return `${quotedColumn}::text ~ '^-?[0-9]+(\\.[0-9]+)?$'`;

      case DataType.INTEGER:
        return `${quotedColumn}::text ~ '^-?[0-9]+$'`;

      case DataType.BOOLEAN:
        return `${quotedColumn}::text IN ('true', 'false', 't', 'f', '1', '0')`;

      case DataType.DATE:
        return `${quotedColumn}::text ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'`;

      case DataType.DATETIME:
        return `${quotedColumn}::text ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9]{2}:[0-9]{2}:[0-9]{2}'`;

      case DataType.UUID:
        return `${quotedColumn}::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'`;

      case DataType.EMAIL:
        return `${quotedColumn}::text ~ '^[^@]+@[^@]+\\.[^@]+$'`;

      case DataType.JSON:
        return `(${quotedColumn}::text)::jsonb IS NOT NULL`;

      default:
        return 'TRUE'; // No specific check
    }
  }

  private validateRuleConfig(rule: ValidationRule): void {
    switch (rule.type) {
      case ValidationRuleType.NOT_NULL:
        if (!rule.column) {
          throw new Error('NOT_NULL rule requires a column');
        }
        break;

      case ValidationRuleType.DATA_TYPE:
        if (!rule.column || !rule.config.dataType) {
          throw new Error('DATA_TYPE rule requires column and dataType');
        }
        break;

      case ValidationRuleType.RANGE:
        if (!rule.column || (rule.config.min === undefined && rule.config.max === undefined)) {
          throw new Error('RANGE rule requires column and min or max');
        }
        break;

      case ValidationRuleType.PATTERN:
        if (!rule.column || !rule.config.pattern) {
          throw new Error('PATTERN rule requires column and pattern');
        }
        break;

      case ValidationRuleType.UNIQUE:
        if (!rule.column) {
          throw new Error('UNIQUE rule requires a column');
        }
        break;

      case ValidationRuleType.FOREIGN_KEY:
        if (!rule.column || !rule.config.referenceTable || !rule.config.referenceColumn) {
          throw new Error('FOREIGN_KEY rule requires column, referenceTable, and referenceColumn');
        }
        break;

      case ValidationRuleType.ENUM:
        if (!rule.column || !rule.config.allowedValues || rule.config.allowedValues.length === 0) {
          throw new Error('ENUM rule requires column and allowedValues');
        }
        break;

      case ValidationRuleType.LENGTH:
        if (!rule.column || (rule.config.minLength === undefined && rule.config.maxLength === undefined)) {
          throw new Error('LENGTH rule requires column and minLength or maxLength');
        }
        break;

      case ValidationRuleType.ROW_COUNT:
        if (rule.config.expectedRowCount === undefined) {
          throw new Error('ROW_COUNT rule requires expectedRowCount');
        }
        break;

      case ValidationRuleType.CHECKSUM:
        if (!rule.config.expectedChecksum) {
          throw new Error('CHECKSUM rule requires expectedChecksum');
        }
        break;

      case ValidationRuleType.CUSTOM:
        if (!rule.config.customValidator) {
          throw new Error('CUSTOM rule requires customValidator');
        }
        break;
    }
  }

  private registerBuiltInValidators(): void {
    // Healthcare-specific validators

    // Patient ID format validator (e.g., Swiss AHV number)
    this.registerCustomValidator('ahv_number', async (rule, transaction) => {
      const sql = `
        SELECT id, ${this.quoteIdentifier(rule.column!)} as value
        FROM ${this.quoteIdentifier(rule.table)}
        WHERE ${this.quoteIdentifier(rule.column!)} IS NOT NULL
          AND ${this.quoteIdentifier(rule.column!)}::text !~ '^756\\.[0-9]{4}\\.[0-9]{4}\\.[0-9]{2}$'
        LIMIT 100
      `;

      const violations = await transaction.query<{ id: string; value: unknown }>(sql);

      return {
        ruleId: rule.id,
        passed: violations.length === 0,
        severity: rule.severity,
        table: rule.table,
        column: rule.column,
        violationCount: violations.length,
        sampleViolations: violations.map(v => ({
          rowId: v.id,
          actualValue: v.value,
          expectedValue: 'Format: 756.XXXX.XXXX.XX',
        })),
        message: violations.length === 0
          ? 'All AHV numbers are valid'
          : `${violations.length} invalid AHV numbers found`,
        timestamp: new Date(),
      };
    });

    // Medical code validator (e.g., ICD-10)
    this.registerCustomValidator('icd10_code', async (rule, transaction) => {
      const sql = `
        SELECT id, ${this.quoteIdentifier(rule.column!)} as value
        FROM ${this.quoteIdentifier(rule.table)}
        WHERE ${this.quoteIdentifier(rule.column!)} IS NOT NULL
          AND ${this.quoteIdentifier(rule.column!)}::text !~ '^[A-Z][0-9]{2}(\\.[0-9]{1,2})?$'
        LIMIT 100
      `;

      const violations = await transaction.query<{ id: string; value: unknown }>(sql);

      return {
        ruleId: rule.id,
        passed: violations.length === 0,
        severity: rule.severity,
        table: rule.table,
        column: rule.column,
        violationCount: violations.length,
        sampleViolations: violations.map(v => ({
          rowId: v.id,
          actualValue: v.value,
          expectedValue: 'ICD-10 format: X00.00',
        })),
        message: violations.length === 0
          ? 'All ICD-10 codes are valid'
          : `${violations.length} invalid ICD-10 codes found`,
        timestamp: new Date(),
      };
    });

    // Swiss postal code validator
    this.registerCustomValidator('swiss_postal_code', async (rule, transaction) => {
      const sql = `
        SELECT id, ${this.quoteIdentifier(rule.column!)} as value
        FROM ${this.quoteIdentifier(rule.table)}
        WHERE ${this.quoteIdentifier(rule.column!)} IS NOT NULL
          AND ${this.quoteIdentifier(rule.column!)}::text !~ '^[1-9][0-9]{3}$'
        LIMIT 100
      `;

      const violations = await transaction.query<{ id: string; value: unknown }>(sql);

      return {
        ruleId: rule.id,
        passed: violations.length === 0,
        severity: rule.severity,
        table: rule.table,
        column: rule.column,
        violationCount: violations.length,
        sampleViolations: violations.map(v => ({
          rowId: v.id,
          actualValue: v.value,
          expectedValue: '4-digit Swiss postal code (1000-9999)',
        })),
        message: violations.length === 0
          ? 'All Swiss postal codes are valid'
          : `${violations.length} invalid Swiss postal codes found`,
        timestamp: new Date(),
      };
    });
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Custom validator function type
 */
export type CustomValidatorFn = (
  rule: ValidationRule,
  transaction: DatabaseTransaction
) => Promise<ValidationResult>;

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a NOT_NULL validation rule
 */
export function createNotNullRule(
  id: string,
  table: string,
  column: string,
  options: Partial<ValidationRule> = {}
): ValidationRule {
  return {
    id,
    name: options.name || `${table}.${column} not null`,
    table,
    column,
    type: ValidationRuleType.NOT_NULL,
    config: {},
    severity: options.severity || ValidationSeverity.ERROR,
    failOnViolation: options.failOnViolation ?? true,
    message: options.message || `${column} must not be null`,
  };
}

/**
 * Create a FOREIGN_KEY validation rule
 */
export function createForeignKeyRule(
  id: string,
  table: string,
  column: string,
  referenceTable: string,
  referenceColumn: string,
  options: Partial<ValidationRule> = {}
): ValidationRule {
  return {
    id,
    name: options.name || `${table}.${column} -> ${referenceTable}.${referenceColumn}`,
    table,
    column,
    type: ValidationRuleType.FOREIGN_KEY,
    config: {
      referenceTable,
      referenceColumn,
    },
    severity: options.severity || ValidationSeverity.ERROR,
    failOnViolation: options.failOnViolation ?? true,
    message: options.message || `${column} must reference a valid ${referenceTable}`,
  };
}

/**
 * Create a PATTERN validation rule
 */
export function createPatternRule(
  id: string,
  table: string,
  column: string,
  pattern: string,
  options: Partial<ValidationRule> = {}
): ValidationRule {
  return {
    id,
    name: options.name || `${table}.${column} pattern`,
    table,
    column,
    type: ValidationRuleType.PATTERN,
    config: { pattern },
    severity: options.severity || ValidationSeverity.ERROR,
    failOnViolation: options.failOnViolation ?? true,
    message: options.message || `${column} must match pattern ${pattern}`,
  };
}

/**
 * Create a ROW_COUNT validation rule
 */
export function createRowCountRule(
  id: string,
  table: string,
  expectedCount: number,
  tolerance: number = 0,
  options: Partial<ValidationRule> = {}
): ValidationRule {
  return {
    id,
    name: options.name || `${table} row count`,
    table,
    type: ValidationRuleType.ROW_COUNT,
    config: {
      expectedRowCount: expectedCount,
      rowCountTolerance: tolerance,
    },
    severity: options.severity || ValidationSeverity.ERROR,
    failOnViolation: options.failOnViolation ?? true,
    message: options.message || `${table} should have ~${expectedCount} rows (${tolerance}% tolerance)`,
  };
}

// ============================================================================
// Export
// ============================================================================

export default ValidationRulesEngine;
