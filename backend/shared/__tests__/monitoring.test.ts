import {
  logger,
  recordOrderCreated,
  recordDeliveryCompleted,
  checkAlertCondition,
  AlertManager,
  alertManager,
} from '../monitoring';

describe('Monitoring Module', () => {
  describe('Metrics', () => {
    it('should record order creation', () => {
      // This test verifies metrics are recorded without errors
      expect(() => {
        recordOrderCreated('prescription');
        recordOrderCreated('otc');
      }).not.toThrow();
    });

    it('should record delivery completion', () => {
      expect(() => {
        recordDeliveryCompleted('success');
        recordDeliveryCompleted('failed');
      }).not.toThrow();
    });
  });

  describe('Alerting', () => {
    it('should detect alert conditions correctly', () => {
      const definition = {
        name: 'test',
        metric: 'test_metric',
        operator: 'gt' as const,
        threshold: 100,
        severity: 'warning' as const,
        checkInterval: 60000,
      };

      expect(checkAlertCondition(101, definition)).toBe(true);
      expect(checkAlertCondition(100, definition)).toBe(false);
      expect(checkAlertCondition(99, definition)).toBe(false);
    });

    it('should detect less than condition', () => {
      const definition = {
        name: 'test',
        metric: 'test_metric',
        operator: 'lt' as const,
        threshold: 100,
        severity: 'warning' as const,
        checkInterval: 60000,
      };

      expect(checkAlertCondition(99, definition)).toBe(true);
      expect(checkAlertCondition(100, definition)).toBe(false);
      expect(checkAlertCondition(101, definition)).toBe(false);
    });

    it('should manage active alerts', () => {
      const manager = new AlertManager();

      expect(manager.getActiveAlerts().length).toBe(0);

      manager.clearAlert('test-alert');
      expect(manager.getActiveAlerts().length).toBe(0);

      manager.clearAllAlerts();
      expect(manager.getActiveAlerts().length).toBe(0);
    });
  });

  describe('Logger', () => {
    it('should have logger instance', () => {
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
    });

    it('should not throw when logging', () => {
      expect(() => {
        logger.info('Test info message');
        logger.error('Test error message');
        logger.warn('Test warn message');
        logger.debug('Test debug message');
      }).not.toThrow();
    });
  });
});
