import { Page, Locator } from '@playwright/test';

/**
 * Delivery Page Object
 * Handles delivery tracking and administration
 */

export class DeliveryPage {
  readonly page: Page;
  readonly deliveryOrdersList: Locator;
  readonly orderItem: Locator;
  readonly pickupButton: Locator;
  readonly startDeliveryButton: Locator;
  readonly inTransitButton: Locator;
  readonly deliveredButton: Locator;
  readonly scanQRCodeButton: Locator;
  readonly confirmDeliveryButton: Locator;
  readonly administerMedicationButton: Locator;
  readonly patientSignatureInput: Locator;
  readonly deliveryNotesInput: Locator;
  readonly gpsTrackingMap: Locator;
  readonly currentLocationButton: Locator;
  readonly destinationAddressField: Locator;
  readonly orderStatusBadge: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly filterByStatusSelect: Locator;
  readonly searchOrderInput: Locator;
  readonly administrationRecordButton: Locator;
  readonly medicationAdminInput: Locator;
  readonly administerTimeInput: Locator;
  readonly administerByInput: Locator;
  readonly patientConfirmationCheckbox: Locator;
  readonly submitAdministrationButton: Locator;
  readonly administrationHistoryButton: Locator;
  readonly medicationReceiptButton: Locator;
  readonly printReceiptButton: Locator;
  readonly receiptPreview: Locator;

  constructor(page: Page) {
    this.page = page;
    this.deliveryOrdersList = page.locator('[data-testid="delivery-orders"], .delivery-orders');
    this.orderItem = page.locator('[data-testid="order-item"], .order-item, [role="listitem"]');
    this.pickupButton = page.locator('button:has-text("Pick Up"), button:has-text("Pickup"), [data-testid="pickup-btn"]');
    this.startDeliveryButton = page.locator('button:has-text("Start Delivery"), button:has-text("Begin"), [data-testid="start-delivery-btn"]');
    this.inTransitButton = page.locator('button:has-text("In Transit"), button:has-text("On the way"), [data-testid="in-transit-btn"]');
    this.deliveredButton = page.locator('button:has-text("Delivered"), button:has-text("Complete"), [data-testid="delivered-btn"]');
    this.scanQRCodeButton = page.locator('button:has-text("Scan QR"), button:has-text("Scan"), [data-testid="scan-qr-btn"]');
    this.confirmDeliveryButton = page.locator('button:has-text("Confirm Delivery"), button:has-text("Confirm"), [data-testid="confirm-delivery-btn"]');
    this.administerMedicationButton = page.locator('button:has-text("Administer"), button:has-text("Give Medication"), [data-testid="administer-btn"]');
    this.patientSignatureInput = page.locator('canvas[data-testid="signature-pad"], input[placeholder*="signature"]');
    this.deliveryNotesInput = page.locator('textarea[placeholder*="notes"], [data-testid="delivery-notes"]');
    this.gpsTrackingMap = page.locator('[data-testid="gps-tracking"], .map-container');
    this.currentLocationButton = page.locator('button:has-text("Current Location"), [data-testid="current-location-btn"]');
    this.destinationAddressField = page.locator('[data-testid="destination-address"], .destination');
    this.orderStatusBadge = page.locator('[data-testid="order-status"], .status-badge');
    this.successMessage = page.locator('[role="alert"]:has-text("success"), .alert-success, [data-testid="success-message"]');
    this.errorMessage = page.locator('[role="alert"]:has-text("error"), .alert-danger, [data-testid="error-message"]');
    this.filterByStatusSelect = page.locator('select[name*="status"], [data-testid="status-filter"]');
    this.searchOrderInput = page.locator('input[placeholder*="search"], [data-testid="search-order"]');
    this.administrationRecordButton = page.locator('button:has-text("Record Administration"), button:has-text("Administer"), [data-testid="record-admin-btn"]');
    this.medicationAdminInput = page.locator('input[placeholder*="medication"], [data-testid="medication-admin-input"]');
    this.administerTimeInput = page.locator('input[type="time"], [data-testid="admin-time-input"]');
    this.administerByInput = page.locator('input[placeholder*="administered by"], [data-testid="admin-by-input"]');
    this.patientConfirmationCheckbox = page.locator('input[type="checkbox"][name*="confirm"], [data-testid="patient-confirm-checkbox"]');
    this.submitAdministrationButton = page.locator('button:has-text("Confirm Administration"), button:has-text("Record"), [data-testid="submit-admin-btn"]');
    this.administrationHistoryButton = page.locator('button:has-text("History"), button:has-text("Administration History"), [data-testid="history-btn"]');
    this.medicationReceiptButton = page.locator('button:has-text("Receipt"), button:has-text("Print Receipt"), [data-testid="receipt-btn"]');
    this.printReceiptButton = page.locator('button:has-text("Print"), button:has-text("Download"), [data-testid="print-btn"]');
    this.receiptPreview = page.locator('[data-testid="receipt-preview"], .receipt-preview');
  }

