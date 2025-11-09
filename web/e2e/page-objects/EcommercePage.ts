import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * E-commerce Integration Page Object
 *
 * Encapsulates interactions with e-commerce features.
 */
export class EcommercePage extends BasePage {
  readonly pageTitle: Locator;
  readonly productList: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly ordersList: Locator;
  readonly addToCartButton: Locator;
  readonly cartIcon: Locator;
  readonly salesReportButton: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.getByRole('heading', { name: /boutique|shop|e-commerce/i });
    this.productList = page.locator('[data-testid="product-list"]');
    this.searchInput = page.getByPlaceholder(/rechercher produits|search products/i);
    this.categoryFilter = page.locator('[data-testid="category-filter"]');
    this.ordersList = page.locator('[data-testid="orders-list"]');
    this.addToCartButton = page.getByRole('button', { name: /ajouter au panier|add to cart/i });
    this.cartIcon = page.locator('[data-testid="cart-icon"]');
    this.salesReportButton = page.getByRole('button', { name: /rapport ventes|sales report/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/ecommerce');
    await this.expectPageLoaded();
  }

  async browseOTCProducts(): Promise<void> {
    await this.categoryFilter.click();
    await this.page.getByRole('option', { name: /otc|sans ordonnance/i }).click();
    await expect(this.productList).toBeVisible();
  }

  async searchProduct(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.waitForResponse(/products/);
  }

  async addProductToPatientCart(productId: string, patientId: string, quantity: number = 1): Promise<void> {
    await this.page.locator(`[data-testid="product-${productId}"]`).click();
    await this.page.getByLabel(/patient/i).fill(patientId);
    await this.page.getByLabel(/quantité|quantity/i).fill(quantity.toString());
    await this.addToCartButton.click();
    await expect(this.page.locator('[data-testid="added-to-cart-toast"]')).toBeVisible();
  }

  async processOnlineOrder(orderId: string): Promise<void> {
    await this.page.locator(`[data-testid="order-${orderId}"]`).click();
    await this.page.getByRole('button', { name: /traiter|process/i }).click();
    await this.page.getByRole('button', { name: /confirmer|confirm/i }).click();
    await expect(this.page.locator('[data-testid="order-processed-toast"]')).toBeVisible();
  }

  async viewOnlineOrders(): Promise<void> {
    await this.page.getByRole('tab', { name: /commandes|orders/i }).click();
    await expect(this.ordersList).toBeVisible();
  }

  async manageProductInventory(productId: string, quantity: number): Promise<void> {
    await this.page.locator(`[data-testid="product-${productId}"]`).click();
    await this.page.getByRole('button', { name: /gérer stock|manage stock/i }).click();
    await this.page.getByLabel(/quantité|quantity/i).fill(quantity.toString());
    await this.page.getByRole('button', { name: /mettre à jour|update/i }).click();
    await expect(this.page.locator('[data-testid="success-toast"]')).toBeVisible();
  }

  async handleReturn(orderId: string, reason: string): Promise<void> {
    await this.page.locator(`[data-testid="order-${orderId}"]`).click();
    await this.page.getByRole('button', { name: /retourner|return/i }).click();
    await this.page.getByLabel(/raison|reason/i).fill(reason);
    await this.page.getByRole('button', { name: /confirmer retour|confirm return/i }).click();
    await expect(this.page.locator('[data-testid="return-processed-toast"]')).toBeVisible();
  }

  async processRefund(orderId: string): Promise<void> {
    await this.page.locator(`[data-testid="order-${orderId}"]`).click();
    await this.page.getByRole('button', { name: /rembourser|refund/i }).click();
    await this.page.getByRole('button', { name: /confirmer|confirm/i }).click();
    await expect(this.page.locator('[data-testid="refund-processed-toast"]')).toBeVisible();
  }

  async generateSalesReport(dateRange: { start: string; end: string }): Promise<void> {
    await this.salesReportButton.click();
    await this.page.getByLabel(/date de début|start date/i).fill(dateRange.start);
    await this.page.getByLabel(/date de fin|end date/i).fill(dateRange.end);
    await this.page.getByRole('button', { name: /générer|generate/i }).click();
    await expect(this.page.locator('[data-testid="report-viewer"]')).toBeVisible();
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.productList).toBeVisible();
  }

  async expectProductInList(productId: string): Promise<void> {
    await expect(this.page.locator(`[data-testid="product-${productId}"]`)).toBeVisible();
  }

  async expectOrderInList(orderId: string): Promise<void> {
    await expect(this.page.locator(`[data-testid="order-${orderId}"]`)).toBeVisible();
  }
}
