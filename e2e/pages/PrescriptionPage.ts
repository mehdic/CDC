import { Page, Locator } from '@playwright/test';

/**
 * Prescription Page Object
 * Handles prescription creation, management, and renewal workflows
 */

export class PrescriptionPage {
  readonly page: Page;

  // Navigation
  readonly prescriptionTab: Locator;
  readonly createNewButton: Locator;
  readonly prescriptionList: Locator;
  readonly prescriptionItem: Locator;

  // Creation/Edit Form
  readonly patientSelectField: Locator;
  readonly patientSearchInput: Locator;
  readonly medicationInput: Locator;
  readonly dosageInput: Locator;
  readonly frequencySelect: Locator;
  readonly durationInput: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly quantityInput: Locator;
  readonly refillsAllowedInput: Locator;
  readonly refillDateInput: Locator;
  readonly instructionsInput: Locator;
  readonly allergiesCheckbox: Locator;
  readonly interactionsCheckbox: Locator;
  readonly submitButton: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  // Details Panel
  readonly prescriptionDetails: Locator;
  readonly detailsTitle: Locator;
  readonly patientInfo: Locator;
  readonly medicationName: Locator;
  readonly dosageInfo: Locator;
  readonly frequencyInfo: Locator;
  readonly prescriptionStatus: Locator;
  readonly createdByInfo: Locator;
  readonly createdDateInfo: Locator;

  // Actions
  readonly approveButton: Locator;
  readonly rejectButton: Locator;
  readonly renewButton: Locator;
  readonly refillButton: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly printButton: Locator;
  readonly shareButton: Locator;
  readonly downloadButton: Locator;

  // Validation Messages
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly warningMessage: Locator;
  readonly allergyWarning: Locator;
  readonly interactionWarning: Locator;
  readonly validationMessage: Locator;

  // Filters
  readonly statusFilter: Locator;
  readonly patientFilter: Locator;
  readonly dateRangeFilter: Locator;
  readonly searchInput: Locator;
  readonly filterButton: Locator;
  readonly clearFiltersButton: Locator;

  // Dialogs
  readonly confirmDialog: Locator;
  readonly confirmButton: Locator;
  readonly reasonInput: Locator;
  readonly renewalForm: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation
    this.prescriptionTab = page.locator('a:has-text("Prescriptions"), button:has-text("Prescriptions"), [data-testid="prescriptions-tab"]');
    this.createNewButton = page.locator('button:has-text("New Prescription"), button:has-text("Create Prescription"), [data-testid="create-prescription-btn"]');
    this.prescriptionList = page.locator('[data-testid="prescription-list"], .prescription-list, [role="list"]');
    this.prescriptionItem = page.locator('[data-testid="prescription-item"], .prescription-item, [role="listitem"]');

    // Creation/Edit Form
    this.patientSelectField = page.locator('select[name*="patient"], [data-testid="patient-select"]');
    this.patientSearchInput = page.locator('input[placeholder*="patient"], [data-testid="patient-search"]');
    this.medicationInput = page.locator('input[placeholder*="medication"], input[name*="medication"], [data-testid="medication-input"]');
    this.dosageInput = page.locator('input[placeholder*="dosage"], input[name*="dosage"], [data-testid="dosage-input"]');
    this.frequencySelect = page.locator('select[name*="frequency"], [data-testid="frequency-select"]');
    this.durationInput = page.locator('input[placeholder*="duration"], input[name*="duration"], [data-testid="duration-input"]');
    this.startDateInput = page.locator('input[type="date"][name*="start"], input[name*="startDate"], [data-testid="start-date"]');
    this.endDateInput = page.locator('input[type="date"][name*="end"], input[name*="endDate"], [data-testid="end-date"]');
    this.quantityInput = page.locator('input[placeholder*="quantity"], input[name*="quantity"], [data-testid="quantity-input"]');
    this.refillsAllowedInput = page.locator('input[placeholder*="refills"], input[name*="refills"], [data-testid="refills-input"]');
    this.refillDateInput = page.locator('input[type="date"][name*="refill"], [data-testid="refill-date"]');
    this.instructionsInput = page.locator('textarea[placeholder*="instructions"], [data-testid="instructions-input"]');
    this.allergiesCheckbox = page.locator('input[type="checkbox"][name*="allergies"], [data-testid="allergies-check"]');
    this.interactionsCheckbox = page.locator('input[type="checkbox"][name*="interactions"], [data-testid="interactions-check"]');
    this.submitButton = page.locator('button:has-text("Create"), button:has-text("Submit"), [data-testid="submit-btn"]');
    this.saveButton = page.locator('button:has-text("Save"), [data-testid="save-btn"]');
    this.cancelButton = page.locator('button:has-text("Cancel"), [data-testid="cancel-btn"]');