  /**
   * Navigate to delivery section
   */
  async goto() {
    await this.page.goto('/delivery/orders');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get list of delivery orders
   */
  async getDeliveryOrders() {
    return await this.deliveryOrdersList.isVisible();
  }

  /**
   * Select delivery order
   */
  async selectOrder(index: number = 0) {
    const orders = this.orderItem;
    await orders.nth(index).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Pick up order
   */
  async pickupOrder() {
    await this.pickupButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Start delivery
   */
  async startDelivery() {
    await this.startDeliveryButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Mark order as in transit
   */
  async markInTransit() {
    await this.inTransitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Confirm delivery at patient location
   */
  async confirmDelivery(signature: boolean = true) {
    if (signature && await this.patientSignatureInput.isVisible()) {
      // For canvas signature, we'll use a simple click to simulate signing
      const canvas = this.page.locator('canvas[data-testid="signature-pad"]').first();
      if (await canvas.isVisible()) {
        const box = await canvas.boundingBox();
        if (box) {
          // Simulate a signature stroke
          await this.page.mouse.move(box.x + 50, box.y + 50);
          await this.page.mouse.down();
          await this.page.mouse.move(box.x + 100, box.y + 50);
          await this.page.mouse.up();
        }
      }
    }

    await this.confirmDeliveryButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Mark as delivered
   */
  async markAsDelivered() {
    await this.deliveredButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Scan QR code for order verification
   */
  async scanQRCode() {
    await this.scanQRCodeButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Administer medication to patient
   */
  async administerMedication(
    medicationName: string,
    administeredBy: string,
    administeredTime?: string
  ) {
    await this.administerMedicationButton.click();
    await this.page.waitForLoadState('networkidle');

    await this.medicationAdminInput.fill(medicationName);
    await this.administerByInput.fill(administeredBy);

    if (administeredTime) {
      await this.administerTimeInput.fill(administeredTime);
    }

    // Check patient confirmation
    if (await this.patientConfirmationCheckbox.isVisible()) {
      await this.patientConfirmationCheckbox.check();
    }

    await this.submitAdministrationButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Add delivery notes
   */
  async addDeliveryNotes(notes: string) {
    await this.deliveryNotesInput.fill(notes);
  }

  /**
   * Get GPS tracking map
   */
  async getGPSTracking(): Promise<boolean> {
    return await this.gpsTrackingMap.isVisible();
  }

  /**
   * Get destination address
   */
  async getDestinationAddress(): Promise<string> {
    return await this.destinationAddressField.textContent() || '';
  }

  /**
   * Get success message
   */
  async getSuccessMessage(): Promise<string> {
    await this.successMessage.waitFor({ state: 'visible' });
    return await this.successMessage.textContent() || '';
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    if (await this.errorMessage.isVisible()) {
      return await this.errorMessage.textContent() || '';
    }
    return '';
  }

  /**
   * Search for delivery order
   */
  async searchOrder(orderId: string) {
    await this.searchOrderInput.fill(orderId);
    await this.searchOrderInput.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Filter orders by status
   */
  async filterByStatus(status: string) {
    await this.filterByStatusSelect.selectOption(status);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * View administration history
   */
  async viewAdministrationHistory() {
    await this.administrationHistoryButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * View medication receipt
   */
  async viewMedicationReceipt() {
    await this.medicationReceiptButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Print receipt
   */
  async printReceipt() {
    await this.printReceiptButton.click();
    await this.page.waitForTimeout(1000); // Wait for print dialog
  }

  /**
   * Get order count
   */
  async getOrderCount(): Promise<number> {
    const orders = this.page.locator('[data-testid="order-item"], .order-item');
    return await orders.count();
  }

  /**
   * Check current location
   */
  async updateCurrentLocation() {
    if (await this.currentLocationButton.isVisible()) {
      await this.currentLocationButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Wait for success message
   */
  async waitForSuccess(timeout: number = 5000): Promise<boolean> {
    try {
      await this.successMessage.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Navigate to delivery dashboard
   */
  async goToDashboard() {
    await this.page.goto('/delivery/dashboard');
    await this.page.waitForLoadState('networkidle');
  }
}
