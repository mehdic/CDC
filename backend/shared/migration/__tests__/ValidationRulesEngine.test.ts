/**
 * ValidationRulesEngine Tests
 * T8-067: Data Migration and Validation
 */

import {
  ValidationRulesEngine,
  createNotNullRule,
  createForeignKeyRule,
  createPatternRule,
  createRowCountRule,
} from '../ValidationRulesEngine';
import {
  ValidationRule,
  ValidationRuleType,
  ValidationSeverity,
  DataType,
  DatabaseTransaction,
} from '../types';

// ============================================================================
// Mock Database Transaction
// ============================================================================

const createMockTransaction = (
  queryResults: Record<string, unknown[]> = {}
): DatabaseTransaction => {
  return {
    query: jest.fn().mockImplementation(async (sql: string, params?: unknown[]) => {
      // Return results based on SQL pattern
      for (const [pattern, results] of Object.entries(queryResults)) {
        if (sql.includes(pattern)) {
          return results;
        }
      }
      return [];
    }),
    queryOne: jest.fn().mockImplementation(async (sql: string, params?: unknown[]) => {
      for (const [pattern, results] of Object.entries(queryResults)) {
        if (sql.includes(pattern)) {
          return results[0] || null;
        }
      }
      return null;
    }),
    execute: jest.fn().mockResolvedValue({ rowsAffected: 0 }),
    createSavepoint: jest.fn().mockResolvedValue(undefined),
    rollbackToSavepoint: jest.fn().mockResolvedValue(undefined),
    releaseSavepoint: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
  };
};

// ============================================================================
// Tests
// ============================================================================

