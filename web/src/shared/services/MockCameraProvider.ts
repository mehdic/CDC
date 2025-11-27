/**
 * Mock Camera Provider
 * Implementation of ICameraProvider for testing without real camera
 * Simulates camera behavior and allows programmatic scan triggering
 */

import { ICameraProvider, QRScannerConfig, QRScanResult } from './qrScannerService';

export interface MockScanConfig {
  autoScanDelay?: number; // Delay before auto-triggering a scan (0 to disable)
  testCode?: string; // Code to scan automatically
}

export class MockCameraProvider implements ICameraProvider {
  private containerId: string | null = null;
  private isRunning: boolean = false;
  private config: MockScanConfig;
  private onScanCallback: ((result: QRScanResult) => void) | null = null;
  private onErrorCallback: ((error: unknown) => void) | null = null;
  private torchOn: boolean = false;
  private zoomLevel: number = 0.5;
  private autoScanTimeout: NodeJS.Timeout | null = null;

  constructor(config: MockScanConfig = {}) {
    this.config = {
      autoScanDelay: 0,
      testCode: 'test-qr-code-123',
      ...config,
    };
  }

  async initialize(containerId: string, _config: QRScannerConfig): Promise<void> {
    this.containerId = containerId;

    // Create mock camera feed in the container
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div style="
          width: 100%;
          aspect-ratio: 1;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 16px;
        ">
          <div style="
            color: white;
            font-size: 18px;
            font-weight: bold;
          ">
            📷 Mock Camera
          </div>
          <div style="
            color: rgba(255, 255, 255, 0.7);
            font-size: 14px;
          ">
            Ready to scan
          </div>
          <div style="
            width: 200px;
            height: 200px;
            border: 2px dashed white;
            border-radius: 8px;
            margin-top: 16px;
          "></div>
        </div>
      `;
    }
  }

  async start(): Promise<void> {
    this.isRunning = true;

    // Schedule auto-scan if configured
    if (this.config.autoScanDelay! > 0 && this.config.testCode) {
      this.autoScanTimeout = setTimeout(() => {
        this.simulateScan(this.config.testCode!);
      }, this.config.autoScanDelay!);
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.autoScanTimeout) {
      clearTimeout(this.autoScanTimeout);
      this.autoScanTimeout = null;
    }
  }

  async clear(): Promise<void> {
    await this.stop();
    if (this.containerId) {
      const container = document.getElementById(this.containerId);
      if (container) {
        container.innerHTML = '';
      }
    }
    this.containerId = null;
  }

  async toggleTorch(): Promise<void> {
    this.torchOn = !this.torchOn;
    console.log('Mock torch toggled:', this.torchOn);
  }

  async setZoom(level: number): Promise<void> {
    if (level < 0 || level > 1) {
      throw new Error('Zoom level must be between 0 and 1');
    }
    this.zoomLevel = level;
    console.log('Mock zoom set to:', level);
  }

  async isAvailable(): Promise<boolean> {
    // Mock is always available
    return true;
  }

  /**
   * Set callbacks for scan success/error
   */
  setScanCallbacks(
    onScan: (result: QRScanResult) => void,
    onError?: (error: unknown) => void
  ): void {
    this.onScanCallback = onScan;
    this.onErrorCallback = onError || null;
  }

  /**
   * Simulate a scan with given code
   * Call this to test the scanner behavior
   */
  simulateScan(code: string, format: string = 'QR_CODE'): void {
    if (!this.isRunning) {
      console.warn('Mock scanner is not running');
      return;
    }

    if (!this.onScanCallback) {
      console.warn('No scan callback registered');
      return;
    }

    const result: QRScanResult = {
      code,
      format,
      timestamp: Date.now(),
    };

    this.onScanCallback(result);

    // Dispatch event for test compatibility
    window.dispatchEvent(
      new CustomEvent('qr-scanned', {
        detail: code,
      })
    );
  }

  /**
   * Simulate a scan error
   */
  simulateError(error: string): void {
    if (this.onErrorCallback) {
      this.onErrorCallback(new Error(error));
    }
  }

  /**
   * Get current mock state (for testing)
   */
  getMockState() {
    return {
      isRunning: this.isRunning,
      torchOn: this.torchOn,
      zoomLevel: this.zoomLevel,
      containerId: this.containerId,
    };
  }
}
