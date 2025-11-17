import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Inventory Management Page Object
 *
 * Encapsulates interactions with inventory management features.
 */
export class InventoryPage extends BasePage {
  readonly pageTitle: Locator;
  readonly scanQRButton: Locator;
  readonly addItemButton: Locator;
  readonly inventoryList: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;
  readonly lowStockAlert: Locator;
  readonly expiryAlert: Locator;
  readonly reorderSuggestions: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.getByRole('heading', { name: /inventaire|inventory management/i });
    this.scanQRButton = page.getByRole('button', { name: /scanner qr|scan qr/i });
    this.addItemButton = page.getByRole('button', { name: /ajouter|add item/i });
    this.inventoryList = page.locator('[data-testid="inventory-list"]');
    this.searchInput = page.getByPlaceholder(/rechercher|search/i);
    this.filterDropdown = page.locator('[data-testid="category-filter"]');
    this.lowStockAlert = page.locator('[data-testid="low-stock-alert"]');
    this.expiryAlert = page.locator('[data-testid="expiry-alert"]');
    this.reorderSuggestions = page.locator('[data-testid="reorder-suggestions"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/inventory');
    await this.expectPageLoaded();
  }

  async scanQRCode(qrData: string): Promise<void> {
    await this.scanQRButton.click();

    // Mock QR scanner - in real implementation this would use camera
    await this.page.evaluate((data) => {
      window.dispatchEvent(new CustomEvent('qr-scanned', { detail: data }));
    }, qrData);

    await expect(this.page.locator('[data-testid="scan-success"]')).toBeVisible();
  }

  async addInventoryItem(itemData: {
    name: string;
    sku: string;
    quantity: number;
    price: number;
    category: string;
    expiryDate: string;
  }): Promise<void> {
    await this.addItemButton.click();

    await this.page.getByLabel(/nom|name/i).fill(itemData.name);
    await this.page.getByLabel(/sku|référence/i).fill(itemData.sku);
    await this.page.getByLabel(/quantité|quantity/i).fill(itemData.quantity.toString());
    await this.page.getByLabel(/prix|price/i).fill(itemData.price.toString());
    await this.page.getByLabel(/catégorie|category/i).fill(itemData.category);
    await this.page.getByLabel(/date d'expiration|expiry date/i).fill(itemData.expiryDate);

    await this.page.getByRole('button', { name: /enregistrer|save/i }).click();
    await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();
  }

  async updateStockLevel(itemId: string, newQuantity: number): Promise<void> {
    await this.page.locator(`[data-testid="item-${itemId}"]`).click();
    await this.page.getByLabel(/quantité|quantity/i).fill(newQuantity.toString());
    await this.page.getByRole('button', { name: /mettre à jour|update/i }).click();
    await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();
  }

  async searchInventory(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.waitForResponse(/inventory/);
  }

  async filterByCategory(category: string): Promise<void> {
    await this.filterDropdown.click();
    await this.page.getByRole('option', { name: new RegExp(category, 'i') }).click();
    await this.waitForResponse(/inventory/);
  }

  async viewLowStockItems(): Promise<void> {
    await this.lowStockAlert.click();
    await expect(this.page.locator('[data-testid="low-stock-list"]')).toBeVisible();
  }

  async viewExpiringItems(): Promise<void> {
    await this.expiryAlert.click();
    await expect(this.page.locator('[data-testid="expiring-items-list"]')).toBeVisible();
  }

  async viewReorderSuggestions(): Promise<void> {
    await this.reorderSuggestions.click();
    await expect(this.page.locator('[data-testid="reorder-list"]')).toBeVisible();
  }

  async generateInventoryReport(reportType: 'stock' | 'expiry' | 'sales'): Promise<void> {
    await this.page.getByRole('button', { name: /rapports|reports/i }).click();
    await this.page.getByRole('option', { name: new RegExp(reportType, 'i') }).click();
    await expect(this.page.locator('[data-testid="report-viewer"]')).toBeVisible();
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.inventoryList).toBeVisible();
  }

  async expectItemInList(itemId: string): Promise<void> {
    await expect(this.page.locator(`[data-testid="item-${itemId}"]`)).toBeVisible();
  }

  async expectLowStockAlert(): Promise<void> {
    await expect(this.lowStockAlert).toBeVisible();
  }

  async expectExpiryAlert(): Promise<void> {
    await expect(this.expiryAlert).toBeVisible();
  }
}