describe('ValidationRulesEngine', () => {
  let engine: ValidationRulesEngine;

  beforeEach(() => {
    engine = new ValidationRulesEngine();
  });

  describe('Rule Management', () => {
    test('should add a validation rule', () => {
      const rule = createNotNullRule('test-rule', 'users', 'email');

      engine.addRule(rule);

      const rules = engine.getRules();
      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe('test-rule');
    });

    test('should throw error when adding duplicate rule', () => {
      const rule = createNotNullRule('test-rule', 'users', 'email');

      engine.addRule(rule);

      expect(() => engine.addRule(rule)).toThrow(
        "Validation rule with ID 'test-rule' already exists"
      );
    });

    test('should remove a validation rule', () => {
      const rule = createNotNullRule('test-rule', 'users', 'email');

      engine.addRule(rule);
      engine.removeRule('test-rule');

      expect(engine.getRules()).toHaveLength(0);
    });

    test('should get rules for specific table', () => {
      const rule1 = createNotNullRule('rule-1', 'users', 'email');
      const rule2 = createNotNullRule('rule-2', 'users', 'name');
      const rule3 = createNotNullRule('rule-3', 'orders', 'total');

      engine.addRule(rule1);
      engine.addRule(rule2);
      engine.addRule(rule3);

      const userRules = engine.getRulesForTable('users');
      expect(userRules).toHaveLength(2);
      expect(userRules.every(r => r.table === 'users')).toBe(true);
    });
  });

  describe('NOT_NULL Rule', () => {
    test('should pass when no NULL values', async () => {
      const transaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '0' }],
      });

      const rule = createNotNullRule('not-null-email', 'users', 'email');
      engine.addRule(rule);

      const results = await engine.validateTable('users', transaction);

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(true);
      expect(results[0].violationCount).toBe(0);
    });

    test('should fail when NULL values exist', async () => {
      const transaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '5' }],
        'LIMIT 100': [
          { id: '1', value: null },
          { id: '2', value: null },
        ],
      });

      const rule = createNotNullRule('not-null-email', 'users', 'email');
      engine.addRule(rule);

      const results = await engine.validateTable('users', transaction);

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(false);
      expect(results[0].violationCount).toBe(5);
      expect(results[0].severity).toBe(ValidationSeverity.ERROR);
    });
  });

  describe('PATTERN Rule', () => {
    test('should pass when all values match pattern', async () => {
      const transaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '0' }],
      });

      const rule = createPatternRule(
        'email-pattern',
        'users',
        'email',
        '^[^@]+@[^@]+\\.[^@]+$'
      );
      engine.addRule(rule);

      const results = await engine.validateTable('users', transaction);

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(true);
    });

    test('should fail when values do not match pattern', async () => {
      const transaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '3' }],
        'LIMIT 100': [
          { id: '1', value: 'invalid-email' },
          { id: '2', value: 'also-invalid' },
        ],
      });

      const rule = createPatternRule(
        'email-pattern',
        'users',
        'email',
        '^[^@]+@[^@]+\\.[^@]+$'
      );
      engine.addRule(rule);

      const results = await engine.validateTable('users', transaction);

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(false);
      expect(results[0].violationCount).toBe(3);
    });
  });

  describe('FOREIGN_KEY Rule', () => {
    test('should pass when all references are valid', async () => {
      const transaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '0' }],
      });

      const rule = createForeignKeyRule(
        'fk-user-pharmacy',
        'users',
        'pharmacy_id',
        'pharmacies',
        'id'
      );
      engine.addRule(rule);

      const results = await engine.validateTable('users', transaction);

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(true);
      expect(results[0].message).toContain('valid references');
    });

    test('should fail when orphan records exist', async () => {
      const transaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '10' }],
        'LIMIT 100': [
          { id: '1', value: 'orphan-ref-1' },
          { id: '2', value: 'orphan-ref-2' },
        ],
      });

      const rule = createForeignKeyRule(
        'fk-user-pharmacy',
        'users',
        'pharmacy_id',
        'pharmacies',
        'id'
      );
      engine.addRule(rule);

      const results = await engine.validateTable('users', transaction);

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(false);
      expect(results[0].violationCount).toBe(10);
      expect(results[0].message).toContain('orphan records');
    });
  });

  describe('ROW_COUNT Rule', () => {
    test('should pass when row count matches expected', async () => {
      const transaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '1000' }],
      });

      const rule = createRowCountRule('users-count', 'users', 1000);
      engine.addRule(rule);

      const results = await engine.validateTable('users', transaction);

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(true);
    });

    test('should pass when row count is within tolerance', async () => {
      const transaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '950' }],
      });

      const rule = createRowCountRule('users-count', 'users', 1000, 10); // 10% tolerance
      engine.addRule(rule);

      const results = await engine.validateTable('users', transaction);

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(true);
    });

    test('should fail when row count exceeds tolerance', async () => {
      const transaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '800' }],
      });

      const rule = createRowCountRule('users-count', 'users', 1000, 5); // 5% tolerance
      engine.addRule(rule);

      const results = await engine.validateTable('users', transaction);

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(false);
    });
  });

  describe('ENUM Rule', () => {
    test('should pass when all values are valid enum values', async () => {
      const transaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '0' }],
      });

      const rule: ValidationRule = {
        id: 'status-enum',
        name: 'users.status enum',
        table: 'users',
        column: 'status',
        type: ValidationRuleType.ENUM,
        config: {
          allowedValues: ['active', 'inactive', 'pending'],
        },
        severity: ValidationSeverity.ERROR,
        failOnViolation: true,
        message: 'Status must be a valid enum value',
      };
      engine.addRule(rule);

      const results = await engine.validateTable('users', transaction);

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(true);
    });

    test('should fail when invalid enum values exist', async () => {
      const transaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '2' }],
        'LIMIT 100': [
          { id: '1', value: 'unknown' },
          { id: '2', value: 'deleted' },
        ],
      });

      const rule: ValidationRule = {
        id: 'status-enum',
        name: 'users.status enum',
        table: 'users',
        column: 'status',
        type: ValidationRuleType.ENUM,
        config: {
          allowedValues: ['active', 'inactive', 'pending'],
        },
        severity: ValidationSeverity.ERROR,
        failOnViolation: true,
        message: 'Status must be a valid enum value',
      };
      engine.addRule(rule);

      const results = await engine.validateTable('users', transaction);

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(false);
      expect(results[0].violationCount).toBe(2);
    });
  });

  describe('Custom Validators', () => {
    test('should register and execute custom validator', async () => {
      const customValidatorFn = jest.fn().mockResolvedValue({
        ruleId: 'custom-rule',
        passed: true,
        severity: ValidationSeverity.ERROR,
        table: 'users',
        violationCount: 0,
        message: 'Custom validation passed',
        timestamp: new Date(),
      });

      engine.registerCustomValidator('my_custom_validator', customValidatorFn);

      const rule: ValidationRule = {
        id: 'custom-rule',
        name: 'Custom rule',
        table: 'users',
        type: ValidationRuleType.CUSTOM,
        config: {
          customValidator: 'my_custom_validator',
        },
        severity: ValidationSeverity.ERROR,
        failOnViolation: true,
        message: 'Custom validation',
      };
      engine.addRule(rule);

      const transaction = createMockTransaction();
      const results = await engine.validateTable('users', transaction);

      expect(customValidatorFn).toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(true);
    });
  });

  describe('validateAll', () => {
    test('should validate all registered tables', async () => {
      const transaction = createMockTransaction({
        'COUNT(*) as count': [{ count: '0' }],
      });

      engine.addRule(createNotNullRule('rule-1', 'users', 'email'));
      engine.addRule(createNotNullRule('rule-2', 'orders', 'total'));
      engine.addRule(createNotNullRule('rule-3', 'products', 'name'));

      const results = await engine.validateAll(transaction);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.passed)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle query errors gracefully', async () => {
      const transaction = createMockTransaction();
      (transaction.query as jest.Mock).mockRejectedValue(new Error('Database error'));
      (transaction.queryOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      const rule = createNotNullRule('not-null-email', 'users', 'email');
      engine.addRule(rule);

      const results = await engine.validateTable('users', transaction);

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(false);
      expect(results[0].message).toContain('Validation error');
    });

    test('should validate rule configuration on add', () => {
      const invalidRule: ValidationRule = {
        id: 'invalid',
        name: 'Invalid rule',
        table: 'users',
        column: undefined as unknown as string, // Force missing column
        type: ValidationRuleType.NOT_NULL,
        config: {},
        severity: ValidationSeverity.ERROR,
        failOnViolation: true,
        message: 'Invalid',
      };

      expect(() => engine.addRule(invalidRule)).toThrow('NOT_NULL rule requires a column');
    });
  });
});

