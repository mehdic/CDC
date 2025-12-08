import { Page, Locator } from '@playwright/test';

/**
 * Delivery Page Object
 * Handles delivery workflow, tracking, and completion
 */

export class DeliveryPage {
  readonly page: Page;
  readonly deliveryList: Locator;
  readonly orderDetails: Locator;
  readonly deliveryAddress: Locator;
  readonly acceptButton: Locator;
  readonly startDeliveryButton: Locator;
  readonly mapContainer: Locator;
  readonly trackingStatus: Locator;
  readonly etaDisplay: Locator;
  readonly qrScannerButton: Locator;
  readonly signatureCanvas: Locator;
  readonly completeButton: Locator;
  readonly deliveryTimeline: Locator;
  readonly customerContact: Locator;
  readonly specialInstructions: Locator;
  readonly codPaymentSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.deliveryList = page.locator('[data-testid="delivery-list"], .deliveries');
    this.orderDetails = page.locator('[data-testid="order-details"], .order-info');
    this.deliveryAddress = page.locator('[data-testid="delivery-address"], .address');
    this.acceptButton = page.locator('button:has-text("Accept"), button:has-text("accept")');
    this.startDeliveryButton = page.locator('button:has-text("Start Delivery"), button:has-text("start")');
    this.mapContainer = page.locator('[data-testid="map"], .map-container');
    this.trackingStatus = page.locator('[data-testid="status"], .delivery-status');
    this.etaDisplay = page.locator('[data-testid="eta"], .estimated-arrival');
    this.qrScannerButton = page.locator('button:has-text("Scan QR"), button:has-text("scan")');
    this.signatureCanvas = page.locator('canvas[data-testid="signature"], .signature-pad');
    this.completeButton = page.locator('button:has-text("Complete"), button:has-text("complete")');
    this.deliveryTimeline = page.locator('[data-testid="timeline"], .delivery-timeline');
    this.customerContact = page.locator('[data-testid="customer-contact"], .contact-info');
    this.specialInstructions = page.locator('[data-testid="instructions"], .special-instructions');
    this.codPaymentSection = page.locator('[data-testid="cod-payment"], .payment-cod');
  }

  async goto() {
    await this.page.goto('/delivery/orders');
  }

  async gotoPatientTracking() {
    await this.page.goto('/patient/deliveries');
  }

  async hasPendingDeliveries(): Promise<boolean> {
    return await this.deliveryList.isVisible().catch(() => false);
  }

  async getOrderDetails(): Promise<string | null> {
    const detailsVisible = await this.orderDetails.isVisible().catch(() => false);
    if (detailsVisible) {
      return await this.orderDetails.textContent();
    }
    return null;
  }

  async getDeliveryAddress(): Promise<string | null> {
    const addressVisible = await this.deliveryAddress.isVisible().catch(() => false);
    if (addressVisible) {
      return await this.deliveryAddress.textContent();
    }
    return null;
  }

  async acceptDelivery() {
    const acceptVisible = await this.acceptButton.isVisible().catch(() => false);
    if (acceptVisible) {
      await this.acceptButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async startDelivery() {
    const startVisible = await this.startDeliveryButton.isVisible().catch(() => false);
    if (startVisible) {
      await this.startDeliveryButton.click();
      await this.page.waitForLoadState('networkidle');
      // GPS tracking would start here in real scenario
      await this.page.evaluate(() => {
        document.body.setAttribute('data-test-gps-active', 'true');
      });
    }
  }

  async isMapVisible(): Promise<boolean> {
    return await this.mapContainer.isVisible().catch(() => false);
  }

  async getTrackingStatus(): Promise<string> {
    const statusVisible = await this.trackingStatus.isVisible().catch(() => false);
    if (statusVisible) {
      return await this.trackingStatus.textContent() || 'UNKNOWN';
    }
    return 'UNKNOWN';
  }

  async getETA(): Promise<string | null> {
    const etaVisible = await this.etaDisplay.isVisible().catch(() => false);
    if (etaVisible) {
      return await this.etaDisplay.textContent();
    }
    return null;
  }

  async scanQRCode() {
    const scanVisible = await this.qrScannerButton.isVisible().catch(() => false);
    if (scanVisible) {
      await this.qrScannerButton.click();
      // Simulate QR scan
      await this.page.evaluate(() => {
        document.body.setAttribute('data-test-qr-scanned', 'true');
      });
      await this.page.waitForTimeout(500);
    }
  }

  async captureSignature() {
    const signatureVisible = await this.signatureCanvas.isVisible().catch(() => false);
    if (signatureVisible) {
      // Simulate signature capture
      await this.signatureCanvas.click();
      await this.page.evaluate(() => {
        document.body.setAttribute('data-test-signature-captured', 'true');
      });
    }
  }

  async collectCODPayment(amount: number) {
    const codVisible = await this.codPaymentSection.isVisible().catch(() => false);
    if (codVisible) {
      const amountInput = this.page.locator('input[name*="amount"], input[placeholder*="amount"]');
      await amountInput.fill(String(amount));
      const confirmButton = this.page.locator('button:has-text("Confirm Payment")');
      await confirmButton.click();
    }
  }

  async completeDelivery() {
    const completeVisible = await this.completeButton.isVisible().catch(() => false);
    if (completeVisible) {
      await this.completeButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async hasDeliveryTimeline(): Promise<boolean> {
    return await this.deliveryTimeline.isVisible().catch(() => false);
  }

  async getCustomerContact(): Promise<string | null> {
    const contactVisible = await this.customerContact.isVisible().catch(() => false);
    if (contactVisible) {
      return await this.customerContact.textContent();
    }
    return null;
  }

  async getSpecialInstructions(): Promise<string | null> {
    const instructionsVisible = await this.specialInstructions.isVisible().catch(() => false);
    if (instructionsVisible) {
      return await this.specialInstructions.textContent();
    }
    return null;
  }

  async verifyDeliveryConfirmed(): Promise<boolean> {
    const confirmedStatus = await this.getTrackingStatus();
    return confirmedStatus.toLowerCase().includes('delivered') ||
           confirmedStatus.toLowerCase().includes('completed');
  }
}
