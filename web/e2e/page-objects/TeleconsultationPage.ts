import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Teleconsultation Page Object
 *
 * Encapsulates interactions with teleconsultation features.
 */
export class TeleconsultationPage extends BasePage {
  readonly pageTitle: Locator;
  readonly bookButton: Locator;
  readonly consultationList: Locator;
  readonly upcomingTab: Locator;
  readonly pastTab: Locator;
  readonly videoContainer: Locator;
  readonly joinButton: Locator;
  readonly endCallButton: Locator;
  readonly chatPanel: Locator;
  readonly sendPrescriptionButton: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.getByRole('heading', { name: /téléconsultation|teleconsultation/i });
    this.bookButton = page.getByRole('button', { name: /réserver|book/i });
    this.consultationList = page.locator('[data-testid="consultation-list"]');
    this.upcomingTab = page.getByRole('tab', { name: /à venir|upcoming/i });
    this.pastTab = page.getByRole('tab', { name: /passées|past/i });
    this.videoContainer = page.locator('[data-testid="video-container"]');
    this.joinButton = page.getByRole('button', { name: /rejoindre|join/i });
    this.endCallButton = page.getByRole('button', { name: /terminer|end call/i });
    this.chatPanel = page.locator('[data-testid="chat-panel"]');
    this.sendPrescriptionButton = page.getByRole('button', { name: /envoyer ordonnance|send prescription/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/teleconsultation');
    await this.expectPageLoaded();
  }

  async bookConsultation(patientName: string, dateTime: string): Promise<void> {
    await this.bookButton.click();
    await this.page.getByLabel(/patient/i).fill(patientName);
    await this.page.getByLabel(/date et heure|date and time/i).fill(dateTime);
    await this.page.getByRole('button', { name: /confirmer|confirm/i }).click();
    await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();
  }

  async joinConsultation(consultationId: string): Promise<void> {
    await this.page.locator(`[data-testid="consultation-${consultationId}"]`).locator(this.joinButton).click();
    await expect(this.videoContainer).toBeVisible({ timeout: 10000 });
  }

  async endConsultation(): Promise<void> {
    await this.endCallButton.click();
    await this.page.getByRole('button', { name: /confirmer|confirm/i }).click();
    await expect(this.videoContainer).toBeHidden();
  }

  async sendMessageInConsultation(message: string): Promise<void> {
    const chatInput = this.chatPanel.locator('input[type="text"]');
    await chatInput.fill(message);
    await chatInput.press('Enter');
  }

  async sendPrescriptionDuringConsultation(prescriptionId: string): Promise<void> {
    await this.sendPrescriptionButton.click();
    await this.page.locator(`[data-testid="prescription-${prescriptionId}"]`).click();
    await this.page.getByRole('button', { name: /envoyer|send/i }).click();
    await expect(this.page.locator('[data-testid="prescription-sent-confirmation"]')).toBeVisible();
  }

  async saveConsultationNotes(notes: string): Promise<void> {
    await this.page.getByLabel(/notes|remarques/i).fill(notes);
    await this.page.getByRole('button', { name: /enregistrer|save/i }).click();
    await expect(this.page.locator('[data-testid="notes-saved-confirmation"]')).toBeVisible();
  }

  async viewUpcomingConsultations(): Promise<void> {
    await this.upcomingTab.click();
    await expect(this.consultationList).toBeVisible();
  }

  async viewPastConsultations(): Promise<void> {
    await this.pastTab.click();
    await expect(this.consultationList).toBeVisible();
  }

  async verifyPatientConsent(): Promise<void> {
    await expect(this.page.locator('[data-testid="consent-checkbox"]')).toBeVisible();
    await this.page.locator('[data-testid="consent-checkbox"]').check();
  }

  async viewConsultationHistory(consultationId: string): Promise<void> {
    await this.page.locator(`[data-testid="consultation-${consultationId}"]`).click();
    await expect(this.page.locator('[data-testid="consultation-details"]')).toBeVisible();
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.consultationList).toBeVisible();
  }

  async expectConsultationInList(consultationId: string): Promise<void> {
    await expect(this.page.locator(`[data-testid="consultation-${consultationId}"]`)).toBeVisible();
  }

  async expectVideoCallActive(): Promise<void> {
    await expect(this.videoContainer).toBeVisible();
    await expect(this.endCallButton).toBeVisible();
  }
}
