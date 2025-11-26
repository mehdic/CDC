import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Nurse Page Object
 *
 * Encapsulates interactions with nurse-specific features including:
 * - Patient medication ordering
 * - Pharmacy patient record access
 * - Delivery tracking for nurses
 * - Nurse-pharmacist messaging
 */
export class NursePage extends BasePage {
  readonly pageTitle: Locator;
  readonly patientSearchInput: Locator;
  readonly patientList: Locator;
  readonly selectPatientButton: Locator;
  readonly medicationList: Locator;
  readonly orderMedicationButton: Locator;
  readonly patientRecordsTab: Locator;
  readonly medicationHistoryTab: Locator;
  readonly deliveryTrackingButton: Locator;
  readonly messagingButton: Locator;
  readonly urgentCheckbox: Locator;
  readonly deliveryTimeInput: Locator;
  readonly submitOrderButton: Locator;
  readonly messageInput: Locator;
  readonly sendMessageButton: Locator;
  readonly conversationList: Locator;
  readonly activeOrdersTab: Locator;
  readonly deliveryTrackingMap: Locator;
  readonly pharmacistRecordsButton: Locator;

  constructor(page: Page) {
    super(page);

    // Common elements
    this.pageTitle = page.getByRole('heading', { name: /infirmier|nurse|medication|patient/i });
    this.patientSearchInput = page.locator('[data-testid="patient-search-input"]');
    this.patientList = page.locator('[data-testid="patient-list"]');
    this.selectPatientButton = page.getByRole('button', { name: /sélectionner|select patient/i });

    // Medication related
    this.medicationList = page.locator('[data-testid="medication-list"]');
    this.orderMedicationButton = page.getByRole('button', { name: /commander|order medication|ajouter/i });
    this.urgentCheckbox = page.locator('[data-testid="urgent-checkbox"]');
    this.deliveryTimeInput = page.locator('[data-testid="delivery-time-input"]');
    this.submitOrderButton = page.getByRole('button', { name: /confirmer|submit|place order/i });

    // Records and history
    this.patientRecordsTab = page.getByRole('tab', { name: /dossier|records|pharmacy records/i });
    this.medicationHistoryTab = page.getByRole('tab', { name: /historique|history|ordonnances/i });
    this.pharmacistRecordsButton = page.getByRole('button', { name: /dossier pharmacie|pharmacy records/i });

    // Delivery tracking
    this.activeOrdersTab = page.getByRole('tab', { name: /en cours|active|active orders/i });
    this.deliveryTrackingButton = page.getByRole('button', { name: /suivi|track|tracking/i });
    this.deliveryTrackingMap = page.locator('[data-testid="delivery-tracking-map"]');

    // Messaging
    this.messagingButton = page.getByRole('button', { name: /messagerie|messaging|message/i });
    this.conversationList = page.locator('[data-testid="conversation-list"]');
    this.messageInput = page.locator('[data-testid="message-input"]');
    this.sendMessageButton = page.getByRole('button', { name: /envoyer|send/i });
  }

  /**
   * Navigate to nurse dashboard
   */
  async goto(): Promise<void> {
    await this.page.goto('/nurse/dashboard');
    await this.expectPageLoaded();
  }

  /**
   * Search for a patient by name or ID
   */
  async searchPatient(patientSearchTerm: string): Promise<void> {
    await this.patientSearchInput.fill(patientSearchTerm);
    await this.page.waitForLoadState('networkidle');
    await expect(this.patientList).toBeVisible();
  }

  /**
   * Select a patient from the list
   */
  async selectPatient(patientId: string): Promise<void> {
    await this.page.locator(`[data-testid="patient-${patientId}"]`).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * View patient's current medications
   */
  async viewPatientMedications(): Promise<void> {
    await this.page.getByRole('button', { name: /médicaments|medications|current|active/i }).click();
    await expect(this.medicationList).toBeVisible();
  }

  /**
   * Order medication for a patient
   */
  async orderMedication(medicationData: {
    medicationId: string;
    quantity?: number;
    urgent?: boolean;
    deliveryTime?: string;
    notes?: string;
  }): Promise<void> {
    // Select medication
    await this.page.locator(`[data-testid="medication-${medicationData.medicationId}"]`).click();

    // Set quantity if specified
    if (medicationData.quantity) {
      const quantityInput = this.page.locator('[data-testid="quantity-input"]');
      await quantityInput.fill(medicationData.quantity.toString());
    }

    // Mark as urgent if needed
    if (medicationData.urgent) {
      await this.urgentCheckbox.check();

      // Set delivery time for urgent orders
      if (medicationData.deliveryTime) {
        await this.deliveryTimeInput.fill(medicationData.deliveryTime);
      }
    }

    // Add notes if provided
    if (medicationData.notes) {
      const notesInput = this.page.locator('[data-testid="order-notes-input"]');
      await notesInput.fill(medicationData.notes);
    }

    // Submit order
    await this.submitOrderButton.click();
    await expect(this.page.locator('[data-testid="order-success-toast"]')).toBeVisible();
  }

  /**
   * Access pharmacy patient records
   */
  async accessPharmacyPatientRecords(): Promise<void> {
    await this.pharmacistRecordsButton.click();
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.locator('[data-testid="pharmacy-records-view"]')).toBeVisible();
  }

