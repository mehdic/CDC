import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Delivery Management Page Object
 *
 * Encapsulates interactions with delivery management features.
 */
export class DeliveryPage extends BasePage {
  readonly pageTitle: Locator;
  readonly createDeliveryButton: Locator;
  readonly deliveryList: Locator;
  readonly activeTab: Locator;
  readonly completedTab: Locator;
  readonly mapView: Locator;
  readonly assignButton: Locator;
  readonly trackingMap: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.getByRole('heading', { name: /livraisons|delivery management|deliveries/i });
    this.createDeliveryButton = page.getByRole('button', { name: /créer livraison|create delivery/i });
    this.deliveryList = page.locator('[data-testid="delivery-list"]');
    this.activeTab = page.getByRole('tab', { name: /en cours|active/i });
    this.completedTab = page.getByRole('tab', { name: /terminées|completed/i });
    this.mapView = page.locator('[data-testid="map-view"]');
    this.assignButton = page.getByRole('button', { name: /assigner|assign/i });
    this.trackingMap = page.locator('[data-testid="tracking-map"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/deliveries');
    await this.expectPageLoaded();
  }

  async createDelivery(deliveryData: {
    patientName: string;
    address: string;
    prescriptionId: string;
    specialHandling?: boolean;
  }): Promise<void> {
    await this.createDeliveryButton.click();

    await this.page.getByLabel(/patient/i).fill(deliveryData.patientName);
    await this.page.getByLabel(/adresse|address/i).fill(deliveryData.address);
    await this.page.getByLabel(/ordonnance|prescription/i).fill(deliveryData.prescriptionId);

    if (deliveryData.specialHandling) {
      await this.page.locator('[data-testid="special-handling-checkbox"]').check();
    }

    await this.page.getByRole('button', { name: /créer|create/i }).click();
    await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();
  }

  async assignDeliveryPersonnel(deliveryId: string, personnelId: string): Promise<void> {
    await this.page.locator(`[data-testid="delivery-${deliveryId}"]`).click();
    await this.assignButton.click();

    await this.page.locator(`[data-testid="personnel-${personnelId}"]`).click();
    await this.page.getByRole('button', { name: /confirmer|confirm/i }).click();

    await expect(this.page.locator('[data-testid="assignment-confirmed"]')).toBeVisible();
  }

  async trackDelivery(deliveryId: string): Promise<void> {
    await this.page.locator(`[data-testid="delivery-${deliveryId}"]`).click();
    await this.page.getByRole('button', { name: /suivre|track/i }).click();
    await expect(this.trackingMap).toBeVisible();
  }

  async verifyQRCode(deliveryId: string): Promise<void> {
    await this.page.locator(`[data-testid="delivery-${deliveryId}"]`).click();
    await expect(this.page.locator('[data-testid="qr-code"]')).toBeVisible();
  }

  async viewDeliveryHistory(): Promise<void> {
    await this.completedTab.click();
    await expect(this.deliveryList).toBeVisible();
  }

  async viewActiveDeliveries(): Promise<void> {
    await this.activeTab.click();
    await expect(this.deliveryList).toBeVisible();
  }

  async generateDeliveryReport(dateRange: { start: string; end: string }): Promise<void> {
    await this.page.getByRole('button', { name: /rapports|reports/i }).click();
    await this.page.getByLabel(/date de début|start date/i).fill(dateRange.start);
    await this.page.getByLabel(/date de fin|end date/i).fill(dateRange.end);
    await this.page.getByRole('button', { name: /générer|generate/i }).click();
    await expect(this.page.locator('[data-testid="report-viewer"]')).toBeVisible();
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.deliveryList).toBeVisible();
  }

  async expectDeliveryInList(deliveryId: string): Promise<void> {
    await expect(this.page.locator(`[data-testid="delivery-${deliveryId}"]`)).toBeVisible();
  }

  async expectDeliveryStatus(deliveryId: string, status: string): Promise<void> {
    const deliveryElement = this.page.locator(`[data-testid="delivery-${deliveryId}"]`);
    await expect(deliveryElement.locator('[data-testid="status"]')).toContainText(status);
  }
}
