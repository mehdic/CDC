import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Dashboard Page Object
 *
 * Encapsulates interactions with the pharmacist dashboard.
 */
export class DashboardPage extends BasePage {
  readonly pageTitle: Locator;
  readonly prescriptionsCard: Locator;
  readonly inventoryCard: Locator;
  readonly consultationsCard: Locator;
  readonly deliveriesCard: Locator;
  readonly revenueCard: Locator;
  readonly dateRangeFilter: Locator;
  readonly refreshButton: Locator;
  readonly navigationMenu: Locator;

  constructor(page: Page) {
    super(page);

    // Page elements
    this.pageTitle = page.getByRole('heading', { name: /tableau de bord|dashboard/i });

    // Dashboard cards
    this.prescriptionsCard = page.locator('[data-testid="prescriptions-card"]');
    this.inventoryCard = page.locator('[data-testid="inventory-card"]');
    this.consultationsCard = page.locator('[data-testid="consultations-card"]');
    this.deliveriesCard = page.locator('[data-testid="deliveries-card"]');
    this.revenueCard = page.locator('[data-testid="revenue-card"]');

    // Filters and actions
    this.dateRangeFilter = page.locator('[data-testid="date-range-filter"]');
    this.refreshButton = page.getByRole('button', { name: /actualiser|refresh/i });
    this.navigationMenu = page.locator('nav[role="navigation"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
    await this.expectPageLoaded();
  }

  async navigateToPrescriptions(): Promise<void> {
    await this.page.getByRole('link', { name: /ordonnances|prescriptions/i }).click();
    await this.waitForUrl(/prescriptions/);
  }

  async navigateToInventory(): Promise<void> {
    await this.page.getByRole('link', { name: /inventaire|inventory/i }).click();
    await this.waitForUrl(/inventory/);
  }

  async navigateToTeleconsultation(): Promise<void> {
    await this.page.getByRole('link', { name: /téléconsultation|teleconsultation/i }).click();
    await this.waitForUrl(/teleconsultation/);
  }

  async navigateToMessaging(): Promise<void> {
    await this.page.getByRole('link', { name: /messages|messaging/i }).click();
    await this.waitForUrl(/messages/);
  }

  async navigateToDelivery(): Promise<void> {
    await this.page.getByRole('link', { name: /livraisons|deliveries/i }).click();
    await this.waitForUrl(/deliveries/);
  }

  async filterByDateRange(startDate: string, endDate: string): Promise<void> {
    await this.dateRangeFilter.click();
    await this.page.getByLabel(/date de début|start date/i).fill(startDate);
    await this.page.getByLabel(/date de fin|end date/i).fill(endDate);
    await this.page.getByRole('button', { name: /appliquer|apply/i }).click();
  }

  async refreshDashboard(): Promise<void> {
    await this.refreshButton.click();
    await this.waitForNavigation();
  }

  async getPrescriptionsCount(): Promise<string> {
    return await this.prescriptionsCard.locator('[data-testid="count"]').textContent() || '0';
  }

  async getRevenueValue(): Promise<string> {
    return await this.revenueCard.locator('[data-testid="value"]').textContent() || '0';
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.navigationMenu).toBeVisible();
  }

  async expectDashboardCardsVisible(): Promise<void> {
    await expect(this.prescriptionsCard).toBeVisible();
    await expect(this.inventoryCard).toBeVisible();
    await expect(this.consultationsCard).toBeVisible();
  }
}
