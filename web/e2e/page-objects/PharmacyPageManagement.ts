import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Pharmacy Page Management Object
 *
 * Encapsulates interactions with pharmacy page management features.
 */
export class PharmacyPageManagement extends BasePage {
  readonly pageTitle: Locator;
  readonly editInfoButton: Locator;
  readonly uploadPhotoButton: Locator;
  readonly hoursSection: Locator;
  readonly deliveryZonesSection: Locator;
  readonly productCatalogSection: Locator;
  readonly publishButton: Locator;
  readonly unpublishButton: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.getByRole('heading', { name: /page pharmacie|pharmacy page/i });
    this.editInfoButton = page.getByRole('button', { name: /modifier info|edit info/i });
    this.uploadPhotoButton = page.getByRole('button', { name: /télécharger photo|upload photo/i });
    this.hoursSection = page.locator('[data-testid="operating-hours"]');
    this.deliveryZonesSection = page.locator('[data-testid="delivery-zones"]');
    this.productCatalogSection = page.locator('[data-testid="product-catalog"]');
    this.publishButton = page.getByRole('button', { name: /publier|publish/i });
    this.unpublishButton = page.getByRole('button', { name: /dépublier|unpublish/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/pharmacy/manage');
    await this.expectPageLoaded();
  }

  async updatePharmacyInfo(info: {
    name?: string;
    description?: string;
    phone?: string;
    address?: string;
  }): Promise<void> {
    await this.editInfoButton.click();

    if (info.name) {
      await this.page.getByLabel(/nom|name/i).fill(info.name);
    }
    if (info.description) {
      await this.page.getByLabel(/description/i).fill(info.description);
    }
    if (info.phone) {
      await this.page.getByLabel(/téléphone|phone/i).fill(info.phone);
    }
    if (info.address) {
      await this.page.getByLabel(/adresse|address/i).fill(info.address);
    }

    await this.page.getByRole('button', { name: /enregistrer|save/i }).click();
    await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();
  }

  async uploadPhotos(filePaths: string[]): Promise<void> {
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePaths);
    await this.waitForResponse(/photos\/upload/);
    await expect(this.page.locator('[data-testid="upload-success"]')).toBeVisible();
  }

  async setOperatingHours(hours: {
    day: string;
    open: string;
    close: string;
  }[]): Promise<void> {
    await this.hoursSection.click();

    for (const hour of hours) {
      const dayLocator = this.page.locator(`[data-testid="hours-${hour.day}"]`);
      await dayLocator.getByLabel(/ouverture|open/i).fill(hour.open);
      await dayLocator.getByLabel(/fermeture|close/i).fill(hour.close);
    }

    await this.page.getByRole('button', { name: /enregistrer|save/i }).click();
    await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();
  }

  async configureDeliveryZones(zones: { postalCode: string; enabled: boolean }[]): Promise<void> {
    await this.deliveryZonesSection.click();

    for (const zone of zones) {
      await this.page.getByLabel(/code postal|postal code/i).fill(zone.postalCode);
      await this.page.getByRole('button', { name: /ajouter|add/i }).click();

      if (!zone.enabled) {
        await this.page.locator(`[data-testid="zone-${zone.postalCode}"]`).locator('input[type="checkbox"]').uncheck();
      }
    }

    await this.page.getByRole('button', { name: /enregistrer|save/i }).click();
    await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();
  }

  async manageProductCatalog(action: 'add' | 'remove', productId: string): Promise<void> {
    await this.productCatalogSection.click();

    if (action === 'add') {
      await this.page.getByRole('button', { name: /ajouter produit|add product/i }).click();
      await this.page.locator(`[data-testid="product-${productId}"]`).click();
    } else {
      await this.page.locator(`[data-testid="catalog-product-${productId}"]`).locator('[data-testid="remove-button"]').click();
    }

    await this.page.getByRole('button', { name: /enregistrer|save/i }).click();
    await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();
  }

  async publishPharmacyPage(): Promise<void> {
    await this.publishButton.click();
    await this.page.getByRole('button', { name: /confirmer|confirm/i }).click();
    await expect(this.page.locator('[data-testid="published-confirmation"]')).toBeVisible();
  }

  async unpublishPharmacyPage(): Promise<void> {
    await this.unpublishButton.click();
    await this.page.getByRole('button', { name: /confirmer|confirm/i }).click();
    await expect(this.page.locator('[data-testid="unpublished-confirmation"]')).toBeVisible();
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
  }

  async expectPublished(): Promise<void> {
    await expect(this.page.locator('[data-testid="published-badge"]')).toBeVisible();
  }

  async expectUnpublished(): Promise<void> {
    await expect(this.page.locator('[data-testid="unpublished-badge"]')).toBeVisible();
  }
}
