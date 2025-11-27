/**
 * Html5Qrcode Camera Provider
 * Implementation of ICameraProvider using html5-qrcode library
 * Provides real camera-based QR code scanning
 */

import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeSupportedFormats, Html5QrcodeResult } from 'html5-qrcode';
import { ICameraProvider, QRScannerConfig, QRScanResult } from './qrScannerService';

export class Html5QrcodeCameraProvider implements ICameraProvider {
  private scanner: Html5QrcodeScanner | null = null;
  private onScanCallback: ((result: QRScanResult) => void) | null = null;
  private onErrorCallback: ((error: unknown) => void) | null = null;
  private containerId: string | null = null;
  private torchOn: boolean = false;

  async initialize(containerId: string, config: QRScannerConfig): Promise<void> {
    // Clean up existing scanner if any
    await this.clear();

    // Store container ID for cleanup purposes
    this.containerId = containerId;

    // Create new scanner
    this.scanner = new Html5QrcodeScanner(
      containerId,
      {
        fps: config.fps,
        qrbox: config.qrbox,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        aspectRatio: config.aspectRatio,
        showTorchButtonIfSupported: config.showTorch,
        showZoomSliderIfSupported: config.showZoom,
        // Support multiple barcode formats
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.AZTEC,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
        ],
      },
      false // verbose mode
    );
  }

  async start(): Promise<void> {
    if (!this.scanner) {
      throw new Error('Scanner not initialized. Call initialize() first.');
    }

    return new Promise((resolve) => {
      this.scanner!.render(
        (decodedText: string, decodedResult: Html5QrcodeResult) => {
          this.handleScanSuccess(decodedText, decodedResult);
          resolve();
        },
        (errorMessage: string) => {
          this.handleScanError(errorMessage);
        }
      );
    });
  }

  async stop(): Promise<void> {
    if (!this.scanner) {
      return;
    }

    try {
      await this.scanner.pause();
    } catch (error) {
      console.warn('Error pausing scanner:', error);
    }
  }

  async clear(): Promise<void> {
    if (!this.scanner) {
      return;
    }

    try {
      await this.scanner.clear();
    } catch (error) {
      console.warn('Error clearing scanner:', error);
    } finally {
      this.scanner = null;
      // Reset container ID tracking
      if (this.containerId) {
        this.containerId = null;
      }
    }
  }

  async toggleTorch(): Promise<void> {
    if (!this.scanner) {
      console.warn('Scanner not initialized');
      return;
    }

    try {
      // Html5QrcodeScanner doesn't have direct torch control
      // This would need to be implemented with device camera API
      // For now, just toggle the state
      this.torchOn = !this.torchOn;
      console.log('Torch toggled:', this.torchOn);
    } catch (error) {
      console.error('Error toggling torch:', error);
    }
  }

  async setZoom(level: number): Promise<void> {
    if (!this.scanner) {
      console.warn('Scanner not initialized');
      return;
    }

    try {
      // Zoom would be handled through camera stream API
      // Html5QrcodeScanner provides UI slider but zoom control
      // would need to be implemented through device camera API
      console.log('Zoom level set to:', level);
    } catch (error) {
      console.error('Error setting zoom:', error);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const devices = await (navigator.mediaDevices as MediaDevices).enumerateDevices();
      return devices.some((device: MediaDeviceInfo) => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error checking camera availability:', error);
      return false;
    }
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
   * Handle successful scan
   */
  private handleScanSuccess(decodedText: string, decodedResult: Html5QrcodeResult): void {
    if (!this.onScanCallback) {
      return;
    }

    const result: QRScanResult = {
      code: decodedText,
      format: decodedResult?.result?.format?.formatName || 'UNKNOWN',
      timestamp: Date.now(),
      rawResult: decodedResult as unknown as Record<string, unknown>,
    };

    this.onScanCallback(result);

    // Dispatch event for test compatibility
    window.dispatchEvent(
      new CustomEvent('qr-scanned', {
        detail: decodedText,
      })
    );
  }

  /**
   * Handle scan error
   */
  private handleScanError(error: unknown): void {
    // Only report non-NotFoundException errors to avoid spam
    if (error && typeof error === 'string' && !error.includes('NotFoundException')) {
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
      console.debug('QR scan error:', error);
    }
  }
}
