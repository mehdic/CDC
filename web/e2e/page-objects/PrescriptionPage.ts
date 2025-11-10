import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Prescription Management Page Object
 *
 * Encapsulates interactions with prescription management features.
 */
export class PrescriptionPage extends BasePage {
  readonly pageTitle: Locator;
  readonly uploadButton: Locator;
  readonly scanButton: Locator;
  readonly prescriptionList: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;
  readonly newPrescriptionButton: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.getByRole('heading', { name: /ordonnances|prescriptions/i });
    this.uploadButton = page.getByRole('button', { name: /télécharger|upload/i });
    this.scanButton = page.getByRole('button', { name: /scanner|scan/i });
    this.prescriptionList = page.locator('[data-testid="prescription-list"]');
    this.searchInput = page.getByPlaceholder(/rechercher|search/i);
    this.filterDropdown = page.locator('[data-testid="status-filter"]');
    this.newPrescriptionButton = page.getByRole('button', { name: /nouvelle ordonnance|new prescription/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/prescriptions');
    await this.expectPageLoaded();
  }

  async uploadPrescription(filePath: string): Promise<void> {
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await this.waitForResponse(/prescriptions\/upload/);
  }

  async scanPrescription(): Promise<void> {
    await this.scanButton.click();
    // Wait for scanner modal to open
    await expect(this.page.locator('[data-testid="scanner-modal"]')).toBeVisible();
  }

  async searchPrescription(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.waitForResponse(/prescriptions/);
  }

  async filterByStatus(status: 'pending' | 'approved' | 'rejected' | 'all'): Promise<void> {
    await this.filterDropdown.click();
    await this.page.getByRole('option', { name: new RegExp(status, 'i') }).click();
    await this.waitForResponse(/prescriptions/);
  }

  async selectPrescription(prescriptionId: string): Promise<void> {
    await this.page.locator(`[data-testid="prescription-${prescriptionId}"]`).click();
  }

  async approvePrescription(): Promise<void> {
    await this.page.getByRole('button', { name: /approuver|approve/i }).click();
    await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();
  }

  async rejectPrescription(reason: string): Promise<void> {
    await this.page.getByRole('button', { name: /rejeter|reject/i }).click();
    await this.page.getByLabel(/raison|reason/i).fill(reason);
    await this.page.getByRole('button', { name: /confirmer|confirm/i }).click();
    await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();
  }

  async viewPrescriptionDetails(prescriptionId: string): Promise<void> {
    await this.selectPrescription(prescriptionId);
    await expect(this.page.locator('[data-testid="prescription-details"]')).toBeVisible();
  }

  async checkDrugInteractions(): Promise<void> {
    await this.page.getByRole('button', { name: /vérifier interactions|check interactions/i }).click();
    await expect(this.page.locator('[data-testid="interaction-results"]')).toBeVisible();
  }

  async checkAllergies(): Promise<void> {
    await this.page.getByRole('button', { name: /vérifier allergies|check allergies/i }).click();
    await expect(this.page.locator('[data-testid="allergy-results"]')).toBeVisible();
  }

  async generateLabel(): Promise<void> {
    await this.page.getByRole('button', { name: /générer étiquette|generate label/i }).click();
    await expect(this.page.locator('[data-testid="label-preview"]')).toBeVisible();
  }

  async viewHistory(): Promise<void> {
    await this.page.getByRole('button', { name: /historique|history/i }).click();
    await expect(this.page.locator('[data-testid="prescription-history"]')).toBeVisible();
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.prescriptionList).toBeVisible();
  }

  async expectPrescriptionInList(prescriptionId: string): Promise<void> {
    await expect(this.page.locator(`[data-testid="prescription-${prescriptionId}"]`)).toBeVisible();
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.page.locator('[data-testid="empty-state"]')).toBeVisible();
  }
}
