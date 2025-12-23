import { Page, Locator } from '@playwright/test';

/**
 * Nurse Page Object
 * Handles nurse-specific workflows and interactions
 */

export class NursePage {
  readonly page: Page;
  readonly medicationOrdersTab: Locator;
  readonly patientSearchInput: Locator;
  readonly patientList: Locator;
  readonly patientItem: Locator;
  readonly newOrderButton: Locator;
  readonly medicationInput: Locator;
  readonly dosageInput: Locator;
  readonly quantityInput: Locator;
  readonly urgencySelect: Locator;
  readonly instructionsInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly ordersList: Locator;
  readonly orderStatusBadge: Locator;
  readonly adverseReactionButton: Locator;
  readonly shiftHandoverButton: Locator;
  readonly emergencyRequestButton: Locator;
  readonly medicationNameInput: Locator;
  readonly reactionTypeSelect: Locator;
  readonly severitySelect: Locator;
  readonly reportReactionButton: Locator;
  readonly handoverNotesInput: Locator;
  readonly startShiftButton: Locator;
  readonly endShiftButton: Locator;
  readonly shiftNotesInput: Locator;
  readonly emergencyMedicationInput: Locator;
  readonly emergencyReasonInput: Locator;
  readonly requestEmergencyButton: Locator;
  readonly patientRecords: Locator;
  readonly allergiesSection: Locator;
  readonly activeMedicationsSection: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly orderStatusFilter: Locator;
  readonly dateFilter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.medicationOrdersTab = page.locator('a:has-text("Medication Orders"), button:has-text("Orders"), [data-testid="orders-tab"]');
    this.patientSearchInput = page.locator('input[placeholder*="search"], input[placeholder*="patient"], [data-testid="patient-search"]');
    this.patientList = page.locator('[data-testid="patient-list"], .patient-list, [role="list"]');
    this.patientItem = page.locator('[data-testid="patient-item"], .patient-item, [data-testid="patient-row"]');
    this.newOrderButton = page.locator('button:has-text("New Order"), button:has-text("Order Medication"), [data-testid="new-order-btn"]');
    this.medicationInput = page.locator('input[placeholder*="medication"], [data-testid="medication-input"], select[name*="medication"]');
    this.dosageInput = page.locator('input[placeholder*="dosage"], [data-testid="dosage-input"]');
    this.quantityInput = page.locator('input[placeholder*="quantity"], [data-testid="quantity-input"]');
    this.urgencySelect = page.locator('select[name*="urgency"], [data-testid="urgency-select"]');
    this.instructionsInput = page.locator('textarea[placeholder*="instructions"], [data-testid="instructions-input"]');
    this.submitButton = page.locator('button:has-text("Submit"), button:has-text("Create Order"), [data-testid="submit-btn"]');
    this.cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Close"), [data-testid="cancel-btn"]');
    this.ordersList = page.locator('[data-testid="orders-list"], .orders-list');
    this.orderStatusBadge = page.locator('[data-testid="order-status"], .status-badge');
    this.adverseReactionButton = page.locator('button:has-text("Report Reaction"), button:has-text("Adverse Reaction"), [data-testid="adverse-reaction-btn"]');
    this.shiftHandoverButton = page.locator('button:has-text("Shift Handover"), button:has-text("Handover Notes"), [data-testid="handover-btn"]');
    this.emergencyRequestButton = page.locator('button:has-text("Emergency Request"), button:has-text("Urgent Order"), [data-testid="emergency-btn"]');
    this.medicationNameInput = page.locator('input[placeholder*="medication name"], [data-testid="med-name-input"]');
    this.reactionTypeSelect = page.locator('select[name*="reaction"], [data-testid="reaction-type-select"]');
    this.severitySelect = page.locator('select[name*="severity"], [data-testid="severity-select"]');
    this.reportReactionButton = page.locator('button:has-text("Report"), button:has-text("Submit Reaction"), [data-testid="report-reaction-btn"]');
    this.handoverNotesInput = page.locator('textarea[placeholder*="handover"], [data-testid="handover-notes"]');
    this.startShiftButton = page.locator('button:has-text("Start Shift"), [data-testid="start-shift-btn"]');
    this.endShiftButton = page.locator('button:has-text("End Shift"), [data-testid="end-shift-btn"]');
    this.shiftNotesInput = page.locator('textarea[placeholder*="shift"], [data-testid="shift-notes"]');
    this.emergencyMedicationInput = page.locator('input[placeholder*="medication"], [data-testid="emergency-med-input"]');
    this.emergencyReasonInput = page.locator('textarea[placeholder*="reason"], [data-testid="emergency-reason"]');
    this.requestEmergencyButton = page.locator('button:has-text("Request"), button:has-text("Request Emergency"), [data-testid="request-emergency-btn"]');
    this.patientRecords = page.locator('[data-testid="patient-records"], .patient-records');
    this.allergiesSection = page.locator('[data-testid="allergies"], .allergies-section');
    this.activeMedicationsSection = page.locator('[data-testid="active-medications"], .medications-section');
    this.successMessage = page.locator('[role="alert"]:has-text("success"), .alert-success, [data-testid="success-message"]');
    this.errorMessage = page.locator('[role="alert"]:has-text("error"), .alert-danger, [data-testid="error-message"]');
    this.orderStatusFilter = page.locator('select[name*="status"], [data-testid="status-filter"]');
    this.dateFilter = page.locator('input[type="date"], [data-testid="date-filter"]');
  }

  /**
   * Navigate to medication orders section
   */
  async goto() {
    await this.page.goto('/nurse/medications');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Search for patient
   */
  async searchPatient(patientName: string) {
    await this.patientSearchInput.fill(patientName);
    await this.patientSearchInput.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Select patient from list
   */
  async selectPatient(index: number = 0) {
    const patients = this.patientItem;
    await patients.nth(index).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Create medication order
   */
  async createMedicationOrder(
    medication: string,
    dosage: string,
    quantity: number,
    urgency?: string,
    instructions?: string
  ) {
    await this.newOrderButton.click();
    await this.page.waitForLoadState('networkidle');

    await this.medicationInput.fill(medication);
    await this.dosageInput.fill(dosage);
    await this.quantityInput.fill(quantity.toString());

    if (urgency) {
      await this.urgencySelect.selectOption(urgency);
    }

    if (instructions) {
      await this.instructionsInput.fill(instructions);
    }

    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Report adverse reaction
   */
  async reportAdverseReaction(
    medicationName: string,
    reactionType: string,
    severity: string,
    description?: string
  ) {
    await this.adverseReactionButton.click();
    await this.page.waitForLoadState('networkidle');

    await this.medicationNameInput.fill(medicationName);
    await this.reactionTypeSelect.selectOption(reactionType);
    await this.severitySelect.selectOption(severity);

    if (description) {
      await this.instructionsInput.fill(description);
    }

    await this.reportReactionButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Start shift handover
   */
  async startShift() {
    await this.startShiftButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * End shift with handover notes
   */
  async endShift(notes: string) {
    await this.endShiftButton.click();
    await this.page.waitForLoadState('networkidle');

    await this.handoverNotesInput.fill(notes);
    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Request emergency medication
   */
  async requestEmergencyMedication(
    medication: string,
    reason: string,
    urgency?: string
  ) {
    await this.emergencyRequestButton.click();
    await this.page.waitForLoadState('networkidle');

    await this.emergencyMedicationInput.fill(medication);
    await this.emergencyReasonInput.fill(reason);

    if (urgency) {
      await this.urgencySelect.selectOption(urgency);
    }

    await this.requestEmergencyButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * View patient records
   */
  async viewPatientRecords(patientIndex: number = 0) {
    await this.selectPatient(patientIndex);
    await this.patientRecords.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check patient allergies
   */
  async checkPatientAllergies(): Promise<boolean> {
    return await this.allergiesSection.isVisible();
  }

  /**
   * Check active medications
   */
  async checkActiveMedications(): Promise<boolean> {
    return await this.activeMedicationsSection.isVisible();
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
   * Filter orders by status
   */
  async filterOrdersByStatus(status: string) {
    await this.orderStatusFilter.selectOption(status);
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
   * Check if order exists
   */
  async orderExists(orderId: string): Promise<boolean> {
    return await this.page.locator(`text=${orderId}`).isVisible();
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string) {
    const deleteButton = this.page.locator(`[data-testid="delete-order-${orderId}"], button:has-text("Cancel")`).first();
    await deleteButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for success message and return true
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
   * Navigate to nurse dashboard
   */
  async goToDashboard() {
    await this.page.goto('/nurse/dashboard');
    await this.page.waitForLoadState('networkidle');
  }
}