describe('Factory Functions', () => {
  test('createNotNullRule creates correct rule', () => {
    const rule = createNotNullRule('test', 'users', 'email');

    expect(rule.id).toBe('test');
    expect(rule.table).toBe('users');
    expect(rule.column).toBe('email');
    expect(rule.type).toBe(ValidationRuleType.NOT_NULL);
    expect(rule.severity).toBe(ValidationSeverity.ERROR);
    expect(rule.failOnViolation).toBe(true);
  });

  test('createForeignKeyRule creates correct rule', () => {
    const rule = createForeignKeyRule('test', 'users', 'pharmacy_id', 'pharmacies', 'id');

    expect(rule.id).toBe('test');
    expect(rule.table).toBe('users');
    expect(rule.column).toBe('pharmacy_id');
    expect(rule.type).toBe(ValidationRuleType.FOREIGN_KEY);
    expect(rule.config.referenceTable).toBe('pharmacies');
    expect(rule.config.referenceColumn).toBe('id');
  });

  test('createPatternRule creates correct rule', () => {
    const rule = createPatternRule('test', 'users', 'email', '^.*@.*$');

    expect(rule.id).toBe('test');
    expect(rule.table).toBe('users');
    expect(rule.column).toBe('email');
    expect(rule.type).toBe(ValidationRuleType.PATTERN);
    expect(rule.config.pattern).toBe('^.*@.*$');
  });

  test('createRowCountRule creates correct rule', () => {
    const rule = createRowCountRule('test', 'users', 1000, 5);

    expect(rule.id).toBe('test');
    expect(rule.table).toBe('users');
    expect(rule.type).toBe(ValidationRuleType.ROW_COUNT);
    expect(rule.config.expectedRowCount).toBe(1000);
    expect(rule.config.rowCountTolerance).toBe(5);
  });
});