    // Details Panel
    this.prescriptionDetails = page.locator('[data-testid="prescription-details"], .prescription-details, [role="region"]');
    this.detailsTitle = page.locator('[data-testid="prescription-title"], h1, h2');
    this.patientInfo = page.locator('[data-testid="patient-info"], .patient-info');
    this.medicationName = page.locator('[data-testid="medication-name"], .medication-name');
    this.dosageInfo = page.locator('[data-testid="dosage-info"], .dosage-info');
    this.frequencyInfo = page.locator('[data-testid="frequency-info"], .frequency-info');
    this.prescriptionStatus = page.locator('[data-testid="prescription-status"], .status-badge');
    this.createdByInfo = page.locator('[data-testid="created-by"], .created-by');
    this.createdDateInfo = page.locator('[data-testid="created-date"], .created-date');

    // Actions
    this.approveButton = page.locator('button:has-text("Approve"), button:has-text("Accept"), [data-testid="approve-btn"]');
    this.rejectButton = page.locator('button:has-text("Reject"), button:has-text("Decline"), [data-testid="reject-btn"]');
    this.renewButton = page.locator('button:has-text("Renew"), button:has-text("Renewal"), [data-testid="renew-btn"]');
    this.refillButton = page.locator('button:has-text("Refill"), button:has-text("Request Refill"), [data-testid="refill-btn"]');
    this.editButton = page.locator('button:has-text("Edit"), [data-testid="edit-btn"]');
    this.deleteButton = page.locator('button:has-text("Delete"), [data-testid="delete-btn"]');
    this.printButton = page.locator('button:has-text("Print"), [data-testid="print-btn"]');
    this.shareButton = page.locator('button:has-text("Share"), [data-testid="share-btn"]');
    this.downloadButton = page.locator('button:has-text("Download"), [data-testid="download-btn"]');

    // Validation Messages
    this.successMessage = page.locator('[role="alert"]:has-text("success"), .alert-success, [data-testid="success-message"]');
    this.errorMessage = page.locator('[role="alert"]:has-text("error"), .alert-danger, [data-testid="error-message"]');
    this.warningMessage = page.locator('[role="alert"]:has-text("warning"), .alert-warning, [data-testid="warning-message"]');
    this.allergyWarning = page.locator('[data-testid="allergy-warning"], .allergy-alert, .allergy-warning');
    this.interactionWarning = page.locator('[data-testid="interaction-warning"], .interaction-alert, .interaction-warning');
    this.validationMessage = page.locator('[data-testid="validation-message"], .validation-message');

    // Filters
    this.statusFilter = page.locator('select[name*="status"], [data-testid="status-filter"]');
    this.patientFilter = page.locator('select[name*="patient"], input[name*="patient"], [data-testid="patient-filter"]');
    this.dateRangeFilter = page.locator('[data-testid="date-range"], .date-range-picker');
    this.searchInput = page.locator('input[placeholder*="search"], [data-testid="search-input"]');
    this.filterButton = page.locator('button:has-text("Filter"), [data-testid="filter-btn"]');
    this.clearFiltersButton = page.locator('button:has-text("Clear"), [data-testid="clear-filters-btn"]');

