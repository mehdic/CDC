import { Page, Locator } from '@playwright/test';

/**
 * Appointment Page Object
 * Handles appointment booking and management flows
 */

export class AppointmentPage {
  readonly page: Page;
  readonly bookButton: Locator;
  readonly appointmentList: Locator;
  readonly dateInput: Locator;
  readonly timeInput: Locator;
  readonly typeSelect: Locator;
  readonly reasonInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly confirmDialog: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly appointmentCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.bookButton = page.locator('button:has-text("Book"), button:has-text("Schedule")');
    this.appointmentList = page.locator('[data-testid="appointments-list"], .appointments-container');
    this.dateInput = page.locator('input[type="date"], input[placeholder*="date"]');
    this.timeInput = page.locator('input[type="time"], input[placeholder*="time"]');
    this.typeSelect = page.locator('select[name*="type"], [data-testid="appointment-type"]');
    this.reasonInput = page.locator('textarea[placeholder*="reason"], input[placeholder*="reason"]');
    this.submitButton = page.locator('button:has-text("Confirm"), button[type="submit"]:has-text("Book")');
    this.cancelButton = page.locator('button:has-text("Cancel")');
    this.confirmDialog = page.locator('[role="dialog"], .modal');
    this.successMessage = page.locator('[data-testid="success-message"], .alert-success');
    this.errorMessage = page.locator('[data-testid="error-message"], .alert-danger');
    this.appointmentCard = page.locator('[data-testid="appointment-card"], .appointment-item');
  }

  /**
   * Navigate to appointments page
   */
  async goto() {
    await this.page.goto('/appointments');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click book appointment button
   */
  async clickBook() {
    await this.bookButton.first().click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill appointment form
   */
  async fillForm(data: {
    date: string;
    time: string;
    type?: string;
    reason: string;
  }) {
    await this.dateInput.fill(data.date);
    await this.timeInput.fill(data.time);

    if (data.type && (await this.typeSelect.isVisible())) {
      await this.typeSelect.selectOption(data.type);
    }

    if (await this.reasonInput.isVisible()) {
      await this.reasonInput.fill(data.reason);
    }
  }

  /**
   * Submit appointment form
   */
  async submitForm() {
    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Complete appointment booking
   */
  async bookAppointment(data: {
    date: string;
    time: string;
    type?: string;
    reason: string;
  }) {
    await this.clickBook();
    await this.fillForm(data);
    await this.submitForm();
  }

  /**
   * Check if booking was successful
   */
  async isBookingSuccessful(): Promise<boolean> {
    return await this.successMessage.isVisible();
  }

  /**
   * Get success message
   */
  async getSuccessMessage(): Promise<string> {
    return await this.successMessage.textContent() || '';
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Check if appointments are listed
   */
  async hasAppointments(): Promise<boolean> {
    const count = await this.appointmentCard.count();
    return count > 0;
  }

  /**
   * Cancel appointment by index
   */
  async cancelAppointmentByIndex(index: number) {
    const appointment = this.appointmentCard.nth(index);
    const cancelBtn = appointment.locator('button:has-text("Cancel")');
    await cancelBtn.click();

    if (await this.confirmDialog.isVisible()) {
      const confirmBtn = this.page.locator('button:has-text("Confirm")');
      await confirmBtn.click();
    }

    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get appointment count
   */
  async getAppointmentCount(): Promise<number> {
    return await this.appointmentCard.count();
  }
}
