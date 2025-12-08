import { Page, Locator } from '@playwright/test';

/**
 * Teleconsultation Page Object
 * Handles teleconsultation booking, video calls, and consultation workflow
 */

export class TeleconsultationPage {
  readonly page: Page;
  readonly bookButton: Locator;
  readonly pharmacistSelector: Locator;
  readonly dateTimePicker: Locator;
  readonly reasonInput: Locator;
  readonly submitButton: Locator;
  readonly upcomingConsultations: Locator;
  readonly joinCallButton: Locator;
  readonly videoContainer: Locator;
  readonly notesArea: Locator;
  readonly prescriptionButton: Locator;
  readonly endCallButton: Locator;
  readonly followUpButton: Locator;
  readonly consultationHistory: Locator;

  constructor(page: Page) {
    this.page = page;
    this.bookButton = page.locator('button:has-text("Book Consultation"), button:has-text("book")');
    this.pharmacistSelector = page.locator('select[name*="pharmacist"], [data-testid="pharmacist-selector"]');
    this.dateTimePicker = page.locator('input[type="datetime-local"], input[name*="date"]');
    this.reasonInput = page.locator('textarea[name*="reason"], input[name*="reason"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.upcomingConsultations = page.locator('[data-testid="upcoming-consultations"], .upcoming');
    this.joinCallButton = page.locator('button:has-text("Join Call"), button:has-text("join")');
    this.videoContainer = page.locator('[data-testid="video-container"], .video-call');
    this.notesArea = page.locator('textarea[name*="notes"], [data-testid="consultation-notes"]');
    this.prescriptionButton = page.locator('button:has-text("Create Prescription")');
    this.endCallButton = page.locator('button:has-text("End Call")');
    this.followUpButton = page.locator('button:has-text("Schedule Follow-up")');
    this.consultationHistory = page.locator('[data-testid="consultation-history"], .history');
  }

  async goto() {
    await this.page.goto('/patient/teleconsultation');
  }

  async gotoPharmacist() {
    await this.page.goto('/pharmacist/teleconsultation');
  }

  async bookConsultation(data: {
    pharmacistId?: string;
    date: string;
    reason: string;
  }) {
    const bookVisible = await this.bookButton.isVisible().catch(() => false);
    if (bookVisible) {
      await this.bookButton.click();
      await this.page.waitForLoadState('networkidle');

      if (data.pharmacistId) {
        const selectorVisible = await this.pharmacistSelector.isVisible().catch(() => false);
        if (selectorVisible) {
          await this.pharmacistSelector.selectOption(data.pharmacistId);
        }
      }

      await this.dateTimePicker.fill(data.date);
      await this.reasonInput.fill(data.reason);
      await this.submitButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async hasUpcomingConsultations(): Promise<boolean> {
    return await this.upcomingConsultations.isVisible().catch(() => false);
  }

  async joinCall() {
    const joinVisible = await this.joinCallButton.isVisible().catch(() => false);
    if (joinVisible) {
      await this.joinCallButton.click();
      // Wait for WebRTC to initialize (mocked in E2E)
      await this.page.waitForTimeout(1000);
    }
  }

  async isInCall(): Promise<boolean> {
    return await this.videoContainer.isVisible().catch(() => false);
  }

  async takeNotes(notes: string) {
    const notesVisible = await this.notesArea.isVisible().catch(() => false);
    if (notesVisible) {
      await this.notesArea.fill(notes);
    }
  }

  async createPrescriptionDuringCall() {
    const prescriptionVisible = await this.prescriptionButton.isVisible().catch(() => false);
    if (prescriptionVisible) {
      await this.prescriptionButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async endCall() {
    const endVisible = await this.endCallButton.isVisible().catch(() => false);
    if (endVisible) {
      await this.endCallButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async scheduleFollowUp(date: string) {
    const followUpVisible = await this.followUpButton.isVisible().catch(() => false);
    if (followUpVisible) {
      await this.followUpButton.click();
      await this.dateTimePicker.fill(date);
      await this.submitButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async hasConsultationHistory(): Promise<boolean> {
    return await this.consultationHistory.isVisible().catch(() => false);
  }
}
