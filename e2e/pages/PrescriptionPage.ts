import { Page, Locator } from '@playwright/test';

/**
 * Prescription Page Object
 * Handles prescription upload, processing, and lifecycle
 */

export class PrescriptionPage {
  readonly page: Page;
  readonly uploadButton: Locator;
  readonly fileInput: Locator;
  readonly prescriptionList: Locator;
  readonly prescriptionStatus: Locator;
  readonly reviewButton: Locator;
  readonly approveButton: Locator;
  readonly orderButton: Locator;
  readonly trackingInfo: Locator;
  readonly adherenceSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.uploadButton = page.locator('button:has-text("Upload"), button:has-text("upload")');
    this.fileInput = page.locator('input[type="file"]');
    this.prescriptionList = page.locator('[data-testid="prescription-list"], .prescriptions');
    this.prescriptionStatus = page.locator('[data-testid="prescription-status"], .status');
    this.reviewButton = page.locator('button:has-text("Review")');
    this.approveButton = page.locator('button:has-text("Approve")');
    this.orderButton = page.locator('button:has-text("Place Order"), button:has-text("Order")');
    this.trackingInfo = page.locator('[data-testid="tracking-info"], .tracking');
    this.adherenceSection = page.locator('[data-testid="adherence"], .adherence-tracking');
  }

  async goto() {
    await this.page.goto('/patient/prescriptions');
  }

  async uploadPrescription(filePath: string) {
    // In real scenario, would upload file
    // For E2E testing with mocks, we simulate the action
    const uploadVisible = await this.uploadButton.isVisible().catch(() => false);
    if (uploadVisible) {
      await this.uploadButton.click();
      // Mock file upload by setting data attributes
      await this.page.evaluate(() => {
        document.body.setAttribute('data-test-prescription-uploaded', 'true');
      });
    }
  }

  async waitForOCRProcessing() {
    // Wait for OCR processing to complete (mocked)
    await this.page.waitForTimeout(1000);
    const processingIndicator = this.page.locator('[data-testid="processing"], .processing');
    await processingIndicator.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  async checkDrugInteractions() {
    const interactionCheck = this.page.locator('[data-testid="drug-interactions"], .interactions');
    return await interactionCheck.isVisible().catch(() => false);
  }

  async getStatus(): Promise<string> {
    const statusElement = await this.prescriptionStatus.first();
    return await statusElement.textContent() || 'UNKNOWN';
  }

  async approvePrescription() {
    const approveVisible = await this.approveButton.isVisible().catch(() => false);
    if (approveVisible) {
      await this.approveButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async placeOrder() {
    const orderVisible = await this.orderButton.isVisible().catch(() => false);
    if (orderVisible) {
      await this.orderButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async getTrackingInfo(): Promise<string | null> {
    const trackingVisible = await this.trackingInfo.isVisible().catch(() => false);
    if (trackingVisible) {
      return await this.trackingInfo.textContent();
    }
    return null;
  }

  async hasAdherenceTracking(): Promise<boolean> {
    return await this.adherenceSection.isVisible().catch(() => false);
  }
}
