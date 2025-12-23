import { Page, Locator } from '@playwright/test';

/**
 * Pharmacy Page Object
 * Handles pharmacy-specific workflows and order fulfillment
 */

export class PharmacyPage {
  readonly page: Page;
  readonly ordersTab: Locator;
  readonly incomingOrdersList: Locator;
  readonly orderItem: Locator;
  readonly fillOrderButton: Locator;
  readonly approveButton: Locator;
  readonly rejectButton: Locator;
  readonly inventoryCheckButton: Locator;
  readonly confirmStockButton: Locator;
  readonly readyForPickupButton: Locator;
  readonly markAsFilledButton: Locator;
  readonly medicationInput: Locator;
  readonly dosageInput: Locator;
  readonly quantityInput: Locator;
  readonly notesInput: Locator;
  readonly ordersList: Locator;
  readonly orderStatusBadge: Locator;
  readonly patientNameField: Locator;
  readonly prescriptionValidationMessage: Locator;
  readonly stockAvailableMessage: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly searchOrderInput: Locator;
  readonly filterByStatusSelect: Locator;
  readonly filterByPatientSelect: Locator;
  readonly orderDetailsPanel: Locator;
  readonly closeDetailsButton: Locator;
  readonly deliveryRequestButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.ordersTab = page.locator('a:has-text("Orders"), button:has-text("Orders"), [data-testid="orders-tab"]');
    this.incomingOrdersList = page.locator('[data-testid="incoming-orders"], .incoming-orders');
    this.orderItem = page.locator('[data-testid="order-item"], .order-item, [role="listitem"]');
    this.fillOrderButton = page.locator('button:has-text("Fill Order"), button:has-text("Prepare"), [data-testid="fill-order-btn"]');
    this.approveButton = page.locator('button:has-text("Approve"), button:has-text("Accept"), [data-testid="approve-btn"]');
    this.rejectButton = page.locator('button:has-text("Reject"), button:has-text("Decline"), [data-testid="reject-btn"]');
    this.inventoryCheckButton = page.locator('button:has-text("Check Inventory"), [data-testid="inventory-check-btn"]');
    this.confirmStockButton = page.locator('button:has-text("Confirm Stock"), [data-testid="confirm-stock-btn"]');
    this.readyForPickupButton = page.locator('button:has-text("Ready for Pickup"), [data-testid="ready-pickup-btn"]');
    this.markAsFilledButton = page.locator('button:has-text("Mark as Filled"), button:has-text("Complete"), [data-testid="mark-filled-btn"]');
    this.medicationInput = page.locator('input[placeholder*="medication"], [data-testid="medication-input"]');
    this.dosageInput = page.locator('input[placeholder*="dosage"], [data-testid="dosage-input"]');
    this.quantityInput = page.locator('input[placeholder*="quantity"], [data-testid="quantity-input"]');
    this.notesInput = page.locator('textarea[placeholder*="notes"], [data-testid="notes-input"]');
    this.ordersList = page.locator('[data-testid="orders-list"], .orders-list');
    this.orderStatusBadge = page.locator('[data-testid="order-status"], .status-badge');
    this.patientNameField = page.locator('[data-testid="patient-name"], .patient-name');
    this.prescriptionValidationMessage = page.locator('[data-testid="prescription-validation"], .validation-message');
    this.stockAvailableMessage = page.locator('[data-testid="stock-available"], .stock-message');
    this.successMessage = page.locator('[role="alert"]:has-text("success"), .alert-success, [data-testid="success-message"]');
    this.errorMessage = page.locator('[role="alert"]:has-text("error"), .alert-danger, [data-testid="error-message"]');
    this.searchOrderInput = page.locator('input[placeholder*="search"], [data-testid="search-order"]');
    this.filterByStatusSelect = page.locator('select[name*="status"], [data-testid="status-filter"]');
    this.filterByPatientSelect = page.locator('select[name*="patient"], [data-testid="patient-filter"]');
    this.orderDetailsPanel = page.locator('[data-testid="order-details"], .order-details-panel');
    this.closeDetailsButton = page.locator('button:has-text("Close"), [data-testid="close-details-btn"]');
    this.deliveryRequestButton = page.locator('button:has-text("Request Delivery"), button:has-text("Schedule Delivery"), [data-testid="request-delivery-btn"]');
  }

  /**
   * Navigate to pharmacy orders section
   */
  async goto() {
    await this.page.goto('/pharmacist/orders');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get incoming orders list
   */
  async getIncomingOrders() {
    return await this.incomingOrdersList.isVisible();
  }

  /**
   * Select order from list
   */
  async selectOrder(index: number = 0) {
    const orders = this.orderItem;
    await orders.nth(index).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill medication order
   */
  async fillOrder() {
    await this.fillOrderButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Approve order
   */
  async approveOrder() {
    await this.approveButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check inventory for order
   */
  async checkInventory() {
    await this.inventoryCheckButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Confirm stock availability
   */
  async confirmStock() {
    await this.confirmStockButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Mark order as ready for pickup
   */
  async markAsReadyForPickup() {
    await this.readyForPickupButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Mark order as filled/complete
   */
  async markAsCompleted() {
    await this.markAsFilledButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Reject order
   */
  async rejectOrder(reason?: string) {
    await this.rejectButton.click();
    await this.page.waitForLoadState('networkidle');

    if (reason) {
      await this.notesInput.fill(reason);
      const submitBtn = this.page.locator('button:has-text("Submit"), button:has-text("Reject")').last();
      await submitBtn.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Get patient name from order details
   */
  async getPatientName(): Promise<string> {
    return await this.patientNameField.textContent() || '';
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
   * Search for order
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
   * Filter orders by patient
   */
  async filterByPatient(patientName: string) {
    await this.filterByPatientSelect.fill(patientName);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check prescription validation message
   */
  async getPrescriptionValidationMessage(): Promise<string> {
    if (await this.prescriptionValidationMessage.isVisible()) {
      return await this.prescriptionValidationMessage.textContent() || '';
    }
    return '';
  }

  /**
   * Check stock availability message
   */
  async getStockAvailableMessage(): Promise<string> {
    if (await this.stockAvailableMessage.isVisible()) {
      return await this.stockAvailableMessage.textContent() || '';
    }
    return '';
  }

  /**
   * Request delivery for filled order
   */
  async requestDelivery() {
    await this.deliveryRequestButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get order count
   */
  async getOrderCount(): Promise<number> {
    const orders = this.page.locator('[data-testid="order-item"], .order-item');
    return await orders.count();
  }

  /**
   * Close order details panel
   */
  async closeOrderDetails() {
    if (await this.closeDetailsButton.isVisible()) {
      await this.closeDetailsButton.click();
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
   * Navigate to pharmacy dashboard
   */
  async goToDashboard() {
    await this.page.goto('/pharmacist/dashboard');
    await this.page.waitForLoadState('networkidle');
  }
}
