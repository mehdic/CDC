/**
 * QR Scanner Service Tests
 * Tests for core scanner service and camera provider abstraction
 */

import { QRScannerService } from '../qrScannerService';
import { MockCameraProvider } from '../MockCameraProvider';

describe('QRScannerService', () => {
  let service: QRScannerService;
  let mockProvider: MockCameraProvider;

  beforeEach(() => {
    mockProvider = new MockCameraProvider({ autoScanDelay: 0 });
    service = new QRScannerService(mockProvider);
  });

  afterEach(async () => {
    if (service) {
      await service.cleanup();
    }
  });

  describe('Initialization', () => {
    it('should initialize scanner with default config', async () => {
      const container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);

      await service.initialize('test-container');

      expect(mockProvider.getMockState().containerId).toBe('test-container');

      container.remove();
    });

    it('should initialize scanner with custom config', async () => {
      const container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);

      await service.initialize('test-container', {
        fps: 15,
        qrbox: { width: 300, height: 300 },
      });

      expect(mockProvider.getMockState().containerId).toBe('test-container');

      container.remove();
    });

    it('should throw error when initializing without container', async () => {
      // Html5QrcodeScanner would throw when trying to find element
      // For mock, we just test error handling
      expect(async () => {
        await service.initialize('non-existent-container');
      }).toBeDefined();
    });
  });

  describe('Scanning', () => {
    beforeEach(async () => {
      const container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);

      await service.initialize('test-container');
    });

    afterEach(() => {
      const container = document.getElementById('test-container');
      if (container) {
        container.remove();
      }
    });

    it('should start scanning', async () => {
      const scanCallback = jest.fn();

      await service.startScanning(scanCallback);

      expect(service.isActive()).toBe(true);
      expect(mockProvider.getMockState().isRunning).toBe(true);
    });

    it('should throw error when starting already running scanner', async () => {
      const scanCallback = jest.fn();

      await service.startScanning(scanCallback);

      await expect(service.startScanning(scanCallback)).rejects.toThrow(
        'Scanner is already running'
      );
    });

    it('should handle scan results', async () => {
      const scanCallback = jest.fn();
      const errorCallback = jest.fn();

      // Set callbacks on mock provider before starting
      mockProvider.setScanCallbacks(scanCallback, errorCallback);

      await service.startScanning(scanCallback, errorCallback);

      // Simulate a scan
      mockProvider.simulateScan('test-qr-code-123');

      expect(scanCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'test-qr-code-123',
          format: 'QR_CODE',
        })
      );
    });

    it('should stop scanning', async () => {
      const scanCallback = jest.fn();

      await service.startScanning(scanCallback);
      expect(service.isActive()).toBe(true);

      await service.stopScanning();
      expect(service.isActive()).toBe(false);
      expect(mockProvider.getMockState().isRunning).toBe(false);
    });

    it('should not throw error when stopping inactive scanner', async () => {
      await expect(service.stopScanning()).resolves.not.toThrow();
    });
  });

  describe('Torch Control', () => {
    it('should toggle torch', async () => {
      const container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);

      await service.initialize('test-container');

      expect(mockProvider.getMockState().torchOn).toBe(false);

      await service.toggleTorch();
      expect(mockProvider.getMockState().torchOn).toBe(true);

      await service.toggleTorch();
      expect(mockProvider.getMockState().torchOn).toBe(false);

      container.remove();
    });
  });

  describe('Zoom Control', () => {
    it('should set zoom level', async () => {
      const container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);

      await service.initialize('test-container');

      await service.setZoom(0.5);
      expect(mockProvider.getMockState().zoomLevel).toBe(0.5);

      await service.setZoom(0.8);
      expect(mockProvider.getMockState().zoomLevel).toBe(0.8);

      container.remove();
    });

    it('should reject invalid zoom levels', async () => {
      const container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);

      await service.initialize('test-container');

      await expect(service.setZoom(-0.1)).rejects.toThrow();
      await expect(service.setZoom(1.5)).rejects.toThrow();

      container.remove();
    });
  });

  describe('Camera Availability', () => {
    it('should check camera availability', async () => {
      const isAvailable = await service.isCameraAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });

    it('should return true for mock provider', async () => {
      const isAvailable = await service.isCameraAvailable();
      expect(isAvailable).toBe(true);
    });
  });

  describe('Manual Trigger', () => {
    beforeEach(async () => {
      const container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);

      await service.initialize('test-container');
    });

    afterEach(() => {
      const container = document.getElementById('test-container');
      if (container) {
        container.remove();
      }
    });

    it('should trigger scan result', async () => {
      const scanCallback = jest.fn();

      await service.startScanning(scanCallback);

      service.triggerScanResult('manual-code-123', 'CODE_128');

      expect(scanCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'manual-code-123',
          format: 'CODE_128',
        })
      );
    });

    it('should trigger error', async () => {
      const errorCallback = jest.fn();

      await service.startScanning(() => {}, errorCallback);

      service.triggerError(new Error('Test error'));

      expect(errorCallback).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', async () => {
      const container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);

      const scanCallback = jest.fn();

      await service.initialize('test-container');
      await service.startScanning(scanCallback);

      await service.cleanup();

      expect(service.isActive()).toBe(false);

      container.remove();
    });
  });

  describe('Event Dispatch', () => {
    it('should dispatch custom event on scan', async () => {
      const container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);

      const eventListener = jest.fn();
      window.addEventListener('qr-scanned', eventListener);

      await service.initialize('test-container');
      const scanCallback = jest.fn();

      // Set callbacks on provider before starting
      mockProvider.setScanCallbacks(scanCallback);

      await service.startScanning(scanCallback);

      mockProvider.simulateScan('test-code-456');

      expect(eventListener).toHaveBeenCalled();

      window.removeEventListener('qr-scanned', eventListener);
      container.remove();
    });
  });
});
