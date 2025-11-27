/**
 * Mock Camera Provider Tests
 * Tests for the mock camera implementation used in testing
 */

import { MockCameraProvider } from '../MockCameraProvider';
import { QRScanResult } from '../qrScannerService';

describe('MockCameraProvider', () => {
  let provider: MockCameraProvider;
  let container: HTMLElement;

  beforeEach(() => {
    provider = new MockCameraProvider();
    container = document.createElement('div');
    container.id = 'test-camera';
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('Initialization', () => {
    it('should initialize with default config', async () => {
      await provider.initialize('test-camera', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorch: true,
        showZoom: true,
      });

      const state = provider.getMockState();
      expect(state.containerId).toBe('test-camera');
    });

    it('should render mock camera feed', async () => {
      await provider.initialize('test-camera', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorch: true,
        showZoom: true,
      });

      const html = container.innerHTML;
      expect(html).toContain('Mock Camera');
      expect(html).toContain('Ready to scan');
    });

    it('should handle multiple initializations', async () => {
      await provider.initialize('test-camera', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorch: true,
        showZoom: true,
      });

      // Re-initialize should clear previous state
      await provider.initialize('test-camera', {
        fps: 15,
        qrbox: { width: 300, height: 300 },
        aspectRatio: 1.0,
        showTorch: true,
        showZoom: true,
      });

      const state = provider.getMockState();
      expect(state.containerId).toBe('test-camera');
    });
  });

  describe('Start/Stop', () => {
    beforeEach(async () => {
      await provider.initialize('test-camera', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorch: true,
        showZoom: true,
      });
    });

    it('should start scanning', async () => {
      await provider.start();
      expect(provider.getMockState().isRunning).toBe(true);
    });

    it('should stop scanning', async () => {
      await provider.start();
      expect(provider.getMockState().isRunning).toBe(true);

      await provider.stop();
      expect(provider.getMockState().isRunning).toBe(false);
    });

    it('should handle multiple stops', async () => {
      await provider.start();
      await provider.stop();
      await expect(provider.stop()).resolves.not.toThrow();
    });
  });

  describe('Torch Control', () => {
    beforeEach(async () => {
      await provider.initialize('test-camera', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorch: true,
        showZoom: true,
      });
    });

    it('should toggle torch on', async () => {
      expect(provider.getMockState().torchOn).toBe(false);

      await provider.toggleTorch();
      expect(provider.getMockState().torchOn).toBe(true);
    });

    it('should toggle torch off', async () => {
      await provider.toggleTorch();
      await provider.toggleTorch();
      expect(provider.getMockState().torchOn).toBe(false);
    });
  });

  describe('Zoom Control', () => {
    beforeEach(async () => {
      await provider.initialize('test-camera', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorch: true,
        showZoom: true,
      });
    });

    it('should set zoom level', async () => {
      await provider.setZoom(0.5);
      expect(provider.getMockState().zoomLevel).toBe(0.5);

      await provider.setZoom(0.8);
      expect(provider.getMockState().zoomLevel).toBe(0.8);
    });

    it('should reject invalid zoom levels', async () => {
      await expect(provider.setZoom(-0.1)).rejects.toThrow();
      await expect(provider.setZoom(1.5)).rejects.toThrow();
    });

    it('should accept boundary zoom levels', async () => {
      await expect(provider.setZoom(0)).resolves.not.toThrow();
      await expect(provider.setZoom(1)).resolves.not.toThrow();
    });
  });

  describe('Camera Availability', () => {
    it('should always be available', async () => {
      const available = await provider.isAvailable();
      expect(available).toBe(true);
    });
  });

  describe('Scan Callbacks', () => {
    beforeEach(async () => {
      await provider.initialize('test-camera', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorch: true,
        showZoom: true,
      });
    });

    it('should set scan callbacks', async () => {
      const scanCallback = jest.fn();
      const errorCallback = jest.fn();

      provider.setScanCallbacks(scanCallback, errorCallback);

      await provider.start();
      provider.simulateScan('test-code');

      expect(scanCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'test-code',
        })
      );
    });

    it('should call error callback', async () => {
      const errorCallback = jest.fn();

      provider.setScanCallbacks(() => {}, errorCallback);

      provider.simulateError('Test error');

      expect(errorCallback).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Simulation', () => {
    beforeEach(async () => {
      await provider.initialize('test-camera', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorch: true,
        showZoom: true,
      });
    });

    it('should simulate scan when running', async () => {
      const scanCallback = jest.fn();
      provider.setScanCallbacks(scanCallback);

      await provider.start();
      provider.simulateScan('barcode-123', 'EAN_13');

      expect(scanCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'barcode-123',
          format: 'EAN_13',
          timestamp: expect.any(Number),
        })
      );
    });

    it('should not simulate scan when stopped', async () => {
      const scanCallback = jest.fn();
      provider.setScanCallbacks(scanCallback);

      provider.simulateScan('code');

      expect(scanCallback).not.toHaveBeenCalled();
    });

    it('should dispatch custom event on scan', async () => {
      const eventListener = jest.fn();
      window.addEventListener('qr-scanned', eventListener);

      const scanCallback = jest.fn();
      provider.setScanCallbacks(scanCallback);

      await provider.start();
      provider.simulateScan('event-test-code');

      expect(eventListener).toHaveBeenCalled();

      window.removeEventListener('qr-scanned', eventListener);
    });
  });

  describe('Cleanup', () => {
    beforeEach(async () => {
      await provider.initialize('test-camera', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorch: true,
        showZoom: true,
      });
    });

    it('should clear container on cleanup', async () => {
      expect(container.innerHTML).toContain('Mock Camera');

      await provider.clear();

      expect(container.innerHTML).toBe('');
      expect(provider.getMockState().containerId).toBeNull();
    });

    it('should stop scanning on cleanup', async () => {
      await provider.start();
      expect(provider.getMockState().isRunning).toBe(true);

      await provider.clear();

      expect(provider.getMockState().isRunning).toBe(false);
    });

    it('should handle cleanup without starting', async () => {
      await expect(provider.clear()).resolves.not.toThrow();
    });
  });

  describe('Auto-Scan Configuration', () => {
    it('should auto-scan after delay', async () => {
      const autoProvider = new MockCameraProvider({
        autoScanDelay: 100,
        testCode: 'auto-code-123',
      });

      const scanCallback = jest.fn();
      autoProvider.setScanCallbacks(scanCallback);

      const container = document.createElement('div');
      container.id = 'test-auto';
      document.body.appendChild(container);

      await autoProvider.initialize('test-auto', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorch: true,
        showZoom: true,
      });

      await autoProvider.start();

      // Wait for auto-scan
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(scanCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'auto-code-123',
        })
      );

      container.remove();
    });

    it('should not auto-scan with zero delay', async () => {
      const autoProvider = new MockCameraProvider({
        autoScanDelay: 0,
      });

      const scanCallback = jest.fn();
      autoProvider.setScanCallbacks(scanCallback);

      const container = document.createElement('div');
      container.id = 'test-no-auto';
      document.body.appendChild(container);

      await autoProvider.initialize('test-no-auto', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorch: true,
        showZoom: true,
      });

      await autoProvider.start();

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(scanCallback).not.toHaveBeenCalled();

      container.remove();
    });
  });

  describe('Mock State', () => {
    it('should provide mock state for testing', async () => {
      await provider.initialize('test-camera', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorch: true,
        showZoom: true,
      });

      await provider.start();
      await provider.toggleTorch();
      await provider.setZoom(0.7);

      const state = provider.getMockState();

      expect(state).toEqual({
        isRunning: true,
        torchOn: true,
        zoomLevel: 0.7,
        containerId: 'test-camera',
      });
    });
  });
});
