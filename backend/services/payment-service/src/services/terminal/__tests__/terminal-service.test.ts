/**
 * Terminal Service Unit Tests
 * Tests payment processing logic and terminal management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TerminalService } from '../terminal-service';
import { TerminalStatus, TerminalBatteryLevel } from '../../../../../../shared/models/TerminalDevice';
import { TerminalTransactionStatus } from '../../../../../../shared/models/TerminalTransaction';
import { CODStatus } from '../../../../../../shared/models/CODTransaction';

describe('TerminalService', () => {
  let terminalService: TerminalService;
  let mockDataSource: any;

  beforeEach(() => {
    // Mock DataSource
    mockDataSource = {
      getRepository: vi.fn(() => ({
        findOne: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
        save: vi.fn(),
        createQueryBuilder: vi.fn(),
      })),
    };

    terminalService = new TerminalService(mockDataSource, 'test-api-key', 'test-merchant-id');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('pairTerminal', () => {
    it('should pair a new terminal to a driver', async () => {
      // Mock SumUp client response
      vi.spyOn(terminalService['sumupClient'], 'getDeviceInfo').mockResolvedValue({
        id: 'sumup-123',
        serial_number: 'SER-001',
        name: 'Terminal 1',
        model: 'SumUp 3G',
        status: 'active',
        currency: 'CHF',
      });

      vi.spyOn(terminalService['sumupClient'], 'initiateDevicePairing').mockResolvedValue({
        id: 'pair-123',
        pairing_code: '123456',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });

      const mockTerminalRepo = {
        findOne: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockReturnValue({
          serial_number: 'SER-001',
          sumup_device_id: 'sumup-123',
          driver_id: 'driver-123',
        }),
        save: vi.fn().mockResolvedValue({
          id: 'term-123',
          serial_number: 'SER-001',
          pairing_code: '123456',
        }),
      };

      mockDataSource.getRepository.mockReturnValueOnce(mockTerminalRepo);

      const result = await terminalService.pairTerminal({
        driver_id: 'driver-123',
        serial_number: 'SER-001',
        device_name: 'My Terminal',
      });

      expect(result.pairing_code).toBe('123456');
      expect(mockTerminalRepo.save).toHaveBeenCalled();
    });

    it('should reject if terminal already paired', async () => {
      const mockTerminalRepo = {
        findOne: vi.fn().mockResolvedValue({
          serial_number: 'SER-001',
          status: TerminalStatus.PAIRED,
        }),
      };

      mockDataSource.getRepository.mockReturnValueOnce(mockTerminalRepo);

      await expect(
        terminalService.pairTerminal({
          driver_id: 'driver-123',
          serial_number: 'SER-001',
          device_name: 'My Terminal',
        })
      ).rejects.toThrow('Terminal already paired to another driver');
    });
  });

  describe('updateTerminalStatus', () => {
    it('should update terminal battery level', async () => {
      const mockTerminal = {
        serial_number: 'SER-001',
        battery_percentage: 50,
        is_charging: false,
        is_connected: true,
        updateBattery: vi.fn(),
        updateConnectivity: vi.fn(),
      };

      const mockTerminalRepo = {
        findOne: vi.fn().mockResolvedValue(mockTerminal),
        save: vi.fn().mockResolvedValue({
          ...mockTerminal,
          battery_level: TerminalBatteryLevel.MEDIUM,
        }),
      };

      mockDataSource.getRepository.mockReturnValue(mockTerminalRepo);

      const result = await terminalService.updateTerminalStatus('SER-001', {
        battery_percentage: 50,
        is_charging: false,
        is_connected: true,
      });

      expect(mockTerminal.updateBattery).toHaveBeenCalledWith(50, false);
      expect(mockTerminal.updateConnectivity).toHaveBeenCalled();
    });

    it('should mark terminal as offline when disconnected', async () => {
      const mockTerminal = {
        serial_number: 'SER-001',
        status: TerminalStatus.PAIRED,
        is_connected: true,
        updateBattery: vi.fn(),
        updateConnectivity: vi.fn(),
      };

      const mockTerminalRepo = {
        findOne: vi.fn().mockResolvedValue(mockTerminal),
        save: vi.fn().mockResolvedValue({
          ...mockTerminal,
          status: TerminalStatus.OFFLINE,
          is_connected: false,
        }),
      };

      mockDataSource.getRepository.mockReturnValue(mockTerminalRepo);

      await terminalService.updateTerminalStatus('SER-001', {
        battery_percentage: 75,
        is_charging: false,
        is_connected: false,
      });

      expect(mockTerminal.updateConnectivity).toHaveBeenCalledWith(false, undefined, undefined);
    });
  });

  describe('initiatePayment', () => {
    it('should create terminal transaction for COD payment', async () => {
      const mockTerminal = {
        id: 'term-123',
        serial_number: 'SER-001',
        driver_id: 'driver-123',
        status: TerminalStatus.ACTIVE,
        is_connected: true,
        battery_level: TerminalBatteryLevel.HIGH,
        isReadyForPayment: vi.fn().mockReturnValue(true),
        getStatusDisplay: vi.fn().mockReturnValue('Ready'),
      };

      const mockCODTransaction = {
        id: 'cod-123',
        status: CODStatus.PENDING,
      };

      const mockTerminalTransaction = {
        terminal_id: 'term-123',
        cod_transaction_id: 'cod-123',
        driver_id: 'driver-123',
        delivery_id: 'delivery-123',
        amount: 50,
        payment_type: 'card_present',
        markAsProcessing: vi.fn(),
      };

      const mockTerminalRepo = {
        findOne: vi.fn().mockResolvedValue(mockTerminal),
      };

      const mockTransactionRepo = {
        create: vi.fn().mockReturnValue(mockTerminalTransaction),
        save: vi.fn().mockResolvedValue({
          ...mockTerminalTransaction,
          id: 'trans-123',
        }),
      };

      const mockCODRepo = {
        findOne: vi.fn().mockResolvedValue(mockCODTransaction),
      };

      mockDataSource.getRepository
        .mockReturnValueOnce(mockTerminalRepo)
        .mockReturnValueOnce(mockTransactionRepo)
        .mockReturnValueOnce(mockCODRepo);

      const result = await terminalService.initiatePayment('SER-001', 'cod-123', {
        amount: 50,
        delivery_id: 'delivery-123',
      });

      expect(result.payment_type).toBe('card_present');
      expect(mockTerminalTransaction.markAsProcessing).toHaveBeenCalled();
    });

    it('should reject if terminal not ready for payment', async () => {
      const mockTerminal = {
        serial_number: 'SER-001',
        status: TerminalStatus.OFFLINE,
        isReadyForPayment: vi.fn().mockReturnValue(false),
        getStatusDisplay: vi.fn().mockReturnValue('Offline'),
      };

      const mockTerminalRepo = {
        findOne: vi.fn().mockResolvedValue(mockTerminal),
      };

      mockDataSource.getRepository.mockReturnValue(mockTerminalRepo);

      await expect(
        terminalService.initiatePayment('SER-001', 'cod-123', {
          amount: 50,
          delivery_id: 'delivery-123',
        })
      ).rejects.toThrow('Terminal not ready for payment');
    });
  });

  describe('refundTransaction', () => {
    it('should refund an approved transaction', async () => {
      const mockTransaction = {
        id: 'trans-123',
        sumup_transaction_id: 'sumup-123',
        cod_transaction_id: 'cod-123',
        amount: 50,
        status: TerminalTransactionStatus.APPROVED,
        canBeRefunded: vi.fn().mockReturnValue(true),
        markAsRefunded: vi.fn(),
      };

      const mockCODTransaction = {
        id: 'cod-123',
        status: CODStatus.COLLECTED,
        cancel: vi.fn(),
      };

      const mockTransactionRepo = {
        findOne: vi.fn().mockResolvedValue(mockTransaction),
        save: vi.fn().mockResolvedValue({
          ...mockTransaction,
          status: TerminalTransactionStatus.REFUNDED,
        }),
      };

      const mockCODRepo = {
        findOne: vi.fn().mockResolvedValue(mockCODTransaction),
        save: vi.fn().mockResolvedValue(mockCODTransaction),
      };

      vi.spyOn(terminalService['sumupClient'], 'refundTransaction').mockResolvedValue({
        id: 'refund-123',
        original_transaction_id: 'sumup-123',
        amount: 5000, // in cents
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      });

      mockDataSource.getRepository
        .mockReturnValueOnce(mockTransactionRepo)
        .mockReturnValueOnce(mockCODRepo);

      const result = await terminalService.refundTransaction('trans-123', 'SER-001', 'Test refund');

      expect(mockTransaction.markAsRefunded).toHaveBeenCalled();
      expect(mockCODTransaction.cancel).toHaveBeenCalled();
    });

    it('should reject if transaction cannot be refunded', async () => {
      const mockTransaction = {
        id: 'trans-123',
        status: TerminalTransactionStatus.PENDING,
        canBeRefunded: vi.fn().mockReturnValue(false),
      };

      const mockTransactionRepo = {
        findOne: vi.fn().mockResolvedValue(mockTransaction),
      };

      mockDataSource.getRepository.mockReturnValue(mockTransactionRepo);

      await expect(
        terminalService.refundTransaction('trans-123', 'SER-001', 'Test refund')
      ).rejects.toThrow('Transaction cannot be refunded');
    });
  });

  describe('getDailyTerminalReport', () => {
    it('should calculate daily transaction statistics', async () => {
      const today = new Date();
      const mockTransactions = [
        {
          status: TerminalTransactionStatus.APPROVED,
          amount: 50,
        },
        {
          status: TerminalTransactionStatus.APPROVED,
          amount: 75,
        },
        {
          status: TerminalTransactionStatus.DECLINED,
          amount: 30,
        },
        {
          status: TerminalTransactionStatus.FAILED,
          amount: 20,
        },
      ];

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockTransactions),
      };

      const mockTransactionRepo = {
        createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      mockDataSource.getRepository.mockReturnValue(mockTransactionRepo);

      const report = await terminalService.getDailyTerminalReport(today);

      expect(report.total_transactions).toBe(4);
      expect(report.approved).toBe(2);
      expect(report.declined).toBe(1);
      expect(report.failed).toBe(1);
      expect(report.total_amount).toBe(125);
      expect(report.average_amount).toBe(62.5);
    });
  });
});