  /**
   * View patient medication history
   */
  async viewMedicationHistory(): Promise<void> {
    await this.medicationHistoryTab.click();
    await expect(this.medicationList).toBeVisible();
  }

  /**
   * View active medication orders
   */
  async viewActiveOrders(): Promise<void> {
    await this.activeOrdersTab.click();
    await expect(this.page.locator('[data-testid="active-orders-list"]')).toBeVisible();
  }

  /**
   * Track delivery of a medication order
   */
  async trackDelivery(orderId: string): Promise<void> {
    await this.page.locator(`[data-testid="order-${orderId}"]`).click();
    await this.deliveryTrackingButton.click();
    await expect(this.deliveryTrackingMap).toBeVisible();
  }

  /**
   * View delivery status
   */
  async viewDeliveryStatus(orderId: string): Promise<void> {
    const orderElement = this.page.locator(`[data-testid="order-${orderId}"]`);
    const statusElement = orderElement.locator('[data-testid="status"]');
    await expect(statusElement).toBeVisible();
  }

  /**
   * Open messaging for nurse-pharmacist communication
   */
  async openMessaging(): Promise<void> {
    await this.messagingButton.click();
    await expect(this.conversationList).toBeVisible();
  }

  /**
   * Send message to pharmacist
   */
  async sendMessageToPharmacist(pharmacistId: string, message: string): Promise<void> {
    // Select pharmacist conversation
    const conversation = this.page.locator(`[data-testid="conversation-${pharmacistId}"]`);
    await conversation.click();

    // Type and send message
    await this.messageInput.fill(message);
    await this.sendMessageButton.click();

    // Verify message was sent
    await expect(this.page.locator(`[data-testid="message-sent"]`)).toBeVisible();
  }

  /**
   * Request order clarification from pharmacist
   */
  async requestOrderClarification(orderId: string, clarificationMessage: string): Promise<void> {
    await this.page.locator(`[data-testid="order-${orderId}"]`).click();
    const clarifyButton = this.page.getByRole('button', { name: /clarifier|clarify|question/i });
    await clarifyButton.click();

    const clarificationInput = this.page.locator('[data-testid="clarification-input"]');
    await clarificationInput.fill(clarificationMessage);

    await this.page.getByRole('button', { name: /envoyer|send/i }).click();
    await expect(this.page.locator('[data-testid="clarification-sent"]')).toBeVisible();
  }

  /**
   * Verify patient order validity
   */
  async verifyOrderValidity(orderId: string): Promise<void> {
    const orderElement = this.page.locator(`[data-testid="order-${orderId}"]`);
    const validityStatus = orderElement.locator('[data-testid="prescription-validity"]');
    await expect(validityStatus).toBeVisible();
  }

  /**
   * Export order as PDF
   */
  async exportOrderToPDF(orderId: string): Promise<void> {
    await this.page.locator(`[data-testid="order-${orderId}"]`).click();
    const exportButton = this.page.getByRole('button', { name: /exporter|export|pdf/i });
    await exportButton.click();
    await this.page.waitForEvent('download');
  }

  /**
   * View order archive
   */
  async viewOrderArchive(): Promise<void> {
    const archiveButton = this.page.getByRole('button', { name: /archives|archived|historique/i });
    await archiveButton.click();
    await expect(this.page.locator('[data-testid="archive-list"]')).toBeVisible();
  }

  /**
   * Verify page is loaded
   */
  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.patientSearchInput).toBeVisible();
  }

  /**
   * Verify patient is selected
   */
  async expectPatientSelected(patientId: string): Promise<void> {
    await expect(this.page.locator(`[data-testid="patient-${patientId}-selected"]`)).toBeVisible();
  }

  /**
   * Verify medication in list
   */
  async expectMedicationInList(medicationId: string): Promise<void> {
    await expect(this.page.locator(`[data-testid="medication-${medicationId}"]`)).toBeVisible();
  }

  /**
   * Verify order created
   */
  async expectOrderCreated(orderId: string): Promise<void> {
    await expect(this.page.locator(`[data-testid="order-${orderId}"]`)).toBeVisible();
  }

  /**
   * Verify message received
   */
  async expectMessageReceived(messageContent: string): Promise<void> {
    await expect(this.page.locator(`text=${messageContent}`)).toBeVisible();
  }

  /**
   * Get current patient name
   */
  async getCurrentPatientName(): Promise<string> {
    return await this.page
      .locator('[data-testid="current-patient-name"]')
      .textContent() || '';
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId: string): Promise<string> {
    return await this.page
      .locator(`[data-testid="order-${orderId}"] [data-testid="status"]`)
      .textContent() || '';
  }

  /**
   * Get delivery ETA
   */
  async getDeliveryETA(orderId: string): Promise<string> {
    return await this.page
      .locator(`[data-testid="order-${orderId}"] [data-testid="eta"]`)
      .textContent() || '';
  }
}