    // Dialogs
    this.confirmDialog = page.locator('[role="dialog"], .modal, .dialog');
    this.confirmButton = page.locator('button:has-text("Confirm"), button:has-text("OK")');
    this.reasonInput = page.locator('textarea[placeholder*="reason"], input[placeholder*="reason"], [data-testid="reason-input"]');
    this.renewalForm = page.locator('[data-testid="renewal-form"], .renewal-form, form');
  }

  /**
   * Navigate to prescriptions page
   */
  async goto() {
    await this.page.goto('/prescriptions');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to prescriptions as pharmacist
   */
  async gotoPharmacistPrescriptions() {
    await this.page.goto('/pharmacist/prescriptions');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to prescriptions as doctor
   */
  async gotoDoctorPrescriptions() {
    await this.page.goto('/doctor/prescriptions');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to prescriptions as patient
   */
  async gotoPatientPrescriptions() {
    await this.page.goto('/patient/prescriptions');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click create new prescription button
   */
  async clickCreateNew() {
    await this.createNewButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Select patient from list
   */
  async selectPatient(patientName: string) {
    await this.patientSelectField.selectOption(patientName);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Search and select patient
   */
  async searchPatient(patientName: string) {
    await this.patientSearchInput.fill(patientName);
    await this.page.waitForLoadState('networkidle');
    const option = this.page.locator(`[role="option"]:has-text("${patientName}")`).first();
    await option.click();
  }

  /**
   * Fill medication name
   */
  async fillMedication(medicationName: string) {
    await this.medicationInput.fill(medicationName);
  }

  /**
   * Fill dosage
   */
  async fillDosage(dosage: string) {
    await this.dosageInput.fill(dosage);
  }

  /**
   * Select frequency
   */
  async selectFrequency(frequency: string) {
    await this.frequencySelect.selectOption(frequency);
  }

  /**
   * Fill duration
   */
  async fillDuration(duration: string) {
    await this.durationInput.fill(duration);
  }

  /**
   * Fill start date
   */
  async fillStartDate(date: string) {
    await this.startDateInput.fill(date);
  }

  /**
   * Fill end date
   */
  async fillEndDate(date: string) {
    await this.endDateInput.fill(date);
  }

  /**
   * Fill quantity
   */
  async fillQuantity(quantity: string) {
    await this.quantityInput.fill(quantity);
  }

  /**
   * Fill refills allowed
   */
  async fillRefillsAllowed(refills: string) {
    await this.refillsAllowedInput.fill(refills);
  }

  /**
   * Fill refill date
   */
  async fillRefillDate(date: string) {
    await this.refillDateInput.fill(date);
  }

  /**
   * Fill instructions
   */
  async fillInstructions(instructions: string) {
    await this.instructionsInput.fill(instructions);
  }

  /**
   * Check allergies checkbox
   */
  async checkAllergies() {
    const isChecked = await this.allergiesCheckbox.isChecked();
    if (!isChecked) {
      await this.allergiesCheckbox.click();
    }
  }

  /**
   * Check interactions checkbox
   */
  async checkInteractions() {
    const isChecked = await this.interactionsCheckbox.isChecked();
    if (!isChecked) {
      await this.interactionsCheckbox.click();
    }
  }

  /**
   * Submit prescription form
   */
  async submitPrescription() {
    if (await this.submitButton.isVisible()) {
      await this.submitButton.click();
    } else {
      await this.saveButton.click();
    }
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Create prescription with full details
   */
  async createPrescription(data: {
    patient: string;
    medication: string;
    dosage: string;
    frequency: string;
    duration?: string;
    startDate?: string;
    endDate?: string;
    quantity?: string;
    refills?: string;
    instructions?: string;
    checkAllergies?: boolean;
    checkInteractions?: boolean;
  }) {
    await this.clickCreateNew();
    await this.searchPatient(data.patient);
    await this.fillMedication(data.medication);
    await this.fillDosage(data.dosage);
    await this.selectFrequency(data.frequency);

    if (data.duration) {
      await this.fillDuration(data.duration);
    }
    if (data.startDate) {
      await this.fillStartDate(data.startDate);
    }
    if (data.endDate) {
      await this.fillEndDate(data.endDate);
    }
    if (data.quantity) {
      await this.fillQuantity(data.quantity);
    }
    if (data.refills) {
      await this.fillRefillsAllowed(data.refills);
    }
    if (data.instructions) {
      await this.fillInstructions(data.instructions);
    }
    if (data.checkAllergies) {
      await this.checkAllergies();
    }
    if (data.checkInteractions) {
      await this.checkInteractions();
    }

    await this.submitPrescription();
  }

  /**
   * Click on first prescription in list
   */
  async clickFirstPrescription() {
    await this.prescriptionItem.first().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click on prescription by patient name
   */
  async clickPrescriptionByPatient(patientName: string) {
    const prescription = this.page.locator(`[data-testid="prescription-item"]:has-text("${patientName}"), .prescription-item:has-text("${patientName}")`).first();
    await prescription.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Approve prescription
   */
  async approvePrescription(reason?: string) {
    await this.approveButton.click();
    await this.page.waitForLoadState('networkidle');

    if (reason && (await this.reasonInput.isVisible())) {
      await this.reasonInput.fill(reason);
      await this.confirmButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Reject prescription
   */
  async rejectPrescription(reason: string) {
    await this.rejectButton.click();
    await this.page.waitForLoadState('networkidle');

    if (await this.reasonInput.isVisible()) {
      await this.reasonInput.fill(reason);
    }

    if (await this.confirmButton.isVisible()) {
      await this.confirmButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Request refill
   */
  async requestRefill(quantity?: string) {
    await this.refillButton.click();
    await this.page.waitForLoadState('networkidle');

    if (quantity && (await this.quantityInput.isVisible())) {
      await this.quantityInput.clear();
      await this.quantityInput.fill(quantity);
    }

    if (await this.submitButton.isVisible()) {
      await this.submitButton.click();
    } else if (await this.confirmButton.isVisible()) {
      await this.confirmButton.click();
    }
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Renew prescription
   */
  async renewPrescription(duration?: string) {
    await this.renewButton.click();
    await this.page.waitForLoadState('networkidle');

    if (duration && (await this.durationInput.isVisible())) {
      await this.durationInput.fill(duration);
    }

    if (await this.submitButton.isVisible()) {
      await this.submitButton.click();
    } else if (await this.confirmButton.isVisible()) {
      await this.confirmButton.click();
    }
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get prescription status
   */
  async getPrescriptionStatus(): Promise<string> {
    return await this.prescriptionStatus.textContent() || '';
  }

  /**
   * Get medication name
   */
  async getMedicationName(): Promise<string> {
    return await this.medicationName.textContent() || '';
  }

  /**
   * Check if allergy warning is visible
   */
  async hasAllergyWarning(): Promise<boolean> {
    return await this.allergyWarning.isVisible().catch(() => false);
  }

  /**
   * Check if interaction warning is visible
   */
  async hasInteractionWarning(): Promise<boolean> {
    return await this.interactionWarning.isVisible().catch(() => false);
  }

  /**
   * Get success message
   */
  async getSuccessMessage(): Promise<string> {
    await this.successMessage.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    return await this.successMessage.textContent().catch(() => '');
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent().catch(() => '');
  }

  /**
   * Filter prescriptions by status
   */
  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Search prescriptions
   */
  async searchPrescriptions(searchTerm: string) {
    await this.searchInput.fill(searchTerm);
    await this.searchInput.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get prescription count
   */
  async getPrescriptionCount(): Promise<number> {
    return await this.prescriptionItem.count();
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
   * Wait for error message
   */
  async waitForError(timeout: number = 5000): Promise<boolean> {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if prescription details panel is visible
   */
  async isDetailsVisible(): Promise<boolean> {
    return await this.prescriptionDetails.isVisible().catch(() => false);
  }

  /**
   * Get patient info from details panel
   */
  async getPatientInfo(): Promise<string> {
    return await this.patientInfo.textContent() || '';
  }

  /**
   * Clear all filters
   */
  async clearAllFilters() {
    if (await this.clearFiltersButton.isVisible()) {
      await this.clearFiltersButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Edit prescription
   */
  async editPrescription(updates: Partial<{
    medication: string;
    dosage: string;
    frequency: string;
    quantity: string;
    instructions: string;
  }>) {
    await this.editButton.click();
    await this.page.waitForLoadState('networkidle');

    if (updates.medication) {
      await this.medicationInput.clear();
      await this.medicationInput.fill(updates.medication);
    }
    if (updates.dosage) {
      await this.dosageInput.clear();
      await this.dosageInput.fill(updates.dosage);
    }
    if (updates.frequency) {
      await this.frequencySelect.selectOption(updates.frequency);
    }
    if (updates.quantity) {
      await this.quantityInput.clear();
      await this.quantityInput.fill(updates.quantity);
    }
    if (updates.instructions) {
      await this.instructionsInput.clear();
      await this.instructionsInput.fill(updates.instructions);
    }

    await this.submitPrescription();
  }

  /**
   * Download prescription document
   */
  async downloadPrescription() {
    await this.downloadButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Print prescription
   */
  async printPrescription() {
    await this.printButton.click();
    // Print dialogs don't wait for networkidle
    await this.page.waitForTimeout(1000);
  }
}
